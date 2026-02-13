import { useMemo } from 'react';
import { useSettingsContext } from '@/context/SettingsContext';

function resolveTheme(preference: string): 'light' | 'dark' {
  if (preference === 'system') {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }
  return preference === 'dark' ? 'dark' : 'light';
}

export function ThemeToggle(): JSX.Element {
  const { themePreference, setThemePreference, saving } = useSettingsContext();
  const resolved = useMemo(() => resolveTheme(themePreference), [themePreference]);

  const handleToggle = (): void => {
    const next = resolved === 'dark' ? 'light' : 'dark';
    void setThemePreference(next);
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-pressed={resolved === 'dark'}
      onClick={handleToggle}
      disabled={saving}
    >
      <span className="theme-toggle__icon" aria-hidden="true">
        <i className={resolved === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun'} />
      </span>
      <span className="theme-toggle__label">{resolved === 'dark' ? 'Dark' : 'Light'}</span>
    </button>
  );
}
