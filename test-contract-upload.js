const { Redis } = require('@upstash/redis');
require('dotenv').config();

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function testContractUpload() {
  try {
    console.log('=== Testing Contract Upload Flow ===\n');
    
    // Step 1: Create a test contract
    const testContract = {
      id: `contract_test_${Date.now()}`,
      contractHash: '0xTEST123',
      name: 'Test Contract Upload',
      projectType: 'web_development',
      description: 'Testing contract upload flow',
      currentStage: 'Signatures Pending',
      flowType: 'execution',
      jurisdiction: {
        country: 'India',
        countryCode: 'IN',
        legalFramework: 'Indian Contract Act, 1872',
        disputeResolution: 'Indian Courts/Arbitration',
        applicableLaws: ['Indian Contract Act'],
        timezone: 'Asia/Kolkata'
      },
      parties: {
        client: {
          name: 'Test Client',
          email: 'test@example.com',
          walletAddress: '0xTEST',
          role: 'CLIENT',
          location: { country: 'India', state: '', city: '' }
        },
        freelancer: {
          name: 'Test Freelancer',
          email: 'freelancer@example.com',
          walletAddress: '0xFREELANCER',
          role: 'FREELANCER',
          skills: [],
          location: { country: 'India', state: '', city: '' }
        }
      },
      signatures: {
        client: { signed: false, signedAt: null, signature: null },
        freelancer: { signed: false, signedAt: null, signature: null },
        bothSigned: false
      },
      escrow: {
        amounts: {
          inr: { totalAmount: '50000', currency: 'INR', exchangeRateAt: new Date().toISOString(), exchangeRate: '1.00' },
          '0G': { totalAmount: '500', currency: '0G', network: '0g-testnet' }
        },
        contractAddress: '0x0000000000000000000000000000000000000000',
        deposit: { deposited: false, depositedAmount: '0', depositedAt: null, transactionHash: null },
        fees: {
          platformFee: { inr: '1250', zeroG: '12' },
          storageFee: { inr: '250', zeroG: '2' },
          totalFees: { inr: '1500', zeroG: '14' }
        }
      },
      storage: {
        contractDocument: {
          rootHash: '0xTEST123',
          fileName: 'test_contract.pdf',
          uploadedAt: new Date().toISOString(),
          uploadedBy: '0xTEST',
          fileSize: '10KB'
        }
      },
      projectDetails: {
        deliverables: ['Test deliverable'],
        timeline: '30 days',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      legalContract: {
        contractText: 'Test contract text',
        generatedAt: new Date().toISOString(),
        generatedBy: 'Test',
        storageRootHash: '0xTEST123',
        verificationProof: { type: 'NONE', hash: '0xTEST123', timestamp: new Date().toISOString() }
      },
      milestones: [],
      currentMilestone: null,
      agentInfo: {
        iNFTContractAddress: '0x0000000000000000000000000000000000000000',
        iNFTTokenId: '0',
        lastAction: null
      },
      stageHistory: [
        {
          stage: 'Signatures Pending',
          timestamp: new Date().toISOString(),
          triggeredBy: 'system',
          note: 'Test contract created'
        }
      ],
      shareableLink: '',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      status: 'ACTIVE'
    };

    console.log('Step 1: Creating test contract...');
    console.log('Contract ID:', testContract.id);

    // Step 2: Upload via API
    console.log('\nStep 2: Uploading to API...');
    const response = await fetch('http://localhost:3000/api/contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testContract)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API upload failed:', response.status, errorText);
      return;
    }

    const result = await response.json();
    console.log('✓ API upload successful:', result.success);

    // Step 3: Verify in database
    console.log('\nStep 3: Verifying in database...');
    const database = await redis.get('database');
    const parsed = typeof database === 'string' ? JSON.parse(database) : database;
    
    const found = parsed.contracts.find(c => c.id === testContract.id);
    if (found) {
      console.log('✓ Contract found in database!');
      console.log('Contract name:', found.name);
      console.log('Current stage:', found.currentStage);
    } else {
      console.log('❌ Contract NOT found in database');
      console.log('Available contracts:', parsed.contracts.map(c => c.id));
    }

    // Step 4: Fetch via GET API
    console.log('\nStep 4: Fetching via GET API...');
    const getResponse = await fetch(`http://localhost:3000/api/contracts?id=${testContract.id}`);
    
    if (getResponse.ok) {
      const fetchedContract = await getResponse.json();
      console.log('✓ Contract fetched successfully via API');
      console.log('Fetched contract name:', fetchedContract.name);
    } else {
      console.log('❌ Failed to fetch contract via API');
    }

    console.log('\n=== Test Complete ===');
    console.log(`\nYou can now access the contract at:`);
    console.log(`http://localhost:3000/contract/${testContract.id}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

testContractUpload();
