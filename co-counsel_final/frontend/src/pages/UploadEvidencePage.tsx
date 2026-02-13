import React, { useEffect, useMemo, useState } from 'react';
import DocumentUploadZone from '../components/DocumentUploadZone';
import { FolderUploadZone } from '../components/FolderUploadZone';
import { IngestionPipelinePanel } from '../components/IngestionPipelinePanel';
import {
  completeFileUpload,
  completeFolderUpload,
  getIngestionStatus,
  submitIngestionRequest,
  startFileUpload,
  startFolderUpload,
  uploadFileChunk,
  type FolderUploadStartResponse,
  type IngestionStatusResponse,
} from '../services/document_api';

interface UploadedDocument {
  job_id: string;
  doc_id: string;
  file_name: string;
  doc_type: string;
  ingestion_status: string;
  pipeline_result: string[];
}

type SourceMode =
  | 'single_file'
  | 'folder_directory'
  | 'web_url'
  | 'court_listener'
  | 'cloud_drive'
  | 'sharepoint'
  | 'gmail'
  | 'imap'
  | 'gdrive'
  | 'ocr_batch';

interface FailedFolderFile {
  file: File;
  relativePath: string;
  reason: string;
}

const SOURCE_OPTIONS: Array<{
  id: SourceMode;
  label: string;
  subtitle: string;
  enabled: boolean;
}> = [
  {
    id: 'single_file',
    label: 'Single File',
    subtitle: 'Rapid intake for one exhibit at a time.',
    enabled: true,
  },
  {
    id: 'folder_directory',
    label: 'Folder / Directory',
    subtitle: 'Bulk ingest evidence with full relative-path preservation.',
    enabled: true,
  },
  {
    id: 'web_url',
    label: 'Web URL',
    subtitle: 'Ingest HTTP/HTTPS content directly through web connector.',
    enabled: true,
  },
  {
    id: 'court_listener',
    label: 'CourtListener',
    subtitle: 'Connector-based court opinion ingest by source credentials.',
    enabled: true,
  },
  {
    id: 'cloud_drive',
    label: 'Cloud Drive (OneDrive/SharePoint)',
    subtitle: 'Connector ingest using cloud provider paths and credential references.',
    enabled: true,
  },
  {
    id: 'sharepoint',
    label: 'SharePoint',
    subtitle: 'LlamaHub SharePointReader connector ingest.',
    enabled: true,
  },
  {
    id: 'gmail',
    label: 'Gmail',
    subtitle: 'LlamaHub GmailReader ingest by query/label.',
    enabled: true,
  },
  {
    id: 'imap',
    label: 'IMAP Mailbox',
    subtitle: 'LlamaHub IMAPReader for enterprise mailboxes.',
    enabled: true,
  },
  {
    id: 'gdrive',
    label: 'Google Drive',
    subtitle: 'LlamaHub GoogleDriveReader folder/file ingest.',
    enabled: true,
  },
  {
    id: 'ocr_batch',
    label: 'OCR Batch (Image/PDF)',
    subtitle: 'Batch OCR ingestion for scan-heavy evidence sets.',
    enabled: true,
  },
];

const UploadEvidencePage: React.FC = () => {
  const [caseId, setCaseId] = useState('default-case-id');
  const [sourceMode, setSourceMode] = useState<SourceMode>('folder_directory');
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [folderSession, setFolderSession] = useState<FolderUploadStartResponse | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatusMap, setJobStatusMap] = useState<Record<string, IngestionStatusResponse>>({});
  const [folderProgress, setFolderProgress] = useState<{
    status: 'idle' | 'uploading' | 'complete' | 'error';
    totalFiles: number;
    uploadedFiles: number;
    failedFiles: number;
    currentFile?: string;
  }>({ status: 'idle', totalFiles: 0, uploadedFiles: 0, failedFiles: 0 });
  const [folderFailures, setFolderFailures] = useState<FailedFolderFile[]>([]);
  const [isRetryingFailures, setIsRetryingFailures] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [connectorPath, setConnectorPath] = useState('');
  const [connectorCredRef, setConnectorCredRef] = useState('');
  const [connectorMetadata, setConnectorMetadata] = useState('');
  const [connectorSubmitting, setConnectorSubmitting] = useState(false);

  const activeStatus = activeJobId ? jobStatusMap[activeJobId] : undefined;

  const validationSummary = useMemo(() => {
    if (!activeStatus) return null;
    const details = activeStatus.status_details;
    const ingestionDocs = details.ingestion.documents ?? 0;
    const skippedCount = details.ingestion.skipped?.length ?? 0;
    const totalObserved = Math.max(folderProgress.totalFiles, ingestionDocs + skippedCount, 1);
    const coverage = Math.round((ingestionDocs / totalObserved) * 100);
    const ocrArtifacts = details.forensics.artifacts.filter((artifact) => {
      const type = String(artifact.type ?? '').toLowerCase();
      return type.includes('ocr') || type.includes('image');
    }).length;
    return {
      coverage,
      skippedCount,
      ocrArtifacts,
      timelineEvents: details.timeline.events ?? 0,
      graphNodes: details.graph.nodes ?? 0,
      graphEdges: details.graph.edges ?? 0,
      graphTriples: details.graph.triples ?? 0,
      stageCount: details.stages?.length ?? 0,
    };
  }, [activeStatus, folderProgress.totalFiles]);

  const upsertJobStatus = (status: IngestionStatusResponse) => {
    setJobStatusMap((prev) => ({ ...prev, [status.job_id]: status }));
  };

  const uploadOneFolderFile = async (
    folderId: string,
    file: File,
    relativePath: string,
    chunkSizeHint: number
  ) => {
    const fileSession = await startFileUpload(folderId, relativePath, file.size);
    const chunkSize = fileSession.chunk_size || chunkSizeHint;
    let offset = 0;
    let chunkIndex = 0;
    while (offset < file.size) {
      const slice = file.slice(offset, offset + chunkSize);
      await uploadFileChunk(fileSession.upload_id, chunkIndex, slice);
      offset += chunkSize;
      chunkIndex += 1;
    }
    await completeFileUpload(fileSession.upload_id);
  };

  const handleUploadSuccess = (response: any) => {
    setUploadedDocuments((prevDocs) => [
      ...prevDocs,
      {
        job_id: response.data.job_id,
        doc_id: response.data.doc_id,
        file_name: response.data.file_name,
        doc_type: response.data.doc_type,
        ingestion_status: response.data.ingestion_status,
        pipeline_result: response.data.pipeline_result,
      },
    ]);
    setActiveJobId(response.data.job_id);
    setMessage({ type: 'success', text: response.message });
  };

  const handleUploadError = (error: any) => {
    setMessage({ type: 'error', text: `Upload failed: ${error.response?.data?.detail || error.message}` });
  };

  const handleFolderStart = async (
    folderName: string,
    docType: 'my_documents' | 'opposition_documents',
    files: FileList
  ) => {
    setFolderFailures([]);
    try {
      const response = await startFolderUpload(folderName, docType);
      setFolderSession(response);
      setCaseId(response.case_id);
      setFolderProgress({
        status: 'uploading',
        totalFiles: files.length,
        uploadedFiles: 0,
        failedFiles: 0,
      });
      setMessage({ type: 'success', text: `Folder session started for ${folderName}` });

      const failed: FailedFolderFile[] = [];
      const fileList = Array.from(files);
      for (const file of fileList) {
        const relativePath =
          (file as unknown as { webkitRelativePath?: string }).webkitRelativePath || file.name;
        setFolderProgress((prev) => ({ ...prev, currentFile: relativePath }));
        try {
          await uploadOneFolderFile(response.folder_id, file, relativePath, response.chunk_size);
          setFolderProgress((prev) => ({ ...prev, uploadedFiles: prev.uploadedFiles + 1 }));
        } catch (error: any) {
          failed.push({
            file,
            relativePath,
            reason: error?.response?.data?.detail || error?.message || 'File upload failed',
          });
          setFolderProgress((prev) => ({ ...prev, failedFiles: prev.failedFiles + 1 }));
        }
      }

      setFolderFailures(failed);
      const ingestion = await completeFolderUpload(response.folder_id);
      upsertJobStatus(ingestion);
      setActiveJobId(ingestion.job_id);
      setMessage({
        type: failed.length > 0 ? 'error' : 'success',
        text:
          failed.length > 0
            ? `Folder upload completed with ${failed.length} failed file(s). Ingestion job ${ingestion.job_id} queued.`
            : `Folder upload complete. Ingestion job ${ingestion.job_id} queued.`,
      });
      setFolderProgress((prev) => ({ ...prev, status: failed.length > 0 ? 'error' : 'complete' }));
    } catch (error: any) {
      setFolderProgress((prev) => ({ ...prev, status: 'error' }));
      setMessage({ type: 'error', text: `Folder upload failed: ${error.response?.data?.detail || error.message}` });
    }
  };

  const handleRetryFailedFiles = async () => {
    if (!folderSession || folderFailures.length === 0) return;
    setIsRetryingFailures(true);
    const stillFailing: FailedFolderFile[] = [];
    for (const failed of folderFailures) {
      setFolderProgress((prev) => ({ ...prev, currentFile: failed.relativePath }));
      try {
        await uploadOneFolderFile(folderSession.folder_id, failed.file, failed.relativePath, folderSession.chunk_size);
        setFolderProgress((prev) => ({
          ...prev,
          uploadedFiles: prev.uploadedFiles + 1,
          failedFiles: Math.max(prev.failedFiles - 1, 0),
        }));
      } catch (error: any) {
        stillFailing.push({
          file: failed.file,
          relativePath: failed.relativePath,
          reason: error?.response?.data?.detail || error?.message || 'Retry failed',
        });
      }
    }
    setFolderFailures(stillFailing);
    setIsRetryingFailures(false);
    setMessage({
      type: stillFailing.length > 0 ? 'error' : 'success',
      text:
        stillFailing.length > 0
          ? `${stillFailing.length} file(s) still failing after retry.`
          : 'All failed folder files recovered successfully.',
    });
  };

  const handleConnectorSubmit = async () => {
    const connectorType =
      sourceMode === 'web_url'
        ? 'web'
        : sourceMode === 'court_listener'
          ? 'courtlistener'
        : sourceMode === 'cloud_drive'
            ? 'onedrive'
          : sourceMode === 'sharepoint'
            ? 'sharepoint'
            : sourceMode === 'gmail'
              ? 'gmail'
              : sourceMode === 'imap'
                ? 'imap'
                : sourceMode === 'gdrive'
                  ? 'gdrive'
                  : sourceMode === 'ocr_batch'
                    ? 'local'
            : null;
    if (!connectorType) return;
    if (!connectorPath.trim()) {
      setMessage({ type: 'error', text: 'Connector path is required.' });
      return;
    }
    setConnectorSubmitting(true);
    try {
      let metadata: Record<string, unknown> | undefined;
      if (connectorMetadata.trim()) {
        metadata = JSON.parse(connectorMetadata);
      }
      const response = await submitIngestionRequest({
        sources: [
          {
            type: connectorType,
            path: connectorPath.trim(),
            credRef: connectorCredRef.trim() || undefined,
            metadata,
          },
        ],
      });
      setActiveJobId(response.job_id);
      setMessage({
        type: 'success',
        text: `Connector ingestion queued successfully: ${response.job_id}`,
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `Connector ingestion failed: ${error?.response?.data?.detail || error?.message}`,
      });
    } finally {
      setConnectorSubmitting(false);
    }
  };

  useEffect(() => {
    const jobIds = new Set<string>();
    uploadedDocuments.forEach((doc) => {
      if (doc.ingestion_status === 'queued' || doc.ingestion_status === 'running') {
        jobIds.add(doc.job_id);
      }
    });
    if (activeJobId) {
      jobIds.add(activeJobId);
    }
    if (jobIds.size === 0) return;

    const interval = setInterval(async () => {
      await Promise.all(
        Array.from(jobIds).map(async (jobId) => {
          try {
            const status = await getIngestionStatus(jobId);
            upsertJobStatus(status);
            setUploadedDocuments((prevDocs) =>
              prevDocs.map((prevDoc) =>
                prevDoc.job_id === jobId ? { ...prevDoc, ingestion_status: status.status } : prevDoc
              )
            );
          } catch {
            // Keep polling resilient; individual failures should not kill the loop.
          }
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [uploadedDocuments, activeJobId]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Evidence Ingestion Command</h1>

      {message && (
        <div
          className={`p-3 mb-4 rounded-md ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="panel-shell mb-4">
        <h3 className="text-lg font-semibold">Source Type</h3>
        <p className="text-sm text-text-secondary mt-1">
          Choose ingestion source and pipeline entrypoint. Manual stage triggers remain available after queueing.
        </p>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {SOURCE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              disabled={!option.enabled}
              onClick={() => option.enabled && setSourceMode(option.id)}
              className={`rounded-md border p-3 text-left transition ${
                sourceMode === option.id
                  ? 'border-cyan-400 bg-cyan-950/40'
                  : 'border-border/60 bg-background-surface/40'
              } ${option.enabled ? '' : 'opacity-50 cursor-not-allowed'}`}
            >
              <p className="text-sm font-semibold text-text-primary">{option.label}</p>
              <p className="text-xs text-text-secondary mt-1">{option.subtitle}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="caseId" className="block text-sm font-medium text-gray-700">
          Case ID:
        </label>
        <input
          type="text"
          id="caseId"
          className="mt-1 block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          value={caseId}
          onChange={(e) => setCaseId(e.target.value)}
        />
        {folderSession && (
          <p className="mt-2 text-xs text-gray-500">Auto-created case from folder upload: {folderSession.case_id}</p>
        )}
      </div>

      {sourceMode === 'single_file' && (
        <DocumentUploadZone caseId={caseId} onUploadSuccess={handleUploadSuccess} onUploadError={handleUploadError} />
      )}

      {sourceMode === 'folder_directory' && (
        <div className="mt-2">
          <FolderUploadZone onFolderStart={handleFolderStart} />
          {folderProgress.status !== 'idle' && (
            <div className="mt-4 rounded-md border border-gray-200 bg-white p-3 text-sm">
              <p className="font-medium">Folder Upload Status</p>
              <p className="text-gray-600">
                {folderProgress.uploadedFiles}/{folderProgress.totalFiles} files uploaded
              </p>
              <p className="text-gray-600">Failed files: {folderProgress.failedFiles}</p>
              {folderProgress.currentFile && <p className="text-gray-500">Current: {folderProgress.currentFile}</p>}
              {folderProgress.status === 'complete' && (
                <p className="text-green-700 mt-1">Upload complete. Ingestion started.</p>
              )}
              {folderProgress.status === 'error' && (
                <p className="text-red-600 mt-1">Upload completed with recoverable failures.</p>
              )}
              {folderFailures.length > 0 && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={handleRetryFailedFiles}
                    disabled={isRetryingFailures}
                    className="btn-cinematic btn-secondary"
                  >
                    {isRetryingFailures ? 'Retrying failed files...' : `Retry Failed Files (${folderFailures.length})`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {sourceMode !== 'single_file' && sourceMode !== 'folder_directory' && (
        <div className="panel-shell mt-4">
          <h3 className="text-lg font-semibold">Connector Ingestion</h3>
          <p className="text-sm text-text-secondary mt-2">
            Submit a connector-backed ingestion source. Use `credRef` for authenticated providers.
          </p>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-text-secondary">Path / URL</label>
              <input
                type="text"
                className="input-cinematic w-full mt-1"
                value={connectorPath}
                onChange={(event) => setConnectorPath(event.target.value)}
                placeholder={
                  sourceMode === 'web_url'
                    ? 'https://example.com/filing'
                    : sourceMode === 'court_listener'
                      ? 'https://www.courtlistener.com/api/rest/v3/opinions/?q=family+law'
                      : sourceMode === 'sharepoint'
                        ? '/Shared Documents/CaseFiles'
                        : sourceMode === 'gmail'
                          ? 'in:inbox subject:"dissolution"'
                          : sourceMode === 'imap'
                            ? 'INBOX/Legal'
                            : sourceMode === 'gdrive'
                              ? 'folder_id_or_file_ids'
                              : sourceMode === 'ocr_batch'
                                ? '/uploads/scanned-intake'
                                : '/drive/root:/CaseFiles'
                }
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-text-secondary">Credential Ref (optional)</label>
              <input
                type="text"
                className="input-cinematic w-full mt-1"
                value={connectorCredRef}
                onChange={(event) => setConnectorCredRef(event.target.value)}
                placeholder="cred:onedrive-main"
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-xs uppercase tracking-[0.2em] text-text-secondary">Metadata JSON (optional)</label>
            <textarea
              className="input-cinematic w-full mt-1"
              rows={4}
              value={connectorMetadata}
              onChange={(event) => setConnectorMetadata(event.target.value)}
              placeholder='{"jurisdiction":"CA","matter":"family"}'
            />
          </div>
          <div className="mt-3">
            <button type="button" className="btn-cinematic" onClick={handleConnectorSubmit} disabled={connectorSubmitting}>
              {connectorSubmitting ? 'Queueing...' : 'Queue Connector Ingestion'}
            </button>
          </div>
        </div>
      )}

      <div className="mt-6">
        <IngestionPipelinePanel
          jobId={activeJobId}
          status={activeStatus ?? null}
          onStatusUpdate={(status) => {
            upsertJobStatus(status);
            setActiveJobId(status.job_id);
          }}
        />
      </div>

      {validationSummary && (
        <div className="panel-shell mt-6">
          <h3 className="text-lg font-semibold">Ingestion Validation Report</h3>
          <p className="text-sm text-text-secondary mt-1">
            Coverage, skipped files, OCR activity, and graph/timeline propagation for job {activeStatus?.job_id}.
          </p>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="glass-panel p-3">
              <p className="text-xs text-text-secondary">Coverage</p>
              <p className="text-lg font-semibold">{validationSummary.coverage}%</p>
            </div>
            <div className="glass-panel p-3">
              <p className="text-xs text-text-secondary">Skipped</p>
              <p className="text-lg font-semibold">{validationSummary.skippedCount}</p>
            </div>
            <div className="glass-panel p-3">
              <p className="text-xs text-text-secondary">OCR Artifacts</p>
              <p className="text-lg font-semibold">{validationSummary.ocrArtifacts}</p>
            </div>
            <div className="glass-panel p-3">
              <p className="text-xs text-text-secondary">Stages</p>
              <p className="text-lg font-semibold">{validationSummary.stageCount}</p>
            </div>
            <div className="glass-panel p-3">
              <p className="text-xs text-text-secondary">Timeline Events</p>
              <p className="text-lg font-semibold">{validationSummary.timelineEvents}</p>
            </div>
            <div className="glass-panel p-3">
              <p className="text-xs text-text-secondary">Graph Nodes</p>
              <p className="text-lg font-semibold">{validationSummary.graphNodes}</p>
            </div>
            <div className="glass-panel p-3">
              <p className="text-xs text-text-secondary">Graph Edges</p>
              <p className="text-lg font-semibold">{validationSummary.graphEdges}</p>
            </div>
            <div className="glass-panel p-3">
              <p className="text-xs text-text-secondary">Triples</p>
              <p className="text-lg font-semibold">{validationSummary.graphTriples}</p>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-xl font-bold mt-8 mb-4">Uploaded Documents</h2>
      {uploadedDocuments.length === 0 ? (
        <p>No documents uploaded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categories
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doc ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job ID
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {uploadedDocuments.map((doc) => (
                <tr key={doc.doc_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{doc.file_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doc.doc_type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.ingestion_status}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.pipeline_result.join(', ')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.doc_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.job_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UploadEvidencePage;
