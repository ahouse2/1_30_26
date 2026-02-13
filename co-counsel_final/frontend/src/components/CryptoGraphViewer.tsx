import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface CryptoGraphViewerProps {
  mermaidDefinition: string;
}

const CryptoGraphViewer: React.FC<CryptoGraphViewerProps> = ({ mermaidDefinition }) => {
  const mermaidRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mermaidRef.current && mermaidDefinition) {
      mermaid.initialize({ startOnLoad: false });
      mermaid.render('graphDiv', mermaidDefinition).then(({ svg }) => {
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = svg;
        }
      }).catch(error => {
        console.error("Mermaid rendering failed:", error);
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = `<p class="error-text">Failed to render graph: ${error.message}</p>`;
        }
      });
    }
  }, [mermaidDefinition]);

  return (
    <div className="crypto-graph-viewer">
      <h3>Cryptocurrency Transaction Graph</h3>
      {mermaidDefinition ? (
        <div ref={mermaidRef} className="mermaid-graph">
          {/* Mermaid diagram will be rendered here */}
        </div>
      ) : (
        <p className="panel-subtitle">No graph definition available.</p>
      )}
    </div>
  );
};

export default CryptoGraphViewer;
