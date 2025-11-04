"use client";

import React from 'react';
import { CreateDiagramProps, StageStatus, GraphState } from '@/lib/types';
import { FLOW_METADATA } from '@/lib/flows';
import StageNode from './StageNode';

interface EnhancedCreateDiagramProps extends CreateDiagramProps {
  graphState?: GraphState;
  contractProgress?: number;
}

export default function CreateDiagram({ 
  flowType, 
  currentStage, 
  onStageClick,
  graphState,
  contractProgress 
}: EnhancedCreateDiagramProps) {
  
  const flowData = FLOW_METADATA[flowType];
  const stages = flowData.stages;
  const descriptions = flowData.stageDescriptions;

  // Enhanced stage status calculation using graph state
  const getStageStatus = (index: number): StageStatus => {
    // Use graph state information if available for more accurate status
    if (graphState) {
      const { stage, stageIndex, progress = 0, collectedFields, isStageComplete } = graphState;
      
      // If we have a specific stage index from the graph
      if (stageIndex !== undefined) {
        if (index < stageIndex) return 'completed';
        if (index === stageIndex) {
          // Check completion status more thoroughly
          if (isStageComplete || progress >= 100) return 'completed';
          return 'active';
        }
        return 'pending';
      }
      
      // Enhanced stage mapping based on progress and collection status
      if (stage === 'completed' && progress >= 100) {
        return index <= stages.length - 1 ? 'completed' : 'pending';
      }
      
      if (stage === 'data_ready' || stage === 'information_collection') {
        // Map progress to stages more accurately
        const progressStage = Math.floor((progress / 100) * stages.length);
        if (index < progressStage) return 'completed';
        if (index === progressStage) return progress >= 100 ? 'completed' : 'active';
        return 'pending';
      }
    }
    
    // Fallback to original logic
    if (index < currentStage) return 'completed';
    if (index === currentStage) return 'active';
    return 'pending';
  };

  // Calculate actual progress from graph state
  const getActualProgress = (): number => {
    if (contractProgress !== undefined) return contractProgress;
    if (graphState?.progress !== undefined) return graphState.progress;
    
    // Calculate based on current stage
    return Math.min(((currentStage + 1) / stages.length) * 100, 100);
  };

  // Enhanced stage information with better synchronization
  const stageInfo = React.useMemo(() => {
    const progress = getActualProgress();
    const currentIndex = graphState?.stageIndex ?? currentStage;
    
    return {
      progress,
      currentIndex,
      totalStages: stages.length,
      isComplete: progress >= 100 || graphState?.stage === 'completed',
      stageName: stages[currentIndex] || stages[currentStage] || 'Getting Started'
    };
  }, [graphState, currentStage, contractProgress]);

  // Enhanced stage descriptions based on graph state
  const getEnhancedDescription = (stage: string, index: number): string => {
    const baseDescription = descriptions?.[stage] || '';
    
    if (!graphState) return baseDescription;
    
    // Add dynamic information based on collected fields
    if (stage === 'Identity Selected' && graphState.collectedFields) {
      const fields = graphState.collectedFields;
      const collected = [];
      if (fields.clientName) collected.push('Name');
      if (fields.email) collected.push('Email');
      if (fields.walletAddress) collected.push('Wallet');
      
      if (collected.length > 0) {
        return `${baseDescription} (Collected: ${collected.join(', ')})`;
      }
    }
    
    if (stage === 'Project Details Entered' && graphState.collectedFields) {
      const fields = graphState.collectedFields;
      const collected = [];
      if (fields.projectName) collected.push('Name');
      if (fields.projectDescription) collected.push('Description');
      
      if (collected.length > 0) {
        return `${baseDescription} (Collected: ${collected.join(', ')})`;
      }
    }
    
    return baseDescription;
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-160px)] bg-gray-800/30 rounded-xl backdrop-blur-sm border border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-[#4299e1]/10 to-[#2b6cb0]/10 flex-shrink-0">
        <h2 className="text-white font-mono font-medium text-sm">Contract Flow</h2>
        <p className="text-gray-300 text-xs font-mono mt-1">
          {flowType === 'execution' ? 'Contract Execution Process' : 'Information Collection Process'}
        </p>
        {graphState?.stage && (
          <p className="text-gray-400 text-xs font-mono mt-1">
            Status: {graphState.stage.replace('_', ' ').toUpperCase()}
          </p>
        )}
      </div>

      {/* Enhanced Progress Bar */}
      <div className="p-4 border-b border-gray-700 flex-shrink-0">
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-[#4299e1] to-[#2b6cb0] h-2 rounded-full transition-all duration-500 relative"
            style={{ width: `${stageInfo.progress}%` }}
          >
            {/* Animated progress indicator */}
            {stageInfo.progress > 0 && stageInfo.progress < 100 && (
              <div className="absolute right-0 top-0 w-1 h-2 bg-white/50 animate-pulse" />
            )}
          </div>
        </div>
        
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-400 font-mono">
            Step {stageInfo.currentIndex + 1}
          </span>
          <span className="text-xs text-gray-400 font-mono">
            {stageInfo.totalStages} Steps
          </span>
        </div>
        
        <div className="mt-1 text-center">
          <span className="text-xs text-[#4299e1] font-mono">
            {stageInfo.progress.toFixed(1)}% Complete
          </span>
          {graphState?.stage === 'completed' && (
            <span className="text-xs text-green-400 font-mono ml-2">✓ Ready for Contract</span>
          )}
        </div>
      </div>

      {/* Stages */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        <div className="space-y-3">
          {stages.map((stage, index) => {
            const status = getStageStatus(index);
            const enhancedDescription = getEnhancedDescription(stage, index);
            
            return (
              <StageNode
                key={stage}
                stage={stage}
                status={status}
                index={index}
                isLast={index === stages.length - 1}
                description={enhancedDescription}
                graphState={graphState}
                isCurrentStage={index === stageInfo.currentIndex}
              />
            );
          })}
        </div>
      </div>

      {/* Enhanced Navigation */}
      <div className="p-4 border-t border-gray-700 flex justify-between items-center flex-shrink-0">
        <button
          onClick={() => onStageClick?.(Math.max(stageInfo.currentIndex - 1, 0))}
          disabled={stageInfo.currentIndex <= 0}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-mono text-xs transition-colors"
        >
          Previous
        </button>
        
        <div className="text-center">
          <div className="text-xs text-gray-400 font-mono">
            {stageInfo.currentIndex + 1} of {stageInfo.totalStages}
          </div>
          <div className="text-xs text-gray-500 font-mono mt-0.5">
            {stageInfo.stageName}
          </div>
        </div>
        
        <button
          onClick={() => onStageClick?.(Math.min(stageInfo.currentIndex + 1, stages.length - 1))}
          disabled={stageInfo.currentIndex >= stages.length - 1 || getStageStatus(stageInfo.currentIndex) !== 'completed'}
          className="px-3 py-1.5 bg-gradient-to-r from-[#4299e1] to-[#2b6cb0] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-mono text-xs transition-opacity"
        >
          Next
        </button>
      </div>
    </div>
  );
}