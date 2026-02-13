import axios from 'axios';

const BASE = (() => {
  if (typeof __API_BASE__ !== 'undefined' && __API_BASE__) {
    return __API_BASE__ as string;
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
})();

function withBase(path: string): string {
  return `${BASE}${path}`;
}

export interface GraphRefinementStatus {
  running: boolean;
  idle_runs: number;
  interval_seconds: number;
  idle_limit: number;
  min_new_edges: number;
  stop_requested: boolean;
  enabled: boolean;
}

export const getGraphRefinementStatus = async (): Promise<GraphRefinementStatus> => {
  const response = await axios.get<GraphRefinementStatus>(withBase('/graph/refinement/status'));
  return response.data;
};

export const restartGraphRefinement = async (): Promise<GraphRefinementStatus> => {
  const response = await axios.post<GraphRefinementStatus>(withBase('/graph/refinement/restart'));
  return response.data;
};
