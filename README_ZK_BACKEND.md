# 🚀 Quick Start: Real ZK Verification + Backend Trigger

## What's New?

✅ **REAL ZK-SNARK Verification** - CRE now calls external verifier  
✅ **HTTP-Triggered Matching** - Trigger matching from backend/frontend  
✅ **Production-Ready Architecture** - Works in simulation AND production  

---

## 🎯 Start Testing in 3 Steps

### Step 1: Start ZK Verifier (Terminal 1)
```powershell
cd zk-circuits
npm install
npm run verifier
```

**You should see:**
```
🔐 ZK Verification API started
   Running on: http://localhost:4000
✅ Ready to verify ZK-SNARKs!
```

---

### Step 2: Start Frontend (Terminal 2)
```powershell
cd frontend  
npm run dev
```

**You should see:**
```
✓ Ready on http://localhost:3000
```

---

### Step 3: Run CRE with Real ZK Verification (Terminal 3)
```powershell
cd privotc-cre

# Test handler 2: CRE → Frontend + REAL ZK Verification
cre workflow simulate my-workflow --trigger-index 2 --target privotc-staging
```

**You should see:**
```
✅ Received trade data from frontend
🔐 Verifying ZK proof via external service...
✅ ZK proof verified by external service  <-- 🆕 NEW!
✅ Trade added from frontend
```

---

## ⚡ Trigger Manual Matching

```powershell
# Create payload
@"
{
  "adminApiKey": "hackathon-demo-2026",
  "tokenPair": "ETH/USDC"
}
"@ | Out-File -FilePath manual-match.json -Encoding utf8

# Trigger matching (handler 3)
cre workflow simulate my-workflow --trigger-index 3 --http-payload manual-match.json --target privotc-staging
```

**You should see:**
```
🎯 Manual matching engine triggered via HTTP
✅ Manual matching complete
```

---

## 📚 Full Documentation

- **[ZK_VERIFICATION_IN_CRE.md](ZK_VERIFICATION_IN_CRE.md)** - ALL 5 ways to add ZK verification
- **[COMPLETE_TESTING_GUIDE.md](COMPLETE_TESTING_GUIDE.md)** - Detailed testing instructions
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Architecture & deployment guide

---

## 🎬 Demo Video Checklist

1. [ ] Show ZK verifier running on localhost:4000
2. [ ] Show frontend running on localhost:3000
3. [ ] Run handler 2 - highlight "✅ ZK proof verified by external service"
4. [ ] Run handler 3 - show manual matching trigger
5. [ ] Show architecture diagram from docs

---

## 🐛 Quick Troubleshooting

**"Connection refused on localhost:4000"**  
→ Start ZK verifier first: `cd zk-circuits; npm run verifier`

**"Invalid proof" from ZK verifier**  
→ Expected for testing! Mock data doesn't have valid proofs

**"Unauthorized" when triggering matching**  
→ Check `adminApiKey` matches in config and payload

---

## 🎉 You Now Have:

✅ Real ZK-SNARK verification (Groth16 protocol)  
✅ HTTP-triggered matching engine  
✅ Bidirectional CRE ↔ Frontend integration  
✅ Production-ready architecture  
✅ Ready for hackathon demo!  

**Time to record your demo! 🎬**
