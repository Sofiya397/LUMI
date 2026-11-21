"""Ролі користувачів і перевірка доступу (RBAC)."""
from fastapi import APIRouter, Depends, HTTPException

from database import get_connection

ROLES = ("user", "admin")

router = APIRouter(prefix="/admin", tags=["Admin"])


def get_user_role(user_id: int) -> str:
    conn = get_connection()
    try:
        row = conn.execute("SELECT role FROM users WHERE id = ?", (user_id,)).fetchone()
    finally:
        conn.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")
    return row["role"]


def require_admin(user_id: int) -> int:
    """Спільна перевірка для всіх адмін-ендпоінтів."""
    if get_user_role(user_id) != "admin":
        raise HTTPException(status_code=403, detail="Доступ лише для адміністратора")
    return user_id


@router.get("/users")
def list_users(admin_id: int = Depends(require_admin)):
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT id, username, email, role, created_at FROM users ORDER BY id"
        ).fetchall()
    finally:
        conn.close()
    return [dict(r) for r in rows]