// Дані користувача з бекенду.
//   GET /users/{user_id}            → { id, username, email }                (#100)
//   GET /users/{user_id}/skin-type  → { user_id, skin_type }                 (#125; 404 — тест не пройдено)
//   GET /users/{user_id}/streak     → { user_id, streak, last_active_date }  (#126)
import { request } from './client.js';
import { getSession, saveSession } from './auth.js';

// Ім'я для головної (#83). Якщо сервер недоступний — ім'я з сесії.
export async function getUserName(user) {
  try {
    const data = await request(`/users/${encodeURIComponent(user.id)}`);
    if (data?.username) {
      saveSession({ ...getSession(), username: data.username }); // запам'ятовуємо свіже ім'я
      return data.username;
    }
  } catch {
    /* сервер недоступний — використовуємо збережене ім'я */
  }
  return user.username || (user.email ? user.email.split('@')[0] : '');
}

// Ім'я та email для профілю (#122)
export async function getUserInfo(userId) {
  return request(`/users/${encodeURIComponent(userId)}`);
}

// Тип шкіри (#122). null — тест ще не пройдено.
export async function getSkinType(userId) {
  try {
    const data = await request(`/users/${encodeURIComponent(userId)}/skin-type`);
    return data?.skin_type || null;
  } catch (err) {
    if (err.status === 404 && typeof err.detail === 'string' && err.detail.includes('опитування')) return null;
    throw err;
  }
}

// Серія днів догляду (#122)
export async function getStreak(userId) {
  return request(`/users/${encodeURIComponent(userId)}/streak`);
}
