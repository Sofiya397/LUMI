import sqlite3

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from database import get_connection, init_db
from security import hash_password

app = FastAPI(title="LUMI API", description="Backend для платформи догляду за шкірою LUMI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()


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

        return {"message": "Користувача успішно створено!", "user_id": cursor.lastrowid}

    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Користувач з таким email вже існує")

    finally:
        conn.close()


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
