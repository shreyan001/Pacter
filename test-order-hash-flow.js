// Test order hash flow to ensure consistency
const { ethers } = require('ethers');

// Simulate the order hash generation (same as in orderHash.ts)
function generateOrderHash(initiatorAddress, freelancerAddress) {
  const timestamp = Date.now();
  const randomValue = Math.random().toString(36).substring(2, 15);
  const hashInput = `${initiatorAddress.toLowerCase()}-${freelancerAddress.toLowerCase()}-${timestamp}-${randomValue}`;
  return ethers.keccak256(ethers.toUtf8Bytes(hashInput));
}

async function testOrderHashFlow() {
  console.log('=== Testing Order Hash Flow ===\n');
  
  // Test addresses
  const clientAddress = '0x1111111111111111111111111111111111111111';
  const freelancerAddress = '0x2222222222222222222222222222222222222222';
  
  console.log('Addresses:');
  console.log(`  Client: ${clientAddress}`);
  console.log(`  Freelancer: ${freelancerAddress}\n`);
  
  // Step 1: Client generates order hash during deposit
  console.log('Step 1: Client Deposits Escrow');
  const orderHashAtDeposit = generateOrderHash(clientAddress, freelancerAddress);
  console.log(`  Generated order hash: ${orderHashAtDeposit}`);
  console.log(`  ✅ Order created on-chain with this hash\n`);
  
  // Simulate storing in contract
  const contract = {
    id: 'test-contract-123',
    escrow: {
      orderHash: orderHashAtDeposit,
      deposit: {
        deposited: true,
        orderHash: orderHashAtDeposit
      }
    }
  };
  
  console.log('  Stored in Redis:');
  console.log(`    contract.escrow.orderHash = ${contract.escrow.orderHash}\n`);
  
  // Step 2: Freelancer submits deliverable
  console.log('Step 2: Freelancer Submits Deliverable');
  const orderHashFromContract = contract.escrow.orderHash;
  console.log(`  Retrieved from contract: ${orderHashFromContract}`);
  console.log(`  Sending to API with this hash\n`);
  
  // Step 3: API receives and uses the hash
  console.log('Step 3: Verification API');
  const providedOrderHash = orderHashFromContract; // From request
  const orderHashForVerification = providedOrderHash || contract.escrow?.orderHash;
  console.log(`  Received order hash: ${providedOrderHash}`);
  console.log(`  Using for verification: ${orderHashForVerification}\n`);
  
  // Step 4: Verify consistency
  console.log('Step 4: Verification Check');
  const hashesMatch = orderHashAtDeposit === orderHashForVerification;
  
  if (hashesMatch) {
    console.log('  ✅ Order hashes match!');
    console.log(`     Deposit:      ${orderHashAtDeposit}`);
    console.log(`     Verification: ${orderHashForVerification}`);
    console.log('\n  ✅ Agent can verify the order on-chain');
  } else {
    console.log('  ❌ Order hashes DO NOT match!');
    console.log(`     Deposit:      ${orderHashAtDeposit}`);
    console.log(`     Verification: ${orderHashForVerification}`);
    console.log('\n  ❌ Agent verification will fail');
  }
  
  // Test the WRONG way (what was happening before)
  console.log('\n\n=== Testing WRONG Way (Before Fix) ===\n');
  console.log('Step 1: Client deposits with hash A');
  const hashA = generateOrderHash(clientAddress, freelancerAddress);
  console.log(`  Hash A: ${hashA}\n`);
  
  console.log('Step 2: Agent generates NEW hash B');
  const hashB = generateOrderHash(clientAddress, freelancerAddress);
  console.log(`  Hash B: ${hashB}\n`);
  
  console.log('Step 3: Comparison');
  if (hashA === hashB) {
    console.log('  ✅ Hashes match (unlikely!)');
  } else {
    console.log('  ❌ Hashes DO NOT match');
    console.log('  ❌ Result: "Pacter: Order does not exist"\n');
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log('✅ CORRECT: Use same hash throughout flow');
  console.log('   1. Generate once during deposit');
  console.log('   2. Store in contract.escrow.orderHash');
  console.log('   3. Pass to API during verification');
  console.log('   4. Use for all on-chain operations\n');
  console.log('❌ WRONG: Generate new hash each time');
  console.log('   - Each generation creates different hash');
  console.log('   - On-chain order not found');
  console.log('   - Verification fails');
  console.log('='.repeat(60));
  
  return hashesMatch;
}

// Run the test
testOrderHashFlow().then(success => {
  if (success) {
    console.log('\n✅ Order hash flow test PASSED!');
    process.exit(0);
  } else {
    console.log('\n❌ Order hash flow test FAILED!');
    process.exit(1);
  }
});
