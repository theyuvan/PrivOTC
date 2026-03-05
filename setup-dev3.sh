#!/bin/bash
# Setup script for Dev 3 — ZK Circuits + CRE Workflows
# Run in WSL: bash setup-dev3.sh

set -e  # Exit on error

echo "🚀 PrivOTC Dev 3 Setup Script"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ===== STEP 1: Check Prerequisites =====
echo -e "${YELLOW}Step 1: Checking prerequisites...${NC}"

# Check if in WSL
if ! grep -q microsoft /proc/version; then
    echo -e "${RED}❌ This script must run in WSL${NC}"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Install with: sudo apt install nodejs npm${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node --version)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm --version)${NC}"

# Check circom
if ! command -v circom &> /dev/null; then
    echo -e "${YELLOW}⚠️  Circom not found. Installing...${NC}"
    git clone https://github.com/iden3/circom.git /tmp/circom
    cd /tmp/circom
    cargo build --release
    sudo cp target/release/circom /usr/local/bin/
    cd -
    echo -e "${GREEN}✅ Circom installed${NC}"
else
    echo -e "${GREEN}✅ Circom $(circom --version)${NC}"
fi

# Check snarkjs
if ! command -v snarkjs &> /dev/null; then
    echo -e "${YELLOW}⚠️  snarkjs not found. Installing globally...${NC}"
    sudo npm install -g snarkjs
    echo -e "${GREEN}✅ snarkjs installed${NC}"
else
    echo -e "${GREEN}✅ snarkjs installed${NC}"
fi

echo ""

# ===== STEP 2: Setup ZK Circuits =====
echo -e "${YELLOW}Step 2: Setting up ZK circuits...${NC}"

cd /mnt/c/Users/thame/chain.link/zk-circuits

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# Make scripts executable
chmod +x scripts/*.sh

# Compile circuit
echo "🔧 Compiling balance proof circuit..."
bash scripts/compile.sh

# Run trusted setup
echo "🔐 Running trusted setup..."
bash scripts/setup.sh

# Generate verifier
echo "🏗️  Generating verifier..."
bash scripts/generate-verifier.sh

echo -e "${GREEN}✅ ZK circuits setup complete${NC}"
echo ""

# ===== STEP 3: Setup CRE Workflows =====
echo -e "${YELLOW}Step 3: Setting up CRE workflows...${NC}"

cd /mnt/c/Users/thame/chain.link/cre

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    
    # Generate AES key
    AES_KEY=$(openssl rand -hex 32)
    
    # Update .env with generated key
    echo "AES_ENCRYPTION_KEY=$AES_KEY" >> .env
    
    echo -e "${YELLOW}⚠️  Please edit cre/.env and add:${NC}"
    echo "   - CRE_WORKFLOW_OWNER_ADDRESS"
    echo "   - Contract addresses (get from Dev 1)"
    echo "   - Tenderly RPC URLs (get from Dev 1)"
else
    echo -e "${GREEN}✅ .env already exists${NC}"
fi

# Build TypeScript
echo "🏗️  Building TypeScript..."
npm run build

echo -e "${GREEN}✅ CRE workflows setup complete${NC}"
echo ""

# ===== STEP 4: Verification =====
echo -e "${YELLOW}Step 4: Verifying setup...${NC}"

# Check verification key
if [ -f /mnt/c/Users/thame/chain.link/zk-circuits/build/verification_key.json ]; then
    echo -e "${GREEN}✅ Verification key exists${NC}"
else
    echo -e "${RED}❌ Verification key not found${NC}"
fi

# Check compiled circuits
if [ -f /mnt/c/Users/thame/chain.link/zk-circuits/build/balanceProof.r1cs ]; then
    echo -e "${GREEN}✅ Circuit compiled${NC}"
else
    echo -e "${RED}❌ Circuit not compiled${NC}"
fi

# Check CRE build
if [ -d /mnt/c/Users/thame/chain.link/cre/dist ]; then
    echo -e "${GREEN}✅ CRE workflows built${NC}"
else
    echo -e "${RED}❌ CRE workflows not built${NC}"
fi

echo ""
echo -e "${GREEN}=============================="
echo "🎉 Dev 3 Setup Complete!"
echo "==============================${NC}"
echo ""
echo "📋 Next Steps:"
echo "  1. Edit cre/.env with your configuration"
echo "  2. Get contract addresses from Dev 1"
echo "  3. Apply for CRE Early Access: https://chain.link/cre"
echo "  4. Deploy workflows: cd cre && npm run deploy"
echo ""
echo "📚 Documentation:"
echo "  - Quick Start: DEV3_QUICKSTART.md"
echo "  - Full Guide: DEV3_IMPLEMENTATION_PLAN.md"
echo "  - ZK Circuits: zk-circuits/README.md"
echo "  - CRE Workflows: cre/README.md"
echo ""
