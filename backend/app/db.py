"""Temporary SQLite database, recreated from scratch on every startup."""

import sqlite3
from collections.abc import Iterator
from contextlib import closing
from pathlib import Path
from typing import Annotated

from fastapi import Depends, Request

NOW = "(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))"

SCHEMA = f"""
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT {NOW}
);
CREATE TABLE sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT {NOW}
);
CREATE TABLE documents (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    draft TEXT NOT NULL,
    messages TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT {NOW}
);
"""


def connect(path: Path) -> sqlite3.Connection:
    """A connection returning rows by column name; usable across FastAPI's worker threads."""
    conn = sqlite3.connect(path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db(path: Path) -> None:
    """Delete any existing database at `path` and create a fresh schema."""
    path.unlink(missing_ok=True)
    with closing(connect(path)) as conn:
        conn.executescript(SCHEMA)


def get_db(request: Request) -> Iterator[sqlite3.Connection]:
    """Per-request connection that commits on success and rolls back on error."""
    with closing(connect(request.app.state.db_path)) as conn, conn:
        yield conn


# "function" scope commits before the response is sent, so the next request sees the writes.
Db = Annotated[sqlite3.Connection, Depends(get_db, scope="function")]
