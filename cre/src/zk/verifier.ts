import { groth16 } from 'snarkjs';
import * as fs from 'fs';
import * as path from 'path';

/**
 * ZK Proof Verifier for Balance Proofs
 * Based on zk-affordability-loan structure
 * Adapted from idAuth verification pattern
 */

export interface BalanceProof {
  proof: {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
    protocol: string;
    curve: string;
  };
  publicSignals: string[];
}

export interface BalanceProofPublicInputs {
  requiredAmount: string;
  timestamp: string;
}

export interface BalanceProofOutputs {
  balanceSufficient: string; // "1" if true, "0" if false
  walletCommitment: string;
  proofHash: string;
}

export interface VerificationResult {
  valid: boolean;
  sufficient: boolean;
  walletCommitment: string;
  proofHash: string;
  reason?: string;
}

export class ZKBalanceVerifier {
  private verificationKey: any;
  private vkPath: string;

  constructor(verificationKeyPath?: string) {
    // Load verification key from build output
    this.vkPath = verificationKeyPath || 
      path.join(process.cwd(), '../zk-circuits/build/verification_key.json');
    
    if (fs.existsSync(this.vkPath)) {
      this.verificationKey = JSON.parse(fs.readFileSync(this.vkPath, 'utf-8'));
      console.log(`✅ Loaded verification key from ${this.vkPath}`);
    } else {
      console.warn(`⚠️  Verification key not found at ${this.vkPath}`);
      console.warn('   Run circuit compilation first:');
      console.warn('   cd zk-circuits && npm run compile && npm run setup');
    }
  }

  /**
   * Verify a balance proof
   * Returns true if proof is valid and balance is sufficient
   */
  async verifyProof(proof: BalanceProof): Promise<VerificationResult> {
    try {
      if (!this.verificationKey) {
        return {
          valid: false,
          sufficient: false,
          walletCommitment: '',
          proofHash: '',
          reason: 'Verification key not loaded'
        };
      }

      // Verify the zk-SNARK proof using Groth16
      const isValid = await groth16.verify(
        this.verificationKey,
        proof.publicSignals,
        proof.proof
      );

      if (!isValid) {
        return {
          valid: false,
          sufficient: false,
          walletCommitment: '',
          proofHash: '',
          reason: 'Invalid ZK proof - cryptographic verification failed'
        };
      }

      // Extract outputs from public signals
      // Circuit output order: [balanceSufficient, walletCommitment, proofHash]
      // Public inputs follow: [requiredAmount, timestamp]
      const balanceSufficient = proof.publicSignals[0] === '1';
      const walletCommitment = proof.publicSignals[1];
      const proofHash = proof.publicSignals[2];

      return {
        valid: true,
        sufficient: balanceSufficient,
        walletCommitment,
        proofHash
      };

    } catch (error: any) {
      console.error('❌ ZK proof verification error:', error);
      return {
        valid: false,
        sufficient: false,
        walletCommitment: '',
        proofHash: '',
        reason: `Verification error: ${error.message}`
      };
    }
  }

  /**
   * Verify proof with additional business logic checks
   * - Timestamp freshness (prevent replay attacks)
   * - Required amount validation
   */
  async verifyWithChecks(
    proof: BalanceProof,
    expectedRequiredAmount: string,
    maxTimestampAge: number = 300 // 5 minutes default
  ): Promise<VerificationResult> {
    // Step 1: Basic cryptographic proof verification
    const result = await this.verifyProof(proof);
    if (!result.valid) {
      return result;
    }

    // Step 2: Extract and validate public inputs
    const publicInputs = this.parsePublicInputs(proof);
    
    // Step 3: Check timestamp freshness (prevent old proofs)
    const proofTimestamp = parseInt(publicInputs.timestamp);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const proofAge = currentTimestamp - proofTimestamp;

    if (proofAge > maxTimestampAge) {
      return {
        ...result,
        valid: false,
        reason: `Proof expired (age: ${proofAge}s > max: ${maxTimestampAge}s)`
      };
    }

    if (proofAge < -60) { // Allow 1 minute clock skew
      return {
        ...result,
        valid: false,
        reason: `Proof timestamp in future (clock skew: ${-proofAge}s)`
      };
    }

    // Step 4: Verify required amount matches expectation
    if (publicInputs.requiredAmount !== expectedRequiredAmount) {
      return {
        ...result,
        valid: false,
        reason: `Required amount mismatch (expected: ${expectedRequiredAmount}, got: ${publicInputs.requiredAmount})`
      };
    }

    return result;
  }

  /**
   * Parse public inputs from proof
   * Circuit structure: [outputs...] [inputs...]
   */
  private parsePublicInputs(proof: BalanceProof): BalanceProofPublicInputs {
    // publicSignals structure:
    // [0] balanceSufficient (output)
    // [1] walletCommitment (output)
    // [2] proofHash (output)
    // [3] requiredAmount (public input)
    // [4] timestamp (public input)
    
    return {
      requiredAmount: proof.publicSignals[3],
      timestamp: proof.publicSignals[4]
    };
  }

  /**
   * Extract outputs from proof
   */
  getOutputs(proof: BalanceProof): BalanceProofOutputs {
    return {
      balanceSufficient: proof.publicSignals[0],
      walletCommitment: proof.publicSignals[1],
      proofHash: proof.publicSignals[2]
    };
  }
}

// Export singleton instance
export const zkVerifier = new ZKBalanceVerifier();
