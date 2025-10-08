# Signature Testing Guide

## How the Freelancer Detection Works

### Logic Flow:

1. **Check if wallet is the client:**
   ```typescript
   isClient = address === contract.parties.client.walletAddress
   ```

2. **Check if freelancer wallet is already set:**
   ```typescript
   freelancerWalletSet = contract.parties.freelancer.walletAddress exists 
                         AND !== '0x0000000000000000000000000000000000000000'
   ```

3. **Determine if user is freelancer:**
   ```typescript
   if (freelancerWalletSet) {
     isFreelancer = address === contract.parties.freelancer.walletAddress
   } else {
     isFreelancer = !isClient && isConnected
   }
   ```

4. **Check if freelancer info is needed:**
   ```typescript
   needsFreelancerInfo = isFreelancer 
                         AND (no name OR name === 'To Be Determined')
   ```

## Testing Steps

### Test 1: Client Signs First

1. **Connect with client wallet** (the wallet used to create the contract)
   - Should see: "Detected Role: 🔵 Client"
   - Should see: "Sign as Client" button (blue)
   - Should NOT see: Name/Email fields

2. **Click "Sign as Client"**
   - Wallet prompts for EIP-712 signature
   - After signing: Client status shows "Signed" ✓

### Test 2: Freelancer Signs (New Wallet)

1. **Disconnect client wallet**

2. **Connect with a DIFFERENT wallet** (any wallet that's not the client)
   - Should see: "Detected Role: 🟣 Freelancer (Info Required)"
   - Should see: Name and Email input fields
   - Should see: "Sign as Freelancer" button (purple, disabled until info entered)

3. **Enter freelancer information:**
   - Full Name: "John Freelancer"
   - Email: "john@example.com"
   - Button should become enabled

4. **Click "Sign as Freelancer"**
   - Wallet prompts for EIP-712 signature
   - After signing: Freelancer status shows "Signed" ✓
   - Contract stage changes to "Awaiting Deposit"

### Test 3: Both Signed

1. **After both signatures:**
   - Signatures section shows: "Contract Fully Signed" (green)
   - Client view or Freelancer view appears (based on connected wallet)

### Test 4: Random Viewer

1. **Connect with a third wallet** (not client, not freelancer, after both signed)
   - Should see: "Detected Role: 👁️ Viewer"
   - Should see: "You are not a party to this contract"
   - Should NOT see: Any action buttons

## Debug Information

Open browser console to see debug logs:
```javascript
{
  address: "0x...",
  isConnected: true,
  isClient: false,
  isFreelancer: true,
  freelancerWalletSet: false,
  needsFreelancerInfo: true,
  freelancerName: "To Be Determined",
  freelancerWallet: "0x0000..."
}
```

## Expected Contract Data Structure

Initial state (before freelancer signs):
```json
{
  "parties": {
    "client": {
      "name": "Client Name",
      "walletAddress": "0xCLIENT..."
    },
    "freelancer": {
      "name": "To Be Determined",
      "email": "",
      "walletAddress": "0x0000000000000000000000000000000000000000"
    }
  },
  "signatures": {
    "client": { "signed": false },
    "freelancer": { "signed": false },
    "bothSigned": false
  }
}
```

After freelancer signs:
```json
{
  "parties": {
    "freelancer": {
      "name": "John Freelancer",
      "email": "john@example.com",
      "walletAddress": "0xFREELANCER..."
    }
  },
  "signatures": {
    "freelancer": { 
      "signed": true,
      "signedAt": "2025-10-08T...",
      "signature": "0x..."
    }
  }
}
```

## Troubleshooting

### Issue: Freelancer info fields not showing

**Check:**
1. Is wallet connected? (isConnected = true)
2. Is wallet NOT the client? (isClient = false)
3. Is freelancer wallet not set? (freelancerWalletSet = false)
4. Check console logs for detection values

### Issue: "Not a party" message showing for freelancer

**Possible causes:**
1. Freelancer wallet was already set to a different address
2. Logic error in detection

**Solution:**
- Check `contract.parties.freelancer.walletAddress` value
- Should be `null`, `undefined`, or `0x0000...` for new freelancer

### Issue: Signature fails

**Check:**
1. Wallet is connected
2. Correct network/chain
3. EIP-712 signature was approved in wallet
4. Backend API is running
5. Redis database is accessible

## API Endpoint Behavior

POST `/api/contracts/[contractId]/sign`

**Request:**
```json
{
  "signature": "0x...",
  "role": "freelancer",
  "walletAddress": "0xFREELANCER...",
  "freelancerInfo": {
    "name": "John Freelancer",
    "email": "john@example.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "bothSigned": false,
  "contract": { ... }
}
```

## Success Criteria

✅ Client can sign without providing info
✅ Non-client wallet is detected as freelancer
✅ Freelancer info fields appear automatically
✅ Freelancer can't sign without providing name/email
✅ After freelancer signs, info is saved to backend
✅ After both sign, contract stage updates to "Awaiting Deposit"
✅ Role-based views appear after both signatures
