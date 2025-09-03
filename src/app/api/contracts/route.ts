'use server'
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONTRACTS_FILE = path.join(process.cwd(), 'src', 'lib', 'deployedContracts.json');

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

// GET - Retrieve all deployed contracts or a specific contract by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get('id');
    
    // Read contracts from JSON file
    let contracts: DeployedContract[] = [];
    if (fs.existsSync(CONTRACTS_FILE)) {
      const fileContent = fs.readFileSync(CONTRACTS_FILE, 'utf-8');
      contracts = JSON.parse(fileContent);
    }
    
    if (contractId) {
      const contract = contracts.find(c => c.id === contractId);
      if (!contract) {
        return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
      }
      return NextResponse.json(contract);
    }
    
    return NextResponse.json(contracts);
  } catch (error) {
    console.error('Error reading contracts:', error);
    return NextResponse.json({ error: 'Failed to read contracts' }, { status: 500 });
  }
}

// POST - Store a new deployed contract
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/contracts - Starting contract storage');
    
    // Parse request body
    let contractData: Omit<DeployedContract, 'id' | 'deployedAt'>;
    try {
      contractData = await request.json();
      console.log('Contract data received:', JSON.stringify(contractData, null, 2));
    } catch (parseError) {
      console.error('Error parsing request JSON:', parseError);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    // Validate required fields
    if (!contractData.name || !contractData.contractAddress || !contractData.partyA) {
      console.error('Missing required fields:', { name: contractData.name, contractAddress: contractData.contractAddress, partyA: contractData.partyA });
      return NextResponse.json({ error: 'Missing required fields: name, contractAddress, or partyA' }, { status: 400 });
    }
    
    // Generate unique ID
    const contractId = `${contractData.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    console.log('Generated contract ID:', contractId);
    
    const newContract: DeployedContract = {
      id: contractId,
      ...contractData,
      deployedAt: new Date().toISOString(),
      partyASignatureStatus: false,
      partyBSignatureStatus: false
    };
    
    console.log('New contract object:', JSON.stringify(newContract, null, 2));
    
    // Check if contracts file exists and is accessible
    console.log('Contracts file path:', CONTRACTS_FILE);
    console.log('File exists:', fs.existsSync(CONTRACTS_FILE));
    
    // Read existing contracts
    let contracts: DeployedContract[] = [];
    if (fs.existsSync(CONTRACTS_FILE)) {
      try {
        const fileContent = fs.readFileSync(CONTRACTS_FILE, 'utf-8');
        console.log('File content length:', fileContent.length);
        contracts = JSON.parse(fileContent);
        console.log('Existing contracts count:', contracts.length);
      } catch (readError) {
        console.error('Error reading/parsing existing contracts file:', readError);
        return NextResponse.json({ error: 'Error reading existing contracts file' }, { status: 500 });
      }
    } else {
      console.log('Contracts file does not exist, will create new one');
    }
    
    // Add new contract
    contracts.push(newContract);
    console.log('Total contracts after adding new one:', contracts.length);
    
    // Write back to file
    try {
      const jsonString = JSON.stringify(contracts, null, 2);
      console.log('Writing JSON string length:', jsonString.length);
      fs.writeFileSync(CONTRACTS_FILE, jsonString);
      console.log('Successfully wrote contracts file');
    } catch (writeError) {
      console.error('Error writing contracts file:', writeError);
      return NextResponse.json({ error: 'Error writing contracts file' }, { status: 500 });
    }
    
    console.log('Contract storage completed successfully');
    return NextResponse.json({ success: true, contract: newContract }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/contracts:', error);
    return NextResponse.json({ 
      error: 'Failed to store contract', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Update an existing contract
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get('id');
    
    if (!contractId) {
      return NextResponse.json({ error: 'Contract ID is required' }, { status: 400 });
    }
    
    const updateData = await request.json();
    
    // Read existing contracts
    let contracts: DeployedContract[] = [];
    if (fs.existsSync(CONTRACTS_FILE)) {
      const fileContent = fs.readFileSync(CONTRACTS_FILE, 'utf-8');
      contracts = JSON.parse(fileContent);
    }
    
    // Find and update contract
    const contractIndex = contracts.findIndex(c => c.id === contractId);
    if (contractIndex === -1) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }
    
    contracts[contractIndex] = { ...contracts[contractIndex], ...updateData };
    
    // Write back to file
    fs.writeFileSync(CONTRACTS_FILE, JSON.stringify(contracts, null, 2));
    
    return NextResponse.json({ success: true, contract: contracts[contractIndex] });
  } catch (error) {
    console.error('Error updating contract:', error);
    return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 });
  }
}

// PATCH - Update signature status for a specific party
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get('id');
    
    if (!contractId) {
      return NextResponse.json({ error: 'Contract ID is required' }, { status: 400 });
    }
    
    const { party, address, signature, signatureStatus } = await request.json();
    
    if (!party || !['A', 'B'].includes(party)) {
      return NextResponse.json({ error: 'Valid party (A or B) is required' }, { status: 400 });
    }
    
    // Read existing contracts
    let contracts: DeployedContract[] = [];
    if (fs.existsSync(CONTRACTS_FILE)) {
      const fileContent = fs.readFileSync(CONTRACTS_FILE, 'utf-8');
      contracts = JSON.parse(fileContent);
    }
    
    // Find contract
    const contractIndex = contracts.findIndex(c => c.id === contractId);
    if (contractIndex === -1) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }
    
    // Update signature data
    const updateFields: Partial<DeployedContract> = {};
    
    if (party === 'A') {
      updateFields.partyASignatureStatus = signatureStatus;
      if (address) updateFields.partyAAddress = address;
      if (signature) updateFields.partyASignature = signature;
    } else {
      updateFields.partyBSignatureStatus = signatureStatus;
      if (address) updateFields.partyBAddress = address;
      if (signature) updateFields.partyBSignature = signature;
      if (address && !contracts[contractIndex].partyB) {
        updateFields.partyB = address;
      }
    }
    
    contracts[contractIndex] = { ...contracts[contractIndex], ...updateFields };
    
    // Write back to file
    fs.writeFileSync(CONTRACTS_FILE, JSON.stringify(contracts, null, 2));
    
    return NextResponse.json({ success: true, contract: contracts[contractIndex] });
  } catch (error) {
    console.error('Error updating signature status:', error);
    return NextResponse.json({ error: 'Failed to update signature status' }, { status: 500 });
  }
}