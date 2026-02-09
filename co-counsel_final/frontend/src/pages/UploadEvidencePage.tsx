import React, { useEffect, useState } from 'react';
import DocumentUploadZone from '../components/DocumentUploadZone';
import { FolderUploadZone } from '../components/FolderUploadZone';
import { IngestionPipelinePanel } from '../components/IngestionPipelinePanel';
import {
  completeFileUpload,
  completeFolderUpload,
  getIngestionStatus,
  startFileUpload,
  startFolderUpload,
  uploadFileChunk,
  type FolderUploadStartResponse,
} from '../services/document_api';

interface UploadedDocument {
  job_id: string;
  doc_id: string;
  file_name: string;
  doc_type: string;
  ingestion_status: string;
  pipeline_result: string[];
}

const UploadEvidencePage: React.FC = () => {
  const [caseId, setCaseId] = useState('default-case-id'); // Placeholder for case ID
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [folderSession, setFolderSession] = useState<FolderUploadStartResponse | null>(null);
  const [folderProgress, setFolderProgress] = useState<{
    status: 'idle' | 'uploading' | 'complete' | 'error';
    totalFiles: number;
    uploadedFiles: number;
    currentFile?: string;
  }>({ status: 'idle', totalFiles: 0, uploadedFiles: 0 });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUploadSuccess = (response: any) => {
    setUploadedDocuments((prevDocs) => [...prevDocs, {
      job_id: response.data.job_id,
      doc_id: response.data.doc_id,
      file_name: response.data.file_name,
      doc_type: response.data.doc_type,
      ingestion_status: response.data.ingestion_status,
      pipeline_result: response.data.pipeline_result,
    }]);
    setMessage({ type: 'success', text: response.message });
  };

  const handleUploadError = (error: any) => {
    console.error('Upload error:', error);
    setMessage({ type: 'error', text: `Upload failed: ${error.response?.data?.detail || error.message}` });
  };

  const handleFolderStart = async (
    folderName: string,
    docType: 'my_documents' | 'opposition_documents',
    files: FileList
  ) => {
    try {
      const response = await startFolderUpload(folderName, docType);
      setFolderSession(response);
      setCaseId(response.case_id);
      setFolderProgress({
        status: 'uploading',
        totalFiles: files.length,
        uploadedFiles: 0,
      });
      setMessage({ type: 'success', text: `Folder session started for ${folderName}` });

      const fileList = Array.from(files);
      for (const file of fileList) {
        const relativePath =
          (file as unknown as { webkitRelativePath?: string }).webkitRelativePath ||
          file.name;
        setFolderProgress((prev) => ({
          ...prev,
          currentFile: relativePath,
        }));
        const fileSession = await startFileUpload(
          response.folder_id,
          relativePath,
          file.size
        );
        const chunkSize = fileSession.chunk_size || response.chunk_size;
        let offset = 0;
        let chunkIndex = 0;
        while (offset < file.size) {
          const slice = file.slice(offset, offset + chunkSize);
          await uploadFileChunk(fileSession.upload_id, chunkIndex, slice);
          offset += chunkSize;
          chunkIndex += 1;
        }
        await completeFileUpload(fileSession.upload_id);
        setFolderProgress((prev) => ({
          ...prev,
          uploadedFiles: prev.uploadedFiles + 1,
        }));
      }

      const ingestion = await completeFolderUpload(response.folder_id);
      setMessage({
        type: 'success',
        text: `Folder upload complete. Ingestion job ${ingestion.job_id} queued.`,
      });
      setFolderProgress((prev) => ({ ...prev, status: 'complete' }));
    } catch (error: any) {
      console.error('Folder upload start error:', error);
      setFolderProgress((prev) => ({ ...prev, status: 'error' }));
      setMessage({ type: 'error', text: `Folder upload failed: ${error.response?.data?.detail || error.message}` });
    }
  };

  useEffect(() => {
    const activeJobs = uploadedDocuments.filter((doc) =>
      doc.ingestion_status === 'queued' || doc.ingestion_status === 'running'
    );
    if (activeJobs.length === 0) return;

    const interval = setInterval(async () => {
      await Promise.all(
        activeJobs.map(async (doc) => {
          try {
            const status = await getIngestionStatus(doc.job_id);
            setUploadedDocuments((prevDocs) =>
              prevDocs.map((prevDoc) =>
                prevDoc.job_id === doc.job_id
                  ? { ...prevDoc, ingestion_status: status.status }
                  : prevDoc
              )
            );
          } catch (error) {
            console.error('Status check error:', error);
          }
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [uploadedDocuments]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Upload Evidence</h1>

      {message && (
        <div className={`p-3 mb-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="caseId" className="block text-sm font-medium text-gray-700">Case ID:</label>
        <input
          type="text"
          id="caseId"
          className="mt-1 block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          value={caseId}
          onChange={(e) => setCaseId(e.target.value)}
        />
        {folderSession && (
          <p className="mt-2 text-xs text-gray-500">
            Auto-created case from folder upload: {folderSession.case_id}
          </p>
        )}
      </div>

      <DocumentUploadZone
        caseId={caseId}
        onUploadSuccess={handleUploadSuccess}
        onUploadError={handleUploadError}
      />

      <div className="mt-6">
        <FolderUploadZone onFolderStart={handleFolderStart} />
        {folderProgress.status !== 'idle' && (
          <div className="mt-4 rounded-md border border-gray-200 bg-white p-3 text-sm">
            <p className="font-medium">Folder Upload Status</p>
            <p className="text-gray-600">
              {folderProgress.uploadedFiles}/{folderProgress.totalFiles} files uploaded
            </p>
            {folderProgress.currentFile && (
              <p className="text-gray-500">Current: {folderProgress.currentFile}</p>
            )}
            {folderProgress.status === 'complete' && (
              <p className="text-green-700 mt-1">Upload complete. Ingestion started.</p>
            )}
            {folderProgress.status === 'error' && (
              <p className="text-red-600 mt-1">Upload encountered an error.</p>
            )}
          </div>
        )}
      </div>

      <div className="mt-6">
        <IngestionPipelinePanel />
      </div>

      <h2 className="text-xl font-bold mt-8 mb-4">Uploaded Documents</h2>
      {
        uploadedDocuments.length === 0 ? (
          <p>No documents uploaded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categories</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doc ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job ID</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {uploadedDocuments.map((doc) => (
                  <tr key={doc.doc_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{doc.file_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.doc_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.ingestion_status}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.pipeline_result.join(', ')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.doc_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.job_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  );
};

export default UploadEvidencePage;
