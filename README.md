# Concierge Support ADK

Portfolio-ready AI support concierge demo with a FastAPI backend and a Next.js
frontend.

The project demonstrates a persistent support assistant built with Google ADK.
It creates support sessions, routes chat turns through specialist agents,
answers documentation questions from a local RAG corpus, performs mocked account
lookups, persists state, and exposes structured traces in the UI.

## Project Structure

```text
Concierge_Support_ADK/
  backend/   FastAPI, Google ADK, SQLite, Chroma, tests, deploy config
  frontend/  Next.js demo UI for chat, health checks, and trace inspection
```

## Features

- Chat UI connected to the FastAPI API.
- Session creation with user ID and plan tier.
- Google ADK routing between knowledge and account agents.
- Local RAG over bundled Markdown docs with Chroma.
- Structured trace viewer with route, latency, tool calls, and retrieved chunks.
- Backend health check and browser-safe CORS configuration.
- Render-ready backend config and Vercel/Netlify-ready frontend.

## Local Setup

Start the backend:

```powershell
cd backend
uv sync --extra dev
Copy-Item .env.example .env
uv run python -m app.rag.ingest --path docs/
uv run python -m uvicorn app.main:app --reload
```

Set these backend values in `backend/.env`:

```env
GOOGLE_API_KEY=your-gemini-api-key
ADK_MODEL=gemini-2.5-flash
DATABASE_URL=sqlite+aiosqlite:///./concierge_support_adk.db
CHROMA_PERSIST_DIR=./chroma_db
ALLOWED_ORIGINS=*
LLM_TIMEOUT_SECONDS=60
TOOL_TIMEOUT_SECONDS=20
```

Start the frontend:

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

Set this frontend value in `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Open:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:8000/healthz
```

## Validation

Backend:

```powershell
cd backend
uv run python -m pytest -q
uv run ruff check app tests
```

Frontend:

```powershell
cd frontend
npm run lint
npm run build
```

Latest local result:

```text
Backend tests: 7 passed
Frontend lint: passed
Frontend build: passed
End-to-end local chat and trace flow: working
```

## Deployment

Recommended live setup:

- Deploy `backend/` to Render.
- Deploy `frontend/` to Vercel or Netlify.
- Add the frontend URL to the backend `ALLOWED_ORIGINS`, or use `*` for a public demo.
- Add the backend URL to the frontend `NEXT_PUBLIC_API_BASE_URL`.

Backend production env:

```env
GOOGLE_API_KEY=your-gemini-api-key
ADK_MODEL=gemini-2.5-flash
ALLOWED_ORIGINS=*
LLM_TIMEOUT_SECONDS=60
TOOL_TIMEOUT_SECONDS=20
```

Frontend production env:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.onrender.com
```

## API

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/healthz` | Health check |
| `POST` | `/v1/sessions` | Create a support session |
| `POST` | `/v1/chat/{session_id}` | Run one support turn |
| `GET` | `/v1/traces/{trace_id}` | Fetch trace details for a turn |

## Notes

- `GOOGLE_API_KEY` belongs only in backend environment variables.
- Frontend variables prefixed with `NEXT_PUBLIC_` are visible in the browser.
- Live chat requires a valid Gemini API key and available quota.
- The default database and vector store are local SQLite and Chroma for a
  self-contained demo.

## More Detail

- Backend docs: [backend/README.md](backend/README.md)
- Frontend docs: [frontend/README.md](frontend/README.md)
