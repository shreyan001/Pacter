# Quick Reference - Complete System

## 🚀 Quick Start

### Test Current State:
```bash
node test-sync-fix.js
```

### Test 0G Storage:
```bash
npm run test:0g-storage
```

## 📊 Contract Stages

| Stage | Description | Who Acts |
|-------|-------------|----------|
| Information Collection | Gathering project details | Client + AI |
| Contract Generated | Legal contract created | System |
| Signatures Pending | Awaiting signatures | Both |
| Both Parties Signed | Contract signed | System |
| Escrow Deposited | Funds locked in escrow | Client |
| Work in Progress | Freelancer working | Freelancer |
| Submission | Deliverable submitted | Freelancer |
| Review | Client reviewing | Client |
| Payment Approved | Payment approved | Client |
| Contract Completed | Funds withdrawn | Freelancer |

## 🔑 Key Functions

### Client Actions:
```typescript
// 1. Deposit Escrow
await createAndDepositOrder(walletClient, {
  orderHash, freelancerAddress, escrowAmount, storageFee, projectName
})

// 2. Approve Payment
await approvePayment(walletClient, orderHash)

// 3. Download from 0G
await fetch('/api/storage/download', {
  method: 'POST',
  body: JSON.stringify({ storageHash })
})
```

### Freelancer Actions:
```typescript
// 1. Submit Deliverable
// Uses verification flow:
// - /api/verify/github
// - /api/verify/storage (REAL 0G!)
// - /api/verify/agent-sign
// - /api/verify/finalize

// 2. Withdraw Funds
await withdrawFunds(walletClient, orderHash)
```

## 📁 Important Files

### Components:
- `src/components/contract/ClientView.tsx` - Client dashboard
- `src/components/contract/FreelancerView.tsx` - Freelancer dashboard
- `src/components/contract/ContractDiagram.tsx` - Visual progress

### APIs:
- `src/app/api/contracts/route.ts` - Contract CRUD
- `src/app/api/verify/storage/route.ts` - 0G upload (REAL!)
- `src/app/api/storage/download/route.ts` - 0G download
- `src/app/api/verify/github/route.ts` - GitHub verification
- `src/app/api/verify/agent-sign/route.ts` - On-chain signing
- `src/app/api/verify/finalize/route.ts` - Backend update

### Services:
- `src/lib/0gStorageService.ts` - 0G Storage SDK wrapper
- `src/lib/contracts/pacterClient.ts` - Smart contract functions
- `src/lib/redisService.ts` - Backend storage

## 🔍 Debugging

### Check Backend State:
```javascript
const response = await fetch(`/api/contracts?id=${contractId}`)
const contract = await response.json()
console.log('Stage:', contract.currentStage)
console.log('Milestone:', contract.milestones[0].status)
console.log('Payment:', contract.milestones[0].payment)
```

### Check Console Logs:
- Look for 📝, 📤, ✅, ❌ emoji prefixes
- All updates are logged comprehensively
- Check browser console and server logs

### Common Issues:
1. **Wrong stage showing** → Check `milestone.status` and `lastUpdated`
2. **Fake storage hash** → Should start with `0x` but NOT `0xtest_`
3. **Can't withdraw** → Check `payment.approved === true`
4. **Backend not updating** → Check console for error logs

## 💾 Backend Structure

### Minimal Check:
```json
{
  "currentStage": "Payment Approved",
  "lastUpdated": "2025-10-08T...",
  "milestones": [{
    "status": "COMPLETED",
    "payment": {
      "approved": true,
      "released": false
    }
  }]
}
```

### After Withdrawal:
```json
{
  "currentStage": "Contract Completed",
  "milestones": [{
    "status": "COMPLETED",
    "payment": {
      "approved": true,
      "released": true,
      "transactionHash": "0x..."
    }
  }]
}
```

## 🎯 Testing Checklist

- [ ] Contract creation works
- [ ] Both parties can sign
- [ ] Client can deposit escrow
- [ ] Freelancer can submit deliverable
- [ ] Real 0G storage hash generated (not test hash)
- [ ] AI verification completes
- [ ] Client can review and approve
- [ ] Backend updates to "Payment Approved"
- [ ] Milestone status is "COMPLETED"
- [ ] Freelancer can withdraw funds
- [ ] Backend updates to "Contract Completed"
- [ ] All transaction hashes recorded
- [ ] Diagram shows correct stage
- [ ] Download functionality works

## 🔧 Environment Variables

```env
# Smart Contract
NEXT_PUBLIC_PACTER_CONTRACT_ADDRESS=0x259829717EbCe11350c37CB9B5d8f38Cb42E0988
NEXT_PUBLIC_VERIFICATION_AGENT_ADDRESS=0x83CDBbA8359aAc6a25ACb70eb67dcF0E5eB2c607
VERIFICATION_AGENT_PRIVATE_KEY=your_key

# 0G Storage
0G_PRIVATE_KEY=your_key
OG_RPC_URL=https://evmrpc-testnet.0g.ai

# Redis
REDIS_URL=your_redis_url
```

## 📞 Quick Commands

```bash
# Start dev server
npm run dev

# Test 0G storage
npm run test:0g-storage

# Check backend state
node test-sync-fix.js

# Check diagnostics
npm run build
```

## ✅ All Fixed!

1. ✅ Backend sync - Updates immediately
2. ✅ Real 0G storage - No more fake hashes
3. ✅ Download works - Real 0G download
4. ✅ Withdraw enabled - Freelancer can withdraw
5. ✅ Logging added - Comprehensive debugging
6. ✅ States synced - UI always correct

**System is complete and ready! 🎉**
