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

const API_BASE_URL = '/workflow';

export interface WorkflowRunResponse {
  runs: Array<{ run_id: string; phase: string; payload: Record<string, unknown> }>;
}

export interface WorkflowRunState {
  run_id: string;
  case_id: string;
  requested_phases: string[];
  status: string;
  control: Record<string, boolean>;
  current_phase?: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  phases: Array<{
    phase: string;
    status: string;
    run_id?: string | null;
    artifacts: Array<{ artifact_id: string; format: string; path: string }>; 
    summary: Record<string, unknown>;
    started_at?: string | null;
    completed_at?: string | null;
    error?: string | null;
  }>;
}

export interface WorkflowRunEventsResponse {
  events: Array<{ event: string; timestamp: string; payload: Record<string, unknown> }>; 
  cursor: number;
}

export const runWorkflow = async (caseId: string, phases: string[]): Promise<WorkflowRunResponse> => {
  const response = await axios.post<WorkflowRunResponse>(withBase(`${API_BASE_URL}/run`), {
    case_id: caseId,
    phases,
    auto_run: true,
  });
  return response.data;
};

export const runPhase = async (caseId: string, phases: string[]): Promise<WorkflowRunResponse> => {
  const response = await axios.post<WorkflowRunResponse>(withBase(`${API_BASE_URL}/phase`), {
    case_id: caseId,
    phases,
  });
  return response.data;
};

export const createWorkflowRun = async (caseId: string, phases: string[]): Promise<WorkflowRunState> => {
  const response = await axios.post<WorkflowRunState>(withBase(`${API_BASE_URL}/runs`), {
    case_id: caseId,
    phases,
  });
  return response.data;
};

export const getWorkflowRun = async (caseId: string, runId: string): Promise<WorkflowRunState> => {
  const response = await axios.get<WorkflowRunState>(withBase(`${API_BASE_URL}/runs/${runId}`), {
    params: { case_id: caseId },
  });
  return response.data;
};

export const getWorkflowEvents = async (caseId: string, runId: string, since: number): Promise<WorkflowRunEventsResponse> => {
  const response = await axios.get<WorkflowRunEventsResponse>(withBase(`${API_BASE_URL}/runs/${runId}/events`), {
    params: { case_id: caseId, since },
  });
  return response.data;
};

export const pauseWorkflowRun = async (caseId: string, runId: string): Promise<WorkflowRunState> => {
  const response = await axios.post<WorkflowRunState>(withBase(`${API_BASE_URL}/runs/${runId}/pause`), null, {
    params: { case_id: caseId },
  });
  return response.data;
};

export const resumeWorkflowRun = async (caseId: string, runId: string): Promise<WorkflowRunState> => {
  const response = await axios.post<WorkflowRunState>(withBase(`${API_BASE_URL}/runs/${runId}/resume`), null, {
    params: { case_id: caseId },
  });
  return response.data;
};

export const stopWorkflowRun = async (caseId: string, runId: string): Promise<WorkflowRunState> => {
  const response = await axios.post<WorkflowRunState>(withBase(`${API_BASE_URL}/runs/${runId}/stop`), null, {
    params: { case_id: caseId },
  });
  return response.data;
};

export const retryWorkflowPhase = async (
  caseId: string,
  runId: string,
  phase?: string
): Promise<WorkflowRunState> => {
  const response = await axios.post<WorkflowRunState>(withBase(`${API_BASE_URL}/runs/${runId}/retry`), {
    phase,
  }, {
    params: { case_id: caseId },
  });
  return response.data;
};
