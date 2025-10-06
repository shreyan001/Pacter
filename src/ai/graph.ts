import { StateGraph } from "@langchain/langgraph";
import { BaseMessage, AIMessage, HumanMessage } from "@langchain/core/messages";
import { START, END } from "@langchain/langgraph";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { ChatGroq } from "@langchain/groq";
import { UserInputExtractionSchema, safeParseUserInput } from './zodSchemas';
import fs from 'fs/promises';
import path from 'path';

const model = new ChatGroq({
    modelName: "llama-3.3-70b-versatile",
    temperature: 0.7,
    apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
});

type guildState = {
    input: string,
    contractData?: string | null,
    chatHistory?: BaseMessage[],
    messages?: any[] | null,
    operation?: string,
    result?: string,
    walletAddress?: string, // Add wallet address to state
    // Stage management for conversation flow
    stage?: 'initial' | 'information_collection' | 'contract_creation' | 'payment_collection' | 'completed',
    information_collection?: boolean,
    // Project information for freelance website development
    projectInfo?: {
        projectName?: string,
        projectDescription?: string,
        deliverables?: string[], // e.g., ["GitHub repository", "Live deployment", "Documentation"]
        timeline?: string,
        requirements?: string,
        revisions?: number,
    },
    clientInfo?: {
        clientName?: string,
        walletAddress?: string,
    },
    financialInfo?: {
        paymentAmount?: number, // Payment to freelancer in USD
        platformFees?: number, // DocPact platform fees
        escrowFee?: number, // Escrow service fee (0.2% of payment amount)
        totalEscrowAmount?: number, // Total amount client needs to deposit
        currency?: string, // Currency for the payment (default: USD)
    },
    contractReady?: boolean,
}

export default function nodegraph() {
    const graph = new StateGraph<guildState>({
        channels: {
            messages: { value: (x: any[], y: any[]) => x.concat(y) },
            input: { value: null },
            result: { value: null },
            contractData: { value: null },
            chatHistory: { value: null },
            operation: { value: null },
            walletAddress: { value: null },
            projectInfo: { value: null },
            clientInfo: { value: null },
            financialInfo: { value: null },
            contractReady: { value: null }
        }
    });

    // Initial Node: Routes user requests to the appropriate node
    graph.addNode("initial_node", async (state: guildState) => {
        const SYSTEM_TEMPLATE = `You are an AI agent for Pacter, a platform focused on contract creation and smart contract management.

Based on the user's input and conversation history, respond with ONLY ONE of the following words:
- "contract_creation" if the user wants to create a contract, set up a project agreement, or establish work terms
- "contribute_node" if the user wants to report any errors or contribute to the project
- "unknown" if the request doesn't fit into any of the above categories

Context for decision-making:
- Contract creation involves setting up agreements, defining project terms, milestones, payments, and deliverables
- User contributions can include reporting errors, suggesting improvements, or offering to help develop the project
- Use the conversation history to understand the user's intent and provide continuity

Respond strictly with ONLY ONE of these words: "contract_creation", "contribute_node", or "unknown". Provide no additional text or explanation.`;

        const prompt = ChatPromptTemplate.fromMessages([
            ["system", SYSTEM_TEMPLATE],
            new MessagesPlaceholder({ variableName: "chat_history", optional: true }),
            ["human", "{input}"]
        ]);

        const response = await prompt.pipe(model).invoke({ input: state.input, chat_history: state.chatHistory });

        console.log(response.content, "Initial Message");

        const content = response.content as string;
        
        // Check if it's a contract creation request
        if (content.includes("contract_creation")) {
            return { 
                messages: [response.content], 
                operation: "contract_creation",
                // Preserve chat history
                chatHistory: state.chatHistory,
                walletAddress: state.walletAddress
            };
        }
        
        if (content.includes("contribute_node")) {
            return { 
                messages: [response.content], 
                operation: "contribute_node",
                // Preserve chat history
                chatHistory: state.chatHistory,
                walletAddress: state.walletAddress
            };
        } else if (content.includes("unknown")) {
            const CONVERSATIONAL_TEMPLATE = `You are an AI assistant for Pacter, a platform focused on smart contract creation and automated contract management.

Use the conversation history to provide contextual responses. When users ask about topics outside of contract creation or project contributions, provide helpful information while gently guiding them toward Pacter's contract creation capabilities.

Respond in a friendly, professional manner and offer to help with contract creation if appropriate. Reference previous conversation context when relevant.`;

            const conversationalPrompt = ChatPromptTemplate.fromMessages([
                ["system", CONVERSATIONAL_TEMPLATE],
                new MessagesPlaceholder({ variableName: "chat_history", optional: true }),
                ["human", "{input}"]
            ]);
            const summaryModel = model.withConfig({ runName: "Summarizer" });
            const conversationalResponse = await conversationalPrompt.pipe(summaryModel).invoke({ input: state.input, chat_history: state.chatHistory });

            return { 
                result: conversationalResponse.content as string, 
                messages: [conversationalResponse.content],
                // Preserve chat history
                chatHistory: state.chatHistory,
                walletAddress: state.walletAddress
            };
        } 
    });

    // **D. LangGraph Node Implementation**

    // Node: Interactive bulk extraction and validation (using descriptions/examples)
    graph.addNode("collect_initiator_info", async (state: guildState) => {
        // Include chat history in the prompt for better context
        const promptStr = buildInfoPrompt(InitiatorContractSchema);
        const prompt = ChatPromptTemplate.fromMessages([
            ["system", promptStr],
            new MessagesPlaceholder({ variableName: "chat_history", optional: true }),
            ["human", state.input]
        ]);
        try {
            const response = await prompt.pipe(model).invoke({ 
                input: state.input,
                chat_history: state.chatHistory 
            });
            let extracted = {};
            try {
                const contentString = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
                extracted = JSON.parse(contentString.replace(/```json|```/g, "").trim());
                const check = InitiatorContractSchema.safeParse(extracted);
                if (!check.success) {
                    // Produce missing/error fields with user-friendly descriptions
                    const missing = check.error.errors.map(e => {
                        const fieldPath = e.path.join('.');
                        let message = e.message;
                        let userFriendlyField = fieldPath;
                        
                        // Replace technical field names with user-friendly labels
                        if (fieldPath === 'parties.partyA.email') {
                            userFriendlyField = 'Your email address';
                            if (e.code === 'invalid_string') {
                                message = 'must be a valid email format (e.g., user@example.com)';
                            }
                        } else if (fieldPath === 'parties.partyA.walletAddress') {
                            userFriendlyField = 'Your wallet address';
                            if (e.message.includes('start')) {
                                message = 'must start with "0x"';
                            } else if (e.message.includes('length')) {
                                message = 'must be exactly 42 characters long';
                            }
                        } else if (fieldPath === 'parties.partyA.name') {
                            userFriendlyField = 'Your full name';
                            message = 'is required';
                        } else if (fieldPath === 'projectDetails.deliverables') {
                            userFriendlyField = 'Project deliverables';
                            if (e.code === 'invalid_type') {
                                message = 'must be provided as a list of items';
                            }
                        } else if (fieldPath === 'projectDetails.timeline') {
                            userFriendlyField = 'Project timeline';
                            message = 'is required (e.g., "30 days")';
                        } else if (fieldPath === 'projectDetails.startDate') {
                            userFriendlyField = 'Project start date';
                            message = 'is required (format: YYYY-MM-DD)';
                        } else if (fieldPath === 'projectDetails.endDate') {
                            userFriendlyField = 'Project end date';
                            message = 'is required (format: YYYY-MM-DD)';
                        } else if (fieldPath === 'escrow.totalAmount') {
                            userFriendlyField = 'Total contract amount';
                            message = 'is required';
                        } else if (fieldPath === 'escrow.currency') {
                            userFriendlyField = 'Currency';
                            message = 'is required (e.g., USDC, INR, ETH)';
                        } else if (fieldPath === 'name') {
                            userFriendlyField = 'Contract name';
                            message = 'is required';
                        } else if (fieldPath === 'description') {
                            userFriendlyField = 'Project description';
                            message = 'is required';
                        } else if (fieldPath === 'projectType') {
                            userFriendlyField = 'Project type';
                            message = 'is required';
                        }
                        
                        return `${userFriendlyField} ${message}`;
                    });
                    return { 
                        stage: "need_more", 
                        missingFields: missing, 
                        messages: ["Please correct the following validation errors:\n" + missing.join("\n")],
                        validationErrors: missing,
                        formData: extracted,
                        // Preserve chat history for context
                        chatHistory: state.chatHistory
                    };
                }
                return { 
                    data: check.data, 
                    stage: "validate", 
                    messages: ["Great! I've collected all the necessary information. Let me prepare your contract details for review."],
                    formData: check.data,
                    // Preserve chat history for context
                    chatHistory: state.chatHistory
                };
            } catch (err) {
                return { 
                    stage: "error", 
                    messages: ["Could not parse contract info. Please re-enter details."],
                    validationErrors: ["Invalid JSON format"],
                    chatHistory: state.chatHistory
                };
            }
        } catch {
            return { 
                stage: "error", 
                messages: ["Could not interact with LLM."],
                validationErrors: ["LLM connection error"],
                chatHistory: state.chatHistory
            };
        }
    });

    // Node: Request missing fields, with metadata
    graph.addNode("request_missing_info", async (state: guildState) => {
        return {
            messages: [
                "To proceed, please provide these details:\n" + state.missingFields?.join("\n")
            ],
            stage: "waiting",
            // Preserve all state information for continuity
            chatHistory: state.chatHistory,
            formData: state.formData,
            validationErrors: state.validationErrors
        };
    });

    // Node: Confirm and finalize
    graph.addNode("confirm", async (state: guildState) => {
        const input = state.input?.toLowerCase().trim();
        
        // Only proceed to finalization with explicit confirmation
        if (input && (input === "yes" || input === "y" || input === "confirm" || input.includes("yes") || input.includes("confirm"))) {
            return { 
                stage: "finalize", 
                confirmed: true,
                // Preserve chat history
                chatHistory: state.chatHistory,
                walletAddress: state.walletAddress
            };
        } else if (input && (input === "no" || input === "n" || input === "edit" || input.includes("no") || input.includes("edit"))) {
            return { 
                stage: "collect_initiator_info", 
                confirmed: false, 
                messages: ["Please provide the correct information."],
                // Preserve chat history
                chatHistory: state.chatHistory,
                walletAddress: state.walletAddress
            };
        } else {
            // For any other input, show contract summary and ask for explicit confirmation
            const contractSummary = JSON.stringify(state.data, null, 2);
            const confirmationMessage = `
## Contract Summary

Here's your contract setup:

\`\`\`json
${contractSummary}
\`\`\`

Please review the details above. Reply with:
- **"yes"** or **"confirm"** to proceed with contract creation
- **"no"** or **"edit"** to make changes
- Specify any changes you'd like to make

Is this correct?`;

            return {
                messages: [confirmationMessage],
                stage: "awaiting_confirmation",
                confirmed: null, // Explicitly set to null to indicate waiting
                // Preserve chat history
                chatHistory: state.chatHistory,
                walletAddress: state.walletAddress
            };
        }
    });



    // Node: Validation and confirmation
    graph.addNode("validate", async (state: guildState) => {
        const data = state.data;
        const summary = `Contract Summary:\n${JSON.stringify(data, null, 2)}`;
        return { 
            stage: "confirm", 
            messages: [summary + "\n\nDoes this look correct? (yes/no)"],
            // Preserve chat history
            chatHistory: state.chatHistory,
            walletAddress: state.walletAddress
        };
    });

    // Node: Finalize contract
    graph.addNode("finalize", async (state: guildState) => {
        const contractId = `contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const contractData = {
            id: contractId,
            data: state.data,
            timestamp: new Date().toISOString(),
            status: 'finalized'
        };
        
        return { 
            stage: "complete", 
            contractId,
            contractData,
            messages: [`Contract finalized successfully! Contract ID: ${contractId}`],
            // Preserve chat history
            chatHistory: state.chatHistory,
            walletAddress: state.walletAddress
        };
    });

    //@ts-ignore
    graph.addEdge(START, "initial_node");
    //@ts-ignore
    graph.addConditionalEdges("initial_node",
        async (state) => {
            if (!state.messages || state.messages.length === 0) {
                console.error("No messages in state");
                return "end";
            }

            if (state.operation === "contract_creation") {
                return "collect_initiator_info";
            } else if (state.operation === "contribute_node") {
                return "contribute_node";
            } else if (state.result) {
                return "end";
            }
        },
        {
            collect_initiator_info: "collect_initiator_info",
            contribute_node: "contribute_node",
            end: END,
        }
    );

    // **E. Routing**
    //@ts-ignore
    graph.addConditionalEdges("collect_initiator_info",
        (state) => {
            if (state.stage === "need_more") return "request_missing_info";
            if (state.stage === "validate") return "validate";
            return "confirm";
        },
        { 
            request_missing_info: "request_missing_info", 
            validate: "validate",
            confirm: "confirm" 
        }
    );
    //@ts-ignore
    graph.addEdge("request_missing_info", END); // Wait for user
    //@ts-ignore
    graph.addEdge("validate", "confirm"); // validate goes to confirm
    //@ts-ignore
    graph.addConditionalEdges("confirm",
        (state) => {
            if (state.confirmed === true) return "finalize";
            if (state.confirmed === false) return "collect_initiator_info";
            // If confirmed is null or undefined, end the flow to wait for user input
            return "end";
        },
        { 
            finalize: "finalize", 
            collect_initiator_info: "collect_initiator_info",
            end: END
        }
    );
    //@ts-ignore
    graph.addEdge("finalize", END);

    // Add the contribute_node
    graph.addNode("contribute_node", async (state: guildState) => {
        console.log("Processing contribution or error report");

        const CONTRIBUTE_TEMPLATE = `You are an AI assistant for Pacter, tasked with processing user contributions and error reports. Your job is to analyze the user's input and create a structured JSON response containing the following fields:

        - type: Either "error_report" or "code_contribution"
        - description: A brief summary of the error or contribution
        - details: More detailed information about the error or contribution
        - impact: Potential impact of the error or the benefit of the contribution
        - priority: Suggested priority (low, medium, high)

        Based on the user's input, create a JSON object with these fields. Be concise but informative in your responses.`;

        const contributePrompt = ChatPromptTemplate.fromMessages([
            ["system", CONTRIBUTE_TEMPLATE],
            new MessagesPlaceholder({ variableName: "chat_history", optional: true }),
            ["human", "{input}"]
        ]);

        try {
            const response = await contributePrompt.pipe(model).invoke({ 
                input: state.input, 
                chat_history: state.chatHistory
            });

            const contributionData = JSON.parse(response.content as string);

            // Store contribution data in state instead of file system
            const timestamp = new Date().toISOString().replace(/:/g, '-');
            const contributionId = `contribution_${timestamp}`;
            
            const structuredContribution = {
                id: contributionId,
                ...contributionData,
                submittedAt: new Date().toISOString(),
                status: 'received'
            };

            return { 
                result: "Thank you for your contribution. Your response has been received successfully and will be reviewed by our team.",
                contributionData: structuredContribution,
                messages: [response.content],
                // Preserve chat history
                chatHistory: state.chatHistory,
                walletAddress: state.walletAddress
            };
        } catch (error) {
            console.error("Error in contribute_node:", error);
            return { 
                result: "Your error has been received successfully and will be reviewed by our team.",
                messages: ["Error processing contribution"],
                // Preserve chat history
                chatHistory: state.chatHistory,
                walletAddress: state.walletAddress
            };
        }
    });

    // Add the GitHub verification node
    // Removed - no longer needed

    //@ts-ignore    
    graph.addEdge("contribute_node", END);

    // Compile the graph with recursion limit to prevent infinite loops
    const compiledGraph = graph.compile({
        recursionLimit: 50
    });
    
    return compiledGraph;
}