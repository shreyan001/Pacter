import { ethers } from 'ethers';
import { Indexer, ZgFile } from '@0glabs/0g-ts-sdk';
import * as fs from 'fs';
import * as path from 'path';

export interface UploadResult {
  success: boolean;
  rootHash?: string;
  txHash?: string;
  error?: string;
}

export interface DownloadResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export interface FileInfo {
  size: number;
  finalized: boolean;
  rootHash: string;
}

export class ZeroGStorageService {
  private indexer: Indexer;
  private wallet: ethers.Wallet;
  
  constructor() {
    // Get private key from environment
    const privateKey = process.env['0G_PRIVATE_KEY'];
    if (!privateKey) {
      throw new Error('0G_PRIVATE_KEY environment variable is required');
    }
    
    // Initialize wallet
    this.wallet = new ethers.Wallet(privateKey);
    
    // Initialize indexer with testnet URL
    this.indexer = new Indexer('https://indexer-storage-testnet-turbo.0g.ai');
  }

  /**
   * Get wallet address
   */
  getWalletAddress(): string {
    return this.wallet.address;
  }

  /**
   * Upload a file to 0G Storage
   */
  async uploadFile(filePath: string): Promise<UploadResult> {
    try {
      console.log(`📤 Starting upload for: ${filePath}`);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'File not found' };
      }

      // Create ZgFile from file path
      const file = await ZgFile.fromFilePath(filePath);
      
      console.log('📁 File loaded, starting upload...');
      
      // Upload file using the indexer
      const rpcUrl = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
      //@ts-ignore
      const [result, err] = await this.indexer.upload(file, rpcUrl, this.wallet);
      
      if (err) {
        console.error('❌ Upload failed:', err);
        return { success: false, error: err.message };
      }

      console.log('✅ Upload successful!');
      console.log(`📋 Transaction Hash: ${result.txHash}`);
      console.log(`🔑 Root Hash: ${result.rootHash}`);
      
      return {
        success: true,
        txHash: result.txHash,
        rootHash: result.rootHash
      };
    } catch (error) {
      console.error('❌ Upload error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Download a file from 0G Storage
   */
  async downloadFile(rootHash: string, outputPath: string): Promise<DownloadResult> {
    try {
      console.log(`📥 Downloading file with root hash: ${rootHash}`);
      
      // Download file
      const err = await this.indexer.download(rootHash, outputPath, false);
      
      if (err) {
        return {
          success: false,
          error: `Download failed: ${err}`
        };
      }
      
      console.log(`💾 File saved to: ${outputPath}`);
      console.log(`✅ File downloaded successfully!`);
      
      return {
        success: true,
        filePath: outputPath
      };
    } catch (error: any) {
      console.error('❌ Download error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get file information
   */
  async getFileInfo(rootHash: string): Promise<FileInfo | null> {
    try {
      console.log(`Getting file info for root hash: ${rootHash}`);
      
      // Note: getFileInfo method might not be available in this version of the SDK
      // This is a placeholder implementation
      console.log('File info retrieval not implemented in current SDK version');
      return null;
    } catch (error) {
      console.error('Failed to get file info:', error);
      return null;
    }
  }

  /**
   * Test upload and download workflow
   */
  async testUploadDownload(filePath: string, downloadDir: string): Promise<{
    uploadSuccess: boolean;
    downloadSuccess: boolean;
    filesMatch: boolean;
    rootHash?: string;
    error?: string;
  }> {
    try {
      console.log('\n🧪 Starting Upload/Download Test');
      console.log('==================================');
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      const originalSize = fs.statSync(filePath).size;
      console.log(`📁 Original file size: ${originalSize} bytes`);
      
      // Upload file
      const uploadResult = await this.uploadFile(filePath);
      
      if (!uploadResult.success) {
        return {
          uploadSuccess: false,
          downloadSuccess: false,
          filesMatch: false,
          error: uploadResult.error
        };
      }
      
      // Wait a moment for processing
      console.log('⏳ Waiting for file processing...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Get file info
      const fileInfo = await this.getFileInfo(uploadResult.rootHash!);
      
      // Download file
      const fileName = path.basename(filePath);
      const downloadPath = path.join(downloadDir, `downloaded_${fileName}`);
      const downloadResult = await this.downloadFile(uploadResult.rootHash!, downloadPath);
      
      if (!downloadResult.success) {
        return {
          uploadSuccess: true,
          downloadSuccess: false,
          filesMatch: false,
          rootHash: uploadResult.rootHash,
          error: downloadResult.error
        };
      }
      
      // Verify file integrity
      const originalBuffer = fs.readFileSync(filePath);
      const downloadedBuffer = fs.readFileSync(downloadPath);
      const isIdentical = Buffer.compare(originalBuffer, downloadedBuffer) === 0;
      
      console.log('\n📊 Test Results:');
      console.log(`   Original size: ${originalSize} bytes`);
      console.log(`   Downloaded size: ${downloadedBuffer.length} bytes`);
      console.log(`   Files identical: ${isIdentical ? '✅ Yes' : '❌ No'}`);
      console.log(`   Root hash: ${uploadResult.rootHash}`);
      console.log(`   Downloaded to: ${downloadPath}`);
      
      if (isIdentical) {
        console.log('\n🎉 Test completed successfully!');
      } else {
        console.log('\n❌ File integrity check failed');
      }
      
      return {
        uploadSuccess: true,
        downloadSuccess: true,
        filesMatch: isIdentical,
        rootHash: uploadResult.rootHash
      };
      
    } catch (error: any) {
      console.error('\n❌ Test failed:', error);
      return {
        uploadSuccess: false,
        downloadSuccess: false,
        filesMatch: false,
        error: error.message
      };
    }
  }
}