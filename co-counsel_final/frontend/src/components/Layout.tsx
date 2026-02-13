import { Link, useLocation } from 'react-router-dom';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SettingsPanel } from '@/components/SettingsPanel';
import { ActiveCaseRail } from '@/components/ActiveCaseRail';
import { CommandPalette } from '@/components/CommandPalette';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  const navItems = [
    { to: '/dashboard', icon: 'fa-solid fa-house', label: 'Core', longLabel: 'Dashboard' },
    { to: '/graph', icon: 'fa-solid fa-diagram-project', label: 'Graph', longLabel: 'Graph Explorer' },
    { to: '/live-chat', icon: 'fa-solid fa-comments', label: 'Intel', longLabel: 'Live Co-Counsel Chat' },
    { to: '/timeline', icon: 'fa-solid fa-timeline', label: 'History', longLabel: 'Timeline Builder' },
    { to: '/upload', icon: 'fa-solid fa-cloud-arrow-up', label: 'Docs', longLabel: 'Upload Evidence' },
    { to: '/trial-prep', icon: 'fa-solid fa-scale-balanced', label: 'Trial', longLabel: 'Trial Prep Panels' },
    { to: '/research-strategy', icon: 'fa-solid fa-book-open', label: 'Strategy', longLabel: 'Research & Strategy' },
    { to: '/in-court-presentation', icon: 'fa-solid fa-landmark', label: 'Court', longLabel: 'Presentation Studio' },
    { to: '/forensics/exampleCase/opposition_documents/exampleDoc', icon: 'fa-solid fa-magnifying-glass-chart', label: 'Forensics', longLabel: 'Forensics Report' },
    { to: '/centcom', icon: 'fa-solid fa-tower-observation', label: 'CENTCOM', longLabel: 'CENTCOM' },
    { to: '/workflow', icon: 'fa-solid fa-diagram-predecessor', label: 'Ops', longLabel: 'Case Workflow' },
    { to: '/parity-ops', icon: 'fa-solid fa-list-check', label: 'Parity', longLabel: 'Parity Ops' },
    { to: '/trial-university', icon: 'fa-solid fa-graduation-cap', label: 'Trial U', longLabel: 'Trial University' },
    { to: '/mock-trial', icon: 'fa-solid fa-gavel', label: 'Arena', longLabel: 'Mock Trial Arena' },
    { to: '/design-system', icon: 'fa-solid fa-palette', label: 'Theme', longLabel: 'Design System' },
    { to: '/dev-team', icon: 'fa-solid fa-users-gear', label: 'Dev', longLabel: 'Dev Team' },
  ] as const;
  const commandActions = navItems.map((item) => ({
    id: item.to,
    label: item.longLabel,
    description: `Open ${item.label} station`,
    route: item.to,
  }));

  return (
    <div className="cinematic-app">
      <div className="cinematic-backdrop" />
      <header className="cinematic-header">
        <div className="header-brand">
          <div className="brand-emblem">
            <i className="fa-solid fa-gavel" />
          </div>
          <div>
            <p className="eyebrow">System Core v4.0</p>
            <h1>Consolidated Legal Command Hub</h1>
          </div>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn-cinematic header-command-trigger"
            onClick={() => window.dispatchEvent(new Event('co-counsel:open-command-palette'))}
          >
            Command
            <kbd>Ctrl/⌘ K</kbd>
          </button>
          <ThemeToggle />
          <SettingsPanel />
        </div>
      </header>

      <div className="cinematic-body">
        <nav className="cinematic-nav">
          <ul>
            {navItems.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  aria-label={item.longLabel}
                  title={item.longLabel}
                  className={
                    item.to === '/dashboard'
                      ? (isActive('/dashboard') || isActive('/') ? 'active' : '')
                      : item.to.startsWith('/forensics/')
                        ? (location.pathname.startsWith('/forensics') ? 'active' : '')
                        : (isActive(item.to) ? 'active' : '')
                  }
                >
                  <i className={item.icon} />
                  <span className="nav-label">{item.label}</span>
                  <span className="tab-glow" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <main className="cinematic-main">
          <ActiveCaseRail />
          {children}
        </main>
      </div>

      <footer className="cinematic-footer">
        <p>
          Co-Counsel AI &copy; 2026 | Powered by{' '}
          <kbd>Gemini, Swarms, LlamaIndex</kbd>
        </p>
      </footer>
      <OfflineIndicator />
      <CommandPalette actions={commandActions} />
    </div>
  );
}
