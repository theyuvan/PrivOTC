'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAccount, useWriteContract, usePublicClient } from 'wagmi'
import { keccak256, encodePacked, parseAbi, formatEther } from 'viem'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CHAIN_CONFIG } from '@/lib/chainConfig'

// ── Minimal ABIs ────────────────────────────────────────────────────────────
const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
])

const ESCROW_ABI = parseAbi([
  'function deposit(bytes32 tradeId, address token, uint256 amount, uint256 expiryTime) external payable',
  'function refund(bytes32 tradeId) external',
])

function useCountdown(deadlineSeconds: number) {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    const tick = () => {
      const diff = deadlineSeconds - Math.floor(Date.now() / 1000)
      setRemaining(Math.max(0, diff))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [deadlineSeconds])

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  return { remaining, label: `${mins}:${secs.toString().padStart(2, '0')}` }
}

interface EscrowDepositProps {
  match: Match
  onSettled?: () => void
}

type Step = 'idle' | 'approving' | 'depositing' | 'waiting' | 'settled' | 'expired' | 'error'

export function EscrowDeposit({ match, onSettled }: EscrowDepositProps) {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { writeContractAsync } = useWriteContract()

  // Get chain-specific config
  const chainType = (match.chain || 'ethereum') as 'ethereum' | 'worldChain'
  const config = CHAIN_CONFIG[chainType]
  const ESCROW_ADDRESS = config.escrow as `0x${string}`
  
  // Determine which token is being traded (same token for both parties)
  const tradingToken = (match.token || 'ETH') as 'ETH' | 'WLD'
  const isETHTrade = tradingToken === 'ETH'
  
  // Check if WLD token exists on this chain
  const wldTokenExists = chainType === 'worldChain' && config.wldToken?.address
  const WLD_ADDRESS = wldTokenExists 
    ? (config.wldToken?.address as `0x${string}`) 
    : undefined

  const [step, setStep] = useState<Step>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [settleTxHash, setSettleTxHash] = useState('')
  const [myEscrowId, setMyEscrowId] = useState<`0x${string}` | null>(null)

  // Detect if this match requires WLD on a chain where it doesn't exist
  const hasInvalidToken = !isETHTrade && !wldTokenExists

  const isBuyer = address?.toLowerCase() === match.buyerAddress.toLowerCase()
  const isSeller = address?.toLowerCase() === match.sellerAddress.toLowerCase()
  const role = isBuyer ? 'buyer' : isSeller ? 'seller' : null
  
  // Calculate deposit amounts (both parties use same token)
  const buyerAmount = isETHTrade ? match.ethAmount : match.wldAmount
  const sellerAmount = isETHTrade ? match.ethAmount : match.wldAmount

  const { remaining, label: countdown } = useCountdown(match.deadline)

  // Compute this user's escrow ID once address is known
  useEffect(() => {
    if (!address) return
    const id = keccak256(
      encodePacked(
        ['bytes32', 'address'],
        [match.tradeId as `0x${string}`, address]
      )
    )
    setMyEscrowId(id)
  }, [address, match.tradeId])

  // Poll /api/escrow every 5 s while waiting for counterparty
  const pollEscrow = useCallback(async () => {
    try {
      const res = await fetch('/api/escrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match.matchId,
          tradeId: match.tradeId,
          buyerAddress: match.buyerAddress,
          sellerAddress: match.sellerAddress,
          ethAmount: match.ethAmount,
          wldAmount: match.wldAmount,
          chain: match.chain || 'ethereum',
          token: match.token || 'ETH', // Pass the trading token
        }),
      })
      const data = await res.json()
      if (data.settled) {
        setSettleTxHash(data.txHash ?? '')
        setStep('settled')
        onSettled?.()
      }
    } catch {
      // silently retry
    }
  }, [match, onSettled])

  useEffect(() => {
    if (step !== 'waiting') return
    const id = setInterval(pollEscrow, 5000)
    return () => clearInterval(id)
  }, [step, pollEscrow])

  // ── Buyer deposit flow (ETH or WLD depending on tradingToken) ──────────
  const handleBuyerDeposit = async () => {
    if (!address || !publicClient || !myEscrowId) return
    setErrorMsg('')

    try {
      console.log('\n════════════════════════════════════════════════════')
      console.log('💰 BUYER DEPOSIT STARTING')
      console.log('════════════════════════════════════════════════════')
      console.log('Role:', 'BUYER')
      console.log('Token:', tradingToken)
      console.log('Amount:', formatEther(BigInt(buyerAmount)), tradingToken)
      console.log('Chain:', config.name)
      console.log('Escrow ID:', myEscrowId)
      console.log('────────────────────────────────────────────────────')
      
      if (isETHTrade) {
        // ETH trade: Deposit native ETH (no approval needed)
        console.log('⏳ Depositing ETH to escrow...')
        setStep('depositing')
        const depositTx = await writeContractAsync({
          address: ESCROW_ADDRESS,
          abi: ESCROW_ABI,
          functionName: 'deposit',
          args: [
            myEscrowId,
            '0x0000000000000000000000000000000000000000' as `0x${string}`,
            BigInt(buyerAmount),
            BigInt(match.deadline),
          ],
          value: BigInt(buyerAmount),
        })
        console.log('📝 Transaction submitted!')
        console.log('   Tx Hash:', depositTx)
        console.log('⏳ Waiting for confirmation...')
        const receipt = await publicClient.waitForTransactionReceipt({ hash: depositTx })
        if (receipt.status === 'reverted') throw new Error('Deposit transaction reverted on-chain')
        console.log('✅ BUYER DEPOSIT CONFIRMED')
        console.log('   Block:', receipt.blockNumber.toString())
        console.log('   Gas Used:', receipt.gasUsed.toString())
        console.log('   Status:', receipt.status)
        console.log('════════════════════════════════════════════════════\n')
      } else {
        // WLD trade: Approve WLD → Deposit WLD
        if (!WLD_ADDRESS) {
          setErrorMsg('WLD token not available on this chain')
          setStep('error')
          return
        }
        
        console.log('⏳ [1/2] Approving WLD spend...')
        setStep('approving')
        const approveTx = await writeContractAsync({
          address: WLD_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [ESCROW_ADDRESS, BigInt(buyerAmount)],
        })
        console.log('📝 Approval transaction submitted!')
        console.log('   Tx Hash:', approveTx)
        console.log('⏳ Waiting for approval confirmation...')
        const approvalReceipt = await publicClient.waitForTransactionReceipt({ hash: approveTx })
        console.log('✅ Approval confirmed!')
        console.log('   Block:', approvalReceipt.blockNumber.toString())
        console.log('   Gas Used:', approvalReceipt.gasUsed.toString())
        console.log('────────────────────────────────────────────────────')

        console.log('⏳ [2/2] Depositing WLD to escrow...')
        setStep('depositing')
        const depositTx = await writeContractAsync({
          address: ESCROW_ADDRESS,
          abi: ESCROW_ABI,
          functionName: 'deposit',
          args: [
            myEscrowId,
            WLD_ADDRESS,
            BigInt(buyerAmount),
            BigInt(match.deadline),
          ],
        })
        console.log('📝 Deposit transaction submitted!')
        console.log('   Tx Hash:', depositTx)
        console.log('⏳ Waiting for confirmation...')
        const receipt = await publicClient.waitForTransactionReceipt({ hash: depositTx })
        if (receipt.status === 'reverted') throw new Error('Deposit transaction reverted on-chain')
        console.log('✅ BUYER DEPOSIT CONFIRMED')
        console.log('   Block:', receipt.blockNumber.toString())
        console.log('   Gas Used:', receipt.gasUsed.toString())
        console.log('   Status:', receipt.status)
        console.log('════════════════════════════════════════════════════\n')
      }

      setStep('waiting')
    } catch (err: any) {
      setErrorMsg(err.shortMessage ?? err.message)
      setStep('error')
    }
  }

  // ── Seller deposit flow (ETH or WLD depending on tradingToken) ─────────
  const handleSellerDeposit = async () => {
    if (!address || !publicClient || !myEscrowId) return
    setErrorMsg('')

    try {
      console.log('\n════════════════════════════════════════════════════')
      console.log('💰 SELLER DEPOSIT STARTING')
      console.log('════════════════════════════════════════════════════')
      console.log('Role:', 'SELLER')
      console.log('Token:', tradingToken)
      console.log('Amount:', formatEther(BigInt(sellerAmount)), tradingToken)
      console.log('Chain:', config.name)
      console.log('Escrow ID:', myEscrowId)
      console.log('────────────────────────────────────────────────────')
      
      if (isETHTrade) {
        // ETH trade: Deposit native ETH (no approval needed)
        console.log('⏳ Depositing ETH to escrow...')
        setStep('depositing')
        const depositTx = await writeContractAsync({
          address: ESCROW_ADDRESS,
          abi: ESCROW_ABI,
          functionName: 'deposit',
          args: [
            myEscrowId,
            '0x0000000000000000000000000000000000000000' as `0x${string}`,
            BigInt(sellerAmount),
            BigInt(match.deadline),
          ],
          value: BigInt(sellerAmount),
        })
        console.log('📝 Transaction submitted!')
        console.log('   Tx Hash:', depositTx)
        console.log('⏳ Waiting for confirmation...')
        const receipt = await publicClient.waitForTransactionReceipt({ hash: depositTx })
        if (receipt.status === 'reverted') throw new Error('Deposit transaction reverted on-chain')
        console.log('✅ SELLER DEPOSIT CONFIRMED')
        console.log('   Block:', receipt.blockNumber.toString())
        console.log('   Gas Used:', receipt.gasUsed.toString())
        console.log('   Status:', receipt.status)
        console.log('════════════════════════════════════════════════════\n')
      } else {
        // WLD trade: Approve WLD → Deposit WLD
        if (!WLD_ADDRESS) {
          setErrorMsg('WLD token not available on this chain')
          setStep('error')
          return
        }
        
        console.log('⏳ [1/2] Approving WLD spend...')
        setStep('approving')
        const approveTx = await writeContractAsync({
          address: WLD_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [ESCROW_ADDRESS, BigInt(sellerAmount)],
        })
        console.log('📝 Approval transaction submitted!')
        console.log('   Tx Hash:', approveTx)
        console.log('⏳ Waiting for approval confirmation...')
        const approvalReceipt = await publicClient.waitForTransactionReceipt({ hash: approveTx })
        console.log('✅ Approval confirmed!')
        console.log('   Block:', approvalReceipt.blockNumber.toString())
        console.log('   Gas Used:', approvalReceipt.gasUsed.toString())
        console.log('────────────────────────────────────────────────────')

        console.log('⏳ [2/2] Depositing WLD to escrow...')
        setStep('depositing')
        const depositTx = await writeContractAsync({
          address: ESCROW_ADDRESS,
          abi: ESCROW_ABI,
          functionName: 'deposit',
          args: [
            myEscrowId,
            WLD_ADDRESS,
            BigInt(sellerAmount),
            BigInt(match.deadline),
          ],
        })
        console.log('📝 Deposit transaction submitted!')
        console.log('   Tx Hash:', depositTx)
        console.log('⏳ Waiting for confirmation...')
        const receipt = await publicClient.waitForTransactionReceipt({ hash: depositTx })
        if (receipt.status === 'reverted') throw new Error('Deposit transaction reverted on-chain')
        console.log('✅ SELLER DEPOSIT CONFIRMED')
        console.log('   Block:', receipt.blockNumber.toString())
        console.log('   Gas Used:', receipt.gasUsed.toString())
        console.log('   Status:', receipt.status)
        console.log('════════════════════════════════════════════════════\n')
      }

      setStep('waiting')
    } catch (err: any) {
      setErrorMsg(err.shortMessage ?? err.message)
      setStep('error')
    }
  }

  // ── Refund (after deadline expires) ─────────────────────────────────────
  const handleRefund = async () => {
    if (!myEscrowId || !publicClient) return
    setErrorMsg('')
    try {
      const tx = await writeContractAsync({
        address: ESCROW_ADDRESS,
        abi: ESCROW_ABI,
        functionName: 'refund',
        args: [myEscrowId],
      })
      await publicClient.waitForTransactionReceipt({ hash: tx })
      setStep('expired')
    } catch (err: any) {
      setErrorMsg(err.shortMessage ?? err.message)
      setStep('error')
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  if (!role) {
    return (
      <Alert>
        <AlertDescription>
          Your wallet ({address}) is not a party in this match.
        </AlertDescription>
      </Alert>
    )
  }

  const buyerDisplay = isETHTrade 
    ? `${Number(formatEther(BigInt(buyerAmount))).toFixed(4)} ETH`
    : `${Number(formatEther(BigInt(buyerAmount))).toFixed(2)} WLD`
  
  const sellerDisplay = isETHTrade
    ? `${Number(formatEther(BigInt(sellerAmount))).toFixed(4)} ETH`
    : `${Number(formatEther(BigInt(sellerAmount))).toFixed(2)} WLD`

  return (
    <Card className="border-orange-500/40 bg-orange-500/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-mono">⚡ Trade Matched — Send to Escrow</CardTitle>
          <Badge
            variant={remaining > 60 ? 'outline' : 'destructive'}
            className="font-mono text-xs"
          >
            {remaining > 0 ? `⏱ ${countdown}` : 'EXPIRED'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Match details */}
        <div className="text-xs font-mono space-y-1 text-muted-foreground">
          <div>Token: <span className="text-foreground">{tradingToken}</span></div>
          <div>Buyer amount: <span className="text-foreground">{buyerDisplay}</span></div>
          <div>Seller amount: <span className="text-foreground">{sellerDisplay}</span></div>
          <div>Your role: <span className="text-orange-400 font-semibold">{role.toUpperCase()}</span></div>
          <div>Counterparty: <span className="text-foreground font-mono text-[10px]">
            {isBuyer ? match.sellerAddress : match.buyerAddress}
          </span></div>
          <div>Match ID: <span className="text-foreground font-mono text-[10px] break-all">
            {match.matchId.slice(0, 16)}…
          </span></div>
        </div>

        {/* What you need to deposit */}
        <div className="rounded-md border border-orange-500/20 p-3 text-sm bg-background">
          {isBuyer ? (
            <p>You are the <strong>BUYER</strong>. Deposit <strong className="text-orange-400">{buyerDisplay}</strong> into escrow for this privacy transfer.</p>
          ) : (
            <p>You are the <strong>SELLER</strong>. Deposit <strong className="text-orange-400">{sellerDisplay}</strong> into escrow for this privacy transfer.</p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            💭 Both parties use <strong>{tradingToken}</strong> • Privacy-preserving P2P transfer
          </p>
        </div>

        {/* Invalid token warning */}
        {hasInvalidToken && (
          <Alert variant="destructive">
            <AlertDescription className="text-xs">
              <strong>⚠️ Token Not Available</strong><br />
              WLD token is not available on {config.name}. This match cannot be executed.<br />
              <span className="text-[10px] mt-1 block text-muted-foreground">
                Tip: Select <strong>WLD</strong> token to automatically use World Chain where WLD exists.
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Action area */}
        {step === 'idle' && remaining > 0 && !hasInvalidToken && (
          <>
            {isBuyer && (
              <Button onClick={handleBuyerDeposit} className="w-full">
                {isETHTrade ? `Deposit ${buyerDisplay}` : `Approve & Deposit ${buyerDisplay}`}
              </Button>
            )}
            {isSeller && (
              <Button onClick={handleSellerDeposit} className="w-full">
                {isETHTrade ? `Deposit ${sellerDisplay}` : `Approve & Deposit ${sellerDisplay}`}
              </Button>
            )}
          </>
        )}

        {step === 'approving' && (
          <div className="text-xs font-mono text-yellow-400 animate-pulse">
            [1/2] Approving {tradingToken} spend…
          </div>
        )}

        {step === 'depositing' && (
          <div className="text-xs font-mono text-yellow-400 animate-pulse">
            {isBuyer ? '[2/2]' : '[1/1]'} Depositing into EscrowVault…
          </div>
        )}

        {step === 'waiting' && (
          <div className="space-y-2">
            <div className="text-xs font-mono text-green-400">
              ✅ Your deposit confirmed. Waiting for counterparty…
            </div>
            <div className="text-xs text-muted-foreground animate-pulse">
              Polling on-chain every 5 seconds…
            </div>
          </div>
        )}

        {step === 'settled' && (
          <div className="space-y-1">
            <div className="text-sm font-semibold text-green-500">
              🎉 Trade Complete! Funds auto-settled.
            </div>
            {settleTxHash && (
              <div className="text-xs font-mono text-muted-foreground break-all">
                settle() tx: {settleTxHash}
              </div>
            )}
          </div>
        )}

        {step === 'error' && (
          <Alert variant="destructive">
            <AlertDescription className="text-xs font-mono">{errorMsg}</AlertDescription>
          </Alert>
        )}

        {/* Refund button when expired and deposit was made but not settled */}
        {remaining === 0 && step === 'waiting' && myEscrowId && (
          <Button variant="destructive" onClick={handleRefund} className="w-full">
            ⏰ Deadline Expired — Claim Refund
          </Button>
        )}

        {step === 'expired' && (
          <div className="text-sm text-muted-foreground">
            Refund processed. Funds returned to your wallet.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
