import { useState } from 'react';
import { motion } from 'framer-motion';
import { buildApiUrl } from '@/config';
import { runAgents } from '@/services/agents_api';
import { useSharedCaseId } from '@/hooks/useSharedCaseId';

export default function DocumentDraftingPage() {
  const [documentText, setDocumentText] = useState('');
  const [documentType, setDocumentType] = useState('motion');
  const { caseId, setCaseId } = useSharedCaseId();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwarmLoading, setIsSwarmLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [swarmError, setSwarmError] = useState<string | null>(null);
  const [swarmAnswer, setSwarmAnswer] = useState<string | null>(null);
  const [swarmNotes, setSwarmNotes] = useState<string[]>([]);

  const handleGetSuggestions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(buildApiUrl('/agents/drafting/suggestions'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: documentText,
          document_type: documentType,
          case_id: caseId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get suggestions: ${response.statusText}`);
      }

      const result = await response.json();
      setSuggestions(result.suggestions);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunDraftingSwarm = async () => {
    setIsSwarmLoading(true);
    setSwarmError(null);
    setSwarmAnswer(null);
    setSwarmNotes([]);
    try {
      const response = await runAgents({
        case_id: caseId,
        question: `drafting: ${documentType}\\n${documentText}`,
        autonomy_level: 'balanced',
        top_k: 6,
      });
      setSwarmAnswer(response.final_answer || 'No drafting response returned.');
      setSwarmNotes(response.qa_notes ?? []);
    } catch (err: any) {
      setSwarmError(err?.message ?? 'Failed to run drafting swarm');
    } finally {
      setIsSwarmLoading(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="panel-shell drafting-page"
    >
      <header>
        <h2>AI-Assisted Document Drafting</h2>
        <p className="panel-subtitle">Draft legal documents with focused, citation-backed suggestions.</p>
      </header>
      <div className="drafting-controls">
        <div className="field-group">
          <label htmlFor="drafting-case-id">Case ID</label>
          <input
            id="drafting-case-id"
            type="text"
            className="input-cinematic"
            value={caseId}
            onChange={(event) => setCaseId(event.target.value)}
          />
        </div>
        <div className="field-group">
          <label htmlFor="drafting-doc-type">Document Type</label>
          <select
            id="drafting-doc-type"
            className="input-cinematic"
            value={documentType}
            onChange={(event) => setDocumentType(event.target.value)}
          >
            <option value="motion">Motion</option>
            <option value="legal_brief">Legal Brief</option>
            <option value="declaration">Declaration</option>
            <option value="contract">Contract</option>
            <option value="default">General Draft</option>
          </select>
        </div>
      </div>
      <div className="drafting-grid">
        <div className="drafting-editor">
          <textarea
            value={documentText}
            onChange={(e) => setDocumentText(e.target.value)}
            className="drafting-textarea"
            placeholder="Start writing your document..."
          />
        </div>
        <aside className="drafting-suggestions">
          <div className="drafting-actions">
            <button
              onClick={handleGetSuggestions}
              className="btn-cinematic"
              disabled={isLoading || isSwarmLoading}
            >
              {isLoading ? 'Getting Suggestions...' : 'Get Suggestions'}
            </button>
            <button
              onClick={handleRunDraftingSwarm}
              className="btn-cinematic btn-secondary"
              disabled={isSwarmLoading || isLoading}
            >
              {isSwarmLoading ? 'Running Drafting Swarm...' : 'Run Drafting Swarm'}
            </button>
          </div>
          {error && <p className="error-text">Error: {error}</p>}
          {swarmError && <p className="error-text">Swarm Error: {swarmError}</p>}
          <div className="drafting-suggestions__list">
            <h3>Suggestions</h3>
            <ul>
              {suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
          {swarmAnswer && (
            <div className="drafting-swarm-response">
              <h3>Drafting Swarm Output</h3>
              <p>{swarmAnswer}</p>
              {swarmNotes.length > 0 && (
                <div className="drafting-swarm-notes">
                  <h4>QA Notes</h4>
                  <ul>
                    {swarmNotes.map((note, index) => (
                      <li key={index}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </motion.section>
  );
}
