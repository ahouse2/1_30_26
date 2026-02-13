import { useState } from 'react';
import { runPhase, runWorkflow } from '@/services/workflow_api';
import { useSharedCaseId } from '@/hooks/useSharedCaseId';

const PHASES = [
  'ingestion',
  'preprocess',
  'forensics',
  'parsing_chunking',
  'indexing',
  'fact_extraction',
  'timeline',
  'legal_theories',
  'strategy',
  'drafting',
  'qa_review',
];

export default function CaseWorkflowPage() {
  const { caseId, setCaseId } = useSharedCaseId();
  const [status, setStatus] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const handleRunAll = async () => {
    setRunning(true);
    setStatus('Running full workflow...');
    try {
      await runWorkflow(caseId, []);
      setStatus('Workflow completed.');
    } catch (error: any) {
      setStatus(`Workflow failed: ${error?.message ?? 'unknown error'}`);
    } finally {
      setRunning(false);
    }
  };

  const handleRunPhase = async (phase: string) => {
    setRunning(true);
    setStatus(`Running ${phase}...`);
    try {
      await runPhase(caseId, [phase]);
      setStatus(`${phase} completed.`);
    } catch (error: any) {
      setStatus(`${phase} failed: ${error?.message ?? 'unknown error'}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className="panel-shell workflow-page">
      <header>
        <h2>Case Workflow Control Room</h2>
        <p className="panel-subtitle">Trigger autonomous phases or re-run any segment on demand.</p>
      </header>

      <div className="workflow-controls">
        <div className="field-group">
          <label htmlFor="caseId">Case ID</label>
          <input
            id="caseId"
            type="text"
            className="input-cinematic"
            value={caseId}
            onChange={(event) => setCaseId(event.target.value)}
          />
        </div>
        <button className="btn-cinematic" onClick={handleRunAll} disabled={running}>
          Run Full Workflow
        </button>
      </div>

      {status && <p className="workflow-status">{status}</p>}

      <div className="workflow-grid">
        {PHASES.map((phase) => (
          <button
            key={phase}
            className="workflow-phase"
            onClick={() => handleRunPhase(phase)}
            disabled={running}
          >
            <span className="phase-name">{phase.replace('_', ' ')}</span>
            <span className="phase-action">Run phase</span>
          </button>
        ))}
      </div>
    </section>
  );
}
