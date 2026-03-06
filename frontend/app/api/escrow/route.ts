import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, createWalletClient, http, keccak256, encodePacked, parseAbi, formatEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { CHAIN_CONFIG, ChainType } from '@/lib/chainConfig'

// Deployer is set as creExecutor — used only for settlement on demo/test network
const DEPLOYER_KEY = (
  process.env.DEPLOYER_PRIVATE_KEY ??
  '0xf64b45c2063ab73b67ec0e34f24eede3a80d8e3b0a755e318d598a746c38827c'
) as `0x${string}`

const ESCROW_ABI = parseAbi([
  'function getBalance(bytes32 tradeId) view returns (uint256)',
])

const SETTLEMENT_ABI = parseAbi([
  'function settle(bytes32 tradeId, address buyer, address seller, address buyerToken, address sellerToken, uint256 buyerAmount, uint256 sellerAmount) external',
  'function isSettled(bytes32 tradeId) view returns (bool)',
  'function creExecutor() view returns (address)',
  'error SettlementAlreadyExecuted()',
  'error Unauthorized()',
  'error BalanceProofRequired()',
])

/**
 * POST /api/escrow
 * Body: { matchId, tradeId, buyerAddress, sellerAddress, ethAmount, wldAmount, chain }
 *
 * Checks whether both parties have deposited into EscrowVault on-chain.
 * If both have deposited, calls OTCSettlement.settle() using the deployer key
 * (deployer is the creExecutor on this test network).
 *
 * Escrow IDs mirror what OTCSettlement.sol computes internally:
 *   buyerEscrowId  = keccak256(abi.encodePacked(tradeId, buyerAddress))
 *   sellerEscrowId = keccak256(abi.encodePacked(tradeId, sellerAddress))
 */
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { matchId, tradeId, buyerAddress, sellerAddress, ethAmount, wldAmount, chain = 'ethereum', token = 'ETH' } = body

  if (!tradeId || !buyerAddress || !sellerAddress) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Get chain config
  const chainType = chain as ChainType
  const config = CHAIN_CONFIG[chainType]
  if (!config) {
    return NextResponse.json({ error: 'Invalid chain' }, { status: 400 })
  }

  const tradeIdBytes = tradeId as `0x${string}`
  const buyerAddr = buyerAddress as `0x${string}`
  const sellerAddr = sellerAddress as `0x${string}`
  
  // Determine trading token and amounts
  const tradingToken = token as 'ETH' | 'WLD'
  const isETHTrade = tradingToken === 'ETH'
  const buyerAmount = isETHTrade ? ethAmount : wldAmount
  const sellerAmount = isETHTrade ? ethAmount : wldAmount

  // Compute escrow IDs — must exactly match OTCSettlement.sol's keccak256 computation
  const buyerEscrowId = keccak256(encodePacked(['bytes32', 'address'], [tradeIdBytes, buyerAddr]))
  const sellerEscrowId = keccak256(encodePacked(['bytes32', 'address'], [tradeIdBytes, sellerAddr]))

  const chainDef = {
    id: config.chainId,
    name: config.name,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [config.rpc] } },
  } as const

  const publicClient = createPublicClient({
    chain: chainDef,
    transport: http(config.rpc),
  })

  // Check if already settled
  const alreadySettled = await publicClient.readContract({
    address: config.settlement as `0x${string}`,
    abi: SETTLEMENT_ABI,
    functionName: 'isSettled',
    args: [tradeIdBytes],
  })

  if (alreadySettled) {
    return NextResponse.json({ settled: true, bothDeposited: true })
  }

  // Check on-chain escrow balances
  const [buyerBalance, sellerBalance] = await Promise.all([
    publicClient.readContract({
      address: config.escrow as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: 'getBalance',
      args: [buyerEscrowId],
    }),
    publicClient.readContract({
      address: config.escrow as `0x${string}`,
      abi: ESCROW_ABI,
      functionName: 'getBalance',
      args: [sellerEscrowId],
    }),
  ])

  const buyerBalance_ = buyerBalance as bigint
  const sellerBalance_ = sellerBalance as bigint
  const buyerDeposited = buyerBalance_ > 0n
  const sellerDeposited = sellerBalance_ > 0n

  console.log(`[escrow] ${matchId} — buyer: ${buyerBalance_}, seller: ${sellerBalance_}`)

  if (!buyerDeposited || !sellerDeposited) {
    return NextResponse.json({
      settled: false,
      bothDeposited: false,
      buyerDeposited,
      sellerDeposited,
      buyerBalance: buyerBalance_.toString(),
      sellerBalance: sellerBalance_.toString(),
    })
  }

  // Both have deposited — trigger on-chain settlement
  const account = privateKeyToAccount(DEPLOYER_KEY)
  const walletClient = createWalletClient({
    account,
    chain: chainDef,
    transport: http(config.rpc),
  })

  console.log(`[escrow] Both deposited — calling settle() for ${matchId} on ${config.name}`)
  console.log('\n════════════════════════════════════════════════════')
  console.log('⚡ SETTLEMENT STARTING')
  console.log('════════════════════════════════════════════════════')
  console.log('Match ID:', matchId)
  console.log('Trade ID:', tradeId)
  console.log('Buyer:', buyerAddress)
  console.log('Seller:', sellerAddress)
  console.log('Token:', tradingToken)
  console.log('Buyer Amount:', formatEther(BigInt(buyerAmount)), tradingToken)
  console.log('Seller Amount:', formatEther(BigInt(sellerAmount)), tradingToken)
  console.log('Chain:', config.name)
  console.log('────────────────────────────────────────────────────')

  // Re-check isSettled right before writing (prevents duplicate settle from concurrent polls)
  const alreadySettledNow = await publicClient.readContract({
    address: config.settlement as `0x${string}`,
    abi: SETTLEMENT_ABI,
    functionName: 'isSettled',
    args: [tradeIdBytes],
  })
  console.log('📋 Settlement state check:')
  console.log('   isSettled:', alreadySettledNow)
  console.log('   TradeId (bytes32):', tradeIdBytes)
  
  if (alreadySettledNow) {
    console.log('⚠️  Trade already settled on-chain, skipping settlement call')
    return NextResponse.json({ settled: true, bothDeposited: true })
  }

  // Verify creExecutor permissions
  const contractCreExecutor = await publicClient.readContract({
    address: config.settlement as `0x${string}`,
    abi: SETTLEMENT_ABI,
    functionName: 'creExecutor',
  })
  const deployerAddress = walletClient.account.address
  console.log('🔐 Permission check:')
  console.log('   Contract creExecutor:', contractCreExecutor)
  console.log('   Our deployer address:', deployerAddress)
  console.log('   Match:', contractCreExecutor.toLowerCase() === deployerAddress.toLowerCase())
  
  if (contractCreExecutor.toLowerCase() !== deployerAddress.toLowerCase()) {
    console.error('❌ PERMISSION DENIED: Deployer is not the creExecutor!')
    return NextResponse.json(
      { error: `Unauthorized: This deployer (${deployerAddress}) is not the creExecutor (${contractCreExecutor})` },
      { status: 403 }
    )
  }

  // Determine token addresses based on trading token and chain
  const ETH_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`
  const WLD_ADDRESS = chainType === 'worldChain' 
    ? (config.wldToken?.address as `0x${string}`) 
    : ('0x163f8C2467924be0ae7B5347228CABF260318753' as `0x${string}`)

  // Same-token trade: both parties use the same token
  const TOKEN_ADDRESS = isETHTrade ? ETH_ADDRESS : WLD_ADDRESS

  try {
    console.log('⏳ Calling settle() on OTCSettlement contract...')
    console.log('   Settlement contract:', config.settlement)
    console.log('   Deployer (creExecutor):', walletClient.account.address)
    console.log('   TradeId:', tradeIdBytes)
    console.log('   Token address:', TOKEN_ADDRESS)
    console.log('   Buyer amount:', buyerAmount)
    console.log('   Seller amount:', sellerAmount)
    
    const txHash = await walletClient.writeContract({
      address: config.settlement as `0x${string}`,
      abi: SETTLEMENT_ABI,
      functionName: 'settle',
      args: [
        tradeIdBytes,
        buyerAddr,
        sellerAddr,
        TOKEN_ADDRESS,  // buyer's token (same as seller's)
        TOKEN_ADDRESS,  // seller's token (same as buyer's)
        BigInt(buyerAmount),   // buyer's deposit amount
        BigInt(sellerAmount),  // seller's deposit amount
      ],
    })

    console.log('📝 Settlement transaction submitted!')
    console.log('   Tx Hash:', txHash)
    console.log('⏳ Waiting for confirmation...')
    
    // Wait for transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
    
    console.log('✅ SETTLEMENT CONFIRMED')
    console.log('   Transaction:', txHash)
    console.log('   Block:', receipt.blockNumber.toString())
    console.log('   Gas Used:', receipt.gasUsed.toString())
    console.log('   Status:', receipt.status)
    console.log('   💰 Buyer received:', formatEther(BigInt(sellerAmount)), tradingToken)
    console.log('   💰 Seller received:', formatEther(BigInt(buyerAmount)), tradingToken)
    console.log('   Privacy transfer complete! 🎉')
    console.log('════════════════════════════════════════════════════\n')

    console.log(`[escrow] settle() tx: ${txHash} | block: ${receipt.blockNumber}`)

    // Mark match as settled in the match store
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/matches`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId }),
    }).catch(() => {}) // non-critical

    return NextResponse.json({ settled: true, bothDeposited: true, txHash })
  } catch (err: any) {
    // SettlementAlreadyExecuted (0x94ce95d2) — another concurrent request won the race
    // Treat as success since the trade is settled on-chain
    const sig = err?.cause?.signature ?? err?.data ?? ''
    console.error(`[escrow] settle() caught error:`, {
      message: err?.message,
      shortMessage: err?.shortMessage,
      signature: sig,
      cause: err?.cause,
      details: err?.details,
    })
    
    if (sig === '0x94ce95d2' || err?.message?.includes('SettlementAlreadyExecuted')) {
      console.log(`[escrow] settle() already executed by concurrent request — returning settled`)
      return NextResponse.json({ settled: true, bothDeposited: true })
    }
    console.error(`[escrow] settle() failed with unexpected error:`, err)
    return NextResponse.json(
      { error: `Settlement failed: ${err.shortMessage ?? err.message}` },
      { status: 500 }
    )
  }
}
