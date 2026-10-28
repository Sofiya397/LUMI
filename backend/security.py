import bcrypt


def hash_password(password: str) -> str:
    """Повертає bcrypt-хеш пароля (сіль генерується автоматично)."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Перевіряє, чи відповідає пароль збереженому хешу (знадобиться для логіну)."""
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
