import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchFromApi, parseJsonResponse } from '@/apiClient';

interface ServiceRequest {
  id: string;
  documentName: string;
  recipient: string;
  status: 'Pending' | 'Served' | 'Failed';
}

const DEMO_SERVICE_REQUESTS: ServiceRequest[] = [
  {
    id: 'demo-1',
    documentName: 'Summons & Complaint - Exhibit A',
    recipient: 'Acme Process Service',
    status: 'Pending',
  },
  {
    id: 'demo-2',
    documentName: 'Notice of Hearing - Motion to Compel',
    recipient: 'Metro Legal Couriers',
    status: 'Served',
  },
  {
    id: 'demo-3',
    documentName: 'Subpoena Duces Tecum',
    recipient: 'North County Sheriff',
    status: 'Failed',
  },
];

const isNonJsonResponse = (err: unknown) =>
  err instanceof Error && err.message.toLowerCase().includes('unexpected response');

const statusTone: Record<ServiceRequest['status'], string> = {
  Pending: 'status-pill neutral',
  Served: 'status-pill success',
  Failed: 'status-pill danger',
};

export default function ServiceOfProcessPage() {
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [newRequest, setNewRequest] = useState({ documentName: '', recipient: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  const fetchServiceRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchFromApi('/api/service-of-process');
      if (!response.ok) {
        throw new Error(`Failed to fetch service requests: ${response.statusText}`);
      }
      const data = await parseJsonResponse<ServiceRequest[]>(response, 'Service requests');
      setServiceRequests(Array.isArray(data) ? data : []);
    } catch (err: any) {
      if (isNonJsonResponse(err)) {
        setDemoMode(true);
        setServiceRequests(DEMO_SERVICE_REQUESTS);
        return;
      }
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceRequests();
  }, []);

  const handleCreateRequest = async () => {
    if (newRequest.documentName && newRequest.recipient) {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetchFromApi('/api/service-of-process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newRequest),
        });
        if (!response.ok) {
          throw new Error(`Failed to create service request: ${response.statusText}`);
        }
        setNewRequest({ documentName: '', recipient: '' });
        fetchServiceRequests();
      } catch (err: any) {
        if (isNonJsonResponse(err)) {
          setDemoMode(true);
          setServiceRequests((prev) => [
            ...prev,
            {
              id: `demo-${Date.now()}`,
              documentName: newRequest.documentName,
              recipient: newRequest.recipient,
              status: 'Pending',
            },
          ]);
          setNewRequest({ documentName: '', recipient: '' });
          return;
        }
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="bg-background-canvas text-text-primary min-h-screen p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="panel-shell"
      >
        <header>
          <p className="panel-eyebrow">Operations / Service of Process</p>
          <h2 className="text-holographic">Service of Process Control</h2>
          <p className="panel-subtitle">
            Track service tasks, manage court delivery vendors, and keep a clean chain-of-custody audit.
          </p>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 card-cinematic p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Live Service Requests</h3>
                <p className="text-text-secondary text-sm">Status, recipients, and proof returns.</p>
              </div>
              {demoMode && (
                <span className="status-pill warning">Offline Demo</span>
              )}
            </div>
            <div className="divider-cinematic" />
            {isLoading && <p className="text-text-secondary">Loading...</p>}
            {error && <p className="text-red-400 text-sm mt-2">Error: {error}</p>}
            <ul className="mt-4 space-y-4">
              {serviceRequests.map((request) => (
                <li key={request.id} className="glass-panel p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{request.documentName}</p>
                    <p className="text-text-secondary text-sm">Recipient: {request.recipient}</p>
                  </div>
                  <span className={statusTone[request.status]}>{request.status}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="card-cinematic p-6">
            <h3 className="text-lg font-semibold">Create New Request</h3>
            <p className="text-text-secondary text-sm">Route new documents to your service partners.</p>
            <div className="divider-cinematic" />
            <div className="space-y-4">
              <div>
                <label htmlFor="service-document" className="panel-label">Document Name</label>
                <input
                  id="service-document"
                  type="text"
                  placeholder="Summons & Complaint"
                  value={newRequest.documentName}
                  onChange={(e) => setNewRequest({ ...newRequest, documentName: e.target.value })}
                  className="input-cinematic w-full"
                />
              </div>
              <div>
                <label htmlFor="service-recipient" className="panel-label">Recipient</label>
                <input
                  id="service-recipient"
                  type="text"
                  placeholder="Process server / sheriff / courier"
                  value={newRequest.recipient}
                  onChange={(e) => setNewRequest({ ...newRequest, recipient: e.target.value })}
                  className="input-cinematic w-full"
                />
              </div>
              <button
                onClick={handleCreateRequest}
                className="btn-cinematic w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Dispatch Request'}
              </button>
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
