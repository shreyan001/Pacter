// Test script to verify backend sync fix
const contractId = 'contract_1759920742668'

async function testBackendSync() {
  console.log('🔍 Testing Backend Sync Fix')
  console.log('=' .repeat(80))
  
  try {
    // Fetch current contract state
    const response = await fetch(`http://localhost:3000/api/contracts?id=${contractId}`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch contract: ${response.statusText}`)
    }
    
    const contract = await response.json()
    
    console.log('\n📊 Current Contract State:')
    console.log('-'.repeat(80))
    console.log(`Contract ID: ${contract.id}`)
    console.log(`Current Stage: ${contract.currentStage}`)
    console.log(`Last Updated: ${contract.lastUpdated}`)
    
    console.log('\n💰 Escrow Status:')
    console.log(`  Deposited: ${contract.escrow?.deposit?.deposited}`)
    console.log(`  Amount: ${contract.escrow?.deposit?.depositedAmount}`)
    console.log(`  Order Hash: ${contract.escrow?.orderHash}`)
    
    console.log('\n📦 Milestone Status:')
    const milestone = contract.milestones?.[0]
    if (milestone) {
      console.log(`  Status: ${milestone.status}`)
      console.log(`  Deliverable Submitted: ${milestone.deliverable?.submitted}`)
      console.log(`  Agent Verified: ${milestone.verification?.agentVerified}`)
      console.log(`  Client Reviewed: ${milestone.review?.clientReviewed}`)
      console.log(`  Payment Approved: ${milestone.payment?.approved}`)
      
      console.log('\n📤 Deliverable Info:')
      console.log(`  GitHub URL: ${milestone.deliverable?.githubUrl || 'N/A'}`)
      console.log(`  Deployment URL: ${milestone.deliverable?.deploymentUrl || 'N/A'}`)
      console.log(`  Storage Hash: ${milestone.deliverable?.storage?.storageHash || 'N/A'}`)
      console.log(`  Storage TX: ${milestone.deliverable?.storage?.storageTxHash || 'N/A'}`)
    }
    
    console.log('\n📜 Recent Stage History:')
    const recentHistory = contract.stageHistory?.slice(-3) || []
    recentHistory.forEach((entry, idx) => {
      console.log(`  ${idx + 1}. ${entry.stage} - ${entry.timestamp}`)
      console.log(`     By: ${entry.triggeredBy}`)
      console.log(`     Note: ${entry.note}`)
      if (entry.transactionHash) {
        console.log(`     TX: ${entry.transactionHash}`)
      }
    })
    
    console.log('\n' + '='.repeat(80))
    console.log('✅ ANALYSIS:')
    console.log('='.repeat(80))
    
    // Check for issues
    const issues = []
    
    if (contract.currentStage !== 'Payment Approved' && milestone?.payment?.approved) {
      issues.push('⚠️  Stage mismatch: Payment approved but stage not updated')
    }
    
    if (milestone?.status !== 'COMPLETED' && milestone?.payment?.approved) {
      issues.push('⚠️  Milestone status should be COMPLETED after payment approval')
    }
    
    if (milestone?.deliverable?.storage?.storageHash?.includes('test')) {
      issues.push('⚠️  Using FAKE test storage hash instead of real 0G hash')
    }
    
    if (issues.length > 0) {
      console.log('\n❌ Issues Found:')
      issues.forEach(issue => console.log(issue))
    } else {
      console.log('\n✅ All checks passed! Backend is properly synced.')
    }
    
    console.log('\n📋 Expected State After Fix:')
    console.log('  - currentStage: "Payment Approved"')
    console.log('  - milestone.status: "COMPLETED"')
    console.log('  - milestone.payment.approved: true')
    console.log('  - Real 0G storage hash (not test hash)')
    console.log('  - lastUpdated: Recent timestamp')
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
  }
}

// Run the test
testBackendSync()
