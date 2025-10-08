// Test step-by-step verification endpoints
async function testStepByStep() {
  console.log('=== Testing Step-by-Step Verification ===\n')
  
  const baseUrl = 'http://localhost:3000'
  
  try {
    // STEP 1: GitHub Verification
    console.log('Step 1: Testing GitHub verification...')
    const githubResponse = await fetch(`${baseUrl}/api/verify/github`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        githubUrl: 'https://github.com/shreyan001/Pacter',
        deploymentUrl: 'https://pacter.vercel.app'
      })
    })
    
    const githubResult = await githubResponse.json()
    console.log(`Status: ${githubResponse.status}`)
    
    if (githubResponse.ok) {
      console.log('✅ GitHub verification passed')
      console.log(`   Repository: ${githubResult.owner}/${githubResult.repo}`)
      console.log(`   Commit: ${githubResult.commitShort}`)
      console.log(`   Deployment: ${githubResult.deploymentVerified ? '✅' : '❌'}`)
    } else {
      console.log('❌ GitHub verification failed:', githubResult.error)
      return false
    }
    
    // STEP 2: Storage Upload
    console.log('\nStep 2: Testing storage upload...')
    const storageResponse = await fetch(`${baseUrl}/api/verify/storage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        githubUrl: 'https://github.com/shreyan001/Pacter',
        repoInfo: githubResult
      })
    })
    
    const storageResult = await storageResponse.json()
    console.log(`Status: ${storageResponse.status}`)
    
    if (storageResponse.ok) {
      console.log('✅ Storage upload passed')
      console.log(`   Storage Hash: ${storageResult.storageHash?.substring(0, 20)}...`)
      console.log(`   Storage TX: ${storageResult.storageTxHash?.substring(0, 20)}...`)
    } else {
      console.log('❌ Storage upload failed:', storageResult.error)
      return false
    }
    
    // STEP 3: Agent Signing (will fail without real order)
    console.log('\nStep 3: Testing agent signing...')
    console.log('⚠️  Note: This will fail without a real order hash')
    
    const testOrderHash = '0x' + '1'.repeat(64)
    const verificationDetails = JSON.stringify({
      verifiedBy: 'Pacter-AI-Agent',
      verifiedAt: new Date().toISOString(),
      method: 'GitHub + 0G Storage',
      githubRepo: 'https://github.com/shreyan001/Pacter',
      storageHash: storageResult.storageHash,
      storageTxHash: storageResult.storageTxHash
    })
    
    const agentResponse = await fetch(`${baseUrl}/api/verify/agent-sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderHash: testOrderHash,
        verificationDetails: verificationDetails
      })
    })
    
    const agentResult = await agentResponse.json()
    console.log(`Status: ${agentResponse.status}`)
    
    if (agentResponse.ok) {
      console.log('✅ Agent signing passed')
      console.log(`   TX Hash: ${agentResult.transactionHash?.substring(0, 20)}...`)
      console.log(`   Block: ${agentResult.blockNumber}`)
    } else {
      console.log('⚠️  Agent signing failed (expected):', agentResult.error)
      console.log('   This is normal without a real order on-chain')
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('SUMMARY')
    console.log('='.repeat(60))
    console.log('✅ Step 1: GitHub verification - WORKING')
    console.log('✅ Step 2: Storage upload - WORKING')
    console.log('⚠️  Step 3: Agent signing - Needs real order')
    console.log('⏳ Step 4: Finalize - Needs contract ID')
    console.log('='.repeat(60))
    console.log('\n✅ API endpoints are working!')
    console.log('Ready to test with real contract in UI')
    
    return true
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    return false
  }
}

// Run the test
testStepByStep().then(success => {
  process.exit(success ? 0 : 1)
})
