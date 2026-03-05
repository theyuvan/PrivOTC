HTTP Trigger Overview
The HTTP trigger allows external systems to initiate your workflow execution by making HTTP requests to a designated endpoint. This enables on-demand workflow execution, webhook integration, and API-driven automation.

How HTTP triggers work
When you deploy a workflow with an HTTP trigger:

External systems send HTTP POST requests to a CRE gateway
The request specifies your workflow ID in the JSON-RPC body along with the input payload
Requests must be cryptographically signed using a private key corresponding to an authorized EVM address in the target workflow
CRE validates the signature against your configured authorizedKeys
If authorized, your workflow callback executes with the request payload
caution
Authorization required for deployed workflows

For deployed workflows, HTTP triggers use cryptographic signatures to ensure only authorized addresses can execute your workflow. During local simulation, you can use empty authorization configs to simplify testing—just remember to add authorizedKeys before deploying. Learn more: Configuration & Handler.

When to use HTTP triggers
HTTP triggers are ideal for:

Webhook integration: Receive events from external services (GitHub, payment processors, etc.)
On-demand execution: Allow users or systems to trigger specific workflow logic when needed
API gateway patterns: Create authenticated endpoints that execute blockchain operations
Event bridging: Connect offchain systems events to workflows
The complete HTTP trigger journey
This section provides everything you need to work with HTTP triggers:

Configuration & Handler - Learn how to configure HTTP triggers in your workflow code and write handler functions to process incoming requests

Testing in Simulation - Test your HTTP trigger locally using the cre workflow simulate command before deploying

Triggering Deployed Workflows - Understand the JSON-RPC format and JWT authentication required to trigger your deployed workflows

Testing with Local JWT Server - Run a local proxy server that automatically generates JWT tokens and sends authenticated requests to the CRE gateway for testing your deployed workflows

Quick comparison: Simulation vs Production
Aspect	Simulation	Production
Authorization	Optional (can use empty config)	Required (authorizedKeys must be configured)
Trigger method	CLI with --input flag	HTTP POST to gateway endpoint with JWT
Endpoint	Local simulator	CRE gateway (https://01.gateway.zone-a.cre.chain.link)
Use case	Development, testing, debugging	Live integrations, webhooks, production APIs
Key concepts
Authorization keys
Authorization keys are EVM addresses that are permitted to trigger your workflow. When you configure an HTTP trigger, you specify one or more authorizedKeys:

copy to clipboard
authorizedKeys: [
  {
    type: "KEY_TYPE_ECDSA_EVM",
    publicKey: "0xYourEVMAddress",
  },
]
Only requests signed by the corresponding private keys will be accepted by the CRE gateway.

Payload
The HTTP trigger payload contains:

input: The JSON data from the HTTP request body
key: The authorized key that signed the request
Your callback function receives this payload and can process the input data to perform workflow logic.

Next steps
Start by learning how to configure HTTP triggers and write handler functions:

Configuration & Handler - Set up your first HTTP trigger
Or explore the SDK reference for detailed API documentation:

HTTP Trigger SDK Reference - Complete API documentation
HTTP Trigger: Configuration & Handler
The HTTP trigger fires when an external system makes an HTTP request to the trigger endpoint.

Use case examples:

Integrating with existing web services or webhooks.
Allowing an external system to initiate a workflow on demand.
Creating a user-facing endpoint to run a specific piece of logic.
Configuration and handler
You create an HTTP trigger by calling the HTTPCapability.trigger() method. Its configuration requires a set of authorized public keys to validate incoming request signatures.

note
Authorization required for deployment

When you deploy your workflow, HTTP triggers must include authorizedKeys. An empty configuration object {} is only valid for simulation and testing—deployed workflows will reject HTTP triggers without authorization keys.

copy to clipboard
import { HTTPCapability, handler, type Runtime, type HTTPPayload, Runner } from "@chainlink/cre-sdk"

type Config = {
  authorizedEVMAddress: string
}

// Callback function that runs when an HTTP request is received
const onHttpTrigger = (runtime: Runtime<Config>, payload: HTTPPayload): string => {
  runtime.log(`HTTP trigger received: ${payload.input.length} bytes`)
  // Your logic here...
  return "Request processed"
}

const initWorkflow = (config: Config) => {
  const httpTrigger = new HTTPCapability()

  return [
    handler(
      httpTrigger.trigger({
        authorizedKeys: [
          {
            type: "KEY_TYPE_ECDSA_EVM",
            publicKey: config.authorizedEVMAddress,
          },
        ],
      }),
      onHttpTrigger
    ),
  ]
}

export async function main() {
  const runner = await Runner.newRunner<Config>()
  await runner.run(initWorkflow)
}
About authorized keys:

publicKey: An EVM address (e.g., "0xb08E004bd2b5aFf1F5F950d141f449B1c05800eb") that is authorized to trigger the workflow
type: Must be "KEY_TYPE_ECDSA_EVM" (currently the only supported authentication method)
Multiple keys: You can include multiple authorized addresses in the array
When an HTTP request is made to trigger your workflow, CRE verifies that the request was signed by a private key corresponding to one of the authorized addresses.

Callback and payload
The HTTP trigger passes an HTTPPayload to your callback. This object contains the request body (input) and the signing key (key) from the incoming HTTP request.

For the full type definition and all available fields, see the HTTP Trigger SDK Reference.

copy to clipboard
type RequestData = {
  message: string
  value: number
}

const onHttpTrigger = (runtime: Runtime<Config>, payload: HTTPPayload): string => {
  // The payload.input is a Uint8Array.
  // You can decode it to a JSON object using the decodeJson helper.
  const requestData = decodeJson<RequestData>(payload.input)
  runtime.log(`Received HTTP request: ${JSON.stringify(requestData)}`)

  // Your logic here...
  // The value returned from your callback will be sent back as the HTTP response.
  return `Request processed: ${requestData.message}`
}
note
For local simulation only

During local simulation with cre workflow simulate, you can use an empty configuration trigger({}) to test your workflow without setting up authorization keys. This is convenient for rapid development, but remember to add authorizedKeys before deploying. See Testing in Simulation for details.
Testing HTTP Triggers in Simulation
During development, you can test your HTTP trigger workflows locally using the cre workflow simulate command. The simulator allows you to provide test payloads without setting up authorization keys or JWT authentication.

This guide focuses specifically on HTTP trigger simulation with detailed examples and scenarios. For a general overview of workflow simulation covering all trigger types, see Simulating Workflows.

Prerequisites
Before running a simulation:

CRE CLI installed: You need the CRE CLI to run simulations. See CLI Installation if you haven't installed it yet.
CRE account & authentication: You must have a CRE account and be logged in with the CLI. See Create your account and Log in with the CLI for instructions.
HTTP trigger configured: Your workflow must have an HTTP trigger handler registered. See Configuration & Handler for setup instructions.
note
No authorization required for simulation

During simulation, you can use an empty authorization configuration (e.g., &http.Config{} in Go or trigger({}) in TypeScript). This simplifies local testing—just remember to add authorizedKeys before deploying.

Basic simulation
To simulate a workflow with an HTTP trigger, run the simulate command from your project root:

copy to clipboard
cre workflow simulate <workflow-folder> --target <target-name>
Example:

copy to clipboard
cre workflow simulate my-http-workflow --target staging-settings
The simulator will detect your HTTP trigger and prompt you to select it from available triggers.

Providing input data
You have three ways to provide JSON input to your HTTP trigger during simulation:

1. Interactive mode (default)
When you run the simulation without input flags, the CLI prompts you to enter JSON data:

copy to clipboard
$ cre workflow simulate my-http-workflow --target staging-settings

# Select the HTTP trigger when prompted
? Select a trigger to simulate: HTTP Trigger

# Enter your JSON input:
? Enter JSON input for the HTTP trigger:
{"userId": "123", "action": "purchase", "amount": 50}
The simulator converts your JSON into a payload and passes it to your callback function.

2. Inline JSON string
For non-interactive execution (useful for CI/CD or scripting), pass JSON directly using the --http-payload flag along with --non-interactive and --trigger-index:

copy to clipboard
cre workflow simulate my-http-workflow --non-interactive --trigger-index 0 --http-payload '{"userId":"123","action":"purchase","amount":50}' --target staging-settings
note
Non-interactive requirements

The --http-payload flag requires --non-interactive mode. You must also specify --trigger-index to select which handler to run. The index is 0-based: if the handler with your HTTP trigger is the first handler defined in your InitWorkflow function, use --trigger-index 0; if it's the second, use --trigger-index 1, and so on.

note
Escaping quotes

When passing JSON inline, use single quotes around the entire JSON string and double quotes for JSON keys and string values. On Windows, you may need to escape double quotes differently: "{\"userId\":\"123\"}"

3. Input from file
For complex payloads or reusable test data, store your JSON in a file and reference it in non-interactive mode.

Option 1: File in workflow folder

Create the payload file in your workflow directory:

my-http-workflow/test-payload.json:

copy to clipboard
{
  "userId": "123",
  "action": "purchase",
  "amount": 50,
  "metadata": {
    "timestamp": "2025-11-10T10:00:00Z",
    "source": "mobile-app"
  }
}
Simulate:

copy to clipboard
cre workflow simulate my-http-workflow --non-interactive --trigger-index 0 --http-payload test-payload.json --target staging-settings
Option 2: File at project root

Create the payload file at your project root. Simulate (using ../ to reference the parent directory):

copy to clipboard
cre workflow simulate my-http-workflow --non-interactive --trigger-index 0 --http-payload ../test-payload.json --target staging-settings
note
File paths are relative to the workflow folder

The CLI resolves file paths relative to the workflow folder you're simulating. Use just the filename for files in the workflow folder, or ../filename.json for files at the project root.

Example workflow simulation
Let's simulate a complete workflow that processes HTTP requests.

Setup your config file:

For this example, create a config.staging.json file with:

copy to clipboard
{
  "minimumAmount": 10
}
This configuration sets the minimum purchase amount to 10, which we'll test with different scenarios.

Workflow code:

HTTP Trigger Simulation Example

Go

TypeScript

import { HTTPCapability, handler, type Runtime, type HTTPPayload, Runner, decodeJson } from "@chainlink/cre-sdk"
​
type Config = {
  minimumAmount: number
}
​
type RequestData = {
  userId: string
  action: string
  amount: number
}
​
const onHttpTrigger = (runtime: Runtime<Config>, payload: HTTPPayload): string => {
  const requestData = decodeJson(payload.input) as RequestData
​
  // Validate required fields
  if (!requestData.userId || !requestData.action || requestData.amount === undefined) {
    runtime.log("Missing required fields")
    return "Error: Missing required fields (userId, action, amount)"
  }
​
  runtime.log(`Processing ${requestData.action} for user ${requestData.userId}`)
​
  if (requestData.amount < runtime.config.minimumAmount) {
    runtime.log(`Amount ${requestData.amount} below minimum ${runtime.config.minimumAmount}`)
    return "Amount too low"
  }
​
  runtime.log(`Processing amount: ${requestData.amount}`)
  return `Successfully processed ${requestData.action}`
}
​
const initWorkflow = (config: Config) => {
  const http = new HTTPCapability()
​
  return [
    handler(http.trigger({}), onHttpTrigger), // Empty config OK for simulation
  ]
}
​
export async function main() {
  const runner = await Runner.newRunner<Config>()
  await runner.run(initWorkflow)
}
​
Run the simulation:

copy to clipboard
cre workflow simulate my-http-workflow --non-interactive --trigger-index 0 --http-payload '{"userId":"user_123","action":"purchase","amount":100}' --target staging-settings
Expected output:

copy to clipboard
Workflow compiled
2025-11-10T11:28:25Z [SIMULATION] Simulator Initialized

2025-11-10T11:28:25Z [SIMULATION] Running trigger trigger=http-trigger@1.0.0-alpha
2025-11-10T11:28:25Z [USER LOG] Processing purchase for user user_123
2025-11-10T11:28:25Z [USER LOG] Processing amount: 100

Workflow Simulation Result:
 "Successfully processed purchase"

2025-11-10T11:28:25Z [SIMULATION] Execution finished signal received
2025-11-10T11:28:25Z [SIMULATION] Skipping WorkflowEngineV2
Testing different scenarios
Use simulation to test various input scenarios:

Valid request
copy to clipboard
cre workflow simulate my-http-workflow --non-interactive --trigger-index 0 --http-payload '{"userId":"123","action":"purchase","amount":100}' --target staging-settings
Invalid input (below minimum)
copy to clipboard
cre workflow simulate my-http-workflow --non-interactive --trigger-index 0 --http-payload '{"userId":"123","action":"purchase","amount":5}' --target staging-settings
Expected output:

copy to clipboard
Workflow compiled
2025-11-10T11:34:38Z [SIMULATION] Simulator Initialized

2025-11-10T11:34:38Z [SIMULATION] Running trigger trigger=http-trigger@1.0.0-alpha
2025-11-10T11:34:38Z [USER LOG] Processing purchase for user 123
2025-11-10T11:34:38Z [USER LOG] Amount 5 below minimum 10

Workflow Simulation Result:
 "Amount too low"

2025-11-10T11:34:38Z [SIMULATION] Execution finished signal received
2025-11-10T11:34:38Z [SIMULATION] Skipping WorkflowEngineV2
Missing fields
copy to clipboard
cre workflow simulate my-http-workflow --non-interactive --trigger-index 0 --http-payload '{"userId":"123","action":"purchase"}' --target staging-settings
Expected output:

copy to clipboard
Workflow compiled
2025-11-10T11:37:57Z [SIMULATION] Simulator Initialized

2025-11-10T11:37:57Z [SIMULATION] Running trigger trigger=http-trigger@1.0.0-alpha
2025-11-10T11:37:57Z [USER LOG] Missing required fields

Workflow Simulation Result:
 "Error: Missing required fields (userId, action, amount)"

2025-11-10T11:37:57Z [SIMULATION] Execution finished signal received
2025-11-10T11:37:57Z [SIMULATION] Skipping WorkflowEngineV2
This helps you verify error handling and edge cases before deployment.

Simulation vs production behavior
Aspect	Simulation	Production
Authorization	Not required (empty config allowed)	Required (authorizedKeys must be set)
Signature verification	Skipped	Strictly enforced
Execution	Immediate, synchronous	Asynchronous via DON
Logs	Printed to terminal	Available in CRE UI
caution
Add authorization before deploying

Simulation allows empty authorization configs for convenience, but deployed workflows require authorizedKeys. The CLI will reject deployments with HTTP triggers that lack authorization configuration.

Next steps
Once you've tested your workflow locally:

Add authorization: Configure authorizedKeys in your HTTP trigger for production
Deploy your workflow: Use cre workflow deploy to register it
Trigger it in production: Follow the Triggering Deployed Workflows guide

Triggering Deployed Workflows
Once you've deployed a workflow with an HTTP trigger, you can execute it by sending authenticated HTTP requests to the CRE gateway. This guide explains how to trigger deployed workflows in production.

What you'll learn
This guide covers the complete technical specification for triggering deployed workflows:

Request format - The JSON-RPC structure for workflow execution requests
JWT authentication - How to generate cryptographically signed tokens
Signature process - The ECDSA signing steps for Ethereum-compatible authentication
Reference implementations - Code examples in Go and TypeScript
note
Just testing?

If you're testing deployed workflows during development, the Local Testing Tool is much simpler—it handles all JWT generation automatically. This guide is for production implementations where you need full control over the HTTP requests.

Prerequisites
Deployed workflow: Your workflow must be deployed with an HTTP trigger. See Deploying Workflows.
Workflow ID: Available from deployment output or the CRE UI.
Private key: The private key corresponding to one of the authorizedKeys configured in your HTTP trigger.
note
For easier testing

If you're testing your deployed workflow during development, consider using the Local Testing Tool instead. It handles JWT generation automatically and triggers the workflow for you.

Finding your workflow ID
Your workflow ID is a 64-character hexadecimal string (without 0x prefix) that uniquely identifies your deployed workflow.

From deployment output
When you deploy a workflow, the CLI displays the workflow ID:

copy to clipboard
$ cre workflow deploy my-workflow --target production-settings

...
Details:
   Workflow ID:    a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890
...
From the CRE UI
Log in to cre.chain.link/workflows
Click on your workflow name
In the Overview section, find the Workflow ID field
Click the copy button to copy it to your clipboard
Request format
All workflow executions use JSON-RPC 2.0 format:

copy to clipboard
POST https://01.gateway.zone-a.cre.chain.link
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "id": "unique-request-id",
  "jsonrpc": "2.0",
  "method": "workflows.execute",
  "params": {
    "input": {
      "key1": "value1",
      "key2": "value2"
    },
    "workflow": {
      "workflowID": "your-64-character-workflow-id"
    }
  }
}
Request components
Field	Description
jsonrpc	Always "2.0" (JSON-RPC version)
id	Unique identifier for this request (any string, used for tracking)
method	Always "workflows.execute"
params.input	Your custom JSON payload (passed to your workflow callback)
params.workflow.workflowID	Your 64-character workflow ID (no 0x prefix)
tip
Request ID for tracking

The id field helps you correlate requests with responses. Use a UUID or timestamp-based identifier for easier debugging and request tracking.

JWT authentication
The Authorization header must contain a Bearer JWT (JSON Web Token) that proves the request was signed by an authorized key. The JWT has three parts: header.payload.signature.

JWT structure
The JWT is a base64url-encoded string consisting of three parts separated by dots:

copy to clipboard
<base64url(header)>.<base64url(payload)>.<base64url(signature)>
1. Header
The JWT header specifies the signing algorithm:

copy to clipboard
{
  "alg": "ETH",
  "typ": "JWT"
}
Base64url-encode this JSON to create the header part.

2. Payload
The JWT payload contains request metadata and a digest of the request body:

copy to clipboard
{
  "digest": "0x<sha256_hash_of_request_body>",
  "iss": "0xYourEVMAddress",
  "iat": 1762807282,
  "exp": 1762807582,
  "jti": "550e8400-e29b-41d4-a716-446655440000"
}
Payload fields:

Field	Description
digest	SHA256 hash of the JSON-RPC request body (with 0x prefix)
iss	Issuer - your EVM address (the public key corresponding to your private key)
iat	Issued at time (Unix timestamp in seconds)
exp	Expiration time (Unix timestamp, max 5 minutes after iat)
jti	JWT ID (UUID v4 for replay protection)
Computing the digest
The digest is a SHA256 hash of your JSON-RPC request body serialized as UTF-8 encoded JSON in ascending lexicographic order (sorted by key names):

Original request:

copy to clipboard
{
  "jsonrpc": "2.0",
  "id": "req-123",
  "method": "workflows.execute",
  "params": {
    "input": { "key1": "value1", "key2": "value2" },
    "workflow": { "workflowID": "a1b2c3..." }
  }
}
Keys must be sorted alphabetically at every level:

copy to clipboard
{
  "id": "req-123",
  "jsonrpc": "2.0",
  "method": "workflows.execute",
  "params": { "input": { "key1": "value1", "key2": "value2" }, "workflow": { "workflowID": "a1b2c3..." } }
}
Then compute: digest = "0x" + sha256(sorted_json_string)

caution
Key ordering is critical

The digest must be computed from a JSON string with keys sorted in ascending lexicographic order at all nesting levels. Incorrect ordering will cause signature verification to fail.

3. Signature
The signature is an ECDSA signature of the message <base64url(header)>.<base64url(payload)> using your private key.

Signing process:

Concatenate the encoded header and payload: message = base64url(header) + "." + base64url(payload)
Sign the message using ECDSA with your private key:
Prepend the Ethereum signed message prefix: "\x19Ethereum Signed Message:\n" + len(message) + message
Hash the prefixed message with Keccak256
Sign the hash using your private key
Extract the signature components: r (32 bytes), s (32 bytes), v (1 byte, recovery ID)
Concatenate: signature_bytes = r || s || v
Base64url-encode the signature bytes
Reference implementations
Manual JWT generation requires careful cryptographic operations. Use these reference implementations as guidance:

For Go
Production-grade utilities:

JWT creation: jwt.go - See the CreateRequestJWT method for complete JWT generation
ECDSA signatures: eth_signatures.go - See the GenerateEthSignature method for Ethereum-compatible signing
For TypeScript/JavaScript
The CRE SDK includes a reference implementation using viem:

Complete implementation: cre-http-trigger source code
Key files:
create-jwt.ts - JWT header, payload, and signing logic
utils.ts - SHA256 hashing and base64url encoding helpers
For testing
If you're testing deployed workflows during development, use the Local Testing Tool which runs a local proxy server that handles the entire JWT generation and request flow automatically.

Example request (conceptual)
Here's what a complete curl request looks like:

copy to clipboard
curl -X POST https://01.gateway.zone-a.cre.chain.link \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJFVEgiLCJ0eXAiOiJKV1QifQ.eyJkaWdlc3QiOiIweDRhMWYyYjNjNGQ1ZTZmN2E4YjljMGQxZTJmM2E0YjVjNmQ3ZThmOWEwYjFjMmQzZTRmNWE2YjdjOGQ5ZTBmMWEiLCJpc3MiOiIweGIwOEUwMDRiZDJiNWFGZjFGNUY5NTBkMTQxZjQ0OUIxYzA1ODAwZWIiLCJpYXQiOjE3MzM4MzIwMDAsImV4cCI6MTczMzgzMjMwMCwianRpIjoiNTUwZTg0MDAtZTI5Yi00MWQ0LWE3MTYtNDQ2NjU1NDQwMDAwIn0.r7s8v9recoveryId..." \
  -d '{
    "jsonrpc": "2.0",
    "id": "req-123",
    "method": "workflows.execute",
    "params": {
      "input": {
        "userId": "user_123",
        "action": "purchase",
        "amount": 100
      },
      "workflow": {
        "workflowID": "a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890"
      }
    }
  }'
Response format
Success response
When your request is successfully accepted, the gateway returns a JSON-RPC response:

copy to clipboard
{
  "jsonrpc": "2.0",
  "id": "req-123",
  "method": "workflows.execute",
  "result": {
    "workflow_id": "<your-workflow-id>",
    "workflow_execution_id": "<your-workflow-execution-id>",
    "status": "ACCEPTED"
  }
}
Response fields:

Field	Description
jsonrpc	JSON-RPC version (always "2.0")
id	The request ID you provided in the request
method	The method called (always "workflows.execute")
result.workflow_id	Your workflow ID (with 0x prefix)
result.workflow_execution_id	Unique execution ID for this workflow run (use this to track execution in the CRE UI)
result.status	Execution status (typically "ACCEPTED" when the workflow trigger is successfully accepted by the gateway)
tip
Track your execution

Copy the workflow_execution_id to track this specific execution in the CRE UI. You can view logs, events, and execution details using this ID.

Error response
If the request fails (e.g., invalid JWT, unauthorized key, workflow not found), the gateway returns an error response. Example:

copy to clipboard
{
  "jsonrpc": "2.0",
  "id": "req-123",
  "method": "",
  "error": {
    "code": -32600,
    "message": "Auth failure: signer '0x...' is not authorized for workflow '0x...'. Ensure that the signer is registered in the workflow definition"
  }
}
note
HTTP status codes

Error responses typically return HTTP status 400 Bad Request. The JSON-RPC error object provides detailed information about what went wrong.

Verifying execution
After triggering your workflow, verify execution in the CRE UI:

Go to cre.chain.link/workflows
Click on your workflow
Check the Execution tab for recent runs
Click on an Execution ID to view detailed logs and events
See Monitoring & Debugging Workflows for complete monitoring guidance.

Security considerations
Private key protection
Never commit private keys to version control
Use environment variables or secret management tools (e.g., AWS Secrets Manager, HashiCorp Vault)
Rotate keys periodically and update your workflow's authorizedKeys if compromised
Request expiration
JWT tokens expire after the exp timestamp (max 5 minutes after iat)
This prevents replay attacks with captured requests
Generate new JWTs for each request
Replay protection
The jti (JWT ID) field provides replay protection
Use a unique UUID for every request
The gateway may reject duplicate jti values within the expiration window
Next steps
For easier testing
Manual JWT generation is complex and error-prone. For development and testing:

Local Testing Tool - Automatically generates JWTs and sends requests
Additional resources
HTTP Trigger SDK Reference - Complete API documentation
Monitoring Workflows - Track execution history and debug issues

Testing with Local JWT Server
The cre-http-trigger TypeScript package simplifies testing deployed workflows with HTTP triggers by handling JWT generation, signing, and request formatting automatically. It provides a local HTTP server that acts as a proxy between your test requests and the CRE gateway.

Manually creating JWT tokens for HTTP trigger requests involves complex steps: computing SHA256 digests with sorted JSON keys, generating ECDSA signatures, and encoding everything correctly (see Triggering Deployed Workflows).

The cre-http-trigger tool eliminates this complexity by:

Managing JWT generation - Automatically creates properly signed JWT tokens
Handling request formatting - Constructs valid JSON-RPC requests
Providing a simple API - Send test requests with plain JSON payloads
Enabling local testing - Run a local server that forwards requests to the gateway
note
For testing only

This tool is designed for development and testing of deployed workflows. For production integrations, implement JWT generation directly in your backend service for better security and control.

caution
Educational Example Disclaimer

This page includes an educational example to use a Chainlink system, product, or service and is provided to demonstrate how to interact with Chainlink's systems, products, and services to integrate them into your own. This template is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, it has not been audited, and it may be missing key checks or error handling to make the usage of the system, product or service more clear. Do not use the code in this example in a production environment without completing your own audits and application of best practices. Neither Chainlink Labs, the Chainlink Foundation, nor Chainlink node operators are responsible for unintended outputs that are generated due to errors in code.

Prerequisites
Bun runtime: The tool requires Bun version 1.2.21 or higher
Deployed workflow: Your workflow must be deployed with an HTTP trigger
Workflow ID: Available from deployment output or the CRE UI
Private key: The private key corresponding to one of the authorizedKeys in your HTTP trigger configuration
Installation
Clone the CRE SDK TypeScript repository and navigate to the HTTP trigger package:

copy to clipboard
git clone https://github.com/smartcontractkit/cre-sdk-typescript.git
cd cre-sdk-typescript/packages/cre-http-trigger
Setup
1. Install dependencies
copy to clipboard
bun install
2. Configure environment variables
Create a .env file in the package root:

copy to clipboard
PRIVATE_KEY=0xYourPrivateKeyHere
GATEWAY_URL=https://01.gateway.zone-a.cre.chain.link
Replace 0xYourPrivateKeyHere with your EVM private key.

caution
Keep your .env file secure

Never commit .env files to version control. Add .env to your .gitignore file. The package repository already includes .env in .gitignore by default.

3. Start the server
Run the local proxy server:

copy to clipboard
bun start
The server starts on port 2000 by default. You should see:

copy to clipboard
🚀 HTTP Trigger Server running at http://localhost:2000
Usage
With the server running, you can trigger workflows by sending HTTP POST requests to http://localhost:2000/trigger.

Basic request
Send a POST request with your workflow ID as a query parameter and input data in the body:

copy to clipboard
curl -X POST "http://localhost:2000/trigger?workflowID=<your-workflow-id>" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "userId": "user_123",
      "action": "purchase",
      "amount": 100
    }
  }'
Request format
Query parameter:

Field	Type	Description
workflowID	string	Your 64-character workflow ID (no 0x prefix)
Request body:

Field	Type	Description
input	object	JSON payload passed to your workflow callback
Example
copy to clipboard
curl -X POST "http://localhost:2000/trigger?workflowID=<your-workflow-id>" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "userId": "user_456",
      "action": "purchase",
      "amount": 250
    }
  }'
Server logs:

When the server processes your request, you'll see logs in the terminal where the server is running:

copy to clipboard
🚀 Triggering workflow...

   Workflow: {
  workflowID: "<your-workflow-id>",
}

   Input: {
  "userId": "user_456",
  "action": "purchase",
  "amount": 250
}

   Signed by: <your-public-address>

   Response: Response (297 bytes) {
  ok: true,
  url: "https://01.gateway.zone-a.cre.chain.link/",
  status: 200,
  statusText: "OK",
  ...
}
Client response:

Your curl command receives a JSON response:

copy to clipboard
{
  "success": true,
  "response": {
    "jsonrpc": "2.0",
    "id": "<your-request-id>",
    "method": "workflows.execute",
    "result": {
      "workflow_id": "<your-workflow-id>",
      "workflow_execution_id": "<your-workflow-execution-id>",
      "status": "ACCEPTED"
    }
  }
}
Response fields:

Field
Description
success	Always true for successful proxy requests
response.jsonrpc	JSON-RPC version (always "2.0")
response.id	Unique request ID generated by the tool
response.method	Always "workflows.execute"
result.workflow_id	Your workflow ID (with 0x prefix)
result.workflow_execution_id	Unique execution ID for this workflow run (use this to track execution in the CRE UI)
result.status	Execution status (typically "ACCEPTED" for valid requests)
tip
Track your execution

Copy the workflow_execution_id to track this specific execution in the CRE UI. You can view logs, events, and execution details using this ID.

Health check endpoint
Verify the server is running:

copy to clipboard
curl http://localhost:2000/health
Response:

copy to clipboard
OK
How it works
The tool performs the following steps automatically:

Receives your request at /trigger with workflowID as a query parameter and input in the request body
Loads configuration from environment variables (PRIVATE_KEY, GATEWAY_URL)
Constructs JSON-RPC payload:
copy to clipboard
{
  "jsonrpc": "2.0",
  "id": "generated-uuid",
  "method": "workflows.execute",
  "params": {
    "input": { ... },
    "workflow": { "workflowID": "..." }
  }
}
Computes digest of the request body (SHA256 with sorted keys)
Creates JWT payload with digest, iss, iat, exp, jti
Signs JWT using your private key with ECDSA
Sends authenticated request to the CRE gateway with the JWT in the Authorization header
Returns the response to your test client
This eliminates the need to manually handle cryptographic operations and request formatting.

Code structure
If you're curious about the implementation or need to customize the tool:

File	Purpose
src/index.ts	HTTP server setup (Bun server with /health and /trigger endpoints)
src/trigger-workflow.ts	Main orchestration: calls config, JWT generation, and sends request
src/create-jwt.ts	JWT creation: header, payload, signing with ECDSA
src/get-config.ts	Loads PRIVATE_KEY and GATEWAY_URL from environment
src/schemas.ts	Zod schemas for input validation
src/utils.ts	Helper functions (SHA256 hashing, base64url encoding)
All code is available in the cre-http-trigger package.

Monitoring execution
After triggering workflows with the tool, verify execution in the CRE UI:

Go to cre.chain.link/workflows
Click on your workflow
Navigate to the Execution tab
Find recent executions and click Execution ID to view Events and Logs
See Monitoring & Debugging Workflows for complete guidance.

Troubleshooting
"Invalid private key" error
Cause: The PRIVATE_KEY environment variable is missing or malformed.

Solution: Ensure your .env file contains a valid EVM private key (with or without 0x prefix).

"Unauthorized" error
Cause: The private key doesn't correspond to any of the authorizedKeys in your workflow's HTTP trigger configuration.

Solution: Verify that the public address derived from your private key matches an entry in your workflow's authorizedKeys.

"Workflow not found" error
Cause: Incorrect workflowID or the workflow isn't deployed.

Solution: Double-check the workflow ID from the CRE UI or deployment output.

Server won't start
Cause: Port 2000 is already in use.

Solution: Stop any other services using port 2000, or modify src/index.ts to use a different port.

Production considerations
This tool is not intended for production use. For production integrations:

Implement JWT generation in your backend - Use your backend service's language and crypto libraries
Secure private key storage - Use a secrets manager
Add retry logic - Handle transient network errors and gateway timeouts
Monitor and log - Track requests, responses, and execution outcomes
Rate limiting - Implement appropriate request throttling
Next steps
Monitoring Workflows - View execution logs and debug issues

Cron Trigger
The Cron trigger fires based on a time-based schedule, defined by a standard cron expression.

Use case examples:

Periodically fetching data from an API.
Regularly checking an onchain state.
Regularly writing data to an onchain contract.
Configuration and handler
You create a Cron trigger by calling the CronCapability.trigger() method and register it with a handler inside your initWorkflow function.

When you configure a Cron trigger, you must provide a schedule using a standard cron expression. The expression can contain 5 or 6 fields, where the optional 6th field represents seconds.

For help understanding or creating cron expressions, see crontab.guru (note: this tool supports 5-field expressions; add a seconds field at the beginning for 6-field expressions).

Examples:

Every 30 seconds (6 fields): */30 * * * * *
Every minute, at second 0 (6 fields): 0 * * * * *
Every hour, at the top of the hour (6 fields): 0 0 * * * *
Every 5 minutes from 08:00 to 08:59, Monday to Friday (5 fields): */5 8 * * 1-5
Timezone support
By default, cron expressions use UTC. To specify a different timezone, prefix your cron expression with TZ=<timezone>, where <timezone> is an IANA timezone identifier (e.g., America/New_York, Europe/London, Asia/Tokyo).

Examples with timezones:

Daily at midnight in New York: TZ=America/New_York 0 0 * * *
Every Sunday at 8 PM in Tokyo: TZ=Asia/Tokyo 0 20 * * 0
Every weekday at 9 AM in London: TZ=Europe/London 0 9 * * 1-5
The timezone-aware scheduler automatically handles daylight saving time transitions, ensuring your workflows run at the correct local time throughout the year.

note
Minimum Interval

You cannot schedule a trigger to fire more frequently than once every 30 seconds.

copy to clipboard
import { CronCapability, handler, type Runtime, type CronPayload, Runner } from "@chainlink/cre-sdk"

type Config = {}

// Callback function that runs when the cron trigger fires
const onCronTrigger = (runtime: Runtime<Config>, payload: CronPayload): string => {
  if (payload.scheduledExecutionTime) {
    const seconds = payload.scheduledExecutionTime.seconds
    runtime.log(`Cron trigger fired at ${seconds}`)
  }
  // Your logic here...
  return "Trigger completed"
}

const initWorkflow = (config: Config) => {
  // Create the trigger - fires every 30 seconds in UTC
  const cronTrigger = new CronCapability().trigger({
    schedule: "*/30 * * * * *",
  })

  // Or use a timezone-aware schedule - fires daily at 9 AM Eastern Time
  // const cronTrigger = new CronCapability().trigger({
  //   schedule: "TZ=America/New_York 0 9 * * *",
  // })

  // Register a handler with the trigger and a callback function
  return [handler(cronTrigger, onCronTrigger)]
}

export async function main() {
  const runner = await Runner.newRunner<Config>()
  await runner.run(initWorkflow)
}
Callback and payload
When a Cron trigger fires, it passes a CronPayload object to your callback function. This payload contains the scheduled execution time.

For the full type definition and all available fields, see the Cron Trigger SDK Reference.

The payload parameter is optional in the callback function signature. If you don't need access to the scheduled execution time, you can omit it:

copy to clipboard
// Simple callback without payload
const onCronTrigger = (runtime: Runtime<Config>): string => {
  runtime.log("Cron trigger fired")
  // Your logic here...
  return "Cron trigger completed"
}
If you need to access the scheduled execution time, include the CronPayload parameter:

copy to clipboard
const onCronTrigger = (runtime: Runtime<Config>, payload: CronPayload): string => {
  if (payload.scheduledExecutionTime) {
    // Convert timestamp to JavaScript Date (timestamp has 'seconds' and 'nanos' fields)
    const scheduledTime = new Date(
      Number(payload.scheduledExecutionTime.seconds) * 1000 + payload.scheduledExecutionTime.nanos / 1000000
    )
    runtime.log(`Cron trigger fired at ${scheduledTime.toISOString()}`)
  }
  // Your logic here...
  return "Cron trigger completed"
}
Testing cron triggers in simulation
To test your cron trigger during development, you can use the workflow simulator. The simulator executes cron triggers immediately when selected, allowing you to test your logic without waiting for the scheduled time.

For detailed instructions on simulating cron triggers, including interactive and non-interactive modes, see the Cron Trigger section in the Simulating Workflows guide.


Simulating Workflows
Workflow simulation is a local execution environment that compiles your workflow to WebAssembly (WASM) and runs it on your machine. It allows you to test and debug your workflow logic before deploying it. The simulator makes real calls to public testnets and live HTTP endpoints, giving you high confidence that your code will work as expected when deployed.

When to use simulation
Use workflow simulation to:

Test workflow logic during development: Validate that your code behaves correctly before deploying.
Debug errors in a controlled environment: Catch and fix issues locally without deploying to a live network.
Test different trigger types: Manually select and test how your workflow responds to cron, HTTP, or EVM log triggers.
Verify onchain interactions: Test read and write operations against real testnets.
Basic usage
The cre workflow simulate command compiles your workflow and executes it locally.

Basic syntax:

copy to clipboard
cre workflow simulate <workflow-name-or-path> [flags]
Example:

copy to clipboard
cre workflow simulate my-workflow --target staging-settings
What happens during simulation
Compilation: The CLI compiles your workflow to WebAssembly (WASM).
Trigger selection: You're prompted to select which trigger to test (cron, HTTP, or EVM log).
Execution: The workflow runs locally, making real calls to configured RPCs and HTTP endpoints.
Output: The simulator displays logs from your workflow and the final execution result.
Prerequisites
Before running a simulation:

CRE account & authentication: You must have a CRE account and be logged in with the CLI. See Create your account and Log in with the CLI for instructions.
CRE CLI installed: You must have the CRE CLI installed on your machine. See CLI Installation for instructions.
Project configuration: You must run the command from your project root directory.
Valid workflow.yaml: Your workflow directory must contain a workflow.yaml file with correct paths to your workflow code, config, and secrets (optional).
RPC URLs configured: If your workflow interacts with blockchains, configure RPC endpoints in your project.yaml for the target you're using. Without this, the simulator cannot register the EVM capability and your workflow will fail. See Project Configuration for setup instructions.
Private key: Set CRE_ETH_PRIVATE_KEY in your .env file if your workflow performs onchain writes.
tip
New to CRE?

If these prerequisites seem overwhelming, we strongly recommend starting with the Getting Started guide. It walks you through setting up your first project, configuring your environment, and running your first simulation step by step.

Interactive vs non-interactive modes
Interactive mode (default)
In interactive mode, the simulator prompts you to select a trigger and provide necessary inputs.

Example:

copy to clipboard
cre workflow simulate my-workflow --target staging-settings
What you'll see:

copy to clipboard
Workflow compiled

🚀 Workflow simulation ready. Please select a trigger:
1. cron-trigger@1.0.0 Trigger
2. http-trigger@1.0.0-alpha Trigger
3. evm:ChainSelector:16015286601757825753@1.0.0 LogTrigger

Enter your choice (1-3):
Select a trigger by entering its number, and follow any additional prompts for trigger-specific inputs.

Non-interactive mode
Non-interactive mode allows you to run simulations without prompts, making it ideal for CI/CD pipelines or automated testing.

Requirements:

Use the --non-interactive flag
Specify --trigger-index to select which handler to run (0-based position: 0 = first handler, 1 = second, etc.)
Provide trigger-specific flags as needed (see Trigger-specific configuration)
Example:

copy to clipboard
cre workflow simulate my-workflow --non-interactive --trigger-index 0 --target staging-settings
tip
Understanding trigger-index

The --trigger-index flag selects which handler in your workflow to execute. Handlers are created in your InitWorkflow function using cre.Handler(), where each handler connects a trigger to a callback function. If your workflow has only one handler, use --trigger-index 0. If you have multiple handlers (e.g., one for an HTTP trigger and one for an EVM log trigger), use 0 for the first, 1 for the second, etc., based on their order in your code.

The --broadcast flag
By default, the simulator performs a dry run for onchain write operations. It prepares the transaction but does not broadcast it to the blockchain.

To actually broadcast transactions during simulation, use the --broadcast flag:

copy to clipboard
cre workflow simulate my-workflow --broadcast --target staging-settings
caution
Broadcast requires a funded wallet

When using --broadcast, your wallet (specified by CRE_ETH_PRIVATE_KEY in .env) must be funded with the native token of the chain you're writing to (e.g., Sepolia ETH for Ethereum Sepolia testnet). Visit faucets.chain.link to get your testnet tokens.

Use case: Use --broadcast when you want to test the complete end-to-end flow, including actual onchain state changes, on a testnet.

Trigger-specific configuration
Different trigger types require different inputs for simulation.

Cron trigger
Cron triggers do not require additional configuration. When selected, they execute immediately.

note
Single trigger workflows

If your workflow has only one trigger, the simulator will automatically run it without prompting you to select.

Interactive example:

copy to clipboard
cre workflow simulate my-workflow --target staging-settings
Select the cron trigger when prompted (if multiple triggers are defined)

Non-interactive example:

copy to clipboard
# Assuming the cron trigger is the first trigger defined in your workflow (index 0)
cre workflow simulate my-workflow --non-interactive --trigger-index 0 --target staging-settings
tip
Finding your trigger index

The --trigger-index is 0-based and corresponds to the order in which triggers are defined in your workflow code. The first trigger is index 0, the second is 1, and so on. If you're unsure which index to use, run the simulator in interactive mode first to see the list of triggers.

HTTP trigger
HTTP triggers require a JSON payload.

Interactive mode:

When you select an HTTP trigger, the simulator prompts you to provide JSON input. You can:

Enter the JSON directly
Provide a file path (e.g., ./payload.json)
Non-interactive mode:

Use the --http-payload flag with:

A JSON string: --http-payload '{"key":"value"}'
A file path: --http-payload @./payload.json (with or without @ prefix)
Example:

copy to clipboard
cre workflow simulate my-workflow --non-interactive --trigger-index 1 --http-payload @./http_trigger_payload.json --target staging-settings
tip
Detailed HTTP trigger testing guide

For a complete guide with workflow examples, test scenarios, and expected output, see Testing HTTP Triggers in Simulation.

EVM log trigger
EVM log triggers require a transaction hash and event index to fetch a specific log event from the blockchain.

Interactive mode:

When you select an EVM log trigger, the simulator prompts you for:

Transaction hash (e.g., 0x420721d7d00130a03c5b525b2dbfd42550906ddb3075e8377f9bb5d1a5992f8e)
Event index (0-based index of the log in the transaction, e.g., 0)
The simulator fetches the log from the configured RPC and passes it to your workflow.

Non-interactive mode:

Use the --evm-tx-hash and --evm-event-index flags:

copy to clipboard
cre workflow simulate my-workflow \
  --non-interactive \
  --trigger-index 2 \
  --evm-tx-hash 0x420721d7d00130a03c5b525b2dbfd42550906ddb3075e8377f9bb5d1a5992f8e \
  --evm-event-index 0 \
  --target staging-settings
tip
Understanding the two different indexes

Two separate concepts:

--trigger-index selects which handler in your workflow to run (e.g., if the handler with an EVM log trigger is the third handler defined, use --trigger-index 2)
--evm-event-index specifies which log/event within the transaction to use for testing (e.g., if the transaction emitted 3 events and you want the first one, use --evm-event-index 0)

These are completely independent: one selects your workflow's handler to execute, the other selects which event data from the blockchain to test with.

Additional flags
--engine-logs (-g)
Enables detailed engine logging for debugging purposes. This shows internal logs from the workflow execution engine.

copy to clipboard
cre workflow simulate my-workflow --engine-logs --target staging-settings
--target (-T)
Specifies which target environment to use from your configuration files. This determines which RPC URLs, settings, and secrets are loaded.

copy to clipboard
cre workflow simulate my-workflow --target staging-settings
--verbose (-v)
Enables debug-level logging for the CLI itself (not the workflow). Useful for troubleshooting CLI issues.

copy to clipboard
cre workflow simulate my-workflow --verbose --target staging-settings
Understanding the output
When you run a simulation, you'll see the following output:

1. Compilation confirmation
copy to clipboard
Workflow compiled
This indicates your workflow was successfully compiled to WASM.

2. Trigger selection menu (interactive mode only)
If your workflow has multiple triggers, you'll see a menu:

copy to clipboard
🚀 Workflow simulation ready. Please select a trigger:
1. cron-trigger@1.0.0 Trigger
2. http-trigger@1.0.0-alpha Trigger
3. evm:ChainSelector:16015286601757825753@1.0.0 LogTrigger

Enter your choice (1-3):
If your workflow has only one trigger, it will run automatically without this prompt.

3. User logs
Logs from your workflow code (e.g., logger.Info() calls) appear with timestamps:

copy to clipboard
2025-10-24T19:07:27Z [USER LOG] Running CronTrigger
2025-10-24T19:07:27Z [USER LOG] fetching por url https://api.example.com
2025-10-24T19:07:27Z [USER LOG] ReserveInfo { "totalReserve": 494515082.75 }
4. Final execution result
The simulator displays the value returned by your workflow:

copy to clipboard
Workflow Simulation Result:
 {
  "result": 47
}
5. Transaction details (if your workflow writes onchain)
If your workflow performs onchain writes, the simulator will show transaction information:

Without --broadcast (dry run):

The transaction is prepared but not sent. You'll see a zero address (0x0000...) as the transaction hash:

copy to clipboard
2025-10-24T23:01:50Z [USER LOG] Write report transaction succeeded: 0x0000000000000000000000000000000000000000000000000000000000000000
With --broadcast:

The transaction is actually sent to the blockchain. You'll see a real transaction hash:

copy to clipboard
2025-10-24T17:55:48Z [USER LOG] Write report transaction succeeded: 0x1013abc0b6f345fad15b19a56cabbbaab2a2aa94f81eb3a709058adf18a4f23f
Limitations
While simulation provides high confidence in your workflow's behavior, it has some limitations:

Single-node execution: Simulation runs on a single node (your local machine) rather than across a DON. There is no actual consensus or quorum, it is simulated.
Manual trigger execution: Time-based triggers (cron) execute immediately when selected, not on a schedule. You must manually initiate each simulation run.
Simplified environment: The simulation environment mimics production but is not identical. Some edge cases or network conditions may only appear in a deployed environment.
Despite these limitations, simulation is an essential tool for catching bugs, validating logic, and testing integrations before deploying to production.

Next steps
Deploy your workflow: Once you're confident your workflow works correctly, see Deploying Workflows.
CLI reference: For a complete list of flags and options, see the CLI Workflow Commands reference.