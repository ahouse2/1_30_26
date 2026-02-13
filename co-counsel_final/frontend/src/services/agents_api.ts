import axios from 'axios';

const BASE = (() => {
  if (typeof __API_BASE__ !== 'undefined' && __API_BASE__) {
    return __API_BASE__ as string;
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
})();

function withBase(path: string): string {
  return `${BASE}${path}`;
}

export type AutonomyLevel = 'low' | 'balanced' | 'high';

export interface AgentRunRequest {
  case_id: string;
  question: string;
  top_k?: number;
  autonomy_level?: AutonomyLevel;
  max_turns?: number;
}

export interface AgentRunResponse {
  thread_id: string;
  case_id: string;
  question: string;
  created_at: string;
  updated_at: string;
  status: string;
  final_answer: string;
  citations: Array<Record<string, unknown>>;
  qa_scores: Record<string, number>;
  qa_notes: string[];
  turns: Array<Record<string, unknown>>;
  errors: Array<Record<string, unknown>>;
  telemetry: Record<string, unknown>;
  memory: Record<string, unknown>;
}

export const runAgents = async (payload: AgentRunRequest): Promise<AgentRunResponse> => {
  const response = await axios.post<AgentRunResponse>(withBase('/agents/run'), payload);
  return response.data;
};
