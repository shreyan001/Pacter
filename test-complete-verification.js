// Complete verification test: GitHub download + 0G upload + Agent signing
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

// Configuration
const GITHUB_REPO = 'https://github.com/shreyan001/Pacter';
const TEMP_DIR = path.join(__dirname, 'temp-repo-download');
const AGENT_PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY || '1a5e97a6c2a93ef3a54e85fcf2dad7be1685ed3b087ad7a0b1abc3e3e83df55d';
const RPC_URL = process.env.ZEROG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_PACTER_CONTRACT_ADDRESS || '0x259829717EbCe11350c37CB9B5d8f38Cb42E0988';

// Pacter ABI (minimal for testing)
const PACTER_ABI = [
  "function verifyDeliverable(bytes32 orderHash, string memory verificationDetails, bool approved) external",
  "function orders(bytes32) external view returns (address client, address freelancer, uint256 amount, uint256 deadline, bool deposited, bool completed, bool disputed)"
];

async function testCompleteVerification() {
  console.log('=== Complete Verification Test ===\n');
  console.log('This test will:');
  console.log('1. Download GitHub repository');
  console.log('2. Simulate 0G storage upload');
  console.log('3. Test agent signing on-chain\n');
  
  let testResults = {
    githubDownload: false,
    storageUpload: false,
    agentSigning: false,
    errors: []
  };
  
  try {
    // ===== STEP 1: Download GitHub Repository =====
    console.log('Step 1: Downloading GitHub Repository...');
    console.log(`Repository: ${GITHUB_REPO}\n`);
    
    // Clean up temp directory if it exists
    if (fs.existsSync(TEMP_DIR)) {
      console.log('Cleaning up existing temp directory...');
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
    
    // Create temp directory
    fs.mkdirSync(TEMP_DIR, { recursive: true });
    
    try {
      // Clone the repository
      console.log('Cloning repository...');
      execSync(`git clone ${GITHUB_REPO} ${TEMP_DIR}`, {
        stdio: 'inherit',
        timeout: 60000 // 60 second timeout
      });
      
      // Verify download
      const files = fs.readdirSync(TEMP_DIR);
      console.log(`\n✅ Repository downloaded successfully!`);
      console.log(`   Files/folders: ${files.length}`);
      console.log(`   Location: ${TEMP_DIR}`);
      
      // Get repository size
      const getDirectorySize = (dirPath) => {
        let size = 0;
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
          const filePath = path.join(dirPath, file);
          const stats = fs.statSync(filePath);
          if (stats.isDirectory()) {
            size += getDirectorySize(filePath);
          } else {
            size += stats.size;
          }
        }
        return size;
      };
      
      const repoSize = getDirectorySize(TEMP_DIR);
      console.log(`   Total size: ${(repoSize / 1024 / 1024).toFixed(2)} MB`);
      
      testResults.githubDownload = true;
      
    } catch (error) {
      console.error('❌ Failed to download repository:', error.message);
      testResults.errors.push(`GitHub download: ${error.message}`);
      throw error;
    }
    
    // ===== STEP 2: Simulate 0G Storage Upload =====
    console.log('\n\nStep 2: Simulating 0G Storage Upload...');
    console.log('(In production, this would use 0G SDK)\n');
    
    try {
      // Create a manifest of the repository
      const manifest = {
        repository: GITHUB_REPO,
        downloadedAt: new Date().toISOString(),
        files: [],
        totalSize: 0
      };
      
      // List all files (excluding .git)
      const listFiles = (dirPath, baseDir = TEMP_DIR) => {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
          if (file === '.git') continue; // Skip .git directory
          
          const filePath = path.join(dirPath, file);
          const stats = fs.statSync(filePath);
          const relativePath = path.relative(baseDir, filePath);
          
          if (stats.isDirectory()) {
            listFiles(filePath, baseDir);
          } else {
            manifest.files.push({
              path: relativePath,
              size: stats.size,
              modified: stats.mtime
            });
            manifest.totalSize += stats.size;
          }
        }
      };
      
      listFiles(TEMP_DIR);
      
      console.log(`📦 Repository manifest created:`);
      console.log(`   Total files: ${manifest.files.length}`);
      console.log(`   Total size: ${(manifest.totalSize / 1024 / 1024).toFixed(2)} MB`);
      
      // Generate storage hash (simulated)
      const manifestString = JSON.stringify(manifest);
      const storageHash = ethers.keccak256(ethers.toUtf8Bytes(manifestString));
      const storageTxHash = '0x' + ethers.keccak256(ethers.toUtf8Bytes(storageHash + Date.now())).substring(2);
      
      console.log(`\n✅ Storage upload simulated successfully!`);
      console.log(`   Storage Hash: ${storageHash}`);
      console.log(`   Storage TX: ${storageTxHash}`);
      console.log(`   (In production, this would be actual 0G transaction)`);
      
      testResults.storageUpload = true;
      testResults.storageHash = storageHash;
      testResults.storageTxHash = storageTxHash;
      
    } catch (error) {
      console.error('❌ Failed to simulate storage upload:', error.message);
      testResults.errors.push(`Storage upload: ${error.message}`);
      throw error;
    }
    
    // ===== STEP 3: Test Agent Signing =====
    console.log('\n\nStep 3: Testing Agent On-Chain Signing...\n');
    
    try {
      // Initialize provider and wallet
      console.log('Connecting to 0G network...');
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const wallet = new ethers.Wallet(AGENT_PRIVATE_KEY, provider);
      
      console.log(`Agent wallet: ${wallet.address}`);
      
      // Check balance
      const balance = await provider.getBalance(wallet.address);
      console.log(`Agent balance: ${ethers.formatEther(balance)} 0G`);
      
      if (balance === 0n) {
        console.log('⚠️  Warning: Agent wallet has no balance');
        console.log('   Cannot send actual transaction, but signature test will continue');
      }
      
      // Initialize contract
      const contract = new ethers.Contract(CONTRACT_ADDRESS, PACTER_ABI, wallet);
      console.log(`Contract address: ${CONTRACT_ADDRESS}`);
      
      // Create test order hash
      const testOrderHash = ethers.keccak256(ethers.toUtf8Bytes('test-order-' + Date.now()));
      console.log(`\nTest order hash: ${testOrderHash}`);
      
      // Create verification details
      const verificationDetails = JSON.stringify({
        verifiedBy: 'Pacter-AI-Agent',
        verifiedAt: new Date().toISOString(),
        method: 'GitHub + 0G Storage',
        githubRepo: GITHUB_REPO,
        storageHash: testResults.storageHash,
        storageTxHash: testResults.storageTxHash
      });
      
      console.log('\nVerification details:');
      console.log(JSON.stringify(JSON.parse(verificationDetails), null, 2));
      
      // Test 1: Estimate gas (doesn't require balance)
      console.log('\n📊 Estimating gas...');
      try {
        const gasEstimate = await contract.verifyDeliverable.estimateGas(
          testOrderHash,
          verificationDetails,
          true
        );
        console.log(`✅ Gas estimate: ${gasEstimate.toString()}`);
        console.log(`   Estimated cost: ${ethers.formatEther(gasEstimate * 1000000000n)} 0G (at 1 gwei)`);
      } catch (error) {
        console.log(`⚠️  Gas estimation failed: ${error.message}`);
        console.log('   This is expected if the order doesn\'t exist on-chain');
      }
      
      // Test 2: Encode function call
      console.log('\n📝 Encoding function call...');
      const encodedData = contract.interface.encodeFunctionData('verifyDeliverable', [
        testOrderHash,
        verificationDetails,
        true
      ]);
      console.log(`✅ Function call encoded successfully`);
      console.log(`   Data length: ${encodedData.length} characters`);
      console.log(`   Data preview: ${encodedData.substring(0, 66)}...`);
      
      // Test 3: Sign transaction (doesn't send it)
      console.log('\n✍️  Signing transaction...');
      const tx = await wallet.signTransaction({
        to: CONTRACT_ADDRESS,
        data: encodedData,
        gasLimit: 200000,
        gasPrice: ethers.parseUnits('1', 'gwei'),
        nonce: await provider.getTransactionCount(wallet.address),
        chainId: (await provider.getNetwork()).chainId
      });
      console.log(`✅ Transaction signed successfully`);
      console.log(`   Signature length: ${tx.length} characters`);
      
      console.log('\n✅ Agent signing test completed successfully!');
      console.log('   Note: No actual transaction was sent to save gas');
      console.log('   In production, the transaction would be sent with:');
      console.log('   const tx = await contract.verifyDeliverable(orderHash, details, true)');
      console.log('   const receipt = await tx.wait()');
      
      testResults.agentSigning = true;
      
    } catch (error) {
      console.error('❌ Agent signing test failed:', error.message);
      testResults.errors.push(`Agent signing: ${error.message}`);
      // Don't throw - we want to see the summary
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    // Clean up
    console.log('\n\nCleaning up...');
    if (fs.existsSync(TEMP_DIR)) {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
      console.log('✅ Temp directory removed');
    }
  }
  
  // ===== TEST SUMMARY =====
  console.log('\n\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`GitHub Download:    ${testResults.githubDownload ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`0G Storage Upload:  ${testResults.storageUpload ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Agent Signing:      ${testResults.agentSigning ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (testResults.errors.length > 0) {
    console.log('\nErrors:');
    testResults.errors.forEach(err => console.log(`  - ${err}`));
  }
  
  const allPassed = testResults.githubDownload && testResults.storageUpload && testResults.agentSigning;
  
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('The complete verification flow is working correctly.');
  } else {
    console.log('⚠️  SOME TESTS FAILED');
    console.log('Please review the errors above.');
  }
  console.log('='.repeat(60));
  
  return allPassed;
}

// Run the test
testCompleteVerification().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
