import { StateGraph } from "@langchain/langgraph";
import { BaseMessage, AIMessage, HumanMessage } from "@langchain/core/messages";
import { START, END } from "@langchain/langgraph";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { ChatGroq } from "@langchain/groq";
import { z } from "zod";

const model = new ChatGroq({
    modelName: "llama-3.3-70b-versatile",
    temperature: 0.7,
    apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
});

// **Base Schema - Required for ALL escrow types**
const BaseInfoSchema = z.object({
    projectName: z.string().nullable().describe("Name of the project/website"),
    projectDescription: z.string().nullable().describe("Description of what needs to be built"),
    clientName: z.string().nullable().describe("Name of the client/company"),
    email: z.string().nullable().describe("Client email address"),
    walletAddress: z.string().nullable().describe("0G wallet address"),
    paymentAmount: z.number().nullable().describe("Payment amount in INR"),
    freelancerAddress: z.string().nullable().describe("Freelancer's 0G wallet address"),
    escrowType: z.enum(["simple", "milestone", "time_locked"]).nullable().describe("Type of escrow contract to use")
});

// **Simple Escrow Schema - PacterEscrowV2.sol (no additional fields needed)**
const SimpleEscrowSchema = z.object({
    // No additional fields - just uses base info
});

// **Milestone Escrow Schema - MilestoneEscrow.sol**
const MilestoneEscrowSchema = z.object({
    milestones: z.array(z.object({ 
        description: z.string().optional().describe("Milestone description"), 
        amount: z.number().positive().optional().describe("Optional milestone amount in INR") 
    })).nullable().describe("List of project milestones with descriptions and optional amounts"),
    vaultOptIn: z.boolean().nullable().describe("Whether to use DeFi vault with 1% bonus yield"),
    arbitrationContract: z.string().nullable().describe("Arbitration contract address for dispute resolution")
});

// **Time-Locked Escrow Schema - TimeLockedEscrow.sol**  
const TimeLockedEscrowSchema = z.object({
    serviceDuration: z.string().nullable().describe("Duration for the time-locked service (e.g., '30 days', '3 months')"),
    providerWallet: z.string().nullable().describe("Compute provider wallet address for inference service"),
    agentAddress: z.string().nullable().describe("Monitoring agent address for service verification"),
    vaultOptIn: z.boolean().nullable().describe("Whether to use DeFi vault with 1% bonus yield"),
    arbitrationContract: z.string().nullable().describe("Arbitration contract address for dispute resolution")
});

// **Combined Extraction Schema**
export const UserInputExtractionSchema = z.object({
    extractedInfo: z.object({
        // Base information (required for all)
        ...BaseInfoSchema.shape,
        // Type-specific information (conditional based on escrowType)
        ...SimpleEscrowSchema.shape,
        ...MilestoneEscrowSchema.shape,
        ...TimeLockedEscrowSchema.shape
    }),
    completionStatus: z.object({
        isComplete: z.boolean().describe("Whether all required information is collected"),
        hasEscrowType: z.boolean().describe("Whether escrow type is selected"),
        hasProjectName: z.boolean().describe("Whether project name is provided"),
        hasProjectDescription: z.boolean().describe("Whether project description is provided"),
        hasClientName: z.boolean().describe("Whether client name is provided"),
        hasEmail: z.boolean().describe("Whether email is provided"),
        hasWalletAddress: z.boolean().describe("Whether wallet address is provided"),
        hasPaymentAmount: z.boolean().describe("Whether payment amount is provided"),
        hasFreelancerAddress: z.boolean().describe("Whether freelancer address is provided")
    })
});

// **State Type Definition**
type ProjectState = {
    input: string,
    contractData?: any | null,
    chatHistory?: BaseMessage[],
    messages?: any[] | null,
    operation?: string,
    result?: string,
    walletAddress?: string,
    // Enhanced stage management for conversation flow
    stage?: 'initial' | 'information_collection' | 'escrow_selection' | 'base_collection' | 'type_specific_collection' | 'data_ready' | 'completed',
    information_collection?: boolean,
    // Progress tracking for frontend synchronization
    progress?: number, // 0-100 percentage
    stageIndex?: number, // Current stage index for frontend
    currentFlowStage?: string, // Current flow stage name
    isStageComplete?: boolean, // Whether current stage is complete
    stageData?: any, // Data for current stage
    validationErrors?: string[], // Validation errors for frontend
    formData?: any, // Form data for frontend
    // Information collection tracking - Base fields (required for all escrow types)
    collectedFields?: {
        escrowType?: boolean,
        projectName?: boolean,
        projectDescription?: boolean,
        clientName?: boolean,
        email?: boolean,
        walletAddress?: boolean,
        paymentAmount?: boolean,
        freelancerAddress?: boolean,
        // Type-specific fields (only collected based on escrowType)
        milestones?: boolean, // milestone escrow only
        vaultOptIn?: boolean, // milestone & time_locked escrow
        arbitrationContract?: boolean, // milestone & time_locked escrow
        serviceDuration?: boolean, // time_locked escrow only
        providerWallet?: boolean, // time_locked escrow only
        agentAddress?: boolean, // time_locked escrow only
    },
    // Project information organized by category
    baseInfo?: {
        projectName?: string,
        projectDescription?: string,
        clientName?: string,
        email?: string,
        walletAddress?: string,
        paymentAmount?: number,
        freelancerAddress?: string,
        escrowType?: 'simple' | 'milestone' | 'time_locked',
    },
    // Type-specific information (only populated based on escrowType)
    typeSpecificInfo?: {
        // Milestone Escrow fields
        milestones?: { description?: string, amount?: number }[],
        // Time-Locked Escrow fields  
        serviceDuration?: string,
        providerWallet?: string,
        agentAddress?: string,
        // Shared optional fields
        vaultOptIn?: boolean,
        arbitrationContract?: string,
    },
    dataReady?: boolean,
    // 0G Compute Integration
    inferenceReady?: boolean, // Signal that data is ready for secure inference
    collectedData?: any, // Complete collected data for inference
}

// **Collection Logic Functions**

// Determine required fields based on escrow type
function getRequiredFieldsForEscrowType(escrowType: string): string[] {
    const baseFields = ['projectName', 'projectDescription', 'clientName', 'email', 'walletAddress', 'paymentAmount', 'freelancerAddress'];
    
    switch (escrowType) {
        case 'simple':
            return baseFields; // No additional fields for PacterEscrowV2
        case 'milestone':
            return [...baseFields, 'milestones']; // MilestoneEscrow requires milestones
        case 'time_locked':
            return [...baseFields, 'serviceDuration', 'providerWallet', 'agentAddress']; // TimeLockedEscrow requirements
        default:
            return baseFields;
    }
}

// Check if all required fields for the selected escrow type are collected
function areRequiredFieldsCollected(state: ProjectState): boolean {
    console.log("Checking if required fields are collected...");
    console.log("Current state:", {
        escrowType: state.baseInfo?.escrowType,
        baseInfo: state.baseInfo,
        typeSpecificInfo: state.typeSpecificInfo,
        collectedFields: state.collectedFields
    });
    
    if (!state.baseInfo?.escrowType) {
        console.log("No escrow type set, fields not collected");
        return false;
    }
    
    const requiredFields = getRequiredFieldsForEscrowType(state.baseInfo.escrowType);
    console.log("Required fields for", state.baseInfo.escrowType, ":", requiredFields);
    
    // Check if all required fields have actual values (not just marked as collected)
    for (const field of requiredFields) {
        let hasValue = false;
        
        // Check base info fields
        if (['projectName', 'projectDescription', 'clientName', 'email', 'walletAddress', 'paymentAmount', 'freelancerAddress'].includes(field)) {
            const value = state.baseInfo?.[field as keyof typeof state.baseInfo];
            hasValue = value !== null && value !== undefined && value !== '';
        }
        // Check type-specific fields
        else if (['milestones', 'serviceDuration', 'providerWallet', 'agentAddress'].includes(field)) {
            const value = state.typeSpecificInfo?.[field as keyof typeof state.typeSpecificInfo];
            if (field === 'milestones') {
                hasValue = Array.isArray(value) && value.length > 0;
            } else {
                hasValue = value !== null && value !== undefined && value !== '';
            }
        }
        
        console.log(`Field ${field}: hasValue = ${hasValue}, value =`, 
            field === 'milestones' ? state.typeSpecificInfo?.milestones :
            ['projectName', 'projectDescription', 'clientName', 'email', 'walletAddress', 'paymentAmount', 'freelancerAddress'].includes(field) ?
            state.baseInfo?.[field as keyof typeof state.baseInfo] :
            state.typeSpecificInfo?.[field as keyof typeof state.typeSpecificInfo]
        );
        
        if (!hasValue) {
            console.log(`Required field ${field} is missing or empty`);
            return false;
        }
    }
    
    console.log("All required fields are collected!");
    return true;
}

// Get the next missing field to collect
function getNextMissingField(state: ProjectState): string | null {
    const escrowType = state.baseInfo?.escrowType;
    if (!escrowType) return 'escrowType';
    
    const requiredFields = getRequiredFieldsForEscrowType(escrowType);
    const collectedFields = state.collectedFields || {};
    
    for (const field of requiredFields) {
        if (!collectedFields[field as keyof typeof collectedFields]) {
            return field;
        }
    }
    
    return null; // All required fields collected
}

export default function nodegraph() {
    const graph = new StateGraph<ProjectState>({
        channels: {
            messages: { value: (x: any[], y: any[]) => x.concat(y) },
            input: { value: null },
            result: { value: null },
            contractData: { value: null },
            chatHistory: { value: null },
            operation: { value: null },
            walletAddress: { value: null },
            stage: { value: null },
            information_collection: { value: null },
            progress: { value: null },
            stageIndex: { value: null },
            currentFlowStage: { value: null },
            isStageComplete: { value: null },
            stageData: { value: null },
            validationErrors: { value: null },
            formData: { value: null },
            collectedFields: { value: null },
            baseInfo: { value: null },
            typeSpecificInfo: { value: null },
            dataReady: { value: null },
            // 0G Compute Integration
            inferenceReady: { value: null },
            collectedData: { value: null }
        }
    });

    // Initial Node: Provides comprehensive project information and routes user requests
    graph.addNode("initial_node", async (state: ProjectState) => {
        const INITIAL_SYSTEM_TEMPLATE = `You are Pacter AI, an intelligent assistant for Pacter - a secure escrow system for freelance project development.

## About Pacter
Pacter is a **trustless escrow platform** that enables secure transactions between clients and freelancers for project development. Built on:

🔗 **Secure Escrow System** - Protected payment holding using 0G blockchain
⚡ **Smart Contract Integration** - Automated contract execution  
💰 **INR payments with 0G tokens** - All payments collected in INR and executed using 0G token equivalents
🤖 **Automated verification** - Payment release system
🛡️ **Dual Protection** - Guards against non-payment AND non-delivery

## Key Features & Benefits
✅ **Trustless Security** - Payments held in escrow until work completion
✅ **Vault Yield Routing** - Optional insured DeFi vault with 1% bonus on idle balances
🤝 **Arbitration Network** - On-chain arbitration partners for escalations
📋 **Milestone Tracking** - Automated verification and progress monitoring  
📁 **Secure Delivery** - Protected file delivery and project management
🌐 **Project Types** - Websites, mobile apps, software development, design work, etc.

## How It Works
1. **Client deposits** payment into secure escrow (in INR, executed as 0G tokens)
2. **Freelancer builds** the project according to specifications
3. **Automated verification** checks deliverables against requirements
4. **Payment releases** automatically when milestones are met
5. **Dispute resolution** available if needed

## Classification Guidelines

**For GREETINGS & GENERAL QUESTIONS**: 
Provide detailed, helpful information about Pacter, how it works, benefits, and encourage them to explore our escrow services. Be warm, informative, and educational.

**For ESCROW INTEREST**: 
If user wants to create an escrow, hire a freelancer, or start a project:
1. Acknowledge their interest
2. Explain that you'll collect the core project details plus vault, arbitration, or monitoring preferences when relevant
3. Start by asking for the FIRST missing piece (usually project name)
4. Be clear and specific about what you need

## Example Responses:

**Example 1 - User wants to create escrow:**
User: "I want to hire a freelancer"
You: "Great! I'll help you set up a secure escrow for your project.

Let's start with the basics. What would you like to call this project? (e.g., 'E-commerce Website', 'Mobile App Development') [INTENT:ESCROW]"

**Example 2 - User says "I am a client":**
User: "I am a client"
You: "Perfect! I'll help you create an escrow for your project.

First, what's the project name? (e.g., 'Website Redesign', 'Mobile App') [INTENT:ESCROW]"

**Example 2 - User says "I am a client":**
User: "I am a client"
You: "Perfect! I'll help you create a secure escrow for your project.

Let's start with the project name. What would you like to call this project? (e.g., 'E-commerce Website', 'Mobile App Development') [INTENT:ESCROW]"

**Example 3 - General question:**
User: "What is Pacter?"
You: "Pacter is a trustless escrow platform... [detailed explanation] [INTENT:GENERAL]"

Current conversation stage: {stage}

**Response Style**: Be warm, professional, and comprehensive. For general questions, provide detailed explanations. For escrow interest, be clear about the information collection process.

Always end your response with one of these hidden classification tags:
- [INTENT:ESCROW] - if user shows clear interest in creating escrow transactions
- [INTENT:GENERAL] - for greetings, general conversation, or information requests

**CRITICAL**: When starting escrow collection, immediately ask for the FIRST missing piece of information. Don't wait for the user to provide it voluntarily.`;

        const prompt = ChatPromptTemplate.fromMessages([
            ["system", INITIAL_SYSTEM_TEMPLATE],
            new MessagesPlaceholder({ variableName: "chat_history", optional: true }),
            ["human", "{input}"]
        ]);

        const response = await prompt.pipe(model).invoke({ 
            input: state.input, 
            chat_history: state.chatHistory,
            stage: state.stage || 'initial'
        });

        console.log(response.content, "Initial Node Response");

        const content = response.content as string;
        
        // Extract the intent classification from the response
        let operation = "end";  // Default to end
        let nextStage = 'initial';
        let progress = 0;
        let stageIndex = 0;
        
        if (content.includes("[INTENT:ESCROW]")) {
            operation = "collect_initiator_info";
            nextStage = 'information_collection';
            progress = 10;
            stageIndex = 1;
        }

        // Clean the response by removing the intent tag before returning to user
        const cleanedContent = content.replace(/\[INTENT:(ESCROW|GENERAL)\]/g, '').trim();

        return { 
            result: cleanedContent,
            messages: [cleanedContent], 
            operation: operation,
            stage: nextStage,
            information_collection: operation === "collect_initiator_info",
            progress: progress,
            stageIndex: stageIndex,
            currentFlowStage: nextStage === 'information_collection' ? 'Project Details Entered' : 'Identity Selected',
            isStageComplete: false,
            validationErrors: [],
            collectedFields: {
                escrowType: false,
                projectName: false,
                projectDescription: false,
                clientName: false,
                email: false,
                walletAddress: !!state.walletAddress,
                paymentAmount: false,
                freelancerAddress: false,
                milestones: false,
                vaultOptIn: false,
                arbitrationContract: false,
                serviceDuration: false,
                providerWallet: false,
                agentAddress: false,
            },
            baseInfo: {
                projectName: undefined,
                projectDescription: undefined,
                clientName: undefined,
                email: undefined,
                walletAddress: state.walletAddress,
                paymentAmount: undefined,
                freelancerAddress: undefined,
                escrowType: undefined,
            },
            typeSpecificInfo: {
                milestones: undefined,
                serviceDuration: undefined,
                providerWallet: undefined,
                agentAddress: undefined,
                vaultOptIn: undefined,
                arbitrationContract: undefined,
            }
        };
    });

    // Information Collection Node: Systematically collects all required project details
    graph.addNode("collect_initiator_info", async (state: ProjectState) => {
        const COLLECTION_SYSTEM_TEMPLATE = `You are Pacter AI's information collection specialist. Your role is to systematically gather project details based on the selected escrow type.

## CRITICAL RULES - READ CAREFULLY:
1. **NEVER ASSUME OR INVENT INFORMATION** - Only use what the user explicitly provides
2. **ONE QUESTION AT A TIME** - Ask for exactly ONE missing field per response
3. **EXTRACT ONLY FROM USER INPUT** - Parse the current user message for information
4. **NO DEFAULT VALUES** - Don't fill in missing information with placeholders or assumptions
5. **VALIDATE BEFORE STORING** - Only store information that was actually provided by the user

## Escrow Type Selection (Ask First):
If escrow type is not selected, ask user to choose:
• **Simple Code Handover** – One-off delivery using PacterEscrowV2 (websites, apps, design work, one-time projects)
• **Milestone-Based Project** – Staged delivery using MilestoneEscrow (multi-phase projects with checkpoints)
• **Time-Locked Service** – Continuous service using TimeLockedEscrow (API services, hosting, maintenance, ongoing services)

## CRITICAL ESCROW TYPE MAPPING:
- **API service, API hosting, inference service, continuous service, maintenance** → time_locked
- **Website, mobile app, design work, one-time delivery** → simple  
- **Multi-stage project, phased delivery, milestone-based** → milestone

When user mentions "API service" or similar continuous services, ALWAYS map to escrowType: "time_locked"

## Required Information Based on Escrow Type:

### Base Information (Required for ALL escrow types):
1. **Project Name** – Clear, descriptive title (e.g., "E-commerce Website", "Mobile App")
2. **Project Description** – Detailed scope, what needs to be built (minimum 10 words)
3. **Client Name** – Full name of the person/company hiring (e.g., "John Doe", "Acme Corp")
4. **Email Address** – Valid email format (e.g., "john@example.com")
5. **Wallet Address** – 0G blockchain wallet (automatically captured if connected)
6. **Payment Amount** – Total project cost in INR (numbers only, e.g., "50000")
7. **Freelancer Address** – Freelancer's 0G wallet address

### Additional Requirements by Escrow Type:

**Simple Code Handover (PacterEscrowV2):**
- No additional fields required
- No vault, arbitration, or milestone options available

**Milestone-Based Project (MilestoneEscrow):**
- **Milestones** (Required) – List of project stages with descriptions and optional amounts
- **Vault Opt-In** (Optional) – Park idle escrow in insured DeFi vault with ~1% bonus
- **Arbitration Contract** (Optional) – Contract address for dispute resolution

**Time-Locked Service (TimeLockedEscrow):**
- **Service Duration** (Required) – How long the service runs (e.g., "30 days", "3 months")
- **Provider Wallet** (Required) – Compute provider wallet address for inference service
- **Agent Address** (Required) – Monitoring agent address for service verification
- **Vault Opt-In** (Optional) – Park idle escrow in insured DeFi vault with ~1% bonus
- **Arbitration Contract** (Optional) – Contract address for dispute resolution

## Example Interactions by Collection Phase:

### Phase 1: Escrow Type Selection
**User:** "I want to create an escrow"
**You:** "I'll help you set up a secure escrow! First, what type of project is this?

• **Simple Code Handover** – One-time delivery (website, app, design work)
• **Milestone-Based Project** – Multi-stage project with checkpoints  
• **Time-Locked Service** – Ongoing service (API hosting, maintenance)

Which option fits your project?"

### Phase 2: Base Information Collection Examples

**Asking for Project Name:**
**User:** "I choose milestone-based"
**You:** "Perfect! Milestone-based escrow selected ✅

What's the project name? (e.g., 'E-commerce Website', 'Mobile App Development')"

**Asking for Project Description:**
**User:** "Website redesign"
**You:** "Project name: Website redesign ✅

Please describe what needs to be built. Include key features, pages, or functionality you want. (minimum 10 words)"

**Asking for Client Name:**
**User:** "A modern responsive website with shopping cart, user accounts, and payment integration"
**You:** "Project description captured ✅

What's your full name or company name? (This will appear on the contract)"

**Asking for Email:**
**User:** "John Smith"
**You:** "Client name: John Smith ✅

What's your email address? (We'll send contract updates here)"

**Asking for Payment Amount:**
**User:** "john@example.com"
**You:** "Email: john@example.com ✅

What's the total project cost in INR? (Enter numbers only, e.g., 50000)"

**Asking for Freelancer Address:**
**User:** "75000"
**You:** "Payment amount: ₹75,000 INR ✅

What's the freelancer's 0G wallet address? (They should provide this to you)"

### Phase 3: Type-Specific Collection Examples

**Milestone Collection (Milestone Escrow):**
**User:** "0x1234...abcd"
**You:** "Freelancer address captured ✅

Now let's set up your project milestones. Please list each milestone with a description:

**Example format:**
1. Design mockups and wireframes
2. Frontend development and styling  
3. Backend API and database setup
4. Testing and final deployment

What are your project milestones?"

**Vault Opt-in (Milestone/Time-Locked):**
**User:** [after milestones provided]
**You:** "Milestones captured ✅

**Optional DeFi Vault:** Would you like to park idle escrow funds in an insured DeFi vault? This earns ~1% bonus yield while funds wait for milestone completion.

• **Yes** – Earn bonus yield on idle funds
• **No** – Keep funds in standard escrow

Your choice?"

**Service Duration (Time-Locked):**
**User:** "0x5678...efgh"
**You:** "Freelancer address captured ✅

How long should this service run? (e.g., '30 days', '3 months', '1 year')"

**Provider Wallet (Time-Locked):**
**User:** "6 months"
**You:** "Service duration: 6 months ✅

What's the compute provider's wallet address? (This is who will provide the inference service)"

## Internal Collection Status (DO NOT SHOW TO USER):
{collection_status}

## Internal Previously Collected Information (DO NOT SHOW TO USER):
{collected_info}

**IMPORTANT**: The collection status and collected info above are for YOUR REFERENCE ONLY. DO NOT display this raw data to the user. Instead, acknowledge what they provided in a natural, conversational way.

## Collection Strategy:
- **ACKNOWLEDGE FIRST**: If user provided information, acknowledge it specifically
- **EXTRACT CAREFULLY**: Only extract information that is clearly stated in the user's message
- **ASK FOR NEXT**: Request the NEXT missing field with clear examples based on escrow type
- **BE SPECIFIC**: Give examples of what you're asking for
- **NEVER REPEAT**: Don't ask for information that's already collected

## Example Interactions:

**Example 1 - Escrow Type Selection:**
User: "I want to create an escrow"
You: "Great! I'll help you set up a secure escrow. First, what type of project is this?

• **Simple Code Handover** – One-off delivery (website, app, etc.)
• **Milestone-Based Project** – Staged delivery with multiple checkpoints
• **Time-Locked Service** – Ongoing service with duration (API, inference, etc.)

Which option fits your project?"

**Example 2 - Simple Escrow Flow:**
User: "Simple code handover"
You: "Perfect! ✅ Escrow Type: Simple Code Handover

This uses our PacterEscrowV2 contract for straightforward project delivery. What's the project name? (e.g., 'E-commerce Website', 'Mobile App Development')"

**Example 3 - Milestone Escrow Flow:**
User: "Milestone-based project"
You: "Excellent! ✅ Escrow Type: Milestone-Based Project

This uses our MilestoneEscrow contract for staged delivery. What's the project name? (e.g., 'E-commerce Website', 'Mobile App Development')"

**Example 4 - Collecting Milestones:**
User: "The milestones are: 1) Design mockups, 2) Frontend development, 3) Backend integration, 4) Testing and deployment"
You: "Perfect! ✅ Milestones: 4 stages defined

Since this is a milestone-based escrow, would you like to opt into our DeFi vault? It parks idle funds in an insured vault with ~1% bonus yield while keeping funds available for milestone payments. (Yes/No)"

**Example 5 - Time-Locked Service:**
User: "Time-locked service for 90 days"
You: "Great! ✅ Escrow Type: Time-Locked Service
✅ Service Duration: 90 days

What's the compute provider wallet address for this inference service?"

## Response Format:
1. If user provided new information: Acknowledge it specifically with ✅
2. **DO NOT show raw collection status or missing fields list**
3. Ask for the NEXT missing field based on escrow type requirements
4. Be encouraging, professional, and friendly
5. Keep responses concise and focused on ONE question at a time

End your response with:
- [CONTINUE_INFO] - if more information is needed
- [READY_FOR_DATA] - if all required fields for the selected escrow type are collected

Current stage: {stage}`;

        const prompt = ChatPromptTemplate.fromMessages([
            ["system", COLLECTION_SYSTEM_TEMPLATE],
            new MessagesPlaceholder({ variableName: "chat_history", optional: true }),
            ["human", "{input}"]
        ]);

        // Prepare collected info summary using new structure
        const collectedInfo = {
            baseInfo: state.baseInfo || {},
            typeSpecificInfo: state.typeSpecificInfo || {}
        };

        // Prepare collection status
        const collectionStatus = Object.entries(state.collectedFields || {}).map(([field, collected]) => 
            `- ${field}: ${collected ? '✅ Collected' : '❌ Missing'}`
        ).join('\n');

        const response = await prompt.pipe(model).invoke({ 
            input: state.input, 
            chat_history: state.chatHistory,
            stage: state.stage || 'information_collection',
            collected_info: JSON.stringify(collectedInfo, null, 2),
            collection_status: collectionStatus
        });

        console.log(response.content, "Collection Node Response");

        // Use structured extraction to capture information
        const extractedData = {};
        const updatedState = { ...state };
        
        // Initialize state objects if they don't exist
        if (!updatedState.baseInfo) updatedState.baseInfo = {};
        if (!updatedState.typeSpecificInfo) updatedState.typeSpecificInfo = {};
        if (!updatedState.collectedFields) updatedState.collectedFields = {};
        
        // DISABLE STRUCTURED EXTRACTION TO PREVENT HALLUCINATION
        // The AI was generating fake data even with strict prompts
        // Instead, rely on conversational flow to collect information step by step
        
        console.log("Skipping structured extraction to prevent hallucination");
        
        // If wallet address is provided in state but not in baseInfo, add it
        if (state.walletAddress && !updatedState.baseInfo.walletAddress) {
            updatedState.baseInfo.walletAddress = state.walletAddress;
        }

        // Update collected fields tracking based on new structure
        const newCollectedFields = {
            // Base fields (required for all escrow types)
            escrowType: !!(updatedState.baseInfo?.escrowType),
            projectName: !!(updatedState.baseInfo?.projectName),
            projectDescription: !!(updatedState.baseInfo?.projectDescription),
            clientName: !!(updatedState.baseInfo?.clientName),
            email: !!(updatedState.baseInfo?.email),
            walletAddress: !!(updatedState.baseInfo?.walletAddress || state.walletAddress),
            paymentAmount: !!(updatedState.baseInfo?.paymentAmount),
            freelancerAddress: !!(updatedState.baseInfo?.freelancerAddress),
            // Type-specific fields (only collected based on escrowType)
            milestones: Array.isArray(updatedState.typeSpecificInfo?.milestones) && (updatedState.typeSpecificInfo?.milestones?.length || 0) > 0,
            vaultOptIn: updatedState.typeSpecificInfo?.vaultOptIn !== undefined && updatedState.typeSpecificInfo?.vaultOptIn !== null,
            arbitrationContract: !!(updatedState.typeSpecificInfo?.arbitrationContract),
            serviceDuration: !!(updatedState.typeSpecificInfo?.serviceDuration),
            providerWallet: !!(updatedState.typeSpecificInfo?.providerWallet),
            agentAddress: !!(updatedState.typeSpecificInfo?.agentAddress),
        };

        // Determine if all required fields for the selected escrow type are collected
        const escrowType = updatedState.baseInfo?.escrowType;
        let allRequiredFieldsCollected = false;
        let collectedCount = 0;
        let totalRequired = 0;
        
        if (escrowType) {
            const requiredFields = getRequiredFieldsForEscrowType(escrowType);
            totalRequired = requiredFields.length;
            collectedCount = requiredFields.filter(field => newCollectedFields[field as keyof typeof newCollectedFields]).length;
            allRequiredFieldsCollected = areRequiredFieldsCollected({ ...updatedState, collectedFields: newCollectedFields });
        } else {
            // If no escrow type selected, count base fields only
            const baseFields = ['escrowType', 'projectName', 'projectDescription', 'clientName', 'email', 'walletAddress', 'paymentAmount', 'freelancerAddress'];
            totalRequired = baseFields.length;
            collectedCount = baseFields.filter(field => newCollectedFields[field as keyof typeof newCollectedFields]).length;
        }
        
        const progress = Math.round((collectedCount / totalRequired) * 80) + 10;
        
        console.log(`Collection progress: ${collectedCount}/${totalRequired} fields collected (${progress}%)`);
        console.log("Collected fields:", newCollectedFields);
        
        // Determine next operation
        const content = response.content as string;
        let operation = "collect_initiator_info"; // Default: stay in collection mode
        let nextStage = 'information_collection';
        let isComplete = false;
        
        // Only move to final processing when ALL required fields for the escrow type are collected
        if (allRequiredFieldsCollected) {
            operation = "request_missing_info";
            nextStage = 'data_ready';
            isComplete = true;
            console.log("All required information collected! Moving to final processing.");
        } else {
            console.log(`Still collecting information for escrow type '${escrowType || 'not selected'}'. Missing ${totalRequired - collectedCount} fields.`);
        }

        // Clean response
        const cleanedContent = content.replace(/\[(CONTINUE_INFO|READY_FOR_DATA)\]/g, '').trim();

        return { 
            result: cleanedContent,
            messages: [cleanedContent], 
            operation: operation,
            stage: nextStage,
            baseInfo: updatedState.baseInfo,
            typeSpecificInfo: updatedState.typeSpecificInfo,
            progress: progress,
            stageIndex: isComplete ? 2 : 1,
            currentFlowStage: isComplete ? 'Information Complete' : 'Collecting Information',
            isStageComplete: isComplete,
            collectedFields: newCollectedFields,
            stageData: {
                extractedData,
                collectedCount,
                totalRequired
            },
            validationErrors: []
        };
    });

    // Final Data Processing Node: Validates and returns clean JSON
    graph.addNode("request_missing_info", async (state: ProjectState) => {
        const FINAL_SYSTEM_TEMPLATE = `You are Pacter AI's final data validator. Your role is to verify all collected information and provide a professional summary.

## CRITICAL VALIDATION RULES:
1. **VERIFY ALL FIELDS** - Ensure all required fields are present based on escrow type
2. **NO ASSUMPTIONS** - Only use data that was actually collected
3. **CLEAR SUMMARY** - Present information in a user-friendly format

## Collected Information:

### Project Details:
- Project Name: {project_name}
- Description: {project_description}
- Escrow Type: {escrow_type}
- Milestones: {milestones}

### Client Information:
- Client Name: {client_name}
- Email: {email}
- Wallet Address: {wallet_address}
- Freelancer Address: {freelancer_address}

### Type-Specific Details:
- Service Duration: {service_duration}
- Provider Wallet: {provider_wallet}
- Agent Address: {agent_address}
- Vault Opt-In: {vault_opt_in}
- Arbitration Contract: {arbitration_contract}

### Financial Details:
- Payment Amount: ₹{payment_amount} INR
- Platform Fee (2.5%): ₹{platform_fee} INR
- Escrow Fee (0.5%): ₹{escrow_fee} INR
- Total Escrow Amount: ₹{total_amount} INR
- 0G Token Equivalent: {zeroG_equivalent} 0G

## Your Task:
Provide a professional summary that:

1. **Congratulates** the user on completing information collection
2. **Displays** collected information based on escrow type (only show relevant fields)
3. **Shows** the financial breakdown with fees
4. **Explains** what happens next (contract generation and deployment)
5. **Asks for confirmation** before proceeding

## Escrow Type Display Rules:
- **Simple Code Handover**: Show project info, client info, freelancer address, financial details only
- **Milestone-Based Project**: Show project info, client info, freelancer address, milestones, vault opt-in (if selected), arbitration contract (if provided), financial details
- **Time-Locked Service**: Show project info, client info, service duration, provider wallet, agent address, vault opt-in (if selected), arbitration contract (if provided), financial details

## Response Format:

🎉 **Information Collection Complete!**

Here's a summary of your {escrow_type} escrow:

**📋 Project Information:**
• Project Name: [name]
• Description: [description]
• Escrow Type: [type]

**👤 Client Information:**
• Name: [name]
• Email: [email]
• Wallet: [address]
• Freelancer: [freelancer_address]

[Show type-specific sections only if relevant to escrow type]

**💰 Financial Breakdown:**
• Project Payment: ₹[amount] INR
• Platform Fee (2.5%): ₹[fee] INR
• Escrow Fee (0.5%): ₹[fee] INR
• **Total Escrow Amount: ₹[total] INR**
• 0G Token Equivalent: [amount] 0G

**🔄 Next Steps:**
1. Contract will be generated with these details
2. Both parties will sign the contract
3. Funds will be deposited into secure escrow
4. Work begins once escrow is confirmed

Please review the information above. If everything looks correct, we'll proceed with contract generation!

Always end with: [DATA_COMPLETE]`;

        const prompt = ChatPromptTemplate.fromMessages([
            ["system", FINAL_SYSTEM_TEMPLATE],
            new MessagesPlaceholder({ variableName: "chat_history", optional: true }),
            ["human", "Please compile the final project data."]
        ]);

        // Calculate comprehensive financial information
        const paymentAmount = state.baseInfo?.paymentAmount || 0;
        const platformFee = Math.round((paymentAmount * 0.025) * 100) / 100; // 2.5%
        const escrowFee = Math.round((paymentAmount * 0.005) * 100) / 100; // 0.5%
        const totalAmount = paymentAmount + platformFee + escrowFee;
        const zeroGEquivalent = Math.round((totalAmount * 0.1) * 100) / 100; // Mock rate

        const response = await prompt.pipe(model).invoke({ 
            chat_history: state.chatHistory,
            stage: state.stage || 'data_ready',
            project_name: state.baseInfo?.projectName || "Untitled Project",
            project_description: state.baseInfo?.projectDescription || "No description",
            escrow_type: state.baseInfo?.escrowType || "Not selected",
            milestones: JSON.stringify(state.typeSpecificInfo?.milestones || []),
            client_name: state.baseInfo?.clientName || "Not provided",
            email: state.baseInfo?.email || "Not provided",
            wallet_address: state.baseInfo?.walletAddress || state.walletAddress || "Not provided",
            freelancer_address: state.baseInfo?.freelancerAddress || "Not provided",
            service_duration: state.typeSpecificInfo?.serviceDuration || "Not provided",
            provider_wallet: state.typeSpecificInfo?.providerWallet || "Not provided",
            agent_address: state.typeSpecificInfo?.agentAddress || "Not provided",
            vault_opt_in: state.typeSpecificInfo?.vaultOptIn === undefined || state.typeSpecificInfo?.vaultOptIn === null ? "Not set" : state.typeSpecificInfo?.vaultOptIn,
            arbitration_contract: state.typeSpecificInfo?.arbitrationContract || "Not provided",
            payment_amount: paymentAmount.toFixed(2),
            platform_fee: platformFee.toFixed(2),
            escrow_fee: escrowFee.toFixed(2),
            total_amount: totalAmount.toFixed(2),
            zeroG_equivalent: zeroGEquivalent.toFixed(2)
        });

        console.log(response.content, "Final Data Node Response");

        // Create comprehensive final data object - ONLY with collected information
        const finalProjectData = {
            baseInfo: {
                // Only include fields that have actual values (not undefined/null/empty)
                ...(state.baseInfo?.projectName && { projectName: state.baseInfo.projectName }),
                ...(state.baseInfo?.projectDescription && { projectDescription: state.baseInfo.projectDescription }),
                ...(state.baseInfo?.clientName && { clientName: state.baseInfo.clientName }),
                ...(state.baseInfo?.email && { email: state.baseInfo.email }),
                ...((state.baseInfo?.walletAddress || state.walletAddress) && { 
                    walletAddress: state.baseInfo?.walletAddress || state.walletAddress 
                }),
                ...(paymentAmount > 0 && { paymentAmount: paymentAmount }),
                ...(state.baseInfo?.freelancerAddress && { freelancerAddress: state.baseInfo.freelancerAddress }),
                ...(state.baseInfo?.escrowType && { escrowType: state.baseInfo.escrowType })
            },
            typeSpecificInfo: {
                // Only include fields that have actual values
                ...(state.typeSpecificInfo?.milestones && state.typeSpecificInfo.milestones.length > 0 && { 
                    milestones: state.typeSpecificInfo.milestones 
                }),
                ...(state.typeSpecificInfo?.serviceDuration && { serviceDuration: state.typeSpecificInfo.serviceDuration }),
                ...(state.typeSpecificInfo?.providerWallet && { providerWallet: state.typeSpecificInfo.providerWallet }),
                ...(state.typeSpecificInfo?.agentAddress && { agentAddress: state.typeSpecificInfo.agentAddress }),
                ...(state.typeSpecificInfo?.vaultOptIn !== undefined && { vaultOptIn: state.typeSpecificInfo.vaultOptIn }),
                ...(state.typeSpecificInfo?.arbitrationContract && { arbitrationContract: state.typeSpecificInfo.arbitrationContract })
            },
            financialInfo: {
                ...(paymentAmount > 0 && {
                    paymentAmount: paymentAmount,
                    platformFees: platformFee,
                    escrowFee: escrowFee,
                    totalEscrowAmount: totalAmount,
                    currency: "INR",
                    zeroGEquivalent: zeroGEquivalent,
                    feeBreakdown: {
                        projectPayment: paymentAmount,
                        platformFee: platformFee,
                        escrowFee: escrowFee,
                        total: totalAmount
                    }
                })
            },
            escrowDetails: {
                // Use actual escrow type from collected data, not hardcoded value
                ...(state.baseInfo?.escrowType && { escrowType: state.baseInfo.escrowType }),
                paymentMethod: "0G_tokens",
                releaseCondition: "project_completion",
                disputeResolution: "automated_mediation"
            },
            metadata: {
                createdAt: new Date().toISOString(),
                stage: "data_complete",
                version: "1.0",
                platform: "Pacter",
                collectionComplete: true
            }
        };

        // Update final collected fields - check if properties exist in the final data
        const finalCollectedFields = {
            projectName: !!finalProjectData.baseInfo?.projectName,
            projectDescription: !!finalProjectData.baseInfo?.projectDescription,
            clientName: !!finalProjectData.baseInfo?.clientName,
            email: !!finalProjectData.baseInfo?.email,
            walletAddress: !!finalProjectData.baseInfo?.walletAddress,
            paymentAmount: !!finalProjectData.baseInfo?.paymentAmount,
            freelancerAddress: !!finalProjectData.baseInfo?.freelancerAddress,
            escrowType: !!finalProjectData.baseInfo?.escrowType,
            milestones: Array.isArray(finalProjectData.typeSpecificInfo?.milestones) && finalProjectData.typeSpecificInfo.milestones.length > 0,
            serviceDuration: !!finalProjectData.typeSpecificInfo?.serviceDuration,
            providerWallet: !!finalProjectData.typeSpecificInfo?.providerWallet,
            agentAddress: !!finalProjectData.typeSpecificInfo?.agentAddress,
            vaultOptIn: finalProjectData.typeSpecificInfo?.vaultOptIn !== null && finalProjectData.typeSpecificInfo?.vaultOptIn !== undefined,
            arbitrationContract: !!finalProjectData.typeSpecificInfo?.arbitrationContract,
        };

        // Clean response and prepare JSON output
        const content = response.content as string;
        const cleanedContent = content.replace(/\[DATA_COMPLETE\]/g, '').trim();

        // Create the JSON output with markers (hidden from user)
        const jsonOutput = `[JSON_DATA_START]${JSON.stringify(finalProjectData, null, 2)}[JSON_DATA_END]`;
        
        // Show a clean success message to the user
        const userMessage = `✅ **Information Collection Successful!**

Thank you for providing all the details. Your contract is now being prepared.

**Contract Mode:** ${finalProjectData.baseInfo.escrowType || 'Standard escrow'}
**Vault Routing:** ${finalProjectData.typeSpecificInfo.vaultOptIn === null || finalProjectData.typeSpecificInfo.vaultOptIn === undefined ? 'Not specified' : finalProjectData.typeSpecificInfo.vaultOptIn}
**Arbitration:** ${finalProjectData.typeSpecificInfo.arbitrationContract || 'Default automated mediation'}
**Service Duration:** ${finalProjectData.typeSpecificInfo.serviceDuration || 'Not applicable'}

**What's happening next:**
• Generating legal contract with Indian law compliance
• Processing with secure 0G Compute Network
• Preparing escrow smart contract
• Setting up arbitration and monitoring hooks

Please wait while we create your secure contract...`;
        
        // Combine user message with hidden JSON data
        const finalResponse = `${userMessage}\n\n${jsonOutput}`;

        console.log("=== FINAL DATA READY ===");
        console.log("JSON Output:", JSON.stringify(finalProjectData, null, 2));
        console.log("🚀 INFERENCE READY - Triggering 0G Compute");

        return { 
            result: finalResponse,
            messages: [finalResponse], 
            operation: "end",
            stage: 'completed',
            baseInfo: finalProjectData.baseInfo,
            typeSpecificInfo: finalProjectData.typeSpecificInfo,
            progress: 100,
            stageIndex: 3,
            currentFlowStage: 'Data Complete',
            isStageComplete: true,
            collectedFields: finalCollectedFields,
            stageData: {
                finalProjectData,
                completionTime: new Date().toISOString(),
                totalFields: Object.keys(finalCollectedFields).length,
                collectedFields: Object.values(finalCollectedFields).filter(Boolean).length,
                jsonReady: true
            },
            validationErrors: [],
            formData: finalProjectData,
            // 0G Compute Integration - Signal that data is ready for inference
            inferenceReady: true,
            collectedData: finalProjectData
        };
    });

    // Stage-based routing function for efficient conversation flow
    const routeByStage = (state: ProjectState) => {
        console.log("=== START ROUTING ===");
        console.log("Stage:", state.stage);
        console.log("Operation:", state.operation);
        console.log("Information Collection:", state.information_collection);
        
        // ALWAYS start with initial_node for first message or when no stage is set
        if (!state.stage || state.stage === 'initial') {
            console.log("→ Routing to initial_node (first message or initial stage)");
            return "initial_node";
        }
        
        // If in information collection stage, go to collection node
        if (state.stage === 'information_collection') {
            console.log("→ Routing to collect_initiator_info (collection stage)");
            return "collect_initiator_info";
        }
        
        // If data is ready, go to final processing
        if (state.stage === 'data_ready') {
            console.log("→ Routing to request_missing_info (data ready)");
            return "request_missing_info";
        }
        
        // Default: go to initial node
        console.log("→ Routing to initial_node (default)");
        return "initial_node";
    };

    // Add conditional edges for stage-based routing
    graph.addConditionalEdges(START, routeByStage, {
        //@ts-ignore
        "initial_node": "initial_node",
        //@ts-ignore
        "collect_initiator_info": "collect_initiator_info",
        //@ts-ignore
        "request_missing_info": "request_missing_info"
    });

    // Add routing from initial_node based on user intent
    //@ts-ignore
    graph.addConditionalEdges("initial_node", (state: ProjectState) => {
        if (state.operation === "collect_initiator_info") {
            return "collect_initiator_info";
        }
        // Default to "end" string for all other cases
        return "end";
    }, {
        "collect_initiator_info": "collect_initiator_info",
        "end": END
    });

    // Add routing from collect_initiator_info based on completion status
    //@ts-ignore
    graph.addConditionalEdges("collect_initiator_info", (state: ProjectState) => {
        console.log("Routing from collect_initiator_info. Operation:", state.operation, "Stage:", state.stage);
        
        // If all information is collected, move to final processing
        if (state.operation === "request_missing_info" && state.stage === 'data_ready') {
            console.log("→ Moving to request_missing_info (final processing)");
            return "request_missing_info";
        }
        
        // Otherwise, END and wait for next user message
        console.log("→ Ending conversation (waiting for user input)");
        return "end";
    }, {
        "request_missing_info": "request_missing_info",
        "end": END
    });

    // Add edge from request_missing_info to END
    //@ts-ignore
    graph.addEdge("request_missing_info", END);

    const data = graph.compile();
    return data;
}


// Enhanced collection node with proper state synchronization
const collectInitiatorInfo = async (state: ProjectState): Promise<Partial<ProjectState>> => {
    const { input, baseInfo = {}, collectedFields = {}, typeSpecificInfo = {} } = state;

    // Calculate stage index based on collection progress
    const getStageIndex = (progress: number): number => {
        if (progress >= 100) return 5; // Contract Created
        if (progress >= 80) return 4;  // Review Contract
        if (progress >= 60) return 3;  // Payment Terms Set
        if (progress >= 40) return 2;  // Deliverables Defined
        if (progress >= 20) return 1;  // Project Details Entered
        return 0; // Identity Selected
    };

    // Calculate current flow stage based on progress
    const getCurrentFlowStage = (progress: number): string => {
        const stages = [
            "Identity Selected",
            "Project Details Entered", 
            "Deliverables Defined",
            "Payment Terms Set",
            "Review Contract",
            "Contract Created"
        ];
        const index = getStageIndex(progress);
        return stages[index] || stages[0];
    };

    // Process the input and update collected fields
    const newBaseInfo = { ...baseInfo };
    const newTypeSpecificInfo = { ...typeSpecificInfo };
    const newCollectedFields = { ...collectedFields };

    // Simple field collection logic based on input
    if (input) {
        // Extract basic info from input
        if (input.includes('client:') || input.includes('freelancer:')) {
            const roleMatch = input.match(/(client|freelancer):\s*(\w+)/i);
            if (roleMatch) {
                // Store role in baseInfo - using projectName as userRole field doesn't exist in type
                newBaseInfo.projectName = roleMatch[1].toLowerCase();
                newCollectedFields.projectName = true;
            }
        }
        
        // Extract project name
        if (input.includes('project:') || input.includes('name:')) {
            const projectMatch = input.match(/(?:project|name):\s*([^,\n]+)/i);
            if (projectMatch) {
                newBaseInfo.projectName = projectMatch[1].trim();
                newCollectedFields.projectName = true;
            }
        }
        
        // Extract payment amount
        if (input.includes('payment:') || input.includes('amount:')) {
            const paymentMatch = input.match(/(?:payment|amount):\s*([\d,]+)/i);
            if (paymentMatch) {
                newBaseInfo.paymentAmount = parseFloat(paymentMatch[1].replace(/,/g, ''));
                newCollectedFields.paymentAmount = true;
            }
        }
        
        // Extract service duration
        if (input.includes('duration:') || input.includes('time:')) {
            const durationMatch = input.match(/(?:duration|time):\s*([^,\n]+)/i);
            if (durationMatch) {
                newTypeSpecificInfo.serviceDuration = durationMatch[1].trim();
                newCollectedFields.serviceDuration = true;
            }
        }
    }

    // Calculate progress based on collected fields
    const requiredFields = [
        'userRole', 'projectName', 'paymentAmount', 'serviceDuration',
        'deliverables', 'milestones', 'escrowType', 'freelancerAddress'
    ];
    
    const collectedCount = Object.values(newCollectedFields).filter(Boolean).length;
    const progress = Math.min((collectedCount / requiredFields.length) * 100, 100);
    
    // Check if all fields are collected
    const allFieldsCollected = progress >= 90; // Allow some flexibility
    
    // Find missing fields
    const missingFields = requiredFields.filter(field => !newCollectedFields[field]);

    // Enhanced state update with proper synchronization
    return {
        ...state,
        stage: allFieldsCollected ? 'data_ready' : 'information_collection',
        operation: allFieldsCollected ? 'request_missing_info' : 'collect_initiator_info',
        progress: progress,
        stageIndex: getStageIndex(progress),
        currentFlowStage: getCurrentFlowStage(progress),
        isStageComplete: progress >= 100,
        baseInfo: newBaseInfo,
        typeSpecificInfo: newTypeSpecificInfo,
        collectedFields: newCollectedFields,
        information_collection: allFieldsCollected // Set to true when all fields are collected
    };
};