from app.auth import hash_password, verify_password
from conftest import PASSWORD, sign_up


def test_password_hash_round_trip():
    stored = hash_password("s3cret-pass")
    assert verify_password("s3cret-pass", stored)
    assert not verify_password("wrong", stored)
    assert hash_password("s3cret-pass") != stored


def test_sign_up_signs_in(client):
    response = sign_up(client, " Ada@Example.com ")
    assert response.status_code == 201
    assert response.json()["email"] == "ada@example.com"
    assert "httponly" in response.headers["set-cookie"].lower()
    assert client.get("/api/auth/me").json()["email"] == "ada@example.com"


def test_sign_up_rejects_duplicate_email(client):
    sign_up(client)
    response = sign_up(client, "ADA@example.com")
    assert response.status_code == 409
    assert response.json()["detail"] == "An account with this email already exists"


def test_sign_up_validates_input(client):
    assert client.post("/api/auth/signup", json={"email": "nope", "password": PASSWORD}).status_code == 422
    assert client.post("/api/auth/signup", json={"email": "a@b.co", "password": "short"}).status_code == 422


def test_sign_in_with_correct_password(client):
    sign_up(client)
    client.post("/api/auth/signout")
    response = client.post("/api/auth/signin", json={"email": "ada@example.com", "password": PASSWORD})
    assert response.status_code == 200
    assert client.get("/api/auth/me").status_code == 200


def test_sign_in_rejects_bad_credentials(client):
    sign_up(client)
    client.cookies.clear()
    wrong = client.post("/api/auth/signin", json={"email": "ada@example.com", "password": "wrong-pass"})
    unknown = client.post("/api/auth/signin", json={"email": "bob@example.com", "password": PASSWORD})
    assert wrong.status_code == unknown.status_code == 401
    assert wrong.json()["detail"] == "Incorrect email or password"


def test_me_requires_session(client):
    assert client.get("/api/auth/me").status_code == 401
    client.cookies.set("session", "forged")
    assert client.get("/api/auth/me").status_code == 401


def test_sign_out_ends_session(user_client):
    token = user_client.cookies["session"]
    assert user_client.post("/api/auth/signout").status_code == 204
    user_client.cookies.set("session", token)
    assert user_client.get("/api/auth/me").status_code == 401
