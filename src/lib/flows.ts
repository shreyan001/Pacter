// Flow definitions for the /create page workflows

import { FlowType } from './types';

export const INFORMATION_FLOW = [
  "Identity Selected",
  "Project Details Entered", 
  "Deliverables Defined",
  "Payment Terms Set",
  "Review Contract",
  "Contract Created"
] as const;

export const EXECUTION_FLOW = [
  "Signatures Pending",
  "Escrow Deposited", 
  "Work in Progress",
  "Submission",
  "Review",
  "Payment Approved",
  "Contract Completed"
] as const;

export type FlowStage = typeof INFORMATION_FLOW[number] | typeof EXECUTION_FLOW[number];

// Flow metadata for UI display
export const FLOW_METADATA = {
  info: {
    title: "Information Collection",
    description: "Gathering project details and generating contract draft",
    stages: INFORMATION_FLOW,
    color: "blue"
  },
  execution: {
    title: "Contract Execution", 
    description: "Managing contract lifecycle from signatures to completion",
    stages: EXECUTION_FLOW,
    color: "green"
  }
} as const;

// Helper functions
export function getStageIndex(stage: FlowStage, flowType: FlowType): number {
  const stages = flowType === "info" ? INFORMATION_FLOW : EXECUTION_FLOW;
  return stages.findIndex(s => s === stage);
}

export function getNextStage(currentStage: FlowStage, flowType: FlowType): FlowStage | null {
  const stages = flowType === "info" ? INFORMATION_FLOW : EXECUTION_FLOW;
  const currentIndex = getStageIndex(currentStage, flowType);
  
  if (currentIndex === -1 || currentIndex >= stages.length - 1) {
    return null;
  }
  
  return stages[currentIndex + 1] as FlowStage;
}

export function getPreviousStage(currentStage: FlowStage, flowType: FlowType): FlowStage | null {
  const stages = flowType === "info" ? INFORMATION_FLOW : EXECUTION_FLOW;
  const currentIndex = getStageIndex(currentStage, flowType);
  
  if (currentIndex <= 0) {
    return null;
  }
  
  return stages[currentIndex - 1] as FlowStage;
}