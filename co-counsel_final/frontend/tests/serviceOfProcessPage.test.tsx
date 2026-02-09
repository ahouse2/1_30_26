import { render, screen } from '@testing-library/react';
import ServiceOfProcessPage from '@/pages/ServiceOfProcessPage';

const mockHtmlResponse = () =>
  Promise.resolve(
    new Response('<!doctype html><html><body>not json</body></html>', {
      status: 200,
      headers: { 'content-type': 'text/html' },
    })
  );

describe('ServiceOfProcessPage', () => {
  beforeEach(() => {
    // @ts-expect-error - stub fetch for tests
    global.fetch = vi.fn(mockHtmlResponse);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('falls back to demo requests when API response is not JSON', async () => {
    render(<ServiceOfProcessPage />);
    expect(await screen.findByText(/Demo service requests/i)).toBeInTheDocument();
    expect(screen.getByText(/Acme Process Service/i)).toBeInTheDocument();
  });
});
