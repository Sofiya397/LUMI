// Запити, пов'язані з акаунтом. Контракт з бекендом — issues #16 / #21:
//   POST /register   { username, email, password }
//   200 → { message: "Користувача успішно створено!", user_id }
//   400 → { detail: "Користувач з таким email вже існує" }
//   422 → { detail: { username?: "...", email?: "...", password?: "..." } }
import { request } from './client.js';

export function registerUser({ username, email, password }) {
  return request('/register', {
    method: 'POST',
    body: { username, email, password },
  });
}

// Зберігаємо користувача в браузері, щоб наступні сторінки знали, хто увійшов
export function saveSession(user) {
  try {
    localStorage.setItem('lumi_user', JSON.stringify(user));
  } catch {
    /* приватний режим браузера — просто не зберігаємо */
  }
}

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem('lumi_user'));
  } catch {
    return null;
  }
}
