// test.ts - Extract and display NFT data from the minted token
import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

// Load contract ABIs
let IndiaFreelanceLegalNFTAbi: any;
let teeVerifierAbi: any;

try {
  // Load IndiaFreelanceLegalNFT implementation ABI from build artifacts
  const IndiaFreelanceLegalNFTArtifact = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../build/artifacts/contracts/IndiaFreelanceLegalNFT.sol/IndiaFreelanceLegalNFT.json"),
      "utf8"
    )
  );
  IndiaFreelanceLegalNFTAbi = IndiaFreelanceLegalNFTArtifact.abi;
  
  const teeVerifierDeployment = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../deployments/zgTestnet/TEEVerifier.json"),
      "utf8"
    )
  );
  teeVerifierAbi = teeVerifierDeployment.abi;
} catch (error) {
  console.error("Error loading contract ABIs:", error);
  process.exit(1);
}

async function extractNFTData() {
  try {
    console.log("🔍 Extracting NFT Data from Minted Token...");
    console.log("=".repeat(50));
    
    // Setup provider and signer
    const provider = new ethers.JsonRpcProvider(process.env.OG_RPC_URL);
    const signer = new ethers.Wallet(process.env.ZG_AGENT_NFT_CREATOR_PRIVATE_KEY!, provider);
    
    // Get contract addresses from deployment files
    const IndiaFreelanceLegalNFTDeployment = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "../deployments/zgTestnet/IndiaFreelanceLegalNFT.json"),
        "utf8"
      )
    );
    const contractAddress = IndiaFreelanceLegalNFTDeployment.address;
    
    const teeVerifierDeployment = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "../deployments/zgTestnet/TEEVerifier.json"),
        "utf8"
      )
    );
    const teeVerifierAddress = teeVerifierDeployment.address;
    
    console.log(`📋 Contract Information:`);
    console.log(`   IndiaFreelanceLegalNFT Address: ${contractAddress}`);
    console.log(`   TEEVerifier Address: ${teeVerifierAddress}`);
    console.log(`   Signer Address: ${signer.address}`);
    console.log();
    
    // Create contract instances
    const IndiaFreelanceLegalNFT = new ethers.Contract(contractAddress, IndiaFreelanceLegalNFTAbi, signer);
    const teeVerifier = new ethers.Contract(teeVerifierAddress, teeVerifierAbi, signer);
    
    // Read the saved token details
    const tokenDetailsPath = path.join(__dirname, "output/token_0.json");
    let tokenDetails: any = {};
    
    if (fs.existsSync(tokenDetailsPath)) {
      tokenDetails = JSON.parse(fs.readFileSync(tokenDetailsPath, "utf8"));
      console.log(`📄 Loaded Token Details from: ${tokenDetailsPath}`);
      console.log(`   Token ID: ${tokenDetails.tokenId}`);
      console.log(`   Owner: ${tokenDetails.owner}`);
      console.log(`   Timestamp: ${tokenDetails.timestamp}`);
      console.log();
    } else {
      console.log(`⚠️  Token details file not found at: ${tokenDetailsPath}`);
      console.log(`   Will extract data directly from contract...`);
      console.log();
    }
    
    // Extract data from the contract
    const tokenId = 0; // We know we minted token ID 0
    
    console.log(`🎯 Extracting Data for Token ID: ${tokenId}`);
    console.log("-".repeat(40));
    
    try {
      // Get token owner
      const owner = await IndiaFreelanceLegalNFT.ownerOf(tokenId);
      console.log(`👤 Token Owner: ${owner}`);
      
      // Get token URI if available
      try {
        const tokenURI = await IndiaFreelanceLegalNFT.tokenURI(tokenId);
        console.log(`🔗 Token URI: ${tokenURI}`);
      } catch (error) {
        console.log(`🔗 Token URI: Not available or not implemented`);
      }
      
      // Get data descriptions and hashes
      const dataDescriptions = await IndiaFreelanceLegalNFT.dataDescriptionsOf(tokenId);
      const dataHashes = await IndiaFreelanceLegalNFT.dataHashesOf(tokenId);
      
      console.log();
      console.log(`📊 Stored Data (${dataDescriptions.length} entries):`);
      console.log("=".repeat(50));
      
      for (let i = 0; i < dataDescriptions.length; i++) {
        console.log(`\n📋 Entry ${i + 1}:`);
        console.log(`   Description: ${dataDescriptions[i]}`);
        console.log(`   Data Hash: ${dataHashes[i]}`);
        console.log(`   Hash Length: ${dataHashes[i].length} characters`);
        
        // Verify this hash with TEEVerifier
        try {
          console.log(`   🔍 Verifying with TEEVerifier...`);
          const verificationResult = await teeVerifier.verifyPreimage([dataHashes[i]]);
          const isValid = verificationResult[0][1]; // [dataHash, isValid]
          console.log(`   ✅ Verification Result: ${isValid ? 'VALID' : 'INVALID'}`);
        } catch (verifyError: any) {
          console.log(`   ❌ Verification Failed: ${verifyError?.message || 'Unknown error'}`);
        }
      }
      
      console.log();
      console.log(`🔢 Summary:`);
      console.log(`   Total Data Entries: ${dataDescriptions.length}`);
      console.log(`   All Hashes are 32-byte values: ${dataHashes.every((hash: string) => hash.length === 66)}`);
      console.log(`   Contract Address: ${contractAddress}`);
      console.log(`   Token ID: ${tokenId}`);
      
      // Display the original data that was hashed (from our constants)
      console.log();
      console.log(`📝 Original Data Sources:`);
      console.log("-".repeat(30));
      
      const originalData = [
        {
          name: "EscrowAgent Prompt Template",
          content: "Specialized prompt for 0G to NFT escrow contracts"
        },
        {
          name: "Model Providers Configuration", 
          content: "llama-3.3-70b-instruct and deepseek-r1-70b configuration"
        },
        {
          name: "Agent Context",
          content: "EscrowAgent AI Model specialized configuration"
        }
      ];
      
      originalData.forEach((data, i) => {
        console.log(`\n${i + 1}. ${data.name}:`);
        console.log(`   Content: ${data.content}`);
        if (i < dataHashes.length) {
          console.log(`   Stored Hash: ${dataHashes[i]}`);
        }
      });
      
    } catch (contractError: any) {
      console.error(`❌ Error reading from contract:`, contractError?.message || contractError);
    }
    
  } catch (error: any) {
    console.error(`❌ Error in extractNFTData:`, error?.message || error);
  }
}

// Run the extraction
extractNFTData().catch((error: any) => {
  console.error("❌ Unhandled error:", error?.message || error);
  process.exit(1);
});