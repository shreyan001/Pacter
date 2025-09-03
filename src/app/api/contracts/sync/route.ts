import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
// Import shared cache and functions from main contracts route
import { contractsCache, cacheInitialized, initializeCache } from '../route'

interface DeployedContract {
  id: string;
  name: string;
  contractAddress: string;
  abi: any[];
  bytecode: string;
  contractType: string;
  partyA: string;
  partyB?: string;
  deployedAt: string;
  transactionHash?: string;
  networkId?: string;
  description?: string;
  partyASignatureStatus?: boolean;
  partyBSignatureStatus?: boolean;
  partyAAddress?: string;
  partyBAddress?: string;
  partyASignature?: string;
  partyBSignature?: string;
}

const CONTRACTS_FILE = path.join(process.cwd(), 'src', 'lib', 'deployedContracts.json')
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'

// initializeCache function is imported from the main route

// POST - Sync contracts from client localStorage to server cache
export async function POST(request: NextRequest) {
  try {
    const { contracts } = await request.json()
    
    if (!Array.isArray(contracts)) {
      return NextResponse.json({ error: 'Contracts must be an array' }, { status: 400 })
    }
    
    initializeCache()
    
    // Merge client contracts with server cache (avoid duplicates)
    const existingIds = new Set(contractsCache.map(c => c.id))
    const newContracts = contracts.filter(contract => !existingIds.has(contract.id))
    
    contractsCache.push(...newContracts)
    
    console.log(`Sync: Added ${newContracts.length} new contracts from client. Total: ${contractsCache.length}`)
    
    // In development, also write to file
    if (!isProduction) {
      try {
        fs.writeFileSync(CONTRACTS_FILE, JSON.stringify(contractsCache, null, 2))
        console.log('Sync: Development - contracts synced to file')
      } catch (writeError) {
        console.log('Sync: Development - error writing to file:', writeError.message)
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      synced: newContracts.length,
      total: contractsCache.length 
    })
  } catch (error) {
    console.error('Sync: Error syncing contracts:', error)
    return NextResponse.json({ error: 'Failed to sync contracts' }, { status: 500 })
  }
}

// GET - Get all contracts for client to sync with localStorage
export async function GET(request: NextRequest) {
  try {
    initializeCache()
    return NextResponse.json({ contracts: contractsCache })
  } catch (error) {
    console.error('Sync: Error getting contracts:', error)
    return NextResponse.json({ error: 'Failed to get contracts' }, { status: 500 })
  }
}