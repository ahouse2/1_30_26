import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { buildApiUrl } from '@/config';

interface EvidenceItem {
  document_id: string;
  name: string;
  description?: string | null;
}

interface EvidenceBinder {
  id: string;
  name: string;
  description?: string | null;
  items: EvidenceItem[];
}

export default function InCourtPresentationPage() {
  const [binders, setBinders] = useState<EvidenceBinder[]>([]);
  const [selectedBinder, setSelectedBinder] = useState<EvidenceBinder | null>(null);
  const [newBinderName, setNewBinderName] = useState('');
  const [newBinderDescription, setNewBinderDescription] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemDocumentId, setItemDocumentId] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBinders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(buildApiUrl('/evidence-binders'));
      if (!response.ok) {
        throw new Error(`Failed to fetch binders: ${response.statusText}`);
      }
      const data = await response.json();
      setBinders(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createBinder = async () => {
    if (!newBinderName.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(buildApiUrl('/evidence-binders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBinderName.trim(),
          description: newBinderDescription.trim() || null,
        }),
      });
      if (!response.ok) {
        throw new Error(`Failed to create binder: ${response.statusText}`);
      }
      const binder = await response.json();
      setBinders((current) => [binder, ...current]);
      setSelectedBinder(binder);
      setNewBinderName('');
      setNewBinderDescription('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = async () => {
    if (!selectedBinder || !itemName.trim() || !itemDocumentId.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(buildApiUrl(`/evidence-binders/${selectedBinder.id}/items`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: itemDocumentId.trim(),
          name: itemName.trim(),
          description: itemDescription.trim() || null,
        }),
      });
      if (!response.ok) {
        throw new Error(`Failed to add item: ${response.statusText}`);
      }
      const updated = await response.json();
      setBinders((current) => current.map((binder) => (binder.id === updated.id ? updated : binder)));
      setSelectedBinder(updated);
      setItemName('');
      setItemDocumentId('');
      setItemDescription('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBinders();
  }, []);

  return (
    <div className="bg-background-canvas text-text-primary h-screen p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="panel-shell"
      >
        <header>
          <h2>In-Court Presentation</h2>
          <p className="panel-subtitle">Build exhibit binders and stage items for trial presentation.</p>
        </header>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1 space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Binders</h3>
              {isLoading && <p>Loading...</p>}
              {error && <p className="text-red-500 text-sm mt-2">Error: {error}</p>}
              <ul className="mt-4 space-y-2">
                {binders.map((binder) => (
                  <li
                    key={binder.id}
                    className={`bg-background-surface p-2 rounded-lg cursor-pointer ${
                      selectedBinder?.id === binder.id ? 'bg-accent-violet-500/50' : ''
                    }`}
                    onClick={() => setSelectedBinder(binder)}
                  >
                    <p className="font-semibold">{binder.name}</p>
                    {binder.description && <p className="text-xs text-text-secondary">{binder.description}</p>}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-background-surface p-3 rounded-lg">
              <h4 className="text-sm font-semibold">Create Binder</h4>
              <input
                className="mt-2 w-full rounded-md bg-background-panel px-2 py-1"
                placeholder="Binder name"
                value={newBinderName}
                onChange={(event) => setNewBinderName(event.target.value)}
              />
              <input
                className="mt-2 w-full rounded-md bg-background-panel px-2 py-1"
                placeholder="Description (optional)"
                value={newBinderDescription}
                onChange={(event) => setNewBinderDescription(event.target.value)}
              />
              <button className="mt-3 w-full" onClick={createBinder} disabled={isLoading}>
                Create
              </button>
            </div>
          </div>
          <div className="md:col-span-3 bg-background-surface p-4 rounded-lg">
            {selectedBinder ? (
              <div className="space-y-4">
                <header>
                  <h3 className="text-xl font-semibold">{selectedBinder.name}</h3>
                  <p className="text-text-secondary text-sm">{selectedBinder.description}</p>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-semibold">Exhibits</h4>
                    <ul className="mt-3 space-y-2">
                      {selectedBinder.items.map((item) => (
                        <li key={item.document_id} className="bg-background-panel p-3 rounded-lg">
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-xs text-text-secondary">Document: {item.document_id}</p>
                          {item.description && <p className="text-xs text-text-secondary">{item.description}</p>}
                        </li>
                      ))}
                      {selectedBinder.items.length === 0 && (
                        <li className="text-text-secondary">No exhibits yet. Add one below.</li>
                      )}
                    </ul>
                  </div>
                  <div className="bg-background-panel p-3 rounded-lg">
                    <h4 className="text-sm font-semibold">Add Exhibit</h4>
                    <input
                      className="mt-2 w-full rounded-md bg-background-surface px-2 py-1"
                      placeholder="Exhibit name"
                      value={itemName}
                      onChange={(event) => setItemName(event.target.value)}
                    />
                    <input
                      className="mt-2 w-full rounded-md bg-background-surface px-2 py-1"
                      placeholder="Document ID"
                      value={itemDocumentId}
                      onChange={(event) => setItemDocumentId(event.target.value)}
                    />
                    <input
                      className="mt-2 w-full rounded-md bg-background-surface px-2 py-1"
                      placeholder="Description (optional)"
                      value={itemDescription}
                      onChange={(event) => setItemDescription(event.target.value)}
                    />
                    <button className="mt-3 w-full" onClick={addItem} disabled={isLoading}>
                      Add Exhibit
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p>Select or create a binder to stage exhibits.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
