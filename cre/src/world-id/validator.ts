import fetch from 'node-fetch';

/**
 * World ID Proof Validator
 * Validates World ID proofs submitted with trade intents
 */

export interface WorldIDProof {
  merkle_root: string;
  nullifier_hash: string;
  proof: string;
  verification_level: string;
  action?: string;
  credential_type?: string;
}

export interface WorldIDValidationResult {
  valid: boolean;
  nullifierHash?: string;
  verificationLevel?: string;
  reason?: string;
}

export class WorldIDValidator {
  private apiKey: string;
  private appId: string;
  private actionId: string;
  private staging: boolean;

  constructor(
    appId: string,
    actionId: string,
    apiKey?: string,
    staging: boolean = true
  ) {
    this.appId = appId;
    this.actionId = actionId;
    this.apiKey = apiKey || '';
    this.staging = staging;
  }

  /**
   * Validate World ID proof
   * Calls World ID backend verification API
   */
  async validateProof(proof: WorldIDProof): Promise<WorldIDValidationResult> {
    try {
      const endpoint = this.staging
        ? 'https://developer.worldcoin.org/api/v2/verify/app_staging_356707253a6f729610327063d51fe46e'
        : `https://developer.worldcoin.org/api/v2/verify/${this.appId}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify({
          merkle_root: proof.merkle_root,
          nullifier_hash: proof.nullifier_hash,
          proof: proof.proof,
          verification_level: proof.verification_level,
          action: this.actionId,
          signal: '' // Optional: can be used to bind proof to specific data
        })
      });

      const data: any = await response.json();

      if (!response.ok) {
        return {
          valid: false,
          reason: `World ID API error: ${data.detail || data.message || 'Unknown error'}`
        };
      }

      if (data.success === true) {
        return {
          valid: true,
          nullifierHash: proof.nullifier_hash,
          verificationLevel: proof.verification_level
        };
      } else {
        return {
          valid: false,
          reason: data.detail || data.message || 'Proof verification failed'
        };
      }

    } catch (error: any) {
      console.error('❌ World ID validation error:', error);
      return {
        valid: false,
        reason: `Validation error: ${error.message}`
      };
    }
  }

  /**
   * Check if nullifier has been used before
   * In production, store in database or smart contract
   */
  async isNullifierUsed(nullifierHash: string): Promise<boolean> {
    // TODO: Implement database check
    // For now, return false (always allow)
    console.warn('⚠️  Nullifier uniqueness check not implemented - add database');
    return false;
  }
}

// Export singleton with environment variables
export const worldIdValidator = new WorldIDValidator(
  process.env.WORLD_ID_APP_ID || 'app_staging_356707253a6f729610327063d51fe46e',
  process.env.WORLD_ID_ACTION_ID || 'submit-trade',
  process.env.WORLD_ID_API_KEY,
  process.env.WORLD_ID_STAGING !== 'false'
);
