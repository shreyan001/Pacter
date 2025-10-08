// Check the current state of an order on the blockchain
const { ethers } = require('ethers');

const PACTER_ABI = [
  {
    type: 'function',
    name: 'getOrder',
    inputs: [{ name: 'orderHash', type: 'bytes32' }],
    outputs: [{
      name: '',
      type: 'tuple',
      components: [
        { name: 'orderHash', type: 'bytes32' },
        { name: 'initiator', type: 'address' },
        { name: 'freelancer', type: 'address' },
        { name: 'escrowAmount', type: 'uint256' },
        { name: 'storageFee', type: 'uint256' },
        { name: 'projectName', type: 'string' },
        { name: 'currentState', type: 'uint8' },
        { name: 'createdTimestamp', type: 'uint256' },
        { name: 'verifiedTimestamp', type: 'uint256' },
        { name: 'completedTimestamp', type: 'uint256' },
        { name: 'verificationDetails', type: 'string' },
      ],
    }],
    stateMutability: 'view',
  },
];

const ORDER_STATES = {
  0: 'PENDING',
  1: 'ACTIVE',
  2: 'VERIFIED',
  3: 'APPROVED',
  4: 'COMPLETED',
  5: 'DISPUTED',
  6: 'VERIFICATION_FAILED'
};

async function checkOrderState() {
  console.log('=== Checking Order State on Blockchain ===\n');
  
  const orderHash = '0x167019f0bfd548f5f0af188a827321622504057c7db10b3bf8d82c45eb861972';
  const rpcUrl = 'https://evmrpc-testnet.0g.ai';
  const contractAddress = '0x259829717EbCe11350c37CB9B5d8f38Cb42E0988';
  
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, PACTER_ABI, provider);
    
    console.log('Fetching order from blockchain...');
    console.log(`Order Hash: ${orderHash}\n`);
    
    const order = await contract.getOrder(orderHash);
    
    const state = Number(order.currentState);
    const stateName = ORDER_STATES[state];
    
    console.log('✅ Order found on blockchain!\n');
    console.log('Order Details:');
    console.log('─'.repeat(60));
    console.log(`Order Hash:     ${order.orderHash}`);
    console.log(`Initiator:      ${order.initiator}`);
    console.log(`Freelancer:     ${order.freelancer}`);
    console.log(`Escrow Amount:  ${ethers.formatEther(order.escrowAmount)} 0G`);
    console.log(`Storage Fee:    ${ethers.formatEther(order.storageFee)} 0G`);
    console.log(`Project Name:   ${order.projectName}`);
    console.log(`Current State:  ${state} (${stateName})`);
    console.log(`Created:        ${new Date(Number(order.createdTimestamp) * 1000).toISOString()}`);
    
    if (order.verifiedTimestamp > 0) {
      console.log(`Verified:       ${new Date(Number(order.verifiedTimestamp) * 1000).toISOString()}`);
    }
    
    if (order.completedTimestamp > 0) {
      console.log(`Completed:      ${new Date(Number(order.completedTimestamp) * 1000).toISOString()}`);
    }
    
    if (order.verificationDetails) {
      console.log(`Verification:   ${order.verificationDetails.substring(0, 100)}...`);
    }
    
    console.log('─'.repeat(60));
    
    // Provide guidance based on state
    console.log('\n📋 What This Means:\n');
    
    switch (state) {
      case 0: // PENDING
        console.log('⏳ Order is PENDING');
        console.log('   Next step: Client needs to deposit funds');
        break;
        
      case 1: // ACTIVE
        console.log('✅ Order is ACTIVE');
        console.log('   Next step: Freelancer can submit deliverable');
        console.log('   Agent can verify the deliverable');
        break;
        
      case 2: // VERIFIED
        console.log('✅ Order is VERIFIED');
        console.log('   ⚠️  This is why you\'re getting the error!');
        console.log('   The order has already been verified by the agent');
        console.log('   Next step: Client needs to approve payment');
        break;
        
      case 3: // APPROVED
        console.log('✅ Order is APPROVED');
        console.log('   Next step: Freelancer can withdraw funds');
        break;
        
      case 4: // COMPLETED
        console.log('✅ Order is COMPLETED');
        console.log('   All done! Funds have been withdrawn');
        break;
        
      case 5: // DISPUTED
        console.log('⚠️  Order is DISPUTED');
        console.log('   Needs dispute resolution');
        break;
        
      case 6: // VERIFICATION_FAILED
        console.log('❌ Verification FAILED');
        console.log('   Freelancer needs to resubmit');
        break;
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('SOLUTION');
    console.log('='.repeat(60));
    
    if (state === 2) {
      console.log('The order is already VERIFIED!');
      console.log('You cannot verify it again.');
      console.log('\nNext steps:');
      console.log('1. Client should go to the contract page');
      console.log('2. Click "Approve & Release Payment"');
      console.log('3. Then freelancer can withdraw funds');
    } else if (state === 1) {
      console.log('The order is ACTIVE and ready for verification');
      console.log('Freelancer can submit deliverable now');
    } else {
      console.log(`Order is in ${stateName} state`);
      console.log('Check the guidance above for next steps');
    }
    
    return state;
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.message.includes('Order does not exist')) {
      console.log('\n⚠️  Order not found on blockchain');
      console.log('This means the order was never created on-chain');
      console.log('Client needs to deposit funds first');
    }
    
    return null;
  }
}

// Run the check
checkOrderState().then(state => {
  if (state !== null) {
    console.log(`\n✅ Check complete. Order state: ${ORDER_STATES[state]}`);
  }
  process.exit(0);
});
