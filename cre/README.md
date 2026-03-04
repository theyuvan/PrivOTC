# PrivOTC - Chainlink CRE Workflows

Confidential OTC trading workflows with ZK proof integration.

## 🎯 Architecture

```
User (World Mini App)
    ↓
[Workflow 1] Trade Intake
    - Validates World ID proof
    - Validates ZK balance proof
    - Adds to confidential orderbook
    ↓
[Workflow 2] Matching Engine (Cron: 30s)
    - Finds matching orders (private)
    - Only reveals matched pairs
    ↓
[Workflow 4] Settlement
    - Records proofs on-chain
    - Executes settlement via OTCSettlement
    - Sends notifications
```

## 📁 Project Structure

```
cre/
├── workflows/              # CRE workflow handlers
│   ├── trade-intake.ts    # Workflow 1: Receive & validate trades
│   ├── matching-engine.ts # Workflow 2: Match orders confidentially
│   ├── settlement.ts      # Workflow 4: Execute on-chain settlement
│   └── index.ts           # Export all workflows
├── src/
│   ├── zk/
│   │   ├── verifier.ts    # ZK proof verification (snarkjs)
│   │   └── types.ts       # TypeScript types
│   ├── world-id/
│   │   └── validator.ts   # World ID proof validation
│   ├── orderbook/
│   │   └── confidential.ts # In-memory confidential orderbook
│   └── utils/
│       ├── encryption.ts  # AES-GCM encryption helpers
│       └── logger.ts      # Logging utilities
├── project.yaml           # CRE project config
├── secrets.yaml           # Vault DON secrets
├── package.json
└── tsconfig.json
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd cre
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

Required variables:
- `CRE_WORKFLOW_OWNER_ADDRESS` - Your wallet address
- `ETHEREUM_MAINNET_RPC` - Tenderly Virtual TestNet RPC (from Dev 1)
- `BASE_MAINNET_RPC` - Tenderly Virtual TestNet RPC (from Dev 1)
- `AES_ENCRYPTION_KEY` - Generate with: `openssl rand -hex 32`
- `WORLD_ID_API_KEY` - From World ID dashboard
- Contract addresses (from Dev 1 after deployment):
  - `ESCROW_VAULT_ADDRESS`
  - `OTC_SETTLEMENT_ADDRESS`
  - `PROOF_VERIFIER_ADDRESS`

### 3. Build TypeScript

```bash
npm run build
```

### 4. Simulate Locally

```bash
npm run simulate
```

This runs the workflow locally with the `development-settings` configuration.

### 5. Deploy to CRE

**Prerequisites:**
- CRE CLI installed and authenticated (`cre login`)
- Early Access approval for CRE deployment

```bash
npm run deploy
```

This deploys to CRE platform using `production-settings`.

## 🔐 ZK Proof Integration

The workflows use ZK proofs from the `../zk-circuits` directory.

**Before running workflows:**

1. Compile circuits:
   ```bash
   cd ../zk-circuits
   npm run compile
   npm run setup
   npm run generate-verifier
   ```

2. Verify `build/verification_key.json` exists

3. The `ZKBalanceVerifier` will automatically load the verification key

## 🧪 Testing

### Test ZK Verifier

```bash
npm test
```

### Manual Workflow Test

Create `test/test-trade-intake.ts`:

```typescript
import { handleTradeIntake } from '../workflows/trade-intake';

const testRequest = {
  worldIdProof: {
    merkle_root: "0x...",
    nullifier_hash: "0x...",
    proof: "0x...",
    verification_level: "orb"
  },
  zkProof: {
    proof: { /* ... */ },
    publicSignals: ["1", "commitment", "proofHash", "1000000", "1709654400"]
  },
  trade: {
    side: "buy",
    tokenPair: "ETH/USDC",
    amount: "1.0",
    price: "2000"
  }
};

const result = await handleTradeIntake(testRequest);
console.log(result);
```

## 📊 Workflow Details

### Workflow 1: Trade Intake

**Trigger:** HTTP POST from World Mini App  
**Input:**
```typescript
{
  worldIdProof: WorldIDProof,
  zkProof: BalanceProofData,
  trade: {
    side: "buy" | "sell",
    tokenPair: string,
    amount: string,
    price: string
  }
}
```

**Output:**
```typescript
{
  success: boolean,
  intentId?: string,
  walletCommitment?: string,
  reason?: string
}
```

**Steps:**
1. Validate World ID proof (sybil resistance)
2. Validate ZK balance proof (prove funds without revealing balance)
3. Add to confidential orderbook (in-memory, private)
4. Return intent ID

### Workflow 2: Matching Engine

**Trigger:** Cron (every 30 seconds)  
**Process:**
1. Check all token pairs for matching orders
2. Match buy/sell orders where `buyPrice >= sellPrice`
3. Only reveal matched pairs (unmatched stay private)
4. Trigger settlement for each match

### Workflow 4: Settlement

**Trigger:** Called by Workflow 2  
**Process:**
1. Record ZK proofs on-chain via `ProofVerifier`
2. Execute settlement via `OTCSettlement.settle()`
3. Send notifications to both parties

## 🔧 Integration with Frontend

Update `app/.env.local` with deployed CRE endpoints:

```bash
# After deployment, CRE will provide these URLs
CRE_INTAKE_ENDPOINT=https://cre.chainlink.io/workflows/privotc/trade-intake
CRE_CALLBACK_ENDPOINT=https://cre.chainlink.io/workflows/privotc/callback
```

Update `app/api/trade/route.ts`:

```typescript
const response = await fetch(process.env.CRE_INTAKE_ENDPOINT!, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(tradeIntakeRequest)
});
```

## 🔒 Security Considerations

1. **Confidential Compute**: All workflows run in TEE (Trusted Execution Environment)
2. **ZK Proofs**: Balance privacy maintained (only prove sufficiency, not amount)
3. **World ID**: Sybil resistance (one trade per verified human)
4. **Proof Expiry**: ZK proofs expire after 5 minutes to prevent replay attacks
5. **Nullifier Uniqueness**: Each World ID can only submit one trade
6. **Wallet Commitment**: Prevents front-running and address substitution

## 📚 References

- [Chainlink CRE Documentation](https://docs.chain.link/cre)
- [CRE Confidential HTTP](https://docs.chain.link/cre/confidential-http)
- [World ID Verification](https://docs.worldcoin.org/world-id)
- [snarkjs Library](https://github.com/iden3/snarkjs)

## 🎓 Dev 3 Notes

**Your responsibilities:**
- ✅ ZK circuits created (`../zk-circuits`)
- ✅ CRE workflows implemented
- ⏳ Deploy to CRE platform (requires Early Access)
- ⏳ Coordinate with Dev 1 for contract addresses
- ⏳ Coordinate with Dev 2 for frontend integration

**Next steps:**
1. Get Early Access approval for CRE deployment
2. Get contract addresses from Dev 1
3. Deploy workflows with `npm run deploy`
4. Share CRE endpoints with Dev 2
5. Test end-to-end with World Mini App
