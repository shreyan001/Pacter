// Simple direct test of verification API
async function testVerification() {
  console.log('=== Testing Verification API ===\n')
  
  const testPayload = {
    contractId: 'test-123',
    githubUrl: 'https://github.com/shreyan001/Pacter',
    deploymentUrl: 'https://pacter.vercel.app',
    comments: 'Test verification',
    freelancerAddress: '0x2222222222222222222222222222222222222222'
  }
  
  console.log('Payload:', JSON.stringify(testPayload, null, 2))
  console.log('\nCalling API...\n')
  
  try {
    const response = await fetch('http://localhost:3000/api/contracts/verify-deliverable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    })
    
    console.log('Status:', response.status)
    console.log('Status Text:', response.statusText)
    console.log()
    
    const data = await response.json()
    console.log('Response:')
    console.log(JSON.stringify(data, null, 2))
    
    if (response.ok) {
      console.log('\n✅ API call successful!')
      
      // Check verification steps
      if (data.verification) {
        console.log('\nVerification Details:')
        if (data.verification.github) {
          console.log('  GitHub:', data.verification.github.verified ? '✅' : '❌')
          console.log('    Repo:', data.verification.github.owner + '/' + data.verification.github.repo)
          console.log('    Commit:', data.verification.github.commitShort)
        }
        if (data.verification.storage) {
          console.log('  Storage:', data.verification.storage.success ? '✅' : '❌')
          console.log('    Hash:', data.verification.storage.storageHash?.substring(0, 20) + '...')
        }
        if (data.verification.onChain) {
          console.log('  On-Chain:', data.verification.onChain.success ? '✅' : '❌')
          console.log('    TX:', data.verification.onChain.transactionHash?.substring(0, 20) + '...')
        }
      }
    } else {
      console.log('\n❌ API call failed')
      console.log('Error:', data.error)
      if (data.details) {
        console.log('Details:', data.details)
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.error(error)
  }
}

testVerification()
