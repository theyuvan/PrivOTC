# 🚀 Dev 3 Quick Start — PrivOTC ZK + CRE Integration

**Last Updated:** March 4, 2026  
**Your Role:** Chainlink CRE Workflows + ZK Balance Proofs

---

## ✅ What's Ready

You now have a complete implementation:

```
chain.link/
├── zk-circuits/          ✅ Circom balance proof circuit
│   ├── circuits/balanceProof.circom
│   ├── scripts/         (compile, setup, generate-verifier)
│   └── package.json
│
├── cre/                  ✅ TypeScript CRE workflows
│   ├── workflows/
│   │   ├── trade-intake.ts      (World ID + ZK validation)
│   │   ├── matching-engine.ts   (Confidential matching)
│   │   └── settlement.ts        (On-chain execution)
│   ├── src/
│   │   ├── zk/verifier.ts       (snarkjs verification)
│   │   ├── world-id/validator.ts
│   │   └── orderbook/confidential.ts
│   └── package.json
│
└── app/                  ✅ World Mini App (Dev 2's work)
    └── .env.local        ✅ World ID credentials
```

---

## 🎯 Implementation Steps

### Phase 1: Setup ZK Circuits (1-2 hours)

```powershell
cd C:\Users\thame\chain.link\zk-circuits

# Install dependencies
npm install

# Compile circuit (in WSL)
wsl bash -c "cd /mnt/c/Users/thame/chain.link/zk-circuits && npm run compile"

# Run trusted setup (generates proving/verification keys)
wsl bash -c "cd /mnt/c/Users/thame/chain.link/zk-circuits && npm run setup"

# Generate TypeScript verifier
wsl bash -c "cd /mnt/c/Users/thame/chain.link/zk-circuits && npm run generate-verifier"
```

**Expected output:**
- ✅ `build/balanceProof.r1cs` (constraint system)
- ✅ `build/balanceProof_final.zkey` (proving key)
- ✅ `build/verification_key.json` (for CRE workflows)

**Verify:**
```powershell
# Check verification key exists
Test-Path "C:\Users\thame\chain.link\zk-circuits\build\verification_key.json"
# Should return: True
```

---

### Phase 2: Setup CRE Workflows (30 min)

```powershell
cd C:\Users\thame\chain.link\cre

# Install dependencies
npm install

# Configure environment
cp .env.example .env
```

**Edit `.env`:** (Use your favorite editor)

```bash
# Your wallet
CRE_WORKFLOW_OWNER_ADDRESS=0xYourAddress

# Generate AES key
AES_ENCRYPTION_KEY=$(openssl rand -hex 32)  # Run in WSL

# World ID (already have staging credentials)
WORLD_ID_API_KEY=  # Optional, staging works without it

# Get from Dev 1 after contract deployment
ETHEREUM_MAINNET_RPC=  # Tenderly fork RPC
BASE_MAINNET_RPC=      # Tenderly fork RPC
ESCROW_VAULT_ADDRESS=
OTC_SETTLEMENT_ADDRESS=
PROOF_VERIFIER_ADDRESS=
```

**Build:**
```powershell
npm run build
```

---

### Phase 3: Test Locally (30 min)

Before deploying to CRE, test the ZK verifier:

```powershell
cd C:\Users\thame\chain.link\cre

# Test verifier loads correctly
node --loader ts-node/esm -e "
import { zkVerifier } from './src/zk/verifier.ts';
console.log('Verifier loaded:', zkVerifier ? '✅' : '❌');
"
```

**Manual test trade intake:**

Create `test-intake.ts`:
```typescript
import { handleTradeIntake } from './workflows/trade-intake';

const mockRequest = {
  worldIdProof: {
    merkle_root: "0x1234...",
    nullifier_hash: "0xabcd...",
    proof: "0x...",
    verification_level: "orb"
  },
  zkProof: {
    proof: {
      pi_a: ["1", "2"],
      pi_b: [["3", "4"], ["5", "6"]],
      pi_c: ["7", "8"],
      protocol: "groth16",
      curve: "bn128"
    },
    publicSignals: ["1", "123456", "789012", "1000000000000000000", "1709654400"]
  },
  trade: {
    side: "buy" as const,
    tokenPair: "ETH/USDC",
    amount: "1.0",
    price: "2000"
  }
};

const result = await handleTradeIntake(mockRequest);
console.log('Result:', result);
```

Run:
```powershell
node --loader ts-node/esm test-intake.ts
```

---

### Phase 4: Deploy to CRE (1 hour)

**Prerequisites:**
1. ✅ CRE CLI installed (`cre --version` should show v1.2.0)
2. ✅ Logged in (`cre login`)
3. ❌ **Early Access approval** (apply at https://chain.link/cre)
4. ❌ Contract addresses from Dev 1

**Once you have Early Access:**

```powershell
cd C:\Users\thame\chain.link\cre

# Deploy workflows to CRE platform
cre workflow deploy --target production-settings

# Workflows will be deployed to:
# - https://cre.chainlink.io/workflows/privotc/trade-intake
# - https://cre.chainlink.io/workflows/privotc/matching-engine
# - https://cre.chainlink.io/workflows/privotc/settlement
```

**Save endpoints:**
```powershell
# CRE will output endpoint URLs - save them!
# Update app/.env.local with:
CRE_INTAKE_ENDPOINT=<from deployment output>
CRE_CALLBACK_ENDPOINT=<from deployment output>
```

---

### Phase 5: Integrate with Frontend (30 min)

**Coordinate with Dev 2:**

1. Share CRE endpoints (from Phase 4)
2. Update `app/.env.local`:
   ```bash
   CRE_INTAKE_ENDPOINT=https://cre.chainlink.io/workflows/privotc/trade-intake
   ```

3. Dev 2 needs to add ZK proof generation to `app/components/OrderForm.tsx`

**Example integration for Dev 2:**

```typescript
// In OrderForm.tsx, before submitting trade:

// 1. Generate ZK proof (client-side)
import { generateBalanceProof } from '@/lib/zk-proof-generator';

const zkProof = await generateBalanceProof({
  walletAddress: address,
  actualBalance: userBalance,
  tokenAddress: selectedToken,
  requiredAmount: calculateRequired(amount, price, side),
  timestamp: Math.floor(Date.now() / 1000)
});

// 2. Submit to CRE
const response = await fetch(process.env.CRE_INTAKE_ENDPOINT, {
  method: 'POST',
  body: JSON.stringify({
    worldIdProof: proof,
    zkProof: zkProof,
    trade: { side, tokenPair, amount, price }
  })
});
```

---

## 🔍 Verification Checklist

Before going live, verify:

### ZK Circuits
- [ ] Circuit compiles without errors
- [ ] Trusted setup generates verification key
- [ ] Test proof generation works (see zk-circuits/README.md)
- [ ] Verification key loads in CRE workflows

### CRE Workflows
- [ ] All dependencies installed (`npm install` successful)
- [ ] TypeScript compiles (`npm run build` successful)
- [ ] Environment variables configured (`.env` file)
- [ ] Contract addresses from Dev 1
- [ ] Early Access approval obtained
- [ ] Workflows deploy successfully

### Integration
- [ ] CRE endpoints shared with Dev 2
- [ ] Frontend updated with endpoints
- [ ] End-to-end test: Submit trade → See in orderbook
- [ ] Test matching: Submit buy + sell → Settlement executes
- [ ] Test World ID validation
- [ ] Test ZK proof validation

---

## 🐛 Troubleshooting

### "Verification key not found"
```powershell
# Ensure circuits are compiled
cd C:\Users\thame\chain.link\zk-circuits
wsl bash -c "cd /mnt/c/Users/thame/chain.link/zk-circuits && npm run setup"
```

### "Contract addresses not configured"
- Wait for Dev 1 to deploy contracts
- Get RPC URLs and contract addresses
- Update `cre/.env`

### "CRE deployment failed"
- Check Early Access approval status
- Verify `cre login` is active
- Ensure `project.yaml` is valid
- Check CRE CLI logs

### "World ID validation failed"
- Verify staging credentials in `app/.env.local`
- Check `WORLD_ID_APP_ID` matches between app and CRE
- Test with real World ID proof from app

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User (World Mini App)                     │
│  • Generates ZK proof (client-side)                          │
│  • Submits World ID + ZK proof + Trade intent                │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS POST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              CRE Workflow 1: Trade Intake (TEE)              │
│  1. Validate World ID (sybil resistance)                     │
│  2. Verify ZK proof (balance >= required, private)           │
│  3. Add to confidential orderbook (in-memory)                │
└────────────────────────┬────────────────────────────────────┘
                         │ Stored in TEE
                         ▼
┌─────────────────────────────────────────────────────────────┐
│          CRE Workflow 2: Matching Engine (Cron 30s)          │
│  • Find matching buy/sell orders                             │
│  • Only matched pairs revealed                               │
│  • Unmatched orders stay private                             │
└────────────────────────┬────────────────────────────────────┘
                         │ If match found
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           CRE Workflow 4: Settlement (On-chain)              │
│  1. Record ZK proofs → ProofVerifier.sol                     │
│  2. Execute settlement → OTCSettlement.sol                   │
│  3. Send notifications to both parties                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Success Criteria

**You're done when:**
1. ✅ ZK circuits compile and generate valid proofs
2. ✅ CRE workflows deploy to platform
3. ✅ Frontend can submit trades with ZK proofs
4. ✅ Matching engine finds and settles trades
5. ✅ End-to-end test: Real user → Trade execution

---

## 📚 Key Files Reference

**ZK Circuit:**
- `zk-circuits/circuits/balanceProof.circom` — Main circuit logic
- `zk-circuits/build/verification_key.json` — Used by CRE workflows

**CRE Workflows:**
- `cre/workflows/trade-intake.ts` — Entry point for trades
- `cre/src/zk/verifier.ts` — ZK proof verification
- `cre/src/world-id/validator.ts` — World ID validation
- `cre/src/orderbook/confidential.ts` — Private matching logic

**Configuration:**
- `cre/project.yaml` — CRE project config
- `cre/secrets.yaml` — Vault secrets
- `cre/.env` — Environment variables

---

## 🤝 Team Coordination

**Need from Dev 1:**
- Tenderly Virtual TestNet RPC URLs
- Deployed contract addresses:
  - `ESCROW_VAULT_ADDRESS`
  - `OTC_SETTLEMENT_ADDRESS`
  - `PROOF_VERIFIER_ADDRESS`

**Provide to Dev 2:**
- CRE workflow endpoints (after deployment)
- ZK proof generation library (if needed)
- World ID action ID: `submit-trade`

---

## 🎓 Additional Resources

- **Implementation Plan:** [DEV3_IMPLEMENTATION_PLAN.md](../DEV3_IMPLEMENTATION_PLAN.md)
- **CRE Docs:** https://docs.chain.link/cre
- **Circom Tutorial:** https://docs.circom.io/getting-started/
- **snarkjs Guide:** https://github.com/iden3/snarkjs

---

**Questions?** Review the detailed guides or check with your team!

Good luck, Dev 3! 🚀
