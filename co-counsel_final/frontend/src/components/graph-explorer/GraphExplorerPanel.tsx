import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

import { useScenario } from '@/context/ScenarioContext';
import {
  fetchGraphNeighbors,
  fetchGraphOverview,
  searchGraphNodes,
  GraphEdge,
  GraphNode,
} from '@/services/graph_api';

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
          {loading && <div className="graph-3d-overlay">Loading graph...</div>}
          {error && <div className="graph-3d-overlay error">{error}</div>}
          <Graph3DScene
            nodes={sceneNodes}
            onNodeClick={(node) => handleSelectNode(node.id)}
            className="graph-3d-stage"
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
    </motion.section>
  );
}
