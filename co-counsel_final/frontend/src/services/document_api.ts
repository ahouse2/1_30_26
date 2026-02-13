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

export interface FileUploadStartResponse {
  upload_id: string;
  chunk_size: number;
  folder_id: string;
  case_id?: string | null;
  relative_path: string;
}

export interface FileUploadCompleteResponse {
  upload_id: string;
  relative_path: string;
  final_path: string;
}

export const startFileUpload = async (
  folderId: string,
  relativePath: string,
  totalBytes: number
): Promise<FileUploadStartResponse> => {
  const response = await axios.post<FileUploadStartResponse>(
    `/api/ingestion/folder/${folderId}/file/start`,
    {
      relative_path: relativePath,
      total_bytes: totalBytes,
    }
  );
  return response.data;
};

export const uploadFileChunk = async (
  uploadId: string,
  chunkIndex: number,
  data: Blob
): Promise<void> => {
  const formData = new FormData();
  formData.append('chunk_index', String(chunkIndex));
  formData.append('chunk', data, 'chunk.bin');
  await axios.post(`/api/ingestion/file/${uploadId}/chunk`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const completeFileUpload = async (
  uploadId: string
): Promise<FileUploadCompleteResponse> => {
  const response = await axios.post<FileUploadCompleteResponse>(
    `/api/ingestion/file/${uploadId}/complete`
  );
  return response.data;
};

export const completeFolderUpload = async (folderId: string): Promise<IngestionStatusResponse> => {
  const response = await axios.post<IngestionStatusResponse>(
    `/api/ingestion/folder/${folderId}/complete`
  );
  return response.data;
};

export const runIngestionStage = async (
  jobId: string,
  stage: 'load' | 'chunk' | 'embed' | 'enrich' | 'forensics',
  resumeDownstream: boolean
): Promise<IngestionStatusResponse> => {
  const response = await axios.post<IngestionStatusResponse>(
    `/api/ingestion/${jobId}/stage/${stage}/run`,
    {
      resume_downstream: resumeDownstream,
    }
  );
  return response.data;
};
