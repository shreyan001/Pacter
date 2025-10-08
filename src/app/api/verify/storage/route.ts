// Step 2: 0G Storage Upload
import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import { ZeroGStorageService } from '@/lib/0gStorageService'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

async function uploadTo0GStorage(githubUrl: string, repoInfo: any) {
  try {
    console.log('📤 Starting real 0G storage upload...')
    
    // Create metadata JSON
    const metadata = {
      githubUrl,
      repoInfo,
      uploadedAt: new Date().toISOString(),
      verificationAgent: 'Pacter-AI-Agent',
      contractType: 'Pacter-Escrow-Contract',
      version: '1.0.0'
    }
    
    // Create temporary file with metadata
    const tempDir = os.tmpdir()
    const tempFilePath = path.join(tempDir, `pacter_metadata_${Date.now()}.json`)
    fs.writeFileSync(tempFilePath, JSON.stringify(metadata, null, 2))
    
    console.log('📝 Metadata file created:', tempFilePath)
    
    try {
      // Initialize 0G Storage Service
      const storageService = new ZeroGStorageService()
      console.log('🔗 Connected to 0G Storage with wallet:', storageService.getWalletAddress())
      
      // Upload to 0G Storage
      const uploadResult = await storageService.uploadFile(tempFilePath)
      
      // Clean up temp file
      fs.unlinkSync(tempFilePath)
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed')
      }
      
      console.log('✅ Upload successful!')
      console.log('📋 Root Hash:', uploadResult.rootHash)
      console.log('📋 TX Hash:', uploadResult.txHash)
      
      return {
        success: true,
        storageHash: uploadResult.rootHash,
        storageTxHash: uploadResult.txHash,
      }
    } catch (uploadError: any) {
      // Clean up temp file on error
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath)
      }
      throw uploadError
    }
  } catch (error: any) {
    console.error('❌ Storage upload error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { githubUrl, repoInfo } = await request.json()
    
    if (!githubUrl || !repoInfo) {
      return NextResponse.json(
        { error: 'GitHub URL and repo info are required' },
        { status: 400 }
      )
    }
    
    const result = await uploadTo0GStorage(githubUrl, repoInfo)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }
    
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Storage upload failed' },
      { status: 500 }
    )
  }
}
