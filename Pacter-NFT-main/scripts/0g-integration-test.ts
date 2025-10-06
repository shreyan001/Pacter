// 0G Integration Test - Extract NFT data and test with 0G Compute Network
import { ethers } from "ethers";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import * as fs from 'fs';
import * as path from 'path';

// Import existing test functionality
let deployments: any, IndiaFreelanceLegalNFTDeployment: any, teeVerifierDeployment: any, IndiaFreelanceLegalNFTABI: any;

try {
  IndiaFreelanceLegalNFTDeployment = JSON.parse(fs.readFileSync(path.join(__dirname, '../deployments/zgTestnet/IndiaFreelanceLegalNFT.json'), 'utf8'));
  IndiaFreelanceLegalNFTABI = JSON.parse(fs.readFileSync(path.join(__dirname, '../build/contracts/IndiaFreelanceLegalNFT.sol/IndiaFreelanceLegalNFT.json'), 'utf8')).abi;
} catch (error) {
  console.error('Error loading deployment files:', error);
  process.exit(1);
}

async function main() {
  console.log('🚀 Starting 0G Integration Test');
  console.log('================================\n');

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider("https://evmrpc-testnet.0g.ai");
  
  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY environment variable is required');
  }
  
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  console.log(`📍 Wallet Address: ${wallet.address}`);

  // Step 1: Extract NFT Data
  console.log('\n📋 Step 1: Extracting NFT Data');
  console.log('==============================');
  
  const IndiaFreelanceLegalNFT = new ethers.Contract(IndiaFreelanceLegalNFTDeployment.address, IndiaFreelanceLegalNFTABI, provider);
  const tokenId = 0; // Using the minted token
  
  try {
    const dataDescriptions = await IndiaFreelanceLegalNFT.dataDescriptionsOf(tokenId);
    const dataHashes = await IndiaFreelanceLegalNFT.dataHashesOf(tokenId);
    
    console.log(`✅ Retrieved ${dataDescriptions.length} data entries from NFT`);
    
    for (let i = 0; i < dataDescriptions.length; i++) {
      console.log(`\n📄 Entry ${i + 1}:`);
      console.log(`   Description: ${dataDescriptions[i]}`);
      console.log(`   Hash: ${dataHashes[i]}`);
    }
  } catch (error) {
    console.error('❌ Error extracting NFT data:', error);
    return;
  }

  // Step 2: Initialize 0G Broker
  console.log('\n🔗 Step 2: Initializing 0G Compute Network Broker');
  console.log('=================================================');
  
  let broker;
  try {
    broker = await createZGComputeNetworkBroker(wallet);
    console.log('✅ 0G Broker initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing broker:', error);
    return;
  }

  // Step 3: Check Account Balance
  console.log('\n💰 Step 3: Checking Account Balance');
  console.log('===================================');
  
  try {
    const ledger = await broker.ledger.getLedger();
    console.log(`💳 Balance: ${ledger.balance} 0G tokens`);
    console.log(`🔒 Locked: ${ledger.locked} 0G tokens`);
    console.log(`✅ Available: ${ledger.balance - ledger.locked} 0G tokens`);
    
    if (ledger.balance - ledger.locked < 1000000) {
      console.log('⚠️  Low balance detected. Consider adding funds with:');
      console.log('   await broker.ledger.depositFund("1000000");');
    }
  } catch (error) {
    console.error('❌ Error checking balance:', error);
  }

  // Step 4: Discover Available Services
  console.log('\n🔍 Step 4: Discovering Available Services');
  console.log('=========================================');
  
  let services;
  try {
    services = await broker.inference.listService();
    console.log(`📊 Found ${services.length} available services`);
    
    // Filter for the models we have in our NFT data
    const targetModels = ['llama-3.3-70b-instruct', 'deepseek-r1-70b'];
    const availableServices = services.filter(service => 
      targetModels.some(model => service.model.includes(model))
    );
    
    console.log(`\n🎯 Target Services Found: ${availableServices.length}`);
    for (const service of availableServices) {
      console.log(`\n🤖 Model: ${service.model}`);
      console.log(`   Provider: ${service.provider}`);
      console.log(`   Verification: ${service.verifiability}`);
      console.log(`   Input Price: ${service.inputPrice} 0G tokens`);
      console.log(`   Output Price: ${service.outputPrice} 0G tokens`);
    }
    
    if (availableServices.length === 0) {
      console.log('⚠️  No target services found. Available models:');
      services.forEach(service => console.log(`   - ${service.model}`));
      return;
    }

    // Step 5: Test Service Interaction
    console.log('\n🧪 Step 5: Testing Service Interaction');
    console.log('======================================');
    
    const testService = availableServices[0];
    console.log(`\n🎯 Testing with: ${testService.model}`);
    
    // Acknowledge provider
    try {
      console.log('📝 Acknowledging provider...');
      await broker.inference.acknowledgeProviderSigner(testService.provider);
      console.log('✅ Provider acknowledged');
    } catch (error) {
      console.log('ℹ️  Provider already acknowledged or acknowledgment failed:', error.message);
    }
    
    // Get service metadata
    const { endpoint, model } = await broker.inference.getServiceMetadata(testService.provider);
    console.log(`🔗 Endpoint: ${endpoint}`);
    console.log(`🤖 Model: ${model}`);
    
    // Test question based on NFT data (EscrowAgent)
    const testQuestion = "What is an escrow contract and how does it work with NFTs?";
    console.log(`\n❓ Test Question: ${testQuestion}`);
    
    // Generate auth headers
    const headers = await broker.inference.getRequestHeaders(testService.provider, testQuestion);
    
    // Send request
    console.log('📤 Sending request to AI service...');
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({
        messages: [{ role: "user", content: testQuestion }],
        model: model,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const answer = data.choices[0].message.content;
    
    console.log('\n🎉 AI Response Received:');
    console.log('========================');
    console.log(answer);
    
    // Final balance check
    console.log('\n💰 Final Balance Check');
    console.log('======================');
    const finalLedger = await broker.ledger.getLedger();
    
    console.log(`💳 Final Balance: ${finalLedger.balance} 0G tokens`);
    console.log(`🔒 Final Locked: ${finalLedger.locked} 0G tokens`);
    console.log(`✅ Final Available: ${finalLedger.balance - finalLedger.locked} 0G tokens`);
    
  } catch (error) {
    console.error('❌ Error in service interaction:', error);
  }

  console.log('\n✅ 0G Integration Test Completed!');
}

// Run the test
main().catch(console.error);