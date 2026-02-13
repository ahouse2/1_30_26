import { useMemo, useState } from 'react';

import { cssVar } from '@/lib/utils';

type Lesson = {
  id: string;
  title: string;
  duration: string;
  progress: number;
  status: 'Queued' | 'In Progress' | 'Complete';
  summary: string;
  tacticalOutcome: string;
};

const LESSONS: Lesson[] = [
  {
    id: 'module-1',
    title: 'Precision Cross: Financial Forensics',
    duration: '12:48',
    progress: 0.72,
    status: 'In Progress',
    summary: 'Cross strategy anchored to crypto tracing exhibits and impeachment sequencing.',
    tacticalOutcome: 'Build a 3-layer witness trap with document-backed timing pivots.',
  },
  {
    id: 'module-2',
    title: 'Voir Dire Dynamics',
    duration: '09:25',
    progress: 0.45,
    status: 'Queued',
    summary: 'Jury calibration drills with bias markers, challenge strategy, and fallback logic.',
    tacticalOutcome: 'Generate a strike matrix from juror sentiment + risk profile.',
  },
  {
    id: 'module-3',
    title: 'Motion Practice In Motion',
    duration: '16:04',
    progress: 1,
    status: 'Complete',
    summary: 'Fast-cycle motion drafting and hearing posture using timeline + authority overlays.',
    tacticalOutcome: 'Deploy hearing packets with argument ladders and citation blocks.',
  },
  {
    id: 'module-4',
    title: 'Storyline Engineering For Trial',
    duration: '11:31',
    progress: 0.2,
    status: 'Queued',
    summary: 'Narrative architecture from event graph clusters to exhibit pacing and theme control.',
    tacticalOutcome: 'Convert dense facts into a judge-ready, jury-clear trial arc.',
  },
];

const STATUS_ORDER: Record<Lesson['status'], number> = {
  'In Progress': 0,
  Queued: 1,
  Complete: 2,
};

const statusClass = (status: Lesson['status']) => {
  if (status === 'Complete') return 'status-pill status-pill--served';
  if (status === 'In Progress') return 'status-pill status-pill--pending';
  return 'status-pill neutral';
};

export function TrialUniversityPanel(): JSX.Element {
  const [selectedLessonId, setSelectedLessonId] = useState<string>(LESSONS[0].id);

  const selectedLesson = useMemo(
    () => LESSONS.find((lesson) => lesson.id === selectedLessonId) ?? LESSONS[0],
    [selectedLessonId]
  );

  const completion = useMemo(() => {
    const total = LESSONS.length;
    const completed = LESSONS.filter((lesson) => lesson.status === 'Complete').length;
    const inProgress = LESSONS.filter((lesson) => lesson.status === 'In Progress').length;
    return {
      total,
      completed,
      inProgress,
      readiness: Math.round((LESSONS.reduce((sum, item) => sum + item.progress, 0) / total) * 100),
    };
  }, []);

  const orderedLessons = useMemo(() => {
    return [...LESSONS].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  }, []);

  return (
    <section className="trial-university" aria-labelledby="trial-university-title">
      <header>
        <div>
          <h2 id="trial-university-title">Trial University</h2>
          <p>Boot camp mode for motion practice, courtroom posture, and tactical trial execution.</p>
        </div>
        <div className="research-status">
          <span className="status-pill status-pill--pending">Readiness: {completion.readiness}%</span>
          <span className="status-pill status-pill--served">{completion.completed}/{completion.total} complete</span>
        </div>
      </header>

      <div className="research-summary">
        <div>
          <h3>Current Training Focus</h3>
          <p>{selectedLesson.title}</p>
          <p className="panel-subtitle">{selectedLesson.tacticalOutcome}</p>
        </div>
        <div className="research-summary__actions">
          <button type="button" className="btn-cinematic btn-secondary">Launch Drill</button>
          <button type="button" className="btn-cinematic">Send To Trial Prep</button>
        </div>
      </div>

      <div className="lesson-grid">
        {orderedLessons.map((lesson) => (
          <article
            key={lesson.id}
            className="lesson-card"
            style={cssVar('--progress', lesson.progress)}
            onClick={() => setSelectedLessonId(lesson.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setSelectedLessonId(lesson.id);
              }
            }}
            aria-label={`Select lesson ${lesson.title}`}
          >
            <div className="lesson-progress">
              <span className="progress-glow" aria-hidden />
              <span className="progress-fill" aria-hidden />
            </div>
            <div className="lesson-body">
              <h3>{lesson.title}</h3>
              <p className="lesson-summary">{lesson.summary}</p>
              <div className="lesson-meta">
                <span>{lesson.duration}</span>
                <span>{Math.round(lesson.progress * 100)}%</span>
              </div>
              <p className="panel-subtitle">{lesson.tacticalOutcome}</p>
            </div>
            <div className="research-inline-actions">
              <span className={statusClass(lesson.status)}>{lesson.status}</span>
              <button type="button" className="lesson-action">
                {lesson.status === 'Complete' ? 'Review Lesson' : 'Continue Lesson'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
