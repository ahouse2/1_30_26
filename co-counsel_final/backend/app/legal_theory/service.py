from __future__ import annotations

import logging
from typing import List

from fastapi import Depends

from backend.app.services.graph import GraphService, GraphStrategyBrief, get_graph_service
from backend.app.services.retrieval import RetrievalService, get_retrieval_service
from backend.app.config import Settings, get_settings
from backend.app.models.api import LegalFrameworkModel
from backend.app.providers.registry import get_provider_registry, ProviderCapability

LOGGER = logging.getLogger(__name__)

class LegalTheoryService:
    def __init__(
        self,
        settings: Settings = Depends(get_settings),
        retrieval_service: RetrievalService = Depends(get_retrieval_service),
        graph_service: GraphService = Depends(get_graph_service),
    ) -> None:
        self.settings = settings
        self.retrieval_service = retrieval_service
        self.graph_service = graph_service
        self.provider_registry = get_provider_registry()
        self._chat_resolution = self.provider_registry.resolve(ProviderCapability.CHAT)

    async def synthesize_legal_theory(
        self,
        question: str,
        focus_nodes: List[str] | None = None,
        limit: int = 5,
    ) -> GraphStrategyBrief:
        """Synthesizes a legal theory based on retrieved evidence and knowledge graph insights."""
        # Step 1: Retrieve relevant documents and entities using the retrieval service
        # For simplicity, this example directly uses graph service for strategy brief
        # In a more complex scenario, retrieval_service.query would be used to get relevant context
        # and then that context would inform the graph strategy brief generation.

        # Step 2: Generate a strategy brief from the graph service
        strategy_brief = self.graph_service.synthesize_strategy_brief(
            focus_nodes=focus_nodes,
            limit=limit,
        )

        # Step 3: (Optional) Use LLM to refine the summary or generate arguments
        # This part would involve calling the LLM with the strategy_brief and the original question
        # to generate a more coherent legal theory or arguments.
        # For now, we return the raw strategy brief.

        return strategy_brief

    def generate_frameworks(
        self,
        question: str,
        *,
        max_frameworks: int = 3,
    ) -> List[dict]:
        """Create multiple candidate legal frameworks grounded in the graph."""
        summary = self.graph_service.compute_community_summary()
        communities = sorted(
            summary.communities, key=lambda item: (item.score, item.size), reverse=True
        )
        frameworks: List[dict] = []
        for community in communities[:max_frameworks]:
            node_ids = [
                str(node.get("id"))
                for node in community.nodes
                if isinstance(node, dict) and node.get("id")
            ]
            brief = self.graph_service.synthesize_strategy_brief(
                focus_nodes=node_ids or None,
                limit=5,
            )
            frameworks.append(
                LegalFrameworkModel(
                    framework_id=str(community.id),
                    label=f"Framework for community {community.id}",
                    strategy_brief=brief.to_dict(),
                    source_documents=list(community.documents),
                    score=float(community.score),
                ).model_dump()
            )
        if frameworks:
            return frameworks
        fallback = self.graph_service.synthesize_strategy_brief(focus_nodes=None, limit=5)
        return [
            LegalFrameworkModel(
                framework_id="default",
                label="Primary evidence framework",
                strategy_brief=fallback.to_dict(),
                source_documents=[],
                score=None,
            ).model_dump()
        ]

def get_legal_theory_service() -> LegalTheoryService:
    return LegalTheoryService()
