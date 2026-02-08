import axios from 'axios';
import { buildApiUrl } from '@/config';

interface UploadDocumentResponse {
  message: string;
  data: {
    doc_id: string;
    version: string;
    case_id: string;
    doc_type: string;
    file_name: string;
    ingestion_status: string;
    pipeline_result: string[]; // Categories from pipeline
  };
}

export const uploadDocument = async (
  caseId: string,
  docType: 'my_documents' | 'opposition_documents',
  file: File
): Promise<UploadDocumentResponse> => {
  const formData = new FormData();
  formData.append('case_id', caseId);
  formData.append('doc_type', docType);
  formData.append('file', file);

  const response = await axios.post<UploadDocumentResponse>(buildApiUrl('/upload'), formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

interface AutomationStageStatus {
  name: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  started_at?: string | null;
  completed_at?: string | null;
  message?: string | null;
}

interface FolderAutomationResponse {
  job_id: string;
  stages: AutomationStageStatus[];
  results: Record<string, unknown>;
}

export const uploadFolder = async (payload: {
  caseId: string;
  files: File[];
  question?: string;
  stages?: string[];
  autoRun?: boolean;
  autonomyLevel?: string;
}): Promise<FolderAutomationResponse> => {
  const formData = new FormData();
  formData.append('case_id', payload.caseId);
  formData.append('auto_run', String(payload.autoRun ?? true));
  formData.append('autonomy_level', payload.autonomyLevel ?? 'balanced');
  if (payload.question) {
    formData.append('question', payload.question);
  }
  if (payload.stages && payload.stages.length > 0) {
    payload.stages.forEach((stage) => formData.append('stages', stage));
  }
  payload.files.forEach((file) => {
    formData.append('files', file);
    const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
    formData.append('relative_paths', relativePath && relativePath.length > 0 ? relativePath : file.name);
  });

  const response = await axios.post<FolderAutomationResponse>(buildApiUrl('/automation/ingest-folder'), formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

interface DocumentContentResponse {
  content: string;
}

export const getDocument = async (
  caseId: string,
  docType: 'my_documents' | 'opposition_documents',
  docId: string,
  version?: string
): Promise<DocumentContentResponse> => {
  const params = version ? { version } : {};
  const response = await axios.get<DocumentContentResponse>(
    buildApiUrl(`/${caseId}/${docType}/${docId}`),
    { params }
  );
  return response.data;
};

interface DocumentVersionsResponse {
  versions: string[];
}

export const listDocumentVersions = async (
  caseId: string,
  docType: 'my_documents' | 'opposition_documents',
  docId: string
): Promise<string[]> => {
  const response = await axios.get<string[]>(buildApiUrl(`/${caseId}/${docType}/${docId}/versions`));
  return response.data;
};

export const deleteDocument = async (
  caseId: string,
  docType: 'my_documents' | 'opposition_documents',
  docId: string,
  version?: string
): Promise<{ message: string }> => {
  const params = version ? { version } : {};
  const response = await axios.delete<{ message: string }>(
    buildApiUrl(`/${caseId}/${docType}/${docId}`),
    { params }
  );
  return response.data;
};
