"""Профіль шкіри для передачі в LUMI AI (задача 5.6).

Профіль будується з відповідей опитування і перевіряється за JSON Schema
(backend/schemas/skin_profile.schema.json). Використовується в 5.7.

Мінімізація даних: у профіль не потрапляють email, ім'я, стать та id
користувача — лише те, що потрібно для підбору догляду.
"""
import json
from pathlib import Path

from jsonschema import Draft202012Validator

from database import get_connection

SCHEMA_PATH = Path(__file__).resolve().parent / "schemas" / "skin_profile.schema.json"
SCHEMA = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
_validator = Draft202012Validator(SCHEMA)

# Тексти відповідей опитування (frontend/src/data/quiz-questions.js) → коди схеми
ANSWER_CODES = {
    "age_group": {  # answer_1
        "До 18": "under_18",
        "18–24": "18_24",
        "25–34": "25_34",
        "35–44": "35_44",
        "45 і більше": "45_plus",
    },
    "skin_type": {  # answer_3
        "Стягнута, іноді лущиться": "dry",
        "Блищить по всьому обличчю": "oily",
        "Блищить лише Т-зона (лоб, ніс, підборіддя)": "combination",
        "Комфортно, без блиску і стягнутості": "normal",
    },
    "sensitivity": {  # answer_4
        "Часто червоніє, пече або свербить": "high",
        "Іноді реагує на окремі засоби": "medium",
        "Майже ніколи не реагує": "low",
    },
    "concerns": {  # answer_5, до трьох варіантів через ", "
        "Висипання та акне": "acne",
        "Розширені пори": "pores",
        "Пігментні плями": "pigmentation",
        "Зморшки та втрата пружності": "wrinkles",
        "Сухість і лущення": "dryness",
        "Почервоніння": "redness",
    },
    "breakouts": {  # answer_6
        "Майже щодня": "daily",
        "Кілька разів на місяць": "monthly",
        "Рідко, перед циклом або при стресі": "rare",
        "Ніколи": "never",
    },
    "sun_exposure": {  # answer_7
        "Менше 30 хвилин": "lt_30m",
        "30 хвилин – 1 година": "30m_1h",
        "1–3 години": "1h_3h",
        "Більше 3 годин": "gt_3h",
    },
    "sleep": {  # answer_8
        "7–9 годин, висипаюсь": "good",
        "6–7 годин": "6_7h",
        "Менше 6 годин": "lt_6h",
        "Сплю неспокійно": "restless",
    },
    "routine": {  # answer_9
        "Нічого або лише вода": "none",
        "Вмивання і крем": "basic",
        "Вмивання, сироватка, крем і SPF": "extended",
        "Повний багатокроковий догляд": "full",
    },
    "budget": {  # answer_10
        "До 300 грн": "lt_300",
        "300–700 грн": "300_700",
        "700–1500 грн": "700_1500",
        "Понад 1500 грн": "gt_1500",
    },
}

# Яке поле профілю береться з якої відповіді (answer_2 — стать — не передається)
FIELD_ANSWERS = {
    "age_group": "answer_1",
    "skin_type": "answer_3",
    "sensitivity": "answer_4",
    "concerns": "answer_5",
    "breakouts": "answer_6",
    "sun_exposure": "answer_7",
    "sleep": "answer_8",
    "routine": "answer_9",
    "budget": "answer_10",
}


def build_skin_profile(answers: dict) -> dict:
    """Перетворює відповіді опитування (answer_1 … answer_10) на профіль.

    Невідома відповідь стає None — тоді validate_skin_profile поверне помилку,
    а не тихо передасть неправильні дані.
    """
    profile = {"schema_version": SCHEMA["properties"]["schema_version"]["const"]}
    for field, answer_key in FIELD_ANSWERS.items():
        text = answers.get(answer_key) or ""
        codes = ANSWER_CODES[field]
        if field == "concerns":
            profile[field] = [codes.get(item.strip()) for item in text.split(", ") if item.strip()]
        else:
            profile[field] = codes.get(text.strip())
    return profile


def validate_skin_profile(profile: dict) -> list[str]:
    """Перевіряє профіль за JSON Schema. Повертає список помилок (порожній — усе гаразд)."""
    errors = []
    for error in sorted(_validator.iter_errors(profile), key=lambda e: list(e.path)):
        field = ".".join(str(part) for part in error.path) or "profile"
        errors.append(f"{field}: {error.message}")
    return errors


def get_skin_profile(user_id: int):
    """Профіль користувача з його відповідей. None — якщо опитування не пройдене."""
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM quiz_answers WHERE user_id = ?", (user_id,)
        ).fetchone()
    finally:
        conn.close()

    if row is None:
        return None
    return build_skin_profile(dict(row))
