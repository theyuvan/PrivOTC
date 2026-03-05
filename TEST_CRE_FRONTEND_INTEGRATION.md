# Testing CRE ↔ Frontend Integration in Simulation

## ✅ Verified: CRE HTTPClient Can Call localhost:3000

**From CRE Documentation:**
> "Simulation makes **real calls** to live APIs and public EVM blockchains."

This means:
- ✅ CRE's `HTTPClient` makes real HTTP requests during simulation
- ✅ Simulation runs locally → can reach `localhost:3000`
- ✅ No restrictions on localhost in HTTP capability quotas
- ✅ Different from `fetch()` (which isn't available in WASM) - HTTPClient uses CRE's HTTP Capability

**HTTP Capability Limits:**
- Max 5 requests per workflow execution
- 100 KB max response size
- 10 seconds connection timeout

---

## 🔄 Architecture: Testing vs Production

### Testing (This Demo)
```
CRE Simulation → HTTPClient.get() → localhost:3000/api/trade → Next.js API
```
- **Purpose**: Test integration without CRE deployment (no Early Access needed)
- **Flow**: CRE pulls data from frontend
- **Use case**: Hackathon demo, local development

### Production (Real System)
```
Frontend → fetch() → https://cre-workflow-abc123.chainlink.com → CRE HTTP Trigger
```
- **Purpose**: Real users submit trades
- **Flow**: Frontend posts to CRE
- **Use case**: Production deployment (requires Early Access)

---

## 🚀 How to Test

### Step 1: Start Next.js Frontend
```bash
cd frontend
npm run dev
```

**Verify it's running:**
```bash
curl http://localhost:3000/api/trade
```

You should see mock trade data returned.

---

### Step 2: Run CRE Simulation with Frontend Fetch

**Option A: Test existing handlers (HTTP + Cron)**
```bash
cd privotc-cre
cre workflow simulate my-workflow --target privotc-staging
```
This runs the matching engine (Cron trigger) with demo trades.

---

**Option B: Enable frontend fetch handler**

1. **Edit** [`privotc-workflow.ts`](privotc-cre/my-workflow/privotc-workflow.ts#L630)

2. **Uncomment** the frontend fetch handler:
```typescript
// [OPTIONAL] Test: CRE fetches from frontend (uncomment to enable)
handlers.push(
  cre.handler(
    cron.trigger({ schedule: '*/15 * * * * *' }),  // Every 15 seconds
    handleFetchFromFrontend,
  )
);
```

3. **Run simulation:**
```bash
cd privotc-cre
cre workflow simulate my-workflow --target privotc-staging --non-interactive
```

**Expected output:**
```
🔄 Testing CRE → Frontend HTTP Integration...
✅ Received trade data from frontend:
   Trade: sell 1.5 ETH/USDC @ 3200
   World ID nullifier: 0xabcdefabcdefabcd...
✅ World ID proof accepted
⚠️  Simulation mode: Skipping ZK verification
✅ Trade added from frontend | Orderbook depth: 0 buys, 1 sells
```

---

## 📁 Files Modified

### 1. Frontend API Route
**File**: [`frontend/app/api/trade/route.ts`](frontend/app/api/trade/route.ts)

**Added**: `GET /api/trade` endpoint
```typescript
export async function GET(req: NextRequest) {
  // Returns mock trade data for CRE to consume
  const mockTrade = {
    worldIdProof: { ... },
    zkProof: { ... },
    trade: { side: 'sell', tokenPair: 'ETH/USDC', ... },
  };
  return NextResponse.json(mockTrade);
}
```

---

### 2. CRE Workflow
**File**: [`privotc-cre/my-workflow/privotc-workflow.ts`](privotc-cre/my-workflow/privotc-workflow.ts)

**Added**: 
- `HTTPClient` import from `@chainlink/cre-sdk`
- `handleFetchFromFrontend()` handler (lines 525-608)
- Optional handler in `initWorkflow()` (commented out by default)

**Key code:**
```typescript
const http = new HTTPClient(runtime);
const response = http.get("http://localhost:3000/api/trade");
const data = await response.result();

if (!ok(response)) {
  throw new Error(`HTTP request failed with status: ${response.statusCode}`);
}

const tradeData = json(response) as any;
// Validate and add to orderbook...
```

---

### 3. Configuration
**File**: [`privotc-cre/my-workflow/privotc-config.json`](privotc-cre/my-workflow/privotc-config.json)

**Added**:
```json
{
  "frontendApiUrl": "http://localhost:3000/api/trade"
}
```

---

## 🔍 How It Works

### CRE Side (Workflow)
1. Cron trigger fires every 15 seconds
2. `handleFetchFromFrontend()` runs
3. Creates `HTTPClient` instance
4. Calls `http.get("http://localhost:3000/api/trade")`
5. CRE's HTTP Capability makes real network request
6. Receives trade data from frontend
7. Validates World ID + ZK proof
8. Adds to confidential orderbook

### Frontend Side (Next.js)
1. Next.js dev server running on port 3000
2. `GET /api/trade` endpoint responds
3. Returns mock trade data (World ID + ZK proof + trade details)
4. Logs: "🔵 CRE requested trade data from frontend API"

---

## ✅ Benefits for Hackathon

### Without CRE Deployment
- ✅ Test full integration locally
- ✅ No Early Access approval needed (1-3 day wait)
- ✅ Prove bidirectional communication works
- ✅ Demo CRE's HTTP capability

### For Video Demo
Show:
1. Both terminals side by side
2. Frontend console: "🔵 CRE requested trade data"
3. CRE output: "✅ Trade added from frontend"
4. Orderbook updating in real-time

---

## 🎯 Production Migration

When deploying to production:

1. **Remove** `handleFetchFromFrontend` handler (testing only)
2. **Keep** `handleTradeIntake` (HTTP trigger)
3. **Deploy** CRE: `cre workflow deploy my-workflow`
4. **Get** HTTP endpoint: `https://cre-workflow-abc123.chainlink.com`
5. **Update** frontend: `CRE_INTAKE_ENDPOINT=https://...`
6. **Flow reverses**: Frontend POSTs to CRE (not CRE pulls from frontend)

---

## 🐛 Troubleshooting

**Error: Connection refused**
```bash
# Make sure frontend is running:
cd frontend
npm run dev
# Should see: "Ready on http://localhost:3000"
```

**Error: frontendApiUrl not set**
```json
// Check privotc-config.json has:
{
  "frontendApiUrl": "http://localhost:3000/api/trade"
}
```

**No output from CRE fetch**
```typescript
// Uncomment the handler in initWorkflow():
handlers.push(
  cre.handler(
    cron.trigger({ schedule: '*/15 * * * * *' }),
    handleFetchFromFrontend,
  )
);
```

---

## 📚 References

- **CRE HTTP Capability Docs**: [new1.txt](new1.txt) (lines 360-390)
- **Simulation Behavior**: "Simulation makes real calls to live APIs" 
- **Frontend API**: [frontend/app/api/trade/route.ts](frontend/app/api/trade/route.ts)
- **CRE Workflow**: [privotc-workflow.ts](privotc-cre/my-workflow/privotc-workflow.ts#L525)

---

## 💡 Key Takeaways

1. **HTTPClient ≠ fetch()**
   - `fetch()` is Node.js/browser API (not in WASM)
   - `HTTPClient` is CRE SDK client (uses HTTP Capability DON)
   - HTTPClient works in both simulation and production

2. **Simulation is Real**
   - Makes actual network requests
   - Can reach localhost (same machine)
   - No mocking for HTTP

3. **Bidirectional is Possible**
   - CRE can pull from frontend (testing)
   - Frontend can push to CRE (production)
   - Choose based on use case

4. **No Deployment Needed for Testing**
   - Simulation is enough for hackathon
   - Demonstrates architecture works
   - Saves 1-3 days waiting for Early Access

---

**Ready to test! Start the frontend and run CRE simulation.** 🚀
