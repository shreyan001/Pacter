// Test order hash retrieval from contract
async function testOrderHashRetrieval() {
  console.log('=== Testing Order Hash Retrieval ===\n')
  
  const contractId = 'contract_1759920742668' // Your contract ID
  const baseUrl = 'http://localhost:3000'
  
  try {
    // Test 1: Fetch contract data
    console.log('Step 1: Fetching contract data...')
    const contractResponse = await fetch(`${baseUrl}/api/contracts?id=${contractId}`)
    
    if (!contractResponse.ok) {
      throw new Error(`Contract not found: ${contractResponse.status}`)
    }
    
    const contract = await contractResponse.json()
    console.log('✅ Contract found:', contract.id)
    console.log('   Current stage:', contract.currentStage)
    
    // Test 2: Check for order hash in contract
    console.log('\nStep 2: Checking for order hash...')
    const orderHashFromEscrow = contract.escrow?.orderHash
    const orderHashFromDeposit = contract.escrow?.deposit?.orderHash
    
    console.log('   escrow.orderHash:', orderHashFromEscrow || 'NOT FOUND')
    console.log('   escrow.deposit.orderHash:', orderHashFromDeposit || 'NOT FOUND')
    
    const orderHash = orderHashFromEscrow || orderHashFromDeposit
    
    if (orderHash) {
      console.log('\n✅ Order hash found:', orderHash)
      console.log('   Length:', orderHash.length, '(should be 66)')
      console.log('   Valid format:', orderHash.startsWith('0x') ? '✅' : '❌')
    } else {
      console.log('\n❌ Order hash NOT found in contract')
      console.log('   This means:')
      console.log('   1. Client hasn\'t deposited yet, OR')
      console.log('   2. Order hash wasn\'t saved during deposit')
    }
    
    // Test 3: Use dedicated order hash endpoint
    console.log('\nStep 3: Testing order hash API endpoint...')
    const orderHashResponse = await fetch(`${baseUrl}/api/contracts/order-hash?contractId=${contractId}`)
    
    if (orderHashResponse.ok) {
      const orderHashData = await orderHashResponse.json()
      console.log('✅ Order hash API response:')
      console.log('   Contract ID:', orderHashData.contractId)
      console.log('   Order Hash:', orderHashData.orderHash || 'NOT FOUND')
      console.log('   Has Order Hash:', orderHashData.hasOrderHash ? '✅' : '❌')
    } else {
      console.log('❌ Order hash API failed:', orderHashResponse.status)
    }
    
    // Test 4: Check deposit status
    console.log('\nStep 4: Checking deposit status...')
    const depositStatus = contract.escrow?.deposit?.deposited
    const depositTx = contract.escrow?.deposit?.transactionHash
    
    console.log('   Deposited:', depositStatus ? '✅ Yes' : '❌ No')
    if (depositTx) {
      console.log('   Transaction:', depositTx.substring(0, 20) + '...')
    }
    
    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('SUMMARY')
    console.log('='.repeat(60))
    console.log('Contract ID:', contractId)
    console.log('Order Hash:', orderHash ? '✅ Found' : '❌ Not Found')
    console.log('Deposit Status:', depositStatus ? '✅ Deposited' : '⏳ Pending')
    
    if (!orderHash && !depositStatus) {
      console.log('\n📝 Next Steps:')
      console.log('1. Connect as client wallet')
      console.log('2. Deposit escrow funds')
      console.log('3. Order hash will be generated and saved')
    } else if (!orderHash && depositStatus) {
      console.log('\n⚠️  Warning: Deposit completed but order hash missing!')
      console.log('This shouldn\'t happen - check the deposit flow')
    } else if (orderHash && !depositStatus) {
      console.log('\n⏳ Order hash generated, waiting for deposit')
    } else {
      console.log('\n✅ All good! Order hash saved and deposit completed')
    }
    console.log('='.repeat(60))
    
    return !!orderHash
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    return false
  }
}

// Run the test
testOrderHashRetrieval().then(success => {
  process.exit(success ? 0 : 1)
})
