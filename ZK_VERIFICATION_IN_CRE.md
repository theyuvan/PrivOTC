# 🔐 ALL Ways to Add ZK Verification in CRE + Backend Trigger

## ✅ SUCCESS! You just proved CRE can call localhost!

**What you achieved:**
```
✅ Received trade data from frontend:
   Trade: sell 1.5 ETH/USDC @ 3200
✅ World ID proof accepted
✅ Trade added from frontend | Orderbook depth: 0 buys, 1 sells
```

Now let's add **REAL ZK-SNARK/ZK-STARK verification** + **backend triggering**!

---

## 🎯 Part 1: ALL Ways to Add ZK Verification

### Option 1: Confidential HTTP to ZK Verifier Service ⭐ RECOMMENDED

**Architecture**:
```
CRE Workflow → ConfidentialHTTPClient → ZK Verifier API → Returns verification result
```

**Why this works**:
- ✅ Confidential HTTP capability (available in CRE since Feb 2026)
- ✅ Makes ONE API call (not one per node)
- ✅ Secrets (API keys) stored in Vault DON
- ✅ Response encrypted in TEE
- ✅ Works in BOTH simulation AND production

**Implementation**:

```typescript
import {
  ConfidentialHTTPClient,
  ok,
  json,
  type Runtime,
} from '@chainlink/cre-sdk';

async function validateZKProofReal(
  runtime: Runtime<Config>,
  zkProof: ZKProof
): Promise<{ success: boolean; walletCommitment?: string; reason?: string }> {
  runtime.log('🔐 Verifying ZK proof via Confidential HTTP...');

  // Option A: Call external ZK verifier service
  const confHTTPClient = new ConfidentialHTTPClient();
  
  const response = confHTTPClient
    .sendRequest(runtime, {
      request: {
        url: 'https://your-zk-verifier.com/verify',
        method: 'POST',
        bodyString: JSON.stringify({
          proof: zkProof.proof,
          publicSignals: zkProof.publicSignals,
          verificationKey: 'groth16', // or stark, plonk
        }),
        multiHeaders: {
          'Content-Type': { values: ['application/json'] },
          'Authorization': { values: ['Bearer {{.zkVerifierApiKey}}'] }, // Secret injection!
        },
      },
      vaultDonSecrets: [
        { key: 'zkVerifierApiKey', owner: runtime.config.owner }
      ],
    })
    .result();

  if (!ok(response)) {
    return { success: false, reason: `ZK verifier returned ${response.statusCode}` };
  }

  const result = json(response) as { valid: boolean; walletCommitment: string };
  
  if (!result.valid) {
    return { success: false, reason: 'ZK proof verification failed' };
  }

  runtime.log('✅ ZK proof verified via external service');
  return {
    success: true,
    walletCommitment: result.walletCommitment || zkProof.publicSignals[1],
  };
}
```

**Setup secrets.yaml**:
```yaml
# cre/secrets.yaml
secretsNames:
  zk_verifier_api_key:
    - ZK_VERIFIER_API_KEY
```

**Store secret**:
```bash
# After deploying, add secret to Vault DON via CRE UI
cre secrets upload
```

---

### Option 2: Self-Hosted ZK Verifier (localhost:4000)

**Architecture**:
```
CRE → HTTPClient → localhost:4000/verify → snarkjs.groth16.verify()
```

**Why this works**:
- ✅ YOU control the verification
- ✅ Can use ANY ZK library (snarkjs, circom, noir, etc.)
- ✅ Works in simulation (localhost)
- ✅ FREE (no external API costs)

**Server Setup** (zk-verifier-service.ts):

```typescript
// zk-circuits/verifier-api.ts
import express from 'express';
import { groth16 } from 'snarkjs';
import fs from 'fs';

const app = express();
app.use(express.json());

const verificationKey = JSON.parse(
  fs.readFileSync('./build/verification_key.json', 'utf-8')
);

app.post('/verify', async (req, res) => {
  try {
    const { proof, publicSignals } = req.body;

    const isValid = await groth16.verify(
      verificationKey,
      publicSignals,
      proof
    );

    res.json({
      valid: isValid,
      walletCommitment: publicSignals[1],
      timestamp: Date.now(),
    });
  } catch (error: any) {
    res.status(400).json({ valid: false, error: error.message });
  }
});

app.listen(4000, () => {
  console.log('🔐 ZK Verifier running on http://localhost:4000');
});
```

**Start server**:
```bash
cd zk-circuits
npm install express snarkjs
npx tsx verifier-api.ts
```

**CRE Integration**:
```typescript
const fetchZKVerification = (nodeRuntime: NodeRuntime<Config>) => {
  const httpClient = new HTTPClient();
  const response = httpClient
    .sendRequest(nodeRuntime, {
      url: 'http://localhost:4000/verify',
      method: 'POST',
      bodyString: JSON.stringify({
        proof: zkProof.proof,
        publicSignals: zkProof.publicSignals,
      }),
    })
    .result();

  if (!ok(response)) {
    throw new Error(`ZK verification failed: ${response.statusCode}`);
  }

  return json(response);
};

// Run in node mode
const result = runtime.runInNodeMode(fetchZKVerification, (results) => results[0])().result();
```

---

### Option 3: DECO Privacy-Preserving Oracle 🆕

**What it is**:
- Chainlink's privacy-preserving oracle protocol
- Uses TLS/HTTPS to prove data facts WITHOUT revealing data
- No trusted hardware needed
- Works with ANY web server

**Use cases**:
- Prove "balance >= X" without revealing balance
- Prove "age > 18" without revealing birthdate
- Prove "credit score > 700" without revealing exact score

**From zk.md**:
> DECO allows a user to prove facts about data held by a web server—such as proving they are over 18 or have a certain bank balance—without revealing the actual birth date or account number and without requiring the data source to modify its systems.

**Implementation** (Future/Advanced):
```typescript
// When DECO is available in CRE:
import { DECOClient } from '@chainlink/cre-sdk';

const decoClient = new DECOClient();
const proof = decoClient.proveDataFact({
  url: 'https://bank.com/api/balance',
  statement: 'balance >= 1000',
  credentials: { username, password }, // Kept private in TEE
});

// Verifies without revealing actual balance
if (proof.valid) {
  runtime.log('✅ User has sufficient balance (actual amount hidden)');
}
```

---

### Option 4: Use Existing ZK Rollup Verification

**Architecture**:
```
CRE → EVMClient → Read from ZK Rollup contract → Get verification result
```

**Works with**:
- StarkNet (ZK-STARK)
- ZKSync (ZK-SNARK)
- Polygon zkEVM
- Scroll

**Implementation**:
```typescript
const evmClient = new EVMClient(starknetChainSelector);

// Read from StarkNet verifier contract
const isVerified = evmClient.readContract({
  contractAddress: '0xStarkNetVerifier...',
  abi: verifierABI,
  functionName: 'verifyProof',
  params: [proofHash, publicInputs],
}).result();

if (isVerified) {
  runtime.log('✅ ZK proof verified on-chain via StarkNet');
}
```

---

### Option 5: Hybrid (Current + External Service)

**What you have now**:
```typescript
// Frontend: Real verification using snarkjs
const isValid = await groth16.verify(verificationKey, publicSignals, proof);

// CRE: Structure validation only
if (!zkProof.pi_a || !zkProof.pi_b || !zkProof.pi_c) { ... }
```

**Upgrade to**:
```typescript
// CRE calls external service for REAL verification
const confHTTPClient = new ConfidentialHTTPClient();
const verificationResult = confHTTPClient.sendRequest(...);
```

---

## 🚀 Part 2: Trigger Matching Engine from Backend

### Current Setup (Cron Only):
```typescript
handlers.push(
  cre.handler(
    cron.trigger({ schedule: '*/30 * * * * *' }), // Every 30 seconds
    handleMatchingEngine
  )
);
```

**Problem**: Can only run on schedule, no manual triggering

---

### Solution: Add HTTP Trigger for Matching Engine

**Implementation**:

```typescript
// ===== New Handler: Manual Matching Trigger =====

const handleManualMatch = async (
  runtime: Runtime<Config>,
  payload: HTTPPayload
): Promise<any> => {
  runtime.log('🎯 Manual matching engine triggered via HTTP');

  // Decode request (optional: add auth token validation)
  const requestBody = decodeJson<{ tokenPair?: string; adminKey?: string }>(payload.input);

  // Validate admin key (simple auth)
  if (requestBody.adminKey !== runtime.config.adminApiKey) {
    return {
      statusCode: 401,
      body: { success: false, reason: 'Unauthorized' },
    };
  }

  // Run matching for specific pair or all pairs
  const tokenPairs = requestBody.tokenPair 
    ? [requestBody.tokenPair] 
    : runtime.config.tokenPairs;

  const allMatches: MatchedPair[] = [];

  for (const tokenPair of tokenPairs) {
    runtime.log(`📊 Checking ${tokenPair}...`);
    const depth = orderbook.getDepth(tokenPair);
    
    if (depth.buys === 0 || depth.sells === 0) {
      runtime.log(`   ⏭️  Skipping (no orders)`);
      continue;
    }

    const matches = orderbook.findMatches(tokenPair);
    if (matches.length > 0) {
      runtime.log(`   ✅ Found ${matches.length} matches`);
      allMatches.push(...matches);

      for (const match of matches) {
        executeSettlement(runtime, match);
      }
    }
  }

  return {
    statusCode: 200,
    body: {
      success: true,
      matchesFound: allMatches.length,
      tokenPairs: tokenPairs,
      timestamp: Date.now(),
    },
  };
};

// ===== Update initWorkflow =====

const initWorkflow = (config: Config) => {
  const http = new cre.capabilities.HTTPCapability();
  const cron = new cre.capabilities.CronCapability();

  const handlers = [];

  // Handler 0: Trade intake
  handlers.push(cre.handler(http.trigger({}), handleTradeIntake));

  // Handler 1: Cron matching (every 30s)
  handlers.push(
    cre.handler(
      cron.trigger({ schedule: config.schedule }),
      handleMatchingEngine
    )
  );

  // Handler 2: Frontend integration test
  handlers.push(
    cre.handler(
      cron.trigger({ schedule: '*/15 * * * * *' }),
      handleFetchFromFrontend
    )
  );

  // 🆕 Handler 3: Manual matching trigger (HTTP)
  handlers.push(
    cre.handler(
      http.trigger({}),
      handleManualMatch
    )
  );

  return handlers;
};
```

**Update config**:
```json
{
  "adminApiKey": "your-secret-admin-key-here",
  // ... other config
}
```

---

### How to Trigger from Backend/Frontend:

**Test in Simulation**:
```bash
# Create payload
cat > trigger-match.json << EOF
{
  "adminKey": "your-secret-admin-key-here",
  "tokenPair": "ETH/USDC"
}
EOF

# Trigger matching engine
cre workflow simulate my-workflow --non-interactive --trigger-index 3 --http-payload trigger-match.json --target privotc-staging
```

**From Frontend (after deployment)**:
```typescript
// frontend/app/api/admin/trigger-match/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { adminKey, tokenPair } = await req.json();

  const creEndpoint = process.env.CRE_INTAKE_ENDPOINT; // https://cre-workflow-abc123.chainlink.com

  const response = await fetch(creEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      adminKey,
      tokenPair, // Optional: match specific pair
    }),
  });

  const data = await response.json();
  return NextResponse.json(data);
}
```

**Frontend Button**:
```typescript
// components/AdminPanel.tsx
const triggerMatching = async () => {
  const res = await fetch('/api/admin/trigger-match', {
    method: 'POST',
    body: JSON.stringify({
      adminKey: process.env.NEXT_PUBLIC_ADMIN_KEY,
      tokenPair: 'ETH/USDC', // Or undefined for all pairs
    }),
  });
  
  const result = await res.json();
  console.log(`✅ Matched ${result.matchesFound} trades`);
};
```

---

## 📊 Complete Architecture Summary

### ZK Verification Options:
1. ✅ **Confidential HTTP** → External ZK service (production-grade)
2. ✅ **HTTPClient** → localhost:4000 ZK verifier (testing/simulation)
3. ✅ **DECO** → Privacy-preserving oracle (future/advanced)
4. ✅ **Cross-chain** → ZK Rollup verification (StarkNet, ZKSync)
5. ✅ **Hybrid** → Frontend verifies, CRE validates structure (current)

### Trigger Options:
1. ✅ **Cron** → Automatic every 30s (current)
2. ✅ **HTTP** → Manual trigger from backend/frontend (new!)
3. ✅ **Both** → Auto + Manual combination (recommended)

---

## 🎯 Which Option Should You Use?

### For Hackathon (NOW):
**Option 2** (Self-hosted ZK verifier):
```bash
# Terminal 1: Start ZK verifier
cd zk-circuits
npx tsx verifier-api.ts

# Terminal 2: Start frontend
cd frontend
npm run dev

# Terminal 3: Run CRE with REAL ZK verification
cd privotc-cre
cre workflow simulate my-workflow --non-interactive --trigger-index 2 --target privotc-staging
```

**Result**: Shows "✅ ZK proof verified via localhost:4000" instead of simulation skip!

### For Production (LATER):
**Option 1** (Confidential HTTP):
- Deploy ZK verifier to cloud (Vercel, AWS Lambda, etc.)
- Use Confidential HTTP with Vault DON secrets
- Get encrypted responses in TEE

---

## 🚀 Next Steps

1. **Add localhost ZK verifier** (5 min)
2. **Test with CRE simulation** (2 min)
3. **Add HTTP trigger for matching** (10 min)
4. **Record demo video** showing:
   - Real ZK verification ✅
   - Manual matching trigger ✅
   - Frontend → CRE integration ✅

Let me know which option you want to implement first! 🎉
