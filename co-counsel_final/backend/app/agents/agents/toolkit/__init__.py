__all__ = []

try:  # pragma: no cover - optional evaluation suite
    from .evaluation import CaseEvaluationResult, EvaluationHarness, EvaluationSuiteResult
except Exception:  # pragma: no cover - allow slim installs
    CaseEvaluationResult = None  # type: ignore[assignment]
    EvaluationHarness = None  # type: ignore[assignment]
    EvaluationSuiteResult = None  # type: ignore[assignment]
else:
    __all__.extend(["CaseEvaluationResult", "EvaluationHarness", "EvaluationSuiteResult"])

try:  # pragma: no cover - optional fixtures
    from .fixtures import FixtureCase, FixtureDocument, FixtureSet
except Exception:  # pragma: no cover - allow slim installs
    FixtureCase = None  # type: ignore[assignment]
    FixtureDocument = None  # type: ignore[assignment]
    FixtureSet = None  # type: ignore[assignment]
else:
    __all__.extend(["FixtureCase", "FixtureDocument", "FixtureSet"])

from .prompt_packs import PromptMessage, PromptPack, PromptTemplate
from .sandbox import (
    SandboxCommandResult,
    SandboxExecutionError,
    SandboxExecutionHarness,
    SandboxExecutionResult,
)

__all__.extend(
    [
        "PromptMessage",
        "PromptPack",
        "PromptTemplate",
        "SandboxCommandResult",
        "SandboxExecutionError",
        "SandboxExecutionHarness",
        "SandboxExecutionResult",
    ]
)

try:  # pragma: no cover - optional graph explorer dependencies
    from .graph_explorer import (
        build_text_to_cypher_prompt,
        community_overview,
        describe_graph_schema,
        run_cypher,
    )
except ModuleNotFoundError:  # pragma: no cover - optional graph explorer dependencies
    build_text_to_cypher_prompt = None  # type: ignore[assignment]
    community_overview = None  # type: ignore[assignment]
    describe_graph_schema = None  # type: ignore[assignment]
    run_cypher = None  # type: ignore[assignment]
else:  # pragma: no cover - executed when dependencies available
    __all__.extend(
        [
            "build_text_to_cypher_prompt",
            "community_overview",
            "describe_graph_schema",
            "run_cypher",
        ]
    )
