import { render, screen } from '@testing-library/react';
import { FolderUploadZone } from '@/components/FolderUploadZone';

test('renders folder upload label', () => {
  render(<FolderUploadZone />);
  expect(screen.getByText(/Upload Folder/i)).toBeInTheDocument();
});
