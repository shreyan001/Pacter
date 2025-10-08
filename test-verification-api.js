// Test the full verification API endpoint
const fetch = require('node-fetch')

async function testVerificationAPI() {
  console.log('=== Testing Verification API Endpoint ===\n')
  
  // Test data
  const testData = {
    contractId: 'test-contract-123',
    githubUrl: 'https://github.com/shreyan001/Pacter',
    deploymentUrl: 'https://pacter.vercel.app',
    comments: 'Test submission for verification flow',
    freelancerAddress: '0x1234567890123456789012345678901234567890'
  }
  
  console.log('Test payload:')
  console.log(JSON.stringify(testData, null, 2))
  console.log('\n')
  
  try {
    // Call the verification API
    const apiUrl = 'http://localhost:3000/api/contracts/verify-deliverable'
    console.log(`Calling: ${apiUrl}\n`)
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    })
    
    console.log(`Response status: ${response.status}`)
    console.log(`Response headers:`, Object.fromEntries(response.headers.entries()))
    console.log('\n')
    
    const result = await response.json()
    
    if (!response.ok) {
      console.error('❌ API Error:')
      console.error(JSON.stringify(result, null, 2))
      return { success: false, error: result }
    }
    
    console.log('✅ API Response:')
    console.log(JSON.stringify(result, null, 2))
    
    // Validate response structure
    console.log('\n\n=== Validation ===')
    
    if (result.success) {
      console.log('✅ Success flag: true')
    } else {
      console.log('❌ Success flag: false')
    }
    
    if (result.verification) {
      console.log('✅ Verification object present')
      
      if (result.verification.github) {
        console.log('  ✅ GitHub verification data:')
        console.log(`     - Verified: ${result.verification.github.verified}`)
        console.log(`     - Owner: ${result.verification.github.owner}`)
        console.log(`     - Repo: ${result.verification.github.repo}`)
        console.log(`     - Commit: ${result.verification.github.commitShort}`)
      }
      
      if (result.verification.storage) {
        console.log('  ✅ Storage verification data:')
        console.log(`     - Success: ${result.verification.storage.success}`)
        console.log(`     - Storage Hash: ${result.verification.storage.storageHash?.substring(0, 20)}...`)
      }
      
      if (result.verification.onChain) {
        console.log('  ✅ On-chain verification data:')
        console.log(`     - Success: ${result.verification.onChain.success}`)
        console.log(`     - TX Hash: ${result.verification.onChain.transactionHash?.substring(0, 20)}...`)
      }
    }
    
    console.log('\n=== Test Complete ===')
    return { success: true, result }
    
  } catch (error) {
    console.error('\n❌ Test Error:', error.message)
    console.error('Full error:', error)
    return { success: false, error: error.message }
  }
}

// Run the test
testVerificationAPI().then(result => {
  if (result.success) {
    console.log('\n✅ All tests passed!')
    process.exit(0)
  } else {
    console.log('\n❌ Tests failed!')
    process.exit(1)
  }
})
