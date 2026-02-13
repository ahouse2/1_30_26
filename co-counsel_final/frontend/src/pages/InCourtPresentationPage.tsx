import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchFromApi, parseJsonResponse } from '@/apiClient';
import {
  addEvidenceItem,
  createEvidenceBinder,
  EvidenceBinder,
  EvidenceItem,
  listEvidenceBinders,
} from '@/services/evidence_binder_api';
import { exportPresentationBinder } from '@/services/presentation_api';
import { useSharedCaseId } from '@/hooks/useSharedCaseId';

interface Evidence {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'video' | 'my_documents' | 'opposition_documents';
  url: string;
}

interface Case {
  id: string;
}

const DEMO_CASES: Case[] = [
  { id: 'Case Alpha' },
  { id: 'Case Delta' },
  { id: 'Case Orion' },
];

const DEMO_EVIDENCE: Record<string, Evidence[]> = {
  'Case Alpha': [
    { id: 'alpha-1', name: 'Exhibit A - Surveillance Still', type: 'image', url: 'https://via.placeholder.com/1200x720.png?text=Exhibit+A' },
    { id: 'alpha-2', name: 'Exhibit B - Contract PDF', type: 'pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
  ],
  'Case Delta': [
    { id: 'delta-1', name: 'Exhibit D - Courtroom Clip', type: 'video', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm' },
  ],
  'Case Orion': [
    { id: 'orion-1', name: 'Exhibit O - Chain of Custody', type: 'my_documents', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
  ],
};

const DEMO_BINDERS: EvidenceBinder[] = [
  {
    id: 'demo-binder-1',
    name: 'Trial Binder - Alpha',
    description: 'Primary exhibits and demonstratives for Case Alpha.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: [],
  },
];

const NOTE_TEMPLATES = [
  'Foundation cue: establish custody + authenticity before publishing.',
  'Narrative cue: anchor this exhibit to timeline milestone and witness sequence.',
  'Objection prep: relevance + hearsay response with exhibit purpose framing.',
] as const;

const COURT_PHASES = ['Voir Dire', 'Direct', 'Cross', 'Redirect', 'Closing'] as const;
const PRESENTATION_CUE_STORAGE_KEY = 'co-counsel.presentation.cue.v1';

const isNonJsonResponse = (err: unknown) =>
  err instanceof Error && err.message.toLowerCase().includes('unexpected response');

const downloadText = (filename: string, contents: string) => {
  const blob = new Blob([contents], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

export default function InCourtPresentationPage() {
  const { caseId, setCaseId } = useSharedCaseId();
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  const [binders, setBinders] = useState<EvidenceBinder[]>([]);
  const [selectedBinderId, setSelectedBinderId] = useState<string | null>(null);
  const [binderName, setBinderName] = useState('');
  const [binderDescription, setBinderDescription] = useState('');
  const [binderError, setBinderError] = useState<string | null>(null);
  const [binderLoading, setBinderLoading] = useState(false);

  const [presentationMode, setPresentationMode] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [sessionStart] = useState(() => new Date());
  const [sessionNow, setSessionNow] = useState(() => new Date());
  const [presenterNote, setPresenterNote] = useState('');
  const [courtPhase, setCourtPhase] = useState<(typeof COURT_PHASES)[number]>('Direct');
  const [confidencePulse, setConfidencePulse] = useState(82);
  const [ingestedCue, setIngestedCue] = useState<{
    title: string;
    summary: string;
    citations: string[];
  } | null>(null);

  const selectedBinder = useMemo(
    () => binders.find((binder) => binder.id === selectedBinderId) ?? null,
    [binders, selectedBinderId]
  );

  const presentationQueue = useMemo(() => {
    return selectedBinder?.items ?? [];
  }, [selectedBinder]);

  const fetchCases = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const candidates = ['/api/cases', '/cases'];
      let data: Case[] | null = null;
      for (const path of candidates) {
        const response = await fetchFromApi(path);
        if (!response.ok) {
          continue;
        }
        data = await parseJsonResponse<Case[]>(response, 'Cases');
        break;
      }
      if (!data) {
        throw new Error('Failed to fetch cases from available endpoints.');
      }
      setCases(Array.isArray(data) ? data : []);
    } catch (err: any) {
      if (isNonJsonResponse(err)) {
        setDemoMode(true);
        setCases(DEMO_CASES);
        setSelectedCase(DEMO_CASES[0] ?? null);
        return;
      }
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvidence = async (caseId: string) => {
    if (demoMode) {
      setEvidence(DEMO_EVIDENCE[caseId] ?? []);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const encodedCaseId = encodeURIComponent(caseId);
      const candidates = [`/${encodedCaseId}/documents`, `/api/${encodedCaseId}/documents`];
      let data: Evidence[] | null = null;
      for (const path of candidates) {
        const response = await fetchFromApi(path);
        if (!response.ok) {
          continue;
        }
        data = await parseJsonResponse<Evidence[]>(response, 'Evidence');
        break;
      }
      if (!data) {
        throw new Error('Failed to fetch evidence from available endpoints.');
      }
      setEvidence(Array.isArray(data) ? data : []);
    } catch (err: any) {
      if (isNonJsonResponse(err)) {
        setDemoMode(true);
        setEvidence(DEMO_EVIDENCE[caseId] ?? []);
        return;
      }
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBinders = async () => {
    setBinderLoading(true);
    setBinderError(null);
    try {
      const data = await listEvidenceBinders();
      setBinders(Array.isArray(data) ? data : []);
      if (!selectedBinderId && data.length > 0) {
        setSelectedBinderId(data[0].id);
      }
    } catch (err: any) {
      setBinders(DEMO_BINDERS);
      setSelectedBinderId(DEMO_BINDERS[0].id);
      setBinderError(err?.message ?? 'Unable to load binders. Showing demo data.');
    } finally {
      setBinderLoading(false);
    }
  };

  const handleCreateBinder = async () => {
    if (!binderName.trim()) return;
    setBinderLoading(true);
    setBinderError(null);
    try {
      const created = await createEvidenceBinder({
        name: binderName.trim(),
        description: binderDescription.trim() || undefined,
      });
      setBinders((prev) => [...prev, created]);
      setSelectedBinderId(created.id);
      setBinderName('');
      setBinderDescription('');
    } catch (err: any) {
      setBinderError(err?.message ?? 'Unable to create binder.');
    } finally {
      setBinderLoading(false);
    }
  };

  const handleAddEvidence = async () => {
    if (!selectedBinder || !selectedEvidence) return;
    setBinderLoading(true);
    setBinderError(null);
    const item: EvidenceItem = {
      document_id: selectedEvidence.id,
      name: selectedEvidence.name,
      description: `Imported from ${selectedCase?.id ?? 'case'}`,
      added_at: new Date().toISOString(),
    };
    try {
      const updated = await addEvidenceItem(selectedBinder.id, item);
      setBinders((prev) => prev.map((binder) => (binder.id === updated.id ? updated : binder)));
    } catch (err: any) {
      setBinderError(err?.message ?? 'Unable to add exhibit to binder.');
    } finally {
      setBinderLoading(false);
    }
  };

  const handleExport = async (format: 'md' | 'html' | 'csv' | 'pdf' | 'xlsx') => {
    if (!selectedBinder) return;
    const items = selectedBinder.items;
    if (format === 'csv') {
      const content = ['document_id,name,description,added_at', ...items.map((item) => `${item.document_id},${item.name},${item.description ?? ''},${item.added_at}`)].join('\n');
      downloadText(`${selectedBinder.name.replace(/\s+/g, '_')}.csv`, content);
      return;
    }
    try {
      const response = await exportPresentationBinder({
        format,
        binder_id: selectedBinder.id,
        binder_name: selectedBinder.name,
        binder_description: selectedBinder.description ?? null,
        phase: courtPhase,
        presenter_notes: presenterNote || null,
        items: items.map((item) => ({
          document_id: item.document_id,
          name: item.name,
          description: item.description ?? null,
          added_at: item.added_at,
          citations: [],
        })),
      });
      const url = response.download_url.startsWith('http')
        ? response.download_url
        : `${window.location.origin}${response.download_url}`;
      window.open(url, '_blank');
    } catch (err) {
      setBinderError(err instanceof Error ? err.message : 'Presentation export failed');
    }
  };

  const appendPresenterTemplate = (template: string) => {
    setPresenterNote((prev) => (prev.trim() ? `${prev}\n\n${template}` : template));
  };

  const handleSaveNotes = () => {
    const title = selectedCase?.id ?? 'case';
    const body = presenterNote.trim() || 'No notes captured.';
    downloadText(`presenter-notes-${title.replace(/\s+/g, '_')}.md`, `# Presenter Notes\n\n${body}\n`);
  };

  const handleInjectNarrative = () => {
    const phase = courtPhase.toUpperCase();
    const selected = selectedEvidence?.name ?? 'current exhibit';
    appendPresenterTemplate(`[${phase}] Tie ${selected} to timeline milestone and witness sequence.`);
    setConfidencePulse((prev) => Math.min(prev + 3, 99));
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index || !selectedBinder) {
      setDragIndex(null);
      return;
    }
    const updatedItems = [...selectedBinder.items];
    const [moved] = updatedItems.splice(dragIndex, 1);
    updatedItems.splice(index, 0, moved);
    setBinders((prev) =>
      prev.map((binder) =>
        binder.id === selectedBinder.id ? { ...binder, items: updatedItems } : binder
      )
    );
    setDragIndex(null);
  };

  useEffect(() => {
    fetchCases();
    fetchBinders();
  }, []);

  useEffect(() => {
    if (selectedCase) {
      if (selectedCase.id !== caseId) {
        setCaseId(selectedCase.id);
      }
      fetchEvidence(selectedCase.id);
    }
  }, [caseId, selectedCase, setCaseId]);

  useEffect(() => {
    if (!caseId || cases.length === 0) return;
    const sharedCase = cases.find((item) => item.id === caseId);
    if (sharedCase && sharedCase.id !== selectedCase?.id) {
      setSelectedCase(sharedCase);
    }
  }, [caseId, cases, selectedCase?.id]);

  useEffect(() => {
    const timer = window.setInterval(() => setSessionNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      const rawCue = localStorage.getItem(PRESENTATION_CUE_STORAGE_KEY);
      if (!rawCue) return;
      const parsed = JSON.parse(rawCue) as {
        title?: string;
        summary?: string;
        citations?: string[];
      };
      if (!parsed?.title) return;
      setIngestedCue({
        title: parsed.title,
        summary: parsed.summary ?? '',
        citations: Array.isArray(parsed.citations) ? parsed.citations : [],
      });
      appendPresenterTemplate(
        `Timeline cue imported: ${parsed.title}\n${parsed.summary ?? ''}\nCitations: ${(parsed.citations ?? []).join(', ')}`
      );
      localStorage.removeItem(PRESENTATION_CUE_STORAGE_KEY);
      setConfidencePulse((prev) => Math.min(prev + 5, 99));
    } catch {
      // Ignore malformed cue payloads to keep presentation flow stable.
    }
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`panel-shell presentation-page ${presentationMode ? 'presentation-mode' : ''}`}
    >
      <header>
        <div>
          <h2>In-Court Presentation Studio</h2>
          <p className="panel-subtitle">Curate exhibits, build binders, and launch courtroom-ready playback.</p>
        </div>
        <div className="presentation-controls">
          <div className="presentation-phase-picker" role="group" aria-label="Court phase">
            {COURT_PHASES.map((phase) => (
              <button
                key={phase}
                type="button"
                className={`phase-chip ${courtPhase === phase ? 'active' : ''}`}
                onClick={() => setCourtPhase(phase)}
              >
                {phase}
              </button>
            ))}
          </div>
          <button className="btn-cinematic" onClick={() => setPresentationMode((prev) => !prev)}>
            {presentationMode ? 'Exit In-Court Mode' : 'Enter In-Court Mode'}
          </button>
          <button className="btn-cinematic btn-secondary">Sync Courtroom Displays</button>
        </div>
      </header>

      <section className="presentation-hud">
        <div className="presentation-hud__card">
          <span className="hud-label">Session Clock</span>
          <strong>{sessionNow.toLocaleTimeString()}</strong>
          <span className="hud-meta">Started {sessionStart.toLocaleTimeString()}</span>
        </div>
        <div className="presentation-hud__card">
          <span className="hud-label">Active Case</span>
          <strong>{selectedCase?.id ?? 'Awaiting case'}</strong>
          <span className="hud-meta">{demoMode ? 'Demo lineup' : 'Live case workspace'}</span>
        </div>
        <div className="presentation-hud__card">
          <span className="hud-label">Next Exhibit</span>
          <strong>{presentationQueue[0]?.name ?? 'Select a binder'}</strong>
          <span className="hud-meta">{presentationQueue.length} total exhibits</span>
        </div>
        <div className="presentation-hud__card">
          <span className="hud-label">Courtroom Mode</span>
          <strong>{presentationMode ? 'Live' : 'Prep'}</strong>
          <span className="hud-meta">Jury display {presentationMode ? 'armed' : 'standby'}</span>
        </div>
        <div className="presentation-hud__card">
          <span className="hud-label">Trial Phase</span>
          <strong>{courtPhase}</strong>
          <span className="hud-meta">Counsel confidence {confidencePulse}%</span>
        </div>
      </section>

      <div className="presentation-grid">
        <aside className="presentation-binders">
          <div className="presentation-card">
            <h3>Case Lineup</h3>
            {demoMode && (
              <p className="text-xs uppercase tracking-[0.4em] text-accent-gold mt-2">Demo cases</p>
            )}
            {isLoading && <p>Loading...</p>}
            {error && <p className="error-text">Error: {error}</p>}
            <ul className="presentation-binders__list">
              {cases.map((caseItem) => (
                <li
                  key={caseItem.id}
                  className={`presentation-binder ${selectedCase?.id === caseItem.id ? 'active' : ''}`}
                  onClick={() => setSelectedCase(caseItem)}
                >
                  <div>
                    <strong>{caseItem.id}</strong>
                    <span>Case workspace</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="presentation-card">
            <h3>Evidence Library</h3>
            {isLoading && <p>Loading...</p>}
            {error && <p className="error-text">Error: {error}</p>}
            <ul className="presentation-items">
              {evidence.map((item) => (
                <li
                  key={item.id}
                  className={`presentation-binder ${selectedEvidence?.id === item.id ? 'active' : ''}`}
                  onClick={() => setSelectedEvidence(item)}
                >
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.type.toUpperCase()}</span>
                  </div>
                </li>
              ))}
            </ul>
            <button
              className="btn-cinematic btn-secondary"
              onClick={handleAddEvidence}
              disabled={!selectedEvidence || !selectedBinder || binderLoading}
            >
              Add Selected Exhibit to Binder
            </button>
          </div>
        </aside>

        <section className="presentation-details">
          <div className="presentation-card">
            <h3>Presentation Binder</h3>
            {binderError && <p className="error-text">{binderError}</p>}
            {binderLoading && <p>Loading binders...</p>}
            <div className="presentation-binders__list">
              {binders.map((binder) => (
                <button
                  key={binder.id}
                  className={`presentation-binder ${selectedBinderId === binder.id ? 'active' : ''}`}
                  onClick={() => setSelectedBinderId(binder.id)}
                >
                  <div>
                    <strong>{binder.name}</strong>
                    <span>{binder.items.length} exhibits</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="presentation-create">
              <h4>Create Binder</h4>
              <input
                className="input-cinematic"
                placeholder="Binder name"
                value={binderName}
                onChange={(event) => setBinderName(event.target.value)}
              />
              <textarea
                className="input-cinematic"
                placeholder="Description"
                value={binderDescription}
                onChange={(event) => setBinderDescription(event.target.value)}
              />
              <button className="btn-cinematic" onClick={handleCreateBinder} disabled={binderLoading}>
                Create Binder
              </button>
            </div>
          </div>

          <div className="presentation-card">
            <h3>Exhibit Deck Order</h3>
            {selectedBinder ? (
              <ul className="presentation-items">
                {presentationQueue.map((item, index) => (
                  <li
                    key={`${item.document_id}-${index}`}
                    className="presentation-binder"
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDrop(index)}
                  >
                    <div>
                      <strong>Exhibit {index + 1}</strong>
                      <span>{item.name}</span>
                    </div>
                    <span className="status-pill status-pill--pending">Drag to reorder</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Select a binder to view its exhibit deck.</p>
            )}
            <div className="presentation-actions">
              <button className="btn-cinematic btn-secondary" onClick={() => void handleExport('md')} disabled={!selectedBinder}>
                Export MD
              </button>
              <button className="btn-cinematic btn-secondary" onClick={() => void handleExport('html')} disabled={!selectedBinder}>
                Export HTML
              </button>
              <button className="btn-cinematic btn-secondary" onClick={() => void handleExport('csv')} disabled={!selectedBinder}>
                Export CSV
              </button>
              <button className="btn-cinematic btn-secondary" onClick={() => void handleExport('xlsx')} disabled={!selectedBinder}>
                Export XLSX
              </button>
              <button className="btn-cinematic" onClick={() => void handleExport('pdf')} disabled={!selectedBinder}>
                Export PDF
              </button>
              <button className="btn-cinematic btn-secondary" disabled={!selectedBinder}>
                Launch Exhibit Deck
              </button>
            </div>
          </div>
        </section>
      </div>

      <div className="presentation-stage">
        <div className="presentation-stage__grid">
          <div className="document-viewer">
          <div className="document-viewer__header">
            <div>
              <p className="document-viewer__label">Live Exhibit Preview</p>
              <h3>{selectedEvidence?.name ?? 'Select an exhibit'}</h3>
            </div>
            <div className="document-viewer__actions">
              <button className="btn-cinematic btn-secondary" onClick={handleInjectNarrative}>
                Build Narrative Cue
              </button>
              <button className="btn-cinematic">Send to Jury Display</button>
            </div>
          </div>
          <div className="document-viewer__content">
            {selectedEvidence ? (
              <div className="presentation-preview">
                {selectedEvidence.type === 'image' && (
                  <img src={selectedEvidence.url} alt={selectedEvidence.name} />
                )}
                {selectedEvidence.type === 'pdf' && <iframe src={selectedEvidence.url} />}
                {selectedEvidence.type === 'video' && <video src={selectedEvidence.url} controls />}
                {(selectedEvidence.type === 'my_documents' || selectedEvidence.type === 'opposition_documents') && (
                  <iframe src={selectedEvidence.url} />
                )}
              </div>
            ) : (
              <div className="presentation-placeholder">Select a case and exhibit to present.</div>
            )}
          </div>
        </div>
          <aside className="presentation-stage__side">
            {ingestedCue && (
              <div className="presentation-card">
                <h3>Imported Timeline Cue</h3>
                <p className="forensics-report__summary">{ingestedCue.title}</p>
                <p className="panel-subtitle">{ingestedCue.summary}</p>
                {ingestedCue.citations.length > 0 && (
                  <p className="panel-subtitle">Citations: {ingestedCue.citations.join(', ')}</p>
                )}
              </div>
            )}
            <div className="presentation-card">
              <h3>Presenter Notes</h3>
              <div className="presentation-actions">
                {NOTE_TEMPLATES.map((template) => (
                  <button
                    key={template}
                    type="button"
                    className="btn-cinematic btn-secondary"
                    onClick={() => appendPresenterTemplate(template)}
                  >
                    Insert Cue
                  </button>
                ))}
              </div>
              <textarea
                className="input-cinematic presentation-notes"
                placeholder="Draft your oral cadence, key objections, and witness cues..."
                value={presenterNote}
                onChange={(event) => setPresenterNote(event.target.value)}
              />
              <div className="presentation-actions">
                <button className="btn-cinematic btn-secondary" onClick={handleSaveNotes}>
                  Save Notes
                </button>
                <button className="btn-cinematic">Push to Counsel Table</button>
              </div>
            </div>
            <div className="presentation-card">
              <h3>Courtroom Checklist</h3>
              <ul className="presentation-checklist">
                <li>Confirm jury display mirroring</li>
                <li>Verify exhibit audio levels</li>
                <li>Open objection response panel</li>
                <li>Sync with timeline narration cues</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </motion.section>
  );
}
