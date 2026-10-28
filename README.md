# LUMI

Персоналізована AI-платформа для догляду за шкірою. Командний проєкт «Clean code, clean face» (Львівська політехніка).

## Backend

FastAPI + SQLite. Код лежить у папці `backend/`.

### Запуск локально

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env        # на Windows: copy .env.example .env, потім вставити свій ключ
python import_csv.py        # створює базу skincode.db і завантажує каталог засобів
uvicorn main:app --reload
```

Після запуску:
- API: http://127.0.0.1:8000
- документація Swagger: http://127.0.0.1:8000/docs

### Структура

| Файл | Призначення |
|---|---|
| `main.py` | FastAPI-застосунок та ендпоінти |
| `database.py` | Підключення до SQLite та створення таблиць |
| `import_csv.py` | Імпорт каталогу засобів з `data/skincare_products.csv` |
| `.env.example` | Шаблон змінних середовища |
