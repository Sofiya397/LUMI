// Запити тесту шкіри. Контракт з бекендом — #32, #33 (backend/quiz.py):
//   POST /sendAnswers?user_id=1   { answer_1 … answer_10 }  → перше проходження
//        400 → відповіді вже збережені
//   PUT  /sendAnswers?user_id=1   { answer_1 … answer_10 }  → повторне проходження
//        404 → користувача або відповідей не знайдено
import { request } from './client.js';

// answers — масив з 10 рядків у порядку питань
function toBody(answers) {
  return Object.fromEntries(answers.map((text, i) => [`answer_${i + 1}`, text]));
}

// Сам вирішує: перше проходження (POST) чи повторне (PUT)
export async function sendQuizAnswers(userId, answers) {
  const path = `/sendAnswers?user_id=${encodeURIComponent(userId)}`;
  const body = toBody(answers);
  try {
    return await request(path, { method: 'POST', body });
  } catch (error) {
    if (error.status === 400) {
      // відповіді вже є — це повторне опитування, оновлюємо їх
      return request(path, { method: 'PUT', body });
    }
    throw error;
  }
}
