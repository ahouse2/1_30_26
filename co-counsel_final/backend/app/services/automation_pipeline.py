from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

from ..config import get_settings
from ..legal_theory.service import LegalTheoryService, get_legal_theory_service
from ..storage.job_store import JobStore
from ..storage.timeline_store import TimelineEvent
from .forensics import ForensicsService, get_forensics_service
from .graph import GraphService, get_graph_service
from .timeline import TimelineService, get_timeline_service


AUTOMATION_STAGES = ("graph", "forensics", "legal_theory", "timeline", "presentation")


def _utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class StageResult:
    status: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    message: Optional[str] = None


class AutomationPipelineService:
    def __init__(
        self,
        *,
        job_store: JobStore | None = None,
        graph_service: GraphService | None = None,
        timeline_service: TimelineService | None = None,
        legal_theory_service: LegalTheoryService | None = None,
        forensics_service: ForensicsService | None = None,
    ) -> None:
        settings = get_settings()
        self.job_store = job_store or JobStore(settings.job_store_dir)
        self.graph_service = graph_service or get_graph_service()
        self.timeline_service = timeline_service or get_timeline_service()
        self.legal_theory_service = legal_theory_service or get_legal_theory_service()
        self.forensics_service = forensics_service or get_forensics_service()

    def run_stages(
        self,
        job_id: str,
        stages: Iterable[str],
        *,
        question: Optional[str] = None,
        case_id: Optional[str] = None,
        autonomy_level: str = "balanced",
        force: bool = False,
    ) -> Dict[str, Any]:
        record = self.job_store.read_job(job_id)
        automation = self._ensure_automation_state(record)
        case_id = case_id or self._resolve_case_id(record)
        if case_id:
            record.setdefault("automation", {})["case_id"] = case_id
        stages_to_run = self._normalize_stages(stages)
        if not stages_to_run:
            stages_to_run = list(AUTOMATION_STAGES)

        results = automation["results"]
        for stage in stages_to_run:
            stage_state = automation["stages"].setdefault(stage, StageResult(status="pending").__dict__)
            if stage_state.get("status") == "succeeded" and not force:
                continue
            self._mark_stage(stage_state, "running")
            try:
                if stage == "graph":
                    summary = self.graph_service.compute_community_summary()
                    results["graph"] = summary.to_dict()
                    self._persist_stage_result(case_id, job_id, stage, results["graph"])
                elif stage == "forensics":
                    results["forensics"] = self._build_forensics_payload(record)
                    self._persist_stage_result(case_id, job_id, stage, results["forensics"])
                elif stage == "legal_theory":
                    prompt = question or "Summarize legal frameworks based on the ingested evidence."
                    frameworks = self.legal_theory_service.generate_frameworks(prompt)
                    results["legal_frameworks"] = frameworks
                    self._persist_stage_result(case_id, job_id, stage, {"framework_count": len(frameworks)})
                elif stage == "timeline":
                    stats = self.timeline_service.refresh_enrichments()
                    listing = self.timeline_service.list_events(limit=20)
                    results["timeline"] = {
                        "events": [self._event_payload(event) for event in listing.events],
                        "next_cursor": listing.next_cursor,
                        "limit": listing.limit,
                        "has_more": listing.has_more,
                        "enriched": stats.mutated,
                        "highlights": stats.highlights,
                        "relations": stats.relations,
                    }
                    self._persist_stage_result(case_id, job_id, stage, results["timeline"])
                elif stage == "presentation":
                    results["presentation"] = self._build_presentation_payload(
                        results,
                        question=question,
                        case_id=case_id,
                        autonomy_level=autonomy_level,
                    )
                    self._persist_stage_result(case_id, job_id, stage, results["presentation"])
                else:
                    raise ValueError(f"Unknown automation stage: {stage}")
            except Exception as exc:
                self._mark_stage(stage_state, "failed", message=str(exc))
            else:
                self._mark_stage(stage_state, "succeeded")
            automation["stages"][stage] = stage_state

        record.setdefault("status_details", {})["automation"] = automation
        self.job_store.write_job(job_id, record)
        return automation

    @staticmethod
    def _normalize_stages(stages: Iterable[str]) -> List[str]:
        seen: List[str] = []
        for stage in stages:
            stage_key = stage.strip().lower()
            if stage_key and stage_key not in seen:
                seen.append(stage_key)
        return seen

    @staticmethod
    def _mark_stage(stage_state: Dict[str, Any], status: str, message: Optional[str] = None) -> None:
        now = _utcnow_iso()
        if status == "running":
            stage_state["status"] = status
            stage_state["started_at"] = now
            stage_state["completed_at"] = None
            stage_state["message"] = None
            return
        stage_state["status"] = status
        if stage_state.get("started_at") is None:
            stage_state["started_at"] = now
        stage_state["completed_at"] = now
        stage_state["message"] = message

    @staticmethod
    def _event_payload(event: TimelineEvent) -> Dict[str, Any]:
        return event.to_record()

    @staticmethod
    def _build_presentation_payload(
        results: Dict[str, Any],
        *,
        question: Optional[str],
        case_id: Optional[str],
        autonomy_level: str,
    ) -> Dict[str, Any]:
        frameworks = results.get("legal_frameworks", [])
        timeline = results.get("timeline") or {}
        timeline_events = timeline.get("events", [])
        summary = (
            f"Prepared {len(frameworks)} legal frameworks and {len(timeline_events)} timeline events"
            " for review."
        )
        return {
            "summary": summary,
            "question": question,
            "case_id": case_id,
            "autonomy_level": autonomy_level,
            "framework_count": len(frameworks),
            "timeline_event_count": len(timeline_events),
            "frameworks": frameworks,
            "timeline": timeline,
            "forensics": results.get("forensics"),
        }

    @staticmethod
    def _ensure_automation_state(record: Dict[str, Any]) -> Dict[str, Any]:
        details = record.setdefault("status_details", {})
        automation = details.setdefault("automation", {})
        automation.setdefault("stages", {})
        automation.setdefault("results", {"legal_frameworks": []})
        return automation

    @staticmethod
    def _resolve_case_id(record: Dict[str, Any]) -> Optional[str]:
        automation = record.get("automation") or {}
        case_id = automation.get("case_id")
        if case_id:
            return str(case_id)
        sources = record.get("sources", [])
        if isinstance(sources, list):
            for source in sources:
                if isinstance(source, dict):
                    metadata = source.get("metadata", {})
                    if isinstance(metadata, dict) and metadata.get("case_id"):
                        return str(metadata["case_id"])
        return None

    def _build_forensics_payload(self, record: Dict[str, Any]) -> Dict[str, Any]:
        details = record.get("status_details", {})
        forensics = details.get("forensics", {})
        artifacts = list(forensics.get("artifacts", [])) if isinstance(forensics, dict) else []
        reports: List[Dict[str, Any]] = []
        for artifact in artifacts:
            if not isinstance(artifact, dict):
                continue
            doc_id = artifact.get("document_id")
            if not doc_id:
                continue
            try:
                report = self.forensics_service.load_report(str(doc_id))
            except FileNotFoundError:
                report_path = artifact.get("report_path")
                if report_path:
                    try:
                        report = json.loads(Path(report_path).read_text())
                    except (OSError, ValueError):
                        report = {}
                else:
                    report = {}
            reports.append({"document_id": doc_id, "report": report})
        return {
            "artifact_count": len(artifacts),
            "artifacts": artifacts,
            "last_run_at": forensics.get("last_run_at") if isinstance(forensics, dict) else None,
            "reports": reports,
        }

    def _persist_stage_result(
        self,
        case_id: Optional[str],
        job_id: str,
        stage: str,
        payload: Dict[str, Any] | None,
    ) -> None:
        if not case_id:
            return
        case_node_id = f"case::{case_id}"
        stage_node_id = f"automation::{job_id}::{stage}"
        summary = self._summarize_payload(payload)
        self.graph_service.upsert_entity(
            case_node_id,
            "Case",
            {"case_id": case_id},
        )
        self.graph_service.upsert_entity(
            stage_node_id,
            "AutomationStage",
            {
                "stage": stage,
                "job_id": job_id,
                "case_id": case_id,
                "summary": summary,
                "updated_at": _utcnow_iso(),
            },
        )
        self.graph_service.merge_relation(
            case_node_id,
            "HAS_AUTOMATION_STAGE",
            stage_node_id,
            {"case_id": case_id, "job_id": job_id, "stage": stage},
        )

    @staticmethod
    def _summarize_payload(payload: Dict[str, Any] | None) -> str:
        if not payload:
            return "No payload recorded."
        if "summary" in payload:
            return str(payload.get("summary") or "No summary available.")
        if "artifact_count" in payload:
            return f"Forensics artifacts: {payload.get('artifact_count')}"
        if "framework_count" in payload:
            return f"Legal frameworks: {payload.get('framework_count')}"
        if "events" in payload:
            return f"Timeline events: {len(payload.get('events', []))}"
        return "Stage payload recorded."


_automation_service: AutomationPipelineService | None = None


def get_automation_pipeline_service() -> AutomationPipelineService:
    global _automation_service
    if _automation_service is None:
        _automation_service = AutomationPipelineService()
    return _automation_service
