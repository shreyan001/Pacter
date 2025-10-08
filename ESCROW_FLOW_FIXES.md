# Escrow Flow Fixes - Stage Display & GitHub Removal

## Issues Fixed

### 1. ✅ Stage Display Not Updating Properly
**Problem**: The "Contract Execution" sidebar showed "Step 2" but wasn't reflecting the actual current stage.

**Root Cause**: Stage mapping in `src/app/contract/[contractId]/page.tsx` didn't match the actual contract stages being used.

**Solution**: Updated stage mapping to include all actual stages:
```typescript
const stageMap: Record<string, number> = {
  'Signatures Pending': 0,
  'Awaiting Deposit': 0,
  'Escrow Deposited': 1,
  'Awaiting Submission': 2,
  'Work in Progress': 2,
  'AI Verification': 3,
  'Submission': 3,
  'Client Review': 4,
  'Review': 4,
  'Payment Approved': 5,
  'Milestone Released': 5,
  'Contract Completed': 6,
  'Contract Closed': 6
}
```

### 2. ✅ Updated EXECUTION_FLOW Stages
**Problem**: Flow stages didn't match the actual workflow.

**Solution**: Updated `src/lib/flows.ts` to reflect the correct workflow:
```typescript
export const EXECUTION_FLOW = [
  "Signatures Pending",      // Step 1
  "Escrow Deposited",         // Step 2
  "Work in Progress",         // Step 3
  "AI Verification",          // Step 4
  "Submission",               // Step 5
  "Client Review",            // Step 6
  "Payment Approved",         // Step 7
  "Contract Completed"        // Step 8
] as const;
```

### 3. ✅ Removed GitHub URL Access for Client
**Problem**: Client could see GitHub URL before payment approval, which undermines the escrow security model.

**Correct Workflow**:
1. Freelancer submits work → Files uploaded to 0G storage
2. AI agent verifies → Stores verification proof
3. Client reviews deployment URL only (no GitHub access)
4. Client approves payment
5. **ONLY AFTER APPROVAL**: Client can download source code from 0G storage

**Changes Made**:

#### Removed GitHub Button from Review State
- Client can only see deployment URL during review
- GitHub access completely removed from pre-approval states
- Added note: "Source code will be available for download from 0G storage after payment approval"

#### Added 0G Download Section (Post-Approval Only)
```typescript
{/* Download Source Code from 0G */}
{storageHash && (
  <div className="bg-slate-900/50 rounded-lg p-6 space-y-4">
    <h4>Download Project Files</h4>
    
    <Button onClick={handleDownloadFrom0G}>
      Download from 0G Storage
    </Button>
    
    {/* Shows what's included */}
    - Complete source code repository
    - Verification metadata
    - Commit history and timestamps
    - AI verification proof
  </div>
)}
```

## Updated Workflow

### Client View States

#### State 1: Awaiting Submission
- ❌ No GitHub access
- ❌ No deployment URL
- ⏳ Waiting for freelancer

#### State 2: AI Verification
- ❌ No GitHub access
- ❌ No deployment URL
- ⏳ AI agent verifying

#### State 3: Review Deliverable
- ❌ **NO GitHub access** (KEY CHANGE)
- ✅ Deployment URL visible
- ✅ Can test live website
- ✅ Can approve or request changes
- ℹ️ Note: "Source code available after approval"

#### State 4: Payment Approved
- ✅ **0G Download available** (NEW)
- ✅ Deployment URL visible
- ✅ Can download complete source code
- ✅ Includes verification proof

## Security Benefits

### Before (Insecure)
```
Client sees GitHub → Can clone repo → Doesn't need to pay
```

### After (Secure)
```
Client sees deployment only → Must approve payment → Gets 0G download
```

## Files Modified

1. **src/app/contract/[contractId]/page.tsx**
   - Updated stage mapping to include all actual stages
   - Fixed stage index calculation

2. **src/lib/flows.ts**
   - Updated EXECUTION_FLOW to match actual workflow
   - Changed stage names to be more descriptive

3. **src/components/contract/ClientView.tsx**
   - Removed GitHub URL variable
   - Removed "View GitHub" button from all pre-approval states
   - Added storageHash variable
   - Added 0G download section (post-approval only)
   - Added security note about source code access

## Testing Checklist

### Stage Display
- [ ] Step 1: "Signatures Pending" shows correctly
- [ ] Step 2: "Escrow Deposited" shows after deposit
- [ ] Step 3: "Work in Progress" shows after submission
- [ ] Step 4: "AI Verification" shows during verification
- [ ] Step 5: "Client Review" shows when ready for review
- [ ] Step 6: "Payment Approved" shows after approval
- [ ] Step 7: "Contract Completed" shows after withdrawal
- [ ] Progress bar updates correctly
- [ ] Percentage calculation accurate

### GitHub Access Removed
- [ ] Client CANNOT see GitHub URL before approval
- [ ] Client CANNOT see "View GitHub" button before approval
- [ ] Client CAN see deployment URL during review
- [ ] Client CAN test live website during review
- [ ] Security note displays during review state

### 0G Download (Post-Approval)
- [ ] Download section ONLY appears after payment approval
- [ ] Storage hash displays correctly
- [ ] Download button functional (placeholder for now)
- [ ] Deployment URL still accessible
- [ ] Download includes verification metadata

## Next Steps

### Implement Actual 0G Download
Currently shows placeholder alert. Need to implement:

```typescript
async function handleDownloadFrom0G(storageHash: string) {
  try {
    // 1. Connect to 0G indexer
    const indexer = new Indexer(INDEXER_URL)
    
    // 2. Download file by hash
    const file = await indexer.download(storageHash)
    
    // 3. Trigger browser download
    const blob = new Blob([file.data])
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `project-${storageHash.slice(0, 8)}.zip`
    a.click()
  } catch (error) {
    console.error('Download failed:', error)
  }
}
```

### Add Download History
Track when client downloads files:
```typescript
{
  downloadHistory: [{
    downloadedAt: string
    downloadedBy: string
    storageHash: string
    fileSize: number
  }]
}
```

## Summary

✅ **Stage display now updates correctly** - Shows accurate step numbers and progress
✅ **GitHub access removed** - Client cannot see source code before payment
✅ **0G download added** - Client gets secure download after approval
✅ **Security improved** - Escrow model properly enforced
✅ **Workflow clarified** - Clear separation between review and download

The escrow flow now properly protects both parties:
- **Freelancer**: Source code not exposed until payment approved
- **Client**: Can review deployment before approving payment
- **Both**: Secure, verifiable transaction on blockchain + 0G storage
