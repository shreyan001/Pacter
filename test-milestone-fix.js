// Test milestone fix for empty milestones array
const contractId = 'contract_1759920742668'

async function testMilestoneFix() {
  console.log('🔧 TESTING MILESTONE FIX')
  console.log('='.repeat(80))
  console.log('')
  
  // Simulate finalize API call with test data
  console.log('📤 Calling finalize API with test data...')
  
  const response = await fetch('http://localhost:3000/api/verify/finalize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contractId: contractId,
      githubUrl: 'https://github.com/shreyan001/Pacter/',
      deploymentUrl: null,
      comments: 'Test fix for empty milestones',
      githubVerification: {
        owner: 'shreyan001',
        repo: 'Pacter',
        commitSha: 'abc123def456',
        commitShort: 'abc123',
        githubUrl: 'https://github.com/shreyan001/Pacter/',
        deploymentVerified: false
      },
      storageResult: {
        storageHash: '0xtest_storage_hash_123',
        storageTxHash: '0xtest_storage_tx_456'
      },
      agentApproval: {
        transactionHash: 'Already verified',
        blockNumber: null,
        alreadyVerified: true
      }
    })
  })
  
  const result = await response.json()
  console.log('Response:', result)
  console.log('')
  
  if (!response.ok) {
    console.error('❌ Finalize failed:', result.error)
    return
  }
  
  console.log('✅ Finalize API succeeded')
  console.log('')
  
  // Wait a moment for backend to update
  console.log('⏳ Waiting 2 seconds for backend to sync...')
  await new Promise(resolve => setTimeout(resolve, 2000))
  console.log('')
  
  // Fetch updated contract
  console.log('📥 Fetching updated contract...')
  const contractResponse = await fetch(`http://localhost:3000/api/contracts?id=${contractId}`)
  const contract = await contractResponse.json()
  
  console.log('📊 UPDATED CONTRACT STATE:')
  console.log('-'.repeat(80))
  console.log('Current Stage:', contract.currentStage)
  console.log('Milestones Count:', contract.milestones?.length || 0)
  console.log('')
  
  if (contract.milestones && contract.milestones.length > 0) {
    const milestone = contract.milestones[0]
    console.log('✅ MILESTONE [0] EXISTS!')
    console.log('')
    console.log('  Status:', milestone.status)
    console.log('  Deliverable Submitted:', milestone.deliverable?.submitted)
    console.log('  GitHub URL:', milestone.deliverable?.githubUrl)
    console.log('  Storage Hash:', milestone.deliverable?.storage?.storageHash)
    console.log('  Agent Verified:', milestone.verification?.agentVerified)
    console.log('  Verification Note:', milestone.verification?.verificationNote)
    console.log('  Client Reviewed:', milestone.review?.clientReviewed)
    console.log('  Payment Approved:', milestone.payment?.approved)
    console.log('')
    
    // Verify all required fields
    const checks = [
      { name: 'Milestone exists', pass: true },
      { name: 'Status is UNDER_REVIEW', pass: milestone.status === 'UNDER_REVIEW' },
      { name: 'Deliverable submitted', pass: milestone.deliverable?.submitted === true },
      { name: 'GitHub URL saved', pass: !!milestone.deliverable?.githubUrl },
      { name: 'Storage hash saved', pass: !!milestone.deliverable?.storage?.storageHash },
      { name: 'Agent verified', pass: milestone.verification?.agentVerified === true },
      { name: 'Review initialized', pass: milestone.review?.clientReviewed === false },
      { name: 'Payment initialized', pass: milestone.payment?.approved === false }
    ]
    
    console.log('🔍 VERIFICATION CHECKS:')
    checks.forEach(check => {
      console.log(`  ${check.pass ? '✅' : '❌'} ${check.name}`)
    })
    
    const allPassed = checks.every(c => c.pass)
    console.log('')
    console.log(allPassed ? '🎉 ALL CHECKS PASSED!' : '⚠️ SOME CHECKS FAILED')
    
  } else {
    console.log('❌ MILESTONE STILL MISSING!')
    console.log('The fix did not work. Milestones array is still empty.')
  }
  
  console.log('')
  console.log('='.repeat(80))
}

testMilestoneFix().catch(console.error)
