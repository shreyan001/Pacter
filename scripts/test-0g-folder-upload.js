import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { Indexer, ZgFile } from '@0glabs/0g-ts-sdk';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env' });

async function uploadFolder(folderPath) { 
  try {
    console.log(`🚀 Starting 0G Storage Folder Upload Test for: ${folderPath}`);
    
    // Check for private key
    const privateKey = process.env.AGENT_PRIVATE_KEY;
    if (!privateKey) {
      console.error('❌ AGENT_PRIVATE_KEY not found in environment variables');
      process.exit(1);
    }
    
    console.log('✅ Private key found');
    
    // Initialize wallet with provider
    const rpcUrl = process.env.ZEROG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`📝 Wallet address: ${wallet.address}`);
    
    // Initialize indexer
    const indexerUrl = 'https://indexer-storage-testnet-turbo.0g.ai';
    const indexer = new Indexer(indexerUrl);
    console.log('🔗 Indexer initialized');
    
    // Check if folder exists
    if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
      console.error(`❌ Folder not found or not a directory: ${folderPath}`);
      process.exit(1);
    }
    
    console.log(`📁 Folder found: ${folderPath}`);
    
    // Get all files in the folder
    const files = [];
    const processDirectory = (dirPath) => {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          processDirectory(fullPath);
        } else {
          files.push(fullPath);
        }
      }
    };
    
    processDirectory(folderPath);
    console.log(`📋 Found ${files.length} files in folder`);
    
    // Upload each file
    const uploadResults = [];
    
    for (const filePath of files) {
      const relativePath = path.relative(folderPath, filePath);
      console.log(`📤 Processing file: ${relativePath}`);
      
      // Create ZgFile
      const file = await ZgFile.fromFilePath(filePath);
      
      // Upload file
      console.log(`🚀 Starting upload for ${relativePath}...`);
      const [result, err] = await indexer.upload(file, rpcUrl, wallet);
      
      if (err) {
        console.error(`❌ Upload failed for ${relativePath}:`, err);
        continue;
      }
      
      console.log(`✅ Upload successful for ${relativePath}!`);
      console.log(`📋 Transaction Hash: ${result.txHash}`);
      console.log(`🔑 Root Hash: ${result.rootHash}`);
      
      uploadResults.push({
        filePath: relativePath,
        rootHash: result.rootHash,
        txHash: result.txHash
      });
    }
    
    // Save upload results to a JSON file
    const resultsPath = path.join(process.cwd(), 'upload-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(uploadResults, null, 2));
    console.log(`💾 Upload results saved to: ${resultsPath}`);
    
    console.log('🎉 0G Storage folder upload test completed!');
    console.log(`📊 Successfully uploaded ${uploadResults.length} of ${files.length} files`);
    
    return uploadResults;
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test with the specified folder
const testFolder = process.argv[2] || path.join(process.cwd(), 'public');
uploadFolder(testFolder);