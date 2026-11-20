# Prelegal Project
## Overview
This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory. The user can carry out AI chat to establish what document they want and how to fill in the fire
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

Current state: all 11 catalog documents are supported, drafted via AI chat, with a fake login. See "Implementation status" below.

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
  - Frontend (Next.js 15, Tailwind 4): fake login at `/` (accepts any credentials), document creator at `/draft/` (was `/nda/` until PL-6). `trailingSlash: true` so FastAPI `StaticFiles` serves `draft/index.html`. `catalog.json` and the templates are read from the repo root at build time. Brand colors are `@theme` tokens (`brand-*`) in `globals.css`, mirrored as constants in `DraftPdf.tsx`.
  - Backend (`backend/app`): `create_app(db_path, static_dir)` in `main.py`; `GET /api/health`; static mount registered last. `db.py` deletes and recreates SQLite with a `users` table on startup. No auth endpoints yet.
  - Docker: multi-stage `Dockerfile` (node:24 build, python:3.15 + uv runtime); env vars `STATIC_DIR`, `DB_PATH`, `CATALOG_PATH`; `catalog.json` is copied into both stages; `.env` passed via `--env-file`, never baked in. Start/stop scripts build and run a container named `prelegal`.
  - Tests: `cd frontend && npm test` (Vitest, `src/lib/*.test.ts`); `cd backend && uv run pytest`.
- PL-5: AI chat replaces the form:
  - Backend: `POST /api/chat` in `backend/app/chat.py` is stateless; it takes `{messages, draft}` and returns `ChatTurn {reply, draft}` via LiteLLM/OpenRouter/Cerebras Structured Outputs. The backend `Draft` mirrors the frontend `Draft` (`lib/draft.ts`) in camelCase (pydantic aliases); the LLM returns the full draft snapshot each turn. An empty history yields the AI greeting. `main.py` loads the repo `.env` for local dev.
  - Frontend: `DraftChat.tsx` calls `lib/chat.ts` `sendChat`; `DraftCreator` replaces its state with the returned draft. Shared `inputClass` lives in `components/styles.ts`.
  - Tests: backend mocks `completion`; live tests hit the real model and are skipped without `OPENROUTER_API_KEY`.
- PL-6: all 11 catalog documents (merged in PR #8):
  - `catalog.json` is the single source of truth: each entry has `id`, `parties` (two role names) and `terms` (`{label, description, optional?}`). The Mutual NDA is one entry pointing at `templates/Mutual-NDA.md`. Backend loads it in `app/catalog.py` (`CATALOG_PATH` env in Docker); frontend loads it plus every template at build time in `lib/loadDocuments.ts`.
  - Backend: `Draft {documentId, parties, terms: [{label, value}]}`; `documentId` is a `Literal` of catalog ids or `""`. The LLM returns `LlmTurn {draft, reply, question}`; the separate `question` guarantees a follow-on question every turn, and the API joins it into `reply`. `normalize()` fits a draft to its document (two parties, exactly its terms in order). The LLM only fills term slots it can see, so `chat()` asks again once when it picks a new document. Unsupported requests get the closest supported document offered.
  - Frontend: `lib/terms.ts` parses both template styles (nested `1.`/`a.` lists with `header_N` spans, and `**Title**.` clauses) into flat `Clause {depth, label, title?, body}`; handles CRLF. Generic cover page (key terms table + party table with role headers) in `DraftPreview`/`DraftPdf`; the document list shows until the AI picks one. `DraftChat` refocuses the input after each turn.
  - Tests: live tests `test_live_chat_picks_document_and_fills_terms` and `test_live_chat_offers_closest_for_unsupported_document`; `terms.test.ts` parses every real template and checks no markup leaks.

Next up: real sign up / sign in.
