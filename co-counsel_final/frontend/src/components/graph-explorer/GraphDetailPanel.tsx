import React from 'react';

export interface GraphDetailNode {
  id: string;
  label: string;
  type: string;
  properties: Record<string, unknown>;
  degree: number;
}

interface GraphDetailPanelProps {
  node: GraphDetailNode | null;
  documents: string[];
  onFocus?: () => void;
}

export function GraphDetailPanel({ node, documents, onFocus }: GraphDetailPanelProps) {
  if (!node) {
    return (
      <section className="graph-detail-panel">
        <h3>Node Details</h3>
        <p className="graph-detail-empty">Select a node to inspect its evidence, metadata, and linked documents.</p>
      </section>
    );
  }

  const entries = Object.entries(node.properties || {}).filter(([, value]) => value !== undefined && value !== null);
  const topEntries = entries.slice(0, 6);

  return (
    <section className="graph-detail-panel">
      <div className="graph-detail-header">
        <div>
          <span className="graph-detail-type">{node.type}</span>
          <h3>{node.label}</h3>
          <p className="graph-detail-id">{node.id}</p>
        </div>
        {onFocus && (
          <button type="button" className="ghost" onClick={onFocus}>
            Focus
          </button>
        )}
      </div>
      <div className="graph-detail-metrics">
        <div>
          <span>Connections</span>
          <strong>{node.degree}</strong>
        </div>
        <div>
          <span>Documents</span>
          <strong>{documents.length}</strong>
        </div>
      </div>
      {documents.length > 0 && (
        <div className="graph-detail-docs">
          <h4>Linked documents</h4>
          <ul>
            {documents.slice(0, 6).map((doc) => (
              <li key={doc}>{doc}</li>
            ))}
          </ul>
        </div>
      )}
      {topEntries.length > 0 && (
        <div className="graph-detail-props">
          <h4>Key attributes</h4>
          <dl>
            {topEntries.map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{String(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  );
}
