"""Supported document types, loaded from the repository's catalog.json."""

import os
from pathlib import Path

from pydantic import BaseModel, TypeAdapter

REPO_ROOT = Path(__file__).resolve().parents[2]
CATALOG_PATH = Path(os.environ.get("CATALOG_PATH", REPO_ROOT / "catalog.json"))


class TermDef(BaseModel):
    """A key term the cover page fills in, e.g. "Governing Law"."""

    label: str
    description: str
    optional: bool = False


class DocumentType(BaseModel):
    id: str
    name: str
    description: str
    filename: str
    parties: list[str]
    terms: list[TermDef]


def load_catalog() -> dict[str, DocumentType]:
    """Document types keyed by id."""
    docs = TypeAdapter(list[DocumentType]).validate_json(CATALOG_PATH.read_bytes())
    return {doc.id: doc for doc in docs}


CATALOG = load_catalog()
