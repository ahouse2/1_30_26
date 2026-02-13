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

export interface EvidenceItem {
  document_id: string;
  name: string;
  description?: string | null;
  added_at: string;
}

export interface EvidenceBinder {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
  items: EvidenceItem[];
}

export interface EvidenceBinderCreate {
  name: string;
  description?: string;
}

export interface EvidenceBinderUpdate {
  name?: string;
  description?: string;
}

export const listEvidenceBinders = async (): Promise<EvidenceBinder[]> => {
  const response = await axios.get<EvidenceBinder[]>(withBase('/evidence-binders'));
  return response.data;
};

export const createEvidenceBinder = async (
  payload: EvidenceBinderCreate
): Promise<EvidenceBinder> => {
  const response = await axios.post<EvidenceBinder>(withBase('/evidence-binders'), payload);
  return response.data;
};

export const updateEvidenceBinder = async (
  binderId: string,
  payload: EvidenceBinderUpdate
): Promise<EvidenceBinder> => {
  const response = await axios.put<EvidenceBinder>(withBase(`/evidence-binders/${binderId}`), payload);
  return response.data;
};

export const deleteEvidenceBinder = async (binderId: string): Promise<void> => {
  await axios.delete(withBase(`/evidence-binders/${binderId}`));
};

export const addEvidenceItem = async (
  binderId: string,
  item: EvidenceItem
): Promise<EvidenceBinder> => {
  const response = await axios.post<EvidenceBinder>(
    withBase(`/evidence-binders/${binderId}/items`),
    item
  );
  return response.data;
};
