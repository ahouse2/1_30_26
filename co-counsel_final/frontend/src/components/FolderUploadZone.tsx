import { useState, type ChangeEvent } from 'react';

interface FolderUploadZoneProps {
  onFolderStart?: (
    folderName: string,
    docType: 'my_documents' | 'opposition_documents',
    files: FileList
  ) => void;
}

export function FolderUploadZone({ onFolderStart }: FolderUploadZoneProps) {
  const [docType, setDocType] = useState<'my_documents' | 'opposition_documents'>('my_documents');
  const [folderLabel, setFolderLabel] = useState<string | null>(null);
  const [fileCount, setFileCount] = useState<number>(0);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const first = files[0];
    const relativePath = (first as unknown as { webkitRelativePath?: string }).webkitRelativePath;
    const folderName = (relativePath || first.name).split('/')[0] || 'Uploaded Folder';
    setFolderLabel(folderName);
    setFileCount(files.length);
    onFolderStart?.(folderName, docType, files);
  };

  return (
    <div className="panel-shell">
      <h3 className="text-lg font-semibold">Upload Folder</h3>
      <p className="text-sm text-text-secondary mt-2">
        Drag a folder or click to select a directory for bulk evidence ingestion.
      </p>
      <div className="mt-4">
        <input
          type="file"
          multiple
          // @ts-expect-error - webkitdirectory is supported by Chromium-based browsers
          webkitdirectory="true"
          directory=""
          data-testid="folder-upload-input"
          className="block w-full text-sm text-text-secondary"
          onChange={handleChange}
        />
      </div>
      <div className="mt-4">
        <label htmlFor="folderDocType" className="block text-xs uppercase tracking-[0.3em] text-text-secondary">
          Document Type
        </label>
        <select
          id="folderDocType"
          className="mt-2 w-full rounded-md border border-border bg-background-surface px-3 py-2 text-sm"
          value={docType}
          onChange={(event) => setDocType(event.target.value as 'my_documents' | 'opposition_documents')}
        >
          <option value="my_documents">My Documents</option>
          <option value="opposition_documents">Opposition Documents</option>
        </select>
      </div>
      {folderLabel && (
        <p className="mt-3 text-xs text-text-secondary">
          Selected folder: <span className="text-text-primary">{folderLabel}</span> ({fileCount} files)
        </p>
      )}
    </div>
  );
}
