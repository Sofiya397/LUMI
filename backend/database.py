import sqlite3
from pathlib import Path

# База лежить поруч із цим файлом, тому шлях не залежить від того, звідки запускають сервер
DB_PATH = Path(__file__).resolve().parent / "skincode.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Користувачі
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(50) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(20) NOT NULL DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 2. Профіль шкіри (результати опитування)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS skin_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,

            -- Базова інформація
            age_group VARCHAR(20),
            gender VARCHAR(30),

            -- Тип та стан шкіри
            skin_type VARCHAR(50),
            combo_details TEXT,
            is_sensitive BOOLEAN,
            sensitivity_details TEXT,
            morning_state VARCHAR(100),
            after_wash_state VARCHAR(100),

            -- Проблематика
            main_concern VARCHAR(100),
            dermatologist_diagnosis TEXT,
            breakouts_frequency VARCHAR(50),
            breakout_triggers TEXT,
            wrinkles_level VARCHAR(50),
            elasticity VARCHAR(50),
            has_pigmentation BOOLEAN,

            -- Спосіб життя та здоров'я
            sugar_intake VARCHAR(50),
            sleep_quality VARCHAR(50),
            health_issues TEXT,
            supplements TEXT,

            -- Специфічні жіночі питання (NULL, якщо не застосовно)
            menstrual_cycle_stage VARCHAR(50),
            pregnancy_status VARCHAR(50),
            lactation_status VARCHAR(50),

            -- Специфічні чоловічі питання (NULL, якщо не застосовно)
            shave_frequency VARCHAR(50),
            shave_reaction VARCHAR(100),
            has_beard VARCHAR(50),
            care_preference VARCHAR(100),

            -- Догляд та бюджет
            current_routine TEXT,
            cosmetologist_visits VARCHAR(100),
            budget_expectation VARCHAR(50),
            additional_info TEXT,

            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')

    # 3. Каталог засобів (структура збігається з CSV у data/)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(200) NOT NULL,
            brand VARCHAR(100),
            category VARCHAR(100),
            ingredients TEXT,
            country VARCHAR(100),
            effects TEXT
        )
    ''')

    # 4. Історія перевірок складу
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS scan_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            product_name TEXT,
            ingredients_text TEXT NOT NULL,
            analysis_result TEXT,
            scan_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')

    # 5. Щоденні відмітки догляду
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS daily_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            log_date DATE NOT NULL,

            morning_cleanser BOOLEAN DEFAULT 0,
            morning_moisturizer BOOLEAN DEFAULT 0,
            morning_spf BOOLEAN DEFAULT 0,

            evening_cleanser BOOLEAN DEFAULT 0,
            evening_moisturizer BOOLEAN DEFAULT 0,

            water_intake INTEGER DEFAULT 0,  -- у мілілітрах

            UNIQUE(user_id, log_date),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')

    # 6. Засоби, збережені у профілі користувача
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS favorite_products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,

            UNIQUE(user_id, product_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )
    ''')

    conn.commit()
    conn.close()


if __name__ == '__main__':
    init_db()
    print(f"База даних успішно ініціалізована: {DB_PATH}")
