import { useMemo, useState } from 'react';
import { runIngestionStage, type IngestionStatusResponse } from '@/services/document_api';

const STAGES = [
  { id: 'load', label: 'Preprocess' },
  { id: 'chunk', label: 'Chunk' },
  { id: 'embed', label: 'Embed' },
  { id: 'enrich', label: 'Enrich' },
  { id: 'forensics', label: 'Forensics' },
] as const;

type StageId = (typeof STAGES)[number]['id'];

interface IngestionPipelinePanelProps {
  jobId?: string | null;
  status?: IngestionStatusResponse | null;
  onStatusUpdate?: (status: IngestionStatusResponse) => void;
}

const stageIdToName: Record<StageId, string> = {
  load: 'load',
  chunk: 'chunk',
  embed: 'embed',
  enrich: 'enrich',
  forensics: 'forensics',
};

function statusClass(status?: string | null): string {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'succeeded' || normalized === 'complete' || normalized === 'completed') {
    return 'status-pill status-pill--served';
  }
  if (normalized === 'running' || normalized === 'queued' || normalized === 'in_progress') {
    return 'status-pill status-pill--pending';
  }
  if (normalized === 'failed' || normalized === 'error' || normalized === 'cancelled') {
    return 'status-pill status-pill--high';
  }
  return 'status-pill neutral';
}

function formatTime(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function IngestionPipelinePanel({ jobId, status, onStatusUpdate }: IngestionPipelinePanelProps) {
  const [resumeDownstream, setResumeDownstream] = useState(true);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [isRunningStage, setIsRunningStage] = useState<StageId | null>(null);

  const handleRun = async (stage: StageId) => {
    if (!jobId) return;
    setIsRunningStage(stage);
    setRunError(null);
    try {
      const next = await runIngestionStage(jobId, stage, resumeDownstream);
      setLastRun(stage);
      onStatusUpdate?.(next);
    } catch (error: any) {
      setRunError(error?.response?.data?.detail || error?.message || 'Failed to run stage');
    } finally {
      setIsRunningStage(null);
    }
  };

  const stageDetails = status?.status_details?.stages ?? [];
  const stageMap = useMemo(() => {
    const map = new Map<string, (typeof stageDetails)[number]>();
    stageDetails.forEach((detail) => {
      map.set(detail.name.toLowerCase(), detail);
    });
    return map;
  }, [stageDetails]);

  const failedStages = useMemo(
    () => stageDetails.filter((stage) => stage.status.toLowerCase() === 'failed').map((stage) => stage.name),
    [stageDetails]
  );

  const skipped = status?.status_details?.ingestion?.skipped ?? [];
  const automation = status?.status_details?.automation;
  const graph = status?.status_details?.graph;
  const timeline = status?.status_details?.timeline;
  const forensics = status?.status_details?.forensics;

  return (
    <div className="panel-shell">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Ingestion Pipeline</h3>
          <p className="text-sm text-text-secondary mt-2">
            Run or recover individual stages while monitoring ingest, timeline, graph, and forensics output.
          </p>
        </div>
        <span className={statusClass(status?.status)}>{status?.status ?? 'idle'}</span>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-text-secondary">
        <input
          id="resumeDownstream"
          type="checkbox"
          checked={resumeDownstream}
          onChange={(event) => setResumeDownstream(event.target.checked)}
        />
        <label htmlFor="resumeDownstream">Resume downstream stages after manual trigger</label>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
        {STAGES.map((stage) => {
          const detail = stageMap.get(stageIdToName[stage.id]);
          const running = isRunningStage === stage.id;
          const canRun = Boolean(jobId) && !isRunningStage;
          return (
            <button
              key={stage.id}
              type="button"
              className="rounded-md border border-border bg-background-surface px-3 py-2 text-left text-sm disabled:opacity-50"
              disabled={!canRun}
              onClick={() => handleRun(stage.id)}
              title={detail?.warnings?.[0] ?? ''}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{stage.label}</span>
                <span className={statusClass(detail?.status)}>{detail?.status ?? 'idle'}</span>
              </div>
              <p className="mt-1 text-xs text-text-secondary">
                {running ? 'Running now…' : detail?.completed_at ? `Done ${formatTime(detail.completed_at)}` : 'Manual trigger'}
              </p>
            </button>
          );
        })}
      </div>

      {!jobId && (
        <p className="mt-3 text-xs text-text-secondary">
          Start an ingestion job to enable manual stage controls.
        </p>
      )}

      {failedStages.length > 0 && (
        <div className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-red-300">Recovery Needed</p>
          <p className="mt-1 text-sm text-red-100">Failed stages: {failedStages.join(', ')}</p>
        </div>
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-md border border-border/60 bg-background-surface/40 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-text-secondary">Documents</p>
          <p className="mt-2 text-lg font-semibold">{status?.status_details?.ingestion?.documents ?? 0}</p>
          <p className="text-xs text-text-secondary">Skipped: {skipped.length}</p>
        </div>
        <div className="rounded-md border border-border/60 bg-background-surface/40 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-text-secondary">Timeline Events</p>
          <p className="mt-2 text-lg font-semibold">{timeline?.events ?? 0}</p>
          <p className="text-xs text-text-secondary">Case narrative updates</p>
        </div>
        <div className="rounded-md border border-border/60 bg-background-surface/40 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-text-secondary">Graph</p>
          <p className="mt-2 text-lg font-semibold">{graph?.nodes ?? 0} nodes</p>
          <p className="text-xs text-text-secondary">{graph?.edges ?? 0} edges · {graph?.triples ?? 0} triples</p>
        </div>
        <div className="rounded-md border border-border/60 bg-background-surface/40 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-text-secondary">Forensics</p>
          <p className="mt-2 text-lg font-semibold">{forensics?.artifacts?.length ?? 0} artifacts</p>
          <p className="text-xs text-text-secondary">Last run: {formatTime(forensics?.last_run_at)}</p>
        </div>
      </div>

      {automation && (
        <div className="mt-4 rounded-md border border-border/60 bg-background-surface/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-text-secondary">Automation</p>
            <span className={statusClass(automation.status)}>{automation.status ?? 'unknown'}</span>
          </div>
          {automation.error && <p className="mt-2 text-xs text-red-300">{automation.error}</p>}
          <p className="mt-2 text-xs text-text-secondary">Completed: {formatTime(automation.completed_at)}</p>
        </div>
      )}

      {skipped.length > 0 && (
        <div className="mt-4 rounded-md border border-border/60 bg-background-surface/40 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-text-secondary">Skipped Inputs</p>
          <ul className="mt-2 space-y-1 text-xs text-text-secondary">
            {skipped.slice(0, 8).map((item, index) => (
              <li key={`skipped-${index}`}>{JSON.stringify(item)}</li>
            ))}
          </ul>
          {skipped.length > 8 && <p className="mt-1 text-xs text-text-secondary">+{skipped.length - 8} more</p>}
        </div>
      )}

      {stageDetails.length > 0 && (
        <div className="mt-4 rounded-md border border-border/60 bg-background-surface/40 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-text-secondary">Detailed Stage Status</p>
          <ul className="mt-2 space-y-2">
            {stageDetails.map((stage) => (
              <li key={stage.name} className="rounded border border-border/40 bg-background-surface/40 p-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-text-primary">{stage.name}</span>
                  <span className={statusClass(stage.status)}>{stage.status}</span>
                </div>
                <p className="mt-1 text-text-secondary">
                  Started: {formatTime(stage.started_at)} · Completed: {formatTime(stage.completed_at)}
                </p>
                {stage.warnings && stage.warnings.length > 0 && (
                  <ul className="mt-1 list-disc pl-4 text-amber-300">
                    {stage.warnings.slice(0, 3).map((warning, index) => (
                      <li key={`${stage.name}-warn-${index}`}>{warning}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {lastRun && <p className="mt-2 text-xs text-text-secondary">Last triggered stage: {lastRun}</p>}
      {runError && <p className="mt-2 text-xs text-red-400">{runError}</p>}
    </div>
  );
}
