import { render, screen } from '@testing-library/react';
import CaseWorkflowPage from '../CaseWorkflowPage';

it('renders workflow controls', () => {
  render(<CaseWorkflowPage />);
  expect(screen.getByText('Case Workflow')).toBeInTheDocument();
});
