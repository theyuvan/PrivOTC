/**
 * TypeScript type definitions for ZK proof structures
 */

export interface ZKProof {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: string;
  curve: string;
}

export interface BalanceProofData {
  proof: ZKProof;
  publicSignals: string[];
}

export interface ProofGenerationInput {
  walletAddress: string;
  actualBalance: string;
  tokenAddress: string;
  salt: string;
  balanceProofData: string;
  requiredAmount: string;
  timestamp: string;
}

export interface ProofVerificationResult {
  valid: boolean;
  sufficient: boolean;
  walletCommitment: string;
  proofHash: string;
  reason?: string;
}
