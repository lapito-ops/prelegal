"""Sign up, sign in and cookie-based sessions."""

import hashlib
import secrets
import sqlite3
from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from pydantic import BaseModel, Field, field_validator

from app.db import Db

COOKIE = "session"

SessionCookie = Annotated[str | None, Cookie()]

router = APIRouter(prefix="/api/auth")


class SignIn(BaseModel):
    email: str = Field(min_length=3, max_length=254, pattern=r"^[^@\s]+@[^@\s]+$")
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, email: str) -> str:
        return email.strip().lower()


class SignUp(SignIn):
    password: str = Field(min_length=8, max_length=128)


class User(BaseModel):
    id: int
    email: str


def hash_password(password: str, salt: bytes | None = None) -> str:
    """scrypt hash stored as "salt:digest" in hex."""
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)
    return f"{salt.hex()}:{digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    salt = bytes.fromhex(stored.split(":")[0])
    return secrets.compare_digest(hash_password(password, salt), stored)


def start_session(db: sqlite3.Connection, response: Response, user_id: int) -> None:
    token = secrets.token_urlsafe(32)
    db.execute("INSERT INTO sessions (token, user_id) VALUES (?, ?)", (token, user_id))
    response.set_cookie(COOKIE, token, httponly=True, samesite="lax")


def current_user(db: Db, session: SessionCookie = None) -> User:
    """The signed-in user, or 401."""
    row = db.execute(
        "SELECT users.id, users.email FROM sessions JOIN users ON users.id = sessions.user_id "
        "WHERE sessions.token = ?",
        (session,),
    ).fetchone()
    if row is None:
        raise HTTPException(401, "Not signed in")
    return User(**row)


CurrentUser = Annotated[User, Depends(current_user)]


@router.post("/signup", status_code=201)
def sign_up(body: SignUp, db: Db, response: Response) -> User:
    try:
        cursor = db.execute(
            "INSERT INTO users (email, password_hash) VALUES (?, ?)",
            (body.email, hash_password(body.password)),
        )
    except sqlite3.IntegrityError:
        raise HTTPException(409, "An account with this email already exists")
    start_session(db, response, cursor.lastrowid)
    return User(id=cursor.lastrowid, email=body.email)


@router.post("/signin")
def sign_in(body: SignIn, db: Db, response: Response) -> User:
    row = db.execute(
        "SELECT id, email, password_hash FROM users WHERE email = ?", (body.email,)
    ).fetchone()
    if row is None or not verify_password(body.password, row["password_hash"]):
        raise HTTPException(401, "Incorrect email or password")
    start_session(db, response, row["id"])
    return User(id=row["id"], email=row["email"])


@router.post("/signout", status_code=204)
def sign_out(db: Db, response: Response, session: SessionCookie = None) -> None:
    db.execute("DELETE FROM sessions WHERE token = ?", (session,))
    response.delete_cookie(COOKIE)


@router.get("/me")
def me(user: CurrentUser) -> User:
    return user
