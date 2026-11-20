import pytest
from fastapi.testclient import TestClient

from app.main import create_app

PASSWORD = "correct horse"


@pytest.fixture
def db_path(tmp_path):
    return tmp_path / "prelegal.db"


@pytest.fixture
def client(tmp_path, db_path):
    static = tmp_path / "static"
    (static / "draft").mkdir(parents=True)
    (static / "index.html").write_text("login page")
    (static / "draft" / "index.html").write_text("draft page")
    with TestClient(create_app(db_path, static)) as c:
        yield c


def sign_up(client, email="ada@example.com"):
    return client.post("/api/auth/signup", json={"email": email, "password": PASSWORD})


@pytest.fixture
def user_client(client):
    """A client signed in as ada@example.com."""
    assert sign_up(client).status_code == 201
    return client
