import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import UploadEvidencePage from '@/pages/UploadEvidencePage';
import * as documentApi from '@/services/document_api';

vi.mock('@/services/document_api', async () => {
  const actual = await vi.importActual<typeof documentApi>('@/services/document_api');
  return {
    ...actual,
    startFolderUpload: vi.fn(),
  };
});

const mockedStartFolderUpload = documentApi.startFolderUpload as unknown as ReturnType<typeof vi.fn>;

const buildFileList = (files: File[]) => files as unknown as FileList;

test('shows auto case id on folder start', async () => {
  mockedStartFolderUpload.mockResolvedValue({
    folder_id: 'folder-1',
    case_id: 'case-99',
    chunk_size: 1024,
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
  expect(await screen.findByDisplayValue('case-99')).toBeInTheDocument();
});
