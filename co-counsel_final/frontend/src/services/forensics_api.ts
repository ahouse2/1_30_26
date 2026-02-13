import axios from 'axios';
import { buildApiUrl } from '@/config';

export interface ForensicsStage {
  name: string;
  started_at: string;
  completed_at: string;
  status: string;
  notes: string[];
}

export interface ForensicsSignal {
  type: string;
  level: 'info' | 'warning' | 'error';
  detail: string;
  data?: Record<string, unknown>;
}

export interface ForensicsResponse {
  summary: string;
  data: Record<string, unknown>;
  metadata: Record<string, unknown>;
  signals: ForensicsSignal[];
  stages: ForensicsStage[];
  fallback_applied: boolean;
  schema_version: string;
  generated_at?: string | null;
}

export interface ForensicsReportVersion {
  version_id: string;
  created_at: string;
  source: 'current' | 'snapshot';
  artifacts: string[];
  path: string;
}

export interface ForensicsAuditEvent {
  timestamp?: string | null;
  event_type: string;
  principal_id: string;
  resource_id: string;
  details: Record<string, unknown>;
}

export interface ForensicsExportResponse {
  export_id: string;
  format: string;
  filename: string;
  download_url: string;
  created_at: string;
}

// --- Crypto Tracing Types ---
export interface WalletAddress {
  address: string;
  blockchain: string;
  currency: string;
  is_valid: boolean;
}

export interface Transaction {
  tx_id: string;
  sender: string;
  receiver: string;
  amount: number;
  currency: string;
  timestamp: string;
  blockchain: string;
}

export interface ClusterAddressRef {
  address: string;
  chain: {
    chain_id: number;
    name: string;
    family: 'evm' | 'utxo' | 'solana' | 'tron';
  };
  labels: string[];
}

export interface ProvenanceRecord {
  source: string;
  method: string;
  confidence: number;
  details?: Record<string, unknown>;
}

export interface ClusterResult {
  cluster_id: string;
  addresses: ClusterAddressRef[];
  provenance: ProvenanceRecord[];
}

export interface CryptoTracingResult {
  wallets_found: WalletAddress[];
  transactions_traced: Transaction[];
  clusters: ClusterResult[];
  bridge_matches: Record<string, unknown>[];
  custody_attribution?: Array<Record<string, unknown>>;
  visual_graph_mermaid?: string;
  details: string;
}

// --- API Calls ---
export const getForensicAnalysis = async (
  caseId: string,
  docType: string,
  docId: string,
  version?: string
): Promise<ForensicsResponse> => {
  const response = await axios.get<ForensicsResponse>(
    buildApiUrl(`/forensics/${caseId}/${docType}/${docId}/forensics`),
    { params: { version } }
  );
  return response.data;
};

export const getCryptoTracing = async (
  caseId: string,
  docType: string,
  docId: string,
  version?: string
): Promise<CryptoTracingResult> => {
  const response = await axios.get<CryptoTracingResult>(
    buildApiUrl(`/forensics/${caseId}/${docType}/${docId}/crypto-tracing`),
    { params: { version } }
  );
  return response.data;
};

export const getImageForensics = async (
  caseId: string,
  docType: string,
  docId: string,
  version?: string
): Promise<ForensicsResponse> => {
  const response = await axios.get<ForensicsResponse>(
    buildApiUrl(`/forensics/${caseId}/${docType}/${docId}/image-forensics`),
    { params: { version } }
  );
  return response.data;
};

export const getFinancialForensics = async (
  caseId: string,
  docType: string,
  docId: string,
  version?: string
): Promise<ForensicsResponse> => {
  const response = await axios.get<ForensicsResponse>(
    buildApiUrl(`/forensics/${caseId}/${docType}/${docId}/financial-forensics`),
    { params: { version } }
  );
  return response.data;
};

export const getForensicsHistory = async (
  caseId: string,
  docType: string,
  docId: string,
  limit = 20
): Promise<{ file_id: string; versions: ForensicsReportVersion[] }> => {
  const response = await axios.get<{ file_id: string; versions: ForensicsReportVersion[] }>(
    buildApiUrl(`/forensics/${caseId}/${docType}/${docId}/history`),
    { params: { limit } }
  );
  return response.data;
};

export const getForensicsAudit = async (
  caseId: string,
  docType: string,
  docId: string,
  limit = 100
): Promise<{ file_id: string; events: ForensicsAuditEvent[] }> => {
  const response = await axios.get<{ file_id: string; events: ForensicsAuditEvent[] }>(
    buildApiUrl(`/forensics/${caseId}/${docType}/${docId}/audit`),
    { params: { limit } }
  );
  return response.data;
};

export const exportForensicsReport = async (
  caseId: string,
  docType: string,
  docId: string,
  payload: { format: 'json' | 'md' | 'html'; artifact?: 'document' | 'image' | 'financial' }
): Promise<ForensicsExportResponse> => {
  const response = await axios.post<ForensicsExportResponse>(
    buildApiUrl(`/forensics/${caseId}/${docType}/${docId}/export`),
    payload
  );
  return response.data;
};
