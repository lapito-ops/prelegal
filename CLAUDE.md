# Prelegal Project
## Overview
This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory. The user can carry out AI chat to establish what document they want and how to fill in the fire
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

Current state: only the Mutual NDA document is supported, drafted via AI chat, with a fake login. See "Implementation status" below.

## Development process

When instructed to build a feature:
1. Use your Atlassian tools to read the feature instructions from Jira
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI design

When writing code to make calls to LLMs, use your Cerebras skill to use LiteLLM via OpenRouter to the `openrouter/openai/gpt-oss-120b` model with Cerebras as the inference provider. You should use Structured Outputs so that you can interpret the results and populate fields in the legal document.

There is an OPENROUTER_API_KEY in the .env file in the project root.

## Technical design

The entire project should be packaged into a Docker container.
The backend should be in backend/ and be a uv project, using FastAPI.
The frontend should be in frontend/
The database should use SQLLite and be created from scratch each time the Docker container is brought up, allowing for a users table with sign up and sign in.
The frontend is statically exported (Next.js `output: "export"`) and served by FastAPI.
There should be scripts in scripts/ for:
```bash
# Mac
scripts/start-mac.sh    # Start
scripts/stop-mac.sh     # Stop

# Linux
scripts/start-linux.sh    # Start
scripts/stop-linux.sh     # Stop

# Windows
scripts/start-windows.sh    # Start
scripts/stop-windows.sh     # Stop
```
Backend available at http://localhost:8000

## Color Scheme

- Accent Yellow: `#ecad0a` - accent lines, highlights
- Blue Primary: `#209dd7` - links, key sections
- Purple Secondary: `#753991` - submit buttons, important actions
- Dark Navy: `#032147` - main headings
- Gray Text: `#888888` - supporting text, labels

## Implementation status

- PL-2: CommonPaper templates in `templates/`, indexed by `catalog.json`.
- PL-3: Mutual NDA creator: form, live preview, client-side PDF download (`@react-pdf/renderer`).
- PL-4: V1 foundation:
  - Frontend (Next.js 15, Tailwind 4): fake login at `/` (accepts any credentials), NDA creator at `/nda/`. `trailingSlash: true` so FastAPI `StaticFiles` serves `nda/index.html`. Standard Terms are read from `../templates` at build time. Brand colors are `@theme` tokens (`brand-*`) in `globals.css`, mirrored as constants in `NdaPdf.tsx`.
  - Backend (`backend/app`): `create_app(db_path, static_dir)` in `main.py`; `GET /api/health`; static mount registered last. `db.py` deletes and recreates SQLite with a `users` table on startup. No auth endpoints yet.
  - Docker: multi-stage `Dockerfile` (node:24 build, python:3.15 + uv runtime); env vars `STATIC_DIR`, `DB_PATH`; `.env` passed via `--env-file`, never baked in. Start/stop scripts build and run a container named `prelegal`.
  - Tests: `cd frontend && npm test` (Vitest, `src/lib/*.test.ts`); `cd backend && uv run pytest`.
- PL-5: AI chat replaces the NDA form:
  - Backend: `POST /api/chat` in `backend/app/chat.py` is stateless; it takes `{messages, fields}` and returns `ChatTurn {reply, fields}` via LiteLLM/OpenRouter/Cerebras Structured Outputs. `NdaFields` mirrors the frontend `NdaData` in camelCase (pydantic aliases); the LLM returns the full field snapshot each turn. An empty history yields the AI greeting. `main.py` loads the repo `.env` for local dev.
  - Frontend: `NdaChat.tsx` (replaces `NdaForm.tsx`) calls `lib/chat.ts` `sendChat`; `NdaCreator` replaces its state with the returned fields. Shared `inputClass` lives in `components/styles.ts`.
  - Tests: backend mocks `completion`; `test_live_chat_fills_fields` hits the real model and is skipped without `OPENROUTER_API_KEY`.

Next up: real sign up / sign in, additional document types.
