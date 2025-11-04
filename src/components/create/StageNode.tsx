"use client";

import React from 'react';
import { StageNodeProps, GraphState } from '@/lib/types';

interface EnhancedStageNodeProps extends StageNodeProps {
  graphState?: GraphState;
  isCurrentStage?: boolean;
}

export default function StageNode({ 
  stage, 
  status, 
  index, 
  isLast, 
  description,
  graphState,
  isCurrentStage 
}: EnhancedStageNodeProps) {
  
  // Enhanced status display with graph state information
  const getStatusInfo = () => {
    const baseInfo = {
      color: status === 'completed' ? 'text-green-400' : 
             status === 'active' ? 'text-[#4299e1]' : 'text-gray-500',
      bgColor: status === 'completed' ? 'bg-green-400' : 
               status === 'active' ? 'bg-[#4299e1]' : 'bg-gray-600',
      icon: status === 'completed' ? '✓' : 
            status === 'active' ? '●' : '○',
      label: status === 'completed' ? 'Completed' : 
             status === 'active' ? 'In Progress' : 'Pending'
    };

    // Add graph state specific information
    if (graphState && isCurrentStage) {
      const { stage: graphStage, progress, collectedFields } = graphState;
      
      if (graphStage === 'information_collection' && progress !== undefined) {
        baseInfo.label = `${baseInfo.label} (${progress.toFixed(0)}%)`;
      }
      
      if (graphStage === 'data_ready' && collectedFields) {
        const fieldCount = Object.values(collectedFields).filter(Boolean).length;
        const totalFields = Object.keys(collectedFields).length;
        baseInfo.label = `${baseInfo.label} (${fieldCount}/${totalFields} fields)`;
      }
    }

    return baseInfo;
  };

  const statusInfo = getStatusInfo();

  // Get additional details from graph state
  const getAdditionalDetails = () => {
    if (!graphState || !isCurrentStage) return null;

    const details = [];
    
    // Show collected data for current stage
    const baseInfo = graphState.baseInfo || {};
    const typeSpecificInfo = graphState.typeSpecificInfo || {};
      
    // Identity stage details
    if (index === 0) {
      if (baseInfo.clientName && typeof baseInfo.clientName === 'string') {
        details.push(`Name: ${baseInfo.clientName}`);
      }
      if (baseInfo.email && typeof baseInfo.email === 'string') {
        details.push(`Email: ${baseInfo.email}`);
      }
      if (baseInfo.walletAddress && typeof baseInfo.walletAddress === 'string') {
        details.push(`Wallet: ${baseInfo.walletAddress.slice(0, 8)}...`);
      }
    }
    
    // Project details stage
    if (index === 1) {
      if (baseInfo.projectName && typeof baseInfo.projectName === 'string') {
        details.push(`Project: ${baseInfo.projectName}`);
      }
      if (baseInfo.projectDescription && typeof baseInfo.projectDescription === 'string') {
        details.push(`Description: ${baseInfo.projectDescription.slice(0, 30)}...`);
      }
    }
    
    // Contract terms stage
    if (index === 2) {
      if (baseInfo.paymentAmount) {
        details.push(`Value: ${baseInfo.paymentAmount}`);
      }
      if (typeSpecificInfo.serviceDuration && typeof typeSpecificInfo.serviceDuration === 'string') {
        details.push(`Duration: ${typeSpecificInfo.serviceDuration}`);
      }
      if (baseInfo.escrowType && typeof baseInfo.escrowType === 'string') {
        details.push(`Escrow: ${baseInfo.escrowType}`);
      }
    }

    return details.length > 0 ? details : null;
  };

  const additionalDetails = getAdditionalDetails();

  // Enhanced connector line with progress indication
  const getConnectorStyle = () => {
    if (isLast) return {};
    
    const baseStyle = {
      position: 'absolute' as const,
      left: '15px',
      top: '32px',
      width: '2px',
      height: '24px',
      transition: 'all 0.3s ease'
    };

    if (status === 'completed') {
      return {
        ...baseStyle,
        background: 'linear-gradient(to bottom, #10b981, #059669)'
      };
    } else if (status === 'active' && graphState?.progress) {
      const progressHeight = (graphState.progress / 100) * 24;
      return {
        ...baseStyle,
        background: `linear-gradient(to bottom, #4299e1 0%, #4299e1 ${progressHeight}px, #4b5563 ${progressHeight}px, #4b5563 100%)`
      };
    } else {
      return {
        ...baseStyle,
        backgroundColor: '#4b5563'
      };
    }
  };

  return (
    <div className="relative flex items-start space-x-3 group">
      {/* Connector Line */}
      {!isLast && (
        <div style={getConnectorStyle()} />
      )}
      
      {/* Stage Circle */}
      <div className="relative flex-shrink-0">
        <div 
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all duration-300 ${statusInfo.bgColor} ${
            isCurrentStage ? 'ring-2 ring-white/30 scale-110' : ''
          } ${
            status === 'active' ? 'animate-pulse' : ''
          }`}
        >
          <span className="text-white">{statusInfo.icon}</span>
        </div>
        
        {/* Current stage indicator */}
        {isCurrentStage && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#4299e1] rounded-full animate-ping" />
        )}
      </div>
      
      {/* Stage Content */}
      <div className="flex-1 min-w-0 pb-4">
        <div className="flex items-center justify-between">
          <h3 className={`text-sm font-mono font-medium transition-colors ${
            status === 'completed' ? 'text-green-400' : 
            status === 'active' ? 'text-white' : 'text-gray-400'
          }`}>
            {stage}
          </h3>
          
          {/* Status Badge */}
          <span className={`px-2 py-0.5 rounded-full text-xs font-mono transition-all ${
            status === 'completed' ? 'bg-green-400/20 text-green-400' :
            status === 'active' ? 'bg-[#4299e1]/20 text-[#4299e1]' : 'bg-gray-600/20 text-gray-500'
          } ${isCurrentStage ? 'ring-1 ring-current' : ''}`}>
            {statusInfo.label}
          </span>
        </div>
        
        {/* Description */}
        {description && (
          <p className={`text-xs font-mono mt-1 transition-colors ${
            status === 'active' ? 'text-gray-300' : 'text-gray-500'
          }`}>
            {description}
          </p>
        )}
        
        {/* Additional Details from Graph State */}
        {additionalDetails && (
          <div className="mt-2 space-y-1">
            {additionalDetails.map((detail, idx) => (
              <div 
                key={idx}
                className="text-xs font-mono text-[#4299e1]/80 bg-[#4299e1]/10 px-2 py-1 rounded border border-[#4299e1]/20"
              >
                {detail}
              </div>
            ))}
          </div>
        )}
        
        {/* Progress indicator for active stages */}
        {status === 'active' && graphState?.progress !== undefined && isCurrentStage && (
          <div className="mt-2">
            <div className="w-full bg-gray-700 rounded-full h-1">
              <div 
                className="bg-gradient-to-r from-[#4299e1] to-[#2b6cb0] h-1 rounded-full transition-all duration-500"
                style={{ width: `${graphState.progress}%` }}
              />
            </div>
            <div className="text-xs text-[#4299e1] font-mono mt-1">
              {graphState.progress.toFixed(1)}% complete
            </div>
          </div>
        )}
        
        {/* Stage-specific status messages */}
        {isCurrentStage && graphState && (
          <div className="mt-2">
            {graphState.stage === 'information_collection' && (
              <div className="text-xs text-yellow-400 font-mono">
                🔄 Collecting information...
              </div>
            )}
            {graphState.stage === 'data_ready' && (
              <div className="text-xs text-green-400 font-mono">
                ✓ Data collection complete
              </div>
            )}
            {graphState.stage === 'completed' && (
              <div className="text-xs text-green-400 font-mono">
                🎉 Ready for contract generation
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}