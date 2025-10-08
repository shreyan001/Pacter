# EIP-712 Signature Fix

## Problem
The signatures were not working because we were using the wrong wagmi hook and API.

## Root Cause
- Using `useSignTypedData` hook which has a different API in wagmi v2
- Not properly accessing the wallet client
- Missing proper type definitions for viem

## Solution

### Changed From:
```typescript
import { useAccount, useSignTypedData } from 'wagmi'

const { signTypedDataAsync } = useSignTypedData()

const signature = await signTypedDataAsync({
  account: address,
  domain,
  types,
  primaryType: 'Contract',
  message: value
})
```

### Changed To:
```typescript
import { useAccount, useWalletClient } from 'wagmi'
import { type WalletClient } from 'viem'

const { data: walletClient } = useWalletClient()

const signature = await walletClient.signTypedData({
  account: address,
  domain,
  types,
  primaryType: 'Contract',
  message
})
```

## Key Changes

1. **Use `useWalletClient` instead of `useSignTypedData`**
   - `useWalletClient` gives direct access to the wallet client
   - More reliable and follows wagmi v2 best practices

2. **Use `walletClient.signTypedData()` method**
   - Direct method call on wallet client
   - Properly typed with viem types
   - Works with Web3Modal integration

3. **Added proper type imports**
   - Import `WalletClient` type from viem
   - Ensures TypeScript compatibility

4. **Dynamic chain ID**
   - Uses current connected chain ID
   - Falls back to 0G testnet (16602) if not available

5. **Better error handling**
   - Check if wallet client exists before signing
   - Alert user if wallet not connected
   - Console logs for debugging

## How It Works Now

1. **User clicks "Sign as Client" or "Sign as Freelancer"**
2. **Component checks:**
   - Is wallet connected? (`isConnected`)
   - Is address available? (`address`)
   - Is wallet client ready? (`walletClient`)
3. **Prepares EIP-712 typed data:**
   - Domain (name, version, chainId, verifyingContract)
   - Types (Contract structure)
   - Message (contractId, hash, signer, role, timestamp)
4. **Calls `walletClient.signTypedData()`**
   - Wallet prompts user to sign
   - Returns signature string
5. **Submits to backend:**
   - POST to `/api/contracts/[contractId]/sign`
   - Includes signature, role, wallet address, and freelancer info (if applicable)
6. **Backend updates contract:**
   - Saves signature
   - Updates party information
   - Changes stage if both signed

## Testing

### Test Signature Flow:

1. **Connect Wallet**
   ```
   - Open contract page
   - Click "Connect Wallet" in navbar
   - Select wallet (MetaMask, WalletConnect, etc.)
   - Approve connection
   ```

2. **Sign as Client**
   ```
   - Connect with client wallet
   - Should see "Sign as Client" button
   - Click button
   - Wallet prompts for signature
   - Approve signature
   - Success! Client signature recorded
   ```

3. **Sign as Freelancer**
   ```
   - Disconnect client wallet
   - Connect with different wallet
   - Should see name/email fields
   - Fill in information
   - Click "Sign as Freelancer"
   - Wallet prompts for signature
   - Approve signature
   - Success! Freelancer signature recorded
   ```

### Expected Console Logs:

```javascript
// When signing starts:
Starting signature process... { address: "0x...", chain: 16602 }

// Signing data:
Signing typed data... {
  domain: { name: "Pacter", version: "1", chainId: 16602, ... },
  types: { Contract: [...] },
  message: { contractId: "...", ... }
}

// After signature:
Signature obtained: 0x1234567890abcdef...

// Backend response:
Signature saved successfully: { contractId: "...", role: "client", bothSigned: false }
```

## Troubleshooting

### Issue: "Please connect your wallet first"
**Solution:** Make sure wallet is connected via Web3Modal

### Issue: Wallet doesn't prompt for signature
**Possible causes:**
1. Wallet client not ready - wait a moment after connecting
2. Wrong network - switch to 0G Galileo Testnet
3. Browser extension issue - try refreshing page

**Solution:** 
- Check console for errors
- Ensure wallet is on correct network
- Try disconnecting and reconnecting wallet

### Issue: Signature fails with error
**Check:**
1. Console logs for specific error
2. Network connection
3. Wallet has enough gas (though EIP-712 is gasless)
4. Contract data is valid

## Benefits of This Approach

✅ **More Reliable** - Direct wallet client access
✅ **Better Typed** - Full TypeScript support with viem
✅ **Wagmi v2 Compatible** - Uses current best practices
✅ **Web3Modal Compatible** - Works with existing setup
✅ **Gasless** - EIP-712 signatures don't require gas
✅ **Debuggable** - Console logs show each step

## Technical Details

### EIP-712 Structure:

```typescript
{
  domain: {
    name: 'Pacter',
    version: '1',
    chainId: 16602,
    verifyingContract: '0x...'
  },
  types: {
    Contract: [
      { name: 'contractId', type: 'string' },
      { name: 'contractHash', type: 'bytes32' },
      { name: 'signer', type: 'address' },
      { name: 'role', type: 'string' },
      { name: 'timestamp', type: 'uint256' }
    ]
  },
  message: {
    contractId: 'contract_123',
    contractHash: '0xabc...',
    signer: '0x123...',
    role: 'CLIENT',
    timestamp: 1234567890n
  }
}
```

### Signature Format:
- Returns hex string: `0x1234567890abcdef...`
- 132 characters (0x + 130 hex chars)
- Can be verified on-chain or off-chain

## Next Steps

After both parties sign:
1. Contract stage changes to "Awaiting Deposit"
2. Client view unlocks (deposit functionality)
3. Freelancer view unlocks (work submission)
4. Contract execution begins
