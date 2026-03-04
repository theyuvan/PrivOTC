# Dev 3 Implementation Plan — CRE + ZK Proof Integration

**Date:** March 4, 2026  
**Based on:** zk-affordability-loan structure + CRE Confidential HTTP  
**Your CRE CLI:** v1.2.0 ✅ Logged in

---

## 🎯 Architecture Overview

Unlike the affordability loan project which uses Starknet/Cairo, PrivOTC uses:
- **Chainlink CRE** (TypeScript workflows) — orchestration layer
- **Circom circuits** (ZK proofs) — balance verification
- **CRE Confidential HTTP** — privacy-preserving API calls
- **World ID** — Sybil resistance

### Data Flow:
```
User (World Mini App)
    ↓
1. Generate ZK Proof (client-side Circom)
   - Proves: "I have ≥ X tokens"
   - Private: wallet, actual balance
   - Public: required amount, token, proof commitment
    ↓
2. Submit to CRE Confidential HTTP Endpoint
   - Encrypted trade intent
   - World ID proof
   - ZK balance proof
    ↓
3. CRE Workflow (TypeScript)
   - Validates World ID (off-chain)
   - Verifies ZK proof (Circom verifier)
   - Decrypts trade intent (Confidential Compute)
   - Stores in confidential orderbook
    ↓
4. Matching Engine (Confidential Compute)
   - Matches orders privately
   - Only matched pairs proceed
    ↓
5. Settlement (On-chain)
   - Triggers OTCSettlement.settle()
   - Records proof via ProofVerifier
```

---

## 📁 Project Structure (Based on zk-affordability-loan)

```
chain.link/
├── app/                              # ✅ Exists (Dev 2 frontend)
│   └── .env.local                    # ✅ Created
│
├── cre/                              # ❌ To create (Your main work)
│   ├── package.json
│   ├── tsconfig.json
│   ├── project.yaml                  # CRE project config
│   ├── secrets.yaml                  # Vault DON secrets
│   ├── workflows/
│   │   ├── trade-intake.ts          # Workflow 1
│   │   ├── matching-engine.ts       # Workflow 2
│   │   ├── settlement.ts            # Workflow 4
│   │   └── index.ts                 # Main entry point
│   ├── src/
│   │   ├── zk/
│   │   │   ├── verifier.ts          # ZK proof verifier (from Circom)
│   │   │   └── types.ts             # ZK proof types
│   │   ├── world-id/
│   │   │   └── validator.ts         # World ID validation
│   │   ├── orderbook/
│   │   │   └── confidential.ts      # In-memory confidential orderbook
│   │   └── utils/
│   │       ├── encryption.ts        # AES encryption/decryption
│   │       └── logger.ts            # Logging utilities
│   └── node_modules/
│
├── zk-circuits/                      # ❌ To create (Circom circuits)
│   ├── package.json
│   ├── circuits/
│   │   ├── balanceProof.circom      # Main circuit
│   │   └── utils.circom             # Helper templates
│   ├── build/                        # Compiled circuits
│   ├── scripts/
│   │   ├── compile.sh               # Compile circuits
│   │   ├── setup.sh                 # Trusted setup
│   │   └── generate-verifier.sh     # Generate TypeScript verifier
│   ├── input/
│   │   └── test-balance.json        # Test inputs
│   └── output/                       # Proofs and verifier
│
├── contracts/                        # ❌ To create later (Dev 1's work)
│   └── solidity/
│       ├── EscrowVault.sol
│       ├── OTCSettlement.sol
│       └── ProofVerifier.sol
│
└── docs/
    ├── DEV3_COMPLETE_GUIDE.md       # ✅ Created
    ├── DEV3_ANALYSIS.md             # ✅ Created
    └── SCARB_FOUND.md               # ✅ Created
```

---

## 🔧 Phase 1: Setup CRE Project (30 min)

### Step 1.1: Initialize CRE Project

```powershell
cd C:\Users\thame\chain.link

# Create CRE directory
New-Item -ItemType Directory -Path "cre" -Force

# Initialize CRE project
cd cre
cre init
# Follow prompts:
# - Project name: privotc-cre
# - Language: TypeScript
# - Include example workflows: No
```

### Step 1.2: Install Dependencies

```powershell
# CRE project dependencies
npm install

# Additional dependencies for ZK proof verification
npm install snarkjs circomlib ffjavascript dotenv
npm install @types/node --save-dev

# For encryption/decryption
npm install crypto-js
npm install @types/crypto-js --save-dev
```

### Step 1.3: Create project.yaml

Create `cre/project.yaml`:
```yaml
# Chainlink CRE Project Configuration
name: privotc-cre
version: 1.0.0
description: PrivOTC Confidential OTC Trading Platform

# Development settings
development-settings:
  chain:
    ethereum-sepolia:
      rpc-url: ${ETHEREUM_SEPOLIA_RPC}
  account:
    workflow-owner-address: ${CRE_WORKFLOW_OWNER_ADDRESS}

# Production settings (for deployment)
production-settings:
  chain:
    ethereum-mainnet:
      rpc-url: ${ETHEREUM_MAINNET_RPC} # Tenderly Virtual TestNet RPC
    base-mainnet:
      rpc-url: ${BASE_MAINNET_RPC}     # Tenderly Virtual TestNet RPC
  account:
    workflow-owner-address: ${CRE_WORKFLOW_OWNER_ADDRESS}
```

### Step 1.4: Create secrets.yaml

Create `cre/secrets.yaml`:
```yaml
# Vault DON Secrets Configuration
secretsNames:
  # AES encryption key for confidential HTTP responses
  san_marino_aes_gcm_encryption_key:
    - AES_ENCRYPTION_KEY

  # API keys (if needed for external services)
  world_id_api_key:
    - WORLD_ID_API_KEY
```

### Step 1.5: Create .env

Create `cre/.env`:
```bash
# CRE Configuration
CRE_WORKFLOW_OWNER_ADDRESS=<your_wallet_address>

# Tenderly Virtual TestNets (from Dev 1)
ETHEREUM_MAINNET_RPC=https://rpc.tenderly.co/fork/...
BASE_MAINNET_RPC=https://rpc.tenderly.co/fork/...

# Ethereum for dev testing
ETHEREUM_SEPOLIA_RPC=https://ethereum-sepolia-rpc.publicnode.com

# Vault DON Secrets
AES_ENCRYPTION_KEY=<generate 32-byte hex key>
WORLD_ID_API_KEY=<from World ID dashboard>

# Contract Addresses (from Dev 1 when ready)
ESCROW_VAULT_ADDRESS=
OTC_SETTLEMENT_ADDRESS=
PROOF_VERIFIER_ADDRESS=
```

---

## 🔐 Phase 2: Create ZK Circuits (2-3 hours)

This mirrors the zk-affordability-loan structure but for **balance proofs** instead of identity.

### Step 2.1: Setup Circom Environment

```powershell
cd C:\Users\thame\chain.link

# Create ZK circuits directory
New-Item -ItemType Directory -Path "zk-circuits" -Force
cd zk-circuits

# Initialize npm
npm init -y

# Install Circom dependencies (same as affordability loan)
npm install circomlib snarkjs
```

### Step 2.2: Create Balance Proof Circuit

Create `zk-circuits/circuits/balanceProof.circom`:

```circom
pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";

/**
 * Balance Proof Circuit for PrivOTC
 * Proves: user has balance >= required_amount without revealing actual balance
 * Similar to idAuth.circom structure from zk-affordability-loan
 */
template BalanceProof() {
    // ===== PRIVATE INPUTS (never revealed) =====
    signal input wallet_address;        // User's wallet address (as felt252)
    signal input actual_balance;        // Actual token balance (private)
    signal input token_address;         // Token contract address (private)
    signal input salt;                  // Random salt for commitment
    signal input balance_proof_data;    // Additional proof data (e.g., block number)
    
    // ===== PUBLIC INPUTS =====
    signal input required_amount;       // Minimum required balance (public)
    signal input timestamp;             // Proof generation timestamp (public)
    
    // ===== PUBLIC OUTPUTS =====
    signal output balance_sufficient;   // 1 if balance >= required, 0 otherwise
    signal output wallet_commitment;    // Hash commitment of wallet (prevents front-running)
    signal output proof_hash;           // Unique proof identifier
    
    // ===== BALANCE VERIFICATION =====
    // Check if actual_balance >= required_amount
    component balance_check = GreaterEqThan(252); // 252-bit comparison
    balance_check.in[0] <== actual_balance;
    balance_check.in[1] <== required_amount;
    balance_sufficient <== balance_check.out;
    
    // Constrain: balance must be sufficient
    balance_sufficient === 1;
    
    // ===== WALLET COMMITMENT =====
    // Create commitment using Poseidon hash (Starknet-compatible)
    component wallet_hash = Poseidon(2);
    wallet_hash.inputs[0] <== wallet_address;
    wallet_hash.inputs[1] <== salt;
    wallet_commitment <== wallet_hash.out;
    
    // ===== PROOF HASH =====
    // Generate unique proof identifier
    component proof_hasher = Poseidon(5);
    proof_hasher.inputs[0] <== wallet_commitment;
    proof_hasher.inputs[1] <== token_address;
    proof_hasher.inputs[2] <== required_amount;
    proof_hasher.inputs[3] <== timestamp;
    proof_hasher.inputs[4] <== balance_proof_data;
    proof_hash <== proof_hasher.out;
}

// Public inputs that are visible (required_amount, timestamp)
component main {public [required_amount, timestamp]} = BalanceProof();
```

### Step 2.3: Create Compilation Scripts

Create `zk-circuits/scripts/compile.sh`:
```bash
#!/bin/bash
# Compile Circom circuit

echo "Compiling balanceProof circuit..."

# Compile circuit
circom circuits/balanceProof.circom --r1cs --wasm --sym -o build/

echo "Circuit compiled successfully!"
echo "Output: build/balanceProof.r1cs, build/balanceProof_js/"
```

Create `zk-circuits/scripts/setup.sh`:
```bash
#!/bin/bash
# Perform trusted setup (similar to zk-affordability-loan)

echo "Starting trusted setup..."

# Download powers of tau (or use existing from affordability loan if available)
curl -o build/pot12_final.ptau https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau

# Generate zkey
snarkjs groth16 setup build/balanceProof.r1cs build/pot12_final.ptau build/balanceProof_0000.zkey

# Contribute to ceremony
snarkjs zkey contribute build/balanceProof_0000.zkey build/balanceProof_final.zkey --name="PrivOTC Contribution" -v

# Export verification key
snarkjs zkey export verificationkey build/balanceProof_final.zkey build/verification_key.json

echo "Trusted setup complete!"
```

Create `zk-circuits/scripts/generate-verifier.sh`:
```bash
#!/bin/bash
# Generate TypeScript verifier for CRE

echo "Generating verifier..."

# Generate Solidity verifier (we won't use this directly, but it's useful)
snarkjs zkey export solidityverifier build/balanceProof_final.zkey build/BalanceVerifier.sol

# Generate verification key
snarkjs zkey export verificationkey build/balanceProof_final.zkey build/verification_key.json

echo "Verifier generated!"
echo "Use snarkjs.groth16.verify() in TypeScript with verification_key.json"
```

### Step 2.4: Test Input Template

Create `zk-circuits/input/test-balance.json`:
```json
{
  "wallet_address": "123456789012345678901234567890",
  "actual_balance": "1000000000000000000",
  "token_address": "987654321098765432109876543210",
  "salt": "11111111111111111111111111111111",
  "balance_proof_data": "12345",
  "required_amount": "500000000000000000",
  "timestamp": "1709654400"
}
```

### Step 2.5: Compile and Test

```powershell
cd C:\Users\thame\chain.link\zk-circuits

# Make scripts executable (in WSL)
wsl bash -c "chmod +x scripts/*.sh"

# Compile circuit
wsl bash -c "cd /mnt/c/Users/thame/chain.link/zk-circuits && ./scripts/compile.sh"

# Run trusted setup
wsl bash -c "cd /mnt/c/Users/thame/chain.link/zk-circuits && ./scripts/setup.sh"

# Generate verifier
wsl bash -c "cd /mnt/c/Users/thame/chain.link/zk-circuits && ./scripts/generate-verifier.sh"
```

---

## 🚀 Phase 3: Create CRE Workflows (4-5 hours)

Now we create the TypeScript CRE workflows that use the ZK proofs.

### Step 3.1: Package Configuration

Create `cre/package.json`:
```json
{
  "name": "privotc-cre-workflows",
  "version": "1.0.0",
  "type": "module",
  "description": "PrivOTC CRE Workflows with ZK Proof Integration",
  "main": "workflows/index.ts",
  "scripts": {
    "simulate": "cre workflow simulate --target development-settings",
    "deploy": "cre workflow deploy --target production-settings",
    "test": "node --loader ts-node/esm test/test-zk-verifier.ts"
  },
  "dependencies": {
    "@chainlink/cre-sdk": "latest",
    "snarkjs": "^0.7.4",
    "circomlib": "^2.0.5",
    "dotenv": "^16.4.7",
    "crypto-js": "^4.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.17.9",
    "@types/crypto-js": "^4.2.2",
    "typescript": "^5.7.3",
    "ts-node": "^10.9.2"
  }
}
```

### Step 3.2: TypeScript Configuration

Create `cre/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./",
    "types": ["node"]
  },
  "include": ["workflows/**/*", "src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 3.3: ZK Proof Verifier (TypeScript)

Create `cre/src/zk/verifier.ts`:

```typescript
import { groth16 } from 'snarkjs';
import * as fs from 'fs';
import * as path from 'path';

/**
 * ZK Proof Verifier for Balance Proofs
 * Based on zk-affordability-loan structure
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

export class ZKBalanceVerifier {
  private verificationKey: any;

  constructor(verificationKeyPath?: string) {
    // Load verification key from build output
    const vkPath = verificationKeyPath || 
      path.join(process.cwd(), '../zk-circuits/build/verification_key.json');
    
    if (fs.existsSync(vkPath)) {
      this.verificationKey = JSON.parse(fs.readFileSync(vkPath, 'utf-8'));
    } else {
      console.warn(`⚠️  Verification key not found at ${vkPath}`);
      console.warn('   Run circuit compilation first: cd zk-circuits && ./scripts/compile.sh');
    }
  }

  /**
   * Verify a balance proof
   * Returns true if proof is valid and balance is sufficient
   */
  async verifyProof(proof: BalanceProof): Promise<{
    valid: boolean;
    sufficient: boolean;
    walletCommitment: string;
    proofHash: string;
    reason?: string;
  }> {
    try {
      // Verify the zk-SNARK proof
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
          reason: 'Invalid ZK proof'
        };
      }

      // Extract outputs from public signals
      // publicSignals structure: [balanceSufficient, walletCommitment, proofHash]
      const balanceSufficient = proof.publicSignals[0] === '1';
      const walletCommitment = proof.publicSignals[1];
      const proofHash = proof.publicSignals[2];

      return {
        valid: true,
        sufficient: balanceSufficient,
        walletCommitment,
        proofHash
      };

    } catch (error) {
      console.error('ZK proof verification error:', error);
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
   * Verify proof with additional checks
   */
  async verifyWithChecks(
    proof: BalanceProof,
    expectedRequiredAmount: string,
    maxTimestampAge: number = 300 // 5 minutes
  ): Promise<{
    valid: boolean;
    sufficient: boolean;
    walletCommitment: string;
    proofHash: string;
    reason?: string;
  }> {
    // Basic proof verification
    const result = await this.verifyProof(proof);
    if (!result.valid) {
      return result;
    }

    // Check timestamp freshness
    // Public inputs: [requiredAmount, timestamp]
    const publicInputs = this.parsePublicInputs(proof);
    const proofTimestamp = parseInt(publicInputs.timestamp);
    const currentTimestamp = Math.floor(Date.now() / 1000);

    if (currentTimestamp - proofTimestamp > maxTimestampAge) {
      return {
        ...result,
        valid: false,
        reason: `Proof expired (age: ${currentTimestamp - proofTimestamp}s > ${maxTimestampAge}s)`
      };
    }

    // Verify required amount matches expectation
    if (publicInputs.requiredAmount !== expectedRequiredAmount) {
      return {
        ...result,
        valid: false,
        reason: 'Required amount mismatch'
      };
    }

    return result;
  }

  /**
   * Parse public inputs from proof
   */
  private parsePublicInputs(proof: BalanceProof): BalanceProofPublicInputs {
    // Assuming circuit has 2 public inputs: [requiredAmount, timestamp]
    // And 3 outputs: [balanceSufficient, walletCommitment, proofHash]
    // Total public signals: 5
    return {
      requiredAmount: proof.publicSignals[3], // Index after outputs
      timestamp: proof.publicSignals[4]
    };
  }
}

// Export singleton instance
export const zkVerifier = new ZKBalanceVerifier();
```

---

## ⏱️ Continuing in Next Message...

This is getting long. I'll create the remaining files in the next message:
- CRE Workflow 1: Trade Intake (with ZK verification)
- CRE Workflow 2: Matching Engine
- CRE Workflow 4: Settlement
- Integration guide

Should I continue with the CRE workflows implementation?
