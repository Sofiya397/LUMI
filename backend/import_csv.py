from pathlib import Path

import pandas as pd

from database import get_connection, init_db

CSV_PATH = Path(__file__).resolve().parent / "data" / "skincare_products.csv"
REQUIRED_COLUMNS = ["name", "brand", "type", "ingredients", "country", "afterUse"]


def import_products_from_csv():
    print(f"Читаємо {CSV_PATH.name}...")
    df = pd.read_csv(CSV_PATH)

    missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing:
        raise ValueError(f"У CSV бракує колонок: {missing}")

    df = df.dropna(subset=["name"]).fillna("")

    products_data = [
        (row["name"].strip(), row["brand"], row["type"],
         row["ingredients"], row["country"], row["afterUse"])
        for _, row in df.iterrows()
    ]

    init_db()
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM products")
    cursor.executemany('''
        INSERT INTO products (name, brand, category, ingredients, country, effects)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', products_data)

    conn.commit()
    conn.close()
    print(f"Успішно завантажено {len(products_data)} засобів у базу даних LUMI!")


if __name__ == '__main__':
    import_products_from_csv()
