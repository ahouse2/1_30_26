import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type CommandPaletteAction = {
  id: string;
  label: string;
  description: string;
  route: string;
};

type CommandPaletteProps = {
  actions: CommandPaletteAction[];
};

export function CommandPalette({ actions }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((current) => !current);
      } else if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    const onOpen = () => {
      setOpen(true);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('co-counsel:open-command-palette', onOpen);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('co-counsel:open-command-palette', onOpen);
    };
  }, []);

  const filteredActions = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return actions;
    return actions.filter((action) => {
      const haystack = `${action.label} ${action.description}`.toLowerCase();
      return haystack.includes(search);
    });
  }, [actions, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((current) => Math.min(current + 1, Math.max(filteredActions.length - 1, 0)));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((current) => Math.max(current - 1, 0));
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const selected = filteredActions[activeIndex];
        if (!selected) return;
        navigate(selected.route);
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, filteredActions, navigate, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="command-palette__overlay" role="presentation" onClick={() => setOpen(false)}>
      <section className="command-palette" role="dialog" aria-label="Command palette" onClick={(event) => event.stopPropagation()}>
        <div className="command-palette__header">
          <i className="fa-solid fa-terminal" />
          <input
            autoFocus
            className="command-palette__input"
            placeholder="Jump to station, workflow, or panel..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <span className="command-palette__hint">Esc</span>
        </div>
        <ul className="command-palette__list">
          {filteredActions.length === 0 && <li className="command-palette__empty">No matches</li>}
          {filteredActions.map((action, index) => (
            <li key={action.id}>
              <button
                type="button"
                className={`command-palette__item ${index === activeIndex ? 'is-active' : ''}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => {
                  navigate(action.route);
                  setOpen(false);
                }}
              >
                <span>{action.label}</span>
                <small>{action.description}</small>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
