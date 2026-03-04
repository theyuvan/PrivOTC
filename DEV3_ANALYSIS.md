# Dev 3 Complete Analysis — CRE Workflow + Confidential Compute

> **Your Role:** Build the core orchestration layer that makes PrivOTC work
> **Phases:** Phase 3 (CRE Workflow) + Phase 4 (Confidential Compute Integration)
> **Timeline:** Day 3-4 of hackathon (March 2026)

---

## 📋 Executive Summary

You are **Developer 3**, responsible for building the **heart of PrivOTC**: the Chainlink Runtime Environment (CRE) workflows that orchestrate confidential trade matching and settlement.

**Your deliverables:**
1. 5 CRE workflows that handle trade lifecycle
2. Confidential matching engine (no data leakage)
3. World ID proof validation
4. On-chain settlement triggering
5. Encryption key management
6. HTTP endpoint for frontend integration

---

## 🎯 Phase 0 — Your Setup Responsibilities

**What you lead:**
- [ ] Get Chainlink CRE early access credentials (coordinate with Chainlink team)
- [ ] Install CRE CLI on your machine
- [ ] Test CRE authentication works

**Shared with team:**
- [ ] Create `/cre` directory in monorepo
- [ ] Set up `.env` with CRE credentials
- [ ] Install Tenderly CLI (for testnet access)

---

## 🔧 Phase 3 — CRE Workflow (Your Main Task)

### 3.1 — CRE Project Setup

**Tasks:**
```bash
# In /cre directory
- [ ] Initialize CRE project: cre init privotc-workflow
- [ ] Configure CRE CLI with API credentials
- [ ] Enable Confidential HTTP capability
- [ ] Test connection to CRE platform
- [ ] Connect to Tenderly Virtual TestNet RPC endpoints
```

**Critical Dependencies:**
- Tenderly RPC URLs from Dev 1 (both Ethereum and Base forks)
- CRE early access credentials (Chainlink)

**Files to create:**
```
/cre
  ├── workflows/
  │   ├── trade-intake.yaml       (Workflow 1)
  │   ├── matching-engine.yaml    (Workflow 2)
  │   ├── funds-check.yaml        (Workflow 3)
  │   ├── settlement.yaml         (Workflow 4)
  │   └── notification.yaml       (Workflow 5)
  ├── src/
  │   ├── matching-logic.py       (Confidential matching algorithm)
  │   ├── encryption.py           (Key management + decrypt)
  │   └── world-id-validator.py   (Off-chain proof verification)
  ├── config/
  │   ├── tenderly-rpc.json       (From Dev 1)
  │   └── contract-addresses.json (From Dev 1)
  └── README.md
```

---

### 3.2 — Workflow 1: Trade Intent Intake

**Purpose:** Receive encrypted trade orders from World Mini App

**Implementation Checklist:**

```yaml
Trigger: CRE Confidential HTTP Endpoint
  ↓
Validate World ID Proof (off-chain):
  - [ ] Decode proof data from request body
  - [ ] Verify against World ID nullifier registry API
  - [ ] Check if nullifier already used (prevent replay)
  - [ ] If invalid: return 401 Unauthorized
  - [ ] If valid: proceed
  ↓
Decrypt Trade Intent (Confidential Compute):
  - [ ] Extract encrypted blob from request
  - [ ] Use private key (stored in CC) to decrypt
  - [ ] Parse JSON structure:
      {
        "side": "buy" | "sell",
        "tokenPair": "ETH/USDC",
        "amount": 1000,
        "limitPrice": 3500,
        "expiry": 1709654400  // Unix timestamp
      }
  - [ ] Validate all fields are present
  - [ ] Store in confidential memory orderbook
  ↓
Return Response:
  - [ ] Generate tradeId = keccak256(encrypted_intent + timestamp)
  - [ ] Return: { "tradeId": "0x...", "status": "pending" }
  - [ ] DO NOT log plaintext trade data anywhere
```

**Critical Code Example (Conceptual):**
```python
from chainlink_cre import confidential_compute, http_trigger
from world_id import verify_proof

@http_trigger(path="/trade/submit", method="POST")
@confidential_compute
def handle_trade_intake(request):
    # 1. Validate World ID
    world_id_proof = request.json['worldIdProof']
    nullifier = request.json['nullifierHash']
    
    if not verify_proof(world_id_proof, nullifier):
        return {"error": "Invalid World ID"}, 401
    
    # 2. Decrypt intent (happens inside CC)
    encrypted_intent = request.json['encryptedIntent']
    trade_intent = decrypt_with_private_key(encrypted_intent)
    
    # 3. Store in confidential orderbook
    trade_id = generate_trade_id(encrypted_intent)
    add_to_orderbook(trade_id, trade_intent, nullifier)
    
    # 4. Return only hash
    return {"tradeId": trade_id, "status": "pending"}
```

**What you share with Dev 2:**
- HTTP endpoint URL: `https://cre.privotc.xyz/trade/submit` (example)
- Request format documentation
- Expected response codes

---

### 3.3 — Workflow 2: Confidential Matching Engine

**Purpose:** Match buy and sell orders privately

**Matching Algorithm (Runs inside Confidential Compute):**

```python
@confidential_compute
@scheduled(cron="*/30 * * * * *")  # Run every 30 seconds
def run_matching_engine():
    """
    Price-time priority matching algorithm.
    CRITICAL: This NEVER exposes matched data externally.
    """
    
    # Get all active orders from confidential memory
    buy_orders = get_orders(side="buy", status="pending")
    sell_orders = get_orders(side="sell", status="pending")
    
    # Sort for best price first
    buy_orders.sort(key=lambda x: (-x.price, x.timestamp))  # Highest price first
    sell_orders.sort(key=lambda x: (x.price, x.timestamp))  # Lowest price first
    
    matches = []
    
    for buy_order in buy_orders:
        for sell_order in sell_orders:
            # Price overlap check
            if buy_order.price >= sell_order.price:
                # Token pair match
                if buy_order.token_pair == sell_order.token_pair:
                    # Check expiry
                    if not is_expired(buy_order) and not is_expired(sell_order):
                        # Create match
                        match = {
                            "matchId": generate_match_id(),
                            "buyTradeId": buy_order.trade_id,
                            "sellTradeId": sell_order.trade_id,
                            "buyer": buy_order.wallet,
                            "seller": sell_order.wallet,
                            "tokenPair": buy_order.token_pair,
                            "amount": min(buy_order.amount, sell_order.amount),
                            "settlementPrice": sell_order.price,  # Seller gets their ask
                            "timestamp": now()
                        }
                        matches.append(match)
                        
                        # Update order statuses
                        mark_order_matched(buy_order.trade_id)
                        mark_order_matched(sell_order.trade_id)
                        
                        # Trigger next workflow (funds check)
                        trigger_workflow("funds-check", match)
                        
                        break  # Move to next buy order
    
    # Clean up expired orders
    expired = get_expired_orders()
    for order in expired:
        mark_order_expired(order.trade_id)
        trigger_workflow("refund", order)
    
    return {"matched": len(matches), "expired": len(expired)}
```

**Implementation Requirements:**
- [ ] Orderbook stored in confidential memory only
- [ ] Matching runs on scheduled interval (every 30 sec)
- [ ] Best price gets priority
- [ ] Handle partial fills (optional for hackathon MVP)
- [ ] Automatic expiry cleanup
- [ ] NO external logs or traces of matched data

---

### 3.4 — Workflow 3: Proof of Funds Check

**Purpose:** Verify both parties have sufficient escrow before settlement

**Flow:**

```python
@confidential_compute
def check_funds(match):
    """
    Verify escrow balances on-chain before settlement.
    """
    
    # Get contract addresses from config (provided by Dev 1)
    escrow_vault = get_contract("EscrowVault")
    
    # Check buyer's escrow
    buyer_balance = escrow_vault.functions.getBalance(
        match["buyTradeId"]
    ).call()
    
    buyer_required = match["amount"] * match["settlementPrice"]  # USDC needed
    
    # Check seller's escrow
    seller_balance = escrow_vault.functions.getBalance(
        match["sellTradeId"]
    ).call()
    
    seller_required = match["amount"]  # ETH needed
    
    # Validation
    if buyer_balance < buyer_required:
        handle_insufficient_funds(match, "buyer")
        return {"status": "cancelled", "reason": "buyer_insufficient_funds"}
    
    if seller_balance < seller_required:
        handle_insufficient_funds(match, "seller")
        return {"status": "cancelled", "reason": "seller_insufficient_funds"}
    
    # Both parties have sufficient funds
    trigger_workflow("settlement", match)
    return {"status": "proceeding_to_settlement"}

def handle_insufficient_funds(match, party):
    """Cancel match and re-queue orders"""
    mark_order_pending(match["buyTradeId"])
    mark_order_pending(match["sellTradeId"])
    notify_party(match[party], "insufficient_escrow")
```

**Requirements:**
- [ ] Integration with `EscrowVault.sol` from Dev 1
- [ ] Call `getBalance(tradeId)` for both buyer and seller
- [ ] If insufficient: cancel match, notify, re-queue orders
- [ ] If sufficient: proceed to settlement workflow

**Dependencies from Dev 1:**
- Contract ABI for `EscrowVault`
- Deployed contract address
- Tenderly RPC endpoint

---

### 3.5 — Workflow 4: Settlement Execution

**Purpose:** Trigger atomic swap on-chain

**Flow:**

```python
@confidential_compute
def execute_settlement(match):
    """
    Call OTCSettlement.settle() to execute atomic swap.
    Generate proof and record on-chain.
    """
    
    # Get contract references
    settlement_contract = get_contract("OTCSettlement")
    proof_verifier = get_contract("ProofVerifier")
    
    # Prepare settlement transaction
    tx = settlement_contract.functions.settle(
        tradeId=match["matchId"],
        buyer=match["buyer"],
        seller=match["seller"],
        buyerToken=get_token_address("USDC"),
        sellerToken=get_token_address("ETH"),
        amounts=[
            match["amount"] * match["settlementPrice"],  # USDC from buyer
            match["amount"]  # ETH from seller
        ]
    )
    
    # Execute transaction on Tenderly Virtual TestNet
    tx_hash = send_transaction(tx)
    
    # Wait for confirmation
    receipt = wait_for_receipt(tx_hash)
    
    if receipt.status != 1:
        handle_settlement_failure(match, tx_hash)
        return {"status": "failed", "txHash": tx_hash}
    
    # Generate settlement proof
    proof = {
        "matchId": match["matchId"],
        "txHash": tx_hash,
        "timestamp": now(),
        "executionHash": keccak256(receipt)
    }
    
    proof_hash = keccak256(json.dumps(proof))
    
    # Record proof on-chain
    proof_tx = proof_verifier.functions.verifySettlement(
        match["matchId"],
        proof_hash
    )
    
    proof_tx_hash = send_transaction(proof_tx)
    
    # Update order statuses
    mark_order_complete(match["buyTradeId"])
    mark_order_complete(match["sellTradeId"])
    
    # Trigger notification workflow
    trigger_workflow("notification", {
        "match": match,
        "settlementTx": tx_hash,
        "proofTx": proof_tx_hash,
        "proof": proof
    })
    
    return {
        "status": "settled",
        "settlementTx": tx_hash,
        "proofTx": proof_tx_hash
    }
```

**Implementation Checklist:**
- [ ] Integration with `OTCSettlement.sol` from Dev 1
- [ ] Call `settle()` with correct parameters:
  - tradeId (match ID)
  - buyer address
  - seller address
  - token addresses
  - amounts array
- [ ] Execute on Tenderly Virtual TestNet
- [ ] Wait for transaction confirmation
- [ ] Generate settlement proof (execution hash + timestamp)
- [ ] Record proof via `ProofVerifier.verifySettlement()`
- [ ] Handle settlement failures (retry logic optional)

**Dependencies from Dev 1:**
- `OTCSettlement` contract ABI + address
- `ProofVerifier` contract ABI + address
- Authorized executor address (your CRE wallet must be whitelisted in `OTCSettlement`)

---

### 3.6 — Workflow 5: Notification

**Purpose:** Notify both parties about trade completion

**Flow:**

```python
@confidential_compute
def send_notifications(settlement_data):
    """
    Notify buyer and seller with settlement details.
    """
    
    match = settlement_data["match"]
    settlement_tx = settlement_data["settlementTx"]
    proof_tx = settlement_data["proofTx"]
    
    # Generate Tenderly Explorer links
    explorer_url = f"https://dashboard.tenderly.co/explorer/tx/{settlement_tx}"
    
    # Prepare notification payload
    notification = {
        "tradeId": match["matchId"],
        "status": "settled",
        "settlementTx": settlement_tx,
        "proofTx": proof_tx,
        "explorerUrl": explorer_url,
        "timestamp": now()
    }
    
    # Send to buyer
    send_callback(match["buyer"], notification)
    
    # Send to seller
    send_callback(match["seller"], notification)
    
    # Optionally: emit event for frontend polling
    emit_event("TradeSettled", {
        "buyTradeId": match["buyTradeId"],
        "sellTradeId": match["sellTradeId"],
        "notification": notification
    })
    
    return {"status": "notifications_sent"}
```

**Requirements:**
- [ ] Send callback to buyer with match confirmation
- [ ] Send callback to seller with match confirmation
- [ ] Include in callback:
  - Settlement tx hash
  - Tenderly Explorer link
  - Proof tx hash
  - Timestamp
- [ ] Support frontend polling endpoint (optional)

**What Dev 2 needs from you:**
- Callback format specification
- Polling endpoint (if implemented): `GET /trade/status/:tradeId`

---

## 🔐 Phase 4 — Confidential Compute Integration

### 4.1 — Encryption Setup

**Tasks:**

```python
# Generate keypair for trade intent encryption
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

# Generate RSA keypair
private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048
)

public_key = private_key.public_key()

# Export public key (share with Dev 2)
public_pem = public_key.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
)

# Store private key in Confidential Compute ONLY
# NEVER export or log private key
store_in_confidential_memory("PRIVATE_KEY", private_key)
```

**Checklist:**
- [ ] Generate asymmetric keypair (RSA 2048-bit minimum)
- [ ] Export public key to PEM format
- [ ] Share public key with Dev 2 (add to shared config)
- [ ] Store private key ONLY in Confidential Compute memory
- [ ] Implement decrypt function:
  ```python
  @confidential_compute
  def decrypt_with_private_key(encrypted_blob):
      private_key = get_from_confidential_memory("PRIVATE_KEY")
      plaintext = private_key.decrypt(encrypted_blob)
      return json.loads(plaintext)
  ```

**What you share with Dev 2:**
```json
{
  "publicKey": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBg...\n-----END PUBLIC KEY-----",
  "algorithm": "RSA-2048",
  "padding": "OAEP"
}
```

---

### 4.2 — Confidential HTTP

**Security Requirements:**

- [ ] All HTTP endpoints use CRE Confidential HTTP capability
- [ ] TLS/SSL enforced (HTTPS only)
- [ ] Request/response data encrypted in transit
- [ ] API credentials stored in Confidential Compute, never in logs
- [ ] Rate limiting implemented (prevent spam)

**Endpoint Security:**
```yaml
Endpoints:
  POST /trade/submit:
    - Authentication: World ID proof (in request body)
    - Encryption: Client-side encrypted trade intent
    - Logging: ONLY tradeId hash and timestamp
    
  GET /trade/status/:tradeId:
    - Authentication: Signature verification (optional for hackathon)
    - Response: Only public data (status, tx hashes)
    - Logging: Query timestamp only
```

---

### 4.3 — Audit & Verification (CRITICAL)

**Zero Data Leakage Checklist:**

```
Test each workflow and confirm:

❌ NO plaintext trade data in:
  - [ ] CRE workflow logs
  - [ ] On-chain transaction calldata
  - [ ] Tenderly transaction traces
  - [ ] CRE execution logs
  - [ ] Error messages
  - [ ] Debug outputs

✅ ONLY these are public:
  - [ ] tradeId hash
  - [ ] matchId hash
  - [ ] World ID nullifier hash
  - [ ] Settlement proof hash
  - [ ] Transaction hashes
  - [ ] Timestamps
  - [ ] Status codes

Private data kept confidential:
  - Trade side (buy/sell)
  - Token amounts
  - Limit prices
  - Wallet addresses (until settlement)
  - Matched counterparties (until settlement)
```

**Testing Script:**
```bash
# 1. Submit trade via endpoint
curl -X POST https://cre.privotc.xyz/trade/submit \
  -d '{"encryptedIntent": "...", "worldIdProof": "..."}'

# 2. Check CRE logs (should show ONLY tradeId hash)
cre logs workflow trade-intake

# 3. Check Tenderly traces (should show NO plaintext data)
# Visit Tenderly Explorer, inspect calldata

# 4. Verify matching happens (wait 30 sec)
curl https://cre.privotc.xyz/trade/status/:tradeId

# 5. Confirm settlement tx has NO leaked data
# Check Tenderly Explorer tx details
```

---

## 📦 Dev 3 Deliverables Summary

At the end of Phase 3 + 4, you must deliver:

### 1. CRE Workflows (All 5)
- [x] Trade Intent Intake (HTTP endpoint live)
- [x] Confidential Matching Engine (scheduled execution)
- [x] Funds Check (calls EscrowVault)
- [x] Settlement Execution (calls OTCSettlement)
- [x] Notification (callbacks working)

### 2. Confidential Compute Setup
- [x] Private key stored in CC only
- [x] Public key shared with Dev 2
- [x] Decryption working
- [x] No data leakage confirmed

### 3. Integration Artifacts
- [x] CRE Confidential HTTP endpoint URL (shared with Dev 2)
- [x] Public encryption key (shared with Dev 2)
- [x] CRE executor address (shared with Dev 1 for contract whitelist)
- [x] Contract addresses config (received from Dev 1)

### 4. Documentation
- [x] CRE workflow architecture diagram
- [x] API documentation for Dev 2
- [x] Privacy audit results
- [x] Workflow source code exported

---

## 🔗 Integration Points with Other Devs

### From Dev 1 (Smart Contracts) — YOU NEED:

| Resource | When | Purpose |
|----------|------|---------|
| Tenderly RPC URLs | Phase 3.1 | Connect CRE to testnets |
| `EscrowVault` ABI + address | Phase 3.4 | Check balances |
| `OTCSettlement` ABI + address | Phase 3.5 | Execute settlements |
| `ProofVerifier` ABI + address | Phase 3.5 | Record proofs |
| Whitelist CRE executor | Phase 3.5 | Authorization to call settle() |

### From Dev 2 (Frontend) — YOU NEED:

| Resource | When | Purpose |
|----------|------|---------|
| World App ID | Phase 3.2 | Validate World ID proofs |
| Expected request format | Phase 3.2 | Parse frontend requests |
| Callback endpoint (optional) | Phase 3.6 | Send notifications |

### To Dev 2 (Frontend) — YOU PROVIDE:

| Resource | When | Purpose |
|----------|------|---------|
| CRE HTTP endpoint URL | After Phase 3.2 | Trade submission |
| Public encryption key | After Phase 4.1 | Client-side encryption |
| API documentation | After Phase 3.2 | Integration guide |
| Status polling endpoint (optional) | Phase 3.6 | Check trade status |

### To Dev 1 (Smart Contracts) — YOU PROVIDE:

| Resource | When | Purpose |
|----------|------|---------|
| CRE executor wallet address | Phase 3.1 | Whitelist in OTCSettlement |
| Settlement proof format | Phase 3.5 | ProofVerifier integration |

---

## 🗺️ Suggested Development Timeline

### Day 3 (First Day)

**Morning:**
- [ ] Complete Phase 3.1 setup
- [ ] Initialize CRE project
- [ ] Test connection to Tenderly RPC
- [ ] Build Workflow 1 (Trade Intake) skeleton

**Afternoon:**
- [ ] Implement World ID validation in Workflow 1
- [ ] Build decryption logic
- [ ] Test intake endpoint with mock data
- [ ] Share endpoint URL with Dev 2

**Evening:**
- [ ] Start Workflow 2 (Matching Engine)
- [ ] Implement basic matching algorithm
- [ ] Test with mock orderbook

### Day 4 (Second Day)

**Morning:**
- [ ] Complete matching engine
- [ ] Build Workflow 3 (Funds Check)
- [ ] Coordinate with Dev 1 for contract addresses

**Afternoon:**
- [ ] Build Workflow 4 (Settlement)
- [ ] Test settlement flow on Tenderly TestNet
- [ ] Build Workflow 5 (Notification)

**Evening:**
- [ ] Phase 4: Generate keypair
- [ ] Share public key with Dev 2
- [ ] Run privacy audit
- [ ] Confirm zero data leakage

---

## 🧪 Testing Checklist

### Unit Tests (Per Workflow)

**Workflow 1 (Intake):**
- [ ] Valid World ID proof → accepted
- [ ] Invalid World ID proof → rejected (401)
- [ ] Reused nullifier → rejected (409)
- [ ] Malformed encrypted intent → rejected (400)
- [ ] Successful decryption → tradeId returned

**Workflow 2 (Matching):**
- [ ] Price overlap → match created
- [ ] No price overlap → no match
- [ ] Expired order → cleaned up
- [ ] Partial fills → handled correctly (optional)
- [ ] Best price priority → correct order

**Workflow 3 (Funds Check):**
- [ ] Sufficient funds → proceed to settlement
- [ ] Buyer insufficient → match cancelled
- [ ] Seller insufficient → match cancelled
- [ ] Contract call failure → error handled

**Workflow 4 (Settlement):**
- [ ] Settlement tx confirmed → proof generated
- [ ] Settlement tx failed → error handled
- [ ] Proof recorded on-chain → verified
- [ ] Multiple settlements → no conflicts

**Workflow 5 (Notification):**
- [ ] Both parties notified → confirmed
- [ ] Notification includes Explorer link → verified
- [ ] Polling endpoint returns correct status → tested

### Integration Tests

- [ ] End-to-end flow: Submit → Match → Settle → Notify
- [ ] Two trades submitted → both matched and settled
- [ ] No match scenario → refund triggered
- [ ] Concurrent trades → no race conditions

### Privacy Audit

- [ ] CRE logs inspected → NO plaintext data
- [ ] Tenderly traces inspected → NO leaked amounts/prices
- [ ] On-chain calldata inspected → ONLY hashes visible
- [ ] Error messages tested → NO sensitive data in errors

---

## 🚨 Common Pitfalls to Avoid

1. **Logging Plaintext Data**
   - ❌ `console.log(trade_intent)`
   - ✅ `console.log(trade_id_hash)`

2. **Storing Private Key Outside CC**
   - ❌ `.env` file with private key
   - ✅ Confidential Compute memory only

3. **Public Transaction Data**
   - ❌ `settle(amount=1000, price=3500)`
   - ✅ `settle(tradeId=hash, amounts=[...])`

4. **Nullifier Reuse**
   - ❌ Not checking if nullifier already used
   - ✅ Maintain nullifier registry and check

5. **Hardcoded Addresses**
   - ❌ Contract addresses in code
   - ✅ Load from config (shared by Dev 1)

6. **Missing Error Handling**
   - ❌ Assume all txs succeed
   - ✅ Try/catch, retry logic, fallbacks

---

## 📚 Resources You Need

### Documentation Links

- [Chainlink CRE Documentation](https://docs.chain.link/chainlink-functions)
- [CRE Confidential Compute Guide](https://docs.chain.link/chainlink-functions/resources/confidential-compute)
- [World ID Off-Chain Verification](https://docs.worldcoin.org/verifying-proofs/off-chain)
- [Tenderly Virtual TestNets](https://docs.tenderly.co/virtual-testnets)
- [Web3.py Documentation](https://web3py.readthedocs.io/) (if using Python)

### API Credentials Needed

- [ ] Chainlink CRE API key (early access)
- [ ] Tenderly access token (from Dev 1)
- [ ] World ID API credentials (for off-chain verification)

### Configuration Files

```json
// config/tenderly-rpc.json (from Dev 1)
{
  "ethereum": "https://rpc.tenderly.co/fork/...",
  "base": "https://rpc.tenderly.co/fork/..."
}

// config/contract-addresses.json (from Dev 1)
{
  "ethereum": {
    "EscrowVault": "0x...",
    "OTCSettlement": "0x...",
    "ProofVerifier": "0x..."
  },
  "base": {
    "EscrowVault": "0x...",
    "OTCSettlement": "0x...",
    "ProofVerifier": "0x..."
  }
}

// config/tokens.json
{
  "ETH": "0x0000000000000000000000000000000000000000",
  "USDC": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  "WBTC": "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
}
```

---

## ✅ Final Checklist Before Phase 6 Integration

Before moving to Phase 6 (Integration with other devs):

**Workflow Status:**
- [ ] All 5 workflows deployed to CRE
- [ ] Intake endpoint accessible from internet
- [ ] Matching engine running on schedule
- [ ] Settlement successfully triggers contracts
- [ ] Notifications working

**Security Status:**
- [ ] Private key never exposed
- [ ] Public key shared with Dev 2
- [ ] No data leakage in logs/traces
- [ ] World ID validation working
- [ ] Nullifier registry preventing replays

**Integration Status:**
- [ ] Contract addresses configured (from Dev 1)
- [ ] Tenderly RPC connected (from Dev 1)
- [ ] CRE executor whitelisted (with Dev 1)
- [ ] Endpoint URL shared (to Dev 2)
- [ ] Public key shared (to Dev 2)

**Documentation Status:**
- [ ] Architecture diagram created
- [ ] API docs written
- [ ] Workflow source exported
- [ ] Privacy audit documented

---

## 🎯 Success Criteria

**You know Phase 3 + 4 is complete when:**

1. ✅ You can submit an encrypted trade via HTTP endpoint
2. ✅ World ID proof is validated correctly
3. ✅ Matching engine finds and matches two compatible orders
4. ✅ Funds check calls `EscrowVault.getBalance()` successfully
5. ✅ Settlement execution calls `OTCSettlement.settle()` and confirms on Tenderly
6. ✅ Settlement proof is recorded via `ProofVerifier`
7. ✅ Both parties receive notification with Explorer link
8. ✅ Privacy audit shows ZERO data leakage
9. ✅ Dev 2 can integrate with your endpoint
10. ✅ Dev 1's contracts can be called by your CRE workflows

---

## 🤝 Coordination Points

### Daily Sync Agenda (Your Talking Points)

**Mid-point sync (Day 3 PM):**
- "I need contract ABIs and addresses from Dev 1"
- "Here's the CRE endpoint URL for Dev 2"
- "Here's the public encryption key for Dev 2"
- "I need my executor address whitelisted in OTCSettlement"

**Integration sync (Day 5 AM):**
- "Intake endpoint is live, Dev 2 can start testing"
- "I can call all three contracts on Tenderly"
- "Matching engine is running every 30 seconds"
- "Privacy audit passed - no leaks"

---

## 📊 Architecture Diagram (For Your README)

```
┌─────────────────────────────────────────────────────────────┐
│                      World Mini App                         │
│              (Dev 2 - Frontend)                             │
└───────────────────────┬─────────────────────────────────────┘
                        │ Encrypted Trade Intent
                        │ World ID Proof
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                  CRE Workflow Layer                         │
│                  (Dev 3 - YOU)                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Workflow 1: Trade Intake                            │  │
│  │  - Validate World ID                                 │  │
│  │  - Decrypt intent                                    │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Workflow 2: Confidential Matching                   │  │
│  │  - Price-time priority                               │  │
│  │  - Runs in Confidential Compute                      │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Workflow 3: Funds Check                             │  │
│  │  - Calls EscrowVault.getBalance()                    │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Workflow 4: Settlement                              │  │
│  │  - Calls OTCSettlement.settle()                      │  │
│  │  - Generates proof                                   │  │
│  │  - Records via ProofVerifier                         │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Workflow 5: Notification                            │  │
│  │  - Callbacks to parties                              │  │
│  │  - Tenderly Explorer links                           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│            Tenderly Virtual TestNets                        │
│            (Dev 1 - Smart Contracts)                        │
│  ┌──────────────┐  ┌────────────────┐  ┌────────────────┐  │
│  │ EscrowVault  │  │ OTCSettlement  │  │ ProofVerifier  │  │
│  └──────────────┘  └────────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

**Good luck, Dev 3! You're building the core that makes PrivOTC truly confidential. 🚀**
