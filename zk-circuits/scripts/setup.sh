#!/bin/bash
# Perform trusted setup for balance proof circuit

set -e

# Source cargo environment (for circom/snarkjs)
source ~/.cargo/env

echo "🔐 Starting trusted setup..."

# Create build directory
mkdir -p build

# Check if powers of tau file exists, otherwise download
if [ ! -f "build/pot12_final.ptau" ]; then
    echo "📥 Downloading powers of tau (phase 1)..."
    # Use a different mirror if the first one fails
    curl -L -o build/pot12_final.ptau https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_12.ptau || \
    wget -O build/pot12_final.ptau https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau
else
    echo "✓ Using existing powers of tau file"
fi

# Generate initial zkey (phase 2)
echo "🔑 Generating circuit-specific zkey..."
snarkjs groth16 setup build/balanceProof.r1cs build/pot12_final.ptau build/balanceProof_0000.zkey

# Contribute to ceremony (in production, this would be a multi-party ceremony)
echo "🎲 Contributing randomness..."
snarkjs zkey contribute build/balanceProof_0000.zkey build/balanceProof_final.zkey \
    --name="PrivOTC Dev 3 Contribution" \
    --entropy="$(date +%s%N)" \
    -v

# Export verification key
echo "📤 Exporting verification key..."
snarkjs zkey export verificationkey build/balanceProof_final.zkey build/verification_key.json

# Generate circuit info
echo "📊 Generating circuit info..."
snarkjs r1cs info build/balanceProof.r1cs

echo ""
echo "✅ Trusted setup complete!"
echo ""
echo "Generated files:"
echo "  - build/balanceProof_final.zkey (proving key)"
echo "  - build/verification_key.json (verification key)"
echo ""
echo "Next step: Run ./scripts/generate-verifier.sh to create TypeScript verifier"
