import { TimelineView } from '@/components/TimelineView';

export default function TimelinePage(): JSX.Element {
  return (
    <section className="timeline-page">
      <header className="timeline-page__header">
        <div>
          <p className="eyebrow">Case Timeline</p>
          <h2>Interactive Timeline Builder</h2>
        </div>
        <p className="panel-subtitle">
          Build narratives, inspect evidence, and export court-ready timelines with full citations.
        </p>
      </header>
      <TimelineView />
    </section>
  );
}
