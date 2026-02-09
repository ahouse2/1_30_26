import axios from 'axios';
import { startFolderUpload } from '@/services/document_api';

vi.mock('axios');

const mockedAxios = axios as unknown as {
  post: (url: string, data?: unknown) => Promise<{ data: unknown }>;
};

test('startFolderUpload returns folder_id', async () => {
  mockedAxios.post = vi.fn().mockResolvedValue({
    data: { folder_id: 'folder-1', case_id: 'case-1', chunk_size: 1024 },
  });

  const result = await startFolderUpload('Case A', 'my_documents');

  expect(result.folder_id).toBe('folder-1');
  expect(mockedAxios.post).toHaveBeenCalledWith('/api/ingestion/folder/start', {
    folder_name: 'Case A',
    doc_type: 'my_documents',
  });
});
