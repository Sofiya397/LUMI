// Спільна функція для всіх запитів до бекенду LUMI.
// Адреса береться з .env (VITE_API_URL), за замовчуванням — локальний FastAPI.
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export class ApiError extends Error {
  constructor(message, status, detail) {
    super(message);
    this.status = status; // HTTP-код: 400, 409, 422, 500... або 0, якщо сервер недоступний
    this.detail = detail; // поле "detail" з відповіді FastAPI
  }
}

export async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Не вдалося з'єднатися з сервером. Перевір, чи запущено бекенд.", 0);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = data?.detail;
    // FastAPI повертає detail або рядком, або масивом помилок валідації (422)
    const message = typeof detail === 'string' ? detail : 'Щось пішло не так. Спробуй ще раз.';
    throw new ApiError(message, response.status, detail);
  }

  return data;
}
