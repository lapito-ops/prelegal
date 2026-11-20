from fastapi.testclient import TestClient

from app.main import create_app


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_database_created_on_startup(client, db_path):
    assert db_path.exists()


def test_serves_login_at_root(client):
    assert client.get("/").text == "login page"


def test_serves_draft_page(client):
    assert client.get("/draft/").text == "draft page"
    assert client.get("/draft").text == "draft page"


def test_unknown_api_route_is_404(client):
    assert client.get("/api/missing").status_code == 404


def test_runs_without_frontend_build(tmp_path, db_path):
    with TestClient(create_app(db_path, tmp_path / "missing")) as c:
        assert c.get("/api/health").status_code == 200
