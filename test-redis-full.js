/**
 * Full Redis Test - Upload and Verify
 * This script:
 * 1. Creates a test contract via the API
 * 2. Fetches it back to verify storage
 * 3. Shows the entire database object
 */

const API_BASE_URL = "http://localhost:3000";
const UPSTASH_REDIS_REST_URL = "https://bursting-gibbon-19323.upstash.io";
const UPSTASH_REDIS_REST_TOKEN = "AUt7AAIncDIwMGUzNjg2ZDQyYzc0NTIyODJlZTQ5YzAwZDkxMGMyZXAyMTkzMjM";

// Test contract data
const testContract = {
  name: "Test Contract",
  contractAddress: "0x1234567890123456789012345678901234567890",
  abi: [
    {
      "inputs": [],
      "name": "test",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],
  bytecode: "0x608060405234801561001057600080fd5b50",
  contractType: "escrow",
  partyA: "0xPartyAAddress123456789012345678901234567890",
  partyB: "0xPartyBAddress123456789012345678901234567890",
  description: "This is a test contract to verify Redis upload",
  networkId: "testnet",
  transactionHash: "0xTestTransactionHash1234567890"
};

async function testFullRedisFlow() {
  console.log("=".repeat(70));
  console.log("FULL REDIS TEST - UPLOAD AND VERIFY");
  console.log("=".repeat(70));
  console.log();

  try {
    // Step 1: Create a test contract via API
    console.log("Step 1: Creating test contract via API...");
    console.log("-".repeat(70));
    
    const createResponse = await fetch(`${API_BASE_URL}/api/contracts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testContract),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Failed to create contract: ${createResponse.status} - ${errorText}`);
    }

    const createResult = await createResponse.json();
    console.log("✓ Contract created successfully!");
    console.log(`  Contract ID: ${createResult.contract.id}`);
    console.log(`  Contract Address: ${createResult.contract.contractAddress}`);
    console.log();

    // Step 2: Fetch all contracts via API
    console.log("Step 2: Fetching all contracts via API...");
    console.log("-".repeat(70));
    
    const fetchResponse = await fetch(`${API_BASE_URL}/api/contracts`);
    
    if (!fetchResponse.ok) {
      throw new Error(`Failed to fetch contracts: ${fetchResponse.status}`);
    }

    const allContracts = await fetchResponse.json();
    console.log(`✓ Found ${allContracts.length} contract(s) in database`);
    console.log();

    // Step 3: Fetch directly from Redis
    console.log("Step 3: Fetching directly from Redis...");
    console.log("-".repeat(70));
    
    const redisResponse = await fetch(`${UPSTASH_REDIS_REST_URL}/get/database`, {
      headers: {
        Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
      },
    });

    if (!redisResponse.ok) {
      throw new Error(`Redis fetch failed: ${redisResponse.status}`);
    }

    const redisData = await redisResponse.json();
    console.log("✓ Successfully fetched from Redis");
    console.log();

    // Display results
    console.log("=".repeat(70));
    console.log("RESULTS:");
    console.log("=".repeat(70));
    console.log();

    console.log("1. API Response (All Contracts):");
    console.log("-".repeat(70));
    console.log(JSON.stringify(allContracts, null, 2));
    console.log();

    console.log("2. Direct Redis Response:");
    console.log("-".repeat(70));
    console.log(JSON.stringify(redisData, null, 2));
    console.log();

    if (redisData.result && redisData.result.contracts) {
      console.log("3. Contract Details:");
      console.log("-".repeat(70));
      redisData.result.contracts.forEach((contract, index) => {
        console.log(`\n[${index + 1}] ${contract.name}`);
        console.log(`    ID: ${contract.id}`);
        console.log(`    Address: ${contract.contractAddress}`);
        console.log(`    Type: ${contract.contractType}`);
        console.log(`    Party A: ${contract.partyA}`);
        console.log(`    Party B: ${contract.partyB || "Not set"}`);
        console.log(`    Deployed: ${contract.deployedAt}`);
        console.log(`    Description: ${contract.description || "N/A"}`);
      });
      console.log();
    }

    console.log("=".repeat(70));
    console.log("✓ TEST COMPLETED SUCCESSFULLY");
    console.log("=".repeat(70));
    console.log();
    console.log("Summary:");
    console.log(`  - Contract created: ${createResult.contract.id}`);
    console.log(`  - Total contracts in Redis: ${redisData.result?.contracts?.length || 0}`);
    console.log(`  - Data is being uploaded to Redis: ${redisData.result ? "YES ✓" : "NO ✗"}`);

  } catch (error) {
    console.error();
    console.error("❌ ERROR:", error.message);
    console.error();
    console.error("Full error:", error);
    console.error();
    console.error("Make sure:");
    console.error("  1. Your Next.js dev server is running (npm run dev)");
    console.error("  2. The server is accessible at http://localhost:3000");
    console.error("  3. Redis credentials are correct");
  }
}

// Run the test
testFullRedisFlow();
