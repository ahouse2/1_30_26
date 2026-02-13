import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { GraphExplorerPanel } from '../GraphExplorerPanel';

vi.mock('@/context/ScenarioContext', () => ({
  useScenario: () => ({
    state: {
      configuration: { caseId: '' },
      scenario: undefined,
    },
  }),
}));

vi.mock('@/context/QueryContext', () => ({
  useQueryContext: () => ({
    citations: [],
    setActiveCitation: vi.fn(),
  }),
}));

vi.mock('@/services/graph_api', () => ({
  fetchGraphOverview: vi.fn().mockResolvedValue({ nodes: [], edges: [] }),
  fetchGraphNeighbors: vi.fn().mockResolvedValue({ nodes: [], edges: [] }),
  searchGraphNodes: vi.fn().mockResolvedValue({ nodes: [] }),
}));

vi.mock('@/services/graph_refinement_api', () => ({
  getGraphRefinementStatus: vi.fn().mockResolvedValue({
    running: false,
    idle_runs: 0,
    interval_seconds: 20,
    idle_limit: 3,
    min_new_edges: 1,
    stop_requested: false,
    enabled: true,
  }),
  restartGraphRefinement: vi.fn().mockResolvedValue({
    running: true,
    idle_runs: 0,
    interval_seconds: 20,
    idle_limit: 3,
    min_new_edges: 1,
    stop_requested: false,
    enabled: true,
  }),
}));

vi.mock('../Graph3DScene', () => ({
  Graph3DScene: () => <div data-testid="graph-3d-scene" />,
}));

vi.mock('../GraphDetailPanel', () => ({
  GraphDetailPanel: () => <div data-testid="graph-detail-panel" />,
}));

test('renders graph explorer controls', () => {
  render(<GraphExplorerPanel />);
  expect(screen.getByText(/Graph Explorer/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Search nodes/i)).toBeInTheDocument();
});
