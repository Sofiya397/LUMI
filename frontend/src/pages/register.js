// Реєстрація з email (issue #20). Валідація і відповіді сервера — #16, згода на обробку даних — #1.
// Ноутбук: ліворуч опис, праворуч форма. Телефон: заголовок і форма в одну колонку.
import { registerUser, saveSession } from '../api/auth.js';
import { validateRegister } from '../utils/validate.js';
import { navigate } from '../router.js';
import { authBar, icon, socialButtons, passwordField, bindAuthCommon, formHelpers } from '../components/auth-parts.js';

const FIELDS = ['username', 'email', 'password', 'consent'];

export function renderRegister(root) {
  root.innerHTML = `
    <div class="auth-page">
      ${authBar()}

      <main class="auth-main page-x">
        <section class="auth-aside">
          <p class="eyebrow">Крок 1 з 2 · далі тест шкіри</p>
          <h1 class="display">Створи свій <em>профіль догляду</em></h1>
          <p class="auth-lead muted">Акаунт потрібен, щоб зберегти результати тесту і твою рутину.</p>
          <ul class="perks">
            <li><span class="perk-ic">${icon('spark')}</span><span><b>Персональна рутина</b>коротке тесутвання для підбору догляду</span></li>
            <li><span class="perk-ic">${icon('flask')}</span><span><b>Перевірка складу</b>засобів, якими ти користуєшся</span></li>
            <li><span class="perk-ic">${icon('shield')}</span><span><b>Твої дані під захистом</b>обробляємо лише за твоєю згодою</span></li>
          </ul>
        </section>

        <section class="glass auth-card" aria-labelledby="register-title">
          <h2 id="register-title" class="auth-card-title">Реєстрація</h2>

          <form id="register-form" class="form-stack" novalidate>
            <div class="field">
              <label for="username">Твоє ім'я</label>
              <input class="input" id="username" name="username" autocomplete="given-name" placeholder="Олена" maxlength="50" />
              <p class="field-error" id="username-error"></p>
            </div>

            <div class="field">
              <label for="email">Email</label>
              <input class="input" id="email" name="email" type="email" inputmode="email" autocomplete="email" placeholder="olena@example.com" />
              <p class="field-error" id="email-error"></p>
            </div>

            ${passwordField('new-password', 'Мінімум 6 символів')}

            <div class="field">
              <label class="check">
                <input type="checkbox" id="consent" name="consent" />
                <span>Погоджуюсь на обробку персональних даних відповідно до Закону України «Про захист персональних даних»</span>
              </label>
              <p class="field-error" id="consent-error"></p>
            </div>

            <p class="alert" id="form-alert" role="alert" hidden></p>
            <button class="btn btn-primary btn-block" type="submit" id="submit">Створити акаунт</button>
          </form>

          ${socialButtons()}

          <p class="auth-footer small muted">Вже є акаунт? <a href="#login">Увійти</a></p>
        </section>
      </main>
    </div>
  `;

  const form = root.querySelector('#register-form');
  const ui = formHelpers(root, form);
  bindAuthCommon(root, ui.showAlert);

  // прибираємо помилку поля, щойно користувач почав його виправляти
  FIELDS.forEach((name) => {
    const el = form.elements[name];
    el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', () => ui.setFieldError(name, ''));
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    ui.hideAlert();

    const values = {
      username: form.elements.username.value.trim(),
      email: form.elements.email.value.trim(),
      password: form.elements.password.value,
      consent: form.elements.consent.checked,
    };

    // 1. перевірка на фронті (тексти з #16)
    const errors = validateRegister(values);
    FIELDS.forEach((name) => ui.setFieldError(name, errors[name] || ''));
    const firstInvalid = FIELDS.find((name) => errors[name]);
    if (firstInvalid) {
      form.elements[firstInvalid].focus();
      return;
    }

    // 2. запит на бекенд: POST /register
    ui.setLoading(true, 'Створюємо акаунт…');
    try {
      const result = await registerUser(values);
      saveSession({ id: result.user_id, username: values.username, email: values.email.toLowerCase() });
      navigate('quiz'); // 200 → сторінка тесту (#20)
    } catch (error) {
      if (error.status === 400) {
        // "Користувач з таким email вже існує"
        ui.setFieldError('email', error.message);
        form.elements.email.focus();
      } else if (error.status === 422 && error.detail && typeof error.detail === 'object') {
        // { detail: { поле: "текст помилки" } }
        Object.entries(error.detail).forEach(([name, message]) => {
          if (FIELDS.includes(name)) ui.setFieldError(name, message);
        });
      } else {
        ui.showAlert(error.message);
      }
    } finally {
      ui.setLoading(false);
    }
  });
}
