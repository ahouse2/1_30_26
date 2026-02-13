import { Link, useLocation } from 'react-router-dom';
import { useSharedCaseId } from '@/hooks/useSharedCaseId';

const STATION_LINKS = [
  { to: '/centcom', label: 'CENTCOM' },
  { to: '/workflow', label: 'Workflow' },
  { to: '/graph', label: 'Graph' },
  { to: '/timeline', label: 'Timeline' },
  { to: '/research-strategy', label: 'Research' },
  { to: '/trial-prep', label: 'Trial Prep' },
  { to: '/in-court-presentation', label: 'Presentation' },
  { to: '/parity-ops', label: 'Parity' },
] as const;

export function ActiveCaseRail() {
  const { caseId, setCaseId } = useSharedCaseId();
  const location = useLocation();

  return (
    <section className="active-case-rail" aria-label="Active case context">
      <div className="active-case-rail__identity">
        <p className="eyebrow">Active Case</p>
        <label htmlFor="global-active-case" className="sr-only">
          Active Case ID
        </label>
        <input
          id="global-active-case"
          className="input-cinematic active-case-rail__input"
          value={caseId}
          onChange={(event) => setCaseId(event.target.value)}
        />
      </div>
      <div className="active-case-rail__links">
        {STATION_LINKS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`active-case-rail__chip ${location.pathname.startsWith(item.to) ? 'is-active' : ''}`}
            aria-label={`Open ${item.label} with active case`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
