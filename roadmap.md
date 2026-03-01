# PrivOTC — Development Roadmap

> **Target:** Hackathon submission (March 2026)
> **Stack:** World MiniKit · Chainlink CRE · Confidential Compute · Solidity · Tenderly

---

## Phase Overview

| Phase | Name | Focus | Status |
|---|---|---|---|
| 0 | Foundation | Repo, tooling, environment setup | 🔲 Not Started |
| 1 | Smart Contracts | Escrow, settlement, proof verifier | 🔲 Not Started |
| 2 | World Mini App | Frontend + World ID integration | 🔲 Not Started |
| 3 | CRE Workflow | Chainlink workflow orchestration | 🔲 Not Started |
| 4 | Confidential Matching | Encrypted matching engine | 🔲 Not Started |
| 5 | Tenderly Testing | Virtual TestNet deployment + validation | 🔲 Not Started |
| 6 | Integration | End-to-end flow wiring | 🔲 Not Started |
| 7 | Demo & Polish | Hackathon demo preparation | 🔲 Not Started |

---

## Phase 0 — Foundation & Environment Setup

**Goal:** Get all tools, accounts, and repos configured before writing any code.

### Steps

- [ ] Create GitHub repository (`privotc`)
- [ ] Initialize monorepo structure:
  ```
  /contracts        → Solidity smart contracts
  /app              → World Mini App (Next.js / MiniKit)
  /cre              → Chainlink CRE workflow configs
  /scripts          → Deployment + test scripts
  /docs             → Architecture + submission docs
  ```
- [ ] Set up package managers (`pnpm` recommended for monorepo)
- [ ] Install and configure:
  - [ ] Foundry or Hardhat (contract development)
  - [ ] Tenderly CLI (`tenderly login`, virtual testnet setup)
  - [ ] Chainlink CRE CLI / SDK (early access credentials)
  - [ ] MiniKit SDK (`@worldcoin/minikit-js`)
- [ ] Create `.env.example` with required secrets:
  ```
  WORLD_APP_ID=
  TENDERLY_PROJECT=
  TENDERLY_ACCESS_KEY=
  CRE_API_KEY=
  ENCRYPTION_KEY=
  ```
- [ ] Set up Tenderly Virtual TestNets:
  - [ ] Fork Ethereum mainnet
  - [ ] Fork Base mainnet
  - [ ] Save RPC URLs for both forks
- [ ] Get early access to Chainlink Confidential Compute

---

## Phase 1 — Smart Contracts

**Goal:** Deploy the three core contracts that handle escrow, settlement, and proof verification.

### 1.1 — Escrow Contract

Holds buyer/seller funds during the matching window.

- [ ] Define `EscrowVault.sol`
  - `deposit(tradeId, amount, token)` — lock funds for a trade
  - `release(tradeId, recipient)` — release to winner after settlement
  - `refund(tradeId)` — return funds if match fails or times out
  - `getBalance(tradeId)` — read locked amount
- [ ] Add timeout mechanism (prevent funds being locked forever)
- [ ] Emit events: `Deposited`, `Released`, `Refunded`
- [ ] Write unit tests (Foundry `forge test`)

### 1.2 — Settlement Contract

Executes the atomic swap between buyer and seller after CRE triggers it.

- [ ] Define `OTCSettlement.sol`
  - `settle(tradeId, buyer, seller, buyerToken, sellerToken, amounts)` — atomic swap
  - Only callable by authorized CRE executor address
  - Validates escrow balances before execution
- [ ] Integrate with `EscrowVault` (calls `release` on both sides)
- [ ] Emit event: `TradeSettled(tradeId, buyer, seller, timestamp)`
- [ ] Write unit tests

### 1.3 — Proof Verifier Contract

Verifies World ID proofs and settlement execution proofs on-chain.

- [ ] Define `ProofVerifier.sol`
  - Integrate World ID on-chain verification interface
  - `verifyHuman(proof, nullifierHash, signal)` — validate World ID proof
  - `verifySettlement(tradeId, proofHash)` — record CRE execution proof
  - Prevent nullifier reuse (double-verification protection)
- [ ] Write unit tests

### 1.4 — Contract Deployment

- [ ] Write deployment scripts for Tenderly Virtual TestNets
- [ ] Deploy all three contracts to forked Ethereum testnet
- [ ] Deploy all three contracts to forked Base testnet
- [ ] Verify contracts on Tenderly Explorer
- [ ] Save deployed contract addresses to config

---

## Phase 2 — World Mini App (Frontend)

**Goal:** Build the user-facing World Mini App with trade submission UI and World ID verification.

### 2.1 — Project Setup

- [ ] Bootstrap Next.js app with MiniKit SDK
  ```bash
  npx create-next-app@latest app --typescript
  cd app && pnpm add @worldcoin/minikit-js
  ```
- [ ] Configure `MiniKitProvider` in `_app.tsx`
- [ ] Set `NEXT_PUBLIC_WORLD_APP_ID` environment variable
- [ ] Test app loads correctly inside World App simulator

### 2.2 — World ID Verification Flow

- [ ] Implement `VerifyButton` component using IDKit or MiniKit
- [ ] Call `walletAuth` to connect user wallet
- [ ] Trigger World ID verification on first login
- [ ] Send proof to backend / CRE endpoint for validation
- [ ] Gate all trade features behind verified status
- [ ] Handle verification failure states (show error, retry)

### 2.3 — Trade Submission UI

- [ ] Build **Order Form** component:
  - Side selector: Buy / Sell
  - Token selector: ETH, USDC, WBTC, etc.
  - Amount input
  - Limit price input
  - Expiry selector (1hr / 6hr / 24hr)
- [ ] Client-side encryption of trade intent before submission:
  ```ts
  const encrypted = encrypt(tradeIntent, publicKey)
  const hash = keccak256(encrypted)
  ```
- [ ] Submit encrypted blob to CRE endpoint (Confidential HTTP)
- [ ] Store only the hash on-chain via `ProofVerifier`

### 2.4 — Order Status & Settlement UI

- [ ] Display active order status: `Pending → Matched → Settling → Complete`
- [ ] Poll CRE for match status updates
- [ ] Show settlement confirmation with Tenderly Explorer link
- [ ] Display transaction hash and settlement proof

### 2.5 — Wallet & Chain Handling

- [ ] Connect wallet via MiniKit (`walletAuth`)
- [ ] Handle World Chain for identity/proof transactions (gas-free)
- [ ] Handle Ethereum/Base interactions via CRE (cross-chain bridged through CRE)
- [ ] Show token balances relevant to selected chain

---

## Phase 3 — Chainlink CRE Workflow

**Goal:** Build the CRE workflow that orchestrates the full trade lifecycle offchain.

### 3.1 — CRE Project Setup

- [ ] Initialize CRE project in `/cre`
- [ ] Configure CRE CLI with API credentials
- [ ] Set up Confidential HTTP capability
- [ ] Connect to Tenderly Virtual TestNet RPC endpoints

### 3.2 — Workflow: Trade Intent Intake

- [ ] Define CRE trigger: HTTP endpoint receives encrypted trade intent
- [ ] Validate World ID proof (off-chain verification step):
  - Decode proof from request
  - Verify against World ID nullifier registry
  - Reject if nullifier already used
- [ ] Decrypt trade intent inside Confidential Compute:
  - Parse: side, token pair, amount, price, expiry
- [ ] Store decrypted intent in confidential memory (never logged publicly)
- [ ] Return acknowledgement to frontend (intent received + hash)

### 3.3 — Workflow: Confidential Matching Engine

- [ ] Build matching logic inside Confidential Compute:
  ```python
  for each buy_order in buy_book:
      for each sell_order in sell_book:
          if buy_order.price >= sell_order.price:
              if buy_order.token_pair == sell_order.token_pair:
                  create_match(buy_order, sell_order)
  ```
- [ ] Handle partial fills (match best price first)
- [ ] Support order expiry cleanup
- [ ] No matched order data is ever exposed externally

### 3.4 — Workflow: Proof of Funds Verification

- [ ] After match found, CRE calls `EscrowVault.getBalance()` on-chain
- [ ] Verify both parties have sufficient locked collateral
- [ ] If insufficient: cancel match, notify parties, re-queue orders
- [ ] If sufficient: proceed to settlement

### 3.5 — Workflow: Settlement Execution

- [ ] CRE calls `OTCSettlement.settle()` on Tenderly Virtual TestNet
- [ ] Pass: `tradeId`, buyer/seller addresses, token amounts
- [ ] Confirm transaction receipt
- [ ] Generate settlement proof (execution hash + timestamp)
- [ ] Call `ProofVerifier.verifySettlement()` to record proof on-chain

### 3.6 — Workflow: Notification

- [ ] Notify both parties via callback URL with:
  - Match confirmation
  - Settlement tx hash
  - Tenderly Explorer link

---

## Phase 4 — Confidential Compute Integration

**Goal:** Ensure all sensitive logic runs inside Chainlink Confidential Compute with no data leakage.

### 4.1 — Encryption Setup

- [ ] Generate asymmetric keypair for intent encryption
- [ ] Publish public key in Mini App (used for client-side encryption)
- [ ] Store private key inside Confidential Compute only
- [ ] Implement intent encryption/decryption helpers

### 4.2 — Confidential HTTP

- [ ] Route all trade intake HTTP calls through CRE's Confidential HTTP capability
- [ ] Ensure API credentials (if any external APIs used) are never exposed
- [ ] Verify request/response data is protected end-to-end

### 4.3 — Audit & Verification

- [ ] Confirm no plaintext trade data appears in:
  - CRE logs
  - On-chain calldata
  - Tenderly transaction traces
- [ ] Only the following should be public:
  - `tradeId` hash
  - World ID nullifier hash
  - Settlement proof hash
  - Transaction timestamps

---

## Phase 5 — Tenderly Virtual TestNet Deployment & Testing

**Goal:** Deploy and validate the full workflow on Tenderly Virtual TestNets, producing Explorer links for judges.

### 5.1 — Virtual TestNet Configuration

- [ ] Create named Virtual TestNets in Tenderly dashboard:
  - `privotc-ethereum` (forked from Ethereum mainnet)
  - `privotc-base` (forked from Base mainnet)
- [ ] Fund test wallets with ETH, USDC via unlimited faucet
- [ ] Deploy all contracts to both TestNets
- [ ] Configure CRE to use TestNet RPC URLs

### 5.2 — Contract Verification on Tenderly

- [ ] Verify all contract source code on Tenderly Explorer
- [ ] Confirm ABI is readable in Explorer UI
- [ ] Tag contracts: `EscrowVault`, `OTCSettlement`, `ProofVerifier`

### 5.3 — End-to-End Simulation

- [ ] Simulate Buyer flow:
  - Deposit funds to escrow
  - Submit encrypted buy order
  - Wait for match
  - Confirm settlement
- [ ] Simulate Seller flow:
  - Deposit funds to escrow
  - Submit encrypted sell order
  - Wait for match
  - Confirm settlement
- [ ] Verify Tenderly Explorer shows:
  - All escrow deposits
  - Settlement execution
  - Proof verification

### 5.4 — Test Scenarios

- [ ] Happy path: buyer and seller prices overlap → match → settle
- [ ] No match: prices don't overlap → orders expire → refund
- [ ] Insufficient funds: escrow low → match cancelled
- [ ] Replay attack: reuse World ID proof → rejected by nullifier check
- [ ] Bot attempt: no World ID → blocked at CRE intake

---

## Phase 6 — End-to-End Integration

**Goal:** Wire all components together into a single working flow.

- [ ] Mini App → CRE: encrypted trade intent submission confirmed
- [ ] CRE → World ID: proof verification confirmed
- [ ] CRE → Matching Engine: confidential match executes correctly
- [ ] CRE → Escrow: fund check passes
- [ ] CRE → Settlement: `OTCSettlement.settle()` triggers correctly
- [ ] Settlement → ProofVerifier: proof recorded on-chain
- [ ] Mini App: settlement status updates correctly end-to-end
- [ ] Full demo run with two separate wallets (buyer + seller)

---

## Phase 7 — Demo Preparation & Submission Polish

**Goal:** Package everything cleanly for hackathon judges.

### 7.1 — Demo Script

- [ ] Record a walkthrough video covering:
  1. World ID verification inside Mini App
  2. Buyer submits private order
  3. Seller submits private order
  4. CRE matches confidentially
  5. Settlement executes on Tenderly Virtual TestNet
  6. Explorer shows verified tx history

### 7.2 — Documentation

- [ ] Write `README.md` with:
  - Project summary
  - Architecture diagram
  - Setup instructions
  - CRE workflow explanation
  - Tenderly Explorer links
- [ ] Update `IDEA_OVERVIEW.md` with any implementation changes
- [ ] Document all contract addresses (TestNet deployments)

### 7.3 — Submission Checklist

- [ ] GitHub repo public and clean
- [ ] Tenderly Explorer links embedded in README
- [ ] CRE workflow source code included in `/cre`
- [ ] All four track requirements satisfied:
  - [ ] Chainlink Confidential Compute used
  - [ ] World ID integrated with CRE
  - [ ] CRE running inside World Mini App
  - [ ] Tenderly Virtual TestNet with Explorer link

---

## Dependency Map

```
Phase 0 (Setup)
    ↓
Phase 1 (Contracts) ──────────────────────────────┐
    ↓                                              ↓
Phase 2 (Mini App)          Phase 3 (CRE Workflow) + Phase 4 (Confidential Compute)
    ↓                                              ↓
    └──────────────── Phase 5 (Tenderly Testing) ──┘
                              ↓
                      Phase 6 (Integration)
                              ↓
                      Phase 7 (Demo & Submit)
```

---

## Risk Register

| Risk | Likelihood | Mitigation |
|---|---|---|
| CRE early access delayed | Medium | Contact Chainlink team early; use mock CRE locally |
| Confidential Compute API not ready | Medium | Build with mock encryption first, swap in real CC later |
| World ID proof verification complexity | Low | Use off-chain verification path via CRE as fallback |
| Tenderly Virtual TestNet state drift | Low | Re-fork mainnet if state becomes stale |
| Time constraint (hackathon deadline) | High | Prioritize demo path; skip edge case handling if needed |

---

## Hackathon Timeline (Suggested)

| Day | Focus |
|---|---|
| Day 1 | Phase 0 — Setup everything, get access to all APIs |
| Day 1-2 | Phase 1 — Write and deploy all three contracts |
| Day 2-3 | Phase 2 — Build Mini App with World ID + trade UI |
| Day 3-4 | Phase 3 + 4 — CRE workflow + Confidential Compute |
| Day 4-5 | Phase 5 — Tenderly deployment and test scenarios |
| Day 5 | Phase 6 — End-to-end integration and debugging |
| Day 6 | Phase 7 — Demo recording, README, submission polish |
