import axios from 'axios';

const API_BASE_URL = '/api/documents'; // Adjust if your API is hosted elsewhere

interface UploadDocumentResponse {
  message: string;
  data: {
    job_id: string;
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
  file: File,
  onUploadProgress?: (progress: number) => void
): Promise<UploadDocumentResponse> => {
  const formData = new FormData();
  formData.append('case_id', caseId);
  formData.append('doc_type', docType);
  formData.append('file', file);

  const response = await axios.post<UploadDocumentResponse>(`${API_BASE_URL}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (event) => {
      if (!onUploadProgress) return;
      const total = event.total || event.loaded;
      const progress = total ? Math.round((event.loaded / total) * 100) : 0;
      onUploadProgress(progress);
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
  const response = await axios.get<DocumentContentResponse>(`${API_BASE_URL}/${caseId}/${docType}/${docId}`, { params });
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
  const response = await axios.get<string[]>(`${API_BASE_URL}/${caseId}/${docType}/${docId}/versions`);
  return response.data;
};

export const deleteDocument = async (
  caseId: string,
  docType: 'my_documents' | 'opposition_documents',
  docId: string,
  version?: string
): Promise<{ message: string }> => {
  const params = version ? { version } : {};
  const response = await axios.delete<{ message: string }>(`${API_BASE_URL}/${caseId}/${docType}/${docId}`, { params });
  return response.data;
};

export interface IngestionStatusResponse {
  job_id: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  submitted_at: string;
  updated_at: string;
  documents: Array<{
    id: string;
    uri?: string;
    type: string;
    title: string;
    metadata: Record<string, unknown>;
  }>;
  errors: Array<{
    code: string;
    message: string;
    source?: string;
  }>;
  status_details: {
    ingestion: { documents: number; skipped: Array<Record<string, unknown>> };
    timeline: { events: number };
    forensics: { artifacts: Array<Record<string, unknown>>; last_run_at?: string | null };
    graph: { nodes: number; edges: number; triples: number };
  };
}

export const getIngestionStatus = async (jobId: string): Promise<IngestionStatusResponse> => {
  const response = await axios.get<IngestionStatusResponse>(`/api/ingestion/${jobId}/status`);
  return response.data;
};

export interface FolderUploadStartResponse {
  folder_id: string;
  case_id: string;
  chunk_size: number;
}

export const startFolderUpload = async (
  folderName: string,
  docType: 'my_documents' | 'opposition_documents'
): Promise<FolderUploadStartResponse> => {
  const response = await axios.post<FolderUploadStartResponse>('/api/ingestion/folder/start', {
    folder_name: folderName,
    doc_type: docType,
  });
  return response.data;
};
