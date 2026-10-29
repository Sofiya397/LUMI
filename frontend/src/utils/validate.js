// Перевірка полів форм.
// Реєстрація — правила й тексти з issue #16, згода — з issue #1.
// Вхід — issue #19: будь-яка помилка від бекенду показується одним текстом.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const REGISTER_ERRORS = {
  username: "Введи своє ім'я",
  email: 'Введи коректний email',
  passwordShort: 'Пароль — мінімум 6 символів',
  passwordLong: 'Пароль занадто довгий',
  consent: 'Щоб продовжити, дай згоду на обробку персональних даних',
};

export const LOGIN_ERROR = 'Помилка входу. Спробуйте ще раз';

export function isEmail(value) {
  return EMAIL_RE.test(value);
}

export function validateRegister({ username, email, password, consent }) {
  const errors = {};

  if (!username) errors.username = REGISTER_ERRORS.username;

  if (!email || !isEmail(email)) errors.email = REGISTER_ERRORS.email;

  if (!password || password.length < 6) errors.password = REGISTER_ERRORS.passwordShort;
  // bcrypt на бекенді приймає не більше 72 байт (кирилиця = 2 байти на літеру)
  else if (new TextEncoder().encode(password).length > 72) errors.password = REGISTER_ERRORS.passwordLong;

  if (!consent) errors.consent = REGISTER_ERRORS.consent;

  return errors;
}

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email || !isEmail(email)) errors.email = REGISTER_ERRORS.email;
  if (!password) errors.password = 'Введи пароль';
  return errors;
}
