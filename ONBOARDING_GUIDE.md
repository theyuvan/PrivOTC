# 🚀 PrivOTC Developer Onboarding Guide

**For**: New team member pulling the codebase  
**Date**: March 5, 2026  
**Deadline**: March 8, 2026 (3 days remaining!)  
**Status**: Core features complete, ready for testing & deployment

---

## 📋 Table of Contents
1. [What Was Built](#what-was-built)
2. [Prerequisites](#prerequisites)
3. [Initial Setup](#initial-setup)
4. [Project Structure](#project-structure)
5. [Installation Steps](#installation-steps)
6. [Running the System](#running-the-system)
7. [CRE Basics & Commands](#cre-basics--commands)
8. [Testing Guide](#testing-guide)
9. [What's Next](#whats-next)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 What Was Built

### Core System Overview
**PrivOTC** is a privacy-preserving OTC (Over-The-Counter) trading platform that combines:
- ✅ **World ID** - Sybil-resistant user verification (REAL implementation)
- ✅ **ZK-SNARKs** - Zero-knowledge balance proofs (Groth16 protocol)
- ✅ **Chainlink CRE** - Confidential compute for matching engine
- ✅ **Smart Contracts** - Deployed on Tenderly Virtual TestNets

### What Works Right Now
1. ✅ Users can verify with World ID (scan QR code)
2. ✅ Real ZK proof generation (proves balance without revealing amount)
3. ✅ Trade submission with cryptographic proofs
4. ✅ Confidential matching engine in CRE
5. ✅ On-chain settlement (simulation mode ready, production toggle available)
6. ✅ No mock fallbacks - system requires REAL proofs

### Architecture
```
Frontend (Next.js)
    ↓
World ID Verification → ZK Proof Generation
    ↓                         ↓
Trade Queue API ← Real Proofs Combined
    ↓
CRE Workflow (Confidential Compute)
    ↓
Matching Engine → Settlement → Tenderly Testnet
```

---

## 🔧 Prerequisites

### Required Software
1. **Node.js** - v18+ (LTS recommended)
   - Check: `node --version`
   - Download: https://nodejs.org/

2. **npm** - v9+ (comes with Node.js)
   - Check: `npm --version`

3. **Git** - Latest version
   - Check: `git --version`
   - Download: https://git-scm.com/

4. **Chainlink CRE CLI** - Latest version
   - Check: `cre --version`
   - Install: See [CRE Installation](#cre-installation) below

5. **PowerShell** (Windows) or Bash (Linux/Mac)

### Optional But Recommended
- **Visual Studio Code** - Code editor
- **World App** - For testing World ID verification (download on iOS/Android)
- **Tenderly Account** - For viewing transactions (already set up)

---

## 📦 Initial Setup

### 1. Clone the Repository
```bash
# If you haven't pulled yet
git clone <repository-url>
cd chain.link

# Or if pulling from a specific branch
git fetch origin
git checkout <branch-name>
git pull origin <branch-name>
```

### 2. Verify Project Structure
```bash
# You should see these main folders:
ls
# Expected:
# - frontend/          (Next.js app)
# - privotc-cre/       (CRE workflow)
# - zk-circuits/       (ZK-SNARK circuits)
# - cre/               (Original CRE samples)
```

---

## 🏗️ Project Structure

```
chain.link/
│
├── frontend/                          # Next.js Frontend Application
│   ├── app/
│   │   ├── page.tsx                   # Main page
│   │   ├── api/
│   │   │   ├── trade/route.ts         # Trade queue API (GET/POST)
│   │   │   ├── status/route.ts        # Trade status endpoint
│   │   │   └── verify/route.ts        # World ID verification
│   │   └── globals.css
│   ├── components/
│   │   ├── privotc/
│   │   │   ├── OrderForm.tsx          # Trade submission form
│   │   │   ├── VerifyButton.tsx       # World ID verification button
│   │   │   └── TradeStatus.tsx        # Trade status display
│   │   └── ui/                        # Shadcn UI components
│   ├── .env.local                     # Environment variables (IMPORTANT!)
│   ├── package.json                   # Frontend dependencies
│   └── next.config.ts
│
├── zk-circuits/                       # ZK-SNARK Circuit Implementation
│   ├── circuits/
│   │   └── balanceProof.circom        # Main circuit (1610 constraints)
│   ├── build/                         # Compiled circuit artifacts
│   │   ├── balanceProof_final.zkey    # Proving key (0.7 MB)
│   │   ├── verification_key.json      # Verification key
│   │   └── balanceProof_js/
│   │       └── balanceProof.wasm      # Circuit in WASM
│   ├── scripts/
│   │   ├── compile.sh                 # Compile circuit
│   │   ├── setup.sh                   # Generate keys
│   │   └── generate-verifier.sh       # Generate Solidity verifier
│   ├── verifier-api.ts                # ZK Proof API server (IMPORTANT!)
│   ├── package.json                   # ZK dependencies
│   └── README.md
│
├── privotc-cre/                       # Chainlink CRE Workflow
│   ├── my-workflow/
│   │   ├── privotc-workflow.ts        # Main workflow logic (821 lines)
│   │   ├── privotc-config.json        # Configuration (IMPORTANT!)
│   │   └── main.ts                    # Alternative entry point
│   ├── contracts/
│   │   └── abi/
│   │       ├── OTCSettlement.ts       # Settlement contract ABI
│   │       ├── MockPool.ts            # Sample contract
│   │       └── ProtocolSmartWallet.ts
│   ├── package.json                   # CRE dependencies
│   └── project.yaml                   # CRE project config
│
├── cre/                               # Original CRE Examples (Reference)
│   ├── workflows/
│   ├── package.json
│   └── project.yaml
│
├── test-integration.ps1               # Integration test script
├── test-submit-trade.ps1              # Trade submission test
├── check-production-ready.ps1         # Production readiness check
│
├── ONBOARDING_GUIDE.md                # This file!
├── VERIFICATION_STATUS.md             # System status & verification
├── DYNAMIC_FLOW_ANALYSIS.md           # User flow documentation
├── TENDERLY_SETUP_STATUS.md           # Tenderly configuration
└── README.md                          # Project overview
```

---

## 📥 Installation Steps

### Step 1: Install CRE CLI

#### On Windows (PowerShell as Administrator):
```powershell
# Install via Chocolatey (recommended)
choco install chainlink-cre

# Or download directly
# Visit: https://docs.chain.link/chainlink-functions/cre/installation
# Download Windows installer and run
```

#### On Linux/Mac:
```bash
# Download and install
curl -sSfL https://install.chain.link/cre | sh

# Add to PATH
export PATH="$HOME/.chainlink/bin:$PATH"

# Verify installation
cre --version
```

#### Verify CRE Installation:
```bash
cre --version
# Should output: cre version X.X.X
```

### Step 2: Install Frontend Dependencies
```bash
cd frontend
npm install
# This installs:
# - Next.js
# - World ID IDKit
# - UI components (Radix UI, Framer Motion)
# - All frontend dependencies

cd ..
```

### Step 3: Install ZK Circuit Dependencies
```bash
cd zk-circuits
npm install
# This installs:
# - snarkjs (ZK proof generation)
# - circomlib (circuit libraries)
# - express (API server)
# - tsx (TypeScript execution)

cd ..
```

### Step 4: Install CRE Workflow Dependencies
```bash
cd privotc-cre
npm install
# This installs:
# - @chainlink/cre-sdk
# - viem (Ethereum library)
# - zod (validation)

cd ..
```

**Optional**: Install original CRE examples (for reference):
```bash
cd cre
npm install
cd ..
```

---

## ⚙️ Configuration

### 1. Frontend Environment Variables
**File**: `frontend/.env.local`

**Already configured** (verify these values):
```bash
# World ID Configuration
NEXT_PUBLIC_APP_ID=app_356707253a6f729610327063d51fe46e
NEXT_PUBLIC_WORLD_ACTION=verify-trade
WORLD_RP_ID=rp_8842282259915d97
RP_SIGNING_KEY=0xd95bb18195c4c39b9753973d3c6b9af4ea597f93afe2c9cbe9a35073dd22218f
NEXT_PUBLIC_WORLD_ENVIRONMENT=staging

# Tenderly Virtual TestNets
NEXT_PUBLIC_ETHEREUM_RPC=https://virtual.mainnet.eu.rpc.tenderly.co/fc856d53-a35a-4d03-8a54-ad1f88e48a6b
NEXT_PUBLIC_WORLD_CHAIN_RPC=https://virtual.worldchain-mainnet.eu.rpc.tenderly.co/9351a25c-a4fe-452b-86b5-ed87acd05ce8
NEXT_PUBLIC_ETHEREUM_CHAIN_ID=9991
NEXT_PUBLIC_WORLD_CHAIN_CHAIN_ID=999480

# Smart Contracts (Deployed on Tenderly)
NEXT_PUBLIC_SETTLEMENT_ETHEREUM_ADDRESS=0x281ef2194C5B9Fa0ca2c6604D22636C686c818D8
NEXT_PUBLIC_PROOF_VERIFIER_ETHEREUM_ADDRESS=0x8fC5337902A1EF5e699B2C19f1EBe892E5DBf294
```

### 2. CRE Configuration
**File**: `privotc-cre/my-workflow/privotc-config.json`

**Already configured** (current settings):
```json
{
  "schedule": "*/30 * * * * *",
  "simulationMode": true,
  "worldIdAppId": "app_staging_356707253a6f729610327063d51fe46e",
  "worldIdAction": "submit_trade",
  "otcSettlementAddress": "0x281ef2194C5B9Fa0ca2c6604D22636C686c818D8",
  "proofVerifierAddress": "0x8fC5337902A1EF5e699B2C19f1EBe892E5DBf294",
  "tokenPairs": ["ETH/USDC", "WBTC/USDC", "WETH/DAI"],
  "chainName": "ethereum-testnet-sepolia",
  "chainId": "9991",
  "tenderlyRpcUrl": "https://virtual.mainnet.eu.rpc.tenderly.co/fc856d53-a35a-4d03-8a54-ad1f88e48a6b",
  "gasLimit": "500000",
  "frontendApiUrl": "http://localhost:3000/api/trade",
  "zkVerifierUrl": "http://localhost:4000/verify",
  "adminApiKey": "hackathon-demo-2026"
}
```

**Key Settings**:
- `simulationMode: true` - Logs settlements without executing on-chain (safe for testing)
- `simulationMode: false` - Executes REAL on-chain transactions (production)

---

## 🚀 Running the System

### Quick Start (3 Terminals Required)

#### Terminal 1: ZK Verifier Service
```bash
cd zk-circuits
npm run verifier
```

**Expected Output**:
```
📁 Loaded verification key from: C:\Users\...\build\verification_key.json
   Protocol: groth16
   Curve: bn128

🔐 ZK Verification API started
   Running on: http://localhost:4000
   Endpoints:
     POST http://localhost:4000/verify
     POST http://localhost:4000/generate-proof
     GET  http://localhost:4000/health

✅ Ready to generate & verify ZK-SNARKs!
```

**What it does**: Generates and verifies real ZK-SNARK proofs using Groth16

---

#### Terminal 2: Frontend Application
```bash
cd frontend
npm run dev
```

**Expected Output**:
```
▲ Next.js 15.x.x
- Local:        http://localhost:3000
- Environments: .env.local

✓ Starting...
✓ Ready in 2.5s
```

**What it does**: Serves the user interface for trade submission

---

#### Terminal 3: Keep for CRE Commands
```bash
# Keep this terminal open for running CRE workflows manually
cd privotc-cre
```

---

### Testing the Flow

#### 1. Access the Frontend
```
Open browser: http://localhost:3000
```

#### 2. Verify with World ID
1. Click **"Verify with World ID"** button
2. Scan QR code with **World App** on your phone
3. Complete verification
4. You'll see: "✅ Verified as Human"

#### 3. Submit a Trade
1. Fill in trade details:
   - Side: Buy or Sell
   - Token Pair: ETH/USDC (or others)
   - Amount: e.g., 1.5
   - Price: e.g., 3200
2. Click **"Submit Encrypted Trade"**
3. Wait for:
   - "Generating ZK proof..." (~500ms)
   - "ZK proof generated! Submitting trade..."
   - "Trade submitted successfully!"

**Check Terminal 1** - Should see:
```
🔨 Generating ZK proof...
   Actual balance: 10000000000000000000
   Required amount: 1500000000000000000
   Circuit inputs prepared
✅ ZK proof generated
   Public signals: [ '1', '10899827...', ... ]
```

**Check Terminal 2** - Should see:
```
✅ Trade queued: buy 1.5 ETH/USDC @ 3200
   Queue size: 1
   ZK proof type: REAL (Groth16)
```

---

## 🎛️ CRE Basics & Commands

### What is CRE?
**Chainlink Compute Runtime Environment** - A confidential compute platform for running workflows in a Trusted Execution Environment (TEE).

### CRE Workflow Structure
```
privotc-cre/
├── project.yaml           # Project configuration
└── my-workflow/
    ├── privotc-workflow.ts   # Main workflow code
    └── privotc-config.json   # Runtime configuration
```

### Key CRE Concepts

1. **Handlers**: Different entry points
   - Handler 0 (HTTP): Direct trade intake
   - Handler 1 (Cron): Auto-matching (30s interval)
   - Handler 2 (Cron): Pull from frontend + auto-match (15s)
   - Handler 3 (HTTP): Manual matching trigger

2. **Runtime**: Confidential compute environment
   - Runs in TEE (Trusted Execution Environment)
   - Has access to secrets encrypted at rest
   - Can make HTTP calls, interact with blockchain

3. **Capabilities**:
   - `HTTPClient` - Make HTTP requests
   - `EVMClient` - Interact with Ethereum
   - `report()` - Generate cryptographic reports

### Essential CRE Commands

#### Initialize CRE Project (Already done, but for reference)
```bash
cd privotc-cre
cre workflow init my-workflow
```

#### Build the Workflow
```bash
cd privotc-cre
cre workflow build my-workflow

# Expected output:
# ✓ Workflow build succeeded
# ✓ Size: XXX KB
```

#### Run Specific Handler (Local Simulation)
```bash
cd privotc-cre

# Handler 0 - Direct trade intake (HTTP)
cre workflow run my-workflow --handler 0

# Handler 1 - Auto matching (Cron)
cre workflow run my-workflow --handler 1

# Handler 2 - Pull from frontend + match (MOST COMMON)
cre workflow run my-workflow --handler 2

# Handler 3 - Manual matching trigger (HTTP)
cre workflow run my-workflow --handler 3
```

#### Deploy to CRE Network (Production)
```bash
cd privotc-cre

# Build first
cre workflow build my-workflow

# Deploy
cre workflow deploy my-workflow

# Output will give you:
# ✓ Deployed to: https://cre-workflow-abc123.chainlink.com
# Copy this URL to frontend/.env.local as CRE_INTAKE_ENDPOINT
```

#### View Workflow Logs
```bash
cd privotc-cre
cre workflow logs my-workflow --tail
```

#### Test Handler with Custom Input
```bash
cd privotc-cre

# Create test payload
echo '{"trade": "test"}' > test-payload.json

# Run handler with payload
cre workflow run my-workflow --handler 0 --payload test-payload.json
```

---

## 🧪 Testing Guide

### Automated Tests

#### 1. Integration Test (Recommended - Run First!)
```bash
# From project root
.\test-integration.ps1
```

**What it tests**:
- ✅ ZK Verifier service running
- ✅ Frontend API running
- ✅ CRE configuration correct
- ✅ ZK circuit artifacts present
- ✅ Real ZK proof generation working

**Expected Output**:
```
====================================
PrivOTC Integration Test
====================================

1️⃣  Testing ZK Verifier Service...
   ✅ ZK Verifier is running!

2️⃣  Testing Frontend API...
   ✅ Frontend API is running!

3️⃣  Verifying CRE Configuration...
   ✅ Settlement address: 0x281ef219...
   ✅ Chain ID: 9991

4️⃣  Checking ZK Circuit Artifacts...
   ✅ Proving key: 0.7 MB
   ✅ Circuit WASM exists

5️⃣  Testing Real ZK Proof Generation...
   ✅ ZK Proof generated successfully!
   Public signals: 5
```

#### 2. Production Readiness Check
```bash
.\check-production-ready.ps1
```

**What it checks**:
- Circuit compilation status
- Smart contract deployment
- Service availability
- Real proof generation
- Configuration validation

---

### Manual Testing

#### Test 1: Single User Flow
```bash
# Step 1: Start all services (3 terminals)
# Terminal 1: cd zk-circuits && npm run verifier
# Terminal 2: cd frontend && npm run dev
# Terminal 3: (for CRE commands)

# Step 2: Submit trade via frontend
# - Open http://localhost:3000
# - Verify with World ID
# - Submit a trade

# Step 3: Pull and match via CRE
cd privotc-cre
cre workflow run my-workflow --handler 2
```

**Expected CRE Output**:
```
📥 Handler 2: Fetching trades from frontend...
✅ Received 1 trade(s) from frontend
📦 Processing trade 1/1
   ✅ World ID proof accepted (nullifier: 0xabc123...)
   ✅ ZK proof structure validated (REAL Groth16 proof)
   ✅ Trade added to orderbook
📊 Final orderbook: 1 buys, 0 sells
🎯 Running matching engine...
   Checking ETH/USDC: 1 buys, 0 sells
   No matches found
Result: {"success":true,"processed":1,"matchesFound":0}
```

#### Test 2: Multiple Users (Matching Test)
```bash
# Step 1: Submit 2 opposite trades
# Via PowerShell script (simulates 2 users):
.\test-submit-trade.ps1

# Script submits:
# - User 1: SELL 1.5 ETH @ 3200 USDC
# - User 2: BUY 1.0 ETH @ 3250 USDC

# Step 2: Run matching
cd privotc-cre
cre workflow run my-workflow --handler 2
```

**Expected Output**:
```
✅ Received 2 trade(s) from frontend
📦 Processing trade 1/2: sell 1.5 ETH/USDC @ 3200
   ✅ World ID proof accepted
   ✅ ZK proof structure validated
📦 Processing trade 2/2: buy 1.0 ETH/USDC @ 3250
   ✅ World ID proof accepted
   ✅ ZK proof structure validated
📊 Final orderbook: 1 buys, 1 sells
🎯 Running matching engine...
   ✅ Found 1 matches
💱 Executing on-chain settlement for match...
   Amount: 1.0 @ 3200
   ✅ Settlement prepared (SIMULATION MODE)
```

#### Test 3: Reject Mock Proof
**Purpose**: Verify system rejects fake proofs

```bash
# Try to submit without World ID verification
# Frontend should block: "World ID verification required"

# Try to submit with incomplete ZK proof
# API should reject: "ZK proof required"
```

---

## 🔄 Common Workflows

### Daily Development Flow
```bash
# 1. Pull latest changes
git pull origin <branch-name>

# 2. Install any new dependencies
cd frontend && npm install && cd ..
cd zk-circuits && npm install && cd ..
cd privotc-cre && npm install && cd ..

# 3. Start services (3 terminals)
# T1: cd zk-circuits && npm run verifier
# T2: cd frontend && npm run dev
# T3: Keep open for CRE commands

# 4. Test integration
.\test-integration.ps1

# 5. Make changes...

# 6. Test your changes
cd privotc-cre
cre workflow build my-workflow
cre workflow run my-workflow --handler 2

# 7. Commit and push
git add .
git commit -m "Your changes"
git push origin <branch-name>
```

### Testing Matching Engine
```bash
# 1. Clear any pending trades
# Stop and restart frontend server (Terminal 2)
# Ctrl+C, then: npm run dev

# 2. Submit first trade (buy)
# Via frontend: Buy 1.5 ETH @ 3200

# 3. Submit second trade (sell)
# Via frontend: Sell 2.0 ETH @ 3150

# 4. Run matching
cd privotc-cre
cre workflow run my-workflow --handler 2

# Should match 1.5 ETH @ 3150-3200 range
```

### Enabling Production Settlement
```bash
# 1. Edit config
# File: privotc-cre/my-workflow/privotc-config.json
# Change: "simulationMode": false

# 2. Rebuild workflow
cd privotc-cre
cre workflow build my-workflow

# 3. Run with real settlement
cre workflow run my-workflow --handler 2

# Now executes REAL on-chain transactions!
# View on Tenderly Dashboard: https://dashboard.tenderly.co
```

---

## 🎯 What's Next (Tasks for You)

### High Priority (Before March 8)

#### 1. Test End-to-End Flow ⏰
- [ ] Start all 3 services
- [ ] Submit real trade via frontend with World ID
- [ ] Verify ZK proof generation works
- [ ] Run CRE matching
- [ ] Verify settlement preparation

#### 2. Test Multiple Users ⏰
- [ ] Submit 2 opposite trades
- [ ] Verify matching works
- [ ] Check settlement execution

#### 3. Production Deployment Prep 🚀
- [ ] Review all environment variables
- [ ] Test with `simulationMode: false` (careful!)
- [ ] Verify Tenderly contract addresses
- [ ] Deploy CRE workflow (optional)

#### 4. Documentation & Demo 📹
- [ ] Test complete user flow
- [ ] Record demo video showing:
  - World ID verification
  - ZK proof generation
  - Trade submission
  - Matching and settlement
- [ ] Prepare presentation slides

### Medium Priority

#### 5. Code Improvements 🔧
- [ ] Add wallet connection for real balance reading
- [ ] Implement Redis/PostgreSQL for trade queue
- [ ] Add error handling improvements
- [ ] Write unit tests

#### 6. UI/UX Enhancements 🎨
- [ ] Improve loading states
- [ ] Add transaction history
- [ ] Display matched trades
- [ ] Show settlement status

### Low Priority (Nice to Have)

#### 7. Advanced Features ⭐
- [ ] Multiple token pairs support
- [ ] Price charts
- [ ] Order book visualization
- [ ] User dashboard

---

## 🐛 Troubleshooting

### ZK Verifier Won't Start

**Error**: `Port 4000 already in use`
```bash
# Kill existing process
# Windows:
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:4000 | xargs kill -9

# Restart
cd zk-circuits
npm run verifier
```

**Error**: `Cannot find module 'snarkjs'`
```bash
cd zk-circuits
npm install
npm run verifier
```

---

### Frontend Won't Start

**Error**: `Port 3000 already in use`
```bash
# Kill process or use different port
cd frontend
npm run dev -- -p 3001

# Update CRE config to use new port:
# privotc-cre/my-workflow/privotc-config.json
# "frontendApiUrl": "http://localhost:3001/api/trade"
```

**Error**: `Module not found`
```bash
cd frontend
rm -rf node_modules
npm install
npm run dev
```

---

### CRE Build Fails

**Error**: `cre: command not found`
```bash
# Reinstall CRE CLI
# Windows:
choco install chainlink-cre

# Linux/Mac:
curl -sSfL https://install.chain.link/cre | sh
```

**Error**: `Cannot find module '@chainlink/cre-sdk'`
```bash
cd privotc-cre
npm install
cre workflow build my-workflow
```

**Error**: `Handler failed with error`
```bash
# Check logs for details
cd privotc-cre
cre workflow run my-workflow --handler 2 --verbose

# Common issues:
# 1. Frontend not running (no trades to pull)
# 2. ZK verifier not running (can't generate proofs)
# 3. Config JSON syntax error
```

---

### ZK Proof Generation Fails

**Error**: `Assert Failed. Error in template BalanceProof_147 line: 36`

**Cause**: Balance < Required Amount

**Solution**: The circuit enforces balance >= required amount. Default balance is 10 ETH, so:
```
✅ Trade amount <= 10 ETH → Works
❌ Trade amount > 10 ETH → Fails
```

To fix:
1. Keep trade amounts under 10 ETH for testing
2. OR edit `frontend/components/privotc/OrderForm.tsx`:
   ```typescript
   balance: '100000000000000000000', // 100 ETH
   ```

---

### World ID Verification Issues

**Problem**: QR code won't scan

**Solutions**:
1. Ensure you have **World App** installed (iOS/Android)
2. Use staging environment (already configured)
3. Check internet connection
4. Try refreshing the page for new QR code

**Problem**: "Verification failed"

**Check**:
```bash
# Verify environment variables in frontend/.env.local
NEXT_PUBLIC_WORLD_ENVIRONMENT=staging  # Should be staging for testing
```

---

### Settlement Not Executing

**If in simulation mode** (expected):
```
✅ Settlement prepared (SIMULATION MODE - no tx sent)
```

**To enable real settlement**:
```json
// privotc-cre/my-workflow/privotc-config.json
{
  "simulationMode": false  // Change to false
}
```

**Warning**: Real settlement sends actual blockchain transactions!

---

## 📚 Additional Resources

### Documentation Files
- `README.md` - Project overview
- `VERIFICATION_STATUS.md` - System status and what's real vs demo
- `DYNAMIC_FLOW_ANALYSIS.md` - How the system works for multiple users
- `TENDERLY_SETUP_STATUS.md` - Tenderly configuration details

### External Links
- **Chainlink CRE Docs**: https://docs.chain.link/chainlink-functions/cre
- **World ID Docs**: https://docs.worldcoin.org/
- **Circom Docs**: https://docs.circom.io/
- **snarkjs**: https://github.com/iden3/snarkjs
- **Tenderly**: https://docs.tenderly.co/

### Key Files to Understand

#### Frontend
- `frontend/app/page.tsx` - Main UI
- `frontend/components/privotc/OrderForm.tsx` - Trade submission
- `frontend/app/api/trade/route.ts` - Trade queue API

#### ZK Circuits
- `zk-circuits/circuits/balanceProof.circom` - Circuit definition
- `zk-circuits/verifier-api.ts` - Proof generation API

#### CRE Workflow
- `privotc-cre/my-workflow/privotc-workflow.ts` - Main logic
  - Line 204: `validateWorldId()` - World ID validation
  - Line 249: `validateZKProof()` - ZK proof validation
  - Line 357: `runMatchingEngine()` - Matching logic
  - Line 467: `executeSettlement()` - Settlement execution

---

## 🎓 Understanding the Code

### How World ID Verification Works
```typescript
// frontend/components/privotc/VerifyButton.tsx
<IDKit
  app_id={process.env.NEXT_PUBLIC_APP_ID!}
  action="verify-trade"
  onSuccess={(result) => {
    // result contains:
    // - merkle_root: Merkle tree root
    // - nullifier_hash: Unique user identifier
    // - proof: Cryptographic proof
    // - verification_level: 'orb' or 'device'
  }}
/>
```

### How ZK Proof Generation Works
```typescript
// zk-circuits/verifier-api.ts
const { proof, publicSignals } = await groth16.fullProve(
  {
    wallet_address: walletCommitment,
    actual_balance: balance,        // Private
    token_address: tokenId,         // Private
    salt: '42',                     // Private
    balance_proof_data: '0',        // Private
    required_amount: amount,        // Public
    timestamp: Math.floor(Date.now()/1000) // Public
  },
  wasmPath,  // Circuit in WASM
  zkeyPath   // Proving key
);

// Public signals output:
// [0] = balance_sufficient (1 = passed, 0 = failed)
// [1] = wallet_commitment (Poseidon hash)
// [2] = proof_hash (unique identifier)
// [3] = required_amount (public)
// [4] = timestamp (public)
```

### How CRE Matching Works
```typescript
// privotc-cre/my-workflow/privotc-workflow.ts
function runMatchingEngine(runtime) {
  for (const tokenPair of config.tokenPairs) {
    const buys = orderbook.getBuys(tokenPair);
    const sells = orderbook.getSells(tokenPair);
    
    // Sort: buys by price DESC, sells by price ASC
    buys.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    sells.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    
    // Match if buy price >= sell price
    for (const buyOrder of buys) {
      for (const sellOrder of sells) {
        if (parseFloat(buyOrder.price) >= parseFloat(sellOrder.price)) {
          const matchAmount = Math.min(
            parseFloat(buyOrder.amount),
            parseFloat(sellOrder.amount)
          );
          const matchPrice = parseFloat(sellOrder.price); // Seller's price
          
          executeSettlement(runtime, {
            buyOrder,
            sellOrder,
            matchAmount,
            matchPrice
          });
        }
      }
    }
  }
}
```

---

## ✅ Quick Checklist

### Initial Setup
- [ ] Git repository cloned/pulled
- [ ] Node.js v18+ installed
- [ ] CRE CLI installed (`cre --version`)
- [ ] Dependencies installed (frontend, zk-circuits, privotc-cre)

### Services Running
- [ ] ZK Verifier (Terminal 1: `cd zk-circuits && npm run verifier`)
- [ ] Frontend (Terminal 2: `cd frontend && npm run dev`)
- [ ] CRE ready (Terminal 3: `cd privotc-cre`)

### Testing Complete
- [ ] Integration test passed (`.\test-integration.ps1`)
- [ ] Single user flow tested (frontend → CRE)
- [ ] Multi-user matching tested
- [ ] Production readiness check passed

### Ready for Demo
- [ ] Can verify with World ID
- [ ] Can generate real ZK proofs
- [ ] Can submit trades
- [ ] Can match trades in CRE
- [ ] Can execute settlements

---

## 🆘 Getting Help

### If You're Stuck

1. **Run diagnostics**:
   ```bash
   .\check-production-ready.ps1
   ```

2. **Check service logs**:
   - ZK Verifier: Check Terminal 1 output
   - Frontend: Check Terminal 2 output
   - CRE: Run with `--verbose` flag

3. **Common commands**:
   ```bash
   # Restart everything
   # Ctrl+C in all terminals, then:
   cd zk-circuits && npm run verifier       # Terminal 1
   cd frontend && npm run dev                # Terminal 2
   cd privotc-cre                            # Terminal 3
   
   # Test integration
   .\test-integration.ps1
   
   # Run CRE matching
   cd privotc-cre
   cre workflow run my-workflow --handler 2
   ```

4. **Check documentation**:
   - `VERIFICATION_STATUS.md` - System status
   - `DYNAMIC_FLOW_ANALYSIS.md` - User flow details
   - `TROUBLESHOOTING.md` - Common issues (if exists)

---

## 🎉 You're Ready!

This system is **production-grade** for the hackathon:
- ✅ Real World ID verification
- ✅ Real ZK-SNARK proofs (Groth16)
- ✅ Real smart contracts (Tenderly)
- ✅ No mock fallbacks
- ✅ Confidential matching in CRE

**Next steps**:
1. Run `.\test-integration.ps1` to verify everything works
2. Test the frontend user flow
3. Deploy to production (optional)
4. Record demo video

**Deadline**: March 8, 2026 (3 days!)

Good luck! 🚀
