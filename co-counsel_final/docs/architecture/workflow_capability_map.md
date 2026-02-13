# Workflow Capability Map

This map links archived capabilities to the new Swarms hybrid workflow phases or tools.

## Archived Capability -> Workflow Phase

- Forensics suite -> `forensics` phase (ForensicsService + Graph upserts)
- Timeline builder -> `timeline` phase (TimelineService + event graph edges)
- Presentation builder -> `drafting` phase (document outputs; presentation renderer TBD)
- QA teams/oversight -> `qa_review` phase (QAOversightService)
- Legal theory engine -> `legal_theories` phase
- Strategy/planning -> `strategy` phase
- Fact extraction -> `fact_extraction` phase
- Parsing/chunking -> `parsing_chunking` phase
- Indexing/RAG -> `indexing` phase (LlamaIndex + vector/graph sync)

## Notes
- Archived tools live under `archive-co counsel/` for reference and incremental reintegration.
- Each phase emits JSON + Markdown artifacts and graph upserts for traceability.
