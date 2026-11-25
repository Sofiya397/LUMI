"""API згод на обробку даних (задача 5.2).
Схема: docs/db/consents-audit-schema.md (#128).
Кожна зміна згоди — новий запис; поточний стан — останній запис для user_id + type.
"""
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from database import get_connection

CONSENT_TYPES = ("data_processing", "ai_profile_sharing")

router = APIRouter(prefix="/consents", tags=["Consents"])


class ConsentChange(BaseModel):
    type: Literal["data_processing", "ai_profile_sharing"]
    granted: bool


def _ensure_user_exists(conn, user_id: int):
    row = conn.execute("SELECT id FROM users WHERE id = ?", (user_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")


def _current(conn, user_id: int, consent_type: str) -> dict:
    row = conn.execute(
        """SELECT granted, created_at FROM consents
           WHERE user_id = ? AND type = ?
           ORDER BY created_at DESC, id DESC
           LIMIT 1""",
        (user_id, consent_type),
    ).fetchone()
    if row is None:
        return {"granted": False, "changed_at": None}
    return {"granted": bool(row["granted"]), "changed_at": row["created_at"]}


def has_consent(user_id: int, consent_type: str) -> bool:
    """Чи є зараз згода. Використовується в 5.7 (передача профілю в LUMI AI)."""
    conn = get_connection()
    try:
        return _current(conn, user_id, consent_type)["granted"]
    finally:
        conn.close()


@router.post("")
def change_consent(user_id: int, data: ConsentChange):
    conn = get_connection()
    try:
        _ensure_user_exists(conn, user_id)
        conn.execute(
            "INSERT INTO consents (user_id, type, granted) VALUES (?, ?, ?)",
            (user_id, data.type, int(data.granted)),
        )
        conn.commit()
        state = _current(conn, user_id, data.type)
    finally:
        conn.close()

    # TODO (після 5.4): записати consent_granted / consent_revoked в audit_log

    message = "Згоду надано" if data.granted else "Згоду відкликано"
    return {"message": message, "type": data.type, **state}


@router.get("")
def get_consents(user_id: int):
    conn = get_connection()
    try:
        _ensure_user_exists(conn, user_id)
        return {t: _current(conn, user_id, t) for t in CONSENT_TYPES}
    finally:
        conn.close()


@router.get("/history")
def get_consent_history(user_id: int):
    conn = get_connection()
    try:
        _ensure_user_exists(conn, user_id)
        rows = conn.execute(
            """SELECT type, granted, created_at FROM consents
               WHERE user_id = ?
               ORDER BY created_at DESC, id DESC""",
            (user_id,),
        ).fetchall()
    finally:
        conn.close()
    return [
        {"type": r["type"], "granted": bool(r["granted"]), "created_at": r["created_at"]}
        for r in rows
    ]