import json
import logging
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from auth_manager import AuthManager
from config import settings
from mcp_server.api_client import AirlineAPIClient
from agent.orchestrator import AgentOrchestrator
from agent.memory import ConversationMemory

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s %(levelname)-8s %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)
# Suppress noisy third-party debug logs
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
logging.getLogger("watchfiles").setLevel(logging.WARNING)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────────────────────────────────
    app.state.http_client = httpx.AsyncClient(timeout=30.0)
    app.state.auth_manager = AuthManager()
    await app.state.auth_manager.login(app.state.http_client)

    api_client = AirlineAPIClient(
        http_client=app.state.http_client,
        auth_manager=app.state.auth_manager,
        base_url=settings.GATEWAY_URL,
    )
    app.state.api_client = api_client
    app.state.memory = ConversationMemory()
    app.state.orchestrator = AgentOrchestrator(
        memory=app.state.memory,
        api_client=api_client,
        model=settings.OLLAMA_MODEL,
    )
    logger.info("Startup complete. Ollama model: %s", settings.OLLAMA_MODEL)
    yield
    # ── Shutdown ─────────────────────────────────────────────────────────────
    await app.state.http_client.aclose()


app = FastAPI(title="Airline AI Agent", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Models ────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    session_id: str


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "authenticated": app.state.auth_manager.is_authenticated,
        "model": settings.OLLAMA_MODEL,
    }


@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    orchestrator: AgentOrchestrator = app.state.orchestrator

    async def event_generator():
        try:
            async for chunk in orchestrator.process_message(
                session_id=request.session_id,
                user_message=request.message,
            ):
                yield {"data": chunk}
            yield {"data": json.dumps({"type": "done"})}
        except Exception:
            logger.exception("Unhandled error in chat endpoint")
            yield {"data": json.dumps({"type": "error", "content": "An unexpected error occurred. Please try again."})}

    return EventSourceResponse(event_generator())
