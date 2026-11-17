"""AI chat that drafts a Mutual NDA by asking questions and filling in its fields."""

from datetime import date
from typing import Literal

from litellm import completion
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}

SYSTEM_PROMPT = """You are Prelegal, a friendly assistant helping the user draft a Common Paper \
Mutual Non-Disclosure Agreement (MNDA). Today is {today}.

Hold a natural conversation. Ask about one or two fields at a time, starting with what the NDA \
is for and who the parties are. Keep replies short. When every field is filled, tell the user \
the document is ready to download as a PDF and offer to change anything.

Fields:
- purpose: how Confidential Information may be used
- effectiveDate: ISO date yyyy-mm-dd; resolve relative dates like "today" using today's date
- mndaTermType: "expires" (after mndaTermYears years) or "untilTerminated"
- confidentialityType: "years" (for confidentialityYears years) or "perpetual"
- governingLaw: a US state; jurisdiction: city or county and state of the courts
- modifications: optional changes to the standard terms, empty if none
- party1 / party2: name and title of the signer, company, noticeAddress (email or postal)

Current field values:
{fields}

Always return every field. Record each detail as soon as the user gives it, even when other \
details of the same party are still unknown (for example, set a party's company before you know \
its signer). Keep current values unless the user changes them, and use empty strings for \
anything still unknown. Never invent values the user has not given you."""


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class Party(CamelModel):
    name: str
    title: str
    company: str
    notice_address: str


class NdaFields(CamelModel):
    """Mirror of the frontend `NdaData`; every field is required for strict Structured Outputs."""

    purpose: str
    effective_date: str
    mnda_term_type: Literal["expires", "untilTerminated"]
    mnda_term_years: int
    confidentiality_type: Literal["years", "perpetual"]
    confidentiality_years: int
    governing_law: str
    jurisdiction: str
    modifications: str
    party1: Party
    party2: Party


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[Message]
    fields: NdaFields


class ChatTurn(CamelModel):
    """One assistant turn: the message to show and the updated document fields."""

    reply: str
    fields: NdaFields


def build_messages(request: ChatRequest) -> list[dict]:
    """System prompt with today's date and current fields, followed by the conversation."""
    system = SYSTEM_PROMPT.format(
        today=date.today().isoformat(),
        fields=request.fields.model_dump_json(by_alias=True, indent=2),
    )
    return [{"role": "system", "content": system}, *(m.model_dump() for m in request.messages)]


def chat(request: ChatRequest) -> ChatTurn:
    """Ask the LLM for the next reply and updated fields; an empty history yields a greeting."""
    response = completion(
        model=MODEL,
        messages=build_messages(request),
        response_format=ChatTurn,
        reasoning_effort="low",
        extra_body=EXTRA_BODY,
    )
    return ChatTurn.model_validate_json(response.choices[0].message.content)
