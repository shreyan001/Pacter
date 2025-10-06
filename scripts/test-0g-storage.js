import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { Indexer, ZgFile } from '@0glabs/0g-ts-sdk';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env' });

async function main() {
  try {
    console.log('🚀 Starting 0G Storage Test...');
    
    // Check for private key
    const privateKey = process.env['0G_PRIVATE_KEY'];
    if (!privateKey) {
      console.error('❌ 0G_PRIVATE_KEY not found in environment variables');
      process.exit(1);
    }
    
    console.log('✅ Private key found');
    
    // Initialize wallet with provider
    const rpcUrl = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`📝 Wallet address: ${wallet.address}`);
    
    // Initialize indexer
    const indexerUrl = 'https://indexer-storage-testnet-turbo.0g.ai';
    const indexer = new Indexer(indexerUrl);
    console.log('🔗 Indexer initialized');
    
    // Test file path
    const testFilePath = path.join(process.cwd(), 'public', 'legalPrompt.txt');
    
    if (!fs.existsSync(testFilePath)) {
      console.error(`❌ Test file not found: ${testFilePath}`);
      process.exit(1);
    }
    
    console.log(`📁 Test file found: ${testFilePath}`);
    
    // Create ZgFile
    console.log('📤 Creating ZgFile...');
    const file = await ZgFile.fromFilePath(testFilePath);
    console.log('✅ ZgFile created successfully');
    
    // Upload file
    console.log('🚀 Starting upload...');
    const [result, err] = await indexer.upload(file, rpcUrl, wallet);
    
    if (err) {
      console.error('❌ Upload failed:', err);
      process.exit(1);
    }
    
    console.log('✅ Upload successful!');
    console.log(`📋 Transaction Hash: ${result.txHash}`);
    console.log(`🔑 Root Hash: ${result.rootHash}`);
    
    // Test download
    const downloadPath = path.join(process.cwd(), 'downloads', 'legal.txt');
    
    // Create downloads directory if it doesn't exist
    const downloadDir = path.dirname(downloadPath);
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }
    
    console.log('📥 Starting download...');
    const downloadErr = await indexer.download(result.rootHash, downloadPath, false);
    
    if (downloadErr) {
      console.error('❌ Download failed:', downloadErr);
      process.exit(1);
    }
    
    console.log('✅ Download successful!');
    console.log(`💾 File saved to: ${downloadPath}`);
    
    // Verify file exists
    if (fs.existsSync(downloadPath)) {
      const stats = fs.statSync(downloadPath);
      console.log(`📊 Downloaded file size: ${stats.size} bytes`);
      console.log('🎉 0G Storage test completed successfully!');
    } else {
      console.error('❌ Downloaded file not found');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

main();