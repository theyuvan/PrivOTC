# PrivOTC — Team Work Split

> **Team Size:** 3 Developers
> **Deadline:** Hackathon Submission (March 2026)
> **Coordination:** Daily sync on integration points; shared `.env` config and contract addresses via team channel.

---

## Developer Assignments

| Developer | Domain | Phases |
|---|---|---|
| **Dev 1** | Smart Contracts + Tenderly | Phase 1 · Phase 5 |
| **Dev 2** | World Mini App (Frontend) | Phase 2 |
| **Dev 3** | CRE Workflow + Confidential Compute | Phase 3 · Phase 4 |
| **All** | Setup · Integration · Demo | Phase 0 · Phase 6 · Phase 7 |

---

## Phase 0 — Foundation (All Developers Together)

All three devs complete this together on Day 1 before splitting.

- [ ] Create and clone GitHub repo
- [ ] Set up monorepo structure (`/contracts`, `/app`, `/cre`, `/scripts`, `/docs`)
- [ ] Share `.env` secrets securely (use a password manager or team vault)
- [ ] Create Tenderly Virtual TestNets (Dev 1 leads, shares RPC URLs)
- [ ] Get Chainlink CRE early access credentials (Dev 3 leads)
- [ ] Confirm World App ID is active (Dev 2 leads)
- [ ] Install all CLI tools: Foundry, Tenderly CLI, CRE CLI, MiniKit SDK

---

## Dev 1 — Smart Contracts + Tenderly Testing

**Focus:** Write, test, and deploy all on-chain contracts. Own the Tenderly environment.

### Phase 1 — Smart Contracts

#### EscrowVault.sol
- [ ] `deposit(tradeId, amount, token)` — lock funds
- [ ] `release(tradeId, recipient)` — release after settlement
- [ ] `refund(tradeId)` — return funds on timeout/failure
- [ ] `getBalance(tradeId)` — read locked amount
- [ ] Timeout mechanism to prevent permanent fund lock
- [ ] Events: `Deposited`, `Released`, `Refunded`
- [ ] Unit tests with Foundry (`forge test`)

#### OTCSettlement.sol
- [ ] `settle(tradeId, buyer, seller, tokens, amounts)` — atomic swap
- [ ] Restrict caller to authorized CRE executor address only
- [ ] Validate escrow balances before execution
- [ ] Integrate with `EscrowVault` — calls `release` on both sides
- [ ] Event: `TradeSettled(tradeId, buyer, seller, timestamp)`
- [ ] Unit tests

#### ProofVerifier.sol
- [ ] Integrate World ID on-chain verification interface
- [ ] `verifyHuman(proof, nullifierHash, signal)` — validate World ID proof
- [ ] `verifySettlement(tradeId, proofHash)` — record CRE execution proof on-chain
- [ ] Prevent nullifier reuse (replay attack protection)
- [ ] Unit tests

#### Deployment Scripts
- [ ] Write deploy scripts for Tenderly Virtual TestNets (Ethereum fork + Base fork)
- [ ] Deploy all contracts to both forks
- [ ] Save and share all deployed contract addresses with team

### Phase 5 — Tenderly Virtual TestNet Testing

- [ ] Create named Virtual TestNets: `privotc-ethereum`, `privotc-base`
- [ ] Fund test wallets via Tenderly unlimited faucet (ETH + USDC)
- [ ] Verify all contract source code on Tenderly Explorer (readable ABI)
- [ ] Tag contracts in Explorer: `EscrowVault`, `OTCSettlement`, `ProofVerifier`
- [ ] Run test scenarios:
  - [ ] Happy path: deposit → match → settle → confirm
  - [ ] Refund path: no match → expiry → refund
  - [ ] Insufficient funds: escrow low → match cancelled
  - [ ] Replay attack: reused World ID proof → rejected
- [ ] Capture Tenderly Explorer links for all key transactions
- [ ] Share Explorer links with team for README

### Dev 1 Deliverables
- All contracts written, tested, and deployed
- Foundry test suite passing (`forge test`)
- Tenderly Explorer links for all contract deployments and test transactions
- Contract ABIs + addresses shared with Dev 2 and Dev 3

---

## Dev 2 — World Mini App (Frontend)

**Focus:** Build the user-facing Mini App with World ID verification and trade submission UI.

### Phase 2 — World Mini App

#### Project Setup
- [ ] Bootstrap Next.js app in `/app` with TypeScript
  ```bash
  npx create-next-app@latest app --typescript
  cd app && pnpm add @worldcoin/minikit-js
  ```
- [ ] Configure `MiniKitProvider` in `_app.tsx`
- [ ] Set `NEXT_PUBLIC_WORLD_APP_ID` in environment
- [ ] Test app loads in World App simulator

#### World ID Verification Flow
- [ ] Implement `VerifyButton` component (IDKit or MiniKit)
- [ ] `walletAuth` to connect user wallet in World App
- [ ] Trigger World ID verification on first login
- [ ] Send verification proof to CRE endpoint (coordinate endpoint URL with Dev 3)
- [ ] Gate all trade features behind verified status
- [ ] Handle verification failure / retry states

#### Trade Submission UI
- [ ] Build **Order Form** component:
  - Side selector: Buy / Sell
  - Token pair selector: ETH/USDC, WBTC/USDC, etc.
  - Amount input
  - Limit price input
  - Expiry selector: 1hr / 6hr / 24hr
- [ ] Client-side encryption of trade intent before sending:
  ```ts
  const encrypted = encrypt(tradeIntent, publicKey)
  const hash = keccak256(encrypted)
  ```
- [ ] Submit encrypted intent to CRE Confidential HTTP endpoint (URL from Dev 3)
- [ ] Store intent hash on-chain via `ProofVerifier` (ABI from Dev 1)

#### Order Status & Settlement UI
- [ ] Display order status lifecycle: `Pending → Matched → Settling → Complete`
- [ ] Poll CRE for match status updates
- [ ] Show settlement confirmation with Tenderly Explorer tx link
- [ ] Show settlement proof hash

#### Wallet & Chain Handling
- [ ] World Chain for identity and proof txs (gas-free via MiniKit)
- [ ] Display relevant token balances
- [ ] Show active orders and history

### Dev 2 Deliverables
- Fully working World Mini App
- World ID verification flow integrated
- Encrypted trade submission wired to CRE endpoint
- Settlement status display working end-to-end
- App tested inside World App simulator

---

## Dev 3 — Chainlink CRE Workflow + Confidential Compute

**Focus:** Build and deploy all CRE workflows and confidential compute logic that orchestrates the trade lifecycle.

### Phase 3 — CRE Workflow

#### Setup
- [ ] Initialize CRE project in `/cre`
- [ ] Configure CRE CLI with API credentials
- [ ] Enable Confidential HTTP capability
- [ ] Connect CRE to Tenderly Virtual TestNet RPC endpoints (from Dev 1)

#### Workflow 1: Trade Intent Intake
- [ ] Define CRE HTTP trigger endpoint (share URL with Dev 2)
- [ ] Validate incoming World ID proof:
  - Off-chain verification against World ID nullifier registry
  - Reject if nullifier already used
- [ ] Decrypt trade intent inside Confidential Compute:
  - Parse: side, token pair, amount, price, expiry
- [ ] Store decrypted intent in confidential memory (never publicly logged)
- [ ] Return acknowledgement + intent hash to caller

#### Workflow 2: Confidential Matching Engine
- [ ] Build matching logic inside Confidential Compute:
  ```python
  for each buy_order in buy_book:
      for each sell_order in sell_book:
          if buy_order.price >= sell_order.price:
              if buy_order.token_pair == sell_order.token_pair:
                  create_match(buy_order, sell_order)
  ```
- [ ] Best-price-first matching (price-time priority)
- [ ] Handle order expiry cleanup
- [ ] Ensure zero external exposure of matched data

#### Workflow 3: Proof of Funds Check
- [ ] After match: CRE calls `EscrowVault.getBalance()` on Tenderly TestNet (contract from Dev 1)
- [ ] Verify both buyer and seller have sufficient escrowed collateral
- [ ] If insufficient: cancel match, notify parties, re-queue orders
- [ ] If sufficient: proceed to settlement

#### Workflow 4: Settlement Execution
- [ ] Call `OTCSettlement.settle()` on Tenderly TestNet (contract from Dev 1)
- [ ] Pass: `tradeId`, buyer/seller addresses, token amounts
- [ ] Confirm transaction receipt
- [ ] Generate settlement proof (execution hash + timestamp)
- [ ] Call `ProofVerifier.verifySettlement()` to record proof on-chain

#### Workflow 5: Notification
- [ ] Notify both parties via callback with:
  - Match confirmation
  - Settlement tx hash
  - Tenderly Explorer link

### Phase 4 — Confidential Compute Integration

- [ ] Generate asymmetric keypair for trade intent encryption
- [ ] Publish public key for Dev 2 to use in client-side encryption
- [ ] Store private key inside Confidential Compute only
- [ ] Route all intake HTTP calls through CRE Confidential HTTP
- [ ] Audit: confirm no plaintext trade data appears in CRE logs, calldata, or Tenderly traces
- [ ] Only public outputs:
  - `tradeId` hash
  - World ID nullifier hash
  - Settlement proof hash
  - Transaction timestamps

### Dev 3 Deliverables
- All CRE workflows deployed and functional
- Confidential HTTP endpoint live (URL shared with Dev 2)
- Public encryption key shared with Dev 2
- Matching engine runs entirely inside Confidential Compute
- Settlement successfully triggers contracts deployed by Dev 1

---

## Phase 6 — Integration (All Developers)

Wire all three pieces together and verify the end-to-end flow.

| Checkpoint | Owner | Dependency |
|---|---|---|
| Mini App submits encrypted intent to CRE endpoint | Dev 2 + Dev 3 | CRE URL from Dev 3 |
| CRE validates World ID proof correctly | Dev 3 | World ID flow from Dev 2 |
| CRE matching engine runs confidentially | Dev 3 | — |
| CRE calls `EscrowVault.getBalance()` | Dev 3 + Dev 1 | Contract address from Dev 1 |
| CRE calls `OTCSettlement.settle()` | Dev 3 + Dev 1 | Contract address + ABI from Dev 1 |
| Proof recorded via `ProofVerifier` | Dev 1 + Dev 3 | CRE settlement proof |
| Mini App shows correct settlement status | Dev 2 + Dev 3 | CRE callback from Dev 3 |
| Full demo: two wallets, buyer + seller, end-to-end | All | Everything above |

---

## Phase 7 — Demo & Submission (All Developers)

- [ ] **Dev 1** — Collect all Tenderly Explorer links; document contract addresses
- [ ] **Dev 2** — Record demo walkthrough video (screen capture of Mini App)
- [ ] **Dev 3** — Document CRE workflow architecture; export workflow source
- [ ] **All** — Write final `README.md`:
  - Project summary
  - Architecture diagram
  - Setup instructions
  - CRE workflow explanation
  - Tenderly Explorer links
- [ ] **All** — Final submission checklist:
  - [ ] GitHub repo public and clean
  - [ ] Tenderly Explorer links in README
  - [ ] CRE workflow source in `/cre`
  - [ ] All four hackathon tracks addressed

---

## Shared Resources & Handoffs

| Resource | Produced By | Consumed By |
|---|---|---|
| Contract ABIs + addresses | Dev 1 | Dev 2, Dev 3 |
| Tenderly RPC URLs | Dev 1 | Dev 3 |
| CRE Confidential HTTP endpoint URL | Dev 3 | Dev 2 |
| Public encryption key | Dev 3 | Dev 2 |
| World ID App ID | Dev 2 | Dev 3 |
| Tenderly Explorer links | Dev 1 | Dev 2 (UI), All (README) |

---

## Suggested Daily Sync Points

| Sync | When | Agenda |
|---|---|---|
| Kickoff | Day 1 AM | Complete Phase 0 together, split work |
| Mid-point | Day 3 PM | Share contract addresses, CRE endpoint URL, encryption key |
| Integration | Day 5 AM | Begin Phase 6 wiring — fix blockers together |
| Final | Day 6 PM | Demo run, submission review |
