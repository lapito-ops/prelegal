"""Each user's saved documents: the draft plus the chat that produced it."""

import sqlite3
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException
from pydantic import TypeAdapter

from app.auth import CurrentUser, User
from app.chat import CamelModel, Draft, Message
from app.db import NOW, Db

router = APIRouter(prefix="/api/documents")

Messages = TypeAdapter(list[Message])


class DocumentIn(CamelModel):
    draft: Draft
    messages: list[Message]


class DocumentSummary(CamelModel):
    id: UUID
    draft: Draft
    updated_at: str


class SavedDocument(DocumentSummary):
    messages: list[Message]


def serialize(body: DocumentIn) -> tuple[str, str]:
    """The draft and messages as stored JSON."""
    return body.draft.model_dump_json(by_alias=True), Messages.dump_json(body.messages).decode()


def _load(db: sqlite3.Connection, user: User, document_id: UUID) -> SavedDocument:
    """One of the user's documents, or 404."""
    row = db.execute(
        "SELECT * FROM documents WHERE id = ? AND user_id = ?", (str(document_id), user.id)
    ).fetchone()
    if row is None:
        raise HTTPException(404, "Document not found")
    return SavedDocument(
        id=row["id"],
        draft=Draft.model_validate_json(row["draft"]),
        messages=Messages.validate_json(row["messages"]),
        updated_at=row["updated_at"],
    )


@router.get("")
def list_documents(db: Db, user: CurrentUser) -> list[DocumentSummary]:
    """The user's documents, most recently updated first."""
    rows = db.execute(
        "SELECT id, draft, updated_at FROM documents WHERE user_id = ? ORDER BY updated_at DESC",
        (user.id,),
    ).fetchall()
    return [
        DocumentSummary(id=r["id"], draft=Draft.model_validate_json(r["draft"]), updated_at=r["updated_at"])
        for r in rows
    ]


@router.get("/{document_id}")
def get_document(document_id: UUID, db: Db, user: CurrentUser) -> SavedDocument:
    return _load(db, user, document_id)


@router.post("", status_code=201)
def create_document(body: DocumentIn, db: Db, user: CurrentUser) -> SavedDocument:
    document_id = uuid4()
    db.execute(
        "INSERT INTO documents (id, user_id, draft, messages) VALUES (?, ?, ?, ?)",
        (str(document_id), user.id, *serialize(body)),
    )
    return _load(db, user, document_id)


@router.put("/{document_id}")
def save_document(document_id: UUID, body: DocumentIn, db: Db, user: CurrentUser) -> SavedDocument:
    """Replace a document's draft and messages; another user's document is a 404."""
    db.execute(
        f"UPDATE documents SET draft = ?, messages = ?, updated_at = {NOW} WHERE id = ? AND user_id = ?",
        (*serialize(body), str(document_id), user.id),
    )
    return _load(db, user, document_id)
