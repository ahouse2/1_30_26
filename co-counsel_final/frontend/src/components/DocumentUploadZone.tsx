import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadDocument } from '../services/document_api';

interface DocumentUploadZoneProps {
  caseId: string;
  onUploadSuccess: (response: any) => void;
  onUploadError: (error: any) => void;
}

const DocumentUploadZone: React.FC<DocumentUploadZoneProps> = ({ caseId, onUploadSuccess, onUploadError }) => {
  const [docType, setDocType] = useState<'my_documents' | 'opposition_documents'>('my_documents');
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    const file = acceptedFiles[0]; // Only handle one file for now

    try {
      const response = await uploadDocument(caseId, docType, file);
      onUploadSuccess(response);
    } catch (error) {
      onUploadError(error);
    } finally {
      setIsUploading(false);
    }
  }, [caseId, docType, onUploadSuccess, onUploadError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false, // Only allow single file uploads for now
  });

  return (
    <div className="upload-dropzone">
      <div
        {...getRootProps()}
        className={`upload-dropzone__target${isDragActive ? ' active' : ''}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? <p>Drop the files here…</p> : <p>Drag & drop files, or click to select</p>}
        {isUploading && <p className="upload-dropzone__status">Uploading...</p>}
      </div>
      <div className="upload-dropzone__meta">
        <label htmlFor="docType">Document Type</label>
        <select
          id="docType"
          name="docType"
          className="input-cinematic"
          value={docType}
          onChange={(e) => setDocType(e.target.value as 'my_documents' | 'opposition_documents')}
          disabled={isUploading}
        >
          <option value="my_documents">My Documents</option>
          <option value="opposition_documents">Opposition Documents</option>
        </select>
      </div>
    </div>
  );
};

export default DocumentUploadZone;
