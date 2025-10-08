// Test finalize API backend update
const contractId = 'contract_1759920742668' // Your test contract

async function testFinalizeUpdate() {
  console.log('🧪 Testing Finalize API Backend Update\n')
  
  // 1. Get contract before update
  console.log('1️⃣ Fetching contract before update...')
  const beforeResponse = await fetch(`http://localhost:3000/api/contracts?id=${contractId}`)
  const beforeData = await beforeResponse.json()
  
  console.log('Before update:')
  console.log('- currentStage:', beforeData.currentStage)
  console.log('- milestone[0].deliverable.submitted:', beforeData.milestones?.[0]?.deliverable?.submitted)
  console.log('- milestone[0].verification.agentVerified:', beforeData.milestones?.[0]?.verification?.agentVerified)
  console.log('')
  
  // 2. Call finalize API (simulated data)
  console.log('2️⃣ Calling finalize API...')
  const finalizeResponse = await fetch('http://localhost:3000/api/verify/finalize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contractId: contractId,
      githubUrl: 'https://github.com/test/repo',
      deploymentUrl: 'https://test.vercel.app',
      comments: 'Test submission',
      githubVerification: {
        owner: 'test',
        repo: 'repo',
        commitSha: 'abc123',
        commitShort: 'abc123',
        githubUrl: 'https://github.com/test/repo',
        deploymentVerified: true
      },
      storageResult: {
        storageHash: '0xtest123',
        storageTxHash: '0xtx123'
      },
      agentApproval: {
        transactionHash: '0xagent123',
        blockNumber: 12345,
        alreadyVerified: false
      }
    })
  })
  
  const finalizeResult = await finalizeResponse.json()
  console.log('Finalize result:', finalizeResult)
  console.log('')
  
  // 3. Get contract after update
  console.log('3️⃣ Fetching contract after update...')
  const afterResponse = await fetch(`http://localhost:3000/api/contracts?id=${contractId}`)
  const afterData = await afterResponse.json()
  
  console.log('After update:')
  console.log('- currentStage:', afterData.currentStage)
  console.log('- milestone[0].status:', afterData.milestones?.[0]?.status)
  console.log('- milestone[0].deliverable.submitted:', afterData.milestones?.[0]?.deliverable?.submitted)
  console.log('- milestone[0].deliverable.githubUrl:', afterData.milestones?.[0]?.deliverable?.githubUrl)
  console.log('- milestone[0].deliverable.storage:', afterData.milestones?.[0]?.deliverable?.storage)
  console.log('- milestone[0].verification.agentVerified:', afterData.milestones?.[0]?.verification?.agentVerified)
  console.log('- milestone[0].verification.githubVerification:', afterData.milestones?.[0]?.verification?.githubVerification)
  console.log('- milestone[0].review:', afterData.milestones?.[0]?.review)
  console.log('- stageHistory length:', afterData.stageHistory?.length)
  console.log('')
  
  // 4. Verify changes
  console.log('4️⃣ Verification:')
  const checks = [
    { name: 'Stage updated to Review', pass: afterData.currentStage === 'Review' },
    { name: 'Milestone status UNDER_REVIEW', pass: afterData.milestones?.[0]?.status === 'UNDER_REVIEW' },
    { name: 'Deliverable submitted', pass: afterData.milestones?.[0]?.deliverable?.submitted === true },
    { name: 'GitHub URL saved', pass: afterData.milestones?.[0]?.deliverable?.githubUrl === 'https://github.com/test/repo' },
    { name: 'Storage hash saved', pass: afterData.milestones?.[0]?.deliverable?.storage?.storageHash === '0xtest123' },
    { name: 'Agent verified', pass: afterData.milestones?.[0]?.verification?.agentVerified === true },
    { name: 'Review initialized', pass: afterData.milestones?.[0]?.review?.clientReviewed === false },
    { name: 'Stage history updated', pass: afterData.stageHistory?.length > beforeData.stageHistory?.length }
  ]
  
  checks.forEach(check => {
    console.log(`${check.pass ? '✅' : '❌'} ${check.name}`)
  })
  
  const allPassed = checks.every(c => c.pass)
  console.log('')
  console.log(allPassed ? '🎉 All checks passed!' : '⚠️ Some checks failed')
}

testFinalizeUpdate().catch(console.error)
