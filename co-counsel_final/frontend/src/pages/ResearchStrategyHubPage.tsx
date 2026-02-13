import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { runAgents } from '@/services/agents_api';
import { buildApiUrl } from '@/config';
import { useSharedCaseId } from '@/hooks/useSharedCaseId';

const AUTONOMY_LEVELS = [
  { value: 'low', label: 'Low Autonomy' },
  { value: 'balanced', label: 'Balanced Autonomy' },
  { value: 'high', label: 'High Autonomy' },
] as const;

const RETRIEVAL_MODES = [
  { value: 'precision', label: 'Precision' },
  { value: 'recall', label: 'Recall' },
] as const;

type PanelState = {
  prompt: string;
  loading: boolean;
  error: string | null;
  swarmAnswer: string | null;
  swarmNotes: string[];
  swarmCitations: Array<Record<string, unknown>>;
  indexAnswer: string | null;
  indexCitations: Array<Record<string, unknown>>;
  indexMeta: Record<string, unknown> | null;
  argumentMap: {
    title: string;
    position: string[];
    counter: string[];
    evidence: string[];
  };
};

type PanelKey = 'research' | 'theory' | 'strategy';

type IndexResponse = {
  answer: string;
  citations: Array<Record<string, unknown>>;
  meta?: Record<string, unknown>;
};

const PANEL_LABELS: Record<PanelKey, { title: string; subtitle: string; pill: string; placeholder: string }> = {
  research: {
    title: 'Legal Research Radar',
    subtitle: 'Run jurisdictional research, case law sweeps, and authority clustering.',
    pill: 'Authority Sweep',
    placeholder:
      'Example: Fraudulent conveyance, CA family code §2550, community property tracing, 2017-present.',
  },
  theory: {
    title: 'Legal Theory Forge',
    subtitle: 'Assemble claims, elements, and burden mapping tied to evidence.',
    pill: 'Theory Builder',
    placeholder:
      'Example: Breach of fiduciary duty, elements, supporting facts, and anticipated defenses.',
  },
  strategy: {
    title: 'Strategic Warbook',
    subtitle: 'Generate hearing strategies, negotiation posture, and tactical moves.',
    pill: 'Strategy Desk',
    placeholder:
      'Example: Upcoming OSC hearing, desired relief, judge tendencies, settlement posture.',
  },
};

const PANEL_ENDPOINTS: Record<PanelKey, string> = {
  research: '/query',
  theory: '/legal_theory',
  strategy: '/strategic_recommendations',
};

const DEFAULT_INDEX: Record<PanelKey, IndexResponse> = {
  research: {
    answer:
      'Offline demo: Recent authority highlights include persuasive holdings on tracing community assets and equitable remedies in contested dissolution matters.',
    citations: [{ label: 'Demo citation: Family Code §2550', source: 'demo' }],
  },
  theory: {
    answer:
      'Offline demo: Theory stack includes fiduciary breach, constructive trust, and accounting relief tied to undisclosed transfers.',
    citations: [{ label: 'Demo citation: In re Marriage of Feldman', source: 'demo' }],
  },
  strategy: {
    answer:
      'Offline demo: Strategy recommends early motion in limine, targeted subpoenas, and sequencing witnesses to control narrative pacing.',
    citations: [{ label: 'Demo citation: Local Rule 3.110', source: 'demo' }],
  },
};

const SIGNAL_STACK: Record<PanelKey, string[]> = {
  research: [
    'Top authorities surfaced from recent appellate holdings.',
    'Contradictory authority detected in at least one district.',
    'Potential expert report citations flagged for review.',
  ],
  theory: [
    'Elements map aligns to 5 key documents in the evidence set.',
    'Burden of proof shifts after initial tracing proof.',
    'Damages model supports alternative equitable remedies.',
  ],
  strategy: [
    'Primary hearing strategy: control narrative pacing.',
    'Counter-move identified for opposing affidavits.',
    'Witness sequencing optimized for credibility curve.',
  ],
};

const DEFAULT_ARGUMENT_MAP: Record<PanelKey, { title: string; position: string[]; counter: string[]; evidence: string[] }> = {
  research: {
    title: 'Authority Map',
    position: ['Leading case authority aligned with requested relief.'],
    counter: ['Opposition cites out-of-district authority with narrow applicability.'],
    evidence: ['Annotated statute history', 'Recent appellate ruling excerpts'],
  },
  theory: {
    title: 'Theory Map',
    position: ['Elements satisfied via fiduciary breach and concealment timeline.'],
    counter: ['Anticipated defense: consent or ratification.'],
    evidence: ['Bank transfer trail', 'Disclosure gaps in discovery log'],
  },
  strategy: {
    title: 'Strategy Map',
    position: ['Secure targeted TRO with asset freeze and expedited discovery.'],
    counter: ['Opposing counsel likely to push for continuance.'],
    evidence: ['Timeline risk banding', 'Forensic custody notes'],
  },
};

const splitSentences = (value: string | null | undefined): string[] => {
  if (!value) return [];
  return value
    .split(/(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};

const uniqueLines = (lines: string[], max: number): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const line of lines) {
    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(line);
    if (result.length >= max) break;
  }
  return result;
};

const deriveArgumentMap = (
  panel: PanelKey,
  swarmAnswer: string | null,
  swarmNotes: string[],
  swarmCitations: Array<Record<string, unknown>>,
  indexAnswer: string | null,
  indexCitations: Array<Record<string, unknown>>
) => {
  const fallback = DEFAULT_ARGUMENT_MAP[panel];
  const swarmLines = splitSentences(swarmAnswer);
  const indexLines = splitSentences(indexAnswer);

  const position = uniqueLines(
    [
      ...swarmLines,
      ...indexLines.filter((line) => /support|aligned|recommends|focus|theory|strategy|authority/i.test(line)),
    ],
    3
  );

  const counter = uniqueLines(
    [
      ...swarmNotes.filter((line) => /counter|risk|contradict|oppos|weak|challenge/i.test(line)),
      ...indexLines.filter((line) => /counter|risk|contradict|oppos|weak|challenge|however|but/i.test(line)),
      ...swarmLines.filter((line) => /counter|risk|contradict|oppos|weak|challenge|however|but/i.test(line)),
    ],
    3
  );

  const evidencePool = [...swarmCitations, ...indexCitations].map((citation) => normalizeCitation(citation).label);
  const evidence = uniqueLines(evidencePool, 4);

  return {
    title: fallback.title,
    position: position.length > 0 ? position : fallback.position,
    counter: counter.length > 0 ? counter : fallback.counter,
    evidence: evidence.length > 0 ? evidence : fallback.evidence,
  };
};

const normalizeCitation = (citation: Record<string, unknown>) => {
  const label =
    (citation.label as string | undefined) ||
    (citation.title as string | undefined) ||
    (citation.doc_id as string | undefined) ||
    (citation.document_id as string | undefined) ||
    'Untitled citation';
  const source =
    (citation.source as string | undefined) ||
    (citation.source_type as string | undefined) ||
    (citation.provider as string | undefined);
  const url = citation.url as string | undefined;
  const confidence =
    typeof citation.confidence === 'number'
      ? `${Math.round((citation.confidence as number) * 100)}%`
      : undefined;
  return { label, source, url, confidence };
};

const buildPanelBrief = (panelTitle: string, state: PanelState) => {
  const lines = [
    `# ${panelTitle}`,
    '',
    '## Swarm Output',
    state.swarmAnswer ?? 'No swarm output.',
    '',
    '## Index Result',
    state.indexAnswer ?? 'No index output.',
    '',
    `## ${state.argumentMap.title}`,
    '',
    '### Position',
    ...state.argumentMap.position.map((item) => `- ${item}`),
    '',
    '### Counter',
    ...state.argumentMap.counter.map((item) => `- ${item}`),
    '',
    '### Evidence',
    ...state.argumentMap.evidence.map((item) => `- ${item}`),
  ];
  return lines.join('\n');
};

export default function ResearchStrategyHubPage() {
  const { caseId, setCaseId } = useSharedCaseId();
  const [jurisdiction, setJurisdiction] = useState('CA - Los Angeles');
  const [matterType, setMatterType] = useState('Civil / Family Law');
  const [autonomy, setAutonomy] = useState<'low' | 'balanced' | 'high'>('balanced');
  const [topK, setTopK] = useState(8);
  const [maxTurns, setMaxTurns] = useState(20);
  const [retrievalMode, setRetrievalMode] = useState<'precision' | 'recall'>('precision');

  const initialPanels = useMemo(() => {
    return (Object.keys(PANEL_LABELS) as PanelKey[]).reduce<Record<PanelKey, PanelState>>(
      (acc, key) => {
        acc[key] = {
          prompt: '',
          loading: false,
          error: null,
          swarmAnswer: null,
          swarmNotes: [],
          swarmCitations: [],
          indexAnswer: null,
          indexCitations: [],
          indexMeta: null,
          argumentMap: DEFAULT_ARGUMENT_MAP[key],
        };
        return acc;
      },
      {} as Record<PanelKey, PanelState>
    );
  }, []);

  const [panels, setPanels] = useState<Record<PanelKey, PanelState>>(initialPanels);
  const [copiedPanel, setCopiedPanel] = useState<PanelKey | null>(null);

  const updatePanel = (panel: PanelKey, changes: Partial<PanelState>) => {
    setPanels((prev) => ({
      ...prev,
      [panel]: {
        ...prev[panel],
        ...changes,
      },
    }));
  };

  const copyPanelBrief = async (panelKey: PanelKey) => {
    const panelState = panels[panelKey];
    const title = PANEL_LABELS[panelKey].title;
    const payload = buildPanelBrief(title, panelState);
    try {
      await navigator.clipboard.writeText(payload);
      setCopiedPanel(panelKey);
      setTimeout(() => setCopiedPanel((current) => (current === panelKey ? null : current)), 1400);
    } catch {
      setCopiedPanel(null);
    }
  };

  const handleRunSwarm = async (panel: PanelKey, keyword: string) => {
    updatePanel(panel, { loading: true, error: null, swarmAnswer: null, swarmNotes: [], swarmCitations: [] });
    try {
      const response = await runAgents({
        case_id: caseId,
        question: `${keyword}: ${panels[panel].prompt || 'Provide a full strategic brief based on current case context.'}`,
        top_k: topK,
        autonomy_level: autonomy,
        max_turns: maxTurns,
      });
      updatePanel(panel, {
        loading: false,
        swarmAnswer: response.final_answer || 'No response returned by the swarm.',
        swarmNotes: response.qa_notes || [],
        swarmCitations: response.citations || [],
        argumentMap: deriveArgumentMap(
          panel,
          response.final_answer || null,
          response.qa_notes || [],
          response.citations || [],
          panels[panel].indexAnswer,
          panels[panel].indexCitations
        ),
      });
    } catch (err: any) {
      updatePanel(panel, {
        loading: false,
        error: err?.message ?? 'Failed to run swarm.',
      });
    }
  };

  const handleRunIndex = async (panel: PanelKey) => {
    updatePanel(panel, { loading: true, error: null, indexAnswer: null, indexCitations: [], indexMeta: null });
    const endpoint = PANEL_ENDPOINTS[panel];
    try {
      const response = await fetch(
        buildApiUrl(`${endpoint}?query=${encodeURIComponent(panels[panel].prompt)}&mode=${retrievalMode}`)
      );
      if (!response.ok) {
        throw new Error(`Index query failed: ${response.statusText}`);
      }
      const data = (await response.json()) as IndexResponse;
      updatePanel(panel, {
        loading: false,
        indexAnswer: data.answer,
        indexCitations: data.citations || [],
        indexMeta: data.meta || {},
        argumentMap: deriveArgumentMap(
          panel,
          panels[panel].swarmAnswer,
          panels[panel].swarmNotes,
          panels[panel].swarmCitations,
          data.answer,
          data.citations || []
        ),
      });
    } catch (err: any) {
      const fallback = DEFAULT_INDEX[panel];
      updatePanel(panel, {
        loading: false,
        error: err?.message ?? 'Index query failed; showing offline demo.',
        indexAnswer: fallback.answer,
        indexCitations: fallback.citations,
        indexMeta: fallback.meta || {},
        argumentMap: deriveArgumentMap(
          panel,
          panels[panel].swarmAnswer,
          panels[panel].swarmNotes,
          panels[panel].swarmCitations,
          fallback.answer,
          fallback.citations
        ),
      });
    }
  };

  return (
    <motion.section
      className="panel-shell research-hub"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <header className="research-header">
        <div>
          <h2>Research & Strategy Command Hub</h2>
          <p className="panel-subtitle">
            Build authoritative legal research, theory stacks, and tactical recommendations with full swarm coverage.
          </p>
        </div>
        <div className="research-status">
          <span className="status-pill status-pill--pending">Autonomy: {autonomy}</span>
          <span className="status-pill status-pill--served">Index Mode: {retrievalMode}</span>
        </div>
      </header>

      <div className="research-controls">
        <div className="field-group">
          <label htmlFor="research-case-id">Case ID</label>
          <input
            id="research-case-id"
            className="input-cinematic"
            value={caseId}
            onChange={(event) => setCaseId(event.target.value)}
          />
        </div>
        <div className="field-group">
          <label htmlFor="research-jurisdiction">Jurisdiction</label>
          <input
            id="research-jurisdiction"
            className="input-cinematic"
            value={jurisdiction}
            onChange={(event) => setJurisdiction(event.target.value)}
          />
        </div>
        <div className="field-group">
          <label htmlFor="research-matter">Matter Type</label>
          <input
            id="research-matter"
            className="input-cinematic"
            value={matterType}
            onChange={(event) => setMatterType(event.target.value)}
          />
        </div>
        <div className="field-group">
          <label htmlFor="research-autonomy">Autonomy Level</label>
          <select
            id="research-autonomy"
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
          <label htmlFor="research-topk">Context Depth (Top-K)</label>
          <input
            id="research-topk"
            type="number"
            min={1}
            max={20}
            className="input-cinematic"
            value={topK}
            onChange={(event) => setTopK(Number(event.target.value))}
          />
        </div>
        <div className="field-group">
          <label htmlFor="research-turns">Max Turns</label>
          <input
            id="research-turns"
            type="number"
            min={5}
            max={40}
            className="input-cinematic"
            value={maxTurns}
            onChange={(event) => setMaxTurns(Number(event.target.value))}
          />
        </div>
        <div className="field-group">
          <label htmlFor="research-mode">Index Mode</label>
          <select
            id="research-mode"
            className="input-cinematic"
            value={retrievalMode}
            onChange={(event) => setRetrievalMode(event.target.value as 'precision' | 'recall')}
          >
            {RETRIEVAL_MODES.map((mode) => (
              <option key={mode.value} value={mode.value}>
                {mode.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="research-grid">
        {(Object.keys(PANEL_LABELS) as PanelKey[]).map((panelKey) => {
          const panel = PANEL_LABELS[panelKey];
          const state = panels[panelKey];
          return (
            <div key={panelKey} className="research-panel halo-panel">
              <div className="research-panel__header">
                <div>
                  <p className="panel-eyebrow">{panel.pill}</p>
                  <h3>{panel.title}</h3>
                  <p>{panel.subtitle}</p>
                </div>
                <div className="research-panel__actions">
                  <button
                    className="btn-cinematic"
                    onClick={() => handleRunSwarm(panelKey, panelKey)}
                    disabled={state.loading}
                  >
                    {state.loading ? 'Running...' : 'Run Swarm'}
                  </button>
                  <button
                    className="btn-cinematic btn-secondary"
                    onClick={() => handleRunIndex(panelKey)}
                    disabled={state.loading}
                  >
                    Query Index
                  </button>
                </div>
              </div>
              <textarea
                className="research-textarea"
                value={state.prompt}
                onChange={(event) => updatePanel(panelKey, { prompt: event.target.value })}
                placeholder={panel.placeholder}
              />
              {state.error && <p className="error-text">{state.error}</p>}

              {(state.swarmAnswer || state.indexAnswer) && (
                <div className="research-output">
                  {state.swarmAnswer && (
                    <div className="research-output__block">
                      <h4>Swarm Output</h4>
                      <p>{state.swarmAnswer}</p>
                      <div className="research-output__signals">
                        <h5>Signal Stack</h5>
                        <ul>
                          {SIGNAL_STACK[panelKey].map((signal) => (
                            <li key={signal}>{signal}</li>
                          ))}
                        </ul>
                      </div>
                      {state.swarmNotes.length > 0 && (
                        <div className="research-output__notes">
                          <h5>QA Notes</h5>
                          <ul>
                            {state.swarmNotes.map((note, index) => (
                              <li key={index}>{note}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {state.swarmCitations.length > 0 && (
                        <div className="research-output__citations">
                          <h5>Citations</h5>
                          <div className="citation-chip-grid">
                            {state.swarmCitations.map((citation, index) => {
                              const normalized = normalizeCitation(citation);
                              return (
                                <article key={`swarm-${index}`} className="citation-chip">
                                  <strong>{normalized.label}</strong>
                                  {normalized.source && <span>{normalized.source}</span>}
                                  {normalized.confidence && <span>{normalized.confidence}</span>}
                                  {normalized.url && (
                                    <a href={normalized.url} target="_blank" rel="noopener noreferrer">
                                      Open
                                    </a>
                                  )}
                                </article>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {state.indexAnswer && (
                    <div className="research-output__block">
                      <h4>Index Result</h4>
                      <p>{state.indexAnswer}</p>
                      {state.indexCitations.length > 0 && (
                        <div className="research-output__citations">
                          <h5>Citations</h5>
                          <div className="citation-chip-grid">
                            {state.indexCitations.map((citation, index) => {
                              const normalized = normalizeCitation(citation);
                              return (
                                <article key={`index-${index}`} className="citation-chip">
                                  <strong>{normalized.label}</strong>
                                  {normalized.source && <span>{normalized.source}</span>}
                                  {normalized.confidence && <span>{normalized.confidence}</span>}
                                  {normalized.url && (
                                    <a href={normalized.url} target="_blank" rel="noopener noreferrer">
                                      Open
                                    </a>
                                  )}
                                </article>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="research-argument-map">
                    <div className="research-output__actions">
                      <h4>{state.argumentMap.title}</h4>
                      <div className="research-inline-actions">
                        <button
                          type="button"
                          className="btn-cinematic btn-secondary"
                          onClick={() =>
                            updatePanel(panelKey, {
                              argumentMap: deriveArgumentMap(
                                panelKey,
                                state.swarmAnswer,
                                state.swarmNotes,
                                state.swarmCitations,
                                state.indexAnswer,
                                state.indexCitations
                              ),
                            })
                          }
                        >
                          Refresh Map
                        </button>
                        <button
                          type="button"
                          className="btn-cinematic btn-secondary"
                          onClick={() => void copyPanelBrief(panelKey)}
                        >
                          {copiedPanel === panelKey ? 'Copied' : 'Copy Brief'}
                        </button>
                      </div>
                    </div>
                    <div className="argument-map-grid">
                      <div>
                        <span className="argument-label">Position</span>
                        <ul>
                          {state.argumentMap.position.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="argument-label">Counter</span>
                        <ul>
                          {state.argumentMap.counter.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="argument-label">Evidence</span>
                        <ul>
                          {state.argumentMap.evidence.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="research-summary">
        <div>
          <h3>Mission Briefing</h3>
          <p>
            Case {caseId} — {matterType} ({jurisdiction}). Use the swarm outputs above to feed timeline,
            strategy, and presentation modules. Manual triggers remain available for every phase.
          </p>
        </div>
        <div className="research-summary__actions">
          <button className="btn-cinematic btn-secondary">Send to Timeline</button>
          <button className="btn-cinematic">Send to Trial Prep</button>
        </div>
      </div>
    </motion.section>
  );
}
