import { render, screen } from '@testing-library/react';
import CourtDataPanel from '../CourtDataPanel';

vi.mock('@/services/courts_api', () => ({
  fetchCourtProviderStatus: async () => ({
    providers: [
      { provider_id: 'courtlistener', ready: true },
      { provider_id: 'caselaw', ready: true },
      { provider_id: 'pacer', ready: false },
      { provider_id: 'unicourt', ready: true },
      { provider_id: 'lacs', ready: false },
    ],
  }),
}));


test('shows provider readiness badges', async () => {
  render(<CourtDataPanel />);
  expect(await screen.findByText(/COURTLISTENER/i)).toBeInTheDocument();
  expect(await screen.findByText(/CASELAW/i)).toBeInTheDocument();
  expect(await screen.findByText(/PACER/i)).toBeInTheDocument();
  expect(await screen.findByText(/UNICOURT/i)).toBeInTheDocument();
});
