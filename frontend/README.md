# LUMI — Frontend

Vite + чистий JavaScript. Працює разом з бекендом з папки `backend/`.

## Запуск

```bash
cd frontend
npm install
copy .env.example .env     # macOS / Linux: cp .env.example .env
npm run dev
```

Сайт: http://localhost:5173 (бекенд має бути запущений на http://127.0.0.1:8000)

## Структура

| Шлях | Призначення |
|---|---|
| `src/main.js` | Точка входу: стилі + роутер |
| `src/router.js` | Перемикання сторінок за хешем (`#register`, `#quiz`) |
| `src/pages/` | Сторінки (одна сторінка = один файл) |
| `src/styles/` | Токени кольорів, базові стилі, компоненти |
