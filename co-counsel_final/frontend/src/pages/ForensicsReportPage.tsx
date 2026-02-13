import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  CryptoTracingResult,
  exportForensicsReport,
  ForensicsAuditEvent,
  ForensicsReportVersion,
  getFinancialForensics,
  getForensicsAudit,
  getForensicsHistory,
  ForensicsResponse,
  getCryptoTracing,
  getForensicAnalysis,
  getImageForensics,
} from '@/services/forensics_api';
import CryptoGraphViewer from '@/components/CryptoGraphViewer';

const ForensicsReportPage: React.FC = () => {
  const { caseId, docType, docId } = useParams<{ caseId: string; docType: string; docId: string }>();
  const [forensicResults, setForensicResults] = useState<ForensicsResponse | null>(null);
  const [imageResults, setImageResults] = useState<ForensicsResponse | null>(null);
  const [financialResults, setFinancialResults] = useState<ForensicsResponse | null>(null);
  const [cryptoTracingResults, setCryptoTracingResults] = useState<CryptoTracingResult | null>(null);
  const [activeTab, setActiveTab] = useState<'document' | 'image' | 'financial' | 'crypto'>('document');
  const [history, setHistory] = useState<ForensicsReportVersion[]>([]);
  const [auditEvents, setAuditEvents] = useState<ForensicsAuditEvent[]>([]);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [exportBusy, setExportBusy] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const [documentOutcome, imageOutcome, financialOutcome, cryptoOutcome] = await Promise.allSettled([
          getForensicAnalysis(caseId!, docType!, docId!),
          getImageForensics(caseId!, docType!, docId!),
          getFinancialForensics(caseId!, docType!, docId!),
          getCryptoTracing(caseId!, docType!, docId!),
        ]);
        if (documentOutcome.status === 'fulfilled') {
          setForensicResults(documentOutcome.value);
        }
        if (imageOutcome.status === 'fulfilled') {
          setImageResults(imageOutcome.value);
        }
        if (financialOutcome.status === 'fulfilled') {
          setFinancialResults(financialOutcome.value);
        }
        if (cryptoOutcome.status === 'fulfilled') {
          setCryptoTracingResults(cryptoOutcome.value);
        }
        const [historyOutcome, auditOutcome] = await Promise.allSettled([
          getForensicsHistory(caseId!, docType!, docId!, 30),
          getForensicsAudit(caseId!, docType!, docId!, 60),
        ]);
        if (historyOutcome.status === 'fulfilled') {
          setHistory(historyOutcome.value.versions ?? []);
        }
        if (auditOutcome.status === 'fulfilled') {
          setAuditEvents(auditOutcome.value.events ?? []);
        }
        if (historyOutcome.status === 'rejected' || auditOutcome.status === 'rejected') {
          setMetaError('History/audit metadata unavailable for this document.');
        } else {
          setMetaError(null);
        }

        const allFailed =
          documentOutcome.status === 'rejected' &&
          imageOutcome.status === 'rejected' &&
          financialOutcome.status === 'rejected' &&
          cryptoOutcome.status === 'rejected';
        if (allFailed) {
          setError('Failed to load forensic report. Please try again.');
        }
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
    return <div className="panel-shell">Loading forensic report...</div>;
  }

  if (error) {
    return <div className="panel-shell error-text">{error}</div>;
  }

  if (!forensicResults && !imageResults && !financialResults && !cryptoTracingResults) {
    return <div className="panel-shell">No forensic or crypto tracing results found for this document.</div>;
  }

  const hashes = forensicResults?.data?.hashes as { sha256?: string } | undefined;
  const analysis = forensicResults?.data?.analysis as Record<string, unknown> | undefined;
  const imageSignals = imageResults?.signals ?? [];
  const financialSignals = financialResults?.signals ?? [];
  const triggerExport = async (format: 'json' | 'md' | 'html') => {
    try {
      setExportBusy(true);
      const response = await exportForensicsReport(caseId!, docType!, docId!, { format });
      const url = response.download_url.startsWith('http')
        ? response.download_url
        : `${window.location.origin}${response.download_url}`;
      window.open(url, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Forensics export failed.');
    } finally {
      setExportBusy(false);
    }
  };

  return (
    <section className="panel-shell forensics-report">
      <header>
        <h2>Forensic Report</h2>
        <p className="panel-subtitle">Document: {docId}</p>
        <div className="presentation-actions">
          <button className="btn-cinematic btn-secondary" disabled={exportBusy} onClick={() => void triggerExport('json')}>
            Export JSON
          </button>
          <button className="btn-cinematic btn-secondary" disabled={exportBusy} onClick={() => void triggerExport('md')}>
            Export MD
          </button>
          <button className="btn-cinematic btn-secondary" disabled={exportBusy} onClick={() => void triggerExport('html')}>
            Export HTML
          </button>
        </div>
        {metaError && <p className="error-text">{metaError}</p>}
        <div className="presentation-phase-picker" role="tablist" aria-label="Forensics views">
          <button type="button" className={`phase-chip ${activeTab === 'document' ? 'active' : ''}`} onClick={() => setActiveTab('document')}>
            Document
          </button>
          <button type="button" className={`phase-chip ${activeTab === 'image' ? 'active' : ''}`} onClick={() => setActiveTab('image')}>
            Image
          </button>
          <button type="button" className={`phase-chip ${activeTab === 'financial' ? 'active' : ''}`} onClick={() => setActiveTab('financial')}>
            Financial
          </button>
          <button type="button" className={`phase-chip ${activeTab === 'crypto' ? 'active' : ''}`} onClick={() => setActiveTab('crypto')}>
            Crypto
          </button>
        </div>
      </header>

      {forensicResults && activeTab === 'document' && (
        <Card className="forensics-report__card">
          <CardHeader>
            <CardTitle>Forensic Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="forensics-report__summary">Summary: {forensicResults.summary}</p>
            <p className="panel-subtitle">Schema: {forensicResults.schema_version}</p>
            <p className="panel-subtitle">Fallback applied: {forensicResults.fallback_applied ? 'Yes' : 'No'}</p>

            {hashes?.sha256 && (
              <>
                <Separator className="my-4" />
                <h3>Hashes</h3>
                <p><strong>SHA-256:</strong> {hashes.sha256}</p>
              </>
            )}

            {analysis && (
              <>
                <Separator className="my-4" />
                <h3>Analysis Highlights</h3>
                <pre className="forensics-report__code">
                  {JSON.stringify(analysis, null, 2)}
                </pre>
              </>
            )}

            {forensicResults.signals.length > 0 && (
              <>
                <Separator className="my-4" />
                <h3>Signals</h3>
                <ul>
                  {forensicResults.signals.map((signal, index) => (
                    <li key={index}>
                      <strong>{signal.type}</strong> ({signal.level}): {signal.detail}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {imageResults && activeTab === 'image' && (
        <Card className="forensics-report__card">
          <CardHeader>
            <CardTitle>Image Authenticity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="forensics-report__summary">{imageResults.summary}</p>
            <p className="panel-subtitle">Schema: {imageResults.schema_version}</p>
            <p className="panel-subtitle">Fallback applied: {imageResults.fallback_applied ? 'Yes' : 'No'}</p>
            {Object.keys(imageResults.metadata ?? {}).length > 0 && (
              <div className="forensics-report__section">
                <h3>Metadata</h3>
                <pre className="forensics-report__code">{JSON.stringify(imageResults.metadata, null, 2)}</pre>
              </div>
            )}
            {imageSignals.length > 0 && (
              <div className="forensics-report__section">
                <h3>Authenticity Signals</h3>
                <ul>
                  {imageSignals.map((signal, index) => (
                    <li key={`image-${index}`}>
                      <strong>{signal.type}</strong> ({signal.level}): {signal.detail}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {financialResults && activeTab === 'financial' && (
        <Card className="forensics-report__card">
          <CardHeader>
            <CardTitle>Financial / Metadata Forensics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="forensics-report__summary">{financialResults.summary}</p>
            <p className="panel-subtitle">Schema: {financialResults.schema_version}</p>
            <p className="panel-subtitle">Fallback applied: {financialResults.fallback_applied ? 'Yes' : 'No'}</p>
            {Object.keys(financialResults.data ?? {}).length > 0 && (
              <div className="forensics-report__section">
                <h3>Ledger / Statement Analysis</h3>
                <pre className="forensics-report__code">{JSON.stringify(financialResults.data, null, 2)}</pre>
              </div>
            )}
            {financialSignals.length > 0 && (
              <div className="forensics-report__section">
                <h3>Risk Signals</h3>
                <ul>
                  {financialSignals.map((signal, index) => (
                    <li key={`financial-${index}`}>
                      <strong>{signal.type}</strong> ({signal.level}): {signal.detail}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {cryptoTracingResults && activeTab === 'crypto' && (
        <Card className="forensics-report__card">
          <CardHeader>
            <CardTitle>Cryptocurrency Tracing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="forensics-report__summary">{cryptoTracingResults.details}</p>

            {cryptoTracingResults.wallets_found.length > 0 && (
              <div className="forensics-report__section">
                <h3>Wallets Found</h3>
                <ul>
                  {cryptoTracingResults.wallets_found.map((wallet, index) => (
                    <li key={index}>
                      <strong>Address:</strong> {wallet.address} ({wallet.blockchain}, {wallet.currency}) - {wallet.is_valid ? 'Valid' : 'Unverified'}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {cryptoTracingResults.clusters.length > 0 && (
              <div className="forensics-report__section">
                <h3>Clusters</h3>
                {cryptoTracingResults.clusters.map((cluster) => (
                  <div key={cluster.cluster_id} className="forensics-report__cluster">
                    <div className="font-semibold">{cluster.cluster_id}</div>
                    <div>Members: {cluster.addresses.length}</div>
                    <div>Provenance: {cluster.provenance.map((prov) => prov.method).join(', ')}</div>
                  </div>
                ))}
              </div>
            )}

            {cryptoTracingResults.transactions_traced.length > 0 && (
              <div className="forensics-report__section">
                <h3>Transactions Traced</h3>
                <ul>
                  {cryptoTracingResults.transactions_traced.map((tx, index) => (
                    <li key={index}>
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
              <div className="forensics-report__section">
                <h3>Bridge Matches</h3>
                <pre className="forensics-report__code">
                  {JSON.stringify(cryptoTracingResults.bridge_matches, null, 2)}
                </pre>
              </div>
            )}

            {(cryptoTracingResults.custody_attribution ?? []).length > 0 && (
              <div className="forensics-report__section">
                <h3>Custody Attribution Leads</h3>
                <ul>
                  {(cryptoTracingResults.custody_attribution ?? []).slice(0, 12).map((lead, index) => (
                    <li key={`custody-${index}`}>
                      <strong>{String(lead.exchange ?? 'Unknown Custodian')}</strong> · Wallet {String(lead.wallet ?? 'n/a')} ·
                      Confidence {Number(lead.confidence ?? 0).toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {cryptoTracingResults.visual_graph_mermaid && (
              <div>
                <h3>Transaction Graph</h3>
                <CryptoGraphViewer mermaidDefinition={cryptoTracingResults.visual_graph_mermaid} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {(history.length > 0 || auditEvents.length > 0) && (
        <Card className="forensics-report__card">
          <CardHeader>
            <CardTitle>Forensics History & Audit</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length > 0 && (
              <div className="forensics-report__section">
                <h3>Report Versions</h3>
                <ul>
                  {history.slice(0, 10).map((item) => (
                    <li key={item.version_id}>
                      <strong>{item.version_id}</strong> ({item.source}) · {new Date(item.created_at).toLocaleString()}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {auditEvents.length > 0 && (
              <div className="forensics-report__section">
                <h3>Audit Trail</h3>
                <ul>
                  {auditEvents.slice(0, 12).map((event, idx) => (
                    <li key={`${event.event_type}-${idx}`}>
                      <strong>{event.event_type}</strong> by {event.principal_id} ·{' '}
                      {event.timestamp ? new Date(event.timestamp).toLocaleString() : 'unknown time'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </section>
  );
};

export default ForensicsReportPage;
