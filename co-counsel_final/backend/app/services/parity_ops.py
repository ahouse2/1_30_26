from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List
from uuid import uuid4

from ..config import get_settings
from .drafting import DraftingService
from .llm_service import get_llm_service
from .privilege import get_privilege_classifier_service
from .retrieval import RetrievalService, get_retrieval_service
from .timeline import TimelineService, get_timeline_service


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _tokenize(text: str) -> set[str]:
    return set(re.findall(r"[a-zA-Z0-9_]+", text.lower()))


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


PARITY_MATRIX_ITEMS: List[Dict[str, str]] = [
    {
        "capability": "Document ingestion + indexing",
        "status": "implemented",
        "notes": "Folder uploads and LlamaIndex retrieval are active.",
    },
    {
        "capability": "Forensics suite (pdf/image/crypto)",
        "status": "implemented",
        "notes": "Forensics report surface + custody attribution workflows shipped.",
    },
    {
        "capability": "Timeline + storyboard exports",
        "status": "implemented",
        "notes": "Interactive timeline and MD/HTML/PDF/XLSX exports are active.",
    },
    {
        "capability": "Presentation + exhibit builder",
        "status": "implemented",
        "notes": "Presentation exports and in-court controls are wired.",
    },
    {
        "capability": "Legacy workflow tools",
        "status": "implemented",
        "notes": "Discovery, deposition, subpoena, and trial prep now runnable in parity ops.",
    },
    {
        "capability": "Swarm behavior parity verification",
        "status": "partial",
        "notes": "Core features are available; ongoing fit-and-finish against legacy expectations.",
    },
]


LEGACY_WORKFLOW_ITEMS: List[Dict[str, str]] = [
    {
        "workflow_id": "deposition_prep",
        "title": "Deposition Prep",
        "description": "Generates witness themes, sequencing, and question trees.",
    },
    {
        "workflow_id": "subpoena_prep",
        "title": "Subpoena Prep",
        "description": "Builds subpoena request packet with targeted collection scope.",
    },
    {
        "workflow_id": "discovery_production",
        "title": "Discovery Production",
        "description": "Drafts production matrix with custodians, categories, and deadlines.",
    },
    {
        "workflow_id": "trial_preparation",
        "title": "Trial Preparation",
        "description": "Builds hearing-ready checklist from timeline highlights.",
    },
]


@dataclass
class TaskItem:
    task_id: str
    title: str
    owner: str
    priority: str
    status: str
    due_date: str | None
    notes: str
    created_at: str
    updated_at: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "task_id": self.task_id,
            "title": self.title,
            "owner": self.owner,
            "priority": self.priority,
            "status": self.status,
            "due_date": self.due_date,
            "notes": self.notes,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


class ParityOpsService:
    def __init__(self) -> None:
        settings = get_settings()
        self.base_dir = settings.workflow_storage_path / "parity_ops"
        self.base_dir.mkdir(parents=True, exist_ok=True)
        self.drafting_service: DraftingService | None = None
        self.privilege_service = get_privilege_classifier_service()
        # Lazy init prevents parity endpoints from crashing when graph/index bootstrapping
        # is unavailable (e.g., fresh environment before first ingestion).
        self.retrieval_service: RetrievalService | None = None
        self.timeline_service: TimelineService | None = None
        self.llm_service = get_llm_service()

    def _get_retrieval_service(self) -> RetrievalService:
        if self.retrieval_service is None:
            self.retrieval_service = get_retrieval_service()
        return self.retrieval_service

    def _get_timeline_service(self) -> TimelineService:
        if self.timeline_service is None:
            self.timeline_service = get_timeline_service()
        return self.timeline_service

    def list_tasks(self, case_id: str) -> List[Dict[str, Any]]:
        tasks = self._load_tasks(case_id)
        tasks.sort(key=lambda item: item.get("updated_at", ""), reverse=True)
        return tasks

    def create_task(
        self,
        *,
        case_id: str,
        title: str,
        owner: str,
        priority: str = "medium",
        due_date: str | None = None,
        notes: str = "",
    ) -> Dict[str, Any]:
        tasks = self._load_tasks(case_id)
        now = _utc_now()
        item = TaskItem(
            task_id=f"task-{uuid4().hex[:10]}",
            title=title.strip(),
            owner=owner.strip() or "Unassigned",
            priority=priority if priority in {"low", "medium", "high"} else "medium",
            status="queued",
            due_date=due_date,
            notes=notes.strip(),
            created_at=now,
            updated_at=now,
        )
        tasks.append(item.to_dict())
        self._save_tasks(case_id, tasks)
        return item.to_dict()

    def update_task(self, case_id: str, task_id: str, patch: Dict[str, Any]) -> Dict[str, Any]:
        tasks = self._load_tasks(case_id)
        for idx, task in enumerate(tasks):
            if task.get("task_id") != task_id:
                continue
            updated = dict(task)
            for key in ("title", "owner", "priority", "status", "due_date", "notes"):
                if key in patch and patch[key] is not None:
                    updated[key] = patch[key]
            if updated.get("priority") not in {"low", "medium", "high"}:
                updated["priority"] = "medium"
            if updated.get("status") not in {"queued", "running", "blocked", "done"}:
                updated["status"] = "queued"
            updated["updated_at"] = _utc_now()
            tasks[idx] = updated
            self._save_tasks(case_id, tasks)
            return updated
        raise FileNotFoundError(f"Task '{task_id}' not found")

    def generate_draft(
        self,
        *,
        case_id: str,
        document_type: str,
        instructions: str,
    ) -> Dict[str, Any]:
        if self.drafting_service is None:
            self.drafting_service = DraftingService()
        payload = self.drafting_service.draft(case_id)
        sections = payload.get("drafts", [])
        instructions = instructions.strip()
        if instructions:
            sections = [
                {
                    "type": "custom_instructions",
                    "content": instructions,
                }
            ] + sections
        return {
            "case_id": case_id,
            "document_type": document_type,
            "sections": sections,
            "draft": payload.get("draft", ""),
            "citations": payload.get("citations", []),
        }

    def analyze_discrepancy_and_sanctions(
        self,
        *,
        claim_text: str,
        evidence_text: str,
    ) -> Dict[str, Any]:
        claim_tokens = _tokenize(claim_text)
        evidence_tokens = _tokenize(evidence_text)
        overlap = len(claim_tokens & evidence_tokens)
        union = max(1, len(claim_tokens | evidence_tokens))
        similarity = overlap / union
        discrepancy_score = round(1.0 - similarity, 4)

        triggers: Dict[str, List[str]] = {}
        sanctions_keywords = {
            "filing": ["rule 11", "frivolous", "bad faith", "improper purpose"],
            "discovery": ["spoliation", "withheld", "failed to preserve", "discovery abuse"],
            "court_order": ["violated order", "contempt", "noncompliance"],
        }
        lower = f"{claim_text}\n{evidence_text}".lower()
        for category, words in sanctions_keywords.items():
            hits = [word for word in words if word in lower]
            if hits:
                triggers[category] = hits

        risk_score = _clamp(discrepancy_score + (0.12 * len(triggers)), 0.0, 1.0)
        if risk_score >= 0.75:
            risk_level = "high"
        elif risk_score >= 0.45:
            risk_level = "medium"
        else:
            risk_level = "low"

        return {
            "discrepancy_score": discrepancy_score,
            "risk_score": round(risk_score, 4),
            "risk_level": risk_level,
            "trigger_map": triggers,
            "analysis": (
                "Narrative discrepancy and sanctions-risk pass completed. "
                "Use this as triage signal and route high-risk items to QA + strategy swarms."
            ),
        }

    def privilege_bates_pass(
        self,
        *,
        document_text: str,
        bates_prefix: str,
        start_number: int = 1,
    ) -> Dict[str, Any]:
        decision = self.privilege_service.classify(
            "inline-document",
            document_text,
            metadata={"bates_prefix": bates_prefix},
        )

        lines = [line for line in document_text.splitlines() if line.strip()]
        numbered: List[Dict[str, Any]] = []
        for idx, line in enumerate(lines, start=0):
            number = start_number + idx
            numbered.append(
                {
                    "bates_id": f"{bates_prefix}_{number:06d}",
                    "text": line,
                }
            )

        return {
            "privilege": {
                "label": decision.label,
                "score": decision.score,
                "explanation": decision.explanation,
                "signals": decision.signals,
            },
            "bates": {
                "prefix": bates_prefix,
                "start": f"{bates_prefix}_{start_number:06d}",
                "end": f"{bates_prefix}_{(start_number + max(0, len(numbered) - 1)):06d}",
                "line_count": len(numbered),
                "entries": numbered[:200],
            },
        }

    def get_parity_matrix(self) -> Dict[str, Any]:
        items = [dict(item) for item in PARITY_MATRIX_ITEMS]
        implemented = len([item for item in items if item["status"] == "implemented"])
        partial = len([item for item in items if item["status"] == "partial"])
        planned = len([item for item in items if item["status"] == "planned"])
        score = round((implemented + (partial * 0.5)) / max(1, len(items)), 4)
        return {
            "summary": {
                "implemented": implemented,
                "partial": partial,
                "planned": planned,
                "total": len(items),
                "score": score,
            },
            "items": items,
        }

    def list_legacy_workflows(self) -> List[Dict[str, str]]:
        return [dict(item) for item in LEGACY_WORKFLOW_ITEMS]

    def run_legacy_workflow(self, *, case_id: str, workflow_id: str, prompt: str) -> Dict[str, Any]:
        normalized_prompt = prompt.strip() or f"Legacy workflow execution for case {case_id}."
        if workflow_id == "deposition_prep":
            payload = self._run_deposition_workflow(case_id, normalized_prompt)
        elif workflow_id == "subpoena_prep":
            payload = self._run_subpoena_workflow(case_id, normalized_prompt)
        elif workflow_id == "discovery_production":
            payload = self._run_discovery_workflow(case_id, normalized_prompt)
        elif workflow_id == "trial_preparation":
            payload = self._run_trial_workflow(case_id, normalized_prompt)
        else:
            raise ValueError(f"Unknown legacy workflow '{workflow_id}'")

        run_record = {
            "run_id": f"legacy-{uuid4().hex[:12]}",
            "case_id": case_id,
            "workflow_id": workflow_id,
            "prompt": normalized_prompt,
            "created_at": _utc_now(),
            "payload": payload,
        }
        self._append_legacy_run(case_id, run_record)
        return run_record

    def _run_deposition_workflow(self, case_id: str, prompt: str) -> Dict[str, Any]:
        retrieval = self._safe_retrieval(
            f"Deposition preparation for case {case_id}: {prompt}",
            page_size=8,
        )
        generation_prompt = (
            "Prepare a deposition outline and question tree.\n"
            "Return sections: key themes, witness sequence, and questions by theme.\n\n"
            f"Context:\n{retrieval['answer']}\n"
        )
        outline = self._safe_generate(generation_prompt)
        return {
            "workflow": "deposition_prep",
            "outline": outline,
            "citations": retrieval["citations"],
        }

    def _run_subpoena_workflow(self, case_id: str, prompt: str) -> Dict[str, Any]:
        generation_prompt = (
            f"Draft a subpoena request checklist for case {case_id}. "
            "Include scope, custodians, data types, and filing sequence.\n\n"
            f"Case prompt:\n{prompt}\n"
        )
        packet = self._safe_generate(generation_prompt)
        return {
            "workflow": "subpoena_prep",
            "subpoena_packet": packet,
            "citations": [],
        }

    def _run_discovery_workflow(self, case_id: str, prompt: str) -> Dict[str, Any]:
        retrieval = self._safe_retrieval(
            f"Discovery production planning for case {case_id}: {prompt}",
            page_size=8,
        )
        generation_prompt = (
            "Build a discovery production plan and response matrix.\n"
            "Include deadlines, custodians, privilege checkpoints, and batching guidance.\n\n"
            f"Context:\n{retrieval['answer']}\n"
        )
        production_plan = self._safe_generate(generation_prompt)
        return {
            "workflow": "discovery_production",
            "production_plan": production_plan,
            "citations": retrieval["citations"],
        }

    def _run_trial_workflow(self, case_id: str, prompt: str) -> Dict[str, Any]:
        events_summary = self._safe_timeline_events(limit=10)
        timeline_blob = "\n".join(f"- {event}" for event in events_summary) or "- No timeline events yet."
        generation_prompt = (
            "Generate a trial prep checklist with owner lanes and deadline blocks.\n"
            "Use timeline events and prompt context.\n\n"
            f"Timeline:\n{timeline_blob}\n\n"
            f"Context prompt:\n{prompt}\n"
        )
        checklist = self._safe_generate(generation_prompt)
        return {
            "workflow": "trial_preparation",
            "checklist": checklist,
            "events_considered": len(events_summary),
            "citations": [],
        }

    def _safe_retrieval(self, question: str, page_size: int) -> Dict[str, Any]:
        try:
            response = self._get_retrieval_service().query(question, page_size=page_size)
            return {
                "answer": response.answer,
                "citations": [citation.to_dict() for citation in response.citations],
            }
        except Exception:
            return {
                "answer": "No retrieval context available; run generated from operator prompt only.",
                "citations": [],
            }

    def _safe_timeline_events(self, limit: int) -> List[str]:
        try:
            response = self._get_timeline_service().list_events(limit=limit)
            return [event.summary for event in response.events if event.summary]
        except Exception:
            return []

    def _safe_generate(self, prompt: str) -> str:
        try:
            return self.llm_service.generate_text(prompt)
        except Exception:
            return (
                "Generation fallback: external model unavailable. "
                "Re-run when provider credentials are active."
            )

    def _tasks_path(self, case_id: str) -> Path:
        safe = "".join(ch if ch.isalnum() or ch in {"-", "_"} else "_" for ch in case_id)
        return self.base_dir / f"{safe}_tasks.json"

    def _legacy_runs_path(self, case_id: str) -> Path:
        safe = "".join(ch if ch.isalnum() or ch in {"-", "_"} else "_" for ch in case_id)
        return self.base_dir / f"{safe}_legacy_runs.json"

    def _load_tasks(self, case_id: str) -> List[Dict[str, Any]]:
        path = self._tasks_path(case_id)
        if not path.exists():
            return []
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            return data if isinstance(data, list) else []
        except Exception:
            return []

    def _save_tasks(self, case_id: str, tasks: List[Dict[str, Any]]) -> None:
        path = self._tasks_path(case_id)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(tasks, indent=2), encoding="utf-8")

    def _append_legacy_run(self, case_id: str, run_record: Dict[str, Any]) -> None:
        path = self._legacy_runs_path(case_id)
        runs: List[Dict[str, Any]] = []
        if path.exists():
            try:
                loaded = json.loads(path.read_text(encoding="utf-8"))
                if isinstance(loaded, list):
                    runs = loaded
            except Exception:
                runs = []
        runs.append(run_record)
        runs = runs[-50:]
        path.write_text(json.dumps(runs, indent=2), encoding="utf-8")
