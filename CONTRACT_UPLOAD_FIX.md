# Contract Upload Fix

## Problem
Contracts were being generated but not properly uploaded to the backend database. The contract page showed "Contract not found" because:
1. The POST API endpoint expected the OLD contract structure (DeployedContract)
2. The new contracts from `/create` page use a DIFFERENT structure (from backendformat.md)
3. Contracts were not being saved to the `database` key in Redis

## Solution

### 1. Updated POST API Endpoint (`src/app/api/contracts/route.ts`)
- Added detection for new vs old contract format
- New format contracts (with `parties`, `escrow`, `projectDetails`) are saved directly to the `database` key
- Old format contracts still work with the existing RedisService
- Supports both formats for backward compatibility

### 2. Updated PUT API Endpoint
- Now properly updates contracts in the `database` key
- Merges updates with existing contract data
- Updates `lastUpdated` timestamp

### 3. Updated Contract Service (`src/services/contractService.ts`)
- Changed `currentStage` from "Contract Generated" to "Signatures Pending"
- Added proper stage history entry for "Signatures Pending"
- Made `uploadToBackend` throw errors instead of swallowing them
- Added better error logging

### 4. Updated CreateChat (`src/components/create/CreateChat.tsx`)
- Added verification step after upload to ensure contract is in database
- Only shows contract link AFTER successful backend verification
- Better error handling and user feedback

## Flow

1. **User completes information collection** → AI collects all data
2. **Contract generation triggered** → `createContract()` called
3. **Generate contract text** → Simple contract template created
4. **Prepare backend data** → Format according to backendformat.md
5. **Upload to backend** → POST to `/api/contracts`
6. **Verify upload** → GET from `/api/contracts?id={contractId}`
7. **Show success** → Display contract link with "Run Inference" button
8. **Optional: Run inference** → Add cryptocurrency/escrow clauses
9. **Update backend** → PUT to `/api/contracts` with enhanced contract

## Testing

Run the test script to verify the flow:
```bash
node test-contract-upload.js
```

This will:
1. Create a test contract
2. Upload it via the API
3. Verify it's in the database
4. Fetch it via GET API
5. Provide a link to view it

## Key Changes

- ✅ Contracts are now properly saved to Redis `database` key
- ✅ Contract structure matches backendformat.md
- ✅ Upload is verified before showing link
- ✅ Proper error handling throughout
- ✅ Stage is set to "Signatures Pending" for execution flow
- ✅ Both old and new contract formats supported

## Result

Contracts created through `/create` page are now:
1. Properly uploaded to backend
2. Accessible via `/contract/[contractId]` page
3. Ready for signature collection
4. Visible in the database with correct structure
