# PrivOTC ZK Balance Proof Circuits

Zero-Knowledge proof circuits for privacy-preserving balance verification using Circom.

## 🎯 Purpose

Prove that a user has sufficient token balance **without revealing** their actual balance or wallet address.

**Example:**
- User has 10 ETH (private)
- Trade requires 5 ETH (public)
- Proof shows: ✅ "Balance sufficient" (without revealing 10 ETH)

## 🏗️ Circuit Architecture

Based on the `idAuth.circom` pattern from zk-affordability-loan project.

### Inputs:
- **Private:** `wallet_address`, `actual_balance`, `token_address`, `salt`, `balance_proof_data`
- **Public:** `required_amount`, `timestamp`

### Outputs (Public):
- `balance_sufficient`: Boolean (1 = has enough, 0 = insufficient)
- `wallet_commitment`: Poseidon hash of wallet + salt (prevents front-running)
- `proof_hash`: Unique proof identifier (prevents replay attacks)

### Constraints:
```circom
// Main constraint: balance >= required amount
GreaterEqThan(252).out === 1

// Commitments using Poseidon hash
wallet_commitment = Poseidon([wallet_address, salt])
proof_hash = Poseidon([wallet_commitment, token_address, required_amount, timestamp, balance_proof_data])
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Compile Circuit

```bash
npm run compile
```

This generates:
- `build/balanceProof.r1cs` — Constraint system
- `build/balanceProof_js/` — Witness generator

### 3. Trusted Setup

```bash
npm run setup
```

This generates:
- `build/balanceProof_final.zkey` — Proving key
- `build/verification_key.json` — Verification key

### 4. Generate Verifier

```bash
npm run generate-verifier
```

This generates:
- `build/BalanceVerifier.sol` — Solidity verifier (reference)
- `build/verification_key.json` — For TypeScript verification

## 🔧 Integration with CRE

The verification key (`build/verification_key.json`) is used in CRE workflows:

```typescript
import { groth16 } from 'snarkjs';
import vKey from '../zk-circuits/build/verification_key.json';

async function verifyBalanceProof(proof, publicSignals) {
  return await groth16.verify(vKey, publicSignals, proof);
}
```

See `../cre/src/zk/verifier.ts` for complete implementation.

## 📁 File Structure

```
zk-circuits/
├── circuits/
│   └── balanceProof.circom     # Main circuit
├── scripts/
│   ├── compile.sh              # Compile circuit
│   ├── setup.sh                # Trusted setup
│   └── generate-verifier.sh    # Generate verifier
├── input/
│   └── test-balance.json       # Test input
├── build/                       # Compiled outputs
│   ├── balanceProof.r1cs
│   ├── balanceProof_final.zkey
│   └── verification_key.json
└── package.json
```

## 🧪 Testing

Test the circuit with sample input:

```bash
cd build/balanceProof_js/
node generate_witness.js balanceProof.wasm ../../input/test-balance.json witness.wtns
```

Generate proof:

```bash
snarkjs groth16 prove build/balanceProof_final.zkey build/balanceProof_js/witness.wtns build/proof.json build/public.json
```

Verify proof:

```bash
snarkjs groth16 verify build/verification_key.json build/public.json build/proof.json
```

## 🔐 Security Considerations

1. **Trusted Setup**: In production, use a multi-party ceremony (MPC)
2. **Salt Freshness**: Use cryptographically random salt for each proof
3. **Timestamp Check**: CRE workflow validates proof timestamp (< 5 min old)
4. **Replay Protection**: `proof_hash` is unique per proof, prevent reuse
5. **Commitment Binding**: `wallet_commitment` prevents address substitution

## 📚 References

- [Circom Documentation](https://docs.circom.io/)
- [snarkjs Guide](https://github.com/iden3/snarkjs)
- [Poseidon Hash](https://www.poseidon-hash.info/)
- Based on: `zk-affordability-loan/contracts/zk/idAuth.circom`

## 🎓 Dev 3 Notes

Circuit adapted from identity proof pattern:
- **Before:** Prove age >= 18
- **Now:** Prove balance >= required_amount

Same cryptographic primitives (Poseidon, GreaterEqThan) ensure Starknet compatibility.
