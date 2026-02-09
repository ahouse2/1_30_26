import { render, screen } from '@testing-library/react';
import { IngestionPipelinePanel } from '@/components/IngestionPipelinePanel';

test('renders stage buttons', () => {
  render(<IngestionPipelinePanel />);
  expect(screen.getByText(/Preprocess/i)).toBeInTheDocument();
});
