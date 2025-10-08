// Full end-to-end verification flow test
const fetch = require('node-fetch')

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
const FRONTEND_URL = 'http://localhost:3000'

// Test wallet addresses
const CLIENT_ADDRESS = '0x1111111111111111111111111111111111111111'
const FREELANCER_ADDRESS = '0x2222222222222222222222222222222222222222'

async function createTestContract() {
  console.log('Step 1: Creating test contract in backend...\n')
  
  const contractData = {
    id: `test-contract-${Date.now()}`,
    title: 'Test Smart Contract Development',
    parties: {
      client: {
        name: 'Test Client',
        walletAddress: CLIENT_ADDRESS
      },
      freelancer: {
        name: 'Test Freelancer',
        walletAddress: FREELANCER_ADDRESS
      }
    },
    milestones: [
      {
        title: 'Complete smart contract development',
        description: 'Develop and deploy the smart contract',
        amount: 100000,
        currency: 'INR',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        deliverable: {
          submitted: false
        },
        verification: {},
        payment: {
          approved: false,
          released: false
        }
      }
    ],
    currentStage: 'Escrow Deposited',
    escrow: {
      deposited: true,
      depositedAt: new Date().toISOString(),
      orderHash: '0x' + '1'.repeat(64),
      deposit: {
        transactionHash: '0x' + '2'.repeat(64),
        blockNumber: 12345,
        orderHash: '0x' + '1'.repeat(64)
      }
    },
    signatures: {
      client: {
        signed: true,
        signedAt: new Date().toISOString()
      },
      freelancer: {
        signed: true,
        signedAt: new Date().toISOString()
      }
    },
    stageHistory: [
      {
        stage: 'Created',
        timestamp: new Date().toISOString(),
        triggeredBy: 'system'
      },
      {
        stage: 'Escrow Deposited',
        timestamp: new Date().toISOString(),
        triggeredBy: 'client'
      }
    ]
  }
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/contracts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contractData)
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to create contract: ${error}`)
    }
    
    const result = await response.json()
    console.log(`✅ Contract created: ${contractData.id}\n`)
    return contractData.id
    
  } catch (error) {
    console.error('❌ Failed to create contract:', error.message)
    throw error
  }
}

async function testGitHubVerification(contractId) {
  console.log('Step 2: Testing GitHub verification...\n')
  
  const verificationData = {
    contractId: contractId,
    githubUrl: 'https://github.com/shreyan001/Pacter',
    deploymentUrl: 'https://pacter.vercel.app',
    comments: 'Completed the smart contract development and deployment',
    freelancerAddress: FREELANCER_ADDRESS
  }
  
  console.log('Verification payload:')
  console.log(JSON.stringify(verificationData, null, 2))
  console.log('\n')
  
  try {
    const response = await fetch(`${FRONTEND_URL}/api/contracts/verify-deliverable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(verificationData)
    })
    
    console.log(`Response status: ${response.status}\n`)
    
    const result = await response.json()
    
    if (!response.ok) {
      console.error('❌ Verification failed:')
      console.error(JSON.stringify(result, null, 2))
      return { success: false, error: result }
    }
    
    console.log('✅ Verification successful!')
    console.log(JSON.stringify(result, null, 2))
    console.log('\n')
    
    return { success: true, result }
    
  } catch (error) {
    console.error('❌ Verification error:', error.message)
    return { success: false, error: error.message }
  }
}

async function verifyContractUpdated(contractId) {
  console.log('Step 3: Verifying contract was updated in backend...\n')
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/contracts?id=${contractId}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch contract')
    }
    
    const contract = await response.json()
    
    console.log('Contract current stage:', contract.currentStage)
    console.log('Milestone deliverable submitted:', contract.milestones[0]?.deliverable?.submitted)
    console.log('Milestone GitHub verified:', contract.milestones[0]?.verification?.githubVerified)
    console.log('Milestone agent verified:', contract.milestones[0]?.verification?.agentVerified)
    console.log('\n')
    
    // Validate
    const checks = {
      stageIsReview: contract.currentStage === 'Review',
      deliverableSubmitted: contract.milestones[0]?.deliverable?.submitted === true,
      githubVerified: contract.milestones[0]?.verification?.githubVerified === true,
      agentVerified: contract.milestones[0]?.verification?.agentVerified === true,
      hasStorageHash: !!contract.milestones[0]?.verification?.storageHash,
      hasVerificationTx: !!contract.milestones[0]?.verification?.verificationTransactionHash
    }
    
    console.log('Validation checks:')
    Object.entries(checks).forEach(([key, value]) => {
      console.log(`  ${value ? '✅' : '❌'} ${key}`)
    })
    
    const allPassed = Object.values(checks).every(v => v)
    
    if (allPassed) {
      console.log('\n✅ All validation checks passed!')
    } else {
      console.log('\n⚠️ Some validation checks failed')
    }
    
    return { success: allPassed, contract, checks }
    
  } catch (error) {
    console.error('❌ Failed to verify contract:', error.message)
    return { success: false, error: error.message }
  }
}

async function runFullTest() {
  console.log('=== Full Verification Flow Test ===\n')
  console.log(`Backend URL: ${BACKEND_URL}`)
  console.log(`Frontend URL: ${FRONTEND_URL}`)
  console.log('\n')
  
  try {
    // Step 1: Create test contract
    const contractId = await createTestContract()
    
    // Step 2: Test verification
    const verificationResult = await testGitHubVerification(contractId)
    
    if (!verificationResult.success) {
      console.log('\n❌ Verification failed, stopping test')
      return false
    }
    
    // Wait a bit for backend to update
    console.log('Waiting 2 seconds for backend to update...\n')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Step 3: Verify contract was updated
    const validationResult = await verifyContractUpdated(contractId)
    
    console.log('\n=== Test Summary ===')
    console.log(`Contract ID: ${contractId}`)
    console.log(`Verification: ${verificationResult.success ? '✅ Passed' : '❌ Failed'}`)
    console.log(`Validation: ${validationResult.success ? '✅ Passed' : '❌ Failed'}`)
    
    return verificationResult.success && validationResult.success
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message)
    console.error(error)
    return false
  }
}

// Run the test
runFullTest().then(success => {
  if (success) {
    console.log('\n✅ All tests passed!')
    process.exit(0)
  } else {
    console.log('\n❌ Tests failed!')
    process.exit(1)
  }
})
