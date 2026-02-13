import { useEffect, useMemo, useState } from 'react';
import { EvidenceModal } from '@/components/EvidenceModal';
import { DocumentViewerPanel } from '@/components/DocumentViewerPanel';
import { useQueryContext } from '@/context/QueryContext';
import {
  Citation,
  EntityHighlight,
  OutcomeProbability,
  RelationTag,
  TimelineEvent,
  TimelineExportFormat,
  StoryboardScene,
  TimelineMediaHook,
} from '@/types';
import { exportTimeline, fetchStoryboard, fetchTimelineMediaHooks } from '@/utils/apiClient';

const NOTE_STORAGE_KEY = 'timeline-notes-v1';
const PIN_STORAGE_KEY = 'timeline-pins-v1';
const PRESENTATION_CUE_STORAGE_KEY = 'co-counsel.presentation.cue.v1';

type InspectorTab = 'details' | 'citations' | 'notes';

type TimelineNotes = Record<string, string>;

type TimelinePins = Record<string, boolean>;

export function TimelineView(): JSX.Element {
  const {
    timelineEvents,
    timelineMeta,
    timelineLoading,
    loadMoreTimeline,
    refreshTimelineOnDemand,
    timelineEntityFilter,
    setTimelineEntityFilter,
    timelineTopicFilter,
    setTimelineTopicFilter,
    timelineSourceFilter,
    setTimelineSourceFilter,
    timelineRiskBand,
    setTimelineRiskBand,
    timelineDeadline,
    setTimelineDeadline,
    citations,
    setActiveCitation,
  } = useQueryContext();
  const [activeIndex, setActiveIndex] = useState(0);
  const [expandedEvent, setExpandedEvent] = useState<TimelineEvent | null>(null);
  const [storyboardMode, setStoryboardMode] = useState(false);
  const [storyboard, setStoryboard] = useState<StoryboardScene[]>([]);
  const [storyboardIndex, setStoryboardIndex] = useState(0);
  const [storyboardLoading, setStoryboardLoading] = useState(false);
  const [storyboardError, setStoryboardError] = useState<string | null>(null);
  const [mediaHooks, setMediaHooks] = useState<TimelineMediaHook[]>([]);
  const [mediaHooksLoading, setMediaHooksLoading] = useState(false);
  const [mediaHooksError, setMediaHooksError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<TimelineExportFormat | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('details');
  const [notes, setNotes] = useState<TimelineNotes>({});
  const [pins, setPins] = useState<TimelinePins>({});
  const grouped = useMemo(() => groupByDay(timelineEvents), [timelineEvents]);

  const activeEvent = timelineEvents[activeIndex] ?? null;

  const stats = useMemo(() => {
    const total = timelineEvents.length;
    const highRisk = timelineEvents.filter((event) => event.risk_band === 'high').length;
    const deadlines = timelineEvents
      .map((event) => event.motion_deadline)
      .filter((value): value is string => Boolean(value))
      .map((value) => new Date(value))
      .filter((value) => !Number.isNaN(value.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());
    const nextDeadline = deadlines[0];
    return {
      total,
      highRisk,
      nextDeadline: nextDeadline ? nextDeadline.toLocaleDateString() : '—',
    };
  }, [timelineEvents]);

  const activeFilters = useMemo(() => {
    const entries: Array<{ key: string; label: string; clear: () => void }> = [];
    if (timelineEntityFilter) {
      entries.push({
        key: 'entity',
        label: `Entity: ${timelineEntityFilter}`,
        clear: () => setTimelineEntityFilter(null),
      });
    }
    if (timelineTopicFilter) {
      entries.push({
        key: 'topic',
        label: `Topic: ${timelineTopicFilter}`,
        clear: () => setTimelineTopicFilter(null),
      });
    }
    if (timelineSourceFilter) {
      entries.push({
        key: 'source',
        label: `Source: ${timelineSourceFilter}`,
        clear: () => setTimelineSourceFilter(null),
      });
    }
    if (timelineRiskBand) {
      entries.push({
        key: 'risk',
        label: `Risk: ${timelineRiskBand}`,
        clear: () => setTimelineRiskBand(null),
      });
    }
    if (timelineDeadline) {
      entries.push({
        key: 'deadline',
        label: `Deadline <= ${timelineDeadline.slice(0, 10)}`,
        clear: () => setTimelineDeadline(null),
      });
    }
    return entries;
  }, [
    timelineEntityFilter,
    timelineTopicFilter,
    timelineSourceFilter,
    timelineRiskBand,
    timelineDeadline,
    setTimelineEntityFilter,
    setTimelineTopicFilter,
    setTimelineSourceFilter,
    setTimelineRiskBand,
    setTimelineDeadline,
  ]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(NOTE_STORAGE_KEY);
      if (stored) {
        setNotes(JSON.parse(stored));
      }
      const storedPins = localStorage.getItem(PIN_STORAGE_KEY);
      if (storedPins) {
        setPins(JSON.parse(storedPins));
      }
    } catch (error) {
      console.warn('Failed to load timeline notes', error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(NOTE_STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(pins));
  }, [pins]);

  useEffect((): (() => void) => {
    const handler = (event: KeyboardEvent): void => {
      if (event.key === 'n') {
        event.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, timelineEvents.length - 1));
      }
      if (event.key === 'p') {
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
      }
    };
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [timelineEvents.length]);

  useEffect((): void => {
    if (activeIndex >= timelineEvents.length) {
      setActiveIndex(Math.max(timelineEvents.length - 1, 0));
    }
  }, [timelineEvents, activeIndex]);

  useEffect(() => {
    const handler = (event: Event): void => {
      const detail = (event as CustomEvent<string>).detail;
      if (!detail) return;
      const index = timelineEvents.findIndex((item) => item.id === detail);
      if (index >= 0) {
        setActiveIndex(index);
        requestAnimationFrame(() => {
          const target = document.querySelector<HTMLElement>(`[data-timeline-id="${detail}"]`);
          target?.focus({ preventScroll: false });
        });
      }
    };
    window.addEventListener('focus-timeline-event', handler as EventListener);
    return () => {
      window.removeEventListener('focus-timeline-event', handler as EventListener);
    };
  }, [timelineEvents]);

  useEffect(() => {
    if (!storyboardMode) return;
    let active = true;
    setStoryboardLoading(true);
    setStoryboardError(null);
    fetchStoryboard({
      entity: timelineEntityFilter,
      topic: timelineTopicFilter,
      source: timelineSourceFilter,
      risk_band: timelineRiskBand,
      limit: 50,
    })
      .then((response) => {
        if (!active) return;
        setStoryboard(response.scenes);
        setStoryboardIndex(0);
      })
      .catch((err: Error) => {
        if (!active) return;
        setStoryboardError(err.message);
      })
      .finally(() => {
        if (!active) return;
        setStoryboardLoading(false);
      });
    return () => {
      active = false;
    };
  }, [storyboardMode, timelineEntityFilter, timelineTopicFilter, timelineSourceFilter, timelineRiskBand]);

  const handleExport = async (format: TimelineExportFormat): Promise<void> => {
    try {
      setExportError(null);
      setExporting(format);
      const response = await exportTimeline({
        format,
        entity: timelineEntityFilter,
        topic: timelineTopicFilter,
        source: timelineSourceFilter,
        risk_band: timelineRiskBand,
        motion_due_before: timelineDeadline ?? null,
        storyboard: storyboardMode,
      });
      const url = response.download_url.startsWith('http')
        ? response.download_url
        : `${window.location.origin}${response.download_url}`;
      window.open(url, '_blank');
    } catch (err: any) {
      setExportError(err.message ?? 'Export failed');
    } finally {
      setExporting(null);
    }
  };

  const handleExportStoryboardWeb = async (): Promise<void> => {
    try {
      setExportError(null);
      setExporting('html');
      const response = await exportTimeline({
        format: 'html',
        entity: timelineEntityFilter,
        topic: timelineTopicFilter,
        source: timelineSourceFilter,
        risk_band: timelineRiskBand,
        motion_due_before: timelineDeadline ?? null,
        storyboard: true,
      });
      const url = response.download_url.startsWith('http')
        ? response.download_url
        : `${window.location.origin}${response.download_url}`;
      window.open(url, '_blank');
    } catch (err: any) {
      setExportError(err.message ?? 'Storyboard web export failed');
    } finally {
      setExporting(null);
    }
  };

  const handleGenerateMediaHooks = async (): Promise<void> => {
    try {
      setMediaHooksError(null);
      setMediaHooksLoading(true);
      const response = await fetchTimelineMediaHooks({
        entity: timelineEntityFilter,
        topic: timelineTopicFilter,
        source: timelineSourceFilter,
        risk_band: timelineRiskBand,
        limit: 20,
      });
      setMediaHooks(response.hooks ?? []);
    } catch (err: any) {
      setMediaHooksError(err.message ?? 'Failed to generate media hooks');
      setMediaHooks([]);
    } finally {
      setMediaHooksLoading(false);
    }
  };

  const handleCitationLink = (docId: string): void => {
    const match = citations.find((citation) => citation.docId === docId);
    if (match) {
      setActiveCitation(match);
    } else {
      const fallback: Citation = {
        docId,
        span: 'Details not yet available for this document. Check the source repository.',
      };
      setActiveCitation(fallback);
    }
    setInspectorTab('citations');
  };

  const togglePin = (eventId: string): void => {
    setPins((prev) => ({ ...prev, [eventId]: !prev[eventId] }));
  };

  const sendToPresentationStudio = (): void => {
    if (!activeEvent) return;
    const cuePayload = {
      event_id: activeEvent.id,
      title: activeEvent.title,
      summary: activeEvent.summary,
      timestamp: activeEvent.ts,
      citations: activeEvent.citations,
      risk_band: activeEvent.risk_band ?? null,
      captured_at: new Date().toISOString(),
    };
    localStorage.setItem(PRESENTATION_CUE_STORAGE_KEY, JSON.stringify(cuePayload));
    window.location.assign('/in-court-presentation');
  };

  const updateNote = (eventId: string, value: string): void => {
    setNotes((prev) => ({ ...prev, [eventId]: value }));
  };

  const activeNote = activeEvent ? notes[activeEvent.id] ?? '' : '';

  const storyboardScene = storyboard[storyboardIndex];
  const storyboardReady = storyboardMode ? !storyboardLoading && storyboard.length > 0 : true;

  return (
    <div className="timeline-builder">
      <header className="timeline-shell__header">
        <div>
          <h2>Case Timeline Intelligence</h2>
          <p className="panel-subtitle">
            Graph-enriched events with citations, risk signals, and motion deadlines.
          </p>
        </div>
        <div className="timeline-header__actions">
          <button type="button" className="timeline-btn" onClick={() => void refreshTimelineOnDemand()}>
            Refresh Timeline
          </button>
          <button
            type="button"
            className={`timeline-btn timeline-btn--primary${storyboardMode ? ' active' : ''}`}
            onClick={() => setStoryboardMode((value) => !value)}
          >
            {storyboardMode ? 'Exit Story Mode' : 'Story Mode'}
          </button>
        </div>
      </header>

      <section className="timeline-shell__filters">
        <div className="timeline-filter-group">
          <label htmlFor="timeline-entity">Entity or name</label>
          <input
            id="timeline-entity"
            type="search"
            placeholder="Filter by entity or label"
            value={timelineEntityFilter ?? ''}
            onChange={(event) => setTimelineEntityFilter(event.target.value || null)}
          />
        </div>
        <div className="timeline-filter-group">
          <label htmlFor="timeline-topic">Topic or subject</label>
          <input
            id="timeline-topic"
            type="search"
            placeholder="Topic, issue, or theme"
            value={timelineTopicFilter ?? ''}
            onChange={(event) => setTimelineTopicFilter(event.target.value || null)}
          />
        </div>
        <div className="timeline-filter-group">
          <label htmlFor="timeline-source">Evidence source</label>
          <select
            id="timeline-source"
            value={timelineSourceFilter ?? ''}
            onChange={(event) => setTimelineSourceFilter(event.target.value || null)}
          >
            <option value="">All sources</option>
            <option value="my_documents">My documents</option>
            <option value="opposition_documents">Opposition documents</option>
            <option value="forensics">Forensics</option>
            <option value="email">Email</option>
            <option value="cloud">Cloud drive</option>
            <option value="web">Web</option>
          </select>
        </div>
        <div className="timeline-filter-group">
          <label htmlFor="timeline-risk">Risk band</label>
          <select
            id="timeline-risk"
            value={timelineRiskBand ?? ''}
            onChange={(event) =>
              setTimelineRiskBand(event.target.value ? (event.target.value as 'low' | 'medium' | 'high') : null)
            }
          >
            <option value="">All risk levels</option>
            <option value="high">High risk</option>
            <option value="medium">Medium risk</option>
            <option value="low">Low risk</option>
          </select>
        </div>
        <div className="timeline-filter-group">
          <label htmlFor="timeline-deadline">Motion deadline</label>
          <input
            id="timeline-deadline"
            type="date"
            value={timelineDeadline?.slice(0, 10) ?? ''}
            onChange={(event) => {
              const value = event.target.value;
              setTimelineDeadline(value ? `${value}T23:59:59` : null);
            }}
          />
        </div>
        {timelineDeadline && (
          <button type="button" className="timeline-filter-clear" onClick={() => setTimelineDeadline(null)}>
            Clear deadline
          </button>
        )}
        {(timelineEntityFilter || timelineTopicFilter || timelineSourceFilter || timelineRiskBand || timelineDeadline) && (
          <button
            type="button"
            className="timeline-filter-clear"
            onClick={() => {
              setTimelineEntityFilter(null);
              setTimelineTopicFilter(null);
              setTimelineSourceFilter(null);
              setTimelineRiskBand(null);
              setTimelineDeadline(null);
            }}
          >
            Clear filters
          </button>
        )}
      </section>

      {activeFilters.length > 0 && (
        <section className="timeline-shell__active-filters" aria-label="Active timeline filters">
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              className="timeline-filter-chip"
              onClick={filter.clear}
              title="Click to clear this filter"
            >
              {filter.label} ×
            </button>
          ))}
        </section>
      )}

      <section className="timeline-shell__stats">
        <article>
          <span>Total Events</span>
          <strong>{stats.total}</strong>
        </article>
        <article>
          <span>High Risk</span>
          <strong>{stats.highRisk}</strong>
        </article>
        <article>
          <span>Next Deadline</span>
          <strong>{stats.nextDeadline}</strong>
        </article>
        <article>
          <span>Cursor</span>
          <strong>{timelineMeta?.has_more ? 'More available' : 'Complete'}</strong>
        </article>
      </section>

      <div className="timeline-shell__content">
        <section className="timeline-rail" aria-label="Timeline rail">
          <div className="timeline-summary" role="status" aria-live="polite">
            Rendering {timelineEvents.length} events {timelineMeta?.has_more ? 'with more available' : ''}
          </div>

          {!storyboardMode && (
            <ol className="timeline-groups" aria-live="polite" id="timeline">
              {grouped.map(({ day, events }) => (
                <li key={day}>
                  <h3>{day}</h3>
                  <ul>
                    {events.map((event) => (
                      <TimelineCard
                        key={event.id}
                        event={event}
                        active={timelineEvents.indexOf(event) === activeIndex}
                        pinned={Boolean(pins[event.id])}
                        onFocus={() => setActiveIndex(timelineEvents.indexOf(event))}
                        onExpand={() => setExpandedEvent(event)}
                        onCitationLink={handleCitationLink}
                        onTogglePin={() => togglePin(event.id)}
                      />
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          )}

          {storyboardMode && (
            <section className="timeline-storyboard" aria-live="polite">
              <header className="timeline-storyboard__header">
                <div>
                  <h3>Storyboard</h3>
                  <p className="panel-subtitle">Narrative flow built from timeline events.</p>
                </div>
                <div className="timeline-storyboard__controls">
                  <button
                    type="button"
                    className="timeline-btn"
                    onClick={() => setStoryboardIndex((value) => Math.max(0, value - 1))}
                    disabled={storyboardIndex === 0}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="timeline-btn"
                    onClick={() =>
                      setStoryboardIndex((value) => Math.min(storyboard.length - 1, value + 1))
                    }
                    disabled={storyboardIndex >= storyboard.length - 1}
                  >
                    Next
                  </button>
                </div>
              </header>
              {storyboardLoading && <p>Generating storyboard…</p>}
              {storyboardError && <p className="error-text">{storyboardError}</p>}
              {!storyboardLoading && !storyboardError && storyboard.length === 0 && (
                <p>No storyboard scenes available.</p>
              )}
              {!storyboardLoading && !storyboardError && storyboardScene && (
                <article className="storyboard-scene" key={storyboardScene.id}>
                  <h4>{storyboardScene.title}</h4>
                  <p>{storyboardScene.narrative}</p>
                  {storyboardScene.visual_prompt && (
                    <p className="storyboard-visual">Visual idea: {storyboardScene.visual_prompt}</p>
                  )}
                  {storyboardScene.citations.length > 0 && (
                    <div className="storyboard-citations">
                      {storyboardScene.citations.map((docId) => (
                        <button key={`${storyboardScene.id}-${docId}`} type="button" onClick={() => handleCitationLink(docId)}>
                          {docId}
                        </button>
                      ))}
                    </div>
                  )}
                </article>
              )}
              <div className="timeline-storyboard__rail">
                {storyboard.map((scene, index) => (
                  <button
                    key={`${scene.id}-${index}`}
                    type="button"
                    className={index === storyboardIndex ? 'active' : ''}
                    onClick={() => setStoryboardIndex(index)}
                  >
                    {scene.title}
                  </button>
                ))}
              </div>
            </section>
          )}

          <div className="timeline-actions">
            <button
              type="button"
              onClick={() => void loadMoreTimeline()}
              disabled={!timelineMeta?.has_more || timelineLoading}
              className="timeline-btn"
            >
              {timelineLoading ? 'Loading…' : timelineMeta?.has_more ? 'Load more events' : 'No more events'}
            </button>
          </div>
        </section>

        <aside className="timeline-inspector" aria-label="Timeline inspector">
          <header>
            <div>
              <h3>Event Inspector</h3>
              <p className="panel-subtitle">Focused evidence + strategy details.</p>
            </div>
            {activeEvent && (
              <button type="button" className="timeline-btn" onClick={() => togglePin(activeEvent.id)}>
                {pins[activeEvent.id] ? 'Unpin' : 'Pin'}
              </button>
            )}
          </header>

          <div className="timeline-inspector__tabs" role="tablist" aria-label="Inspector tabs">
            <button
              role="tab"
              aria-selected={inspectorTab === 'details'}
              onClick={() => setInspectorTab('details')}
            >
              Details
            </button>
            <button
              role="tab"
              aria-selected={inspectorTab === 'citations'}
              onClick={() => setInspectorTab('citations')}
            >
              Citations
            </button>
            <button
              role="tab"
              aria-selected={inspectorTab === 'notes'}
              onClick={() => setInspectorTab('notes')}
            >
              Notes
            </button>
          </div>

          {!activeEvent && <p>Select an event to see details.</p>}

          {activeEvent && inspectorTab === 'details' && (
            <div className="timeline-inspector__panel">
              <div className="timeline-inspector__meta">
                <time dateTime={activeEvent.ts}>{new Date(activeEvent.ts).toLocaleString()}</time>
                {typeof activeEvent.confidence === 'number' && (
                  <span className="confidence">Confidence {(activeEvent.confidence * 100).toFixed(0)}%</span>
                )}
                {activeEvent.risk_band && (
                  <span className={`risk-chip risk-chip--${activeEvent.risk_band}`}>
                    {activeEvent.risk_band.toUpperCase()} risk
                  </span>
                )}
              </div>
              <h4>{activeEvent.title}</h4>
              <p>{activeEvent.summary}</p>
              <div className="presentation-actions">
                <button type="button" className="timeline-btn timeline-btn--primary" onClick={sendToPresentationStudio}>
                  Send to Presentation Studio
                </button>
              </div>
              <ProbabilityOverview event={activeEvent} />
              {activeEvent.entity_highlights.length > 0 && (
                <section>
                  <h5>Entities</h5>
                  <ul className="entity-tags">
                    {activeEvent.entity_highlights.map((entity: EntityHighlight) => (
                      <li key={`${activeEvent.id}-${entity.id}`}>{entity.label}</li>
                    ))}
                  </ul>
                </section>
              )}
              {activeEvent.relation_tags.length > 0 && (
                <section>
                  <h5>Relations</h5>
                  <ul className="relation-tags">
                    {activeEvent.relation_tags.map((relation: RelationTag, index: number) => (
                      <li key={`${activeEvent.id}-rel-${index}`}>
                        {relation.label} <span className="relation-detail">{relation.type}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {activeEvent.motion_deadline && (
                <section className="timeline-deadline">
                  <h5>Motion deadline</h5>
                  <p>{new Date(activeEvent.motion_deadline).toLocaleDateString()}</p>
                </section>
              )}
            </div>
          )}

          {activeEvent && inspectorTab === 'citations' && (
            <div className="timeline-inspector__panel">
              <div className="timeline-inspector__citations">
                <div className="timeline-inspector__viewer">
                  <DocumentViewerPanel />
                </div>
                <div className="timeline-inspector__citation-list">
                  <h5>Linked Citations</h5>
                  {activeEvent.citations.length === 0 && <p>No citations linked yet.</p>}
                  {activeEvent.citations.map((docId) => (
                    <button key={`${activeEvent.id}-${docId}`} type="button" onClick={() => handleCitationLink(docId)}>
                      {citations.find((citation) => citation.docId === docId)?.title ?? docId}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeEvent && inspectorTab === 'notes' && (
            <div className="timeline-inspector__panel">
              <h5>Reviewer Notes</h5>
              <textarea
                value={activeNote}
                placeholder="Add observations, strategy hooks, or follow-ups…"
                onChange={(event) => updateNote(activeEvent.id, event.target.value)}
              />
            </div>
          )}

          <section className="timeline-export">
            <header>
              <h4>Export Center</h4>
              <p className="panel-subtitle">Publish a filtered, court-ready timeline package.</p>
            </header>
            <div className="timeline-export__summary">
              <span className={storyboardReady ? 'status-pill status-pill--served' : 'status-pill status-pill--pending'}>
                {storyboardReady ? 'Storyboard Package Ready' : 'Storyboard Package Building'}
              </span>
              <span className="timeline-export__hint">
                {storyboardMode
                  ? storyboardReady
                    ? `Includes ${storyboard.length} storyboard scene${storyboard.length === 1 ? '' : 's'}`
                    : 'Story mode is active; waiting for storyboard scene generation.'
                  : 'Enable Story Mode to include narrative storyboard scenes in export.'}
              </span>
            </div>
            <div className="timeline-export__grid">
              {(['md', 'html', 'pdf', 'xlsx'] as TimelineExportFormat[]).map((format) => (
                <button
                  key={format}
                  type="button"
                  className="timeline-export__card"
                  onClick={() => void handleExport(format)}
                  disabled={!!exporting || (storyboardMode && !storyboardReady)}
                >
                  <span className="format">{format.toUpperCase()}</span>
                  <span className="label">Export {format.toUpperCase()}</span>
                  <span className="meta">{storyboardMode ? 'Includes storyboard' : 'Timeline only'}</span>
                </button>
              ))}
            </div>
            <div className="presentation-actions">
              <button
                type="button"
                className="timeline-btn timeline-btn--primary"
                onClick={() => void handleExportStoryboardWeb()}
                disabled={!!exporting}
              >
                Export Storyboard Web Page
              </button>
              <button
                type="button"
                className="timeline-btn"
                onClick={() => void handleGenerateMediaHooks()}
                disabled={mediaHooksLoading}
              >
                {mediaHooksLoading ? 'Generating Media Hooks…' : 'Generate Exhibit Media Hooks'}
              </button>
            </div>
            {exporting && <p className="timeline-export__status">Preparing {exporting.toUpperCase()} export…</p>}
            {exportError && <p className="error-text">{exportError}</p>}
            {mediaHooksError && <p className="error-text">{mediaHooksError}</p>}
            {mediaHooks.length > 0 && (
              <div className="timeline-export__summary">
                <span className="status-pill status-pill--served">
                  {mediaHooks.length} media hooks queued
                </span>
                <span className="timeline-export__hint">
                  {mediaHooks[0].title}: {mediaHooks[0].media_type.toUpperCase()} via {mediaHooks[0].model ?? mediaHooks[0].provider ?? 'default'}
                </span>
              </div>
            )}
          </section>
        </aside>
      </div>

      {expandedEvent && (
        <EvidenceModal title={`Timeline event ${expandedEvent.title}`} onClose={() => setExpandedEvent(null)}>
          <article className="timeline-popout">
            <header>
              <time dateTime={expandedEvent.ts}>{new Date(expandedEvent.ts).toLocaleString()}</time>
              {typeof expandedEvent.confidence === 'number' && (
                <span className="confidence">Confidence {(expandedEvent.confidence * 100).toFixed(0)}%</span>
              )}
              {expandedEvent.risk_band && (
                <span className={`risk-chip risk-chip--${expandedEvent.risk_band}`}>
                  {expandedEvent.risk_band.toUpperCase()} risk
                </span>
              )}
            </header>
            <p>{expandedEvent.summary}</p>
            <ProbabilityOverview event={expandedEvent} />
            {expandedEvent.citations.length > 0 && (
              <section>
                <h4>Linked Citations</h4>
                <ul>
                  {expandedEvent.citations.map((docId) => (
                    <li key={`${expandedEvent.id}-${docId}`}>
                      <button type="button" onClick={() => handleCitationLink(docId)}>
                        {citations.find((citation) => citation.docId === docId)?.title ?? docId}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </article>
        </EvidenceModal>
      )}
    </div>
  );
}

function TimelineCard({
  event,
  active,
  pinned,
  onFocus,
  onExpand,
  onCitationLink,
  onTogglePin,
}: {
  event: TimelineEvent;
  active: boolean;
  pinned: boolean;
  onFocus: () => void;
  onExpand: () => void;
  onCitationLink: (docId: string) => void;
  onTogglePin: () => void;
}): JSX.Element {
  const deadlineLabel = useMemo(() => {
    if (!event.motion_deadline) return null;
    return new Date(event.motion_deadline).toLocaleDateString();
  }, [event.motion_deadline]);

  return (
    <li>
      <article
        tabIndex={0}
        onFocus={onFocus}
        className={`timeline-card${active ? ' active' : ''}`}
        data-timeline-id={event.id}
        aria-current={active ? 'true' : undefined}
      >
        <header>
          <time dateTime={event.ts}>{new Date(event.ts).toLocaleString()}</time>
          <div className="timeline-card__title">
            <h4>{event.title}</h4>
            {pinned && <span className="timeline-pin">Pinned</span>}
          </div>
          <div className="timeline-card__badges">
            {typeof event.confidence === 'number' && (
              <span className="confidence">Confidence {(event.confidence * 100).toFixed(0)}%</span>
            )}
            {event.risk_band && (
              <span className={`risk-chip risk-chip--${event.risk_band}`}>
                {event.risk_band.toUpperCase()} risk
              </span>
            )}
          </div>
        </header>
        <p>{event.summary}</p>
        <ProbabilityOverview event={event} compact />
        {event.entity_highlights.length > 0 && (
          <section>
            <h5>Entities</h5>
            <ul className="entity-tags">
              {event.entity_highlights.map((entity: EntityHighlight) => (
                <li key={`${event.id}-${entity.id}`}>{entity.label}</li>
              ))}
            </ul>
          </section>
        )}
        {event.relation_tags.length > 0 && (
          <section>
            <h5>Relations</h5>
            <ul className="relation-tags">
              {event.relation_tags.map((relation: RelationTag, index: number) => (
                <li key={`${event.id}-rel-${index}`}>
                  {relation.label} <span className="relation-detail">{relation.type}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        {deadlineLabel && (
          <section className="timeline-deadline">
            <h5>Motion deadline</h5>
            <p>{deadlineLabel}</p>
          </section>
        )}
        <footer>
          <div className="timeline-card__footer">
            <div className="timeline-card__citations" aria-label="Citations">
              {event.citations.map((docId) => (
                <button key={`${event.id}-${docId}`} type="button" onClick={() => onCitationLink(docId)}>
                  {docId}
                </button>
              ))}
            </div>
            <div className="timeline-card__actions">
              <button type="button" onClick={onTogglePin}>
                {pinned ? 'Unpin' : 'Pin'}
              </button>
              <button type="button" onClick={onExpand} className="timeline-card__expand">
                View Details
              </button>
            </div>
          </div>
        </footer>
      </article>
    </li>
  );
}

function groupByDay(events: TimelineEvent[]): { day: string; events: TimelineEvent[] }[] {
  const groups = new Map<string, TimelineEvent[]>();
  events.forEach((event) => {
    const day = event.ts.slice(0, 10);
    const bucket = groups.get(day) ?? [];
    bucket.push(event);
    groups.set(day, bucket);
  });
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, dayEvents]) => ({
      day: new Date(day).toLocaleDateString(),
      events: dayEvents.sort((left, right) => new Date(left.ts).getTime() - new Date(right.ts).getTime()),
    }));
}

function ProbabilityOverview({ event, compact }: { event: TimelineEvent; compact?: boolean }): JSX.Element | null {
  if (!event.outcome_probabilities?.length && !event.recommended_actions?.length && !event.risk_score)
    return null;

  const probabilities = event.outcome_probabilities ?? [];
  const actions = event.recommended_actions ?? [];

  return (
    <section className={`timeline-probability${compact ? ' timeline-probability--compact' : ''}`}>
      {probabilities.length > 0 && (
        <div className="timeline-probability__chart" aria-label="Outcome probability arcs">
          <ProbabilityArcs probabilities={probabilities} />
          <ul className="timeline-probability__legend">
            {probabilities.map((item) => (
              <li key={`${event.id}-${item.label}`}>
                <span className="legend-label">{item.label}</span>
                <span className="legend-value">{Math.round(item.probability * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {actions.length > 0 && (
        <div className="timeline-probability__actions">
          <h5>Recommended actions</h5>
          <ul>
            {actions.map((action, index) => (
              <li key={`${event.id}-action-${index}`}>{action}</li>
            ))}
          </ul>
        </div>
      )}
      {typeof event.risk_score === 'number' && (
        <p className="timeline-probability__score">Predicted risk score {(event.risk_score * 100).toFixed(0)}%</p>
      )}
    </section>
  );
}

function ProbabilityArcs({ probabilities }: { probabilities: OutcomeProbability[] }): JSX.Element {
  const radius = 32;
  const center = 40;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;
  const palette = ['#ff6b6b', '#4dabf7', '#ffd43b'];

  return (
    <svg viewBox="0 0 80 80" className="probability-arcs" role="presentation">
      <circle className="probability-arcs__background" cx={center} cy={center} r={radius} />
      {probabilities.map((item, index) => {
        const value = Math.max(0, Math.min(item.probability, 1));
        const length = value * circumference;
        const dasharray = `${length} ${circumference - length}`;
        const rotation = (cumulative / circumference) * 360;
        cumulative += length;
        return (
          <circle
            key={`${item.label}-${index}`}
            className="probability-arcs__segment"
            cx={center}
            cy={center}
            r={radius}
            strokeDasharray={dasharray}
            transform={`rotate(${rotation - 90} ${center} ${center})`}
            data-index={index}
            style={{ stroke: palette[index % palette.length] }}
          />
        );
      })}
    </svg>
  );
}
