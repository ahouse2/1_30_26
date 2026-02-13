import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

import { fetchFromApi, parseJsonResponse } from '@/apiClient';
import { useScenario } from '@/context/ScenarioContext';
import { useQueryContext } from '@/context/QueryContext';
import { EvidenceModal } from '@/components/EvidenceModal';
import { DocumentViewerPanel } from '@/components/DocumentViewerPanel';
import { Citation } from '@/types';
import {
  createGraphSnapshot,
  diffGraphSnapshots,
  fetchGraphFacts,
  fetchGraphNeighbors,
  fetchGraphOverview,
  listGraphSnapshots,
  searchGraphNodes,
  GraphEdge,
  GraphFact,
  GraphNode,
  GraphSnapshotDiffResponse,
  GraphSnapshotRecord,
} from '@/services/graph_api';
import { getGraphRefinementStatus, restartGraphRefinement, type GraphRefinementStatus } from '@/services/graph_refinement_api';

import { Graph3DScene } from './Graph3DScene';
import { GraphDetailPanel, GraphDetailNode } from './GraphDetailPanel';
import { buildOrbitalLayout, LayoutDensity } from './graphLayout';

interface SceneNode {
  id: string;
  label: string;
  type: string;
  cluster: string;
  properties: Record<string, unknown>;
  degree: number;
  x: number;
  y: number;
  z: number;
  size: number;
  color: string;
  connections: string[];
  dimmed?: boolean;
  active?: boolean;
}

interface KnowledgeGraphNode {
  label: string;
  identity?: string | null;
  properties: Record<string, unknown>;
}

interface KnowledgeGraphRelationship {
  type: string;
  source_node_label: string;
  source_node_identity: string;
  target_node_label: string;
  target_node_identity: string;
  properties: Record<string, unknown>;
}

interface KnowledgeGraphQueryResult {
  nodes: KnowledgeGraphNode[];
  relationships: KnowledgeGraphRelationship[];
}

interface QueryCitation {
  key: string;
  docId: string;
  label: string;
  sourceType?: string;
  confidence?: number;
}

const CLUSTER_COLORS: Record<string, string> = {
  document: '#ffd65a',
  entity: '#18cafe',
  person: '#8f6bff',
  organization: '#f96f6f',
  contract: '#62ffda',
  event: '#f5a35c',
  timeline: '#5bd6ff',
};

const normalizeCluster = (node: GraphNode) => {
  const raw = String(
    (node.properties?.type as string | undefined) || node.type || 'Entity'
  ).toLowerCase();
  return raw;
};

const getLabel = (node: GraphNode) => {
  const props = node.properties ?? {};
  return (
    (props.label as string | undefined) ||
    (props.title as string | undefined) ||
    (props.name as string | undefined) ||
    node.id
  );
};

const buildEdgeKey = (edge: GraphEdge) => {
  const doc = edge.properties?.doc_id;
  const docKey = Array.isArray(doc) ? doc.join('|') : doc ?? '';
  return `${edge.source}::${edge.type}::${edge.target}::${docKey}`;
};

const extractDocuments = (nodeId: string, edges: GraphEdge[]) => {
  const documents = new Set<string>();
  edges.forEach((edge) => {
    if (edge.source !== nodeId && edge.target !== nodeId) return;
    const doc = edge.properties?.doc_id;
    if (Array.isArray(doc)) {
      doc.forEach((item) => documents.add(String(item)));
    } else if (doc) {
      documents.add(String(doc));
    }
    const evidence = edge.properties?.evidence;
    if (Array.isArray(evidence)) {
      evidence.forEach((item) => documents.add(String(item)));
    } else if (typeof evidence === 'string') {
      documents.add(evidence);
    } else if (evidence && typeof evidence === 'object') {
      const evidenceDoc = (evidence as Record<string, unknown>).doc_id;
      if (evidenceDoc) documents.add(String(evidenceDoc));
    }
  });
  return Array.from(documents);
};

const DEMO_QUERY_RESULT: KnowledgeGraphQueryResult = {
  nodes: [
    { label: 'Document', identity: 'doc-1', properties: { title: 'Exhibit A' } },
    { label: 'Person', identity: 'person-1', properties: { name: 'J. Doe' } },
    { label: 'Event', identity: 'event-1', properties: { title: 'Incident Timeline' } },
  ],
  relationships: [
    {
      type: 'MENTIONS',
      source_node_label: 'Document',
      source_node_identity: 'doc-1',
      target_node_label: 'Person',
      target_node_identity: 'person-1',
      properties: { evidence: 'doc-1' },
    },
    {
      type: 'REFERENCES',
      source_node_label: 'Person',
      source_node_identity: 'person-1',
      target_node_label: 'Event',
      target_node_identity: 'event-1',
      properties: { context: 'Statement' },
    },
  ],
};

const isNonJsonResponse = (err: unknown) =>
  err instanceof Error && err.message.toLowerCase().includes('unexpected response');

export function GraphExplorerPanel() {
  const { state } = useScenario();
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GraphNode[]>([]);
  const [searching, setSearching] = useState(false);
  const [density, setDensity] = useState<LayoutDensity>('medium');
  const [cypherQuery, setCypherQuery] = useState(
    'MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 25'
  );
  const [queryResult, setQueryResult] = useState<KnowledgeGraphQueryResult | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [showCitationModal, setShowCitationModal] = useState(false);
  const [autoOrbit, setAutoOrbit] = useState(true);
  const [refinementStatus, setRefinementStatus] = useState<GraphRefinementStatus | null>(null);
  const [refinementLoading, setRefinementLoading] = useState(false);
  const [refinementError, setRefinementError] = useState<string | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<GraphSnapshotRecord[]>([]);
  const [baselineSnapshotId, setBaselineSnapshotId] = useState('');
  const [candidateSnapshotId, setCandidateSnapshotId] = useState('');
  const [snapshotDiff, setSnapshotDiff] = useState<GraphSnapshotDiffResponse | null>(null);
  const [facts, setFacts] = useState<GraphFact[]>([]);
  const [factsLoading, setFactsLoading] = useState(false);
  const [factsError, setFactsError] = useState<string | null>(null);

  const { citations, setActiveCitation } = useQueryContext();

  const caseId = useMemo(() => {
    const configured = state.configuration.caseId?.trim();
    return configured || state.scenario?.scenario_id || null;
  }, [state.configuration.caseId, state.scenario?.scenario_id]);

  const mergeGraph = useCallback((base: { nodes: GraphNode[]; edges: GraphEdge[] } | null, incoming: { nodes: GraphNode[]; edges: GraphEdge[] }) => {
    if (!base) return incoming;
    const nodeMap = new Map(base.nodes.map((node) => [node.id, node]));
    incoming.nodes.forEach((node) => nodeMap.set(node.id, node));
    const edgeMap = new Map(base.edges.map((edge) => [buildEdgeKey(edge), edge]));
    incoming.edges.forEach((edge) => edgeMap.set(buildEdgeKey(edge), edge));
    return {
      nodes: Array.from(nodeMap.values()),
      edges: Array.from(edgeMap.values()),
    };
  }, []);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchGraphOverview({ caseId, limit: 120 });
      setGraphData(response);
      setSelectedId((current) => {
        if (current && response.nodes.some((node) => node.id === current)) {
          return current;
        }
        return response.nodes[0]?.id ?? null;
      });
    } catch (err) {
      setError((err as Error).message || 'Failed to load graph overview.');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  const refreshRefinementStatus = useCallback(async () => {
    setRefinementLoading(true);
    setRefinementError(null);
    try {
      const status = await getGraphRefinementStatus();
      setRefinementStatus(status);
    } catch (err: any) {
      setRefinementError(err?.message ?? 'Unable to load refinement status.');
    } finally {
      setRefinementLoading(false);
    }
  }, []);

  const handleRestartRefinement = useCallback(async () => {
    setRefinementLoading(true);
    setRefinementError(null);
    try {
      const status = await restartGraphRefinement();
      setRefinementStatus(status);
    } catch (err: any) {
      setRefinementError(err?.message ?? 'Unable to restart refinement worker.');
    } finally {
      setRefinementLoading(false);
    }
  }, []);

  const runGraphQuery = useCallback(async () => {
    if (!cypherQuery.trim()) return;
    setQueryLoading(true);
    setQueryError(null);
    try {
      const params = new URLSearchParams({ cypher_query: cypherQuery });
      const response = await fetchFromApi(`/knowledge-graph/query?${params.toString()}`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`Query failed: ${response.statusText}`);
      }
      const data = await parseJsonResponse<KnowledgeGraphQueryResult>(response, 'Graph query');
      setQueryResult(data);
    } catch (err: any) {
      if (isNonJsonResponse(err)) {
        setQueryResult(DEMO_QUERY_RESULT);
        return;
      }
      setQueryError(err?.message ?? 'Failed to run graph query.');
    } finally {
      setQueryLoading(false);
    }
  }, [cypherQuery]);

  const refreshSnapshots = useCallback(async () => {
    setSnapshotLoading(true);
    setSnapshotError(null);
    try {
      const response = await listGraphSnapshots(caseId);
      setSnapshots(response.snapshots);
      setBaselineSnapshotId((current) => current || response.snapshots[0]?.snapshot_id || '');
      setCandidateSnapshotId((current) => current || response.snapshots[1]?.snapshot_id || response.snapshots[0]?.snapshot_id || '');
    } catch (err: any) {
      setSnapshotError(err?.message ?? 'Failed to load graph snapshots.');
    } finally {
      setSnapshotLoading(false);
    }
  }, [caseId]);

  const refreshFacts = useCallback(async () => {
    setFactsLoading(true);
    setFactsError(null);
    try {
      const response = await fetchGraphFacts({ caseId, limit: 8 });
      setFacts(response.facts);
    } catch (err: any) {
      setFactsError(err?.message ?? 'Failed to load extracted facts.');
      setFacts([]);
    } finally {
      setFactsLoading(false);
    }
  }, [caseId]);

  const handleCreateSnapshot = useCallback(async () => {
    setSnapshotLoading(true);
    setSnapshotError(null);
    try {
      await createGraphSnapshot({ caseId, limit: 350 });
      await refreshSnapshots();
    } catch (err: any) {
      setSnapshotError(err?.message ?? 'Failed to create snapshot.');
    } finally {
      setSnapshotLoading(false);
    }
  }, [caseId, refreshSnapshots]);

  const handleRunSnapshotDiff = useCallback(async () => {
    if (!baselineSnapshotId || !candidateSnapshotId) return;
    setSnapshotLoading(true);
    setSnapshotError(null);
    try {
      const response = await diffGraphSnapshots({
        baselineSnapshotId,
        candidateSnapshotId,
      });
      setSnapshotDiff(response);
    } catch (err: any) {
      setSnapshotError(err?.message ?? 'Failed to diff snapshots.');
      setSnapshotDiff(null);
    } finally {
      setSnapshotLoading(false);
    }
  }, [baselineSnapshotId, candidateSnapshotId]);

  const loadNeighbors = useCallback(
    async (nodeId: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchGraphNeighbors(nodeId);
        setGraphData((current) => mergeGraph(current, response));
      } catch (err) {
        setError((err as Error).message || 'Failed to expand node.');
      } finally {
        setLoading(false);
      }
    },
    [mergeGraph]
  );

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    refreshRefinementStatus();
    const timer = setInterval(() => {
      void refreshRefinementStatus();
    }, 15000);
    return () => clearInterval(timer);
  }, [refreshRefinementStatus]);

  useEffect(() => {
    void refreshSnapshots();
  }, [refreshSnapshots]);

  useEffect(() => {
    void refreshFacts();
  }, [refreshFacts]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    let active = true;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const response = await searchGraphNodes({ query: searchQuery.trim(), limit: 8, caseId });
        if (active) setSearchResults(response.nodes);
      } catch (err) {
        if (active) setSearchResults([]);
      } finally {
        if (active) setSearching(false);
      }
    }, 320);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [caseId, searchQuery]);

  const { sceneNodes, nodeIndex } = useMemo(() => {
    if (!graphData) {
      return { sceneNodes: [] as SceneNode[], nodeIndex: new Map<string, SceneNode>() };
    }
    const degreeMap = new Map<string, number>();
    graphData.edges.forEach((edge) => {
      degreeMap.set(edge.source, (degreeMap.get(edge.source) ?? 0) + 1);
      degreeMap.set(edge.target, (degreeMap.get(edge.target) ?? 0) + 1);
    });

    const clusterInputs = graphData.nodes.map((node) => ({
      id: node.id,
      cluster: normalizeCluster(node),
      degree: degreeMap.get(node.id) ?? 0,
    }));

    const positions = buildOrbitalLayout(clusterInputs, density);

    const connections = new Map<string, Set<string>>();
    graphData.edges.forEach((edge) => {
      if (!connections.has(edge.source)) connections.set(edge.source, new Set());
      if (!connections.has(edge.target)) connections.set(edge.target, new Set());
      connections.get(edge.source)?.add(edge.target);
      connections.get(edge.target)?.add(edge.source);
    });

    const scene = graphData.nodes.map((node) => {
      const cluster = normalizeCluster(node);
      const degree = degreeMap.get(node.id) ?? 0;
      const color = CLUSTER_COLORS[cluster] ?? '#18cafe';
      const position = positions[node.id] ?? { x: 0, y: 0, z: 0 };
      return {
        id: node.id,
        label: getLabel(node),
        type: node.type,
        cluster,
        properties: node.properties ?? {},
        degree,
        x: position.x,
        y: position.y,
        z: position.z,
        size: 0.16 + Math.min(degree * 0.05, 0.3),
        color,
        connections: Array.from(connections.get(node.id) ?? []),
        dimmed: Boolean(selectedId) && selectedId !== node.id,
        active: selectedId === node.id,
      } as SceneNode;
    });

    const index = new Map(scene.map((node) => [node.id, node]));
    return { sceneNodes: scene, nodeIndex: index };
  }, [density, graphData, selectedId]);

  const selectedNode = selectedId ? nodeIndex.get(selectedId) ?? null : null;
  const selectedDocuments = selectedId && graphData ? extractDocuments(selectedId, graphData.edges) : [];
  const activeCluster = selectedNode?.cluster ?? 'all';

  const queryDocuments = useMemo(() => {
    if (!queryResult) return [];
    const docs = new Set<string>();
    queryResult.relationships.forEach((rel) => {
      const props = rel.properties ?? {};
      const direct = props.doc_id ?? props.document_id;
      if (Array.isArray(direct)) {
        direct.forEach((item) => docs.add(String(item)));
      } else if (direct) {
        docs.add(String(direct));
      }
      const evidence = props.evidence;
      if (Array.isArray(evidence)) {
        evidence.forEach((item) => docs.add(String(item)));
      } else if (evidence) {
        docs.add(String(evidence));
      }
    });
    queryResult.nodes.forEach((node) => {
      const props = node.properties ?? {};
      const doc = props.doc_id ?? props.document_id;
      if (doc) docs.add(String(doc));
    });
    return Array.from(docs);
  }, [queryResult]);

  const queryCitations = useMemo(() => {
    if (!queryResult) return [] as QueryCitation[];
    const result: QueryCitation[] = [];
    const seen = new Set<string>();

    queryResult.relationships.forEach((rel, index) => {
      const props = rel.properties ?? {};
      const rawDoc = props.doc_id ?? props.document_id;
      const rawEvidence = props.evidence;
      const sourceType = typeof props.source_type === 'string' ? props.source_type : undefined;
      const confidence =
        typeof props.confidence === 'number'
          ? props.confidence
          : typeof props.score === 'number'
            ? props.score
            : undefined;

      const addEntry = (docValue: unknown, labelValue?: string) => {
        if (!docValue) return;
        const docId = String(docValue);
        const key = `${docId}::${labelValue ?? ''}`;
        if (seen.has(key)) return;
        seen.add(key);
        result.push({
          key: `${key}-${index}`,
          docId,
          label: labelValue || `${rel.type}: ${rel.source_node_identity} → ${rel.target_node_identity}`,
          sourceType,
          confidence,
        });
      };

      if (Array.isArray(rawDoc)) {
        rawDoc.forEach((doc) => addEntry(doc));
      } else {
        addEntry(rawDoc);
      }

      if (Array.isArray(rawEvidence)) {
        rawEvidence.forEach((item) => {
          if (item && typeof item === 'object') {
            const obj = item as Record<string, unknown>;
            addEntry(obj.doc_id ?? obj.document_id, String(obj.label ?? obj.title ?? rel.type));
            return;
          }
          addEntry(item);
        });
      } else if (rawEvidence && typeof rawEvidence === 'object') {
        const obj = rawEvidence as Record<string, unknown>;
        addEntry(obj.doc_id ?? obj.document_id, String(obj.label ?? obj.title ?? rel.type));
      } else {
        addEntry(rawEvidence);
      }
    });

    return result.slice(0, 10);
  }, [queryResult]);

  const handleOpenCitation = (docId: string) => {
    const match = citations.find((citation) => citation.docId === docId);
    const fallback: Citation = match ?? {
      docId,
      span: 'Citation metadata unavailable. Check document registry for full context.',
    };
    setActiveCitation(fallback);
    setShowCitationModal(true);
  };

  const handleSelectNode = (nodeId: string) => {
    setSelectedId(nodeId);
    setSearchResults([]);
    setSearchQuery('');
    loadNeighbors(nodeId);
  };

  return (
    <motion.section
      className="graph-3d-explorer"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <header className="graph-3d-header">
        <div>
          <h2>Graph Explorer</h2>
          <p>Explore the evolving knowledge graph powering every swarm and strategy pipeline.</p>
        </div>
        <div className="graph-3d-metrics">
          <div>
            <span>Active cluster</span>
            <strong>{activeCluster}</strong>
          </div>
          <div>
            <span>Signal docs</span>
            <strong>{selectedDocuments.length}</strong>
          </div>
          <div>
            <span>Case</span>
            <strong>{caseId ?? 'global'}</strong>
          </div>
        </div>
        <div className="graph-3d-toolbar">
          <button type="button" className="ghost" onClick={loadOverview}>
            Overview
          </button>
          <button type="button" className="ghost" onClick={() => selectedId && loadNeighbors(selectedId)}>
            Expand
          </button>
          <div className="graph-density">
            <span>Density</span>
            {(['low', 'medium', 'high'] as LayoutDensity[]).map((level) => (
              <button
                key={level}
                type="button"
                className={density === level ? 'active' : ''}
                onClick={() => setDensity(level)}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="graph-3d-body">
        <div className="graph-3d-canvas">
          <div className="graph-3d-atmosphere" aria-hidden="true" />
          {loading && <div className="graph-3d-overlay">Loading graph...</div>}
          {error && <div className="graph-3d-overlay error">{error}</div>}
          <Graph3DScene
            nodes={sceneNodes}
            onNodeClick={(node) => handleSelectNode(node.id)}
            className="graph-3d-stage"
            autoOrbit={autoOrbit}
            activeNodeId={selectedId}
          />
        </div>

        <aside className="graph-3d-sidebar">
          <div className="graph-3d-search">
            <label htmlFor="graph-search">Search nodes</label>
            <input
              id="graph-search"
              type="search"
              placeholder="Search nodes"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            {searching && <span className="graph-search-status">Searching...</span>}
            {searchResults.length > 0 && (
              <ul className="graph-search-results">
                {searchResults.map((node) => (
                  <li key={node.id}>
                    <button type="button" onClick={() => handleSelectNode(node.id)}>
                      <span>{getLabel(node)}</span>
                      <span className="tag">{normalizeCluster(node)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <GraphDetailPanel
            node={selectedNode as GraphDetailNode | null}
            documents={selectedDocuments}
            onFocus={selectedId ? () => loadNeighbors(selectedId) : undefined}
          />

          <div className="graph-query-panel">
            <h4>Graph Query Builder</h4>
            <p className="graph-query-subtitle">Run targeted Cypher queries with evidence-ready output.</p>
            <label htmlFor="cypher-query">Cypher query</label>
            <textarea
              id="cypher-query"
              className="input-cinematic"
              value={cypherQuery}
              onChange={(event) => setCypherQuery(event.target.value)}
              rows={5}
            />
            <button type="button" className="btn-cinematic" onClick={runGraphQuery} disabled={queryLoading}>
              {queryLoading ? 'Running Query...' : 'Run Query'}
            </button>
            {queryError && <p className="graph-query-error">{queryError}</p>}
            {queryResult && (
              <div className="graph-query-results">
                <div>
                  <strong>{queryResult.nodes.length}</strong> nodes
                </div>
                <div>
                  <strong>{queryResult.relationships.length}</strong> relationships
                </div>
                {queryDocuments.length > 0 && (
                  <div className="graph-query-citations">
                    <h5>Evidence links</h5>
                    <div className="graph-query-citation-list">
                      {queryDocuments.slice(0, 8).map((docId) => (
                        <button
                          key={`query-doc-${docId}`}
                          type="button"
                          onClick={() => handleOpenCitation(docId)}
                        >
                          {docId}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {queryCitations.length > 0 && (
                  <div className="graph-query-citations">
                    <h5>Citation highlights</h5>
                    <ul>
                      {queryCitations.map((citation) => (
                        <li key={citation.key}>
                          <button
                            type="button"
                            onClick={() => handleOpenCitation(citation.docId)}
                            className="graph-query-citation-detail"
                          >
                            <span>{citation.label}</span>
                            <span className="tag">{citation.docId}</span>
                            {citation.sourceType && <span className="tag">{citation.sourceType}</span>}
                            {typeof citation.confidence === 'number' && (
                              <span className="tag">{Math.round(citation.confidence * 100)}%</span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <ul>
                  {queryResult.relationships.slice(0, 4).map((rel, index) => (
                    <li key={`${rel.type}-${index}`}>
                      <span className="tag">{rel.type}</span>
                      <span>{rel.source_node_identity} → {rel.target_node_identity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="graph-refinement-panel">
            <div className="graph-refinement-panel__header">
              <h4>Refinement Worker</h4>
              <div className="graph-refinement-panel__actions">
                <button type="button" className="ghost" onClick={() => setAutoOrbit((value) => !value)}>
                  {autoOrbit ? 'Pause Orbit' : 'Auto Orbit'}
                </button>
                <button type="button" className="ghost" onClick={() => void refreshRefinementStatus()} disabled={refinementLoading}>
                  Refresh
                </button>
                <button type="button" className="btn-cinematic btn-secondary" onClick={() => void handleRestartRefinement()} disabled={refinementLoading}>
                  Restart
                </button>
              </div>
            </div>
            {refinementError && <p className="graph-query-error">{refinementError}</p>}
            {refinementLoading && !refinementStatus && <p className="graph-search-status">Loading worker status...</p>}
            {refinementStatus && (
              <div className="graph-refinement-grid">
                <div>
                  <span>Status</span>
                  <strong>{refinementStatus.running ? 'running' : refinementStatus.enabled ? 'idle' : 'disabled'}</strong>
                </div>
                <div>
                  <span>Idle runs</span>
                  <strong>{refinementStatus.idle_runs}</strong>
                </div>
                <div>
                  <span>Idle limit</span>
                  <strong>{refinementStatus.idle_limit}</strong>
                </div>
                <div>
                  <span>Min new edges</span>
                  <strong>{refinementStatus.min_new_edges}</strong>
                </div>
                <div>
                  <span>Interval</span>
                  <strong>{refinementStatus.interval_seconds}s</strong>
                </div>
                <div>
                  <span>Stop requested</span>
                  <strong>{refinementStatus.stop_requested ? 'yes' : 'no'}</strong>
                </div>
              </div>
            )}
          </div>

          <div className="graph-refinement-panel">
            <div className="graph-refinement-panel__header">
              <h4>Snapshots & Diff</h4>
              <div className="graph-refinement-panel__actions">
                <button type="button" className="ghost" onClick={() => void refreshSnapshots()} disabled={snapshotLoading}>
                  Refresh
                </button>
                <button type="button" className="btn-cinematic btn-secondary" onClick={() => void handleCreateSnapshot()} disabled={snapshotLoading}>
                  Create Snapshot
                </button>
              </div>
            </div>
            {snapshotError && <p className="graph-query-error">{snapshotError}</p>}
            {snapshots.length === 0 && !snapshotLoading && (
              <p className="graph-search-status">No snapshots yet. Create one to start case diffing.</p>
            )}
            {snapshots.length > 0 && (
              <>
                <div className="graph-query-panel">
                  <label htmlFor="snapshot-baseline">Baseline</label>
                  <select id="snapshot-baseline" value={baselineSnapshotId} onChange={(event) => setBaselineSnapshotId(event.target.value)}>
                    {snapshots.map((snapshot) => (
                      <option key={`baseline-${snapshot.snapshot_id}`} value={snapshot.snapshot_id}>
                        {snapshot.snapshot_id} · {snapshot.node_count} nodes · {new Date(snapshot.created_at).toLocaleString()}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="snapshot-candidate">Candidate</label>
                  <select id="snapshot-candidate" value={candidateSnapshotId} onChange={(event) => setCandidateSnapshotId(event.target.value)}>
                    {snapshots.map((snapshot) => (
                      <option key={`candidate-${snapshot.snapshot_id}`} value={snapshot.snapshot_id}>
                        {snapshot.snapshot_id} · {snapshot.edge_count} edges · {new Date(snapshot.created_at).toLocaleString()}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-cinematic"
                    onClick={() => void handleRunSnapshotDiff()}
                    disabled={snapshotLoading || !baselineSnapshotId || !candidateSnapshotId}
                  >
                    {snapshotLoading ? 'Diffing...' : 'Run Diff'}
                  </button>
                </div>
                {snapshotDiff && (
                  <div className="graph-refinement-grid">
                    <div>
                      <span>Added nodes</span>
                      <strong>{snapshotDiff.summary.added_nodes}</strong>
                    </div>
                    <div>
                      <span>Removed nodes</span>
                      <strong>{snapshotDiff.summary.removed_nodes}</strong>
                    </div>
                    <div>
                      <span>Modified nodes</span>
                      <strong>{snapshotDiff.summary.modified_nodes}</strong>
                    </div>
                    <div>
                      <span>Added edges</span>
                      <strong>{snapshotDiff.summary.added_edges}</strong>
                    </div>
                    <div>
                      <span>Removed edges</span>
                      <strong>{snapshotDiff.summary.removed_edges}</strong>
                    </div>
                    <div>
                      <span>Modified edges</span>
                      <strong>{snapshotDiff.summary.modified_edges}</strong>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="graph-refinement-panel">
            <div className="graph-refinement-panel__header">
              <h4>Extracted Facts</h4>
              <div className="graph-refinement-panel__actions">
                <button type="button" className="ghost" onClick={() => void refreshFacts()} disabled={factsLoading}>
                  Refresh
                </button>
              </div>
            </div>
            {factsError && <p className="graph-query-error">{factsError}</p>}
            {factsLoading && <p className="graph-search-status">Extracting fact set...</p>}
            {!factsLoading && facts.length === 0 && !factsError && (
              <p className="graph-search-status">No extracted facts yet for this case scope.</p>
            )}
            {facts.length > 0 && (
              <ul className="graph-facts-list">
                {facts.map((fact) => (
                  <li key={fact.id}>
                    <p>{fact.claim}</p>
                    <div className="graph-facts-meta">
                      <span className="tag">{fact.relation}</span>
                      <span className="tag">{Math.round((fact.confidence || 0) * 100)}%</span>
                      {fact.citations[0] && (
                        <button type="button" onClick={() => handleOpenCitation(fact.citations[0])}>
                          Open {fact.citations[0]}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="graph-3d-legend">
            <h4>Legend</h4>
            <div className="legend-grid">
              {Object.entries(CLUSTER_COLORS).map(([key, color]) => (
                <div key={key}>
                  <span style={{ background: color }} />
                  {key}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <footer className="graph-3d-status">
        <div>
          <strong>{graphData?.nodes.length ?? 0}</strong> nodes
        </div>
        <div>
          <strong>{graphData?.edges.length ?? 0}</strong> edges
        </div>
        <div>
          Case: <strong>{caseId ?? 'global'}</strong>
        </div>
      </footer>

      {showCitationModal && (
        <EvidenceModal
          title="Graph Evidence"
          onClose={() => {
            setShowCitationModal(false);
            setActiveCitation(null);
          }}
        >
          <DocumentViewerPanel />
        </EvidenceModal>
      )}
    </motion.section>
  );
}
