from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.workflow import workflow
from llama_index.core.agent.workflow import AgentWorkflow

app = FastAPI(title="Agentic Platform API", version="0.1.0")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"status": "ok", "message": "Agentic Platform Backend Running"}

# TODO: Add workflow routes here
# Likely exposing a chat endpoint that invokes the workflow
# workflow.run(...)

@app.post("/api/chat")
async def chat(message: str):
    # This is a placeholder for interaction with the agent workflow
    # We need to manage run_id/session_id
    response = await workflow.run(message=message) # async run? check src.workflow
    return {"response": str(response)}
