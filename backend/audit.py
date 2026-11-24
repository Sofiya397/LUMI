"""Журнал аудиту (задача 5.4): одна спільна функція запису подій.

Схема таблиці і допустимі значення описані в docs/db/consents-audit-schema.md.
У журнал пишемо лише id користувача, без email і імені (мінімізація даних).
"""
from database import get_connection

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
