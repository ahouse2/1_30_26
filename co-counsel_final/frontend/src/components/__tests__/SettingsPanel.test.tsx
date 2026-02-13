import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/context/SettingsContext', () => ({
  useSettingsContext: () => ({
    settings: {
      providers: {
        primary: 'openai',
        secondary: null,
        defaults: { chat: 'gpt-4o' },
        api_base_urls: {},
        local_runtime_paths: {},
        available: [],
      },
      credentials: { providers: [], services: {} },
      appearance: { theme: 'system' },
      agents_policy: {
        enabled: true,
        initial_trust: 0.6,
        trust_threshold: 0.35,
        decay: 0.15,
        success_reward: 0.2,
        failure_penalty: 0.45,
        exploration_probability: 0.05,
        seed: null,
        observable_roles: ['strategy', 'research', 'qa'],
        suppressible_roles: ['ingestion'],
      },
      graph_refinement: {
        enabled: true,
        interval_seconds: 900,
        idle_limit: 3,
        min_new_edges: 0,
      },
    },
    catalog: [],
    updateSettings: vi.fn(),
    refreshModelCatalog: vi.fn(),
    themePreference: 'system',
    setThemePreference: vi.fn(),
    loading: false,
    saving: false,
    error: undefined,
  }),
}));

import { SettingsPanel } from '../SettingsPanel';

describe('SettingsPanel', () => {
  it('shows refresh models control', () => {
    render(<SettingsPanel />);
    expect(screen.getByText(/Refresh models/i)).toBeInTheDocument();
  });

  it('shows autonomy tab', () => {
    render(<SettingsPanel />);
    expect(screen.getByText(/Autonomy/i)).toBeInTheDocument();
  });
});
