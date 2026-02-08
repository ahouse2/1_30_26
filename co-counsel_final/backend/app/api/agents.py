from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List

from backend.app.agents.runner import get_orchestrator as build_orchestrator
from backend.app.agents.orchestrator import AgentsOrchestrator
from backend.app.config import LlmConfig, get_llm_config, get_settings
from backend.app.storage.document_store import DocumentStore
from backend.app.forensics.analyzer import ForensicAnalyzer, get_forensic_analyzer
from backend.app.services.knowledge_graph_service import KnowledgeGraphService, get_knowledge_graph_service
from backend.app.agents.memory import AgentMemoryStore
from backend.app.agents.reasoning_engine import ReasoningEngine

router = APIRouter()

def get_orchestrator() -> AgentsOrchestrator:
    settings = get_settings()
    llm_config = get_llm_config(settings)
    document_store = DocumentStore(settings.document_storage_path, settings.encryption_key)
    memory_store = AgentMemoryStore(settings.agent_threads_dir)
    forensics_service = get_forensic_analyzer()
    knowledge_graph_service = get_knowledge_graph_service()
    return build_orchestrator(
        llm_config=llm_config,
        document_store=document_store,
        forensics_service=forensics_service,
        knowledge_graph_service=knowledge_graph_service,
        memory_store=memory_store,
    )

class AgentInteractionRequest(BaseModel):
    session_id: str
    prompt: str
    agent_name: str

class AgentInteractionResponse(BaseModel):
    response: str

@router.post("/agents/invoke", response_model=AgentInteractionResponse)
async def invoke_agent(
    request: AgentInteractionRequest,
    orchestrator: AgentsOrchestrator = Depends(get_orchestrator),
):
    """
    Invoke a specific agent with a prompt.
    """
    try:
        response = orchestrator.invoke_agent(
            session_id=request.session_id,
            agent_name=request.agent_name,
            prompt=request.prompt,
        )
        return AgentInteractionResponse(response=response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ReasoningRequest(BaseModel):
    case_id: str

class ReasoningResponse(BaseModel):
    summary: str

@router.post("/reasoning/analyze", response_model=ReasoningResponse)
async def analyze_case(
    request: ReasoningRequest,
    llm_config: LlmConfig = Depends(get_llm_config),
    knowledge_graph_service: KnowledgeGraphService = Depends(get_knowledge_graph_service),
):
    """
    Analyze a case and generate a summary.
    """

    from backend.ingestion.llama_index_factory import build_llm_service

    llm_service = build_llm_service(llm_config)
    reasoning_engine = ReasoningEngine(
        llm_service=llm_service,
        knowledge_graph_service=knowledge_graph_service,
    )

    try:
        summary = reasoning_engine.analyze_and_summarize_case(request.case_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def get_drafting_prompt(document_type: str, text: str, case_summary: str) -> str:
    base_prompt = f"""
    Given the following text from a legal document of type '{document_type}', and the following case summary, provide a list of 3-5 suggestions to improve it.
    The suggestions should be concise, actionable, and specific to the document type and the case summary.

    Case Summary:
    {case_summary}
    """

    prompts = {
        "contract": f"""
        {base_prompt}
        Focus on clarity, enforceability, and risk mitigation.
        Check for ambiguous language, missing clauses, and potential loopholes.
        """,
        "legal_brief": f"""
        {base_prompt}
        Focus on persuasive arguments, clear legal reasoning, and proper citation format.
        Check for logical fallacies, weak arguments, and incorrect citations.
        """,
        "motion": f"""
        {base_prompt}
        Focus on the specific legal relief requested, the supporting arguments, and the applicable rules of procedure.
        Check for clarity in the relief sought, the strength of the legal basis, and compliance with court rules.
        """,
        "default": f"""
        {base_prompt}
        Focus on general clarity, conciseness, and grammatical correctness.
        """
    }

    prompt = prompts.get(document_type.lower(), prompts["default"])
    return f"{prompt}\n\nText:\n{text}"


class DraftingRequest(BaseModel):
    text: str
    document_type: str
    case_id: str


class DraftingResponse(BaseModel):
    suggestions: List[str]


@router.post("/drafting/suggestions", response_model=DraftingResponse)
async def get_drafting_suggestions(
    request: DraftingRequest,
    llm_config: LlmConfig = Depends(get_llm_config),
    knowledge_graph_service: KnowledgeGraphService = Depends(get_knowledge_graph_service),
):
    """
    Get drafting suggestions from an LLM.
    """
    from backend.ingestion.llama_index_factory import build_llm_service
    from typing import List

    llm_service = build_llm_service(llm_config)

    # Get case-specific context from the knowledge graph
    case_summary = knowledge_graph_service.get_case_summary(request.case_id)

    prompt = get_drafting_prompt(request.document_type, request.text, case_summary)

    try:
        response = llm_service.generate_text(prompt)
        suggestions = response.strip().split("\n")
        return DraftingResponse(suggestions=suggestions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
