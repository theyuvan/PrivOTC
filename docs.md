
Talk to an expert

CHAINLINK PRIVACY STANDARD
Private transactions on any blockchain
Execute private payments, tokenize RWAs, distribute data, and prove compliance without exposing identities, proprietary data, or business logic.

Talk to an expert
Learn more
Privacy-preserving connectivity
Transact across blockchains, enterprise networks, and leverage Chainlink services while keeping data, logic, and transaction details private.

Compatible with public and private chains
Access confidential compute on any blockchain without migrating your smart contracts—build once, connect anywhere without vendor lock-in.

Verifiable and performant confidential computing
Combine trusted execution environment performance with decentralized compute, multi-cloud deployment, and advanced encryption for institutional-grade security and scale.

Decentralized secrets management
Reduce exposure and protect proprietary information, as all your sensitive data is threshold-encrypted, with only the minimum required inputs ever decrypted and processed.

Power previously impossible institutional use cases
Private Payments
Privacy-Preserving Tokenization
Data Distribution
API Access
Interoperability
Compliance

Privacy-preserving settlement and payments
Delivery-versus-Payment (DvP) for tokenized securities

Payment-versus-Payment (PvP) for cross-border FX

Stablecoin and tokenized deposit settlement

Margin calls and variation margin settlement

Cross-chain settlement (e.g., bank money ↔ public chains)

A major breakthrough in privacy technology
Based on R&D from the world-class Chainlink Labs research team, Chainlink introduces architectural innovations in confidential computing that combine high performance with cryptographically verifiable security, making an entire new class of private smart contracts possible.

Learn more
Read the whitepaper

Privacy deep dives and insights
Explore the latest blogs, videos, and technical research.


How Chainlink Enables Privacy for Institutional Onchain Finance
video

Solving the Blockchain Privacy Problem for Institutional Adoption
video

What is Chainlink Confidential Compute?
video
Built on the Chainlink Runtime Environment (CRE)
Confidential Compute is part of CRE, the all-in-one orchestration layer for building institutional-grade smart contracts across any blockchain or existing system.

Learn more about CRE

01
Write workflow including private capabilities

02
Encrypt private computation workflow and deploy with CRE CLI

03
Workflow execution initiated

04
Chainlink DKG generates threshold decryption shares for private workflow and data

05
TEE decrypts private workflow and data, initiates execution

06
Attestation and output validated by DONs and write output to chains


Build privacy-enabled use cases with Chainlink
Talk to an expert
Learn more

Get the Institutional Digital Assets Digest
Email address

Yes, I agree to receive email communications
Get the latest Chainlink content straight to your inbox.
Email address

Yes, I agree to receive email communications
platform
Overview
Runtime Environment (CRE) NEW
Cross-Chain (CCIP)
Privacy Standard NEW
Digital Transfer Agent (DTA)
Automated Compliance (ACE)
Data Streams
Market and Data Feeds
DataLink NEW
Proof of Reserve
SmartData
Use Cases
Tokenized assets
Stablecoins
Payments & settlement
DeFi
Blockchain ecosystems
Get Involved
Build program
Get certified
Become an expert
Chainlink Hackathon
Bootcamp
Code of conduct
developers
Docs
DevHub
Faucets
Tutorials
What's happening
Blog
Events
Newsroom
Community
ecosystem
Become a data provider
Staking
Economics
Chainlink Rewards
Chainlink® © 2026 Chainlink Foundation
Terms
Privacy
Brand
Security
Support
Legal

Chainlink Runtime Environment (CRE)
What is CRE?
Chainlink Runtime Environment (CRE) is the all-in-one orchestration layer unlocking institutional-grade smart contracts—data-connected, compliance-ready, privacy-preserving, and interoperable across blockchains and existing systems.

Using the CRE SDK (available in Go and TypeScript), you build Workflows. Using the CRE CLI, you compile them into binaries and deploy them to production, where CRE runs them across a Decentralized Oracle Network (DON).

Each workflow is orchestrated by a Workflow DON (Decentralized Oracle Network) that monitors for triggers and coordinates execution.
The workflow can then invoke specialized Capability DONs—for example, one that fetches offchain data or one that writes to a chain.
During execution, each node in a DON performs the requested task independently.
Their results are then cryptographically verified and aggregated via a Byzantine Fault Tolerant (BFT) consensus protocol. This guarantees a single, correct, and consistent outcome.
What you can do today
Build and simulate (available now)
You can start building and simulating CRE workflows immediately, without any approval:

Create an account at cre.chain.link to access the platform
Install the CRE CLI on your machine
Build workflows using the Go or TypeScript SDKs
Simulate workflows to test and debug before deployment
Simulation compiles your workflows into WebAssembly (WASM) and runs them on your machine—but makes real calls to live APIs and public EVM blockchains. This gives you confidence your workflow will work as expected when deployed to a DON.

Deploy your workflows (Early Access)
caution
Early Access: Disclaimer

Chainlink Runtime Environment (CRE) deployment is in the "Early Access" stage of development, which means that CRE currently has functionality which is under development and may be changed in later versions. By using CRE, you expressly acknowledge and agree to accept the Chainlink Terms of Service, which provides important information and disclosures.

Early Access to workflow deployment includes:

Deploy and run workflows on a Chainlink DON
Workflow lifecycle management: Deploy, activate, pause, update, and delete workflows through the CLI
Monitoring and debugging: Access detailed logs, events, and performance metrics in the CRE UI
To request Early Access, run cre account access from the CLI or visit cre.chain.link/request-access. See Requesting Deploy Access for details.

How CRE runs your workflows
Now that you understand what CRE is, let's explore how it executes your workflows.

The trigger-and-callback model
Workflows use a trigger-and-callback model to provide a code-first developer experience. This model is the primary architectural pattern you will use in your workflows. It consists of three simple parts:

A Trigger: An event source that starts a workflow execution (e.g., cron.Trigger). This is the "when" of your workflow.
A Callback: A function that contains your business logic. It is inside this function that you will use the SDK's clients to invoke capabilities. This is the "what" of your workflow.
The handler(): The glue that connects a single trigger to a single callback.
You can define multiple trigger and callback combinations in your workflow. You can also attach the same callback to multiple triggers for reusability.

Here's what the trigger-and-callback pattern looks like:

Example Handler (Go)

Go

TypeScript

cre.Handler(
  cron.Trigger(&cron.Config{Schedule: "0 */10 * * * *"}), // Trigger fires every 10 minutes
  onCronTrigger, // your Go callback
)
​
func onCronTrigger(config *Config, runtime cre.Runtime, trigger *cron.Payload) (struct{}, error) {
  // Create SDK clients and call capabilities
  return struct{}{}, nil
}
note
Each trigger fire = independent execution

Each time a trigger fires, it starts a fresh, independent execution of your callback function. Callbacks are stateless—there is no persistent state between executions. The value you return from a callback represents the result of that specific execution, not a stored workflow state.

Execution lifecycle
When a trigger fires, the Workflow DON orchestrates the execution of your callback function on every node in the network. Each execution is independent and stateless—your callback runs, performs its work, returns a result, and completes. Inside your callback, you create SDK clients and invoke capabilities.

Each capability call is an asynchronous operation that returns a Promise—a placeholder for a future result. This allows you to pipeline multiple capability calls and run them in parallel.

Your callback typically follows this pattern:

Invoke multiple capabilities in parallel (each returns a Promise immediately)
Await the consensus-verified results
Use the trusted results in your business logic
Optionally perform final actions like writing back to a blockchain
For every capability you invoke, CRE handles the underlying process of having a dedicated DON execute the task, reach consensus, and return the verified result.

Built-in consensus for every operation
One of CRE's most powerful features is that every capability execution automatically includes consensus. When your workflow invokes a capability (like fetching data from an API or reading from a blockchain), multiple independent nodes perform the operation. Their results are then validated and aggregated through a Byzantine Fault Tolerant (BFT) consensus protocol, ensuring a single, verified outcome.

This means your entire workflow—not just the onchain parts—benefits from the same security and reliability guarantees as blockchain transactions. Unlike traditional applications that rely on a single API provider or RPC endpoint, CRE eliminates single points of failure by having multiple nodes independently verify every operation.

Learn more about Consensus Computing in CRE.

Glossary: Building blocks
Concept	One-liner
Workflow	Compiled WebAssembly (WASM) binary.
Handler	handler(trigger, callback) pair; the atom of execution.
Trigger	Event that starts an execution (cron, HTTP, EVM log, …).
Callback	Function that runs when its trigger fires; contains your logic.
Runtime	Object passed to a callback; used to invoke capabilities.
Capability	Decentralized microservice (chain read/write, HTTP Fetch, ...).
Workflow DON	Watches triggers and coordinates the workflow.
Capability DON	Executes a specific capability.
Consensus	BFT protocol that merges node results into one verifiable report.
Full definitions live on Key Terms and Concepts.

Why build on CRE?
Unified cross-domain orchestration: Seamlessly combine onchain and offchain operations in a single workflow. Read from multiple blockchains, call authenticated APIs, perform computations, and write results back onchain or offchain—all orchestrated by CRE.

Institutional-grade security by default: Every operation—API calls, blockchain reads, computations—runs across multiple independent nodes with Byzantine Fault Tolerant consensus. Your workflows inherit the same security guarantees as blockchain transactions.

One platform, any chain: Build your logic once and connect to any supported blockchain. No need to deploy separate infrastructure for each chain you support.

Code-first developer experience: Write workflows in Go or TypeScript using familiar patterns. The SDK abstracts away the complexity of distributed systems, letting you focus on your business logic.

Where to go next?
New to CRE?
Start here:

Create Your Account - Set up your CRE account (required for all CLI commands)
Install the CLI - Download and install the cre command-line tool
Then choose your path:

Learn by building: Getting Started Guide - Step-by-step guide where you build your first workflow, learning core concepts along the way
Quick start: Run the Custom Data Feed Demo - See a production-ready workflow in action. Just follow the steps to run a complete, pre-built example
Already familiar?
Jump to what you need:

Workflow Guides - Learn how to use triggers, make API calls, and interact with blockchains
Workflow Operations - Simulate, deploy, and manage your workflows
SDK Reference - Detailed API documentation for Go and TypeScript SDKs

Key Terms and Concepts
This page defines the fundamental terms and concepts for the Chainlink Runtime Environment (CRE).

High-level concepts
Chainlink Runtime Environment (CRE)
The all-in-one orchestration layer unlocking institutional-grade smart contracts—data-connected, compliance-ready, privacy-preserving, and interoperable across blockchains and existing systems

Decentralized Oracle Network (DON)
A decentralized, peer-to-peer network of independent nodes that work together to execute a specific task. In CRE, there are two primary types of DONs: Workflow DONs that orchestrates the workflow, and specialized Capability DONs that execute specific tasks like blockchain interactions.

Workflow architecture
Workflow
A workflow uses the CRE SDK (Go or TypeScript) and comprises one or more handlers, which define the logic that executes when events (triggers) occur. CRE compiles the workflow to a WASM binary and runs it on a Workflow DON.

Handler
The basic building block of a workflow, created using the cre.Handler function. It connects a single Trigger event to a single Callback function.

Trigger
An event source that initiates the execution of a handler's callback function. Examples include Cron trigger, HTTP trigger, and EVM Log trigger. Learn more in the Trigger capability page.

Callback
A function that contains your core logic. It is executed by the Workflow DON every time its corresponding trigger fires.

The developer's toolkit: The CRE SDK
Runtime & NodeRuntime
Short-lived objects passed to your callback function during a specific execution. The key difference between Runtime and NodeRuntime is who is responsible for creating a single, trusted result from the work of many nodes.

Runtime: Think of it as the "Easy Mode". It is used for operations that are guaranteed to be Byzantine Fault Tolerant (BFT). You ask the network to execute something, and CRE handles the underlying complexity to ensure you get back one final, secure, and trustworthy result.

NodeRuntime: Think of this as the "Manual Mode". It is used when a BFT guarantee cannot be provided automatically (e.g. calling a standard API). You tell each node to perform a task on its own. Each node returns its own individual answer, and you are responsible for telling the SDK how to combine them into a single, trusted result by providing an aggregation algorithm. This is always used inside a cre.RunInNodeMode block.

Learn more about Consensus and Aggregation.

SDK Clients: EVMClient & HTTPClient
The primary SDK clients you use inside a callback to interact with capabilities. For example, you use an EVM client to read from a smart contract and an HTTP client to make offchain API requests.

Language-specific implementations:

Go SDK: evm.Client and http.Client
TypeScript SDK: EVMClient and HTTPClient classes
Bindings (Go SDK only)
A Go package generated from a smart contract's ABI using the cre generate-bindings CLI command. Bindings create a type-safe Go interface for a specific smart contract, abstracting away the low-level complexity of ABI encoding and decoding.

Using generated bindings is the recommended best practice for Go workflows, as they provide helper methods for:

Reading from view/pure functions.
Encoding data structures for onchain writes.
Creating triggers for and decoding event logs.
This makes your workflow code cleaner, safer, and easier to maintain. Learn more in the Generating Contract Bindings guide.

Note for TypeScript: The TypeScript SDK uses Viem for type-safe contract interactions with manual ABI definitions instead of generated bindings.

Async Patterns
Asynchronous operations in the SDK (like contract reads or HTTP requests) return a placeholder for a future result:

Go SDK: Operations return a Promise, and you must call .Await() to pause execution and wait for the result.
TypeScript SDK: Operations return an object with a .result() method that you call to wait for the result.
Secrets
Securely managed credentials (e.g., API keys) made available to your workflow at runtime. Secrets can be fetched within a callback using the runtime's secret retrieval method:

Go SDK: runtime.GetSecret()
TypeScript SDK: runtime.getSecret()
Underlying architectural concepts
Capability
A conceptual, decentralized "microservice" that is backed by its own DON. Capabilities are the fundamental building blocks of the CRE platform (e.g., HTTP Fetch, EVM Read). You do not interact with them directly; instead, you use the SDK's developer-facing clients (like evm.Client) to invoke them.

Consensus
The mechanism by which a DON comes to a single, reliable, and tamper-proof result, even if individual nodes observe slightly different data. Consensus is what makes the outputs of capabilities secure and trustworthy.

Where to go next?
Getting Started: Start building your first workflow.
About CRE: Learn more about the vision and high-level architecture of CRE.

Managing Authentication
This guide covers how to manage your CLI authentication, including browser-based login, API key authentication, checking your status, handling session expiration, and logging out.

Logging in
To authenticate your CLI with your CRE account, use the cre login command. This opens a browser window where you'll enter your credentials and complete two-factor authentication.

For detailed login instructions, see the Logging in with the CLI guide.

API key authentication
note
Deploy access required

API key authentication requires your account to have Early Access approval for deployment. To request Early Access, please share details about your project and use case—this helps us provide better support as you build with CRE.

For CI/CD pipelines or headless environments where a browser is not available, you can authenticate using the CRE_API_KEY environment variable. When set, the CLI uses the API key automatically — no cre login required.

copy to clipboard
export CRE_API_KEY="your-api-key"
cre whoami
API keys are created in the APIs tab of the Organization page in the CRE platform. For full details, see API Key Authentication.

Session expiration
Your CLI session remains authenticated until you explicitly log out or until your session expires. When your session expires, you'll need to log in again.

If you attempt to run a command with an expired session, you'll see an error:

copy to clipboard
Error: failed to attach credentials: failed to load credentials: you are not logged in, try running cre login
To resolve this, simply run cre login again to re-authenticate.

Checking authentication status
To verify that you're logged in and view your account details, use the cre whoami command:

copy to clipboard
cre whoami
This command displays your account information:

copy to clipboard
Account details retrieved:

Email:           email@domain.com
Organization ID: org_mEMRknbVURM9DWsB
Deploy Access:   Not enabled (run 'cre account access' to request)
If you're not logged in, you'll receive an error message prompting you to run cre login.

To check your deploy access status or submit a request, see Requesting Deploy Access.

Logging out
To explicitly end your CLI session and remove your stored credentials, use the cre logout command:

copy to clipboard
cre logout

Requesting Deploy Access
Deploying workflows to a Chainlink DON requires Early Access approval. You can request access in two ways:

From the CLI — Run cre account access to check your status or submit a request directly from your terminal
From the web — Visit cre.chain.link/request-access to fill out the request form
Check your access status
Run the following command to see your current deployment access status:

copy to clipboard
cre account access
Your access status is also shown when you run cre whoami:

copy to clipboard
cre whoami
copy to clipboard
Account details retrieved:

Email:           email@domain.com
Organization ID: org_mEMRknbVURM9DWsB
Deploy Access:   Not enabled (run 'cre account access' to request)
Request deploy access
If your organization does not have deploy access, cre account access will prompt you to submit a request:

copy to clipboard
! Deployment access is not yet enabled for your organization.

  Request deployment access? Yes
After confirming, you'll be asked to briefly describe what you're building:

copy to clipboard
  Briefly describe your use case
  What are you building with CRE?
Once submitted, you'll see:

copy to clipboard
✓ Access request submitted successfully!

Our team will review your request and get back to you via email shortly.
You'll receive a confirmation email, and the Chainlink team will follow up once your request has been reviewed.

note
You can keep building while you wait

Deploy access is only required for cre workflow deploy. You can continue developing and simulating workflows locally with cre workflow simulate while your request is under review.

What happens after approval
Once your organization is granted deploy access, cre whoami will show:

copy to clipboard
Deploy Access:   Enabled
You can then use cre workflow deploy to deploy workflows to the Workflow Registry. See Deploying Workflows for next steps.

Prompted automatically
You don't need to run cre account access proactively. The CLI will prompt you to request access automatically in two situations:

When you run cre workflow deploy without access
After a successful cre workflow simulate, as a reminder that deployment is available once access is granted


Linking Wallet Keys
Before you can deploy workflows, you must link a public key address to your CRE organization. This process registers your wallet address onchain in the Workflow Registry contract—the smart contract on Ethereum Mainnet that stores and manages all CRE workflows—associating it with your organization and allowing you to deploy and manage workflows.

What is key linking?
Key linking is the process of connecting a blockchain wallet address to your CRE organization. Once linked, this address becomes a workflow owner address that can deploy, update, and delete workflows in the Workflow Registry.

Key benefits:

Multiple team members can link their own addresses to the same organization
Each linked address can independently deploy and manage workflows
Addresses are labeled for easy identification (e.g., "Production Wallet", "Dev Wallet")
All linked addresses are visible to organization members via 
cre account list-key
Copy to clipboard
Important constraints:

One organization per address: Each wallet address can only be linked to one CRE organization at a time. If you need to use the same address with a different organization, you must first unlink it from the current organization.
Maximum 2 keys per organization: Each organization can link a maximum of 2 web3 keys. If you need to link a third key, you must first unlink one of the existing keys.
However, an organization can have multiple wallet addresses linked to it, allowing team members to use their own addresses or enabling separation between development, staging, and production environments.

note
Already linked to another organization?

If you try to link an address that's already registered with another organization, the CLI will display an error. To use this address with your current organization, you must first unlink it from the other organization using 
cre account unlink-key
Copy to clipboard
 (note: this will delete all workflows registered under that address in the other organization).

Prerequisites
Before linking a key, ensure you have:

CRE CLI installed and authenticated: See CLI Installation and Logging in with the CLI
A CRE project directory: You must run the command from a project directory that contains a project.yaml file
Private key in .env: Set CRE_ETH_PRIVATE_KEY=<your_64_character_hex_key> (without 0x prefix) in your .env file
Funded wallet: Your wallet must have ETH on Ethereum Mainnet to pay for gas fees (the Workflow Registry contract is deployed on Ethereum Mainnet)
Unlinked address: The wallet address must not already be linked to another CRE organization. Each address can only be associated with one organization at a time.
caution
Never commit your .env file

Your .env file contains sensitive private keys. Ensure it's listed in .gitignore and never committed to version control.

Linking your first key
The easiest way to link a key is to let the deployment process handle it automatically. When you first try to deploy a workflow, the CLI will detect that your address isn't linked and prompt you to link it.

Automatic linking during deployment
Navigate to your project directory (where your .env file is located)

Attempt to deploy a workflow:

copy to clipboard
cre workflow deploy my-workflow --target production-settings
The CLI will detect that your address isn't linked and prompt you:

copy to clipboard
Verifying ownership...
Workflow owner link status: owner=<your_owner_address>, linked=false
Owner not linked. Attempting auto-link: owner=<your_owner_address>
Linking web3 key to your CRE organization
Target :                 production-settings
✔ Using Address :        <your_owner_address>

✔ Provide a label for your owner address: █
Enter a descriptive label for your address

Review the transaction details and confirm

The CLI will submit the transaction and continue with the deployment once the key is linked.

Manual linking
You can also link a key manually before attempting to deploy:

copy to clipboard
cre account link-key --target production-settings
Interactive flow:

The CLI derives your public address from the private key in .env
You're prompted to provide a label
The CLI checks if the address is already linked
Transaction details are displayed (chain, contract address, estimated gas cost)
You confirm to execute the transaction
The transaction is submitted and you receive a block explorer link
Example output:

copy to clipboard
Linking web3 key to your CRE organization
Target :                 production-settings
✔ Using Address :        <your_owner_address>

Provide a label for your owner address: <your_owner_label>

Checking existing registrations...
✓ No existing link found for this address
Starting linking: owner=<your_owner_address>, label=<your_owner_label>
Contract address validation passed
Transaction details:
  Chain Name:   ethereum-mainnet
  To:           0x4Ac54353FA4Fa961AfcC5ec4B118596d3305E7e5 # Workflow Registry contract address
  Function:     LinkOwner
  ...
Estimated Cost:
  Gas Price:      0.12450327 gwei
  Total Cost:     0.00001606 ETH
? Do you want to execute this transaction?:
  ▸ Yes
    No
After confirming, you'll see:

copy to clipboard
Transaction confirmed
View on explorer: https://etherscan.io/tx/<your_transaction_hash>

[OK] web3 address linked to your CRE organization successfully

→ You can now deploy workflows using this address
Viewing linked keys
To see all addresses linked to your organization:

copy to clipboard
cre account list-key
Example output:

copy to clipboard
Workflow owners retrieved successfully:

Linked Owners:

  1. JohnProd
     Owner Address:     <public_owner_address>
     Status:            VERIFICATION_STATUS_SUCCESSFULL
     Verified At:       2025-10-21T17:22:24.394249Z
     Chain Selector:    5009297550715157269 # Chain selector for Ethereum Mainnet
     Contract Address:  0x4Ac54353FA4Fa961AfcC5ec4B118596d3305E7e5 # Workflow Registry contract address

  2. JaneProd
     Owner Address:     <public_owner_address>
     Status:            VERIFICATION_STATUS_SUCCESSFULL
     Verified At:       2025-10-21T17:22:24.394249Z
     Chain Selector:    5009297550715157269 # Chain selector for Ethereum Mainnet
     Contract Address:  0x4Ac54353FA4Fa961AfcC5ec4B118596d3305E7e5 # Workflow Registry contract address
Understanding the output:

Label: The friendly name you provided (e.g., "JohnProd", "JaneProd")
Owner Address: The public address linked to your organization
Status: VERIFICATION_STATUS_SUCCESSFULL (linked and verified)
Verified At: Timestamp when the link was confirmed onchain
Chain Selector: The chain identifier where the Workflow Registry contract is deployed
Contract Address: The Workflow Registry contract address
note
Organization-wide visibility

All members of your organization can see all linked addresses using cre account list-key. This helps teams coordinate workflow ownership and deployment.

Linking multiple addresses
Your organization can link up to 2 wallet addresses. Each individual address can only be linked to one organization at a time.

This is useful for:

Separation of concerns: Different addresses for development, staging, and production
Team collaboration: Each team member uses their own address
Multi-sig wallets: Link a multi-sig address alongside individual addresses
To link another address:

Update your .env file with the new private key
Run cre account link-key --target <target-name> again
Provide a unique label to distinguish this address
Unlinking a key
If you need to remove a linked address from your organization, you can use the cre account unlink-key command. This is useful when:

Rotating addresses for security reasons
Removing addresses that are no longer in use
Cleaning up test or development addresses
caution
Destructive operation

Unlinking a key will permanently delete all workflows registered under that address. This action cannot be undone. Make sure you want to permanently remove all associated workflows before proceeding.

To unlink a key:

Ensure your .env file contains the private key of the address you want to unlink

Run the unlink command:

copy to clipboard
cre account unlink-key --target production-settings
Confirm the operation when prompted

The CLI will submit an onchain transaction to remove the address from the Workflow Registry. After the transaction is confirmed, the address and all its associated workflows will be deleted.

Unlinking a key without the original private key
If you need to unlink a key but no longer have access to the original private key (for example, the key owner left your organization), you can still complete the unlinking process using a different wallet.

caution
Destructive operation

Unlinking a key will permanently delete all workflows registered under that address. This action cannot be undone. Make sure you want to permanently remove all associated workflows before proceeding.

How it works
When you run cre account unlink-key --unsigned while logged into your CRE organization, the CLI generates:

An authorization signature proving you have permission to unlink the key (through your CRE organization membership)
Raw transaction data that any funded wallet can submit to the blockchain
note
Security

The authorization is tied to the organization, not to the individual who originally linked the key. Any authenticated member of the CRE organization can generate valid unlink authorization for keys linked to that organization.

Prerequisites
Logged in to CRE CLI: You must be authenticated as a member of the CRE organization that owns the key
workflow-owner-address configured: Set this in your project.yaml to the address you want to unlink
A funded wallet: Any wallet with ETH on Ethereum Mainnet to submit the transaction and pay gas fees
Steps
Configure your project.yaml with the address you want to unlink:

copy to clipboard
production-settings:
  account:
    workflow-owner-address: "<address_to_unlink>"
  # ... other settings
Generate the unsigned transaction:

copy to clipboard
cre account unlink-key --unsigned --target production-settings
Example output:

copy to clipboard
Unlinking web3 key from your CRE organization
Target :                 production-settings
✔ Using Address :        0x....

Starting unlinking: owner=0x....
✔ Yes
Contract address validation passed
--unsigned flag detected: transaction not sent on-chain.
Generating call data for offline signing and submission in your preferred tool:

Ownership unlinking initialized successfully!

Next steps:

   1. Submit the following transaction on the target chain:

      Chain:            ethereum-mainnet
      Contract Address: 0x4Ac54353FA4Fa961AfcC5ec4B118596d3305E7e5

   2. Use the following transaction data:

      39d68c6a000000000000000000...

Unlinked successfully
Submit the transaction using any wallet that supports sending transactions with custom data.

caution
Destructive operation

Unlinking a key will permanently delete all workflows registered under that address. This action cannot be undone. Make sure you want to permanently remove all associated workflows before proceeding.

Here's an example using MetaMask:

In MetaMask, go to Settings → Advanced and enable "Show hex data"
Click Send and enter the contract address as the recipient 
0x4Ac54353FA4Fa961AfcC5ec4B118596d3305E7e5
Copy to clipboard
Set the amount to 0 ETH
Paste the transaction data in the Hex data field (add 0x prefix)
Review and confirm the transaction
The unlink operation completes once the transaction is confirmed onchain. All workflows registered under that address will be permanently deleted.

Non-interactive mode
For automation or CI/CD pipelines, use the --yes flag to skip confirmation prompts:

copy to clipboard
cre account link-key --owner-label "CI Pipeline Wallet" --yes --target production-settings
Using multi-sig wallets
If you're using a multi-sig wallet, you'll need to use the --unsigned flag to generate raw transaction data that you can then submit through your multi-sig interface (such as Safe).

Prerequisites for multi-sig
Configure your multi-sig address in project.yaml under the account section:

copy to clipboard
production-settings:
  account:
    workflow-owner-address: "<your_multisig_address>"
  # ... other settings
Ensure your .env file contains the private key of any signer from the multi-sig wallet (used only for signature generation, not for sending transactions)

Linking a multi-sig address
Run the link-key command with the --unsigned flag:

copy to clipboard
cre account link-key --owner-label "SafeWallet" --target production-settings --unsigned
Example output:

copy to clipboard
Linking web3 key to your CRE organization
Target :                 production-settings
✔ Using Address :        <your_multisig_address>

Checking existing registrations...
✓ No existing link found for this address
Starting linking: owner=<your_multisig_address>, label=SafeWallet
Contract address validation passed
--unsigned flag detected: transaction not sent on-chain.
Generating call data for offline signing and submission in your preferred tool:

Ownership linking initialized successfully!

Next steps:

   1. Submit the following transaction on the target chain:
      Chain:            ethereum-mainnet
      Contract Address: 0x4Ac54353FA4Fa961AfcC5ec4B118596d3305E7e5

   2. Use the following transaction data:

      dc1019690000000000000000000000000000000000000000000000000000000068fd2f9465259a804e880ee30de0fcc2b81ee25d598ee1601e13ace2c2ec10202869706800000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000041bd0f40824a1fdce10ee1091703833fb3d4497b3f681f6edee6b159d217326185407ce16eb1c668c90786421b053d4d25401f422aa90d156c35659d7c3e2e13221b00000000000000000000000000000000000000000000000000000000000000

Linked successfully
Submitting through your multi-sig interface
Copy the transaction data provided in the CLI output
Open your multi-sig interface (e.g., Safe app at https://app.safe.global)
Create a new transaction with:
To address: 
0x4Ac54353FA4Fa961AfcC5ec4B118596d3305E7e5
Copy to clipboard
 (Workflow Registry contract)
Value: 
0
Copy to clipboard
 (no ETH transfer)
Data: Paste the transaction data from the CLI output (add 
0x
Copy to clipboard
 prefix if required by your multi-sig interface)
Submit and collect signatures from the required number of signers
Execute the transaction once you have enough signatures
Note: If your multi-sig interface requires the RegistryWorkflow contract ABI, you can copy it from Etherscan.

Verifying the multi-sig link
After the multi-sig transaction is executed onchain, you can verify the link status:

copy to clipboard
cre account list-key
Initially, you'll see the address with a VERIFICATION_STATUS_PENDING status:

copy to clipboard
Workflow owners retrieved successfully:

Linked Owners:

  1. SafeWallet
     Owner Address:     <your_multisig_address>
     Status:            VERIFICATION_STATUS_PENDING
     Verified At:
     Chain Selector:    5009297550715157269 # Chain selector for Ethereum Mainnet
     Contract Address:  0x4Ac54353FA4Fa961AfcC5ec4B118596d3305E7e5 # Workflow Registry contract address
Once the transaction is confirmed onchain, the status will change to VERIFICATION_STATUS_SUCCESSFULL and the Verified At timestamp will be populated.

note
Multi-sig for workflow operations

Once your multi-sig address is linked, you'll also need to use the --unsigned flag for workflow deployment and management commands (deploy, activate, pause, delete). See the Deploying Workflows guide for more details on using multi-sig wallets with workflow operations.

Learn more
Understanding Organizations - Learn about organization structure and shared resources
Using Multi-sig Wallets - Advanced guide for multi-sig wallet workflows
Account Management CLI Reference - Complete reference for cre account commands
Deploying Workflows - Deploy your first workflow after linking a key

The Confidential HTTP Capability
The Confidential HTTP capability is a privacy-preserving HTTP service powered by the Chainlink Privacy Standard. It enables your workflow to interact with external APIs while keeping sensitive data—such as API credentials, request body fields, and response data—confidential.

The problem it solves
Traditional consensus mechanisms require all nodes to see and agree on the same data. While this provides strong reliability and tamper resistance, it creates challenges for use cases with strict privacy requirements:

Regulatory compliance: Some industries require that sensitive data never be exposed to multiple parties.
Credential security: High-risk API credentials could cause damage if compromised or exposed in node memory.
Response privacy: API responses may contain sensitive fields that should not be visible to the decentralized network.
Confidential HTTP addresses these challenges by executing requests inside a secure enclave and offering optional response encryption.

How it works
Confidential HTTP operates differently from the regular HTTP capability:

Request consensus: Nodes in the Confidential HTTP DON reach quorum on the request parameters (forwarded by each Workflow DON node).
Secret retrieval: The Confidential HTTP DON fetches encrypted secrets from the Vault DON.
Enclave execution: Secrets are threshold decrypted using Vault DON. Decryption shares are injected to a secure enclave such that only the secure enclave can combine them to extract plaintext secrets to use in the HTTP request execution—credentials never exist in accessible memory.
Response: The response is returned to your workflow. If EncryptOutput is enabled, the response body is encrypted before leaving the enclave.
This approach ensures:

Credential isolation: Secrets are encrypted at rest and in transit, and are decrypted only inside the enclave—never in node memory.
Response privacy: You can optionally encrypt the full response body so that it leaves the enclave encrypted and can be decrypted only in your own backend service.
Single execution: Exactly one API call is made, not one per node.
What's kept confidential
Component	How it's protected
Secrets (API keys, tokens)	Fully confidential. Stored in the Vault DON, decrypted only inside the enclave.
Request body	Template-based injection: secrets referenced in the request body (e.g., {{.myApiKey}}) are resolved inside the enclave, so sensitive values never appear in workflow memory.
Response body	Optionally encrypted. When EncryptOutput is enabled, the full response is AES-GCM encrypted before leaving the enclave.
Use cases
Credential isolation
A SaaS service fetches user data from an e-commerce provider API. The same credential could also modify user data if misused. Confidential HTTP ensures the credential is decrypted only inside the enclave, never accessible in node memory.

Response encryption
A workflow calls a payment processor API to execute a transaction. The API response includes the transaction ID and success status, but also returns sensitive data like the user's account balance and an internal risk score. With Confidential HTTP and EncryptOutput enabled, the full response is encrypted before leaving the enclave—it can only be decrypted using the encryption key, for example in your own backend service.

Processing sensitive request data
A workflow processes card transactions where the request contains card details and the API key provides processor access. Confidential HTTP keeps both the credentials and card details private through template-based injection, returning only the encrypted response to the workflow.

Guaranteed single execution
An API endpoint cannot tolerate duplicate requests (e.g., initiating a payment or creating a unique transaction).

With the regular HTTP capability, each node in the DON executes the request independently to reach consensus on the response. For non-idempotent operations, cacheSettings mitigates this by enabling nodes to share cached responses, reducing duplicate calls in most cases.

Confidential HTTP takes a different approach: by design, only one request is ever made from the enclave after quorum is reached on the request parameters. This provides an architectural guarantee of single execution.

When to use Confidential HTTP vs. regular HTTP
Use Confidential HTTP when:
The API response contains sensitive data that should not be visible to the network
API credentials must never be accessible in node memory (enclave-only access)
You need exactly one API call with zero tolerance for duplicates
Regulatory or compliance requirements mandate data confidentiality
Use regular HTTP when:
Querying multiple APIs and combining results: For example, fetching prices from 3 different sources and computing a median. Each node calls all APIs, aggregates locally, then nodes reach consensus on the final value.

Transforming data before consensus: For example, parsing a complex API response, filtering fields, or performing calculations on the data before nodes agree on the result.

Computing with a secret before the request: For example, generating an HMAC signature for API authentication — use the runInNodeMode pattern to access secrets and perform computations before making the request.

No confidentiality requirements: The API response doesn't contain sensitive data, and you don't need enclave-level protection for credentials.

Key differences from regular HTTP
Aspect	Regular HTTP	Confidential HTTP
API calls	One per node (multiple)*	Exactly one (single)
Consensus target	Response data	Request parameters
Execution environment	Each node individually	Secure enclave
Secrets exposure	Decrypted in Workflow DON node memory	Decrypted only in the enclave
Response handling	Full response to all nodes	Optionally encrypted (AES-GCM)
Data transformation	Supported in workflow code	Not yet supported in enclave
*For non-idempotent operations (POST, PUT, PATCH, DELETE), cacheSettings enables nodes to share cached responses, reducing multiple calls to a single execution in most cases.

note
Confidential Compute

Confidential HTTP currently does not support complex data transformations within the enclave. A future Confidential Compute capability will enable processing logic inside the enclave.

Learn more
Confidential API Interactions Guide: Learn how to use the SDK to invoke the Confidential HTTP capability.
Confidential HTTP Client SDK Reference: See the detailed API reference for the confidentialhttp.Client.


SDK Reference: Confidential HTTP Client
The Confidential HTTP Client lets you make privacy-preserving requests to external APIs from your workflow. Unlike the regular HTTPClient, the request executes inside a secure enclave, secrets are injected via templates, and responses can be optionally encrypted.

For use cases and a conceptual overview, see The Confidential HTTP Capability
Guide: Making Confidential Requests
Quick reference
Method	Description
sendRequest	Makes a confidential HTTP request.
Core types
note
Runtime types vs JSON types

Each core type has a corresponding Json variant (e.g., ConfidentialHTTPRequest and ConfidentialHTTPRequestJson). The Json variant is the plain JSON-serializable form of the protobuf message. Both forms are accepted wherever a type is required.

ConfidentialHTTPRequest / ConfidentialHTTPRequestJson
The top-level request type that combines an HTTP request with Vault DON secrets and encryption settings.

Field
Type
Description
request	HTTPRequest | HTTPRequestJson	The HTTP request to execute inside the enclave. See HTTPRequest.
vaultDonSecrets	SecretIdentifier[] | SecretIdentifierJson[]	List of secrets to fetch from the Vault DON and make available in the enclave. See SecretIdentifier.
HTTPRequest / HTTPRequestJson
Defines the HTTP request that will be executed inside the enclave.

Field
Type
Description
url	string	The URL of the API endpoint.
method	string	The HTTP method (e.g., "GET", "POST").
bodyString	string (optional)	The request body as a string template. Use this for secret injection with {{.secretName}} placeholders.
bodyBytes	Uint8Array | string (optional)	The request body as raw bytes (base64-encoded in JSON format).
multiHeaders	{ [key: string]: HeaderValues } (optional)	Request headers. Supports multiple values per key and template syntax for secret injection.
templatePublicValues	{ [key: string]: string } (optional)	Public (non-secret) values used to fill template placeholders in the body and headers.
customRootCaCertPem	Uint8Array | string (optional)	Optional custom root CA certificate (PEM format) for verifying the external server's TLS certificate.
timeout	Duration | DurationJson (optional)	Optional request timeout (e.g., "5s").
encryptOutput	boolean (optional)	If true, encrypts the response body before it leaves the enclave. See Response encryption. Default: false.
note
bodyString vs bodyBytes

The request body is a oneof field. Use bodyString for string templates with secret injection, or bodyBytes for raw binary data. Only one should be provided.

HTTPResponse / HTTPResponseJson
The response returned from the enclave after the HTTP request completes.

Field
Type
Description
statusCode	number	The HTTP status code.
body	Uint8Array | string (base64)	The response body. If encryptOutput is true, this contains the encrypted body (see Response encryption).
multiHeaders	{ [key: string]: HeaderValues }	The HTTP response headers.
SecretIdentifier / SecretIdentifierJson
Identifies a secret stored in the Vault DON.

Field	Type	Description
key	string	The logical name of the secret. Must match the template placeholder (e.g., "myApiKey" matches {{.myApiKey}}).
namespace	string	The secret namespace.
owner	string (optional)	Optional. The owner address for the secret.
HeaderValues / HeaderValuesJson
Represents multiple values for a single HTTP header key.

Field
Type
Description
values	string[]	The header values. Supports template syntax for secret injection (e.g., "Basic {{.myToken}}").
Making requests
sendRequest()
Makes a confidential HTTP request. The request executes inside a secure enclave, so unlike the regular HTTP client, there is no need to wrap this call in runtime.runInNodeMode().

Signature:

copy to clipboard
sendRequest(
  runtime: Runtime<unknown>,
  input: ConfidentialHTTPRequest | ConfidentialHTTPRequestJson
): { result: () => HTTPResponse }
Parameters:

runtime: The Runtime instance from your trigger handler.
input: A ConfidentialHTTPRequest or ConfidentialHTTPRequestJson object containing the request and secrets.
Returns:

An object with a .result() method that blocks until the request completes and returns the HTTPResponse.

Example:

copy to clipboard
import { ConfidentialHTTPClient, ok, json, type Runtime } from "@chainlink/cre-sdk"

type Config = { url: string; owner: string }
type APIResult = { data: string }

const onCronTrigger = (runtime: Runtime<Config>): string => {
  const confHTTPClient = new ConfidentialHTTPClient()

  const response = confHTTPClient
    .sendRequest(runtime, {
      request: {
        url: runtime.config.url,
        method: "GET",
        multiHeaders: {
          Authorization: { values: ["Basic {{.apiKey}}"] },
        },
      },
      vaultDonSecrets: [{ key: "apiKey", owner: runtime.config.owner }],
    })
    .result()

  if (!ok(response)) {
    throw new Error(`Request failed: ${response.statusCode}`)
  }

  return (json(response) as APIResult).data
}
Template syntax
Secrets are injected into the request body and headers using Go template syntax: {{.secretName}}. The placeholder name must match the key field in the corresponding SecretIdentifier.

Body template:

copy to clipboard
bodyString: '{"apiKey": "{{.myApiKey}}", "method": "{{.method}}", "params": []}',
Header template:

copy to clipboard
multiHeaders: {
  "Authorization": { values: ["Basic {{.myCredential}}"] },
},
templatePublicValues (optional)
Every {{.placeholder}} in your body or headers is resolved inside the enclave. By default, placeholders are filled with secrets from vaultDonSecrets. But sometimes you have a placeholder value that isn't secret — for example, an RPC method name or a public parameter. That's what templatePublicValues is for: it lets you inject non-secret values into the same template.

This is purely a convenience. You could always hardcode the value directly in the body string instead:

copy to clipboard
// These two are equivalent:

// Option 1: hardcoded in the body string
bodyString: '{"method": "eth_blockNumber", "auth": "{{.apiKey}}"}'

// Option 2: using templatePublicValues
bodyString: '{"method": "{{.method}}", "auth": "{{.apiKey}}"}'
templatePublicValues: {
  method: "eth_blockNumber"
}
templatePublicValues is useful when you want to keep the template generic and pass in dynamic values (e.g., from config) without string concatenation.

Example with both secret and public values:

copy to clipboard
request: {
  url: config.url,
  method: "POST",
  bodyString: '{"method": "{{.rpcMethod}}", "auth": "{{.apiKey}}"}',
  templatePublicValues: {
    rpcMethod: config.rpcMethod,   // dynamic value from config, not a secret
  },
},
vaultDonSecrets: [{ key: "apiKey", owner: config.owner }],  // secret, from Vault DON
In this example, {{.rpcMethod}} is resolved from templatePublicValues (a dynamic, non-secret value from your workflow config) and {{.apiKey}} is resolved from the Vault DON (a secret). Both are resolved inside the enclave.

Response encryption
The encryptOutput field controls whether the response body is encrypted before leaving the enclave.

encryptOutput	Secret key provided	Behavior
false (default)	—	Response returned unencrypted.
true	san_marino_aes_gcm_encryption_key in vaultDonSecrets	Response AES-GCM encrypted with your symmetric key.
true	No key provided	Response TDH2 encrypted with the Vault DON master public key.
AES-GCM encryption is the recommended approach. Store a 256-bit (32-byte) AES key as a Vault DON secret with the identifier san_marino_aes_gcm_encryption_key, then decrypt the response in your own backend.

The encrypted response body is structured as nonce || ciphertext || tag.

For a complete example with response encryption, see the Making Confidential Requests guide.


Response encryption
By default, the API response is returned unencrypted (encryptOutput: false). To encrypt the response body before it leaves the enclave, set encryptOutput: true and provide an AES-256 encryption key as a Vault DON secret.

Setting up response encryption
Store an AES-256 key as a Vault DON secret with the identifier san_marino_aes_gcm_encryption_key:

copy to clipboard
# secrets.yaml
secretsNames:
  san_marino_aes_gcm_encryption_key:
    - AES_KEY_ALL
The key must be a 256-bit (32 bytes) hex-encoded string:

copy to clipboard
export AES_KEY_ALL="your-256-bit-hex-encoded-key"
Include the key in your vaultDonSecrets and set encryptOutput: true:

copy to clipboard
const response = confHTTPClient
  .sendRequest(runtime, {
    request: {
      url: runtime.config.url,
      method: "GET",
      multiHeaders: {
        Authorization: { values: ["Basic {{.myApiKey}}"] },
      },
      encryptOutput: true,
    },
    vaultDonSecrets: [
      { key: "myApiKey", owner: runtime.config.owner },
      { key: "san_marino_aes_gcm_encryption_key" },
    ],
  })
  .result()
Decrypt the response in your own backend service. The encrypted response body is structured as nonce || ciphertext || tag and uses AES-GCM encryption.

caution
Do not decrypt inside the workflow

The purpose of response encryption is to keep the response confidential even within the decentralized network. Decrypt the response in your own backend service, not inside the workflow itself.

Response helper functions
The SDK response helpers ok(), text(), and json() work with Confidential HTTP responses just as they do with regular HTTP responses. For full documentation, see the HTTP Client SDK Reference.

Complete example
Here's the full workflow code for a confidential HTTP request with secret injection:

copy to clipboard
import { CronCapability, ConfidentialHTTPClient, handler, ok, json, type Runtime, Runner } from "@chainlink/cre-sdk"
import { z } from "zod"

// Config schema
const configSchema = z.object({
  schedule: z.string(),
  url: z.string(),
  owner: z.string(),
})

type Config = z.infer<typeof configSchema>

// Result type
type TransactionResult = {
  transactionId: string
  status: string
}

// Main workflow handler
const onCronTrigger = (runtime: Runtime<Config>): TransactionResult => {
  const confHTTPClient = new ConfidentialHTTPClient()

  const response = confHTTPClient
    .sendRequest(runtime, {
      request: {
        url: runtime.config.url,
        method: "GET",
        multiHeaders: {
          Authorization: { values: ["Basic {{.myApiKey}}"] },
        },
      },
      vaultDonSecrets: [{ key: "myApiKey", owner: runtime.config.owner }],
    })
    .result()

  if (!ok(response)) {
    throw new Error(`HTTP request failed with status: ${response.statusCode}`)
  }

  const result = json(response) as TransactionResult
  runtime.log(`Transaction result: ${result.transactionId} — ${result.status}`)
  return result
}

// Initialize workflow
const initWorkflow = (config: Config) => {
  return [
    handler(
      new CronCapability().trigger({
        schedule: config.schedule,
      }),
      onCronTrigger
    ),
  ]
}

export async function main() {
  const runner = await Runner.newRunner<Config>({ configSchema })
  await runner.run(initWorkflow)
}
API reference
For the full list of types and methods available on the Confidential HTTP client, see the Confidential HTTP Client SDK Reference.