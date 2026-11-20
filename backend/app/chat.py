"""AI chat that picks a legal document, asks questions, and fills in its cover page."""

from datetime import date
from typing import Literal

from litellm import completion
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

from app.catalog import CATALOG, DocumentType

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}

SYSTEM_PROMPT = """You are Prelegal, a friendly assistant helping the user draft a legal \
agreement from Common Paper standard templates. Today is {today}.

Documents you can draft (id: name - description):
{documents}

How to guide the user:
- If no document is chosen yet (documentId is ""), find out what the user needs and pick the \
matching documentId. If they ask for a document that is not listed, explain that you cannot \
draft it, suggest the closest listed document, and ask whether they want that instead; keep \
documentId "" until they agree.
- Then ask about one or two missing details at a time, starting with the parties.
- reply: one or two short sentences acknowledging what you recorded or explaining something; \
never ask or request anything in reply.
- question: exactly one follow-on question ending in "?". While required details are missing, \
ask for the next ones (for example "What is the signer's name and title at Acme?"). When every \
required detail is filled, say in reply that the document is ready to download as a PDF, and \
ask in question whether they want to change anything.

How to fill the draft:
- parties: exactly two, in the order of the chosen document's party roles. Each has the \
signer's personal name and title, the company (organization) name, and a noticeAddress (email \
or postal).
- terms: one entry per term of the chosen document, with the label exactly as listed.
- Record each detail as soon as the user gives it, including details given earlier in the \
conversation or in the message that picks the document, even when related details are still \
unknown. Keep current values unless the user changes them, and use empty strings for anything \
unknown. Never invent values the user has not given you.
- Write dates as yyyy-mm-dd, resolving relative dates like "today" using today's date.
- If the user switches to a different document, keep the parties and any terms that still apply.

Current draft:
{draft}"""

DocumentId = Literal[("", *CATALOG)]


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class Party(CamelModel):
    name: str
    title: str
    company: str
    notice_address: str


EMPTY_PARTY = Party(name="", title="", company="", notice_address="")


class Term(BaseModel):
    label: str
    value: str


class Draft(CamelModel):
    """The document being drafted; mirrors the frontend `Draft`."""

    document_id: DocumentId
    parties: list[Party]
    terms: list[Term]


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[Message]
    draft: Draft


class ChatTurn(BaseModel):
    """One assistant turn: the message to show and the updated draft."""

    reply: str
    draft: Draft


class LlmTurn(BaseModel):
    """What the LLM returns. The draft comes first so details are recorded before replying, and
    the separate question guarantees every turn moves the conversation forward."""

    draft: Draft
    reply: str
    question: str


def describe(doc: DocumentType) -> str:
    """One catalog entry for the system prompt."""
    terms = "; ".join(
        f"{t.label} ({t.description}{', optional' if t.optional else ''})" for t in doc.terms
    )
    return (
        f"- {doc.id}: {doc.name} - {doc.description}\n"
        f"  Parties: {', '.join(doc.parties)}\n"
        f"  Terms: {terms}"
    )


def build_messages(messages: list[Message], draft: Draft) -> list[dict]:
    """System prompt with today's date, the catalog and the current draft, then the conversation."""
    system = SYSTEM_PROMPT.format(
        today=date.today().isoformat(),
        documents="\n".join(describe(doc) for doc in CATALOG.values()),
        draft=draft.model_dump_json(by_alias=True, indent=2),
    )
    return [{"role": "system", "content": system}, *(m.model_dump() for m in messages)]


def normalize(draft: Draft) -> Draft:
    """Fit the draft to its document: two parties, and exactly the document's terms in order."""
    parties = (draft.parties + [EMPTY_PARTY, EMPTY_PARTY])[:2]
    doc = CATALOG.get(draft.document_id)
    if doc is None:
        return Draft(document_id="", parties=parties, terms=[])
    values = {t.label: t.value for t in draft.terms}
    terms = [Term(label=t.label, value=values.get(t.label, "")) for t in doc.terms]
    return Draft(document_id=doc.id, parties=parties, terms=terms)


def ask(messages: list[Message], draft: Draft) -> LlmTurn:
    """One Structured Outputs call to the LLM."""
    response = completion(
        model=MODEL,
        messages=build_messages(messages, draft),
        response_format=LlmTurn,
        reasoning_effort="low",
        extra_body=EXTRA_BODY,
    )
    return LlmTurn.model_validate_json(response.choices[0].message.content)


def chat(request: ChatRequest) -> ChatTurn:
    """Ask the LLM for the next reply and updated draft; an empty history yields a greeting.

    The LLM only fills terms it sees slots for, so when it picks a new document the turn is
    asked again with that document's empty terms, recording details given in the same message.
    """
    draft = normalize(request.draft)
    turn = ask(request.messages, draft)
    picked = normalize(turn.draft)
    if picked.document_id and picked.document_id != draft.document_id:
        turn = ask(request.messages, picked)
    reply = "\n\n".join(part for part in (turn.reply.strip(), turn.question.strip()) if part)
    return ChatTurn(reply=reply, draft=normalize(turn.draft))
