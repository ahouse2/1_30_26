import { useEffect, useMemo, useState } from 'react';
import {
  createParityTask,
  getParityMatrix,
  LegacyWorkflow,
  listParityTasks,
  listLegacyWorkflows,
  ParityMatrixItem,
  ParityMatrixSummary,
  ParityTask,
  runLegacyWorkflow,
  runParityDraft,
  runParityPrivilegeBates,
  runParityRiskAnalysis,
  updateParityTask,
} from '@/services/parity_ops_api';
import { useSharedCaseId } from '@/hooks/useSharedCaseId';

export default function ParityOpsPage() {
  const { caseId, setCaseId } = useSharedCaseId();
  const [tasks, setTasks] = useState<ParityTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [owner, setOwner] = useState('QA swarm');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const [draftType, setDraftType] = useState('motion');
  const [draftInstructions, setDraftInstructions] = useState('');
  const [draftResult, setDraftResult] = useState<Record<string, unknown> | null>(null);

  const [claimText, setClaimText] = useState('');
  const [evidenceText, setEvidenceText] = useState('');
  const [analysisResult, setAnalysisResult] = useState<Record<string, unknown> | null>(null);

  const [docText, setDocText] = useState('');
  const [batesPrefix, setBatesPrefix] = useState('EXH');
  const [privResult, setPrivResult] = useState<Record<string, unknown> | null>(null);
  const [paritySummary, setParitySummary] = useState<ParityMatrixSummary | null>(null);
  const [parityItems, setParityItems] = useState<ParityMatrixItem[]>([]);
  const [legacyWorkflows, setLegacyWorkflows] = useState<LegacyWorkflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState('deposition_prep');
  const [legacyPrompt, setLegacyPrompt] = useState('');
  const [legacyResult, setLegacyResult] = useState<Record<string, unknown> | null>(null);

  const refreshTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listParityTasks(caseId);
      setTasks(data);
    } catch (err: any) {
      setError(err?.message ?? 'Unable to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const refreshParityState = async () => {
    try {
      const [matrix, workflows] = await Promise.all([
        getParityMatrix(),
        listLegacyWorkflows(),
      ]);
      setParitySummary(matrix.summary);
      setParityItems(matrix.items);
      setLegacyWorkflows(workflows);
      if (workflows.length > 0 && !workflows.some((workflow) => workflow.workflow_id === selectedWorkflow)) {
        setSelectedWorkflow(workflows[0].workflow_id);
      }
    } catch (err: any) {
      setError(err?.message ?? 'Unable to load parity matrix');
    }
  };

  useEffect(() => {
    void refreshTasks();
    void refreshParityState();
  }, [caseId]);

  const statusCounts = useMemo(() => {
    return tasks.reduce(
      (acc, task) => {
        acc[task.status] = (acc[task.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [tasks]);

  const addTask = async () => {
    if (!title.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await createParityTask({
        case_id: caseId,
        title: title.trim(),
        owner,
        priority,
      });
      setTitle('');
      await refreshTasks();
    } catch (err: any) {
      setError(err?.message ?? 'Unable to create task');
    } finally {
      setLoading(false);
    }
  };

  const setTaskStatus = async (task: ParityTask, status: ParityTask['status']) => {
    setLoading(true);
    setError(null);
    try {
      await updateParityTask(caseId, task.task_id, { status });
      await refreshTasks();
    } catch (err: any) {
      setError(err?.message ?? 'Unable to update task');
    } finally {
      setLoading(false);
    }
  };

  const runDraft = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await runParityDraft(caseId, draftType, draftInstructions);
      setDraftResult(result);
    } catch (err: any) {
      setError(err?.message ?? 'Draft run failed');
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await runParityRiskAnalysis(claimText, evidenceText);
      setAnalysisResult(result);
    } catch (err: any) {
      setError(err?.message ?? 'Risk analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const runPrivilegeBates = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await runParityPrivilegeBates(docText, batesPrefix, 1);
      setPrivResult(result);
    } catch (err: any) {
      setError(err?.message ?? 'Privilege/Bates pass failed');
    } finally {
      setLoading(false);
    }
  };

  const runLegacy = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await runLegacyWorkflow(caseId, selectedWorkflow, legacyPrompt);
      setLegacyResult(result);
      await refreshParityState();
    } catch (err: any) {
      setError(err?.message ?? 'Legacy workflow run failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel-shell parity-ops-page">
      <header>
        <h2>Parity Operations Console</h2>
        <p className="panel-subtitle">
          Case management, drafting, privilege+bates, and discrepancy/sanctions checks in one station.
        </p>
      </header>

      <div className="workflow-controls">
        <div className="field-group">
          <label htmlFor="parity-case-id">Case ID</label>
          <input
            id="parity-case-id"
            className="input-cinematic"
            value={caseId}
            onChange={(event) => setCaseId(event.target.value)}
          />
        </div>
      </div>

      <div className="parity-kpis">
        <span>Queued: {statusCounts.queued ?? 0}</span>
        <span>Running: {statusCounts.running ?? 0}</span>
        <span>Blocked: {statusCounts.blocked ?? 0}</span>
        <span>Done: {statusCounts.done ?? 0}</span>
        <span>Parity: {paritySummary ? `${Math.round(paritySummary.score * 100)}%` : '...'}</span>
      </div>

      {error && <p className="error-text">Error: {error}</p>}

      <div className="parity-grid">
        <article className="parity-card">
          <h3>Task Tracker</h3>
          <div className="parity-form-row">
            <input className="input-cinematic" placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <input className="input-cinematic" placeholder="Owner" value={owner} onChange={(e) => setOwner(e.target.value)} />
          </div>
          <div className="parity-form-row">
            <select className="input-cinematic" value={priority} onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <button className="btn-cinematic" onClick={() => void addTask()} disabled={loading}>Add Task</button>
          </div>
          <div className="parity-task-list">
            {tasks.map((task) => (
              <div key={task.task_id} className="parity-task-item">
                <div>
                  <strong>{task.title}</strong>
                  <div className="panel-subtitle">{task.owner} · {task.priority}</div>
                </div>
                <select
                  className="input-cinematic"
                  value={task.status}
                  onChange={(event) => void setTaskStatus(task, event.target.value as ParityTask['status'])}
                >
                  <option value="queued">Queued</option>
                  <option value="running">Running</option>
                  <option value="blocked">Blocked</option>
                  <option value="done">Done</option>
                </select>
              </div>
            ))}
            {tasks.length === 0 && !loading && <p className="panel-subtitle">No tasks yet for this case.</p>}
          </div>
        </article>

        <article className="parity-card">
          <h3>Drafting Tooling</h3>
          <div className="parity-form-row">
            <select className="input-cinematic" value={draftType} onChange={(event) => setDraftType(event.target.value)}>
              <option value="motion">Motion</option>
              <option value="brief">Brief</option>
              <option value="declaration">Declaration</option>
            </select>
            <button className="btn-cinematic" onClick={() => void runDraft()} disabled={loading}>Run Draft</button>
          </div>
          <textarea
            className="drafting-textarea"
            placeholder="Optional drafting instructions..."
            value={draftInstructions}
            onChange={(event) => setDraftInstructions(event.target.value)}
          />
          {draftResult && (
            <pre className="forensics-report__code">{JSON.stringify(draftResult, null, 2)}</pre>
          )}
        </article>

        <article className="parity-card">
          <h3>Legacy Workflow Runner</h3>
          <div className="parity-form-row">
            <select
              className="input-cinematic"
              value={selectedWorkflow}
              onChange={(event) => setSelectedWorkflow(event.target.value)}
            >
              {legacyWorkflows.map((workflow) => (
                <option key={workflow.workflow_id} value={workflow.workflow_id}>
                  {workflow.title}
                </option>
              ))}
            </select>
            <button className="btn-cinematic" onClick={() => void runLegacy()} disabled={loading}>
              Run Legacy
            </button>
          </div>
          <textarea
            className="drafting-textarea"
            placeholder="Optional workflow context..."
            value={legacyPrompt}
            onChange={(event) => setLegacyPrompt(event.target.value)}
          />
          {legacyResult && (
            <pre className="forensics-report__code">{JSON.stringify(legacyResult, null, 2)}</pre>
          )}
        </article>

        <article className="parity-card">
          <h3>Parity Matrix</h3>
          <div className="parity-task-list">
            {parityItems.map((item) => (
              <div key={item.capability} className="parity-task-item">
                <div>
                  <strong>{item.capability}</strong>
                  <div className="panel-subtitle">{item.notes}</div>
                </div>
                <span className={`parity-status parity-status--${item.status}`}>{item.status}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="parity-card">
          <h3>Discrepancy + Sanctions Risk</h3>
          <textarea className="drafting-textarea" placeholder="Claim text" value={claimText} onChange={(event) => setClaimText(event.target.value)} />
          <textarea className="drafting-textarea" placeholder="Evidence text" value={evidenceText} onChange={(event) => setEvidenceText(event.target.value)} />
          <button className="btn-cinematic" onClick={() => void runAnalysis()} disabled={loading}>Analyze Risk</button>
          {analysisResult && (
            <pre className="forensics-report__code">{JSON.stringify(analysisResult, null, 2)}</pre>
          )}
        </article>

        <article className="parity-card">
          <h3>Privilege + Bates Pass</h3>
          <div className="parity-form-row">
            <input className="input-cinematic" value={batesPrefix} onChange={(event) => setBatesPrefix(event.target.value)} placeholder="Prefix" />
            <button className="btn-cinematic" onClick={() => void runPrivilegeBates()} disabled={loading}>Run Pass</button>
          </div>
          <textarea
            className="drafting-textarea"
            placeholder="Paste document text for privilege scan and Bates numbering..."
            value={docText}
            onChange={(event) => setDocText(event.target.value)}
          />
          {privResult && (
            <pre className="forensics-report__code">{JSON.stringify(privResult, null, 2)}</pre>
          )}
        </article>
      </div>
    </section>
  );
}
