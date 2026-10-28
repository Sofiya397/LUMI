"""Імітація входу та реєстрації через Google / Apple (OAuth).

Справжні провайдери підписують ID-токен своїм приватним ключем,
а сервер перевіряє підпис публічним ключем. Тут ми генеруємо
пару ключів самі, тобто «Google» живе всередині нашого бекенду.
"""
import secrets
import sqlite3
import time

import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from database import get_connection
from security import hash_password

router = APIRouter(prefix="/auth", tags=["OAuth (імітація)"])

SUPPORTED_PROVIDERS = ("google",)

# Пара ключів для кожного провайдера: приватний «у Google», публічний «у нас».
_KEYS = {}
for _name in SUPPORTED_PROVIDERS:
    _private = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    _KEYS[_name] = {"private": _private, "public": _private.public_key()}


class MockTokenRequest(BaseModel):
    email: EmailStr
    name: str = "Test User"


class TokenRequest(BaseModel):
    id_token: str


def _get_keys(provider: str) -> dict:
    if provider not in _KEYS:
        raise HTTPException(status_code=404, detail="Невідомий провайдер")
    return _KEYS[provider]


def _verify_token(provider: str, token: str) -> dict:
    """Перевіряє підпис токена публічним ключем провайдера."""
    try:
        return jwt.decode(
            token,
            _get_keys(provider)["public"],
            algorithms=["RS256"],
            issuer=provider,
        )
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Неправильний логін або пароль")


@router.post("/{provider}/mock-token")
def issue_mock_token(provider: str, data: MockTokenRequest):
    """Грає роль Google/Apple: видає підписаний ID-токен для тестування."""
    payload = {
        "iss": provider,
        "email": data.email.lower(),
        "name": data.name,
        "exp": int(time.time()) + 600,  # токен дійсний 10 хвилин
    }
    token = jwt.encode(payload, _get_keys(provider)["private"], algorithm="RS256")
    return {"id_token": token}


@router.post("/{provider}/login")
def oauth_login(provider: str, data: TokenRequest):
    claims = _verify_token(provider, data.id_token)

    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT id, username, role FROM users WHERE email = ?",
            (claims["email"],),
        ).fetchone()
    finally:
        conn.close()

    if row is None:
        raise HTTPException(status_code=401, detail="Неправильний логін або пароль")

    return {
        "message": "Користувача знайдено",
        "user_id": row[0],
        "username": row[1],
        "role": row[2],
    }


@router.post("/{provider}/register")
def oauth_register(provider: str, data: TokenRequest):
    claims = _verify_token(provider, data.id_token)
    username = claims.get("name") or claims["email"].split("@")[0]

    conn = get_connection()
    try:
        # Пароля від Google немає, тому зберігаємо хеш випадкового рядка.
        cursor = conn.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
            (username, claims["email"], hash_password(secrets.token_urlsafe(16))),
        )
        conn.commit()
        return {"message": "Користувача успішно створено!", "user_id": cursor.lastrowid}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Користувач з таким email вже існує")
    finally:
        conn.close()