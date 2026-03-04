#!/bin/bash
# Generate verifier for balance proof circuit

set -e

# Source cargo environment
source ~/.cargo/env

echo "🏗️  Generating verifier..."

# Create build directory
mkdir -p build

# Generate Solidity verifier (for reference, not used in CRE)
echo "📝 Generating Solidity verifier (reference only)..."
snarkjs zkey export solidityverifier build/balanceProof_final.zkey build/BalanceVerifier.sol

# Export verification key (already done in setup, but ensure it exists)
echo "🔑 Exporting verification key..."
snarkjs zkey export verificationkey build/balanceProof_final.zkey build/verification_key.json

# Generate verification call data template
echo "📋 Generating verification call data template..."
snarkjs zkey export verificationcalldata \
    build/balanceProof_final.zkey \
    build/public.json \
    build/proof.json > build/calldata.txt 2>/dev/null || true

echo ""
echo "✅ Verifier generated!"
echo ""
echo "Generated files:"
echo "  - build/BalanceVerifier.sol (Solidity verifier - reference)"
echo "  - build/verification_key.json (for TypeScript snarkjs.groth16.verify)"
echo ""
echo "💡 In CRE workflows, use snarkjs.groth16.verify() with verification_key.json"
echo ""
echo "Example TypeScript code:"
echo "  import { groth16 } from 'snarkjs';"
echo "  const vKey = JSON.parse(fs.readFileSync('build/verification_key.json'));"
echo "  const isValid = await groth16.verify(vKey, publicSignals, proof);"
