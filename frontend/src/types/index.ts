export interface ToolDefinition {
  name: string;
  description?: string;
}

export interface AgentDefinition {
  id: string;
  name: string;
  model: string;
  system_prompt: string;
  tools: string[];
}

export interface EdgeDefinition {
  from: string;
  to: string;
  condition: 'always' | 'on_success' | 'on_failure';
}

export interface InputField {
  name: string;
  type: string;
  required: boolean;
}

export interface OutputField {
  name: string;
  type: string;
}

export interface WorkflowDefinition {
  name: string;
  description?: string;
  version: string;
  agents: AgentDefinition[];
  edges: EdgeDefinition[];
  input: InputField[];
  output: OutputField[];
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  version: string;
  definition: WorkflowDefinition;
  created_at: string;
  updated_at: string;
}

export interface WorkflowCreate {
  name: string;
  description?: string;
  definition: WorkflowDefinition;
}

export interface Execution {
  id: string;
  workflow_id: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  input_data?: Record<string, unknown>;
  output_data?: Record<string, unknown>;
  started_at?: string;
  completed_at?: string;
  error?: string;
}

export interface ExecutionCreate {
  input_data: Record<string, unknown>;
}

export interface ExecutionLog {
  id: string;
  agent_id?: string;
  step: string;
  message: string;
  created_at: string;
}

export interface DAGNode {
  id: string;
  data: {
    label: string;
    agent: AgentDefinition;
  };
  position: {
    x: number;
    y: number;
  };
}

export interface DAGEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}