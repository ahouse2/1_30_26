import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IngestionPipelinePanel } from '@/components/IngestionPipelinePanel';
import * as documentApi from '@/services/document_api';

vi.mock('@/services/document_api', async () => {
  const actual = await vi.importActual<typeof documentApi>('@/services/document_api');
  return {
    ...actual,
    runIngestionStage: vi.fn(),
  };
});

const mockedRunStage = documentApi.runIngestionStage as unknown as ReturnType<typeof vi.fn>;

test('renders stage buttons', () => {
  render(<IngestionPipelinePanel />);
  expect(screen.getByText(/Preprocess/i)).toBeInTheDocument();
});

test('triggers stage run when job id exists', async () => {
  mockedRunStage.mockResolvedValue({ job_id: 'job-1', status: 'running' });
  render(<IngestionPipelinePanel jobId="job-1" />);
  fireEvent.click(screen.getByText(/Preprocess/i));
  await waitFor(() => {
    expect(mockedRunStage).toHaveBeenCalledWith('job-1', 'load', true);
  });
});
