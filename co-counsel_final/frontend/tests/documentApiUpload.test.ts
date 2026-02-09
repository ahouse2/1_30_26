import axios from 'axios';
import { completeFolderUpload, runIngestionStage, startFileUpload, startFolderUpload } from '@/services/document_api';

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

test('startFileUpload returns upload_id', async () => {
  mockedAxios.post = vi.fn().mockResolvedValue({
    data: {
      upload_id: 'upload-1',
      chunk_size: 1024,
      folder_id: 'folder-1',
      case_id: 'case-1',
      relative_path: 'evidence/alpha.txt',
    },
  });

  const result = await startFileUpload('folder-1', 'evidence/alpha.txt', 5);

  expect(result.upload_id).toBe('upload-1');
  expect(mockedAxios.post).toHaveBeenCalledWith('/api/ingestion/folder/folder-1/file/start', {
    relative_path: 'evidence/alpha.txt',
    total_bytes: 5,
  });
});

test('completeFolderUpload returns job id', async () => {
  mockedAxios.post = vi.fn().mockResolvedValue({
    data: { job_id: 'case-99', status: 'queued' },
  });

  const result = await completeFolderUpload('folder-1');

  expect(result.job_id).toBe('case-99');
  expect(mockedAxios.post).toHaveBeenCalledWith('/api/ingestion/folder/folder-1/complete');
});

test('runIngestionStage posts to stage endpoint', async () => {
  mockedAxios.post = vi.fn().mockResolvedValue({
    data: { job_id: 'case-99', status: 'running' },
  });

  await runIngestionStage('case-99', 'enrich', true);

  expect(mockedAxios.post).toHaveBeenCalledWith('/api/ingestion/case-99/stage/enrich/run', {
    resume_downstream: true,
  });
});
