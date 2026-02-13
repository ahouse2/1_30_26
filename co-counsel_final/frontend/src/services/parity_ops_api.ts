import axios from 'axios';

const BASE = (() => {
  if (typeof __API_BASE__ !== 'undefined' && __API_BASE__) {
    return __API_BASE__ as string;
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:8000';
})();

function withBase(path: string): string {
  return `${BASE}${path}`;
}

export interface ParityTask {
  task_id: string;
  title: string;
  owner: string;
  priority: 'low' | 'medium' | 'high';
  status: 'queued' | 'running' | 'blocked' | 'done';
  due_date?: string | null;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ParityMatrixItem {
  capability: string;
  status: 'implemented' | 'partial' | 'planned';
  notes: string;
}

export interface ParityMatrixSummary {
  implemented: number;
  partial: number;
  planned: number;
  total: number;
  score: number;
}

export interface LegacyWorkflow {
  workflow_id: string;
  title: string;
  description: string;
}

export const listParityTasks = async (caseId: string): Promise<ParityTask[]> => {
  const response = await axios.get<{ tasks: ParityTask[] }>(withBase('/parity/tasks'), {
    params: { case_id: caseId },
  });
  return response.data.tasks ?? [];
};

export const createParityTask = async (
  payload: Partial<ParityTask> & { case_id: string; title: string }
): Promise<ParityTask> => {
  const response = await axios.post<{ task: ParityTask }>(withBase('/parity/tasks'), payload);
  return response.data.task;
};

export const updateParityTask = async (
  caseId: string,
  taskId: string,
  patch: Partial<ParityTask>
): Promise<ParityTask> => {
  const response = await axios.patch<{ task: ParityTask }>(
    withBase(`/parity/tasks/${encodeURIComponent(taskId)}`),
    patch,
    { params: { case_id: caseId } }
  );
  return response.data.task;
};

export const runParityDraft = async (
  caseId: string,
  documentType: string,
  instructions: string
): Promise<Record<string, unknown>> => {
  const response = await axios.post(withBase('/parity/draft'), {
    case_id: caseId,
    document_type: documentType,
    instructions,
  });
  return response.data;
};

export const runParityRiskAnalysis = async (
  claimText: string,
  evidenceText: string
): Promise<Record<string, unknown>> => {
  const response = await axios.post(withBase('/parity/analyze'), {
    claim_text: claimText,
    evidence_text: evidenceText,
  });
  return response.data;
};

export const runParityPrivilegeBates = async (
  documentText: string,
  batesPrefix: string,
  startNumber = 1
): Promise<Record<string, unknown>> => {
  const response = await axios.post(withBase('/parity/privilege-bates'), {
    document_text: documentText,
    bates_prefix: batesPrefix,
    start_number: startNumber,
  });
  return response.data;
};

export const getParityMatrix = async (): Promise<{
  summary: ParityMatrixSummary;
  items: ParityMatrixItem[];
}> => {
  const response = await axios.get(withBase('/parity/matrix'));
  return response.data;
};

export const listLegacyWorkflows = async (): Promise<LegacyWorkflow[]> => {
  const response = await axios.get<{ workflows: LegacyWorkflow[] }>(withBase('/parity/legacy-workflows'));
  return response.data.workflows ?? [];
};

export const runLegacyWorkflow = async (
  caseId: string,
  workflowId: string,
  prompt: string
): Promise<Record<string, unknown>> => {
  const response = await axios.post(withBase('/parity/legacy-workflows/run'), {
    case_id: caseId,
    workflow_id: workflowId,
    prompt,
  });
  return response.data;
};
