from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from ..config import Settings, get_settings
from ..storage.court_payment_ledger import CourtPaymentLedger, PaymentEvent
from ..storage.settings_store import SettingsStore
from .court_connectors import (
    CaseLawConnector,
    ConnectorNotConfigured,
    CourtListenerConnector,
    LegInfoConnector,
    LacsConnector,
    PacerConnector,
    UniCourtConnector,
)
from .graph import GraphService, get_graph_service


class CourtIntegrationService:
    def __init__(
        self,
        runtime_settings: Settings | None = None,
        *,
        ledger: CourtPaymentLedger | None = None,
        store: SettingsStore | None = None,
        graph_service: GraphService | None = None,
    ) -> None:
        self._settings = runtime_settings or get_settings()
        self._store = store or SettingsStore(
            self._settings.settings_store_path,
            self._settings.manifest_encryption_key_path,
        )
        self._ledger = ledger or CourtPaymentLedger(self._settings.court_payment_ledger_path)
        self._graph_service = graph_service

    def _load_credentials(self) -> Dict[str, Any]:
        state = self._store.load()
        return state.get("credentials", {})

    def _connector_map(self) -> Dict[str, Any]:
        creds = self._load_credentials()
        return {
            "courtlistener": CourtListenerConnector(
                token=creds.get("courtlistener_token"),
                base_url=getattr(self._settings, "courtlistener_endpoint", "") or "",
            ),
            "caselaw": CaseLawConnector(
                api_key=creds.get("caselaw_api_key"),
                base_url=getattr(self._settings, "caselaw_endpoint", "") or "",
            ),
            "pacer": PacerConnector(
                api_key=creds.get("pacer_api_key"),
                base_url=getattr(self._settings, "pacer_endpoint", "") or "",
            ),
            "unicourt": UniCourtConnector(
                api_key=creds.get("unicourt_api_key"),
                base_url=getattr(self._settings, "unicourt_endpoint", "") or "",
            ),
            "lacs": LacsConnector(
                api_key=creds.get("lacs_api_key"),
                base_url=getattr(self._settings, "lacs_endpoint", "") or "",
            ),
            "leginfo": LegInfoConnector(
                api_key=creds.get("leginfo_api_key"),
                base_url=getattr(self._settings, "leginfo_endpoint", "") or "",
            ),
        }

    @staticmethod
    def _slug(value: Any) -> str:
        text = re.sub(r"[^a-zA-Z0-9_-]+", "-", str(value or "unknown")).strip("-").lower()
        return text or "unknown"

    @staticmethod
    def _normalize_result(item: Any) -> Dict[str, Any]:
        if hasattr(item, "__dataclass_fields__"):
            return {
                key: value
                for key, value in item.__dict__.items()
                if not key.startswith("_")
            }
        if isinstance(item, dict):
            return dict(item)
        return {}

    def _upsert_graph_payload(self, *, payload: Dict[str, Any], case_id: str, run_suffix: str) -> None:
        if self._graph_service is None:
            try:
                self._graph_service = get_graph_service()
            except Exception:
                return
        try:
            self._graph_service.upsert_payload(
                payload,
                phase="court_integration",
                run_id=f"court-sync-{run_suffix}-{int(datetime.now(timezone.utc).timestamp())}",
                case_id=case_id,
            )
        except Exception:
            # Court integrations should stay available even if graph storage is temporarily down.
            return

    def _upsert_search_results(
        self,
        *,
        provider_id: str,
        query: str,
        jurisdiction: Optional[str],
        results: list,
    ) -> None:
        if not results:
            return
        nodes: list[Dict[str, Any]] = []
        edges: list[Dict[str, Any]] = []
        provider_node_id = f"court_provider::{self._slug(provider_id)}"
        query_node_id = f"court_query::{self._slug(provider_id)}::{self._slug(query)[:64]}"
        nodes.append(
            {
                "id": provider_node_id,
                "type": "CourtProvider",
                "properties": {"provider": provider_id},
            }
        )
        nodes.append(
            {
                "id": query_node_id,
                "type": "CourtQuery",
                "properties": {
                    "query": query,
                    "jurisdiction": jurisdiction,
                    "provider": provider_id,
                },
            }
        )
        edges.append(
            {
                "source": query_node_id,
                "target": provider_node_id,
                "type": "QUERIES_PROVIDER",
                "properties": {"source": "court_integration"},
            }
        )
        for item in results:
            data = self._normalize_result(item)
            case_id = str(data.get("case_id") or data.get("id") or "")
            if not case_id:
                continue
            case_node_id = f"court_case::{self._slug(provider_id)}::{self._slug(case_id)}"
            case_caption = str(data.get("caption") or data.get("title") or data.get("name") or case_id)
            metadata = data.get("metadata") if isinstance(data.get("metadata"), dict) else {}
            nodes.append(
                {
                    "id": case_node_id,
                    "type": "Case",
                    "properties": {
                        "provider": provider_id,
                        "case_id": case_id,
                        "caption": case_caption,
                        "court": data.get("court"),
                        "filed_date": data.get("filed_date"),
                        "source_url": data.get("source_url"),
                        "jurisdiction": jurisdiction or metadata.get("jurisdiction"),
                        "authority_band": metadata.get("authority_band"),
                        "document_kind": metadata.get("document_kind"),
                    },
                }
            )
            edges.append(
                {
                    "source": query_node_id,
                    "target": case_node_id,
                    "type": "RETURNS_CASE",
                    "properties": {"provider": provider_id},
                }
            )
            edges.append(
                {
                    "source": case_node_id,
                    "target": provider_node_id,
                    "type": "SOURCED_FROM",
                    "properties": {"provider": provider_id},
                }
            )
        self._upsert_graph_payload(
            payload={"graph": {"nodes": nodes, "edges": edges}},
            case_id=jurisdiction or "court-search",
            run_suffix=provider_id,
        )

    def _upsert_case_documents(
        self,
        *,
        provider_id: str,
        case_id: str,
        case_payload: Dict[str, Any],
    ) -> None:
        documents = case_payload.get("documents", [])
        if not isinstance(documents, list):
            return
        case_node_id = f"court_case::{self._slug(provider_id)}::{self._slug(case_id)}"
        nodes: list[Dict[str, Any]] = [
            {
                "id": case_node_id,
                "type": "Case",
                "properties": {
                    "provider": provider_id,
                    "case_id": case_id,
                    "docket_id": case_payload.get("docket_id"),
                },
            }
        ]
        edges: list[Dict[str, Any]] = []
        for index, document in enumerate(documents):
            if not isinstance(document, dict):
                continue
            document_id = str(document.get("document_id") or f"{case_id}-doc-{index + 1}")
            doc_node_id = (
                f"court_doc::{self._slug(provider_id)}::{self._slug(case_id)}::{self._slug(document_id)}"
            )
            nodes.append(
                {
                    "id": doc_node_id,
                    "type": "Document",
                    "properties": {
                        "title": document.get("title") or document_id,
                        "provider": provider_id,
                        "case_id": case_id,
                        "document_id": document_id,
                        "source_url": document.get("source_url"),
                        "filed_date": document.get("filed_date"),
                        "metadata": document.get("metadata") if isinstance(document.get("metadata"), dict) else {},
                    },
                }
            )
            edges.append(
                {
                    "source": case_node_id,
                    "target": doc_node_id,
                    "type": "HAS_DOCUMENT",
                    "properties": {"provider": provider_id},
                }
            )
        self._upsert_graph_payload(
            payload={"graph": {"nodes": nodes, "edges": edges}},
            case_id=case_id,
            run_suffix=provider_id,
        )

    def _upsert_fetched_document(
        self,
        *,
        provider_id: str,
        case_id: str,
        document_id: str,
        document: Any,
    ) -> None:
        data = self._normalize_result(document)
        if not data:
            return
        case_node_id = f"court_case::{self._slug(provider_id)}::{self._slug(case_id)}"
        doc_node_id = f"court_doc::{self._slug(provider_id)}::{self._slug(case_id)}::{self._slug(document_id)}"
        payload = {
            "graph": {
                "nodes": [
                    {
                        "id": case_node_id,
                        "type": "Case",
                        "properties": {
                            "provider": provider_id,
                            "case_id": case_id,
                        },
                    },
                    {
                        "id": doc_node_id,
                        "type": "Document",
                        "properties": {
                            "title": data.get("title") or document_id,
                            "provider": provider_id,
                            "case_id": case_id,
                            "document_id": document_id,
                            "source_url": data.get("source_url"),
                            "filed_date": data.get("filed_date"),
                            "metadata": data.get("metadata") if isinstance(data.get("metadata"), dict) else {},
                        },
                    },
                ],
                "edges": [
                    {
                        "source": case_node_id,
                        "target": doc_node_id,
                        "type": "HAS_DOCUMENT",
                        "properties": {"provider": provider_id},
                    }
                ],
            }
        }
        self._upsert_graph_payload(payload=payload, case_id=case_id, run_suffix=provider_id)

    def provider_status(self) -> Dict[str, Dict[str, Any]]:
        status: Dict[str, Dict[str, Any]] = {}
        for provider_id, connector in self._connector_map().items():
            try:
                connector.ensure_ready()
                status[provider_id] = {"ready": True}
            except ConnectorNotConfigured as exc:
                status[provider_id] = {"ready": False, "reason": str(exc)}
        return status

    async def sync_status(self, *, case_id: str, jurisdiction: Optional[str] = None) -> Dict[str, Any]:
        providers = self.provider_status()
        connector_map = self._connector_map()
        case_views: list[Dict[str, Any]] = []
        upcoming: list[Dict[str, Any]] = []

        for provider_id, status in providers.items():
            if not status.get("ready"):
                continue
            connector = connector_map.get(provider_id)
            if connector is None:
                continue
            try:
                case_payload = await connector.fetch_case(case_id, docket_id=None)
                docs = case_payload.get("documents", []) if isinstance(case_payload, dict) else []
                if isinstance(case_payload, dict):
                    self._upsert_case_documents(
                        provider_id=provider_id,
                        case_id=case_id,
                        case_payload=case_payload,
                    )
                case_views.append(
                    {
                        "provider": provider_id,
                        "case_id": case_id,
                        "documents_found": len(docs),
                        "documents_preview": docs[:5],
                    }
                )
            except Exception:
                case_views.append(
                    {
                        "provider": provider_id,
                        "case_id": case_id,
                        "documents_found": 0,
                        "documents_preview": [],
                    }
                )
            try:
                events = await connector.fetch_calendar(jurisdiction=jurisdiction)
                if isinstance(events, list):
                    for event in events[:10]:
                        if isinstance(event, dict):
                            upcoming.append({"provider": provider_id, **event})
            except Exception:
                continue

        return {
            "providers": providers,
            "cases": case_views,
            "upcoming_events": upcoming[:20],
            "payment_queue": self.payment_queue_summary(case_id=case_id),
        }

    async def search(
        self,
        provider_id: str,
        query: str,
        *,
        jurisdiction: Optional[str] = None,
        limit: int = 10,
        filters: Optional[Dict[str, Any]] = None,
    ) -> list:
        connector = self._connector_map().get(provider_id)
        if not connector:
            raise ConnectorNotConfigured(f"Unknown provider '{provider_id}'")
        results = await connector.search(query, jurisdiction=jurisdiction, limit=limit, filters=filters)
        self._upsert_search_results(
            provider_id=provider_id,
            query=query,
            jurisdiction=jurisdiction,
            results=results,
        )
        return results

    async def fetch_document(
        self,
        provider_id: str,
        case_id: str,
        document_id: str,
        *,
        docket_id: Optional[str] = None,
    ) -> Any:
        connector = self._connector_map().get(provider_id)
        if not connector:
            raise ConnectorNotConfigured(f"Unknown provider '{provider_id}'")
        document = await connector.fetch_document(case_id, document_id, docket_id=docket_id)
        self._upsert_fetched_document(
            provider_id=provider_id,
            case_id=case_id,
            document_id=document_id,
            document=document,
        )
        return document

    def record_payment_intent(
        self,
        *,
        provider: str,
        case_id: str,
        docket_id: Optional[str],
        document_id: Optional[str],
        amount_estimate: Optional[float],
        currency: str,
        requested_by: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> str:
        event = PaymentEvent(
            provider=provider,
            case_id=case_id,
            docket_id=docket_id,
            document_id=document_id,
            event_type="intent",
            amount_estimate=amount_estimate,
            currency=currency,
            requested_by=requested_by,
            metadata=metadata or {},
        )
        return self._ledger.append(event)

    def record_payment_authorization(
        self,
        *,
        provider: str,
        case_id: str,
        docket_id: Optional[str],
        document_id: Optional[str],
        amount_actual: Optional[float],
        currency: str,
        authorized_by: Optional[str],
        metadata: Optional[Dict[str, Any]] = None,
    ) -> str:
        event = PaymentEvent(
            provider=provider,
            case_id=case_id,
            docket_id=docket_id,
            document_id=document_id,
            event_type="authorized",
            amount_actual=amount_actual,
            currency=currency,
            requested_by=authorized_by or "authorized",
            authorized_by=authorized_by,
            status="authorized",
            metadata=metadata or {},
        )
        return self._ledger.append(event)

    def payment_queue_summary(self, *, case_id: str) -> Dict[str, Any]:
        path = self._ledger.path
        if not path.exists():
            return {"pending": 0, "authorized": 0, "total": 0}
        pending = 0
        authorized = 0
        total = 0
        with path.open("r", encoding="utf-8") as handle:
            for line in handle:
                line = line.strip()
                if not line:
                    continue
                try:
                    record = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if record.get("case_id") != case_id:
                    continue
                total += 1
                status = str(record.get("status") or "").lower()
                if status == "authorized":
                    authorized += 1
                else:
                    pending += 1
        return {"pending": pending, "authorized": authorized, "total": total}
