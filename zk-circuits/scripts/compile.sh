#!/bin/bash
# Compile Circom circuit for PrivOTC balance proof

set -e

# Source cargo environment (for circom)
source ~/.cargo/env

echo "🔧 Compiling balanceProof circuit..."

# Create build directory if it doesn't exist
mkdir -p build

# Compile circuit
# --r1cs: Generate R1CS constraint system
# --wasm: Generate wasm witness generator
# --sym: Generate symbols file for debugging
circom circuits/balanceProof.circom --r1cs --wasm --sym -o build/

echo "✅ Circuit compiled successfully!"
echo ""
echo "Output files:"
echo "  - build/balanceProof.r1cs (constraint system)"
echo "  - build/balanceProof_js/ (witness generator)"
echo "  - build/balanceProof.sym (debug symbols)"
echo ""
echo "Next step: Run ./scripts/setup.sh for trusted setup"
