import {
  CourtProviderStatusResponse,
  CourtSearchRequestPayload,
  CourtSearchResponsePayload,
  CourtSyncStatusPayload,
} from '@/types';

const BASE = (() => {
  if (typeof __API_BASE__ !== 'undefined' && __API_BASE__) {
    return __API_BASE__;
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
})();

function withBase(path: string): string {
  return `${BASE}${path}`;
}

export async function fetchCourtProviderStatus(): Promise<CourtProviderStatusResponse> {
  const response = await fetch(withBase('/courts/providers'));
  if (!response.ok) {
    throw new Error(`Failed to load court provider status (${response.status})`);
  }
  return response.json();
}

export async function searchCourtRecords(
  payload: CourtSearchRequestPayload
): Promise<CourtSearchResponsePayload> {
  const response = await fetch(withBase('/courts/search'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Court search failed (${response.status})`);
  }
  return response.json();
}

export async function fetchCourtSyncStatus(caseId: string, jurisdiction?: string): Promise<CourtSyncStatusPayload> {
  const params = new URLSearchParams({ case_id: caseId });
  if (jurisdiction) {
    params.set('jurisdiction', jurisdiction);
  }
  const response = await fetch(withBase(`/courts/sync/status?${params.toString()}`));
  if (!response.ok) {
    throw new Error(`Court sync status failed (${response.status})`);
  }
  return response.json();
}
