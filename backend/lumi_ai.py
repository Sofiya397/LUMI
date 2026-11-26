"""Передача профілю шкіри в LUMI AI (задача 5.7, сценарій UC-07).

Порядок кроків:
користувач → згода → профіль (з опитування) → JSON Schema → LUMI AI (mock) → журнал.
У LUMI AI йде лише профіль зі схеми: без email, імені, статі та id.
"""
from fastapi import APIRouter, HTTPException

from audit import log_event
from consents import has_consent
from database import get_connection
from skin_profile import get_skin_profile, validate_skin_profile

CONSUMER = "LUMI AI"

router = APIRouter(prefix="/ai", tags=["LUMI AI"])

# Імітація LUMI AI: короткий аналіз залежно від типу шкіри
SKIN_TYPE_ADVICE = {
    "dry": "Шкіра суха: потрібне м'яке очищення, зволожувальна сироватка і живильний крем з керамідами.",
    "oily": "Шкіра жирна: легке гелеве очищення, засоби з ніацинамідом і некомедогенний крем.",
    "combination": "Шкіра комбінована: матувальні засоби на Т-зону і зволоження для щік.",
    "normal": "Шкіра нормальна: базовий догляд — очищення, зволоження і щоденний SPF.",
}
CONCERN_ADVICE = {
    "acne": "проти висипань — засоби з BHA (саліциловою кислотою)",
    "pores": "для пор — ніацинамід",
    "pigmentation": "проти пігментації — вітамін C і обов'язковий SPF",
    "wrinkles": "проти зморшок — ретиноїди ввечері",
    "dryness": "проти сухості — гіалуронова кислота",
    "redness": "проти почервоніння — заспокійливі засоби з центелою",
}


def mock_lumi_ai(profile: dict) -> dict:
    """Імітує відповідь LUMI AI. Отримує лише профіль зі схеми."""
    tips = [CONCERN_ADVICE[c] for c in profile.get("concerns", []) if c in CONCERN_ADVICE]
    return {
        "skin_type": profile["skin_type"],
        "summary": SKIN_TYPE_ADVICE.get(profile["skin_type"], "Базовий догляд."),
        "tips": tips,
    }


def _ensure_user_exists(user_id: int):
    conn = get_connection()
    try:
        row = conn.execute("SELECT id FROM users WHERE id = ?", (user_id,)).fetchone()
    finally:
        conn.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")


@router.post("/share-profile")
def share_profile(user_id: int):
    # 1. Користувач
    _ensure_user_exists(user_id)

    # 2. Згода на передачу профілю в LUMI AI
    if not has_consent(user_id, "ai_profile_sharing"):
        log_event(user_id, "profile_shared", "skin_profile", "denied",
                  consumer=CONSUMER, reason="немає згоди ai_profile_sharing")
        raise HTTPException(
            status_code=403,
            detail="Потрібна згода на передачу профілю в LUMI AI",
        )

    # 3. Профіль з відповідей опитування
    profile = get_skin_profile(user_id)
    if profile is None:
        log_event(user_id, "profile_shared", "skin_profile", "denied",
                  consumer=CONSUMER, reason="опитування не пройдене")
        raise HTTPException(status_code=404, detail="Спершу пройдіть опитування")

    # 4. Валідація за JSON Schema
    errors = validate_skin_profile(profile)
    if errors:
        log_event(user_id, "profile_shared", "skin_profile", "invalid",
                  consumer=CONSUMER, reason=errors[0][:255])
        raise HTTPException(
            status_code=422,
            detail={"message": "Профіль не пройшов перевірку", "errors": errors},
        )

    # 5. Передача в LUMI AI (імітація)
    try:
        analysis = mock_lumi_ai(profile)
    except Exception:
        log_event(user_id, "profile_shared", "skin_profile", "error",
                  consumer=CONSUMER, reason="LUMI AI не відповів")
        raise HTTPException(status_code=502, detail="LUMI AI тимчасово недоступний")

    # 6. Журнал
    log_event(user_id, "profile_shared", "skin_profile", "success", consumer=CONSUMER)

    return {
        "message": "Профіль передано в LUMI AI",
        "shared_fields": sorted(profile.keys()),
        "analysis": analysis,
    }