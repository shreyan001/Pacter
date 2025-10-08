# Testing Guide - Inline Contract Creation

## Quick Test Steps

### 1. Start the Application
```bash
npm run dev
```

### 2. Navigate to Create Page
- Go to `http://localhost:3000/create`
- Connect your wallet

### 3. Test Information Collection
1. Click "I am a Client" button
2. Provide the following information when asked:
   - Project Name: "Test Website"
   - Project Description: "A simple e-commerce website with payment integration"
   - Client Name: "John Doe"
   - Email: "john@example.com"
   - Payment Amount: "50000"
   - (Wallet address is auto-captured)

### 4. Watch for Inline Contract Generation
After providing all 6 pieces of information, you should see:

✅ **Loading Message Appears**
- Spinning loader
- Progress bar
- Status indicators:
  - ⟳ Generating legal contract... → ✓
  - ⟳ Processing with 0G Compute Network... → ✓
  - ⟳ Uploading to secure storage... → ✓

✅ **Success Message Appears**
- Green success banner
- Verification proof section
- Contract preview (first 500 characters)
- Two buttons:
  - "View Full Contract →"
  - "Edit Details"

### 5. Test Actions

**Test "View Full Contract":**
- Click the button
- Should navigate to `/contract/[contractId]`
- Should show full contract page

**Test "Edit Details":**
- Click the button
- Should allow you to continue the conversation
- Chat input should remain active

### 6. Test Error Handling

To test error handling, you can:
1. Disconnect your internet
2. Complete information collection
3. Watch for error message
4. Click "Retry" button
5. Verify it attempts generation again

## What to Verify

### ✅ No Redirects
- [ ] No redirect to `/contract/create` page
- [ ] Everything happens in the chat interface
- [ ] Chat history is preserved

### ✅ Progress Indicators
- [ ] Progress bar animates from 0% to 100%
- [ ] Status messages update correctly
- [ ] Checkmarks appear as stages complete

### ✅ Contract Preview
- [ ] Success banner displays
- [ ] Verification proof shows (if available)
- [ ] Contract text preview displays
- [ ] Action buttons are clickable

### ✅ Error Handling
- [ ] Error messages are user-friendly
- [ ] Retry button appears on error
- [ ] Retry button works correctly

### ✅ Chat Behavior
- [ ] Messages scroll into view automatically
- [ ] Chat history is preserved
- [ ] Input remains functional after generation

## Expected Console Logs

You should see these logs in the browser console:

```
Data collection complete! Starting inline contract generation...
Starting contract creation...
Using enhanced legal contract template (0G SDK skipped for compatibility)
Contract uploaded to backend: { success: true, ... }
```

## Common Issues

### Issue: Contract generation doesn't start
**Solution:** Check that all 6 fields are collected:
- Project Name
- Project Description
- Client Name
- Email
- Wallet Address
- Payment Amount

### Issue: Error message appears
**Solution:** Check:
- Backend API is running
- Network connection is stable
- Console for detailed error messages

### Issue: "View Full Contract" doesn't work
**Solution:** Check:
- Contract ID was generated
- `/contract/[contractId]` route exists
- Router is working correctly

## Success Criteria

✅ All information collected through chat  
✅ Contract generation starts automatically  
✅ Progress indicators show correctly  
✅ Contract preview displays inline  
✅ "View Full Contract" navigates correctly  
✅ No redirect to `/contract/create`  
✅ Chat history preserved  
✅ No console errors  

## Next Steps After Testing

If all tests pass:
1. ✅ Feature is complete and working
2. ✅ Ready for production use
3. ✅ Can proceed with additional features

If tests fail:
1. Check console for errors
2. Review `CONTRACT_CREATION_CONSOLIDATED.md` for implementation details
3. Check `.kiro/specs/consolidate-contract-creation/` for requirements

---

**Happy Testing! 🚀**
