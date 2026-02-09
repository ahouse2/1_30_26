import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchFromApi, parseJsonResponse } from '@/apiClient';

interface Evidence {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'video' | 'my_documents' | 'opposition_documents';
  url: string;
}

interface Case {
  id: string;
}

const DEMO_CASES: Case[] = [
  { id: 'Case Alpha' },
  { id: 'Case Delta' },
  { id: 'Case Orion' },
];

const DEMO_EVIDENCE: Record<string, Evidence[]> = {
  'Case Alpha': [
    { id: 'alpha-1', name: 'Exhibit A - Surveillance Still', type: 'image', url: 'https://via.placeholder.com/1200x720.png?text=Exhibit+A' },
    { id: 'alpha-2', name: 'Exhibit B - Contract PDF', type: 'pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
  ],
  'Case Delta': [
    { id: 'delta-1', name: 'Exhibit D - Courtroom Clip', type: 'video', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm' },
  ],
  'Case Orion': [
    { id: 'orion-1', name: 'Exhibit O - Chain of Custody', type: 'my_documents', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
  ],
};

const isNonJsonResponse = (err: unknown) =>
  err instanceof Error && err.message.toLowerCase().includes('unexpected response');

export default function InCourtPresentationPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  const fetchCases = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchFromApi('/api/cases');
      if (!response.ok) {
        throw new Error(`Failed to fetch cases: ${response.statusText}`);
      }
      const data = await parseJsonResponse<Case[]>(response, 'Cases');
      setCases(Array.isArray(data) ? data : []);
    } catch (err: any) {
      if (isNonJsonResponse(err)) {
        setDemoMode(true);
        setCases(DEMO_CASES);
        setSelectedCase(DEMO_CASES[0] ?? null);
        return;
      }
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvidence = async (caseId: string) => {
    if (demoMode) {
      setEvidence(DEMO_EVIDENCE[caseId] ?? []);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchFromApi(`/api/${caseId}/documents`);
      if (!response.ok) {
        throw new Error(`Failed to fetch evidence: ${response.statusText}`);
      }
      const data = await parseJsonResponse<Evidence[]>(response, 'Evidence');
      setEvidence(Array.isArray(data) ? data : []);
    } catch (err: any) {
      if (isNonJsonResponse(err)) {
        setDemoMode(true);
        setEvidence(DEMO_EVIDENCE[caseId] ?? []);
        return;
      }
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  useEffect(() => {
    if (selectedCase) {
      fetchEvidence(selectedCase.id);
    }
  }, [selectedCase]);

  return (
    <div className="bg-background-canvas text-text-primary h-screen p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="panel-shell"
      >
        <header>
          <h2>In-Court Presentation</h2>
          <p className="panel-subtitle">Present your evidence with clarity and impact.</p>
        </header>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <h3 className="text-lg font-semibold">Cases</h3>
            {demoMode && (
              <p className="text-xs uppercase tracking-[0.4em] text-accent-gold mt-2">
                Demo cases (offline)
              </p>
            )}
            {isLoading && <p>Loading...</p>}
            {error && <p className="text-red-500 text-sm mt-2">Error: {error}</p>}
            <ul className="mt-4 space-y-2">
              {cases.map((caseItem) => (
                <li
                  key={caseItem.id}
                  className={`bg-background-surface p-2 rounded-lg cursor-pointer ${
                    selectedCase?.id === caseItem.id ? 'bg-accent-violet-500/50' : ''
                  }`}
                  onClick={() => setSelectedCase(caseItem)}
                >
                  {caseItem.id}
                </li>
              ))}
            </ul>
            <h3 className="text-lg font-semibold mt-8">Evidence</h3>
            {isLoading && <p>Loading...</p>}
            {error && <p className="text-red-500 text-sm mt-2">Error: {error}</p>}
            <ul className="mt-4 space-y-2">
              {evidence.map((item) => (
                <li
                  key={item.id}
                  className={`bg-background-surface p-2 rounded-lg cursor-pointer ${
                    selectedEvidence?.id === item.id ? 'bg-accent-violet-500/50' : ''
                  }`}
                  onClick={() => setSelectedEvidence(item)}
                >
                  {item.name}
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-3 bg-background-surface p-4 rounded-lg">
            {selectedEvidence ? (
              <div>
                {selectedEvidence.type === 'image' && (
                  <img src={selectedEvidence.url} alt={selectedEvidence.name} className="w-full h-full object-contain" />
                )}
                {selectedEvidence.type === 'pdf' && (
                  <iframe src={selectedEvidence.url} className="w-full h-full" />
                )}
                {selectedEvidence.type === 'video' && (
                  <video src={selectedEvidence.url} controls className="w-full h-full" />
                )}
                {(selectedEvidence.type === 'my_documents' || selectedEvidence.type === 'opposition_documents') && (
                    <iframe src={selectedEvidence.url} className="w-full h-full" />
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p>Select a case and then an exhibit to present.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
