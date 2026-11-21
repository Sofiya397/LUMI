// Ім'я користувача для головної сторінки (#83).
// Бекенд #100 ще в роботі. Очікуваний контракт, узгодити з Денисом:
//   GET /users/{user_id}  → { id, username, email }
// Поки ендпоінта немає (бекенд відповідає 404/405), беремо ім'я, введене при реєстрації або вході.
import { request } from './client.js';
import { getSession, saveSession } from './auth.js';

export async function getUserName(user) {
  try {
    const data = await request(`/users/${encodeURIComponent(user.id)}`);
    if (data?.username) {
      saveSession({ ...getSession(), username: data.username }); // запам'ятовуємо свіже ім'я
      return data.username;
    }
  } catch {
    /* ендпоінта ще немає або сервер недоступний — використовуємо збережене ім'я */
  }
  return user.username || (user.email ? user.email.split('@')[0] : '');
}
