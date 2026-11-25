import sqlite3
from datetime import date, timedelta

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from database import get_connection, init_db
from security import hash_password, verify_password
from audit import log_event
from oauth_mock import router as oauth_router
from quiz import router as quiz_router
from roles import router as roles_router
from consents import router as consents_router

app = FastAPI(title="LUMI API", description="Backend для платформи догляду за шкірою LUMI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()
app.include_router(oauth_router)
app.include_router(quiz_router)
app.include_router(roles_router)
app.include_router(consents_router)

# Тексти помилок для полів реєстрації
REGISTER_FIELD_ERRORS = {
    "username": "Введи своє ім'я",
    "email": "Введи коректний email",
    "password": "Пароль — мінімум 6 символів",
}


class UserCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    username: str = Field(min_length=1, max_length=50)
    email: EmailStr
    password: str = Field(min_length=6)

    @field_validator("password")
    @classmethod
    def password_fits_bcrypt(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Пароль занадто довгий")
        return value
  
class UserLogin(BaseModel):
    email: EmailStr
    password: str


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    errors = {}
    for error in exc.errors():
        field = str(error["loc"][-1])
        if field in errors:
            continue
        if field == "password" and "занадто довгий" in error.get("msg", ""):
            errors[field] = "Пароль занадто довгий"
        else:
            errors[field] = REGISTER_FIELD_ERRORS.get(field, "Некоректне значення")
    return JSONResponse(status_code=422, content={"detail": errors})


@app.get("/")
def read_root():
    return {"message": "Welcome to LUMI API!"}


@app.post("/register")
def register_user(user: UserCreate):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute('''
            INSERT INTO users (username, email, password_hash)
            VALUES (?, ?, ?)
        ''', (user.username, user.email.lower(), hash_password(user.password)))
        conn.commit()
        log_event(cursor.lastrowid, "register", "account", "success", conn=conn)

        return {"message": "Користувача успішно створено!", "user_id": cursor.lastrowid}

    except sqlite3.IntegrityError:
        log_event(None, "register", "account", "denied", reason="email вже існує", conn=conn)
        raise HTTPException(status_code=400, detail="Користувач з таким email вже існує")

    finally:
        conn.close()

@app.post("/login")
def login_user(data: UserLogin):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT id, username, password_hash, role FROM users WHERE email = ?",
            (data.email.lower(),),
        )
        row = cursor.fetchone()

        if row is None or not verify_password(data.password, row[2]):
            log_event(row[0] if row else None, "login", "account", "denied",
                      reason="неправильний логін або пароль", conn=conn)
            raise HTTPException(status_code=401, detail="Неправильний логін або пароль")

        log_event(row[0], "login", "account", "success", conn=conn)

        return {
            "message": "Користувача знайдено",
            "user_id": row[0],
            "username": row[1],
            "role": row[3],
        }
    finally:
        conn.close()

@app.get("/users/{user_id}")
def get_user(user_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT id, username, email FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()

        if row is None:
            raise HTTPException(status_code=404, detail="Користувача не знайдено")

        return {"id": row[0], "username": row[1], "email": row[2]}

    finally:
        conn.close()


@app.get("/users/{user_id}/streak")
def get_streak(user_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT id FROM users WHERE id = ?", (user_id,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail="Користувача не знайдено")

        # дні, коли користувач відмітив хоча б один крок догляду
        cursor.execute('''
            SELECT DISTINCT log_date FROM daily_logs
            WHERE user_id = ? AND (
                morning_cleanser = 1 OR morning_moisturizer = 1 OR morning_spf = 1 OR
                evening_cleanser = 1 OR evening_moisturizer = 1
            )
            ORDER BY log_date DESC
        ''', (user_id,))
        days = [date.fromisoformat(row[0]) for row in cursor.fetchall()]
    finally:
        conn.close()

    # серія рахується від сьогодні; якщо сьогодні ще немає відміток — від учора
    streak = 0
    if days:
        current = date.today()
        if days[0] < current:
            current -= timedelta(days=1)
        for day in days:
            if day == current:
                streak += 1
                current -= timedelta(days=1)
            elif day < current:
                break

    return {
        "user_id": user_id,
        "streak": streak,
        "last_active_date": days[0].isoformat() if days else None,
    }

@app.delete("/users/{user_id}")
def delete_user(user_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Користувача не знайдено")

        return {"message": "Користувача видалено", "user_id": user_id}
    finally:
        conn.close()


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
