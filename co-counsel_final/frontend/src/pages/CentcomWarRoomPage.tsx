import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createWorkflowRun,
  getWorkflowEvents,
  getWorkflowRun,
  pauseWorkflowRun,
  resumeWorkflowRun,
  retryWorkflowPhase,
  stopWorkflowRun,
  WorkflowRunEventsResponse,
  WorkflowRunState,
} from '@/services/workflow_api';
import {
  getGraphRefinementStatus,
  restartGraphRefinement,
  GraphRefinementStatus,
} from '@/services/graph_refinement_api';
import { fetchCourtProviderStatus, fetchCourtSyncStatus, searchCourtRecords } from '@/services/courts_api';
import { CourtProviderStatusEntry, CourtSyncStatusPayload, TimelineEvent } from '@/types';
import { fetchTimeline } from '@/utils/apiClient';
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

const STATIONS = [
  {
    id: 'ingestion',
    label: 'Ingestion Ops',
    phases: ['ingestion', 'preprocess', 'parsing_chunking', 'indexing'],
    focus: 'Sources → normalized corpus',
  },
  {
    id: 'forensics',
    label: 'Forensics Suite',
    phases: ['forensics'],
    focus: 'Authenticity, crypto, custody',
  },
  {
    id: 'graph',
    label: 'Graph Intelligence',
    phases: ['fact_extraction'],
    focus: 'Claims, entities, relationships',
  },
  {
    id: 'timeline',
    label: 'Timeline Builder',
    phases: ['timeline'],
    focus: 'Chronology, deadlines, story mode',
  },
  {
    id: 'theory',
    label: 'Legal Theory',
    phases: ['legal_theories'],
    focus: 'Claims, elements, burdens',
  },
  {
    id: 'strategy',
    label: 'Strategic Desk',
    phases: ['strategy'],
    focus: 'Hearing & trial posture',
  },
  {
    id: 'drafting',
    label: 'Drafting Bay',
    phases: ['drafting'],
    focus: 'Motions, briefs, exhibits',
  },
  {
    id: 'qa',
    label: 'QA & Review',
    phases: ['qa_review'],
    focus: 'Quality gates and sign-off',
  },
];

const QUEUE_ITEMS = [
  { id: 'q1', title: 'Generate courtroom storyboard pack', owner: 'Timeline swarm', eta: '4m', priority: 'high' },
  { id: 'q2', title: 'Validate key exhibit citations', owner: 'QA swarm', eta: '8m', priority: 'medium' },
  { id: 'q3', title: 'Run gap scan on trial narrative', owner: 'Strategy swarm', eta: '12m', priority: 'low' },
];

const AUTO_CHECKS = [
  { id: 'ingest', label: 'Ingestion & preprocessing complete', phases: ['ingestion', 'preprocess', 'parsing_chunking', 'indexing'] },
  { id: 'forensics', label: 'Forensics suite run', phases: ['forensics'] },
  { id: 'timeline', label: 'Timeline published', phases: ['timeline'] },
  { id: 'strategy', label: 'Strategy brief generated', phases: ['strategy'] },
  { id: 'drafting', label: 'Draft package ready', phases: ['drafting'] },
  { id: 'qa', label: 'QA review passed', phases: ['qa_review'] },
];

const MANUAL_CHECKS = [
  { id: 'court_sync', label: 'Courtroom sync verified' },
  { id: 'client_signoff', label: 'Client sign-off recorded' },
  { id: 'trial_pack', label: 'Trial pack sent to counsel table' },
];

const statusTone = (status?: string) => {
  switch (status) {
    case 'running':
      return 'tone-running';
    case 'paused':
      return 'tone-paused';
    case 'failed':
      return 'tone-failed';
    case 'succeeded':
      return 'tone-success';
    case 'stopped':
      return 'tone-stopped';
    default:
      return 'tone-queued';
  }
};

export default function CentcomWarRoomPage() {
  const { caseId, setCaseId } = useSharedCaseId();
  const [selectedPhases, setSelectedPhases] = useState<string[]>(PHASES);
  const [runState, setRunState] = useState<WorkflowRunState | null>(null);
  const [events, setEvents] = useState<WorkflowRunEventsResponse['events']>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [graphStatus, setGraphStatus] = useState<GraphRefinementStatus | null>(null);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [graphLoading, setGraphLoading] = useState(false);
  const [manualChecklist, setManualChecklist] = useState<Record<string, boolean>>(() =>
    MANUAL_CHECKS.reduce((acc, item) => ({ ...acc, [item.id]: false }), {})
  );
  const [autonomyMode, setAutonomyMode] = useState<'low' | 'balanced' | 'high'>('balanced');
  const [priorityMode, setPriorityMode] = useState<'precision' | 'balanced' | 'speed'>('balanced');
  const [courtProviders, setCourtProviders] = useState<CourtProviderStatusEntry[]>([]);
  const [courtLoading, setCourtLoading] = useState(false);
  const [courtError, setCourtError] = useState<string | null>(null);
  const [deadlineEvents, setDeadlineEvents] = useState<TimelineEvent[]>([]);
  const [deadlineLoading, setDeadlineLoading] = useState(false);
  const [deadlineError, setDeadlineError] = useState<string | null>(null);
  const [courtSearchProvider, setCourtSearchProvider] = useState('courtlistener');
  const [courtSearchQuery, setCourtSearchQuery] = useState('recent family law hearing rulings');
  const [courtSearchJurisdiction, setCourtSearchJurisdiction] = useState('CA');
  const [courtSearchLoading, setCourtSearchLoading] = useState(false);
  const [courtSearchError, setCourtSearchError] = useState<string | null>(null);
  const [courtSearchResults, setCourtSearchResults] = useState<Array<Record<string, unknown>>>([]);
  const [courtSync, setCourtSync] = useState<CourtSyncStatusPayload | null>(null);
  const cursorRef = useRef(0);

  const runId = runState?.run_id;

  const totals = useMemo(() => {
    if (!runState) {
      return { nodes: 0, edges: 0, timeline: 0, citations: 0, forensics: 0 };
    }
    return runState.phases.reduce(
      (acc, phase) => {
        const summary = phase.summary || {};
        acc.nodes += Number(summary.new_nodes ?? 0);
        acc.edges += Number(summary.new_edges ?? 0);
        acc.timeline += Number(summary.timeline_events ?? 0);
        acc.citations += Number(summary.citations ?? 0);
        acc.forensics += Number(summary.forensics_artifacts ?? 0);
        return acc;
      },
      { nodes: 0, edges: 0, timeline: 0, citations: 0, forensics: 0 }
    );
  }, [runState]);

  const lastError = useMemo(() => {
    if (!runState) {
      return null;
    }
    const failedPhase = runState.phases.find((phase) => phase.status === 'failed');
    return failedPhase?.error ?? null;
  }, [runState]);

  const phaseStatusMap = useMemo(() => {
    return new Map(runState?.phases.map((phase) => [phase.phase, phase.status]) ?? []);
  }, [runState?.phases]);

  const stationSnapshots = useMemo(() => {
    return STATIONS.map((station) => {
      const statuses = station.phases.map((phase) => phaseStatusMap.get(phase) ?? 'queued');
      const total = statuses.length;
      const succeeded = statuses.filter((status) => status === 'succeeded').length;
      const running = statuses.some((status) => status === 'running');
      const failed = statuses.some((status) => status === 'failed');
      const paused = statuses.some((status) => status === 'paused');
      const status = failed
        ? 'failed'
        : running
          ? 'running'
          : paused
            ? 'paused'
            : total > 0 && succeeded === total
              ? 'succeeded'
              : 'queued';
      const progress = total > 0 ? Math.round((succeeded / total) * 100) : 0;
      return { ...station, status, progress, succeeded, total };
    });
  }, [phaseStatusMap]);

  const autoChecklist = useMemo(() => {
    return AUTO_CHECKS.map((item) => {
      const done = item.phases.every((phase) => phaseStatusMap.get(phase) === 'succeeded');
      return { ...item, done };
    });
  }, [phaseStatusMap]);

  const nearestDeadline = useMemo(() => {
    const sorted = [...deadlineEvents]
      .filter((event) => Boolean(event.motion_deadline))
      .sort((left, right) => {
        const leftTs = new Date(left.motion_deadline as string).getTime();
        const rightTs = new Date(right.motion_deadline as string).getTime();
        return leftTs - rightTs;
      });
    return sorted[0] ?? null;
  }, [deadlineEvents]);

  const refreshRun = async () => {
    if (!runId) {
      return;
    }
    try {
      const updated = await getWorkflowRun(caseId, runId);
      setRunState(updated);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to refresh run');
    }
  };

  const refreshEvents = async () => {
    if (!runId) {
      return;
    }
    try {
      const response = await getWorkflowEvents(caseId, runId, cursorRef.current);
      cursorRef.current = response.cursor;
      if (response.events.length) {
        setEvents((prev) => [...prev, ...response.events]);
      }
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load events');
    }
  };

  useEffect(() => {
    if (!runId) {
      return;
    }
    const interval = window.setInterval(() => {
      refreshRun();
      refreshEvents();
    }, 3000);
    return () => window.clearInterval(interval);
  }, [runId, caseId]);

  const togglePhase = (phase: string) => {
    setSelectedPhases((prev) =>
      prev.includes(phase) ? prev.filter((item) => item !== phase) : [...prev, phase]
    );
  };

  const handleStartRun = async () => {
    setLoading(true);
    setError(null);
    try {
      const run = await createWorkflowRun(caseId, selectedPhases);
      setRunState(run);
      setEvents([]);
      cursorRef.current = 0;
    } catch (err: any) {
      setError(err?.message ?? 'Failed to start run');
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    if (!runId) return;
    setLoading(true);
    try {
      const run = await pauseWorkflowRun(caseId, runId);
      setRunState(run);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to pause run');
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async () => {
    if (!runId) return;
    setLoading(true);
    try {
      const run = await resumeWorkflowRun(caseId, runId);
      setRunState(run);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to resume run');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (!runId) return;
    setLoading(true);
    try {
      const run = await stopWorkflowRun(caseId, runId);
      setRunState(run);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to stop run');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    if (!runId) return;
    setLoading(true);
    try {
      const run = await retryWorkflowPhase(caseId, runId);
      setRunState(run);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to retry run');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPhase = async (phase: string) => {
    if (!runId) return;
    setLoading(true);
    try {
      const run = await retryWorkflowPhase(caseId, runId, phase);
      setRunState(run);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to retry phase');
    } finally {
      setLoading(false);
    }
  };

  const refreshGraphStatus = async () => {
    try {
      const status = await getGraphRefinementStatus();
      setGraphStatus(status);
      setGraphError(null);
    } catch (err: any) {
      setGraphError(err?.message ?? 'Failed to load graph refinement status');
    }
  };

  const refreshCourtStatus = async () => {
    setCourtLoading(true);
    try {
      const payload = await fetchCourtProviderStatus();
      setCourtProviders(payload.providers ?? []);
      const syncPayload = await fetchCourtSyncStatus(caseId, courtSearchJurisdiction.trim() || undefined);
      setCourtSync(syncPayload);
      setCourtError(null);
    } catch (err: any) {
      setCourtError(err?.message ?? 'Failed to load court provider status');
    } finally {
      setCourtLoading(false);
    }
  };

  const refreshDeadlineFeed = async () => {
    setDeadlineLoading(true);
    const nowIso = new Date().toISOString();
    try {
      const payload = await fetchTimeline({
        limit: 12,
        motion_due_after: nowIso,
      });
      const events = (payload.events ?? [])
        .filter((event) => Boolean(event.motion_deadline))
        .sort((left, right) => {
          const leftTs = new Date(left.motion_deadline as string).getTime();
          const rightTs = new Date(right.motion_deadline as string).getTime();
          return leftTs - rightTs;
        });
      setDeadlineEvents(events);
      setDeadlineError(null);
    } catch (err: any) {
      setDeadlineError(err?.message ?? 'Failed to load deadline feed');
    } finally {
      setDeadlineLoading(false);
    }
  };

  const runCourtSearch = async () => {
    if (!courtSearchQuery.trim()) return;
    setCourtSearchLoading(true);
    setCourtSearchError(null);
    try {
      const payload = await searchCourtRecords({
        provider_id: courtSearchProvider,
        query: courtSearchQuery.trim(),
        jurisdiction: courtSearchJurisdiction.trim() || undefined,
        limit: 8,
      });
      setCourtSearchResults(payload.results ?? []);
    } catch (err: any) {
      setCourtSearchError(err?.message ?? 'Court search failed');
      setCourtSearchResults([]);
    } finally {
      setCourtSearchLoading(false);
    }
  };

  const handleGraphRestart = async () => {
    setGraphLoading(true);
    try {
      const status = await restartGraphRefinement();
      setGraphStatus(status);
      setGraphError(null);
    } catch (err: any) {
      setGraphError(err?.message ?? 'Failed to restart graph refinement');
    } finally {
      setGraphLoading(false);
    }
  };

  useEffect(() => {
    refreshGraphStatus();
    const interval = window.setInterval(refreshGraphStatus, 10000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    void refreshCourtStatus();
    void refreshDeadlineFeed();
    const interval = window.setInterval(() => {
      void refreshCourtStatus();
      void refreshDeadlineFeed();
    }, 30000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="centcom-shell">
      <section className="centcom-header">
        <div>
          <p className="centcom-eyebrow">CENTCOM</p>
          <h1 className="centcom-title">War Room Orchestration</h1>
          <p className="centcom-subtitle">Command, monitor, and audit every swarm phase in real time.</p>
        </div>
        <div className={`centcom-status ${statusTone(runState?.status)}`}>
          {runState?.status ?? 'idle'}
        </div>
      </section>

      <section className="centcom-grid">
        <aside className="centcom-panel centcom-panel--controls">
          <h2>Run Command</h2>
          <label className="centcom-label">Case ID</label>
          <input
            className="centcom-input"
            value={caseId}
            onChange={(event) => setCaseId(event.target.value)}
          />

          <div className="centcom-phase-list">
            {PHASES.map((phase) => (
              <button
                key={phase}
                type="button"
                className={selectedPhases.includes(phase) ? 'phase-chip active' : 'phase-chip'}
                onClick={() => togglePhase(phase)}
              >
                {phase.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="centcom-controls">
            <button className="centcom-btn primary" onClick={handleStartRun} disabled={loading}>
              Start Run
            </button>
            <button className="centcom-btn" onClick={handlePause} disabled={!runId || loading}>
              Pause
            </button>
            <button className="centcom-btn" onClick={handleResume} disabled={!runId || loading}>
              Resume
            </button>
            <button className="centcom-btn danger" onClick={handleStop} disabled={!runId || loading}>
              Stop
            </button>
            <button className="centcom-btn" onClick={handleRetry} disabled={!runId || loading}>
              Retry Failed Phase
            </button>
          </div>

          {error && <p className="centcom-error">{error}</p>}
          {runState?.run_id && (
            <div className="centcom-run-meta">
              <div><span>Run ID</span> {runState.run_id}</div>
              <div><span>Current Phase</span> {runState.current_phase ?? '—'}</div>
            </div>
          )}
        </aside>

        <div className="centcom-panel centcom-panel--timeline">
          <h2>Phase Timeline</h2>
          <div className="centcom-phase-timeline">
            {runState?.phases?.map((phase) => (
              <div key={phase.phase} className={`phase-row ${statusTone(phase.status)}`}>
                <div>
                  <div className="phase-title">{phase.phase.replace('_', ' ')}</div>
                  <div className="phase-meta">
                    <span>Status: {phase.status}</span>
                    <span>Updated: {phase.completed_at ?? phase.started_at ?? '—'}</span>
                  </div>
                  {phase.error && <div className="phase-error">{phase.error}</div>}
                </div>
                <button
                  className="centcom-btn ghost"
                  onClick={() => handleRetryPhase(phase.phase)}
                  disabled={!runId || loading}
                >
                  Re-run
                </button>
              </div>
            ))}
          </div>
        </div>

        <aside className="centcom-panel centcom-panel--telemetry">
          <h2>Telemetry & Yield</h2>
          <div className="centcom-telemetry-grid">
            <div className="telemetry-card">
              <span>Graph Nodes</span>
              <strong>{totals.nodes}</strong>
            </div>
            <div className="telemetry-card">
              <span>Graph Edges</span>
              <strong>{totals.edges}</strong>
            </div>
            <div className="telemetry-card">
              <span>Timeline Events</span>
              <strong>{totals.timeline}</strong>
            </div>
            <div className="telemetry-card">
              <span>Citations</span>
              <strong>{totals.citations}</strong>
            </div>
            <div className="telemetry-card">
              <span>Forensics Artifacts</span>
              <strong>{totals.forensics}</strong>
            </div>
          </div>
          {lastError && (
            <div className="centcom-alert">
              <span>Last Error</span>
              <p>{lastError}</p>
            </div>
          )}
        </aside>

        <section className="centcom-panel centcom-panel--wide centcom-panel--stations">
          <div className="centcom-panel-header">
            <div>
              <h2>Swarm Stations</h2>
              <p className="centcom-muted">Live phase health across all mission-critical swarms.</p>
            </div>
            <div className="centcom-panel-actions">
              <button className="centcom-btn ghost">Snapshot</button>
              <button className="centcom-btn ghost">Assign</button>
            </div>
          </div>
          <div className="centcom-station-grid">
            {stationSnapshots.map((station) => (
              <article key={station.id} className={`centcom-station-card ${statusTone(station.status)}`}>
                <header>
                  <div>
                    <h3>{station.label}</h3>
                    <p>{station.focus}</p>
                  </div>
                  <span className={`station-status ${statusTone(station.status)}`}>{station.status}</span>
                </header>
                <div className="station-progress">
                  <div style={{ width: `${station.progress}%` }} />
                </div>
                <div className="station-meta">
                  <span>{station.succeeded}/{station.total} phases</span>
                  <span>{station.progress}% complete</span>
                </div>
                <div className="station-tags">
                  {station.phases.map((phase) => (
                    <span key={`${station.id}-${phase}`}>{phase.replace('_', ' ')}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="centcom-panel centcom-panel--wide centcom-panel--queue">
          <div className="centcom-panel-header">
            <div>
              <h2>Priority Queue</h2>
              <p className="centcom-muted">Next critical runs and human checkpoints.</p>
            </div>
            <div className="centcom-panel-actions">
              <button className="centcom-btn ghost">Reorder</button>
              <button className="centcom-btn ghost">Add Task</button>
            </div>
          </div>
          <div className="centcom-queue">
            {QUEUE_ITEMS.map((item) => (
              <div key={item.id} className={`centcom-queue-item priority-${item.priority}`}>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.owner}</span>
                </div>
                <div className="queue-meta">
                  <span>{item.priority.toUpperCase()}</span>
                  <span>ETA {item.eta}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="centcom-panel centcom-panel--controls">
          <h2>Command Deck</h2>
          <div className="centcom-deck">
            <div className="centcom-deck-row">
              <span>Autonomy</span>
              <select
                className="centcom-input"
                value={autonomyMode}
                onChange={(event) => setAutonomyMode(event.target.value as 'low' | 'balanced' | 'high')}
              >
                <option value="low">Low</option>
                <option value="balanced">Balanced</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="centcom-deck-row">
              <span>Priority Mode</span>
              <select
                className="centcom-input"
                value={priorityMode}
                onChange={(event) => setPriorityMode(event.target.value as 'precision' | 'balanced' | 'speed')}
              >
                <option value="precision">Precision</option>
                <option value="balanced">Balanced</option>
                <option value="speed">Speed</option>
              </select>
            </div>
            <div className="centcom-deck-actions">
              <button className="centcom-btn primary">Deploy Pulse</button>
              <button className="centcom-btn">Send Status Brief</button>
            </div>
          </div>
        </aside>

        <aside className="centcom-panel centcom-panel--controls">
          <h2>Mission Checklist</h2>
          <div className="centcom-checklist">
            {autoChecklist.map((item) => (
              <label key={item.id} className={`check-row ${item.done ? 'done' : ''}`}>
                <input type="checkbox" checked={item.done} readOnly />
                <span>{item.label}</span>
                <em>auto</em>
              </label>
            ))}
            {MANUAL_CHECKS.map((item) => (
              <label key={item.id} className={`check-row ${manualChecklist[item.id] ? 'done' : ''}`}>
                <input
                  type="checkbox"
                  checked={manualChecklist[item.id]}
                  onChange={(event) =>
                    setManualChecklist((prev) => ({ ...prev, [item.id]: event.target.checked }))
                  }
                />
                <span>{item.label}</span>
                <em>manual</em>
              </label>
            ))}
          </div>
        </aside>

        <aside className="centcom-panel centcom-panel--telemetry">
          <h2>Graph Refinement Swarm</h2>
          {graphError && <p className="centcom-error">{graphError}</p>}
          {graphStatus ? (
            <div className="centcom-run-meta">
              <div><span>Status</span> {graphStatus.running ? 'running' : 'idle'}</div>
              <div><span>Enabled</span> {graphStatus.enabled ? 'yes' : 'no'}</div>
              <div><span>Idle runs</span> {graphStatus.idle_runs} / {graphStatus.idle_limit}</div>
              <div><span>Interval (s)</span> {graphStatus.interval_seconds}</div>
              <div><span>Min new edges</span> {graphStatus.min_new_edges}</div>
              <div><span>Stop requested</span> {graphStatus.stop_requested ? 'yes' : 'no'}</div>
            </div>
          ) : (
            <p className="centcom-muted">Status unavailable.</p>
          )}
          <div className="centcom-controls">
            <button className="centcom-btn" onClick={handleGraphRestart} disabled={graphLoading}>
              Restart Refinement
            </button>
          </div>
        </aside>

        <section className="centcom-panel centcom-panel--wide centcom-panel--court">
          <div className="centcom-panel-header">
            <div>
              <h2>Court Sync Desk</h2>
              <p className="centcom-muted">Provider readiness and upcoming motion-deadline radar.</p>
            </div>
            <div className="centcom-panel-actions">
              <button className="centcom-btn ghost" onClick={() => void refreshCourtStatus()} disabled={courtLoading}>
                Refresh Providers
              </button>
              <button className="centcom-btn ghost" onClick={() => void refreshDeadlineFeed()} disabled={deadlineLoading}>
                Refresh Deadlines
              </button>
            </div>
          </div>
          <div className="centcom-court-grid">
            <article className="centcom-court-card">
              <h3>Provider Health</h3>
              {courtLoading && <p className="centcom-muted">Loading provider status...</p>}
              {courtError && <p className="centcom-error">{courtError}</p>}
              {!courtLoading && !courtError && courtProviders.length === 0 && (
                <p className="centcom-muted">No provider metadata available.</p>
              )}
              {!courtLoading && !courtError && courtProviders.length > 0 && (
                <ul className="centcom-court-list">
                  {courtProviders.map((provider) => (
                    <li key={provider.provider_id}>
                      <div>
                        <strong>{provider.provider_id.toUpperCase()}</strong>
                        <span>{provider.ready ? 'Ready for sync' : provider.reason ?? 'Needs credentials'}</span>
                      </div>
                      <em className={provider.ready ? 'tone-success' : 'tone-paused'}>
                        {provider.ready ? 'ONLINE' : 'SETUP'}
                      </em>
                    </li>
                  ))}
                </ul>
              )}
              {courtSync && (
                <div className="centcom-court-highlight">
                  <span>Payment queue</span>
                  <strong>
                    {courtSync.payment_queue.pending} pending · {courtSync.payment_queue.authorized} authorized
                  </strong>
                  <p>Total events: {courtSync.payment_queue.total}</p>
                </div>
              )}
              <div className="centcom-court-search">
                <label className="centcom-label" htmlFor="court-provider">Provider</label>
                <select
                  id="court-provider"
                  className="centcom-input"
                  value={courtSearchProvider}
                  onChange={(event) => setCourtSearchProvider(event.target.value)}
                >
                  <option value="courtlistener">CourtListener</option>
                  <option value="caselaw">CaseLaw (Appeals/Supreme)</option>
                  <option value="pacer">PACER</option>
                  <option value="unicourt">UniCourt</option>
                  <option value="lacs">LACS</option>
                  <option value="leginfo">CA LegInfo Statutes</option>
                </select>
                <label className="centcom-label" htmlFor="court-jurisdiction">Jurisdiction</label>
                <input
                  id="court-jurisdiction"
                  className="centcom-input"
                  value={courtSearchJurisdiction}
                  onChange={(event) => setCourtSearchJurisdiction(event.target.value)}
                  placeholder="e.g. CA"
                />
                <label className="centcom-label" htmlFor="court-query">Court Search</label>
                <textarea
                  id="court-query"
                  className="centcom-input centcom-textarea"
                  value={courtSearchQuery}
                  onChange={(event) => setCourtSearchQuery(event.target.value)}
                  placeholder="Search dockets, rulings, or case references..."
                />
                <button type="button" className="centcom-btn primary" onClick={() => void runCourtSearch()} disabled={courtSearchLoading}>
                  {courtSearchLoading ? 'Searching...' : 'Run Court Search'}
                </button>
                {courtSearchError && <p className="centcom-error">{courtSearchError}</p>}
                {!courtSearchLoading && courtSearchResults.length > 0 && (
                  <ul className="centcom-court-list">
                    {courtSearchResults.slice(0, 5).map((item, index) => {
                      const title =
                        (item.case_name as string) ||
                        (item.title as string) ||
                        (item.name as string) ||
                        `Result ${index + 1}`;
                      const detail =
                        (item.court as string) ||
                        (item.jurisdiction as string) ||
                        (item.docket_number as string) ||
                        (item.date_filed as string) ||
                        'No metadata';
                      return (
                        <li key={`court-result-${index}`}>
                          <div>
                            <strong>{title}</strong>
                            <span>{detail}</span>
                          </div>
                          <em>MATCH</em>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </article>
            <article className="centcom-court-card">
              <h3>Deadline Radar</h3>
              {deadlineLoading && <p className="centcom-muted">Loading upcoming deadlines...</p>}
              {deadlineError && <p className="centcom-error">{deadlineError}</p>}
              {!deadlineLoading && !deadlineError && nearestDeadline && (
                <div className="centcom-court-highlight">
                  <span>Nearest deadline</span>
                  <strong>{new Date(nearestDeadline.motion_deadline as string).toLocaleString()}</strong>
                  <p>{nearestDeadline.title}</p>
                </div>
              )}
              {!deadlineLoading && !deadlineError && deadlineEvents.length === 0 && (
                <p className="centcom-muted">No upcoming motion deadlines found.</p>
              )}
              {!deadlineLoading && !deadlineError && deadlineEvents.length > 0 && (
                <ul className="centcom-court-list">
                  {deadlineEvents.slice(0, 6).map((event) => (
                    <li key={event.id}>
                      <div>
                        <strong>{event.title}</strong>
                        <span>{event.summary}</span>
                      </div>
                      <em>{new Date(event.motion_deadline as string).toLocaleDateString()}</em>
                    </li>
                  ))}
                </ul>
              )}
              {courtSync && courtSync.cases.length > 0 && (
                <>
                  <h4 className="centcom-muted">Case Sync Preview</h4>
                  <ul className="centcom-court-list">
                    {courtSync.cases.slice(0, 4).map((item, index) => (
                      <li key={`case-sync-${item.provider}-${index}`}>
                        <div>
                          <strong>{item.provider.toUpperCase()}</strong>
                          <span>{item.documents_found} documents indexed for {item.case_id}</span>
                        </div>
                        <em>SYNCED</em>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </article>
          </div>
        </section>
      </section>

      <section className="centcom-panel centcom-panel--audit">
        <div className="centcom-audit-header">
          <h2>Audit Log</h2>
          <button className="centcom-btn ghost" onClick={refreshEvents} disabled={!runId}>
            Refresh
          </button>
        </div>
        <div className="centcom-audit-stream">
          {events.length === 0 && <p className="centcom-muted">No events yet.</p>}
          {events.map((event, index) => (
            <div key={`${event.timestamp}-${index}`} className="audit-row">
              <span className="audit-time">{new Date(event.timestamp).toLocaleString()}</span>
              <span className="audit-event">{event.event}</span>
              <span className="audit-payload">{JSON.stringify(event.payload)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
