# Quick Test Guide - GitHub Verification

## Test 1: GitHub API (30 seconds)

```bash
node test-github-api.js
```

**Expected Output:**
```
✅ Repository verified successfully!
  Name: Pacter
  Owner: shreyan001
  URL: https://github.com/shreyan001/Pacter
  Homepage: https://pacter.vercel.app
  Latest commit: 17295f6
✅ Deployment URL is accessible
```

## Test 2: Verification API (1 minute)

```bash
node test-verify-simple.js
```

**Expected Output:**
```
Status: 404
Error: Contract not found
```
(This is correct - test contract doesn't exist)

## Test 3: Full UI Test (5 minutes)

### Step 1: Create Contract
1. Go to http://localhost:3000/create
2. Fill in contract details
3. Sign as both parties
4. Deposit escrow as client

### Step 2: Submit Deliverable
1. Open contract as freelancer
2. Enter:
   - GitHub: `https://github.com/shreyan001/Pacter`
   - Deployment: `https://pacter.vercel.app`
3. Click "Submit Deliverable"

### Step 3: Watch Progress
```
Step 1/5 ✅ Verifying GitHub Repository
Step 2/5 ✅ Downloading Repository  
Step 3/5 ✅ Uploading to 0G Storage
Step 4/5 ✅ Agent Signing On-Chain
Step 5/5 ✅ Finalizing Verification
```

### Step 4: Verify Results
- Contract stage: "Review"
- Deliverable: Submitted ✅
- GitHub: Verified ✅
- Agent: Verified ✅

## Troubleshooting

### "fetch failed" error
✅ FIXED - Now uses direct Redis access

### "Contract not found"
- Create a contract first in the UI
- Make sure you're using the correct contract ID

### "Unauthorized"
- Make sure you're connected as the freelancer wallet

### GitHub API rate limit
- Add GITHUB_TOKEN to .env for 5000 requests/hour
- Without token: 60 requests/hour

## Quick Commands

```bash
# Start dev server
npm run dev

# Test GitHub API
node test-github-api.js

# Test verification API
node test-verify-simple.js

# Check environment
cat .env | grep -E "GITHUB|AGENT|PACTER"
```

## Success Indicators

✅ GitHub API returns 200
✅ Repository data extracted
✅ Deployment URL accessible
✅ API endpoint responds
✅ No "fetch failed" errors
✅ Verification modal shows progress
✅ Contract stage changes to "Review"

## Test Data

Use these for testing:
- **GitHub URL:** `https://github.com/shreyan001/Pacter`
- **Deployment:** `https://pacter.vercel.app`
- **Commit:** `17295f6` (latest)
- **Comments:** "Test submission for verification"

## All Systems Go! 🚀

The verification system is ready for testing!
