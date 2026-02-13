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

export interface GraphNode {
  id: string;
  type: string;
  properties: Record<string, unknown>;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
  properties: Record<string, unknown>;
}

export interface GraphNeighborResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphSearchResponse {
  nodes: GraphNode[];
}

export interface GraphFact {
  id: string;
  claim: string;
  relation: string;
  source_id: string;
  target_id: string;
  citations: string[];
  confidence: number;
}

export interface GraphFactExtractionResponse {
  generated_at: string;
  case_id?: string | null;
  total: number;
  facts: GraphFact[];
}

export interface GraphSnapshotRecord {
  snapshot_id: string;
  case_id?: string | null;
  created_at: string;
  node_count: number;
  edge_count: number;
  checksum: string;
  notes?: string | null;
}

export interface GraphSnapshotListResponse {
  snapshots: GraphSnapshotRecord[];
}

export interface GraphSnapshotDiffSummary {
  added_nodes: number;
  removed_nodes: number;
  modified_nodes: number;
  added_edges: number;
  removed_edges: number;
  modified_edges: number;
}

export interface GraphSnapshotDiffResponse {
  baseline_snapshot_id: string;
  candidate_snapshot_id: string;
  computed_at: string;
  summary: GraphSnapshotDiffSummary;
  added_nodes: Array<Record<string, unknown>>;
  removed_nodes: Array<Record<string, unknown>>;
  modified_nodes: Array<Record<string, unknown>>;
  added_edges: Array<Record<string, unknown>>;
  removed_edges: Array<Record<string, unknown>>;
  modified_edges: Array<Record<string, unknown>>;
}

export async function fetchGraphOverview(params: {
  limit?: number;
  caseId?: string | null;
} = {}): Promise<GraphNeighborResponse> {
  const response = await axios.get<GraphNeighborResponse>(withBase('/graph/overview'), {
    params: {
      limit: params.limit,
      case_id: params.caseId || undefined,
    },
  });
  return response.data;
}

export async function fetchGraphNeighbors(nodeId: string): Promise<GraphNeighborResponse> {
  const response = await axios.get<GraphNeighborResponse>(withBase(`/graph/neighbors/${nodeId}`));
  return response.data;
}

export async function searchGraphNodes(params: {
  query: string;
  limit?: number;
  caseId?: string | null;
}): Promise<GraphSearchResponse> {
  const response = await axios.get<GraphSearchResponse>(withBase('/graph/search'), {
    params: {
      query: params.query,
      limit: params.limit,
      case_id: params.caseId || undefined,
    },
  });
  return response.data;
}

export async function fetchGraphFacts(params: {
  limit?: number;
  caseId?: string | null;
} = {}): Promise<GraphFactExtractionResponse> {
  const response = await axios.get<GraphFactExtractionResponse>(withBase('/graph/facts'), {
    params: {
      limit: params.limit,
      case_id: params.caseId || undefined,
    },
  });
  return response.data;
}

export async function createGraphSnapshot(payload: {
  caseId?: string | null;
  limit?: number;
  notes?: string;
}): Promise<GraphSnapshotRecord> {
  const response = await axios.post<GraphSnapshotRecord>(withBase('/graph/snapshots'), {
    case_id: payload.caseId || null,
    limit: payload.limit ?? 250,
    notes: payload.notes || null,
  });
  return response.data;
}

export async function listGraphSnapshots(caseId?: string | null): Promise<GraphSnapshotListResponse> {
  const response = await axios.get<GraphSnapshotListResponse>(withBase('/graph/snapshots'), {
    params: {
      case_id: caseId || undefined,
    },
  });
  return response.data;
}

export async function diffGraphSnapshots(payload: {
  baselineSnapshotId: string;
  candidateSnapshotId: string;
}): Promise<GraphSnapshotDiffResponse> {
  const response = await axios.post<GraphSnapshotDiffResponse>(withBase('/graph/snapshots/diff'), {
    baseline_snapshot_id: payload.baselineSnapshotId,
    candidate_snapshot_id: payload.candidateSnapshotId,
  });
  return response.data;
}
