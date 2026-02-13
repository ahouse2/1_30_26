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
    <div className="bg-background-canvas text-text-primary h-screen p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="panel-shell"
      >
        <header>
          <h2>Service of Process</h2>
          <p className="panel-subtitle">Manage and track your service of process requests.</p>
        </header>
        <div className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold">Service Requests</h3>
              {demoMode && (
                <p className="text-xs uppercase tracking-[0.4em] text-accent-gold mt-2">
                  Demo service requests (offline)
                </p>
              )}
              {isLoading && <p>Loading...</p>}
              {error && <p className="text-red-500 text-sm mt-2">Error: {error}</p>}
              <ul className="mt-4 space-y-4">
                {serviceRequests.map((request) => (
                  <li key={request.id} className="bg-background-surface p-4 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{request.documentName}</p>
                      <p className="text-text-secondary">Recipient: {request.recipient}</p>
                    </div>
                    <p className={`font-semibold ${
                      request.status === 'Served' ? 'text-accent-green' :
                      request.status === 'Failed' ? 'text-accent-red' : 'text-text-secondary'
                    }`}>{request.status}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold">New Request</h3>
              <div className="mt-4 space-y-4">
                <input
                  type="text"
                  placeholder="Document Name"
                  value={newRequest.documentName}
                  onChange={(e) => setNewRequest({ ...newRequest, documentName: e.target.value })}
                  className="w-full p-2 bg-background-surface border border-border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Recipient"
                  value={newRequest.recipient}
                  onChange={(e) => setNewRequest({ ...newRequest, recipient: e.target.value })}
                  className="w-full p-2 bg-background-surface border border-border rounded-lg"
                />
                <button
                  onClick={handleCreateRequest}
                  className="w-full bg-accent-violet-500 text-white py-2 px-4 rounded-lg hover:bg-accent-violet-600 transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
