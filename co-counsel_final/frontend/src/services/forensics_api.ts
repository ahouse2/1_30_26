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
    withBase(`/forensics/${caseId}/${docType}/${docId}/forensics`),
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
    withBase(`/forensics/${caseId}/${docType}/${docId}/crypto-tracing`),
    { params: { version } }
  );
  return response.data;
};
