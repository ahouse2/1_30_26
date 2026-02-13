import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  CryptoTracingResult,
  ForensicsResponse,
  getCryptoTracing,
  getForensicAnalysis,
} from '@/services/forensics_api';
import CryptoGraphViewer from '@/components/CryptoGraphViewer';

const ForensicsReportPage: React.FC = () => {
  const { caseId, docType, docId } = useParams<'caseId' | 'docType' | 'docId'>();
  const [forensicResults, setForensicResults] = useState<ForensicsResponse | null>(null);
  const [cryptoTracingResults, setCryptoTracingResults] = useState<CryptoTracingResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const forensicData = await getForensicAnalysis(caseId!, docType!, docId!);
        setForensicResults(forensicData);

        const cryptoData = await getCryptoTracing(caseId!, docType!, docId!);
        setCryptoTracingResults(cryptoData);
      } catch (err) {
        console.error('Failed to fetch forensic data:', err);
        setError('Failed to load forensic report. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (caseId && docType && docId) {
      fetchResults();
    }
  }, [caseId, docType, docId]);

  if (loading) {
    return <div className="p-4 text-center">Loading forensic report...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  if (!forensicResults && !cryptoTracingResults) {
    return <div className="p-4 text-center">No forensic or crypto tracing results found for this document.</div>;
  }

  const hashes = forensicResults?.data?.hashes as { sha256?: string } | undefined;
  const analysis = forensicResults?.data?.analysis as Record<string, unknown> | undefined;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Forensic Report for Document: {docId}</h1>

      {forensicResults && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Forensic Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold mb-2">Summary: {forensicResults.summary}</p>
            <p className="text-sm text-gray-500 mb-4">Schema: {forensicResults.schema_version}</p>
            <p className="text-sm text-gray-500 mb-4">Fallback applied: {forensicResults.fallback_applied ? 'Yes' : 'No'}</p>

            {hashes?.sha256 && (
              <>
                <Separator className="my-4" />
                <h3 className="text-xl font-semibold mb-2">Hashes</h3>
                <p><strong>SHA-256:</strong> {hashes.sha256}</p>
              </>
            )}

            {analysis && (
              <>
                <Separator className="my-4" />
                <h3 className="text-xl font-semibold mb-2">Analysis Highlights</h3>
                <pre className="text-xs bg-gray-50 p-3 rounded border overflow-auto">
                  {JSON.stringify(analysis, null, 2)}
                </pre>
              </>
            )}

            {forensicResults.signals.length > 0 && (
              <>
                <Separator className="my-4" />
                <h3 className="text-xl font-semibold mb-2">Signals</h3>
                <ul>
                  {forensicResults.signals.map((signal, index) => (
                    <li key={index} className="mb-2 text-sm">
                      <strong>{signal.type}</strong> ({signal.level}): {signal.detail}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {cryptoTracingResults && (
        <Card>
          <CardHeader>
            <CardTitle>Cryptocurrency Tracing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold mb-2">{cryptoTracingResults.details}</p>

            {cryptoTracingResults.wallets_found.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">Wallets Found</h3>
                <ul>
                  {cryptoTracingResults.wallets_found.map((wallet, index) => (
                    <li key={index} className="mb-1">
                      <strong>Address:</strong> {wallet.address} ({wallet.blockchain}, {wallet.currency}) - {wallet.is_valid ? 'Valid' : 'Unverified'}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {cryptoTracingResults.clusters.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">Clusters</h3>
                {cryptoTracingResults.clusters.map((cluster) => (
                  <div key={cluster.cluster_id} className="mb-3 text-sm">
                    <div className="font-semibold">{cluster.cluster_id}</div>
                    <div>Members: {cluster.addresses.length}</div>
                    <div>Provenance: {cluster.provenance.map((prov) => prov.method).join(', ')}</div>
                  </div>
                ))}
              </div>
            )}

            {cryptoTracingResults.transactions_traced.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">Transactions Traced</h3>
                <ul>
                  {cryptoTracingResults.transactions_traced.map((tx, index) => (
                    <li key={index} className="mb-1 text-sm">
                      <strong>Tx ID:</strong> {tx.tx_id} <br />
                      <strong>From:</strong> {tx.sender} <br />
                      <strong>To:</strong> {tx.receiver} <br />
                      <strong>Amount:</strong> {tx.amount} {tx.currency} ({tx.blockchain}) <br />
                      <strong>Timestamp:</strong> {new Date(tx.timestamp).toLocaleString()}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {cryptoTracingResults.bridge_matches.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">Bridge Matches</h3>
                <pre className="text-xs bg-gray-50 p-3 rounded border overflow-auto">
                  {JSON.stringify(cryptoTracingResults.bridge_matches, null, 2)}
                </pre>
              </div>
            )}

            {cryptoTracingResults.visual_graph_mermaid && (
              <div>
                <h3 className="text-xl font-semibold mb-2">Transaction Graph</h3>
                <CryptoGraphViewer mermaidDefinition={cryptoTracingResults.visual_graph_mermaid} />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ForensicsReportPage;
