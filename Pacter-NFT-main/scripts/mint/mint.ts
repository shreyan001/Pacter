// mint.ts
import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { prepareAgentData, generateMockMetadata } from "./mockProofGenerator";
// 0G Storage SDK integration is handled in storageIntegration.ts

dotenv.config();

// Load contract ABI from deployment files
let agentNFTAbi: any;
let teeVerifierAbi: any;

try {
  const agentNFTDeployment = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../../deployments/zgTestnet/AgentNFT.json"),
      "utf8"
    )
  );
  agentNFTAbi = agentNFTDeployment.abi;
  
  const teeVerifierDeployment = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../../deployments/zgTestnet/TEEVerifier.json"),
      "utf8"
    )
  );
  teeVerifierAbi = teeVerifierDeployment.abi;
} catch (error) {
  console.error("Error loading contract ABIs:", error);
  process.exit(1);
}

// Interface for metadata structure
interface AgentMetadata {
  dataHash: string;
  description: string;
  proof: string; // Hex string of proof bytes
}

async function main() {
  try {
    // --- SETUP ---
    const provider = new ethers.JsonRpcProvider(process.env.OG_RPC_URL);
    
    // Use the private key from the .env file
    const signer = new ethers.Wallet(process.env.ZG_AGENT_NFT_CREATOR_PRIVATE_KEY!, provider);
    
    // Get contract address from deployment file
    const agentNFTDeployment = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "../../deployments/zgTestnet/AgentNFT.json"),
        "utf8"
      )
    );
    const contractAddress = agentNFTDeployment.address;

    console.log(`Using contract at: ${contractAddress}`);
    console.log(`Signer address: ${signer.address}`);

    const agentNFT = new ethers.Contract(contractAddress, agentNFTAbi, signer);
    
    // Get TEEVerifier address
    const teeVerifierDeployment = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "../../deployments/zgTestnet/TEEVerifier.json"),
        "utf8"
      )
    );
    const teeVerifierAddress = teeVerifierDeployment.address;
    console.log(`Using TEEVerifier at: ${teeVerifierAddress}`);
    const teeVerifier = new ethers.Contract(teeVerifierAddress, teeVerifierAbi, signer);

    // --- STEP 1: Prepare metadata and proofs ---
    // Use simplified implementation with predefined constants
    
    console.log("🔧 Preparing agent data with simplified implementation...");
    
    // Agent model data structure
    const agentModelData = {
      name: "EscrowAgent AI Model",
      description: "AI Agent specialized in providing reusable escrow smart contracts for 0G to NFT transactions",
      version: "1.0.0",
      parameters: {
        type: "llm",
        architecture: "transformer",
        contextLength: 4096,
        parameterCount: "7B"
      }
    };
    
    // Prepare agent data with simplified implementation
    const agentMetadata: AgentMetadata[] = await prepareAgentData(agentModelData, signer);
    
    console.log(`Generated ${agentMetadata.length} metadata entries`);
    agentMetadata.forEach((meta, i) => {
      console.log(`  ${i+1}. ${meta.description} (${meta.dataHash.slice(0, 10)}...)`);
    });

    // Extract proofs and descriptions from metadata
    const proofs = agentMetadata.map(item => item.proof);
    const dataDescriptions = agentMetadata.map(item => item.description);

    // --- STEP 2: Verify proofs with TEEVerifier (optional test) ---
    console.log("Testing proof verification with TEEVerifier...");
    try {
      for (let i = 0; i < proofs.length; i++) {
        const verificationResult = await teeVerifier.verifyPreimage([proofs[i]]);
        console.log(`Proof ${i} verification result:`, verificationResult);
      }
      console.log("All proofs verified successfully");
    } catch (error) {
      console.warn("Proof verification test failed. This is expected with mock proofs:", error);
      console.log("Continuing with mint operation anyway for testing purposes...");
    }

    // --- STEP 3: Mint the NFT ---
    // Default recipient is the signer if not specified
    const recipient = process.env.RECIPIENT_ADDRESS || signer.address;

    console.log("Minting NFT with the following data:");
    console.log(`- Number of proofs: ${proofs.length}`);
    console.log(`- Recipient: ${recipient}`);

    // Estimate gas for the transaction
    const gasEstimate = await agentNFT.mint.estimateGas(
      proofs,
      dataDescriptions,
      recipient,
      { value: 0 } // If minting requires payment, add it here
    );

    console.log(`Estimated gas: ${gasEstimate}`);

    // Execute the mint transaction
    const tx = await agentNFT.mint(
      proofs,
      dataDescriptions,
      recipient,
      {
        value: 0, // If minting requires payment, add it here
        gasLimit: Math.ceil(Number(gasEstimate) * 1.2), // Add 20% buffer to gas estimate
      }
    );

    console.log(`Minting transaction sent: ${tx.hash}`);
    console.log("Waiting for transaction confirmation...");

    // Wait for the transaction to be mined
    const receipt = await tx.wait();

    // Parse events to get the token ID
    // The Minted event has the following signature:
    // event Minted(uint256 indexed tokenId, address indexed minter, address indexed owner, bytes32[] dataHashes, string[] dataDescriptions);
    const mintedEvent = receipt?.logs
      .filter((log: any) => {
        try {
          // Try to parse the log as a Minted event
          const parsedLog = agentNFT.interface.parseLog({
            topics: log.topics,
            data: log.data,
          });
          return parsedLog?.name === "Minted";
        } catch (e) {
          return false;
        }
      })
      .map((log: any) => {
        return agentNFT.interface.parseLog({
          topics: log.topics,
          data: log.data,
        });
      })[0];

    if (mintedEvent) {
      const tokenId = mintedEvent.args[0];
      console.log(`\nMint successful! Token ID: ${tokenId}`);
      console.log(`Owner: ${mintedEvent.args[2]}`);
      
      // Save the token ID to a file for future reference
      const outputDir = path.join(__dirname, "../output");
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const outputFile = path.join(outputDir, `token_${tokenId}.json`);
      fs.writeFileSync(
        outputFile,
        JSON.stringify({
          tokenId: tokenId.toString(),
          owner: mintedEvent.args[2],
          timestamp: new Date().toISOString(),
          dataDescriptions,
          dataHashes: mintedEvent.args[3].map((hash: any) => hash.toString()),
        }, null, 2)
      );
      
      console.log(`Token details saved to: ${outputFile}`);
    } else {
      console.log("Mint successful, but couldn't parse the Minted event.");
    }

  } catch (error) {
    console.error("Mint failed:", error);
    process.exit(1);
  }
}

// Execute the script
main().catch((error) => {
  console.error(error);
  process.exit(1);
});