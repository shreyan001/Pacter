/**
 * Redis Upload Test
 * This script tests if data is being uploaded to Redis by fetching the entire database object
 */

const UPSTASH_REDIS_REST_URL = "https://bursting-gibbon-19323.upstash.io";
const UPSTASH_REDIS_REST_TOKEN = "AUt7AAIncDIwMGUzNjg2ZDQyYzc0NTIyODJlZTQ5YzAwZDkxMGMyZXAyMTkzMjM";

async function testRedisUpload() {
  console.log("=".repeat(60));
  console.log("REDIS UPLOAD TEST");
  console.log("=".repeat(60));
  console.log();

  try {
    // Fetch the entire database object from Redis
    console.log("Fetching database from Redis...");
    const response = await fetch(`${UPSTASH_REDIS_REST_URL}/get/database`, {
      headers: {
        Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("✓ Successfully connected to Redis");
    console.log();

    // Display the raw response
    console.log("-".repeat(60));
    console.log("RAW REDIS RESPONSE:");
    console.log("-".repeat(60));
    console.log(JSON.stringify(data, null, 2));
    console.log();

    // Parse and display the database structure
    if (data.result) {
      const database = data.result;
      
      console.log("-".repeat(60));
      console.log("DATABASE STRUCTURE:");
      console.log("-".repeat(60));
      console.log(`Total contracts: ${database.contracts?.length || 0}`);
      console.log();

      if (database.contracts && database.contracts.length > 0) {
        console.log("-".repeat(60));
        console.log("CONTRACTS FOUND:");
        console.log("-".repeat(60));
        
        database.contracts.forEach((contract, index) => {
          console.log(`\n[${index + 1}] Contract ID: ${contract.id}`);
          console.log(`    Name: ${contract.name}`);
          console.log(`    Address: ${contract.contractAddress}`);
          console.log(`    Type: ${contract.contractType}`);
          console.log(`    Party A: ${contract.partyA}`);
          console.log(`    Party B: ${contract.partyB || "Not set"}`);
          console.log(`    Deployed At: ${contract.deployedAt}`);
          console.log(`    Party A Signed: ${contract.partyASignatureStatus || false}`);
          console.log(`    Party B Signed: ${contract.partyBSignatureStatus || false}`);
        });
        console.log();
      } else {
        console.log("⚠ No contracts found in database");
        console.log();
      }

      // Display full database object
      console.log("-".repeat(60));
      console.log("FULL DATABASE OBJECT:");
      console.log("-".repeat(60));
      console.log(JSON.stringify(database, null, 2));
      console.log();
    } else {
      console.log("⚠ No data found in Redis (database key is empty)");
      console.log();
    }

    console.log("=".repeat(60));
    console.log("TEST COMPLETED SUCCESSFULLY");
    console.log("=".repeat(60));

  } catch (error) {
    console.error("❌ ERROR:", error.message);
    console.error();
    console.error("Full error:", error);
  }
}

// Run the test
testRedisUpload();
