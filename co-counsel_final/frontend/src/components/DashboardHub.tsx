
import { motion } from 'framer-motion';
import { MetricCard } from './MetricCard';
import { UploadZone } from './UploadZone';
import { GraphExplorer } from './GraphExplorer';
import { MockTrialArena } from './MockTrialArena';

const workflowStations = [
  { key: 'ingest', label: 'Ingest', state: 'complete' },
  { key: 'graph', label: 'Graph', state: 'active' },
  { key: 'timeline', label: 'Timeline', state: 'queued' },
  { key: 'research', label: 'Research', state: 'queued' },
  { key: 'trial', label: 'Trial Prep', state: 'queued' },
  { key: 'presentation', label: 'Presentation', state: 'queued' },
] as const;

export default function DashboardHub() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="dashboard-hub"
    >
      <header className="dashboard-hub__header">
        <div>
          <p className="eyebrow">Intel Briefing</p>
          <h1>Command Overview</h1>
        </div>
        <div className="dashboard-hub__actions">
          <button className="icon-btn" aria-label="Notifications">
            <i className="fa-solid fa-bell" />
          </button>
          <button className="icon-btn" aria-label="Profile">
            <i className="fa-solid fa-user" />
          </button>
        </div>
      </header>

      <div className="dashboard-hub__metrics">
        <MetricCard title="Relevant Matter Score" value="84" subtitle="8 Uncovered Facts" glow="cyan" />
        <MetricCard title="Task Burndown" chart glow="pink" />
        <MetricCard title="Case Status Timeline" timeline glow="violet" />
        <MetricCard title="Reports Reviewed" value="175" subtitle="Last 7 Days" glow="blue" />
      </div>

      <section className="dashboard-hub__workflow-strip" aria-label="Workflow strip">
        <div className="dashboard-hub__workflow-header">
          <p className="eyebrow">Workflow Strip</p>
          <span className="dashboard-hub__workflow-meta">Current focus: Graph refinement and citation checks</span>
        </div>
        <div className="dashboard-hub__workflow-track">
          {workflowStations.map((station) => (
            <button
              key={station.key}
              type="button"
              className={`dashboard-hub__workflow-chip is-${station.state}`}
              aria-label={`Open ${station.label}`}
            >
              {station.label}
            </button>
          ))}
        </div>
      </section>

      <div className="dashboard-hub__grid">
        <UploadZone />
        <GraphExplorer />
        <MockTrialArena />
      </div>
    </motion.div>
  );
}
