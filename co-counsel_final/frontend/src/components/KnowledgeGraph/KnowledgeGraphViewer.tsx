import React, { useState, useEffect, useRef } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { Loader2, GitGraph, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface GraphNode {
  id: string;
  label: string;
  title?: string;
  group?: string;
  color?: string;
}

interface GraphEdge {
  id?: string; // Added id property
  from: string;
  to: string;
  label?: string;
  title?: string;
  arrows?: string;
  color?: string;
}

const KnowledgeGraphViewer: React.FC = () => {
  const networkRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<DataSet<GraphNode, 'id'>>(new DataSet<GraphNode, 'id'>());
  const [edges, setEdges] = useState<DataSet<GraphEdge, 'id'>>(new DataSet<GraphEdge, 'id'>());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchNodeId, setSearchNodeId] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (networkRef.current) {
      const data = { nodes, edges };
      const options = {
        nodes: {
          shape: 'dot',
          size: 16,
          font: { size: 12, color: '#ffffff' },
          borderWidth: 2,
        },
        edges: {
          width: 1,
          arrows: 'to',
          font: { size: 10, color: '#ffffff', align: 'middle' },
          color: { inherit: 'from' },
        },
        physics: { enabled: true, stabilization: { iterations: 2000 } },
        interaction: { navigationButtons: true, keyboard: true },
        layout: { hierarchical: false },
      };
      const network = new Network(networkRef.current, data, options);

      network.on("click", (properties) => {
        if (properties.nodes.length > 0) {
          const nodeId = properties.nodes[0];
          const clickedNode = nodes.get(nodeId as string);
          if (clickedNode) {
            toast({
              title: `Node: ${clickedNode.label}`,
              description: clickedNode.title || `ID: ${clickedNode.id}`, 
            });
          }
        }
      });

      return () => {
        network.destroy();
      };
    }
  }, [nodes, edges, toast]);

  const fetchGraphData = async (nodeId?: string) => {
    setLoading(true);
    setError(null);
    try {
      // Placeholder for fetching graph data from backend
      // Replace with actual API calls to /graph/neighbor/{nodeId} or /graph/subgraph
      let fetchedNodes: GraphNode[] = [];
      let fetchedEdges: GraphEdge[] = [];

      if (nodeId) {
        // Simulate fetching neighbors for a specific node
        fetchedNodes = [
          { id: nodeId, label: `Node ${nodeId}`, group: 'focus' },
          { id: 'A', label: 'Entity A', group: 'related' },
          { id: 'B', label: 'Entity B', group: 'related' },
        ];
        fetchedEdges = [
          { id: `${nodeId}-A`, from: nodeId, to: 'A', label: 'RELATES_TO' },
          { id: `A-B`, from: 'A', to: 'B', label: 'HAS_PROPERTY' },
        ];
      } else {
        // Simulate fetching a general subgraph
        fetchedNodes = [
          { id: '1', label: 'Document 1', group: 'document' },
          { id: '2', label: 'Document 2', group: 'document' },
          { id: 'PersonX', label: 'John Doe', group: 'person' },
          { id: 'CompanyY', label: 'Acme Corp', group: 'organization' },
          { id: 'ContractZ', label: 'Sales Contract', group: 'contract' },
        ];
        fetchedEdges = [
          { id: `1-PersonX`, from: '1', to: 'PersonX', label: 'MENTIONS' },
          { id: `1-CompanyY`, from: '1', to: 'CompanyY', label: 'MENTIONS' },
          { id: `PersonX-ContractZ`, from: 'PersonX', to: 'ContractZ', label: 'SIGNED' },
          { id: `CompanyY-ContractZ`, from: 'CompanyY', to: 'ContractZ', label: 'PART_OF' },
          { id: `2-PersonX`, from: '2', to: 'PersonX', label: 'REFERENCES' },
        ];
      }

      setNodes(new DataSet<GraphNode, 'id'>(fetchedNodes));
      setEdges(new DataSet<GraphEdge, 'id'>(fetchedEdges));

    } catch (err) {
      console.error("Failed to fetch graph data:", err);
      setError("Failed to load graph. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraphData();
  }, []);

  const handleSearch = () => {
    if (searchNodeId.trim()) {
      fetchGraphData(searchNodeId.trim());
    } else {
      fetchGraphData(); // Reset to general view if search is empty
    }
  };

  if (loading) {
    return (
      <div className="knowledge-graph__loading">
        <Loader2 className="spinner-icon" />
        <span>Loading knowledge graph...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="evidence-viewer__state error-text">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="knowledge-graph">
      <Card className="knowledge-graph__card">
        <CardHeader className="knowledge-graph__header">
          <CardTitle className="knowledge-graph__title">
            <GitGraph className="knowledge-graph__icon" /> Knowledge Graph Visualization
          </CardTitle>
          <p className="knowledge-graph__subtitle">Explore entities and their relationships.</p>
        </CardHeader>
        <CardContent className="knowledge-graph__content">
          <div className="knowledge-graph__toolbar">
            <Input
              type="text"
              placeholder="Search for a node ID..."
              value={searchNodeId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchNodeId(e.target.value)}
              className="knowledge-graph__input"
            />
            <Button onClick={handleSearch} className="knowledge-graph__button">
              <Search className="knowledge-graph__button-icon" /> Search
            </Button>
            <Button onClick={() => { setSearchNodeId(''); fetchGraphData(); }} variant="outline" className="knowledge-graph__button ghost">
              Reset View
            </Button>
          </div>
          <div ref={networkRef} className="knowledge-graph__canvas" />
        </CardContent>
      </Card>
    </div>
  );
};

export default KnowledgeGraphViewer;
