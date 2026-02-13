import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { runAgents } from '@/services/agents_api';
import { useSharedCaseId } from '@/hooks/useSharedCaseId';

const PANEL_DEFS = [
  {
    id: 'deposition',
    title: 'Deposition Prep Swarm',
    subtitle: 'Generate witness outlines, question maps, and impeachment vectors.',
    keyword: 'deposition',
    placeholder:
      'Witness list, disputed facts, anticipated defenses, and desired admissions. Include any exhibits to anchor the outline.',
    pill: 'Witness Strategy',
  },
  {
    id: 'subpoena',
    title: 'Subpoena Builder Swarm',
    subtitle: 'Draft targeted subpoenas, duces tecum requests, and custodian notices.',
    keyword: 'subpoena',
    placeholder:
      'Target entities, records sought, date ranges, custodians, and any known compliance concerns.',
    pill: 'Records Acquisition',
  },
  {
    id: 'discovery',
    title: 'Discovery Production Swarm',
    subtitle: 'Build interrogatories, RFPs, RFAs, and discovery response playbooks.',
    keyword: 'discovery',
    placeholder:
      'Discovery objectives, contested topics, privilege notes, and desired production formats.',
    pill: 'RFP/RFA Matrix',
  },
  {
    id: 'trial_prep',
    title: 'Trial Prep Swarm',
    subtitle: 'Assemble trial themes, exhibit roadmaps, and courtroom strategy packets.',
    keyword: 'trial prep',
    placeholder:
      'Case posture, key witnesses, trial themes, evidentiary risks, and upcoming hearings.',
    pill: 'Courtroom Strategy',
  },
];

const AUTONOMY_LEVELS = [
  { value: 'low', label: 'Low Autonomy' },
  { value: 'balanced', label: 'Balanced Autonomy' },
  { value: 'high', label: 'High Autonomy' },
] as const;

type PanelState = {
  prompt: string;
  loading: boolean;
  error: string | null;
  answer: string | null;
  qaNotes: string[];
  telemetry: Record<string, unknown> | null;
};

export default function TrialPrepHubPage() {
  const { caseId, setCaseId } = useSharedCaseId();
  const [autonomy, setAutonomy] = useState<'low' | 'balanced' | 'high'>('balanced');
  const [topK, setTopK] = useState(6);
  const [maxTurns, setMaxTurns] = useState(18);

  const initialPanels = useMemo(() => {
    return PANEL_DEFS.reduce<Record<string, PanelState>>((acc, panel) => {
      acc[panel.id] = {
        prompt: '',
        loading: false,
        error: null,
        answer: null,
        qaNotes: [],
        telemetry: null,
      };
      return acc;
    }, {});
  }, []);

  const [panels, setPanels] = useState<Record<string, PanelState>>(initialPanels);

  const updatePanel = (panelId: string, changes: Partial<PanelState>) => {
    setPanels((prev) => ({
      ...prev,
      [panelId]: {
        ...prev[panelId],
        ...changes,
      },
    }));
  };

  const handleRunPanel = async (panelId: string, keyword: string) => {
    const panel = panels[panelId];
    updatePanel(panelId, { loading: true, error: null, answer: null, qaNotes: [], telemetry: null });
    try {
      const response = await runAgents({
        case_id: caseId,
        question: `${keyword}: ${panel.prompt || 'Provide a full playbook based on current case context.'}`,
        top_k: topK,
        autonomy_level: autonomy,
        max_turns: maxTurns,
      });
      updatePanel(panelId, {
        loading: false,
        answer: response.final_answer || 'No response returned by the swarm.',
        qaNotes: response.qa_notes || [],
        telemetry: response.telemetry || {},
      });
    } catch (err: any) {
      updatePanel(panelId, {
        loading: false,
        error: err?.message ?? 'Failed to run swarm',
      });
    }
  };

  return (
    <motion.section
      className="panel-shell trial-prep-hub"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <header className="trial-prep-header">
        <div>
          <h2>Trial Prep Command Panels</h2>
          <p className="panel-subtitle">
            Launch deposition, subpoena, discovery, and trial-prep swarms with shared case context.
          </p>
        </div>
        <div className="trial-prep-status">
          <span className="status-pill status-pill--pending">Auto Mode: {autonomy}</span>
        </div>
      </header>

      <div className="trial-prep-controls">
        <div className="field-group">
          <label htmlFor="trial-prep-case">Case ID</label>
          <input
            id="trial-prep-case"
            className="input-cinematic"
            value={caseId}
            onChange={(event) => setCaseId(event.target.value)}
          />
        </div>
        <div className="field-group">
          <label htmlFor="trial-prep-autonomy">Autonomy Level</label>
          <select
            id="trial-prep-autonomy"
            className="input-cinematic"
            value={autonomy}
            onChange={(event) => setAutonomy(event.target.value as 'low' | 'balanced' | 'high')}
          >
            {AUTONOMY_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field-group">
          <label htmlFor="trial-prep-topk">Context Depth (Top-K)</label>
          <input
            id="trial-prep-topk"
            type="number"
            min={1}
            max={20}
            className="input-cinematic"
            value={topK}
            onChange={(event) => setTopK(Number(event.target.value))}
          />
        </div>
        <div className="field-group">
          <label htmlFor="trial-prep-turns">Max Turns</label>
          <input
            id="trial-prep-turns"
            type="number"
            min={5}
            max={40}
            className="input-cinematic"
            value={maxTurns}
            onChange={(event) => setMaxTurns(Number(event.target.value))}
          />
        </div>
      </div>

      <div className="trial-prep-grid">
        {PANEL_DEFS.map((panel) => {
          const state = panels[panel.id];
          return (
            <div key={panel.id} className="trial-prep-panel halo-panel">
              <div className="trial-prep-panel__header">
                <div>
                  <p className="panel-eyebrow">{panel.pill}</p>
                  <h3>{panel.title}</h3>
                  <p>{panel.subtitle}</p>
                </div>
                <button
                  className="btn-cinematic"
                  onClick={() => handleRunPanel(panel.id, panel.keyword)}
                  disabled={state.loading}
                >
                  {state.loading ? 'Running...' : 'Run Swarm'}
                </button>
              </div>
              <textarea
                className="trial-prep-textarea"
                value={state.prompt}
                onChange={(event) => updatePanel(panel.id, { prompt: event.target.value })}
                placeholder={panel.placeholder}
              />
              {state.error && <p className="error-text">{state.error}</p>}
              {state.answer && (
                <div className="trial-prep-output">
                  <h4>Swarm Output</h4>
                  <p>{state.answer}</p>
                  {state.qaNotes.length > 0 && (
                    <div className="trial-prep-notes">
                      <h5>QA Notes</h5>
                      <ul>
                        {state.qaNotes.map((note, index) => (
                          <li key={index}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {state.telemetry && (
                    <div className="trial-prep-telemetry">
                      {(() => {
                        const turnRoles = state.telemetry?.['turn_roles'];
                        const status = state.telemetry?.['status'] ?? 'pending';
                        return (
                          <>
                            <span>
                              Turns: {Array.isArray(turnRoles) ? turnRoles.length : 'n/a'}
                            </span>
                            <span>Status: {String(status)}</span>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="trial-prep-footer">
        <div className="status-card">
          <h4>Manual Overrides & Phase Control</h4>
          <p>
            If you need to re-run ingestion, forensics, or timeline phases, jump into the Case
            Workflow Control Room or the CENTCOM war room for fine-grained orchestration.
          </p>
          <div className="trial-prep-links">
            <Link to="/workflow" className="btn-cinematic btn-secondary">
              Open Workflow Control
            </Link>
            <Link to="/centcom" className="btn-cinematic">
              Open CENTCOM
            </Link>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
