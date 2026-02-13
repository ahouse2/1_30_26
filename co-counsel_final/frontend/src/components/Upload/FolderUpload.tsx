import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Inbox, FolderOpen } from 'lucide-react';

interface FolderUploadProps {
  onFolderSelected: (files: File[]) => void;
}

const FolderUpload: React.FC<FolderUploadProps> = ({ onFolderSelected }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFolderSelected(acceptedFiles);
  }, [onFolderSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: false,
    // @ts-ignore
    webkitdirectory: true, // Enable folder selection
    directory: true, // Enable folder selection for newer browsers
  });

  return (
    <div {...getRootProps()} className={`folder-upload${isDragActive ? ' active' : ''}`}>
      <input {...getInputProps()} />
      {isDragActive ? (
        <FolderOpen className="folder-upload__icon active" />
      ) : (
        <Inbox className="folder-upload__icon" />
      )}
      <p className="folder-upload__headline">
        Drag & drop a folder here, or <span>click to select folder</span>
      </p>
      <p className="folder-upload__subtext">Select an entire directory for ingestion</p>
    </div>
  );
};

export default FolderUpload;
