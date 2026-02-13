import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, FileText, Link, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Document {
  id: string;
  title: string;
  content: string;
  metadata: Record<string, any>;
}

interface Entity {
  id: string;
  label: string;
  type: string;
}

interface Annotation {
  id: string;
  text: string;
  start: number;
  end: number;
  entity_id?: string;
  type: string; // e.g., 'entity', 'highlight', 'comment'
}

const EvidenceViewer: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const [document, setDocument] = useState<Document | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) {
      setError("No document ID provided.");
      setLoading(false);
      return;
    }

    const fetchDocumentData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Placeholder for fetching document content from backend
        // Replace with actual API call to /documents/{documentId}
        const fetchedDocument: Document = {
          id: documentId,
          title: `Document ${documentId}`,
          content: `This is the content of document ${documentId}. It contains various legal terms like "contract", "plaintiff", "defendant", and "judgment". This document discusses a case where a "company" was sued by an individual. The outcome was a "settlement".`,
          metadata: { source: "local", date: "2025-11-02" },
        };
        setDocument(fetchedDocument);

        // Placeholder for fetching linked entities from backend
        // Replace with actual API call to /graph/entities?doc_id={documentId} or similar
        const fetchedEntities: Entity[] = [
          { id: "entity-1", label: "contract", type: "LegalTerm" },
          { id: "entity-2", label: "plaintiff", type: "LegalRole" },
          { id: "entity-3", label: "defendant", type: "LegalRole" },
          { id: "entity-4", label: "judgment", type: "LegalOutcome" },
          { id: "entity-5", label: "company", type: "Organization" },
          { id: "entity-6", label: "settlement", type: "LegalOutcome" },
        ];
        setEntities(fetchedEntities);

        // Generate mock annotations based on entities
        const generatedAnnotations: Annotation[] = fetchedEntities.map(entity => {
          const startIndex = fetchedDocument.content.indexOf(entity.label);
          if (startIndex !== -1) {
            return {
              id: `anno-${entity.id}`,
              text: entity.label,
              start: startIndex,
              end: startIndex + entity.label.length,
              entity_id: entity.id,
              type: 'entity',
            };
          }
          return null;
        }).filter(Boolean) as Annotation[];
        setAnnotations(generatedAnnotations);

      } catch (err) {
        console.error("Failed to fetch document data:", err);
        setError("Failed to load document. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentData();
  }, [documentId]);

  const renderContentWithAnnotations = () => {
    if (!document) return null;

    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;

    // Sort annotations to handle overlapping or nested annotations correctly
    const sortedAnnotations = [...annotations].sort((a, b) => a.start - b.start);

    sortedAnnotations.forEach(annotation => {
      if (annotation.start > lastIndex) {
        parts.push(document.content.substring(lastIndex, annotation.start));
      }
      const entity = entities.find(e => e.id === annotation.entity_id);
      parts.push(
        <span
          key={annotation.id}
          className="evidence-highlight"
          title={`${entity?.type || annotation.type}: ${annotation.text}`}
        >
          {annotation.text}
          {entity && (
            <Badge variant="secondary" className="evidence-highlight__badge">
              {entity.type}
            </Badge>
          )}
        </span>
      );
      lastIndex = annotation.end;
    });

    if (lastIndex < document.content.length) {
      parts.push(document.content.substring(lastIndex));
    }

    return <p className="evidence-viewer__copy">{parts}</p>;
  };

  if (loading) {
    return (
      <div className="evidence-viewer__state">
        <Loader2 className="spinner-icon" />
        <span>Loading document...</span>
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

  if (!document) {
    return (
      <div className="evidence-viewer__state">
        <p>Document not found.</p>
      </div>
    );
  }

  return (
    <section className="evidence-viewer">
      <Card className="evidence-viewer__card">
        <CardHeader className="evidence-viewer__header">
          <CardTitle className="evidence-viewer__title">
            <FileText className="evidence-viewer__icon" /> {document.title}
          </CardTitle>
          <div className="evidence-viewer__meta">
            <span>ID: {document.id}</span>
            <span>Source: {document.metadata.source}</span>
            <span>Date: {document.metadata.date}</span>
          </div>
        </CardHeader>
        <CardContent className="evidence-viewer__content">
          <div className="evidence-viewer__layout">
            <div className="evidence-viewer__main">
              <h3 className="evidence-viewer__section-title">
                <FileText className="evidence-viewer__section-icon" /> Document Content
              </h3>
              <ScrollArea className="evidence-scroll evidence-scroll--tall">
                {renderContentWithAnnotations()}
              </ScrollArea>
            </div>
            <div className="evidence-viewer__side">
              <h3 className="evidence-viewer__section-title">
                <Link className="evidence-viewer__section-icon" /> Linked Entities
              </h3>
              <ScrollArea className="evidence-scroll evidence-scroll--compact">
                {entities.length > 0 ? (
                  <div className="evidence-entity-list">
                    {entities.map(entity => (
                      <div key={entity.id} className="evidence-entity-item">
                        <span>{entity.label}</span>
                        <Badge variant="outline" className="evidence-chip">{entity.type}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="evidence-empty">No entities linked.</p>
                )}
              </ScrollArea>

              <h3 className="evidence-viewer__section-title">
                <Lightbulb className="evidence-viewer__section-icon" /> Annotations
              </h3>
              <ScrollArea className="evidence-scroll evidence-scroll--compact">
                {annotations.length > 0 ? (
                  <div className="evidence-annotation-list">
                    {annotations.map(anno => (
                      <div key={anno.id} className="evidence-annotation-item">
                        <p>"{anno.text}"</p>
                        <Badge variant="outline" className="evidence-chip evidence-chip--success">{anno.type}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="evidence-empty">No annotations.</p>
                )}
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default EvidenceViewer;
