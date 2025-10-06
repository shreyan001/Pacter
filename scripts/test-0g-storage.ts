import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { ZeroGStorageService } from '../src/lib/0gStorageService';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function testZeroGStorage() {
  console.log('🚀 Starting 0G Storage test...');
  
  // Check for required environment variables
  const privateKey = process.env['0G_PRIVATE_KEY'];
  if (!privateKey) {
    console.error('❌ 0G_PRIVATE_KEY not found in environment variables');
    process.exit(1);
  }

  try {
    // Initialize the service
    const storageService = new ZeroGStorageService();
    
    // Test file path - using logo.png from public folder
    const testFilePath = path.join(__dirname, '..', 'public', 'logo.png');
    console.log(`📁 Testing with file: ${testFilePath}`);
    
    // Check if file exists
    if (!fs.existsSync(testFilePath)) {
      console.error(`❌ Test file not found: ${testFilePath}`);
      process.exit(1);
    }
    
    // Create downloads directory
    const downloadsDir = path.join(__dirname, '..', 'downloads');
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
      console.log(`📁 Created downloads directory: ${downloadsDir}`);
    }
    
    // Run the test
    await storageService.testUploadDownload(testFilePath, downloadsDir);
    
    console.log('✅ 0G Storage test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testZeroGStorage();