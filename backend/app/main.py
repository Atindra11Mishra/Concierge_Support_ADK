from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import routes_chat, routes_sessions, routes_traces
from app.api.errors import ConciergeError, concierge_error_handler
from app.db.session import init_db
from app.obs.logging import configure_logging
from app.settings import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    await init_db()
    yield


app = FastAPI(title="Concierge Support ADK", version="0.1.0", lifespan=lifespan)

allowed_origins = [
    origin.strip()
    for origin in settings.allowed_origins.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(routes_sessions.router, prefix="/v1")
app.include_router(routes_chat.router, prefix="/v1")
app.include_router(routes_traces.router, prefix="/v1")
app.add_exception_handler(ConciergeError, concierge_error_handler)


@app.get("/healthz")
async def healthz() -> dict:
    return {"status": "ok"}
