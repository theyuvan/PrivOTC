# Testing Guide for Dev 3 — PrivOTC ZK + CRE

This guide shows how to test each component before deploying to production.

## 🧪 Test 1: ZK Circuit Compilation

**Location:** `zk-circuits/`

**Test the circuit compiles correctly:**

```bash
cd zk-circuits

# Should complete without errors
npm run compile

# Verify outputs
ls -lh build/balanceProof.r1cs
ls -lh build/balanceProof_js/
```

**Expected:** R1CS file created, witness generator created

---

## 🧪 Test 2: ZK Proof Generation

**Generate a test proof:**

```bash
cd zk-circuits

# Generate witness from test input
cd build/balanceProof_js/
node generate_witness.js balanceProof.wasm ../../input/test-balance.json witness.wtns

# Generate proof
snarkjs groth16 prove ../balanceProof_final.zkey witness.wtns proof.json public.json

# Verify proof
snarkjs groth16 verify ../verification_key.json public.json proof.json
```

**Expected output:**
```
[INFO]  snarkJS: OK!
```

**What this proves:**
- Actual balance: 1 ETH (1000000000000000000 wei)
- Required balance: 0.5 ETH (500000000000000000 wei)
- Result: balance_sufficient = 1 ✅

---

## 🧪 Test 3: ZK Verifier in Node.js

**Create:** `cre/test/test-zk-verifier.ts`

```typescript
import { zkVerifier } from '../src/zk/verifier';
import * as fs from 'fs';

// Load test proof
const proof = JSON.parse(
  fs.readFileSync('../zk-circuits/build/balanceProof_js/proof.json', 'utf-8')
);

const publicSignals = JSON.parse(
  fs.readFileSync('../zk-circuits/build/balanceProof_js/public.json', 'utf-8')
);

const result = await zkVerifier.verifyProof({
  proof,
  publicSignals
});

console.log('Verification result:', result);
console.assert(result.valid === true, 'Proof should be valid');
console.assert(result.sufficient === true, 'Balance should be sufficient');
console.log('✅ All assertions passed');
```

**Run:**
```bash
cd cre
node --loader ts-node/esm test/test-zk-verifier.ts
```

**Expected output:**
```
✅ Loaded verification key from ../zk-circuits/build/verification_key.json
Verification result: {
  valid: true,
  sufficient: true,
  walletCommitment: '123456...',
  proofHash: '789012...'
}
✅ All assertions passed
```

---

## 🧪 Test 4: World ID Validator

**Create:** `cre/test/test-world-id.ts`

```typescript
import { worldIdValidator } from '../src/world-id/validator';

// Test with staging credentials
const testProof = {
  merkle_root: "0x1234567890123456789012345678901234567890123456789012345678901234",
  nullifier_hash: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd",
  proof: "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  verification_level: "orb"
};

const result = await worldIdValidator.validateProof(testProof);
console.log('World ID validation:', result);

// This will fail with test data (that's expected)
// Use real proof from World Mini App for actual testing
```

**Run:**
```bash
cd cre
node --loader ts-node/esm test/test-world-id.ts
```

**Note:** Real World ID proofs must come from the World Mini App. This test just verifies the validator structure works.

---

## 🧪 Test 5: Confidential Orderbook

**Create:** `cre/test/test-orderbook.ts`

```typescript
import { orderbook } from '../src/orderbook/confidential';

// Add buy order
const buyIntent = {
  id: 'buy-1',
  walletCommitment: '0x1111',
  proofHash: '0xaaaa',
  side: 'buy' as const,
  tokenPair: 'ETH/USDC',
  amount: '1.0',
  price: '2100',
  timestamp: Date.now(),
  worldIdNullifier: 'nullifier-buyer'
};

const buyResult = orderbook.addIntent(buyIntent);
console.log('Buy order added:', buyResult);

// Add sell order (matching)
const sellIntent = {
  id: 'sell-1',
  walletCommitment: '0x2222',
  proofHash: '0xbbbb',
  side: 'sell' as const,
  tokenPair: 'ETH/USDC',
  amount: '1.0',
  price: '2000', // Lower than buy price → match!
  timestamp: Date.now() + 1000,
  worldIdNullifier: 'nullifier-seller'
};

const sellResult = orderbook.addIntent(sellIntent);
console.log('Sell order added:', sellResult);

// Check orderbook depth
const depth = orderbook.getDepth('ETH/USDC');
console.log('Orderbook depth:', depth);

// Find matches
const matches = orderbook.findMatches('ETH/USDC');
console.log('Matches found:', matches.length);
console.assert(matches.length === 1, 'Should find 1 match');

if (matches.length > 0) {
  console.log('Match details:', {
    amount: matches[0].matchAmount,
    price: matches[0].matchPrice,
    buyer: matches[0].buyOrder.walletCommitment,
    seller: matches[0].sellOrder.walletCommitment
  });
}

console.log('✅ Orderbook test passed');
```

**Run:**
```bash
cd cre
node --loader ts-node/esm test/test-orderbook.ts
```

**Expected output:**
```
Buy order added: { success: true }
Sell order added: { success: true }
Orderbook depth: { buys: 1, sells: 1 }
🎯 Found 1 matches for ETH/USDC
Matches found: 1
Match details: {
  amount: '1.0',
  price: '2000',
  buyer: '0x1111',
  seller: '0x2222'
}
✅ Orderbook test passed
```

---

## 🧪 Test 6: Trade Intake Workflow (Mock)

**Create:** `cre/test/test-trade-intake.ts`

```typescript
import { handleTradeIntake } from '../workflows/trade-intake';

// Mock request (with fake proofs)
const mockRequest = {
  worldIdProof: {
    merkle_root: "0x1234",
    nullifier_hash: "0xabcd",
    proof: "0xdeadbeef",
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
    // Public signals: [balanceSufficient, walletCommitment, proofHash, requiredAmount, timestamp]
    publicSignals: [
      "1",  // balance sufficient
      "123456789012345678901234567890",  // wallet commitment
      "987654321098765432109876543210",  // proof hash
      "2000000000",  // required amount (in wei)
      Math.floor(Date.now() / 1000).toString()  // current timestamp
    ]
  },
  trade: {
    side: 'buy' as const,
    tokenPair: 'ETH/USDC',
    amount: '1.0',
    price: '2000'
  }
};

console.log('Testing trade intake with mock data...');
const result = await handleTradeIntake(mockRequest);
console.log('Result:', result);

// This will fail World ID validation (expected with mock data)
// But it tests the workflow structure
```

**Run:**
```bash
cd cre
node --loader ts-node/esm test/test-trade-intake.ts
```

**Expected:** World ID validation fails (because we're using mock data). That's fine — this tests the workflow structure.

---

## 🧪 Test 7: End-to-End (with Real World ID)

**Prerequisites:**
- World Mini App running (`cd app && npm run dev`)
- User verified with World ID
- CRE workflows deployed (or simulated)

**Steps:**

1. **Frontend:** User submits trade via World Mini App
2. **Frontend:** Generates ZK proof (needs implementation)
3. **Frontend:** Calls CRE intake endpoint
4. **CRE:** Validates World ID ✅
5. **CRE:** Validates ZK proof ✅
6. **CRE:** Adds to orderbook ✅
7. **CRE:** Matching engine finds matches (if any)
8. **CRE:** Settlement executes on-chain

**Test with cURL:**

```bash
# Get real World ID proof from app first
# Then generate real ZK proof
# Then:

curl -X POST https://cre.chainlink.io/workflows/privotc/trade-intake \
  -H "Content-Type: application/json" \
  -d '{
    "worldIdProof": { ... real proof ... },
    "zkProof": { ... real proof ... },
    "trade": {
      "side": "buy",
      "tokenPair": "ETH/USDC",
      "amount": "1.0",
      "price": "2000"
    }
  }'
```

**Expected response:**
```json
{
  "success": true,
  "intentId": "0x...",
  "walletCommitment": "0x..."
}
```

---

## 🧪 Test 8: CRE Simulation (Local)

Before deploying, simulate workflows locally:

```bash
cd cre

# Simulate trade intake
cre workflow simulate --workflow trade-intake --target development-settings

# Input test data when prompted
```

**Expected:** Workflow runs in local simulation mode

---

## 📊 Test Summary

| Test | Component | Status | Duration |
|------|-----------|--------|----------|
| 1 | Circuit Compilation | ⏳ | 2-3 min |
| 2 | Proof Generation | ⏳ | 5-10 min |
| 3 | ZK Verifier | ⏳ | 1 min |
| 4 | World ID | ⏳ | 1 min |
| 5 | Orderbook | ⏳ | 1 min |
| 6 | Trade Intake | ⏳ | 2 min |
| 7 | End-to-End | ⏳ | 10 min |
| 8 | CRE Simulation | ⏳ | 5 min |

**Run all tests:**
```bash
# In WSL
cd /mnt/c/Users/thame/chain.link
bash run-all-tests.sh
```

---

## 🐛 Common Issues

### "Verification key not found"
- Run: `cd zk-circuits && npm run setup`
- Check: `build/verification_key.json` exists

### "World ID validation failed"
- Use real proof from World Mini App
- Check staging credentials in `.env.local`

### "CRE simulation error"
- Verify `project.yaml` syntax
- Check `.env` variables
- Ensure logged in: `cre login`

---

## ✅ Ready for Production

You're ready to deploy when:
- [x] All tests pass
- [x] ZK proofs verify correctly
- [x] Orderbook matching works
- [x] World ID validation succeeds
- [x] Contract addresses from Dev 1
- [x] CRE Early Access approved
- [x] End-to-end test with real user completes

---

**Happy testing! 🧪**
