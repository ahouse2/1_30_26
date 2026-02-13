import axios from 'axios';
import { buildApiUrl } from '@/config';

export interface PresentationExportItemPayload {
  document_id: string;
  name: string;
  description?: string | null;
  added_at: string;
  citations?: string[];
}

export interface PresentationExportRequestPayload {
  format: 'md' | 'html' | 'pdf' | 'xlsx';
  binder_id?: string | null;
  binder_name: string;
  binder_description?: string | null;
  phase?: string | null;
  presenter_notes?: string | null;
  items: PresentationExportItemPayload[];
}

export interface PresentationExportResponsePayload {
  export_id: string;
  format: string;
  filename: string;
  download_url: string;
  created_at: string;
}

export async function exportPresentationBinder(
  payload: PresentationExportRequestPayload
): Promise<PresentationExportResponsePayload> {
  const response = await axios.post<PresentationExportResponsePayload>(
    buildApiUrl('/presentation/export'),
    payload
  );
  return response.data;
}
