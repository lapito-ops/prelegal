# Stage 1: static export of the Next.js frontend (reads ../catalog.json and ../templates at build time).
FROM node:24-slim AS frontend
WORKDIR /repo/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY templates /repo/templates
COPY catalog.json /repo/catalog.json
COPY frontend ./
RUN npm run build

# Stage 2: FastAPI backend serving the API and the exported frontend.
FROM python:3.15-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
WORKDIR /app
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project
COPY backend/app ./app
COPY catalog.json ./catalog.json
COPY --from=frontend /repo/frontend/out ./static
ENV STATIC_DIR=/app/static DB_PATH=/tmp/prelegal.db CATALOG_PATH=/app/catalog.json PATH="/app/.venv/bin:$PATH"
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
