// Запити, пов'язані з акаунтом.
//
// Реєстрація (#16, #21):   POST /register  { username, email, password }
//   200 → { message, user_id }   400 → email уже існує   422 → { detail: { поле: "текст" } }
//
// Вхід (#19, #42):         POST /login     { email, password }
//   200 → { message, user_id, username, role }   401 → "Неправильний логін або пароль"
//
// Google / Apple (#23, #25, #43, #44) — навчальна імітація OAuth на бекенді:
//   1) POST /auth/{provider}/mock-token { email, name } → { id_token }   (грає роль Google/Apple)
//   2) POST /auth/{provider}/login     { id_token }     → як /login
//      POST /auth/{provider}/register  { id_token }     → як /register
import { request } from './client.js';

export function registerUser({ username, email, password }) {
  return request('/register', { method: 'POST', body: { username, email, password } });
}

export function loginUser({ email, password }) {
  return request('/login', { method: 'POST', body: { email, password } });
}

// provider: 'google' | 'apple';  mode: 'login' | 'register'
export async function socialAuth(provider, mode, { email, name }) {
  const { id_token } = await request(`/auth/${provider}/mock-token`, {
    method: 'POST',
    body: { email, name: name || email.split('@')[0] },
  });
  return request(`/auth/${provider}/${mode}`, { method: 'POST', body: { id_token } });
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

export function clearSession() {
  try {
    localStorage.removeItem('lumi_user');
  } catch {
    /* нічого */
  }
}
