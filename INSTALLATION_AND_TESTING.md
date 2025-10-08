# Installation and Testing Guide

## Quick Start

### 1. Install Required Dependencies

```bash
npm install archiver
npm install @types/archiver --save-dev
```

### 2. Configure Environment Variables

Add to your `.env` file:

```env
# Agent Wallet (for on-chain approval)
AGENT_PRIVATE_KEY=0xyour_agent_private_key_here

# 0G Storage (can be same as agent key)
0G_PRIVATE_KEY=0xyour_0g_private_key_here
OG_RPC_URL=https://evmrpc-testnet.0g.ai

# GitHub (optional - for private repos)
GITHUB_TOKEN=ghp_your_github_token_here

# Smart Contract
NEXT_PUBLIC_PACTER_CONTRACT_ADDRESS=0xyour_contract_address
ZEROG_RPC_URL=https://evmrpc-testnet.0g.ai

# Backend
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

### 3. Fund Agent Wallet

```bash
# Agent wallet needs 0G tokens for gas
# Get testnet tokens from faucet
# Send to agent wallet address
```

## Testing the Complete Flow

### Step 1: Create Test Contract
```bash
1. Navigate to /create
2. Create a contract with test data
3. Set client and freelancer wallet addresses
4. Set amount: ₹1,00,000 (0.1 0G)
```

### Step 2: Sign Contract
```bash
1. Connect with CLIENT wallet
2. Sign the contract
3. Disconnect and connect with FREELANCER wallet
4. Sign the contract
```

### Step 3: Client Deposits
```bash
1. Connect with CLIENT wallet
2. Navigate to contract page
3. Click "Deposit 0.1 0G to Escrow"
4. Confirm transaction in wallet
5. Wait for confirmation
6. Verify stage updates to "Escrow Deposited"
```

### Step 4: Freelancer Submits Work
```bash
1. Disconnect client wallet
2. Connect with FREELANCER wallet
3. Navigate to contract page
4. In Freelancer Dashboard:
   - Enter GitHub URL: https://github.com/yourusername/test-repo
   - Enter Deployment URL (optional): https://test-app.vercel.app
   - Add comments (optional)
5. Click "Submit for Verification"
6. Wait 60-120 seconds for verification
```

### Step 5: Verify Backend Logs
```bash
# Check API logs for verification process
# Should see:
# - GitHub verification
# - Repository cloning
# - 0G upload
# - On-chain approval
# - Backend updates
```

### Step 6: Client Reviews
```bash
1. Connect with CLIENT wallet
2. Refresh contract page
3. Should see "Review Deliverable" state
4. Can test deployment URL
5. Cannot see GitHub URL (security)
6. Click "Approve & Release Payment"
7. Confirm transaction
```

### Step 7: Freelancer Withdraws
```bash
1. Connect with FREELANCER wallet
2. Should see "Payment Approved" state
3. Click "Withdraw 0.09 0G"
4. Confirm transaction
5. Verify payment received
```

## Verification Checklist

### GitHub Verification
- [ ] Valid GitHub URL accepted
- [ ] Invalid URL rejected
- [ ] Repository accessibility checked
- [ ] Latest commit SHA fetched
- [ ] Deployment URL verified (if provided)

### 0G Storage
- [ ] Repository cloned successfully
- [ ] ZIP archive created
- [ ] File uploaded to 0G
- [ ] Storage hash returned
- [ ] Temp files cleaned up

### On-Chain Approval
- [ ] Agent wallet loaded
- [ ] Contract instance created
- [ ] verifyDeliverable() called
- [ ] Transaction confirmed
- [ ] Event emitted

### Backend Updates
- [ ] Deliverable marked as submitted
- [ ] Verification data stored
- [ ] Storage hash saved
- [ ] Stage updated to "AI Verification"
- [ ] Agent verification recorded
- [ ] Stage updated to "Client Review"

### Frontend Updates
- [ ] Freelancer sees submission form
- [ ] Loading states display correctly
- [ ] Success message shows
- [ ] Page reloads after verification
- [ ] Client sees updated status
- [ ] Stage progress bar updates

## Troubleshooting

### Issue: "AGENT_PRIVATE_KEY not configured"
**Solution**: Add AGENT_PRIVATE_KEY to .env file

### Issue: "Repository not found"
**Solution**: 
- Ensure repository is public
- Or add GITHUB_TOKEN for private repos
- Check URL format

### Issue: "Failed to upload to 0G storage"
**Solution**:
- Check 0G_PRIVATE_KEY is set
- Verify OG_RPC_URL is correct
- Ensure wallet has gas

### Issue: "Transaction reverted"
**Solution**:
- Check agent wallet has gas
- Verify order is in ACTIVE state
- Check contract address is correct

### Issue: "Git clone failed"
**Solution**:
- Ensure git is installed
- Check repository URL is valid
- Verify network connectivity

## Expected Console Output

### Successful Verification
```
==========================================================
🚀 Starting deliverable verification
==========================================================
Contract ID: abc123
GitHub URL: https://github.com/user/repo
Deployment URL: https://app.vercel.app
Freelancer: 0x1234...5678
Order Hash: 0xabcd...ef01

📋 STEP 1: Verifying GitHub repository...
✅ GitHub verification passed

📦 STEP 2: Downloading and uploading to 0G storage...
📥 Downloading repository from GitHub...
Cloning https://github.com/user/repo...
📦 Repository archived: /tmp/repo-123/repository.zip
📤 Uploading to 0G storage...
✅ Uploaded to 0G storage: 0x789...abc
✅ 0G storage upload complete

💾 STEP 3: Updating backend...
✅ Backend updated

⛓️  STEP 4: Approving deliverable on-chain...
🔐 Approving deliverable on-chain...
Agent wallet: 0x9876...5432
Calling verifyDeliverable for order: 0xabcd...ef01
Transaction sent: 0xdef...123
✅ Transaction confirmed in block 12345
✅ On-chain approval complete

✅ STEP 5: Final backend update...
✅ Verification complete!
==========================================================
```

## Performance Benchmarks

### Expected Timings
```
GitHub Verification:    2-5 seconds
Repository Clone:       10-30 seconds (depends on repo size)
ZIP Creation:           5-10 seconds
0G Upload:              20-40 seconds
On-Chain Approval:      15-30 seconds
Backend Updates:        1-2 seconds each
─────────────────────────────────────
Total Time:             ~60-120 seconds
```

### Optimization Tips
```
1. Use small test repositories for faster cloning
2. Ensure good network connectivity
3. Use shallow clone (already implemented)
4. Remove .git directory (already implemented)
5. Monitor agent wallet gas balance
```

## Security Checklist

- [ ] Agent private key stored securely in .env
- [ ] .env file in .gitignore
- [ ] Agent wallet has minimal funds (only for gas)
- [ ] GitHub token (if used) has minimal permissions
- [ ] Freelancer wallet verification working
- [ ] Client cannot see GitHub URL before payment
- [ ] All transactions logged
- [ ] Error messages don't expose sensitive data

## Next Steps After Testing

### 1. Production Deployment
```
- Use production 0G network
- Fund agent wallet with production tokens
- Update RPC URLs
- Configure production backend
```

### 2. Monitoring Setup
```
- Set up logging service
- Monitor agent wallet balance
- Track verification success rate
- Alert on failures
```

### 3. Optimization
```
- Implement job queue for long operations
- Add caching where appropriate
- Optimize repository cloning
- Reduce ZIP file size
```

### 4. Additional Features
```
- Support for multiple milestones
- Dispute resolution
- Automated testing
- Performance monitoring
```

## Quick Test Commands

### Check Agent Wallet Balance
```bash
# Using ethers.js
node -e "const ethers = require('ethers'); const provider = new ethers.JsonRpcProvider('https://evmrpc-testnet.0g.ai'); const wallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY, provider); wallet.getBalance().then(b => console.log('Balance:', ethers.formatEther(b), '0G'))"
```

### Test 0G Storage
```bash
npm run test:0g-storage
```

### Check Contract Status
```bash
curl http://localhost:3001/api/contracts?id=YOUR_CONTRACT_ID | jq
```

### Verify Transaction
```bash
# Open in browser
https://chainscan-galileo.0g.ai/tx/YOUR_TX_HASH
```

## Success Criteria

✅ All dependencies installed
✅ Environment variables configured
✅ Agent wallet funded
✅ GitHub verification working
✅ 0G upload successful
✅ On-chain approval confirmed
✅ Backend updates correct
✅ Frontend displays properly
✅ Complete flow tested end-to-end

Ready to test! 🚀
