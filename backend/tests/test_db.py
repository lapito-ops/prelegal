import sqlite3

import pytest

from app.db import init_db


def columns(path) -> list[str]:
    with sqlite3.connect(path) as conn:
        return [row[1] for row in conn.execute("PRAGMA table_info(users)")]


def test_creates_users_table(tmp_path):
    db = tmp_path / "t.db"
    init_db(db)
    assert columns(db) == ["id", "email", "password_hash", "created_at"]


def test_reinit_wipes_existing_data(tmp_path):
    db = tmp_path / "t.db"
    init_db(db)
    with sqlite3.connect(db) as conn:
        conn.execute("INSERT INTO users (email, password_hash) VALUES ('a@b.com', 'x')")
    init_db(db)
    with sqlite3.connect(db) as conn:
        assert conn.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0


def test_email_is_unique(tmp_path):
    db = tmp_path / "t.db"
    init_db(db)
    with sqlite3.connect(db) as conn:
        conn.execute("INSERT INTO users (email, password_hash) VALUES ('a@b.com', 'x')")
        with pytest.raises(sqlite3.IntegrityError):
            conn.execute("INSERT INTO users (email, password_hash) VALUES ('a@b.com', 'y')")
