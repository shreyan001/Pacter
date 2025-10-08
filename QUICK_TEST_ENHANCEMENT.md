# Quick Test Guide - Contract Enhancement Flow

## Test the Complete Flow

### 1. Start Application
```bash
npm run dev
```

### 2. Navigate and Connect
- Go to `http://localhost:3000/create`
- Connect your wallet

### 3. Provide Information
Click "I am a Client" and provide:
- Project Name: "Test Website"
- Project Description: "E-commerce site with payment gateway"
- Client Name: "John Doe"
- Email: "john@test.com"
- Payment Amount: "50000"

### 4. Verify Simple Contract Generation

**Should See:**
- ✅ Loading message: "Generating simple contract..."
- ✅ Success banner: "Basic Contract Generated Successfully"
- ✅ Contract preview (first 500 chars)
- ✅ "Show full contract" button
- ✅ Contract link (clickable, underlined)
- ✅ Purple "⚡ Enhance with Crypto/Escrow Clauses" button
- ✅ "Open Contract Page →" button
- ✅ "Edit Details" button

**Should NOT See:**
- ❌ JSON objects like `[JSON_DATA_START]`
- ❌ Raw data structures
- ❌ Auto-redirect to contract page

### 5. Test Contract Link
- Click the contract link
- Should open contract page in new tab
- URL should be: `/contract/contract_[timestamp]`

### 6. Test Enhancement

**Click "Enhance with Crypto/Escrow Clauses" button**

**Should See:**
- ✅ Loading: "Adding crypto/escrow/AI clauses..."
- ✅ Purple success banner: "Contract Enhanced Successfully!"
- ✅ Message: "Added cryptocurrency, escrow, smart contract, and AI dispute resolution clauses"
- ✅ Enhanced contract link
- ✅ "Open Enhanced Contract →" button

### 7. Verify Enhanced Contract

**Click "Open Enhanced Contract" or the link**

**Enhanced contract should include:**
- ✅ Section 6: Payment Clause (crypto/INR/barter)
- ✅ Section 7: Escrow and Deposit Clause
- ✅ Section 8: Smart Contract Clause
- ✅ Section 10: AI Dispute Resolution
- ✅ Section 11: Enhanced Jurisdiction (5 Indian laws)

**Simple contract only has:**
- Basic payment terms
- No crypto clauses
- No escrow clauses
- No AI dispute resolution
- Basic governing law (2 acts only)

## What to Check

### ✅ Chat Messages
- [ ] No JSON objects visible
- [ ] Clean, readable messages
- [ ] Proper formatting

### ✅ Simple Contract
- [ ] Generates quickly
- [ ] Shows basic clauses only
- [ ] Expandable preview
- [ ] Clickable link displayed

### ✅ Enhancement Button
- [ ] Purple gradient styling
- [ ] Lightning bolt icon
- [ ] Clear label
- [ ] Works on click

### ✅ Enhanced Contract
- [ ] All crypto clauses added
- [ ] Escrow clauses added
- [ ] Smart contract clauses added
- [ ] AI dispute resolution added
- [ ] Full Indian law compliance

### ✅ Navigation
- [ ] No auto-redirect
- [ ] Links open in new tab
- [ ] User controls navigation
- [ ] Can continue chat after generation

## Expected Console Logs

```
Data collection complete! Starting inline contract generation...
Starting contract creation...
Using simple contract template (user can enhance with crypto/escrow clauses)
Contract uploaded to backend: { success: true, ... }
```

## Common Issues & Solutions

### Issue: JSON objects still visible
**Check:** `src/app/agent.tsx` has JSON filtering code

### Issue: Enhanced contract same as simple
**Check:** `handleEnhanceContract` is calling `generateIndianFreelanceContract`

### Issue: Auto-redirect happening
**Check:** `onViewFull` uses `window.open()` not `router.push()`

### Issue: Enhancement button not working
**Check:** `onEnhance` prop is passed to `ContractPreviewMessage`

## Success Criteria

✅ JSON objects filtered from chat  
✅ Simple contract generates first  
✅ Enhancement button visible  
✅ Enhancement adds all clauses  
✅ Links displayed (not auto-redirect)  
✅ User controls navigation  
✅ Chat history preserved  
✅ No console errors  

---

**Ready to test! 🚀**
