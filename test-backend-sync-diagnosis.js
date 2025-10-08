// BACKEND SYNC DIAGNOSIS - FETCH ACTUAL DATA
const contractId = 'contract_1759920742668'

async function diagnoseBackendSync() {
  console.log('🔍 BACKEND SYNC DIAGNOSIS')
  console.log('=' .repeat(80))
  console.log(`Contract ID: ${contractId}`)
  console.log('=' .repeat(80))
  console.log('')
  
  try {
    // 1. FETCH CURRENT BACKEND STATE
    console.log('📥 STEP 1: Fetching current backend state...')
    const response = await fetch(`http://localhost:3000/api/contracts?id=${contractId}`)
    
    if (!response.ok) {
      console.error('❌ Failed to fetch contract:', response.status, response.statusText)
      return
    }
    
    const contract = await response.json()
    console.log('✅ Contract fetched successfully')
    console.log('')
    
    // 2. ANALYZE CURRENT STATE
    console.log('📊 STEP 2: Current Backend State Analysis')
    console.log('-'.repeat(80))
    
    console.log('\n🏷️  BASIC INFO:')
    console.log('  - Contract ID:', contract.id)
    console.log('  - Contract Name:', contract.name)
    console.log('  - Current Stage:', contract.currentStage)
    console.log('  - Created At:', contract.createdAt)
    console.log('  - Last Updated:', contract.lastUpdated)
    
    console.log('\n✍️  SIGNATURES:')
    console.log('  - Both Signed:', contract.signatures?.bothSigned)
    console.log('  - Client Signed:', contract.signatures?.client?.signed)
    console.log('  - Freelancer Signed:', contract.signatures?.freelancer?.signed)
    
    console.log('\n💰 ESCROW:')
    console.log('  - Deposited:', contract.escrow?.deposit?.deposited)
    console.log('  - Deposit Amount:', contract.escrow?.deposit?.depositedAmount)
    console.log('  - Order Hash:', contract.escrow?.orderHash || contract.escrow?.deposit?.orderHash)
    
    console.log('\n📦 MILESTONE [0]:')
    const milestone = contract.milestones?.[0]
    if (milestone) {
      console.log('  - Status:', milestone.status)
      console.log('  - Description:', milestone.description)
      
      console.log('\n  📤 DELIVERABLE:')
      console.log('    - Submitted:', milestone.deliverable?.submitted)
      console.log('    - Submitted At:', milestone.deliverable?.submittedAt)
      console.log('    - GitHub URL:', milestone.deliverable?.githubUrl)
      console.log('    - Deployment URL:', milestone.deliverable?.deploymentUrl)
      console.log('    - Storage Hash:', milestone.deliverable?.storage?.storageHash)
      
      console.log('\n  ✅ VERIFICATION:')
      console.log('    - Agent Verified:', milestone.verification?.agentVerified)
      console.log('    - Verified At:', milestone.verification?.verifiedAt)
      console.log('    - Verification Note:', milestone.verification?.verificationNote)
      console.log('    - GitHub Verified:', milestone.verification?.githubVerification?.verified)
      console.log('    - Storage Verified:', milestone.verification?.storageVerification?.verified)
      console.log('    - On-Chain TX:', milestone.verification?.onChainVerification?.transactionHash)
      
      console.log('\n  👀 REVIEW:')
      console.log('    - Client Reviewed:', milestone.review?.clientReviewed)
      console.log('    - Approved:', milestone.review?.approved)
      console.log('    - Feedback:', milestone.review?.feedback)
      
      console.log('\n  💸 PAYMENT:')
      console.log('    - Approved:', milestone.payment?.approved)
      console.log('    - Released:', milestone.payment?.released)
      console.log('    - Transaction Hash:', milestone.payment?.transactionHash)
    } else {
      console.log('  ❌ No milestone found!')
    }
    
    console.log('\n📜 STAGE HISTORY:')
    if (contract.stageHistory && contract.stageHistory.length > 0) {
      contract.stageHistory.forEach((stage, idx) => {
        console.log(`  ${idx + 1}. ${stage.stage} - ${stage.timestamp}`)
        console.log(`     Triggered by: ${stage.triggeredBy}`)
        console.log(`     Note: ${stage.note}`)
        if (stage.transactionHash) {
          console.log(`     TX: ${stage.transactionHash}`)
        }
      })
    } else {
      console.log('  ❌ No stage history!')
    }
    
    // 3. DETERMINE EXPECTED STATE
    console.log('\n' + '='.repeat(80))
    console.log('🎯 STEP 3: Expected State Analysis')
    console.log('='.repeat(80))
    
    const bothSigned = contract.signatures?.bothSigned
    const deposited = contract.escrow?.deposit?.deposited
    const submitted = milestone?.deliverable?.submitted
    const agentVerified = milestone?.verification?.agentVerified
    const clientReviewed = milestone?.review?.clientReviewed
    const paymentApproved = milestone?.payment?.approved
    const paymentReleased = milestone?.payment?.released
    
    console.log('\n📋 State Checklist:')
    console.log(`  ${bothSigned ? '✅' : '❌'} Both parties signed`)
    console.log(`  ${deposited ? '✅' : '❌'} Escrow deposited`)
    console.log(`  ${submitted ? '✅' : '❌'} Deliverable submitted`)
    console.log(`  ${agentVerified ? '✅' : '❌'} Agent verified`)
    console.log(`  ${clientReviewed ? '✅' : '❌'} Client reviewed`)
    console.log(`  ${paymentApproved ? '✅' : '❌'} Payment approved`)
    console.log(`  ${paymentReleased ? '✅' : '❌'} Payment released`)
    
    console.log('\n🎬 Expected Stage:')
    let expectedStage = 'Unknown'
    let expectedStageNumber = 0
    
    if (!bothSigned) {
      expectedStage = 'Signatures Pending'
      expectedStageNumber = 0
    } else if (!deposited) {
      expectedStage = 'Escrow Deposited' // Awaiting deposit
      expectedStageNumber = 1
    } else if (!submitted) {
      expectedStage = 'Work in Progress'
      expectedStageNumber = 2
    } else if (!agentVerified) {
      expectedStage = 'Submission' // AI verifying
      expectedStageNumber = 3
    } else if (!paymentApproved) {
      expectedStage = 'Review' // Client reviewing
      expectedStageNumber = 4
    } else if (!paymentReleased) {
      expectedStage = 'Payment Approved' // Ready to withdraw
      expectedStageNumber = 5
    } else {
      expectedStage = 'Contract Completed'
      expectedStageNumber = 6
    }
    
    console.log(`  Expected: "${expectedStage}" (Stage ${expectedStageNumber})`)
    console.log(`  Actual:   "${contract.currentStage}"`)
    
    const stageMatches = contract.currentStage === expectedStage
    console.log(`  ${stageMatches ? '✅ MATCH' : '❌ MISMATCH'}`)
    
    // 4. IDENTIFY PROBLEMS
    console.log('\n' + '='.repeat(80))
    console.log('🔧 STEP 4: Problem Identification')
    console.log('='.repeat(80))
    
    const problems = []
    
    if (!stageMatches) {
      problems.push({
        type: 'STAGE_MISMATCH',
        severity: 'HIGH',
        message: `Current stage "${contract.currentStage}" doesn't match expected "${expectedStage}"`,
        fix: `Update contract.currentStage to "${expectedStage}"`
      })
    }
    
    if (submitted && !agentVerified) {
      problems.push({
        type: 'VERIFICATION_PENDING',
        severity: 'MEDIUM',
        message: 'Deliverable submitted but not verified by agent',
        fix: 'Run verification process or check if verification failed'
      })
    }
    
    if (agentVerified && !milestone?.status) {
      problems.push({
        type: 'MILESTONE_STATUS_MISSING',
        severity: 'MEDIUM',
        message: 'Milestone verified but status field is missing',
        fix: 'Set milestone.status to "UNDER_REVIEW"'
      })
    }
    
    if (agentVerified && milestone?.status !== 'UNDER_REVIEW' && !paymentApproved) {
      problems.push({
        type: 'MILESTONE_STATUS_WRONG',
        severity: 'MEDIUM',
        message: `Milestone status is "${milestone?.status}" but should be "UNDER_REVIEW"`,
        fix: 'Update milestone.status to "UNDER_REVIEW"'
      })
    }
    
    if (!contract.lastUpdated) {
      problems.push({
        type: 'MISSING_TIMESTAMP',
        severity: 'LOW',
        message: 'lastUpdated timestamp is missing',
        fix: 'Add lastUpdated field with current timestamp'
      })
    }
    
    if (problems.length === 0) {
      console.log('\n✅ No problems detected! Backend is in sync.')
    } else {
      console.log(`\n❌ Found ${problems.length} problem(s):\n`)
      problems.forEach((problem, idx) => {
        console.log(`${idx + 1}. [${problem.severity}] ${problem.type}`)
        console.log(`   Problem: ${problem.message}`)
        console.log(`   Fix: ${problem.fix}`)
        console.log('')
      })
    }
    
    // 5. FRONTEND MAPPING
    console.log('='.repeat(80))
    console.log('🖥️  STEP 5: Frontend Stage Mapping')
    console.log('='.repeat(80))
    
    console.log('\nFrontend should show:')
    console.log(`  - Diagram Stage: ${expectedStageNumber} (${expectedStage})`)
    console.log(`  - Progress: ${((expectedStageNumber + 1) / 7 * 100).toFixed(1)}%`)
    
    if (expectedStageNumber === 4) {
      console.log(`  - FreelancerView: "📋 Under Review by Client"`)
      console.log(`  - Should show submission details with links`)
    } else if (expectedStageNumber === 5) {
      console.log(`  - FreelancerView: "🎉 Payment Approved!"`)
      console.log(`  - Should show withdraw button`)
    }
    
    // 6. SAVE FULL CONTRACT TO FILE
    console.log('\n' + '='.repeat(80))
    console.log('💾 STEP 6: Saving full contract data to file...')
    console.log('='.repeat(80))
    
    const fs = require('fs')
    fs.writeFileSync(
      'backend-contract-dump.json',
      JSON.stringify(contract, null, 2)
    )
    console.log('✅ Full contract saved to: backend-contract-dump.json')
    
    // 7. SUMMARY
    console.log('\n' + '='.repeat(80))
    console.log('📝 SUMMARY')
    console.log('='.repeat(80))
    console.log(`\nCurrent State: ${contract.currentStage}`)
    console.log(`Expected State: ${expectedStage}`)
    console.log(`Problems Found: ${problems.length}`)
    console.log(`\nNext Action: ${problems.length > 0 ? 'Fix backend sync issues' : 'Backend is correct, check frontend'}`)
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
    console.error(error)
  }
}

// Run diagnosis
diagnoseBackendSync()
