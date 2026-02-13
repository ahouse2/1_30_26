from __future__ import annotations

from dataclasses import asdict
from functools import lru_cache
from typing import List

from backend.app.models.api import CostEventModel, CostSummaryMetricModel, CostSummaryResponse
from backend.app.security.authz import Principal
from backend.app.services.costs import CostEventCategory, CostTrackingService, get_cost_tracking_service


class CostService:
    """High-level API wrapper for cost tracking."""

    def __init__(self, tracking: CostTrackingService | None = None) -> None:
        self.tracking = tracking or get_cost_tracking_service()

    async def get_cost_summary(self, principal: Principal) -> CostSummaryResponse:
        summary = self.tracking.summarise(window_hours=24.0, tenant_id=principal.tenant_id)
        return CostSummaryResponse(
            generated_at=summary.generated_at,
            window_hours=summary.window_hours,
            tenant_id=summary.tenant_id,
            api_calls=CostSummaryMetricModel(**asdict(summary.api_calls)),
            model_loads=CostSummaryMetricModel(**asdict(summary.model_loads)),
            gpu_utilisation=CostSummaryMetricModel(**asdict(summary.gpu_utilisation)),
        )

    async def get_cost_events(self, principal: Principal) -> List[CostEventModel]:
        records = self.tracking.list_events(limit=100, tenant_id=principal.tenant_id, category=None)
        return [
            CostEventModel(
                event_id=record.event_id,
                timestamp=record.timestamp,
                tenant_id=record.tenant_id,
                category=record.category,  # type: ignore[arg-type]
                name=record.name,
                amount=record.amount,
                unit=record.unit,
                metadata=record.metadata,
            )
            for record in records
        ]

    async def get_cost_metrics(self, principal: Principal) -> List[CostSummaryMetricModel]:
        summary = self.tracking.summarise(window_hours=24.0, tenant_id=principal.tenant_id)
        metrics = [summary.api_calls, summary.model_loads, summary.gpu_utilisation]
        return [CostSummaryMetricModel(**asdict(metric)) for metric in metrics]


@lru_cache(maxsize=1)
def get_cost_service() -> CostService:
    return CostService()
