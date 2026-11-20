import os
from types import SimpleNamespace

import pytest
from app import chat as chat_module
from app.chat import ChatRequest, Draft, LlmTurn, build_messages, chat, normalize

EMPTY_PARTY = {"name": "", "title": "", "company": "", "noticeAddress": ""}
NO_DRAFT = {"documentId": "", "parties": [], "terms": []}
live = pytest.mark.skipif(not os.environ.get("OPENROUTER_API_KEY"), reason="needs OPENROUTER_API_KEY")


def request(messages=(), draft=NO_DRAFT) -> ChatRequest:
    return ChatRequest.model_validate({"messages": list(messages), "draft": draft})


def fake_completion(turns: list[dict], calls: list):
    """Returns each turn in order, recording the kwargs of every call."""

    def completion(**kwargs):
        content = LlmTurn.model_validate(turns[len(calls)]).model_dump_json(by_alias=True)
        calls.append(kwargs)
        return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=content))])

    return completion


def nda_draft(**terms) -> dict:
    return {
        "documentId": "mutual-nda",
        "parties": [{**EMPTY_PARTY, "company": "Acme Inc"}],
        "terms": [{"label": k, "value": v} for k, v in terms.items()],
    }


def test_build_messages_lists_catalog_and_draft():
    messages = build_messages(request().messages, normalize(Draft.model_validate(nda_draft())))
    system = messages[0]["content"]
    assert "- pilot: Pilot Agreement" in system
    assert "Parties: Provider, Customer" in system
    assert '"label": "Governing Law"' in system


def test_normalize_fits_draft_to_document():
    draft = normalize(Draft.model_validate(nda_draft(Jurisdiction="Wilmington", Bogus="x")))
    assert len(draft.parties) == 2
    assert draft.parties[0].company == "Acme Inc"
    assert [t.label for t in draft.terms][:2] == ["Purpose", "Effective Date"]
    assert {t.label: t.value for t in draft.terms}["Jurisdiction"] == "Wilmington"
    assert "Bogus" not in {t.label for t in draft.terms}


def test_normalize_without_document_has_no_terms():
    draft = normalize(Draft.model_validate({**NO_DRAFT, "terms": [{"label": "Purpose", "value": "x"}]}))
    assert draft.document_id == "" and draft.terms == [] and len(draft.parties) == 2


def test_chat_joins_reply_and_question(monkeypatch):
    calls = []
    turn = {"draft": NO_DRAFT, "reply": "Hello.", "question": "What do you need?"}
    monkeypatch.setattr(chat_module, "completion", fake_completion([turn], calls))
    result = chat(request())
    assert result.reply == "Hello.\n\nWhat do you need?"
    assert len(calls) == 1
    assert calls[0]["response_format"] is LlmTurn
    assert calls[0]["extra_body"] == {"provider": {"order": ["cerebras"]}}


def test_chat_asks_again_when_document_is_picked(monkeypatch):
    calls = []
    picked = {"draft": nda_draft(), "reply": "", "question": "What is the purpose?"}
    filled = {"draft": nda_draft(Purpose="Partnership"), "reply": "Noted.", "question": "Who signs?"}
    monkeypatch.setattr(chat_module, "completion", fake_completion([picked, filled], calls))
    result = chat(request([{"role": "user", "content": "An NDA for a partnership"}]))
    assert len(calls) == 2
    assert '"label": "Purpose"' in calls[1]["messages"][0]["content"]
    assert result.reply == "Noted.\n\nWho signs?"
    assert result.draft.terms[0].value == "Partnership"


def test_chat_endpoint_returns_camel_case(user_client, monkeypatch):
    draft = normalize(Draft.model_validate(nda_draft())).model_dump(by_alias=True)
    turn = {"draft": draft, "reply": "Hi.", "question": "Who is the other party?"}
    monkeypatch.setattr(chat_module, "completion", fake_completion([turn], []))
    response = user_client.post("/api/chat", json={"messages": [], "draft": draft})
    assert response.status_code == 200
    assert response.json() == {"reply": "Hi.\n\nWho is the other party?", "draft": draft}


def test_chat_endpoint_rejects_unknown_document(user_client):
    bad = {**NO_DRAFT, "documentId": "employment"}
    assert user_client.post("/api/chat", json={"messages": [], "draft": bad}).status_code == 422


def test_chat_endpoint_requires_sign_in(client):
    assert client.post("/api/chat", json={"messages": [], "draft": NO_DRAFT}).status_code == 401


@live
def test_live_chat_picks_document_and_fills_terms():
    greeting = chat(request())
    assert greeting.reply.endswith("?")
    turn = chat(
        request(
            [
                {"role": "assistant", "content": greeting.reply},
                {"role": "user", "content": "An NDA between Acme Inc and Globex Corp, under Delaware law."},
            ]
        )
    )
    assert turn.draft.document_id == "mutual-nda"
    assert {t.label: t.value for t in turn.draft.terms}["Governing Law"] == "Delaware"
    assert {p.company for p in turn.draft.parties} == {"Acme Inc", "Globex Corp"}
    assert turn.reply.endswith("?")


@live
def test_live_chat_offers_closest_for_unsupported_document():
    turn = chat(request([{"role": "user", "content": "I need an employment contract for a new hire."}]))
    assert turn.draft.document_id == ""
    assert turn.reply.endswith("?")
