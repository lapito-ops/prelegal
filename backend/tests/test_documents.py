from uuid import uuid4

from conftest import sign_up

PARTY = {"name": "", "title": "", "company": "Acme Inc", "noticeAddress": ""}
DRAFT = {"documentId": "mutual-nda", "parties": [PARTY, PARTY], "terms": [{"label": "Purpose", "value": "x"}]}
MESSAGES = [{"role": "assistant", "content": "Hi?"}, {"role": "user", "content": "An NDA"}]


def create(client, draft=DRAFT, messages=MESSAGES) -> str:
    response = client.post("/api/documents", json={"draft": draft, "messages": messages})
    assert response.status_code == 201
    return response.json()["id"]


def save(client, doc_id, draft=DRAFT, messages=MESSAGES):
    return client.put(f"/api/documents/{doc_id}", json={"draft": draft, "messages": messages})


def test_create_and_get_document(user_client):
    doc_id = create(user_client)
    body = user_client.get(f"/api/documents/{doc_id}").json()
    assert body["id"] == doc_id
    assert body["draft"] == DRAFT
    assert body["messages"] == MESSAGES
    assert body["updatedAt"].endswith("Z")


def test_save_replaces_existing_document(user_client):
    doc_id = create(user_client)
    changed = {**DRAFT, "documentId": "pilot"}
    saved = save(user_client, doc_id, changed, MESSAGES[:1])
    assert saved.status_code == 200
    body = user_client.get(f"/api/documents/{doc_id}").json()
    assert body["draft"]["documentId"] == "pilot"
    assert body["messages"] == MESSAGES[:1]
    assert len(user_client.get("/api/documents").json()) == 1


def test_list_is_most_recent_first_without_messages(user_client):
    first, second = create(user_client), create(user_client)
    save(user_client, first)
    listed = user_client.get("/api/documents").json()
    assert [d["id"] for d in listed] == [first, second]
    assert "messages" not in listed[0]


def test_documents_are_private_to_their_owner(user_client):
    doc_id = create(user_client)
    user_client.post("/api/auth/signout")
    sign_up(user_client, "bob@example.com")
    assert user_client.get("/api/documents").json() == []
    assert user_client.get(f"/api/documents/{doc_id}").status_code == 404
    assert save(user_client, doc_id).status_code == 404


def test_documents_require_sign_in(client):
    assert client.get("/api/documents").status_code == 401
    assert client.post("/api/documents", json={"draft": DRAFT, "messages": []}).status_code == 401
    assert save(client, str(uuid4())).status_code == 401


def test_missing_document_is_404(user_client):
    assert user_client.get(f"/api/documents/{uuid4()}").status_code == 404
    assert save(user_client, str(uuid4())).status_code == 404
    assert user_client.get("/api/documents/not-a-uuid").status_code == 422
