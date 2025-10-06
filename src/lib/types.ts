// Shared TypeScript types for the /create page

import { FlowStage } from './flows';

// Flow type definition
export type FlowType = "info" | "execution";

// Graph state interface for AI graph integration
export interface GraphState {
  stage?: string;
  currentFlowStage?: FlowStage;
  stageIndex?: number;
  progress?: number;
  isStageComplete?: boolean;
  nextStage?: FlowStage | null;
  validationErrors?: string[];
  formData?: any;
  contractId?: string;
  contractData?: any;
  data?: any;
  missingFields?: string[];
  confirmed?: boolean;
  operation?: string;
  result?: string;
  messages?: string[];
  stageData?: any;
}

// Chat message types
export interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  quickActions?: QuickAction[];
}

export interface QuickAction {
  id: string;
  label: string;
  value: string;
  type: 'button' | 'select';
  options?: string[];
}

// Flow state management
export interface FlowState {
  currentFlow: FlowType;
  currentStage: number;
  stageData: Record<string, any>;
  isTransitioning: boolean;
}

// Stage status for visual representation
export type StageStatus = 'completed' | 'active' | 'pending';

export interface StageNodeProps {
  stage: FlowStage;
  status: StageStatus;
  index: number;
  isLast?: boolean;
}

// Chat component props
export interface CreateChatProps {
  flowType: FlowType;
  currentStage: number;
  setCurrentStage: (stage: number) => void;
  setFlowType: (type: FlowType) => void;
  onStageDataUpdate?: (data: any) => void;
  onGraphStateUpdate?: (graphState: GraphState, progress: number) => void;
}

// Diagram component props
export interface CreateDiagramProps {
  flowType: FlowType;
  currentStage: number;
  onStageClick?: (stageIndex: number) => void;
}

// Project data interfaces
export interface ProjectIdentity {
  userType: 'client' | 'freelancer';
  name: string;
  email: string;
  walletAddress?: string;
}

export interface ProjectDetails {
  title: string;
  description: string;
  category: string;
  estimatedDuration: string;
  complexity: 'simple' | 'medium' | 'complex';
}

export interface Deliverable {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  milestonePayment: number;
}

export interface PaymentTerms {
  totalAmount: number;
  currency: 'ETH' | 'USDC' | 'DAI';
  milestones: Deliverable[];
  escrowPercentage: number;
}

export interface ContractData {
  identity: ProjectIdentity;
  project: ProjectDetails;
  deliverables: Deliverable[];
  payment: PaymentTerms;
  legalTerms?: string;
  smartContractAddress?: string;
}

// AI chat context
export interface ChatContext {
  currentQuestion: string;
  expectedInputType: 'text' | 'selection' | 'number' | 'date';
  validationRules?: any;
  nextStageCondition?: (data: any) => boolean;
}

// Component state interfaces
export interface CreatePageState {
  flowState: FlowState;
  contractData: Partial<ContractData>;
  chatHistory: Message[];
  isLoading: boolean;
  error?: string;
}