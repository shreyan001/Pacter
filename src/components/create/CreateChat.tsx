"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CreateChatProps, GraphState, CollectedContractData } from '@/lib/types';
import { FLOW_METADATA } from '@/lib/flows';
import { HumanMessageText } from "@/components/ui/message";
import { EndpointsContext } from '@/app/agent';
import { useActions } from '@/ai/client';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { createContract } from '@/services/contractService';

export default function CreateChat({ 
  flowType, 
  currentStage, 
  setCurrentStage,
  onStageDataUpdate,
  onGraphStateUpdate 
}: CreateChatProps) {
  
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const actions = useActions<typeof EndpointsContext>();
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<[role: string, content: string][]>([]);
  const [elements, setElements] = useState<JSX.Element[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Graph state tracking
  const [graphState, setGraphState] = useState<GraphState>({});
  const [walletAddressSent, setWalletAddressSent] = useState(false);
  
  // Contract generation state
  const [collectedData, setCollectedData] = useState<CollectedContractData | null>(null);
  const [isGeneratingContract, setIsGeneratingContract] = useState(false);
  const [generatedContract, setGeneratedContract] = useState<{
    contractId: string;
    contractText: string;
    contractHash: string;
  } | null>(null);
  const [contractError, setContractError] = useState<string | null>(null);

  const flowData = FLOW_METADATA[flowType];
  const currentStageName = flowData.stages[currentStage];

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [elements]);

  // Update frontend stage based on graph state changes
  useEffect(() => {
    if (graphState.currentFlowStage && graphState.stageIndex !== undefined) {
      // Sync frontend stage with graph stage
      if (graphState.stageIndex !== currentStage) {
        setCurrentStage(graphState.stageIndex);
      }
      
      // Update stage data if available
      if (graphState.stageData && onStageDataUpdate) {
        onStageDataUpdate(graphState.stageData);
      }

      // Notify parent component of graph state changes
      if (onGraphStateUpdate) {
        onGraphStateUpdate(graphState, graphState.progress || 0);
      }
    }
  }, [graphState, currentStage, setCurrentStage, onStageDataUpdate, onGraphStateUpdate]);

  // Direct contract generation from JSON data
  const handleContractGeneration = useCallback(async (data: CollectedContractData) => {
    setIsGeneratingContract(true);
    setContractError(null);
    
    // Add loading message to chat
    const loadingKey = `loading-${Date.now()}`;
    setElements(prev => [
      ...prev,
      <div key={loadingKey} className="flex flex-col gap-1 w-full max-w-fit mr-auto">
        <ContractGenerationMessage />
      </div>
    ]);

    try {
      // Generate contract directly from collected data
      const result = await createContract(data);
      
      if (result.success) {
        setGeneratedContract({
          contractId: result.contractId,
          contractText: result.contractText,
          contractHash: result.contractHash
        });
        
        // Remove loading message and add success message
        setElements(prev => prev.slice(0, -1));
        
        const successKey = `success-${Date.now()}`;
        setElements(prev => [
          ...prev,
          <div key={successKey} className="flex flex-col gap-1 w-full max-w-fit mr-auto">
            <ContractSuccessMessage
              contractId={result.contractId}
              contractText={result.contractText}
              contractHash={result.contractHash}
            />
          </div>
        ]);
      } else {
        throw new Error(result.error || 'Contract generation failed');
      }
    } catch (error: any) {
      setContractError(error.message);
      
      // Remove loading message and add error message
      setElements(prev => prev.slice(0, -1));
      
      const errorKey = `error-${Date.now()}`;
      setElements(prev => [
        ...prev,
        <div key={errorKey} className="flex flex-col gap-1 w-full max-w-fit mr-auto">
          <ContractErrorMessage
            error={error.message}
            onRetry={() => handleContractGeneration(data)}
          />
        </div>
      ]);
    } finally {
      setIsGeneratingContract(false);
    }
  }, []);

  // Trigger contract generation when data collection is complete
  useEffect(() => {
    if (graphState.stage === 'completed' && 
        graphState.progress === 100 && 
        graphState.collectedData && 
        !isGeneratingContract && 
        !generatedContract) {
      
      setCollectedData(graphState.collectedData);
      handleContractGeneration(graphState.collectedData);
    }
  }, [graphState, isGeneratingContract, generatedContract, handleContractGeneration]);

  const handleSend = async () => {
    if (!isConnected) {
      return;
    }

    const currentInput = input;
    const newElements = [...elements];
    
    const humanMessageRef = React.createRef<HTMLDivElement>();
    const humanKey = `human-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    newElements.push(
      <div className="flex flex-col items-end w-full gap-1 mt-auto" key={humanKey} ref={humanMessageRef}>
        <HumanMessageText content={currentInput} />
      </div>
    );
    
    setElements(newElements);
    setInput("");

    // Update history with the new human message
    const updatedHistory: [role: string, content: string][] = [...history, ["human", currentInput]];
    setHistory(updatedHistory);

    // Scroll to the human message
    setTimeout(() => {
      humanMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);

    // For the first message, include wallet address directly in the input
    let messageWithWallet = currentInput;
    if (!walletAddressSent && address) {
      messageWithWallet = `${currentInput} [My wallet address is: ${address}]`;
      setWalletAddressSent(true);
    }

    // Include wallet address in the agent call
    const element = await actions.agent({
      chat_history: updatedHistory,
      input: messageWithWallet,
      walletAddress: address || null
    });

    // Update graph state with the response
    if (element.graphState) {
      setGraphState(element.graphState);
    }

    const aiMessageRef = React.createRef<HTMLDivElement>();
    const aiKey = `ai-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    setElements(prevElements => [
      ...prevElements,
      <div className="flex flex-col gap-1 w-full max-w-fit mr-auto" key={aiKey} ref={aiMessageRef}>
        {element.ui}
      </div>
    ]);

    // Update history with the actual AI response content
    const aiResponse = element.responseContent || "AI response received";
    setHistory(prevHistory => [...prevHistory, ["ai", aiResponse]]);

    // Scroll to show the top of the AI message
    setTimeout(() => {
      aiMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 2000);
  };

  const handleQuickAction = async (actionText: string) => {
    if (!isConnected) {
      return;
    }

    // Directly use the actionText instead of relying on state
    const newElements = [...elements];
    
    const humanMessageRef = React.createRef<HTMLDivElement>();
    const humanKey = `human-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    newElements.push(
      <div className="flex flex-col items-end w-full gap-1 mt-auto" key={humanKey} ref={humanMessageRef}>
        <HumanMessageText content={actionText} />
      </div>
    );
    
    setElements(newElements);
    setInput(""); // Clear input

    // Update history with the new human message
    const updatedHistory: [role: string, content: string][] = [...history, ["human", actionText]];
    setHistory(updatedHistory);

    // Scroll to the human message
    setTimeout(() => {
      humanMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);

    // For the first message, include wallet address directly in the input
    let messageWithWallet = actionText;
    if (!walletAddressSent && address) {
      messageWithWallet = `${actionText} [My wallet address is: ${address}]`;
      setWalletAddressSent(true);
    }

    // Include wallet address in the agent call
    const element = await actions.agent({
      chat_history: updatedHistory,
      input: messageWithWallet,
      walletAddress: address || null
    });

    // Update graph state with the response
    if (element.graphState) {
      setGraphState(element.graphState);
    }

    const aiMessageRef = React.createRef<HTMLDivElement>();
    const aiKey = `ai-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    setElements(prevElements => [
      ...prevElements,
      <div className="flex flex-col gap-1 w-full max-w-fit mr-auto" key={aiKey} ref={aiMessageRef}>
        {element.ui}
      </div>
    ]);

    // Update history with the actual AI response content
    const aiResponse = element.responseContent || "AI response received";
    setHistory(prevHistory => [...prevHistory, ["ai", aiResponse]]);

    // Scroll to show the top of the AI message
    setTimeout(() => {
      aiMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 2000);
  };

  // Message Components
  const ContractGenerationMessage = () => (
    <div className="bg-slate-700/80 text-slate-100 px-3.5 py-2.5 rounded-lg border border-slate-600/30 max-w-[85%]">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 border-4 border-slate-600 border-t-emerald-500 rounded-full animate-spin"></div>
        <div>
          <h3 className="text-sm font-mono font-medium">Creating Your Contract</h3>
          <p className="text-xs text-slate-400">Generating contract from collected data...</p>
        </div>
      </div>
    </div>
  );

  const ContractSuccessMessage = ({ contractId, contractText, contractHash }: {
    contractId: string;
    contractText: string;
    contractHash: string;
  }) => {
    const contractLink = `${window.location.origin}/contract/${contractId}`;
    
    return (
      <div className="bg-slate-700/80 text-slate-100 px-3.5 py-2.5 rounded-lg border border-slate-600/30 max-w-[85%]">
        <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">✓</span>
            <div>
              <h3 className="text-emerald-400 font-mono font-medium text-sm">
                Contract Generated Successfully!
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Your contract has been created and is ready for use.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3 mb-3">
          <div className="text-xs text-slate-400 mb-2">Contract Details:</div>
          <div className="space-y-1 text-xs font-mono">
            <div className="text-emerald-400">Contract ID: {contractId}</div>
            <div className="text-emerald-400">Hash: {contractHash.substring(0, 16)}...</div>
          </div>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-3 mb-3">
          <div className="text-xs text-slate-400 mb-2">Your Contract Link:</div>
          <div className="flex items-center gap-2">
            <input 
              type="text"
              value={contractLink}
              readOnly
              className="flex-1 bg-slate-900/50 text-emerald-400 px-2 py-1.5 rounded text-xs font-mono border border-slate-600"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(contractLink);
                alert('Link copied to clipboard!');
              }}
              className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white rounded text-xs font-mono transition-colors"
            >
              Copy
            </button>
          </div>
          <a 
            href={contractLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 text-xs hover:text-emerald-300 mt-2 inline-block underline"
          >
            Open contract in new tab →
          </a>
        </div>
      </div>
    );
  };

  const ContractErrorMessage = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
    <div className="bg-slate-700/80 text-slate-100 px-3.5 py-2.5 rounded-lg border border-slate-600/30 max-w-[85%]">
      <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">✗</span>
          <div>
            <h3 className="text-red-400 font-mono font-medium text-sm">
              Contract Generation Failed
            </h3>
            <p className="text-xs text-slate-300 mt-1">{error}</p>
          </div>
        </div>
      </div>
      <button
        onClick={onRetry}
        className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-mono transition-colors"
      >
        Retry Generation
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-160px)] bg-gray-800/30 rounded-xl backdrop-blur-sm border border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-[#4299e1]/10 to-[#2b6cb0]/10 flex-shrink-0">
        <h2 className="text-white font-mono font-medium text-sm">AI Assistant</h2>
        <p className="text-gray-300 text-xs font-mono mt-1">
          {currentStageName || 'Getting Started'}
        </p>
      </div>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
        ref={messagesEndRef}
      >
        {elements.length === 0 && (
          <div className="text-center text-gray-400 text-sm font-mono mt-8">
            <p>Welcome! Let's create your contract.</p>
            <p className="text-xs mt-2">Choose your role to get started:</p>
          </div>
        )}
        {elements}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-700 flex-shrink-0">
        {/* Quick Actions (only show when no messages) */}
        {elements.length === 0 && (
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => handleQuickAction("I am a client")}
              className="px-4 py-2 bg-gradient-to-r from-[#4299e1] to-[#2b6cb0] text-white rounded-lg font-mono text-sm hover:opacity-90 transition-opacity"
            >
              I am a Client
            </button>
            <button
              onClick={() => handleQuickAction("I am a freelancer")}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-lg font-mono text-sm hover:opacity-90 transition-opacity"
            >
              I am a Freelancer
            </button>
          </div>
        )}

        {/* Message Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 bg-gray-700/50 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-[#4299e1] focus:outline-none font-mono text-sm"
            disabled={isGeneratingContract}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isGeneratingContract}
            className="px-4 py-2 bg-gradient-to-r from-[#4299e1] to-[#2b6cb0] text-white rounded-lg font-mono text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}