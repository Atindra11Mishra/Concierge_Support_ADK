# Concierge Support ADK

Persistent AI support concierge built with FastAPI, Google ADK, SQLite, and Chroma. It creates support sessions, routes each chat turn through specialist agents, retrieves grounded answers from a local documentation corpus, performs deterministic account lookups, persists conversation state, and records structured traces for observability.

## Highlights

- FastAPI service with session, chat, trace, and health endpoints.
- Google ADK multi-agent orchestration with knowledge and account agents.
- Local RAG pipeline over Markdown docs using Chroma and deterministic embeddings.
- SQLite persistence for sessions, messages, compact agent state, and traces.
- Pytest coverage for API, retrieval, and account tooling.

## Tech Stack

Python, FastAPI, Google ADK, Chroma, SQLAlchemy async, SQLite, Pytest, Ruff

## Links

- Live Demo: `TODO`
- Live API: `TODO`
- Repository: `TODO`
- Health check: `TODO/healthz`
