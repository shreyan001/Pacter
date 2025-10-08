# Freelancer View Testing Guide

## Prerequisites

1. **Environment Variables** (add to `.env`):
```env
# Optional - for private GitHub repos
GITHUB_TOKEN=ghp_your_github_token_here

# Required - Agent wallet for verification
AGENT_PRIVATE_KEY=0x_your_agent_private_key

# Already configured
ZEROG_RPC_URL=https://evmrpc-testnet.0g.ai
NEXT_PUBLIC_PACTER_CONTRACT_ADDRESS=0xYourContractAddress
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

2. **Test Wallets**:
   - Client wallet (for deposit)
   - Freelancer wallet (for submission & withdrawal)
   - Agent wallet (for verification)

## Testing Steps

### Step 1: Create Test Contract
```bash
# Start the app
npm run dev

# Navigate to /create
# Create a contract with:
# - Client: Your client wallet
# - Freelancer: Your freelancer wallet
# - Amount: ₹1,00,000 (0.1 0G)
```

### Step 2: Client Deposits Funds
```bash
# Connect with CLIENT wallet
# Navigate to contract page
# Click "Deposit 0.1 0G to Escrow"
# Confirm transaction
# Wait for confirmation
```

### Step 3: Freelancer Submits Work
```bash
# Disconnect client wallet
# Connect with FREELANCER wallet
# Refresh contract page

# In Freelancer Dashboard:
# 1. Enter GitHub URL: https://github.com/yourusername/test-repo
# 2. Enter Deployment URL (optional): https://test-app.vercel.app
# 3. Add comments: "Completed all requirements"
# 4. Click "Submit for Verification"
```

### Step 4: Verify Backend Updates
```bash
# Check backend logs
# Should see:
# - GitHub verification request
# - Repository data fetched
# - Metadata stored
# - Contract updated to "AI Verification"
```

### Step 5: Agent Verification (Automatic)
```bash
# Backend automatically calls verifyDeliverable()
# Using AGENT_PRIVATE_KEY
# Wait 10-30 seconds

# Frontend polls every 10 seconds
# Should see status change to "Awaiting Client Approval"
```

### Step 6: Client Approves Payment
```bash
# Connect with CLIENT wallet
# In Client Dashboard:
# - Review deliverable
# - Check GitHub repo
# - Click "Approve & Release Payment"
# - Confirm transaction
```

### Step 7: Freelancer Withdraws
```bash
# Connect with FREELANCER wallet
# In Freelancer Dashboard:
# - See "Payment Approved" message
# - Click "Withdraw 0.09 0G"
# - Confirm transaction
# - Wait for confirmation
# - See success message with tx link
```

## Test Scenarios

### Scenario 1: Happy Path
- ✅ Valid GitHub repo
- ✅ Accessible deployment
- ✅ Agent verification passes
- ✅ Client approves
- ✅ Freelancer withdraws

### Scenario 2: Invalid GitHub URL
```bash
# Enter: https://github.com/invalid/nonexistent
# Expected: Error "Repository not found or not accessible"
```

### Scenario 3: Private Repository (No Token)
```bash
# Enter: https://github.com/yourusername/private-repo
# Without GITHUB_TOKEN in .env
# Expected: Error "Repository not found or not accessible"
```

### Scenario 4: Network Error During Withdrawal
```bash
# Disconnect internet
# Click "Withdraw 0.09 0G"
# Expected: Error message with retry button
```

### Scenario 5: Wrong Wallet Connected
```bash
# Connect with CLIENT wallet
# Try to access Freelancer Dashboard
# Expected: "Connect with the freelancer wallet" message
```

## Verification Checklist

### GitHub Verification
- [ ] Valid GitHub URL parsed correctly
- [ ] Repository accessibility checked
- [ ] Latest commit fetched
- [ ] Deployment URL verified (if provided)
- [ ] Error messages clear and helpful

### 0G Storage
- [ ] Metadata object created
- [ ] Storage hash generated
- [ ] Backend updated with hash
- [ ] (Future) Actual file upload works

### Smart Contract
- [ ] Agent calls `verifyDeliverable()`
- [ ] Transaction confirmed on-chain
- [ ] Event emitted correctly
- [ ] Order status updated

### Backend Updates
- [ ] Milestone deliverable updated
- [ ] Verification data stored
- [ ] Stage history tracked
- [ ] Timestamps accurate

### Frontend States
- [ ] State 1: Ready to Submit (shows form)
- [ ] State 2: Awaiting Verification (shows loader)
- [ ] State 3: Awaiting Approval (shows success)
- [ ] State 4: Ready to Withdraw (shows button)
- [ ] State 5: Completed (shows tx link)

### Error Handling
- [ ] GitHub errors displayed
- [ ] Network errors handled
- [ ] Transaction failures caught
- [ ] Retry functionality works
- [ ] Loading states accurate

## Debug Commands

### Check Backend Contract
```bash
curl http://localhost:3001/api/contracts?id=YOUR_CONTRACT_ID | jq
```

### Check Milestone Status
```bash
curl http://localhost:3001/api/contracts?id=YOUR_CONTRACT_ID | jq '.milestones[0]'
```

### Check Verification Data
```bash
curl http://localhost:3001/api/contracts?id=YOUR_CONTRACT_ID | jq '.milestones[0].verification'
```

### Check Payment Status
```bash
curl http://localhost:3001/api/contracts?id=YOUR_CONTRACT_ID | jq '.milestones[0].payment'
```

## Common Issues

### Issue 1: "Repository not found"
**Solution**: 
- Check GitHub URL format
- Ensure repo is public OR add GITHUB_TOKEN
- Verify repo exists

### Issue 2: Verification timeout
**Solution**:
- Check AGENT_PRIVATE_KEY is set
- Verify agent wallet has gas
- Check RPC URL is correct
- Look at backend logs for errors

### Issue 3: Withdrawal fails
**Solution**:
- Ensure client approved payment first
- Check freelancer wallet has gas
- Verify order hash is correct
- Check contract balance

### Issue 4: Frontend not updating
**Solution**:
- Check polling is working (10s intervals)
- Verify backend is updating correctly
- Hard refresh page (Ctrl+Shift+R)
- Check browser console for errors

## Expected Transaction Flow

```
1. Client Deposit
   → createAndDepositOrder()
   → 0.1 0G locked in contract
   → Backend: stage = "Awaiting Submission"

2. Freelancer Submit
   → GitHub verification
   → 0G storage upload
   → Backend: stage = "AI Verification"

3. Agent Verify
   → verifyDeliverable()
   → On-chain verification
   → Backend: stage = "Client Review"

4. Client Approve
   → approvePayment()
   → Payment unlocked
   → Backend: stage = "Payment Approved"

5. Freelancer Withdraw
   → withdrawFunds()
   → 0.09 0G transferred
   → Backend: stage = "Contract Completed"
```

## Success Criteria

✅ Freelancer can submit GitHub URL
✅ GitHub verification works
✅ Agent verification completes automatically
✅ Client can review and approve
✅ Freelancer can withdraw payment
✅ All states display correctly
✅ Error handling works
✅ Transaction links functional
✅ Backend stays in sync

## Next Test: Full Integration

After individual testing, run complete end-to-end flow:
1. Create contract
2. Both parties sign
3. Client deposits
4. Freelancer submits
5. Agent verifies
6. Client approves
7. Freelancer withdraws
8. Verify all on-chain events
9. Check backend consistency
10. Confirm UI updates

Ready to test! 🚀
