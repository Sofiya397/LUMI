"""Збереження (#32) та оновлення (#33) відповідей опитування."""
import sqlite3

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from database import get_connection

router = APIRouter(tags=["Quiz"])


class QuizAnswers(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    answer_1: str = Field(min_length=1)
    answer_2: str = Field(min_length=1)
    answer_3: str = Field(min_length=1)
    answer_4: str = Field(min_length=1)
    answer_5: str = Field(min_length=1)
    answer_6: str = Field(min_length=1)
    answer_7: str = Field(min_length=1)
    answer_8: str = Field(min_length=1)
    answer_9: str = Field(min_length=1)
    answer_10: str = Field(min_length=1)


COLUMNS = [f"answer_{i}" for i in range(1, 11)]
INSERT_SQL = (
    f"INSERT INTO quiz_answers (user_id, {', '.join(COLUMNS)}) "
    f"VALUES ({', '.join(['?'] * 11)})"
)
UPDATE_SQL = (
    "UPDATE quiz_answers SET "
    + ", ".join(c + " = ?" for c in COLUMNS)
    + ", updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
)


def _ensure_user_exists(conn, user_id: int):
    row = conn.execute("SELECT id FROM users WHERE id = ?", (user_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")


def _values(answers: QuizAnswers) -> list:
    data = answers.model_dump()
    return [data[c] for c in COLUMNS]


@router.post("/sendAnswers")
def save_answers(user_id: int, answers: QuizAnswers):
    conn = get_connection()
    try:
        _ensure_user_exists(conn, user_id)
        conn.execute(INSERT_SQL, (user_id, *_values(answers)))
        conn.commit()
    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=400,
            detail="Відповіді вже збережені. Щоб змінити їх, використайте PUT /sendAnswers",
        )
    finally:
        conn.close()

    return {"message": "Відповіді збережені успішно"}


@router.put("/sendAnswers")
def update_answers(user_id: int, answers: QuizAnswers):
    conn = get_connection()
    try:
        _ensure_user_exists(conn, user_id)
        cursor = conn.execute(UPDATE_SQL, (*_values(answers), user_id))
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Відповіді ще не збережені. Спершу пройдіть опитування",
            )
    finally:
        conn.close()

    return {"message": "Відповіді оновлені успішно"}

# Тип шкіри визначається відповіддю на 3-тє питання опитування (skin_type)
SKIN_TYPES = {
    "Стягнута, іноді лущиться": "Суха",
    "Блищить по всьому обличчю": "Жирна",
    "Блищить лише Т-зона (лоб, ніс, підборіддя)": "Комбінована",
    "Комфортно, без блиску і стягнутості": "Нормальна",
}


@router.get("/users/{user_id}/skin-type")
def get_skin_type(user_id: int):
    conn = get_connection()
    try:
        _ensure_user_exists(conn, user_id)
        row = conn.execute(
            "SELECT answer_3 FROM quiz_answers WHERE user_id = ?", (user_id,)
        ).fetchone()
    finally:
        conn.close()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Користувач ще не пройшов опитування",
        )

    return {
        "user_id": user_id,
        "skin_type": SKIN_TYPES.get(row[0], "Нормальна"),
    }