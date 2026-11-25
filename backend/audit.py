"""Журнал аудиту: функція запису подій (задача 5.4) і перегляд журналу для адміна (5.5).

Схема таблиці і допустимі значення описані в docs/db/consents-audit-schema.md.
У журнал пишемо лише id користувача, без email і імені (мінімізація даних).
"""
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from database import get_connection
from roles import get_user_role

ACTIONS = (
    "register", "login", "consent_granted", "consent_revoked",
    "quiz_saved", "profile_shared", "audit_viewed", "user_deleted",
)
DATASETS = ("account", "quiz_answers", "skin_profile", "consents", "audit_log")
RESULTS = ("success", "denied", "invalid", "error")


def log_event(actor_id, action, dataset, result, consumer=None, reason=None, conn=None):
    """Записує подію в audit_log.

    actor_id  — id користувача або None, якщо користувач невідомий
    action    — що зробили (див. ACTIONS)
    dataset   — з якими даними (див. DATASETS)
    result    — success / denied / invalid / error
    consumer  — кому передано дані (наприклад, "LUMI AI"), інакше None
    reason    — коротка причина відмови, без персональних даних
    conn      — відкрите з'єднання з БД, якщо воно вже є в ендпоінті

    Помилка запису в журнал не ламає основну дію: її лише видно в консолі сервера.
    """
    own_conn = conn is None
    try:
        if own_conn:
            conn = get_connection()
        conn.execute(
            """
            INSERT INTO audit_log (actor_id, action, dataset, consumer, result, reason)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (actor_id, action, dataset, consumer, result, reason),
        )
        conn.commit()
    except Exception as error:
        print(f"[audit] Не вдалося записати подію {action}: {error}")
    finally:
        if own_conn and conn is not None:
            conn.close()


# ---------------------------------------------------------------------------
# Перегляд журналу аудиту (задача 5.5): лише для адміністратора
# ---------------------------------------------------------------------------

router = APIRouter(prefix="/admin", tags=["Audit"])


def require_admin_for_audit(user_id: int) -> int:
    """Як require_admin, але ще й записує в журнал спробу доступу без прав."""
    role = get_user_role(user_id)  # 404, якщо користувача немає
    if role != "admin":
        log_event(user_id, "audit_viewed", "audit_log", "denied",
                  reason=f"роль {role}, потрібна admin")
        raise HTTPException(status_code=403, detail="Доступ лише для адміністратора")
    return user_id


@router.get("/audit")
def get_audit_log(
    admin_id: int = Depends(require_admin_for_audit),
    action: Optional[Literal[ACTIONS]] = None,
    result: Optional[Literal[RESULTS]] = None,
    actor_id: Optional[int] = None,
    limit: int = Query(100, ge=1, le=500),
):
    """Останні події журналу, найновіші зверху. Фільтри: action, result, actor_id."""
    query = "SELECT * FROM audit_log WHERE 1=1"
    params = []
    if action:
        query += " AND action = ?"
        params.append(action)
    if result:
        query += " AND result = ?"
        params.append(result)
    if actor_id is not None:
        query += " AND actor_id = ?"
        params.append(actor_id)
    query += " ORDER BY created_at DESC, id DESC LIMIT ?"
    params.append(limit)

    conn = get_connection()
    try:
        rows = conn.execute(query, params).fetchall()
    finally:
        conn.close()

    log_event(admin_id, "audit_viewed", "audit_log", "success")
    return {"count": len(rows), "items": [dict(row) for row in rows]}
