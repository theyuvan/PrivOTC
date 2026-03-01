# Hackathon Tracks — PrivOTC Alignment

> Overview of all sponsor tracks PrivOTC is targeting, with requirements and resources.

---

## Track 1 — Privacy (Chainlink)

**Focus:** Projects that use **Chainlink Confidential Compute** (early access) for private transactions and/or **CRE's Confidential HTTP** capability to build privacy-preserving workflows.

Protected elements include:
- API credentials
- Selected request and response data
- Value flows
- Sensitive application logic (executes offchain)

**Use Cases:**
- Secure API connectivity
- Compliant non-public token movement
- Decentralized workflows without exposing secrets, sensitive inputs/outputs, or internal transaction flows onchain

> **Note:** Confidential HTTP and Chainlink Confidential Compute (early access) available from **Feb 16th**.

### How PrivOTC Qualifies
- Trade intents are encrypted and processed inside Confidential Compute
- Matching logic runs offchain via CRE — never exposed onchain
- Only settlement proof is written to the blockchain

---

## Track 2 — Best Use of World ID with CRE

**Focus:** Projects that integrate **World ID** with **CRE** for privacy-preserving proof of unique humanness and Sybil resistance.

**Key Requirements:**
- World ID is natively supported on: Ethereum, Optimism, World Chain
- World ID proofs can also be verified **off-chain**
- Track invites builders to enable World ID on blockchains where it is **not natively supported**
- Proof verification can be done **on-chain** or **off-chain within CRE**

### Resources
- [World ID Documentation](https://docs.worldcoin.org/)
- [Frontend (IDKit) Documentation](https://docs.worldcoin.org/idkit)
- [Off-Chain Proof Verification](https://docs.worldcoin.org/verifying-proofs/off-chain)
- [On-Chain Proof Verification](https://docs.worldcoin.org/verifying-proofs/on-chain)

### How PrivOTC Qualifies
- Users verify humanity via World ID inside the World Mini App
- CRE validates World ID proofs offchain before allowing trade participation
- Blocks bots and fake liquidity from entering the OTC order book

---

## Track 3 — Best Usage of CRE within a World Mini App

**Focus:** Projects that integrate **CRE into a World Mini App** to extend Mini App capabilities beyond World Chain.

**Key Requirements:**
- Mini Apps are web apps inside World App's webview
- Use **MiniKit SDK** to:
  - Connect user wallet
  - Send gas-free transactions on World Chain
  - Request World ID proofs
- Mini Apps natively support **World Chain only**
- Track invites builders to use CRE to access **other chains or off-chain sources** within a Mini App

### Resources
- [Mini Apps Documentation](https://docs.worldcoin.org/mini-apps)
- [Mini Apps Quickstart Guide](https://docs.worldcoin.org/mini-apps/quickstart)
- [World ID Documentation](https://docs.worldcoin.org/)

### How PrivOTC Qualifies
- PrivOTC frontend is built as a **World Mini App**
- CRE bridges the Mini App to Ethereum, Base, and other EVM chains
- Users submit encrypted trade intents and receive settlement proofs — all within the Mini App
- Gas-free World Chain transactions used for identity and proof submission

---

## Track 4 — Build CRE Workflows with Tenderly Virtual TestNets

**Focus:** Innovative **CRE workflow** projects orchestrated and tested on **Tenderly Virtual TestNets**.

**Capabilities Combined:**
| CRE | Tenderly Virtual TestNets |
|---|---|
| Connect any blockchain, API, or external system | Instant mainnet state synchronization |
| Verifiable execution via decentralised oracle networks | Unlimited faucets |
| Advanced multichain workflow orchestration | Customizable network state |
| Built-in tools for onchain actions | Built-in debugging tools |

**Example Projects (from track brief):**
- Cross-Chain Bridge Application
- Custom Data Feeds (NAV, Proof of Reserve, market data)
- AI Agent Orchestration

### Submission Requirements
All submissions **must** include:

- [ ] **Tenderly Virtual TestNet Explorer Link** — deployed contracts + transaction history for CRE workflow
- [ ] **GitHub Repository** — CRE workflows, smart contracts, deployment scripts, documentation
- [ ] **CRE Workflow Demonstration** — showing Chainlink orchestration integrated with Virtual TestNets
- [ ] **Documentation** — use case, architecture, and how CRE + Virtual TestNets solve the problem

### Resources
- [Virtual TestNets Documentation](https://docs.tenderly.co/virtual-testnets)
- [Quickstart Guide](https://docs.tenderly.co/virtual-testnets/quickstart)

### How PrivOTC Qualifies
- All OTC settlement flows are tested on **Tenderly Virtual TestNet forks** of Ethereum and Base
- CRE workflows execute simulated atomic swaps using real mainnet liquidity state
- Explorer links show full transaction history and contract interaction
- Judges can trace every step of the workflow end-to-end

---

## Track Summary — PrivOTC Coverage

| Track | Sponsor | PrivOTC Status |
|---|---|---|
| Privacy (Confidential Compute + HTTP) | Chainlink | ✅ Core architecture |
| Best Use of World ID with CRE | World / Chainlink | ✅ Identity layer |
| Best Usage of CRE in World Mini App | World / Chainlink | ✅ Frontend layer |
| CRE Workflows with Tenderly Virtual TestNets | Tenderly / Chainlink | ✅ Testing layer |

> All four tracks are satisfied by a **single unified architecture**.
