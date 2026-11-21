"""Створює (або підвищує до admin) тестового адміністратора.
Запуск: python3 create_admin.py
"""
from database import get_connection, init_db
from security import hash_password

ADMIN_EMAIL = "admin@lumi.com"
ADMIN_PASSWORD = "admin123"
ADMIN_NAME = "Admin"


def main():
    init_db()
    conn = get_connection()
    try:
        row = conn.execute("SELECT id FROM users WHERE email = ?", (ADMIN_EMAIL,)).fetchone()
        if row:
            conn.execute("UPDATE users SET role = 'admin' WHERE id = ?", (row["id"],))
            admin_id = row["id"]
        else:
            cur = conn.execute(
                "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, 'admin')",
                (ADMIN_NAME, ADMIN_EMAIL, hash_password(ADMIN_PASSWORD)),
            )
            admin_id = cur.lastrowid
        conn.commit()
    finally:
        conn.close()
    print(f"Адмін готовий: id={admin_id}, email={ADMIN_EMAIL}, пароль={ADMIN_PASSWORD}")


if __name__ == "__main__":
    main()