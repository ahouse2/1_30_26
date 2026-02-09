const STAGES = [
  { id: 'preprocess', label: 'Preprocess' },
  { id: 'chunk', label: 'Chunk' },
  { id: 'embed', label: 'Embed' },
  { id: 'enrich', label: 'Enrich' },
  { id: 'forensics', label: 'Forensics' },
];

export function IngestionPipelinePanel() {
  return (
    <div className="panel-shell">
      <h3 className="text-lg font-semibold">Pipeline</h3>
      <p className="text-sm text-text-secondary mt-2">
        Trigger or resume specific stages in the ingestion pipeline.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {STAGES.map((stage) => (
          <button
            key={stage.id}
            type="button"
            className="px-3 py-2 rounded-md border border-border bg-background-surface text-sm"
          >
            {stage.label}
          </button>
        ))}
      </div>
    </div>
  );
}
