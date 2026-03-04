/**
 * PrivOTC - Privacy-Preserving OTC Trading Platform
 * Chainlink CRE Workflow
 * 
 * Combines World ID + ZK Proofs + Confidential Compute
 * for private, sybil-resistant peer-to-peer trading
 * 
 * Workflow Jobs:
 * 1. Trade Intake - Validates World ID + ZK balance proof, adds to orderbook
 * 2. Matching Engine - Finds matching buy/sell orders (confidential)
 * 3. Settlement - Executes matched trades on-chain
 */

import {
	type CronPayload,
	cre,
	encodeCallMsg,
	EVMClient,
	getNetwork,
	LATEST_BLOCK_NUMBER,
	Runner,
	type Runtime,
} from '@chainlink/cre-sdk';
import { type Address, encodeFunctionData, Hex, zeroAddress } from 'viem';
import { z } from 'zod';
import { groth16 } from 'snarkjs';
import * as fs from 'fs';
import * as path from 'path';

// ===== Configuration Schema =====

const configSchema = z.object({
	schedule: z.string(), // Cron schedule for matching engine
	worldIdAppId: z.string(),
	worldIdAction: z.string(),
	zkVerificationKeyPath: z.string(),
	otcSettlementAddress: z.string(),
	proofVerifierAddress: z.string(),
	tokenPairs: z.array(z.string()), // e.g., ["ETH/USDC", "WBTC/USDC"]
	chainName: z.string(), // e.g., "ethereum-testnet-sepolia"
});

type Config = z.infer<typeof configSchema>;

// ===== Type Definitions =====

interface TradeIntent {
	id: string;
	walletCommitment: string;
	proofHash: string;
	side: 'buy' | 'sell';
	tokenPair: string;
	amount: string;
	price: string;
	timestamp: number;
	worldIdNullifier: string;
}

interface MatchedPair {
	buyOrder: TradeIntent;
	sellOrder: TradeIntent;
	matchPrice: string;
	matchAmount: string;
	matchTimestamp: number;
}

interface WorldIDProof {
	merkle_root: string;
	nullifier_hash: string;
	proof: string;
	verification_level: string;
}

interface ZKProof {
	proof: any;
	publicSignals: string[];
}

// ===== In-Memory Confidential Orderbook (TEE Storage) =====

class ConfidentialOrderbook {
	private buyOrders: Map<string, TradeIntent[]> = new Map();
	private sellOrders: Map<string, TradeIntent[]> = new Map();
	private usedNullifiers: Set<string> = new Set();

	addIntent(intent: TradeIntent): { success: boolean; reason?: string } {
		if (this.usedNullifiers.has(intent.worldIdNullifier)) {
			return { success: false, reason: 'World ID nullifier already used' };
		}

		const book = intent.side === 'buy' ? this.buyOrders : this.sellOrders;
		if (!book.has(intent.tokenPair)) {
			book.set(intent.tokenPair, []);
		}
		
		const orders = book.get(intent.tokenPair)!;
		orders.push(intent);
		
		// Sort by price-time priority
		orders.sort((a, b) => {
			const priceA = parseFloat(a.price);
			const priceB = parseFloat(b.price);
			return intent.side === 'buy' 
				? priceB - priceA || a.timestamp - b.timestamp
				: priceA - priceB || a.timestamp - b.timestamp;
		});

		this.usedNullifiers.add(intent.worldIdNullifier);
		return { success: true };
	}

	findMatches(tokenPair: string): MatchedPair[] {
		const buyOrders = this.buyOrders.get(tokenPair) || [];
		const sellOrders = this.sellOrders.get(tokenPair) || [];
		const matches: MatchedPair[] = [];

		let buyIdx = 0, sellIdx = 0;

		while (buyIdx < buyOrders.length && sellIdx < sellOrders.length) {
			const buyOrder = buyOrders[buyIdx];
			const sellOrder = sellOrders[sellIdx];
			const buyPrice = parseFloat(buyOrder.price);
			const sellPrice = parseFloat(sellOrder.price);

			if (buyPrice >= sellPrice) {
				const matchPrice = sellOrder.timestamp < buyOrder.timestamp ? sellOrder.price : buyOrder.price;
				const matchAmount = Math.min(parseFloat(buyOrder.amount), parseFloat(sellOrder.amount)).toString();
				matches.push({ buyOrder, sellOrder, matchPrice, matchAmount, matchTimestamp: Date.now() });
				buyIdx++;
				sellIdx++;
			} else {
				break;
			}
		}

		if (matches.length > 0) {
			this.buyOrders.set(tokenPair, buyOrders.slice(buyIdx));
			this.sellOrders.set(tokenPair, sellOrders.slice(sellIdx));
		}

		return matches;
	}

	getDepth(tokenPair: string): { buys: number; sells: number } {
		return {
			buys: this.buyOrders.get(tokenPair)?.length || 0,
			sells: this.sellOrders.get(tokenPair)?.length || 0
		};
	}

	clearExpiredOrders(maxAge: number = 86400000): number {
		const now = Date.now();
		let cleared = 0;
		
		for (const [tokenPair, orders] of [...this.buyOrders.entries(), ...this.sellOrders.entries()]) {
			const filtered = orders.filter(o => now - o.timestamp < maxAge);
			cleared += orders.length - filtered.length;
			if (filtered.length === 0) {
				this.buyOrders.delete(tokenPair);
				this.sellOrders.delete(tokenPair);
			}
		}
		
		return cleared;
	}
}

// Global orderbook instance (persists in TEE memory)
const orderbook = new ConfidentialOrderbook();

// ===== Validation Functions =====

async function validateWorldId(
	runtime: Runtime<Config>,
	proof: WorldIDProof
): Promise<{ success: boolean; nullifierHash?: string; reason?: string }> {
	try {
		const config = runtime.config;
		const endpoint = `https://developer.worldcoin.org/api/v2/verify/${config.worldIdAppId}`;

		const response = await fetch(endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				merkle_root: proof.merkle_root,
				nullifier_hash: proof.nullifier_hash,
				proof: proof.proof,
				verification_level: proof.verification_level,
				action: config.worldIdAction,
			})
		});

		const data = await response.json();
		if (data.success) {
			return { success: true, nullifierHash: proof.nullifier_hash };
		} else {
			return { success: false, reason: data.detail || 'World ID verification failed' };
		}
	} catch (error: any) {
		return { success: false, reason: `World ID validation error: ${error.message}` };
	}
}

async function validateZKProof(
	runtime: Runtime<Config>,
	zkProof: ZKProof
): Promise<{ success: boolean; walletCommitment?: string; proofHash?: string; reason?: string }> {
	try {
		const config = runtime.config;
		const vkPath = config.zkVerificationKeyPath;
		
		if (!fs.existsSync(vkPath)) {
			return { success: false, reason: 'ZK verification key not found' };
		}

		const verificationKey = JSON.parse(fs.readFileSync(vkPath, 'utf-8'));
		const isValid = await groth16.verify(verificationKey, zkProof.publicSignals, zkProof.proof);

		if (!isValid) {
			return { success: false, reason: 'Invalid ZK proof' };
		}

		// Extract outputs: [balanceSufficient, walletCommitment, proofHash, requiredAmount, timestamp]
		const balanceSufficient = zkProof.publicSignals[0] === '1';
		if (!balanceSufficient) {
			return { success: false, reason: 'Insufficient balance (proven via ZK)' };
		}

		return {
			success: true,
			walletCommitment: zkProof.publicSignals[1],
			proofHash: zkProof.publicSignals[2],
		};
	} catch (error: any) {
		return { success: false, reason: `ZK verification error: ${error.message}` };
	}
}

// ===== Workflow Handlers =====

/**
 * HTTP Handler: Trade Intake
 * Receives trade intents, validates World ID + ZK proofs, adds to orderbook
 */
const handleTradeIntake = async (
	runtime: Runtime<Config>,
	payload: any
): Promise<any> => {
	runtime.log('🔍 Processing trade intake...');

	const { worldIdProof, zkProof, trade } = payload as {
		worldIdProof: WorldIDProof;
		zkProof: ZKProof;
		trade: { side: 'buy' | 'sell'; tokenPair: string; amount: string; price: string };
	};

	// Step 1: Validate World ID
	runtime.log('1️⃣  Validating World ID proof...');
	const worldIdResult = await validateWorldId(runtime, worldIdProof);
	if (!worldIdResult.success) {
		runtime.log(`❌ World ID validation failed: ${worldIdResult.reason}`);
		return { statusCode: 400, body: { success: false, reason: worldIdResult.reason } };
	}

	// Step 2: Validate ZK Proof
	runtime.log('2️⃣  Validating ZK balance proof...');
	const zkResult = await validateZKProof(runtime, zkProof);
	if (!zkResult.success) {
		runtime.log(`❌ ZK proof validation failed: ${zkResult.reason}`);
		return { statusCode: 400, body: { success: false, reason: zkResult.reason } };
	}

	runtime.log('✅ World ID and ZK proof verified');

	// Step 3: Add to orderbook
	runtime.log('3️⃣  Adding to confidential orderbook...');
	const intent: TradeIntent = {
		id: zkResult.proofHash!,
		walletCommitment: zkResult.walletCommitment!,
		proofHash: zkResult.proofHash!,
		side: trade.side,
		tokenPair: trade.tokenPair,
		amount: trade.amount,
		price: trade.price,
		timestamp: Date.now(),
		worldIdNullifier: worldIdResult.nullifierHash!,
	};

	const addResult = orderbook.addIntent(intent);
	if (!addResult.success) {
		runtime.log(`❌ Failed to add to orderbook: ${addResult.reason}`);
		return { statusCode: 400, body: { success: false, reason: addResult.reason } };
	}

	const depth = orderbook.getDepth(trade.tokenPair);
	runtime.log(`✅ Trade intent added | Orderbook depth: ${depth.buys} buys, ${depth.sells} sells`);

	return {
		statusCode: 200,
		body: {
			success: true,
			intentId: intent.id,
			walletCommitment: zkResult.walletCommitment,
			orderbookDepth: depth,
		}
	};
};

/**
 * Cron Handler: Matching Engine
 * Runs every N seconds, finds matching buy/sell orders
 */
const handleMatchingEngine = (runtime: Runtime<Config>, payload: CronPayload): string => {
	runtime.log('🎯 Running matching engine...');

	const config = runtime.config;
	const tokenPairs = config.tokenPairs;
	const allMatches: MatchedPair[] = [];

	for (const tokenPair of tokenPairs) {
		runtime.log(`📊 Checking ${tokenPair}...`);
		const depth = orderbook.getDepth(tokenPair);
		runtime.log(`   Orderbook: ${depth.buys} buys, ${depth.sells} sells`);

		if (depth.buys === 0 || depth.sells === 0) {
			runtime.log(`   ⏭️  Skipping (no orders on one side)`);
			continue;
		}

		const matches = orderbook.findMatches(tokenPair);
		if (matches.length > 0) {
			runtime.log(`   ✅ Found ${matches.length} matches`);
			allMatches.push(...matches);

			// Execute settlement for each match
			for (const match of matches) {
				executeSettlement(runtime, match);
			}
		} else {
			runtime.log(`   ℹ️  No matches (spread too wide)`);
		}
	}

	// Clear expired orders
	const cleared = orderbook.clearExpiredOrders(86400000);
	if (cleared > 0) {
		runtime.log(`🧹 Cleared ${cleared} expired orders`);
	}

	runtime.log(`✅ Matching complete: ${allMatches.length} total matches`);
	return `Matched ${allMatches.length} trades`;
};

/**
 * Settlement Execution
 * Calls on-chain contracts to settle matched trades
 */
const executeSettlement = (runtime: Runtime<Config>, match: MatchedPair): void => {
	runtime.log(`💱 Executing settlement for match ${match.buyOrder.id.substring(0, 8)}...`);
	runtime.log(`   Pair: ${match.buyOrder.tokenPair}`);
	runtime.log(`   Amount: ${match.matchAmount} @ ${match.matchPrice}`);

	const config = runtime.config;

	try {
		const network = getNetwork({
			chainFamily: 'evm',
			chainSelectorName: config.chainName,
			isTestnet: true,
		});

		if (!network) {
			throw new Error(`Network not found for chain: ${config.chainName}`);
		}

		const evmClient = new cre.capabilities.EVMClient(network.chainSelector.selector);

		// TODO: Call actual OTCSettlement contract when deployed
		// For now, log settlement data
		runtime.log(`   Buyer commitment: ${match.buyOrder.walletCommitment}`);
		runtime.log(`   Seller commitment: ${match.sellOrder.walletCommitment}`);
		runtime.log(`   Settlement contract: ${config.otcSettlementAddress}`);
		runtime.log(`   ✅ Settlement prepared (awaiting contract deployment)`);

	} catch (error: any) {
		runtime.log(`   ❌ Settlement error: ${error.message}`);
	}
};

// ===== Workflow Setup =====

const initWorkflow = (config: Config) => {
	const http = new cre.capabilities.HTTPCapability();
	const cron = new cre.capabilities.CronCapability();

	return [
		// HTTP endpoint for trade intake
		cre.handler(
			http.trigger({
				path: '/trade-intake',
				method: 'POST',
			}),
			handleTradeIntake,
		),

		// Cron job for matching engine
		cre.handler(
			cron.trigger({
				schedule: config.schedule,
			}),
			handleMatchingEngine,
		),
	];
};

export async function main() {
	const runner = await Runner.newRunner<Config>({ configSchema });
	await runner.run(initWorkflow);
}

main();
