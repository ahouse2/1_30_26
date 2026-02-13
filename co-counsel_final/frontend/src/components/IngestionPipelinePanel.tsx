import { useState } from 'react';
import { runIngestionStage } from '@/services/document_api';

const STAGES = [
  { id: 'load', label: 'Preprocess' },
  { id: 'chunk', label: 'Chunk' },
  { id: 'embed', label: 'Embed' },
  { id: 'enrich', label: 'Enrich' },
  { id: 'forensics', label: 'Forensics' },
] as const;

interface IngestionPipelinePanelProps {
  jobId?: string | null;
}

export function IngestionPipelinePanel({ jobId }: IngestionPipelinePanelProps) {
  const [resumeDownstream, setResumeDownstream] = useState(true);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = async (stage: (typeof STAGES)[number]['id']) => {
    if (!jobId) return;
    setIsRunning(true);
    await runIngestionStage(jobId, stage, resumeDownstream);
    setLastRun(stage);
    setIsRunning(false);
  };
  return (
    <div className="panel-shell">
      <h3 className="text-lg font-semibold">Pipeline</h3>
      <p className="text-sm text-text-secondary mt-2">
        Trigger or resume specific stages in the ingestion pipeline.
      </p>
      <div className="mt-3 flex items-center gap-2 text-xs text-text-secondary">
        <input
          id="resumeDownstream"
          type="checkbox"
          checked={resumeDownstream}
          onChange={(event) => setResumeDownstream(event.target.checked)}
        />
        <label htmlFor="resumeDownstream">Resume downstream stages</label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {STAGES.map((stage) => (
          <button
            key={stage.id}
            type="button"
            className="px-3 py-2 rounded-md border border-border bg-background-surface text-sm disabled:opacity-50"
            disabled={!jobId || isRunning}
            onClick={() => handleRun(stage.id)}
          >
            {stage.label}
          </button>
        ))}
      </div>
      {!jobId && (
        <p className="mt-3 text-xs text-text-secondary">
          Start an ingestion job to enable manual stage controls.
        </p>
      )}
      {lastRun && (
        <p className="mt-2 text-xs text-text-secondary">
          Last triggered: {lastRun}
        </p>
      )}
    </div>
  );
}
