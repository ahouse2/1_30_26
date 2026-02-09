import { render, screen } from '@testing-library/react';
import InCourtPresentationPage from '@/pages/InCourtPresentationPage';

const mockHtmlResponse = () =>
  Promise.resolve(
    new Response('<!doctype html><html><body>not json</body></html>', {
      status: 200,
      headers: { 'content-type': 'text/html' },
    })
  );

describe('InCourtPresentationPage', () => {
  beforeEach(() => {
    // @ts-expect-error - stub fetch for tests
    global.fetch = vi.fn(mockHtmlResponse);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('falls back to demo cases when API response is not JSON', async () => {
    render(<InCourtPresentationPage />);
    expect(await screen.findByText(/Demo cases/i)).toBeInTheDocument();
    expect(screen.getByText(/Case Alpha/i)).toBeInTheDocument();
  });
});
