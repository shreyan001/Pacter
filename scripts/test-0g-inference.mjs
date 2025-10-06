import { ethers } from 'ethers';
import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';
import dotenv from 'dotenv';

dotenv.config();

async function testZGInference() {
  try {
    console.log('🚀 Starting 0G AI Inference Test...\n');

    // Initialize provider and wallet
    const provider = new ethers.JsonRpcProvider('https://evmrpc-testnet.0g.ai');
    const wallet = new ethers.Wallet(process.env['0G_PRIVATE_KEY'], provider);
    
    console.log('📡 Connecting to 0G Compute Network...');
    const broker = await createZGComputeNetworkBroker(wallet);
    console.log('✅ Broker initialized successfully\n');

    // Check account balance or create account if it doesn't exist
    console.log('💰 Checking account balance...');
    let account;
    try {
      account = await broker.ledger.getLedger();
      console.log(`Balance: ${ethers.formatEther(account.totalBalance)} OG tokens\n`);
    } catch (error) {
      if (error.message.includes('Account does not exist')) {
        console.log('📝 Account does not exist. Creating account...');
        await broker.ledger.addLedger(2);
        console.log('✅ Account created with 2 OG tokens\n');
        account = await broker.ledger.getLedger();
        console.log(`Balance: ${ethers.formatEther(account.totalBalance)} OG tokens\n`);
      } else {
        throw error;
      }
    }

    // Add funds if balance is low (less than 1.5 OG)
    if (account.totalBalance < ethers.parseEther('1.5')) {
      console.log('💳 Adding funds to account using depositFund...');
      await broker.ledger.depositFund(2);
      console.log('✅ Added 2 OG tokens to account\n');
      // Get updated balance
      account = await broker.ledger.getLedger();
      console.log(`💰 Updated balance: ${ethers.formatEther(account.totalBalance)} OG tokens\n`);
    }

    // Discover available services
    console.log('🔍 Discovering available AI services...');
    const services = await broker.inference.listService();
    console.log(`Found ${services.length} available services:\n`);

    // Display available services
    services.forEach((service, index) => {
      console.log(`Service ${index + 1}:`);
      console.log(`  Provider: ${service.provider}`);
      console.log(`  Model: ${service.model}`);
      console.log(`  Verification: ${service.verifiability || 'None'}`);
      console.log(`  Input Price: ${ethers.formatEther(service.inputPrice)} OG`);
      console.log(`  Output Price: ${ethers.formatEther(service.outputPrice)} OG`);
      console.log('');
    });

    // Known provider addresses for specific models
    const knownProviders = {
      'gpt-oss-120b': '0xf07240Efa67755B5311bc75784a061eDB47165Dd',
      'deepseek-r1-70b': '0x3feE5a4dd5FDb8a32dDA97Bed899830605dBD9D3'
    };

    // Try to find services with known provider addresses first
    let selectedService = services.find(s => 
      s.model.includes('gpt-oss-120b') && s.provider === knownProviders['gpt-oss-120b']
    ) || services.find(s => 
      s.model.includes('deepseek-r1-70b') && s.provider === knownProviders['deepseek-r1-70b']
    ) || services.find(s => s.model.includes('gpt-oss-120b')) || 
       services.find(s => s.model.includes('deepseek-r1-70b')) || 
       services[0];

    if (!selectedService) {
      throw new Error('No services available');
    }

    console.log(`🎯 Selected service: ${selectedService.model} (Provider: ${selectedService.provider})`);
    
    // Verify if we're using the correct provider address
    const expectedProvider = knownProviders[selectedService.model] || knownProviders[Object.keys(knownProviders).find(key => selectedService.model.includes(key))];
    if (expectedProvider && selectedService.provider === expectedProvider) {
      console.log(`✅ Using verified provider address: ${selectedService.provider}`);
    } else if (expectedProvider) {
      console.log(`⚠️  Provider address mismatch. Expected: ${expectedProvider}, Got: ${selectedService.provider}`);
    }
    console.log('');

    // Acknowledge the provider
    console.log('🤝 Acknowledging provider...');
    await broker.inference.acknowledgeProviderSigner(selectedService.provider);
    console.log('✅ Provider acknowledged\n');

    // Get service metadata
    console.log('📋 Getting service metadata...');
    const { endpoint, model } = await broker.inference.getServiceMetadata(selectedService.provider);
    console.log(`Endpoint: ${endpoint}`);
    console.log(`Model: ${model}\n`);

    // Prepare the question about location
    const question = "What is your location right now? Where do you live?";
    const messages = [{ role: "user", content: question }];

    console.log(`❓ Question: "${question}"\n`);

    // Generate authenticated request headers
    console.log('🔐 Generating authentication headers...');
    const headers = await broker.inference.getRequestHeaders(
      selectedService.provider, 
      JSON.stringify(messages)
    );
    console.log('✅ Headers generated\n');

    // Send request to the AI service
    console.log('🧠 Sending request to AI service...');
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        ...headers 
      },
      body: JSON.stringify({
        messages: messages,
        model: model,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.choices[0].message.content;
    const chatID = data.id;

    console.log('🤖 AI Response:');
    console.log('─'.repeat(50));
    console.log(answer);
    console.log('─'.repeat(50));
    console.log(`Chat ID: ${chatID}\n`);

    // Verify the response (if service supports verification)
    if (selectedService.verifiability) {
      console.log('🔍 Verifying response...');
      const isValid = await broker.inference.processResponse(
        selectedService.provider,
        answer,
        chatID
      );
      console.log(`✅ Response verification: ${isValid ? 'VALID' : 'INVALID'}\n`);
    } else {
      console.log('ℹ️  Response verification not available for this service\n');
    }

    // Check final balance
    console.log('💰 Final account balance...');
    const finalAccount = await broker.ledger.getLedger();
    console.log(`Balance: ${ethers.formatEther(finalAccount.totalBalance)} OG tokens`);
    
    const tokensUsed = account.totalBalance - finalAccount.totalBalance;
    console.log(`Tokens used: ${ethers.formatEther(tokensUsed)} OG\n`);

    console.log('🎉 0G AI Inference test completed successfully!');

  } catch (error) {
    console.error('❌ Error during 0G AI inference test:', error);
    process.exit(1);
  }
}

// Run the test
testZGInference();