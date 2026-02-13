import { useEffect, useState } from 'react';
import { CourtProviderStatusEntry } from '@/types';
import { fetchCourtProviderStatus } from '@/services/courts_api';

export default function CourtDataPanel(): JSX.Element {
  const [providers, setProviders] = useState<CourtProviderStatusEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchCourtProviderStatus()
      .then((response) => {
        if (!active) return;
        setProviders(response.providers ?? []);
        setError(null);
      })
      .catch((err: Error) => {
        if (!active) return;
        setError(err.message);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="panel-shell ds-card-cinematic p-6">
      <header>
        <h2>Court Data Hub</h2>
        <p>Provider readiness and docket sync status for PACER, UniCourt, and LACS.</p>
      </header>
      <div className="mt-4 grid gap-4">
        {loading && <p className="text-text-secondary">Loading provider status…</p>}
        {error && <p className="text-danger">{error}</p>}
        {!loading && !error && (
          <ul className="grid gap-3">
            {providers.map((provider) => (
              <li key={provider.provider_id} className="bg-background-panel rounded-lg border border-border-subtle p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold uppercase tracking-wide">{provider.provider_id}</h3>
                    <p className="text-text-secondary text-sm">
                      {provider.ready ? 'Ready for retrieval.' : provider.reason ?? 'Not configured.'}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      provider.ready ? 'bg-emerald-500/20 text-emerald-200' : 'bg-amber-500/20 text-amber-200'
                    }`}
                  >
                    {provider.ready ? 'Online' : 'Needs Setup'}
                  </span>
                </div>
              </li>
            ))}
            {providers.length === 0 && (
              <li className="text-text-secondary">No provider status available yet.</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
