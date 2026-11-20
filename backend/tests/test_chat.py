import os
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app import chat as chat_module
from app.chat import ChatRequest, ChatTurn, build_messages, chat
from app.main import create_app

EMPTY_PARTY = {"name": "", "title": "", "company": "", "noticeAddress": ""}
FIELDS = {
    "purpose": "",
    "effectiveDate": "",
    "mndaTermType": "expires",
    "mndaTermYears": 1,
    "confidentialityType": "years",
    "confidentialityYears": 1,
    "governingLaw": "",
    "jurisdiction": "",
    "modifications": "",
    "party1": EMPTY_PARTY,
    "party2": EMPTY_PARTY,
}


def request(messages=()) -> ChatRequest:
    return ChatRequest.model_validate({"messages": list(messages), "fields": FIELDS})


def fake_completion(turn: dict, calls: list):
    def completion(**kwargs):
        calls.append(kwargs)
        content = ChatTurn.model_validate(turn).model_dump_json(by_alias=True)
        return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=content))])

    return completion


def test_build_messages_puts_fields_in_system_prompt():
    messages = build_messages(request([{"role": "user", "content": "hi"}]))
    assert messages[0]["role"] == "system"
    assert '"governingLaw": ""' in messages[0]["content"]
    assert messages[1:] == [{"role": "user", "content": "hi"}]


def test_chat_parses_structured_output(monkeypatch):
    calls = []
    turn = {"reply": "Who is the other party?", "fields": {**FIELDS, "governingLaw": "Delaware"}}
    monkeypatch.setattr(chat_module, "completion", fake_completion(turn, calls))
    result = chat(request())
    assert result.reply == "Who is the other party?"
    assert result.fields.governing_law == "Delaware"
    assert calls[0]["response_format"] is ChatTurn
    assert calls[0]["extra_body"] == {"provider": {"order": ["cerebras"]}}


def test_chat_endpoint_returns_camel_case(tmp_path, monkeypatch):
    turn = {"reply": "Hello", "fields": {**FIELDS, "party1": {**EMPTY_PARTY, "noticeAddress": "a@b.com"}}}
    monkeypatch.setattr(chat_module, "completion", fake_completion(turn, []))
    with TestClient(create_app(tmp_path / "db", tmp_path / "missing")) as client:
        response = client.post("/api/chat", json={"messages": [], "fields": FIELDS})
    assert response.status_code == 200
    assert response.json() == turn


def test_chat_endpoint_rejects_invalid_fields(tmp_path):
    with TestClient(create_app(tmp_path / "db", tmp_path / "missing")) as client:
        bad = {**FIELDS, "mndaTermType": "forever"}
        assert client.post("/api/chat", json={"messages": [], "fields": bad}).status_code == 422


@pytest.mark.skipif(not os.environ.get("OPENROUTER_API_KEY"), reason="needs OPENROUTER_API_KEY")
def test_live_chat_fills_fields():
    greeting = chat(request())
    assert greeting.reply
    turn = chat(
        request(
            [
                {"role": "assistant", "content": greeting.reply},
                {"role": "user", "content": "It's between Acme Inc and Globex Corp, under Delaware law."},
            ]
        )
    )
    assert turn.fields.governing_law == "Delaware"
    assert {turn.fields.party1.company, turn.fields.party2.company} >= {"Acme Inc", "Globex Corp"}
