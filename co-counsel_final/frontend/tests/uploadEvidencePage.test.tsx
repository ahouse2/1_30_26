import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import UploadEvidencePage from '@/pages/UploadEvidencePage';
import * as documentApi from '@/services/document_api';

vi.mock('@/services/document_api', async () => {
  const actual = await vi.importActual<typeof documentApi>('@/services/document_api');
  return {
    ...actual,
    startFolderUpload: vi.fn(),
    startFileUpload: vi.fn(),
    uploadFileChunk: vi.fn(),
    completeFileUpload: vi.fn(),
    completeFolderUpload: vi.fn(),
  };
});

const mockedStartFolderUpload = documentApi.startFolderUpload as unknown as ReturnType<typeof vi.fn>;
const mockedStartFileUpload = documentApi.startFileUpload as unknown as ReturnType<typeof vi.fn>;
const mockedUploadFileChunk = documentApi.uploadFileChunk as unknown as ReturnType<typeof vi.fn>;
const mockedCompleteFileUpload = documentApi.completeFileUpload as unknown as ReturnType<typeof vi.fn>;
const mockedCompleteFolderUpload = documentApi.completeFolderUpload as unknown as ReturnType<typeof vi.fn>;

const buildFileList = (files: File[]) => files as unknown as FileList;

test('shows auto case id on folder start', async () => {
  mockedStartFolderUpload.mockResolvedValue({
    folder_id: 'folder-1',
    case_id: 'case-99',
    chunk_size: 1024,
  });
  mockedStartFileUpload.mockResolvedValue({
    upload_id: 'upload-1',
    chunk_size: 1024,
    folder_id: 'folder-1',
    case_id: 'case-99',
    relative_path: 'Case A/evidence.txt',
  });
  mockedUploadFileChunk.mockResolvedValue(undefined);
  mockedCompleteFileUpload.mockResolvedValue({
    upload_id: 'upload-1',
    relative_path: 'Case A/evidence.txt',
    final_path: '/tmp/evidence.txt',
  });
  mockedCompleteFolderUpload.mockResolvedValue({
    job_id: 'case-99',
    status: 'queued',
    submitted_at: '',
    updated_at: '',
    documents: [],
    errors: [],
    status_details: {
      ingestion: { documents: 0, skipped: [] },
      timeline: { events: 0 },
      forensics: { artifacts: [], last_run_at: null },
      graph: { nodes: 0, edges: 0, triples: 0 },
    },
  });

  render(<UploadEvidencePage />);

  const input = screen.getByTestId('folder-upload-input') as HTMLInputElement;
  const file = new File(['hello'], 'evidence.txt', { type: 'text/plain' });
  Object.defineProperty(file, 'webkitRelativePath', { value: 'Case A/evidence.txt' });
  fireEvent.change(input, { target: { files: buildFileList([file]) } });

  await waitFor(() => {
    expect(mockedStartFolderUpload).toHaveBeenCalled();
  });

  expect(mockedStartFolderUpload).toHaveBeenCalledWith('Case A', 'my_documents');
  expect(mockedStartFileUpload).toHaveBeenCalled();
  expect(mockedCompleteFolderUpload).toHaveBeenCalled();
  expect(await screen.findByDisplayValue('case-99')).toBeInTheDocument();
});
