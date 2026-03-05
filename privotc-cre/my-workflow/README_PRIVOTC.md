# PrivOTC Workflow - Quick Start

## Overview

**PrivOTC** (Privacy-Preserving OTC Trading) is a Chainlink CRE workflow combining:
- 🌍 **World ID** - Sybil resistance (one trade per human)  
- 🔒 **ZK Proofs** - Private balance verification (Circom + Groth16)  
- 🔐 **Confidential Compute** - TEE-protected orderbook  

## Workflow Architecture

### 1️⃣ Trade Intake (HTTP Endpoint)
- **Trigger**: `POST /trade-intake`
- **Validates**: World ID proof + ZK balance proof
- **Action**: Adds trade intent to confidential orderbook
- **Response**: Intent ID + wallet commitment

### 2️⃣ Matching Engine (Cron Job)
- **Trigger**: Every 30 seconds
- **Finds**: Matching buy/sell orders (price-time priority)
- **Privacy**: Only matched orders revealed, unmatched stay private
- **Clears**: Expired orders (>24h)

### 3️⃣ Settlement
- **Trigger**: Automatic on match
- **Executes**: On-chain settlement via OTCSettlement contract
- **Records**: ZK proofs on-chain for auditability

## Files

```
my-workflow/
├── privotc-workflow.ts     # Main workflow (Trade Intake + Matching + Settlement)
├── privotc-config.json     # Configuration (World ID, ZK paths, contracts)
├── workflow.yaml           # CRE workflow settings (privotc-staging target)
├── package.json            # Dependencies (snarkjs, node-fetch)
│
├── main.ts.backup          # Original template (backup)
├── main.ts                 # Original multi-chain token manager (reference)
└── config.json             # Original config (reference)
```

## Configuration

**privotc-config.json:**
```json
{
  "schedule": "*/30 * * * * *",              // Matching engine: every 30s
  "worldIdAppId": "app_staging_...",         // World ID staging app
  "worldIdAction": "submit_trade",           // World ID action
  "zkVerificationKeyPath": "../../zk-circuits/build/verification_key.json",
  "otcSettlementAddress": "0x...",           // TODO: Get from Dev 1
  "proofVerifierAddress": "0x...",           // TODO: Get from Dev 1
  "tokenPairs": ["ETH/USDC", "WBTC/USDC"],
  "chainName": "ethereum-testnet-sepolia"
}
```

## Local Testing

### 1. Install Dependencies
```bash
cd privotc-cre/my-workflow
bun install
```

### 2. Simulate Workflow
```bash
# From privotc-cre/my-workflow directory
cre workflow simulate . --target privotc-staging
```

### 3. Test Trade Intake (via HTTP)
```bash
curl -X POST http://localhost:8080/trade-intake \
  -H "Content-Type: application/json" \
  -d '{
    "worldIdProof": {
      "merkle_root": "0x...",
      "nullifier_hash": "0x...",
      "proof": "0x...",
      "verification_level": "orb"
    },
    "zkProof": {
      "proof": {...},
      "publicSignals": ["1", "...", "..."]
    },
    "trade": {
      "side": "buy",
      "tokenPair": "ETH/USDC",
      "amount": "1.0",
      "price": "2000"
    }
  }'
```

## Deployment

### Prerequisites
1. ✅ **CRE Early Access** - Apply at https://chain.link/cre
2. ✅ **Contract Addresses** - Get from Dev 1 (OTCSettlement, ProofVerifier)
3. ✅ **Tenderly RPC URLs** - Get from Dev 1 (Ethereum + Base forks)

### Steps

1. **Update Configuration**
   ```bash
   # Edit privotc-config.json with production values
   # - otcSettlementAddress
   # - proofVerifierAddress
   # - Tenderly RPC URLs (in project.yaml)
   ```

2. **Build Workflow**
   ```bash
   cd privotc-cre/my-workflow
   bun install
   bun x cre-setup
   ```

3. **Deploy to CRE**
   ```bash
   cre workflow deploy . --target privotc-staging
   ```

4. **Monitor Workflow**
   ```bash
   cre workflow logs privotc-confidential-trading
   ```

## Integration with PrivOTC App

The Next.js app should call the CRE HTTP endpoint:

**app/api/trade/route.ts:**
```typescript
const response = await fetch('{{CRE_WORKFLOW_ENDPOINT}}/trade-intake', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    worldIdProof: verifiedProof,
    zkProof: generatedZKProof,
    trade: {
      side: tradeData.side,
      tokenPair: tradeData.pair,
      amount: tradeData.amount,
      price: tradeData.price,
    }
  })
});
```

## ZK Proof Generation

Before calling the workflow, generate ZK proofs:

```bash
# From zk-circuits directory
cd ../../zk-circuits/build/balanceProof_js

# Generate witness
node generate_witness.js balanceProof.wasm input.json witness.wtns

# Generate proof
npx snarkjs groth16 prove ../balanceProof_final.zkey witness.wtns proof.json public.json

# Use proof.json and public.json in trade-intake request
```

## Verification Commands

```bash
# Check ZK proof generation
cd zk-circuits/build/balanceProof_js
npx snarkjs groth16 verify ../verification_key.json public.json proof.json
# Expected: [INFO] snarkJS: OK!

# Check CRE CLI
cre --version        # Should be v1.2.0
cre whoami           # Check authentication

# Check git status
git status           # Should show dev3 branch
git log --oneline -3 # Check recent commits
```

## Next Steps

1. **Get Contract Addresses from Dev 1**
   - OTCSettlement contract
   - ProofVerifier contract
   - Token addresses (WETH, USDC, DAI, WBTC)
   - Tenderly RPC URLs

2. **Apply for CRE Early Access**
   - URL: https://chain.link/cre
   - Project: PrivOTC
   - Technologies: World ID, ZK-SNARKs, TEE

3. **Test End-to-End**
   - Generate ZK proof
   - Submit trade via app
   - Verify orderbook depth
   - Check matching engine logs
   - Verify settlement transaction

## Troubleshooting

**Error: Verification key not found**
```bash
# Compile ZK circuits first
cd ../../zk-circuits
npm run compile
npm run setup
```

**Error: CRE CLI not found**
```bash
# Make sure CRE CLI is installed and in PATH
cre --version
```

**Error: World ID validation failed**
```bash
# Check World ID staging app credentials
# Verify proof is generated correctly from Mini App
```

## Resources

- **CRE Documentation**: https://docs.chain.link/cre
- **World ID Docs**: https://docs.world.org
- **Circom Docs**: https://docs.circom.io
- **PrivOTC Docs**: See root README.md and docs/

---

**Status**: ✅ Ready for local testing  
**Deploy**: ⏳ Awaiting CRE Early Access + contract addresses

Built with ❤️ by Dev 3 team
