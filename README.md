# prelegal
A platform for drafting common legal agreements.

## Run

Requires Docker and a `.env` file in the project root containing `OPENROUTER_API_KEY`.

```bash
scripts/start-linux.sh   # or start-mac.sh / start-windows.sh
scripts/stop-linux.sh    # or stop-mac.sh / stop-windows.sh
```

The app is served at http://localhost:8000. The SQLite database is recreated on every start.

## Develop

```bash
cd frontend && npm install && npm run build && npm test
cd backend && uv run pytest
cd backend && uv run uvicorn app.main:app --reload   # serves frontend/out at :8000
```

## Layout

- `frontend/` Next.js app, statically exported to `frontend/out`
- `backend/` FastAPI app (uv project): `/api/*` plus the static frontend
- `templates/` legal templates listed in `catalog.json`
