const { Redis } = require('@upstash/redis');
require('dotenv').config();

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function testContractFetch() {
  try {
    console.log('=== Testing Contract Fetch ===\n');
    
    const contractId = 'contract_1759916816601';
    
    // Test 1: Try to fetch with the individual key pattern
    console.log('Test 1: Fetching with key pattern contract:${contractId}');
    const individualKey = `contract:${contractId}`;
    const contract1 = await redis.get(individualKey);
    if (contract1) {
      console.log('✓ Found contract with individual key!');
      console.log('Contract data:', JSON.parse(contract1));
    } else {
      console.log('✗ No contract found with individual key');
    }
    
    console.log('\n---\n');
    
    // Test 2: Try to fetch from database key
    console.log('Test 2: Fetching from database key');
    const databaseKey = 'database';
    const database = await redis.get(databaseKey);
    if (database) {
      // Upstash returns objects directly, no need to parse
      const parsed = typeof database === 'string' ? JSON.parse(database) : database;
      console.log('✓ Found database key!');
      console.log('Database structure:', Object.keys(parsed));
      console.log('Number of contracts:', parsed.contracts?.length || 0);
      
      if (parsed.contracts) {
        const found = parsed.contracts.find(c => c.id === contractId);
        if (found) {
          console.log('✓ Found contract in database array!');
          console.log('Contract:', JSON.stringify(found, null, 2));
        } else {
          console.log('✗ Contract not found in database array');
          console.log('Available contract IDs:', parsed.contracts.map(c => c.id));
        }
      }
    } else {
      console.log('✗ No database key found');
    }
    
    console.log('\n---\n');
    
    // Test 3: List all keys (Upstash doesn't support keys command in REST API)
    console.log('Test 3: Trying common key patterns');
    const commonKeys = [
      'database',
      `contract:${contractId}`,
      contractId,
      'contracts',
      'pacter:contracts'
    ];
    
    for (const key of commonKeys) {
      const data = await redis.get(key);
      if (data) {
        console.log(`✓ Found data at key: ${key}`);
        console.log('Data type:', typeof data);
        console.log('Data:', JSON.stringify(data, null, 2));
        console.log('---');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    console.log('\n=== Test Complete ===');
  }
}

testContractFetch();
