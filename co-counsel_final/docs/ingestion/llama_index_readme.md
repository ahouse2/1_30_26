Llama-Index Ingestion Overview (Mac-friendly)

What this ingests
- Documents (PDF, DOCX, TXT, MD, HTML, images) into a vector store via llama-index.
- Images are OCR'ed and embedded where possible; text data is chunked and embedded.
- Metadata (file type, size, origin, embedding model, etc.) is captured and stored.
- A knowledge graph (Neo4j/Memgraph) is populated with entities and relationships inferred from text.

Key components
- llama_index: Orchestrates document loading, chunking, embedding, and KG generation.
- backend/ingestion: Connectors and pipelines for various data sources (Local, Web, S3, SharePoint, OneDrive, CourtListener, etc.).
- Vector store: Qdrant (via llama_index/vector_stores) or a configured backend via llama_index.
- Knowledge graph: Neo4j or Memgraph via property-graph store integration.
- Ingestion pipeline: Runs embedding, vector upserts, and KG creation; records audit data and timeline events.

How it works (high level)
- Data sources are materialized by connector implementations.
- Documents are parsed, OCR’d when applicable, metadata extracted, and content chunked.
- Embeddings are computed using configured embedding model (OpenAI/HuggingFace, etc.).
- Vectors are upserted into the vector store; entities and relationships are added to the knowledge graph.
- The system emits telemetry events and graph mutations for observability and debugging.

How to run with your own data (quickstart)
- Put your data in a directory, e.g. /Users/you/data/legal.
- Start the stack (Phase 2 startup script can seed and ingest in one shot).
- Ingest your directory:
  - ./scripts/start-stack.sh --data-dir "/Users/you/data/legal" 
- Verify ingestion by inspecting Neo4j and the vector store, and by querying the UI or API for knowledge-graph data.

Data formats and expectations
- Text-based files: .txt, .md, .json, .csv, etc. are processed with a text reader.
- PDFs and Office documents: processed with OCR and document readers when available.
- Web sources: ingested via WebSourceConnector when provided with a URL and credentials.

Troubleshooting tips
- If ingestion stalls, check Docker logs for the API, ingestion worker, and vector store services.
- Ensure Neo4j is accessible from the backend and that environment secrets are configured correctly.
- For macOS, ensure your data directory has proper permissions and path quoting in shell scripts.

Notes
- This readme is a living doc; I’ll add more sections as we implement additional connectors or processing steps.
