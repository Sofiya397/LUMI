// Вхід в акаунт (issue #26, вимоги — #19).
// Виглядає як сторінка реєстрації, але без поля імені. Після входу — головний екран, без повторного тесту.
// Бекенд: POST /login (#42), Google / Apple — імітація OAuth (#43, #44).
import { loginUser, socialAuth, saveSession } from '../api/auth.js';
import { validateLogin, LOGIN_ERROR } from '../utils/validate.js';
import { navigate } from '../router.js';
import { authBar, icon, socialButtons, passwordField, bindAuthCommon, formHelpers } from '../components/auth-parts.js';
import { askSocialAccount } from '../components/social-dialog.js';

const FIELDS = ['email', 'password'];

export function renderLogin(root) {
  root.innerHTML = `
    <div class="auth-page">
      ${authBar()}

      <main class="auth-main page-x">
        <section class="auth-aside">
          <p class="eyebrow">Вхід в акаунт</p>
          <h1 class="display">З поверненням <em>у&nbsp;LUMI</em></h1>
          <p class="auth-lead muted">Твоя рутина і результати тесту вже чекають на тебе.</p>
          <ul class="perks">
            <li><span class="perk-ic">${icon('drop')}</span><span><b>Твоя рутина</b>ранковий і вечірній догляд</span></li>
            <li><span class="perk-ic">${icon('chart')}</span><span><b>Прогрес</b>як змінюється стан шкіри</span></li>
            <li><span class="perk-ic">${icon('flask')}</span><span><b>Історія перевірок</b>засоби, які ти вже аналізувала</span></li>
          </ul>
        </section>

        <section class="glass auth-card" aria-labelledby="login-title">
          <h2 id="login-title" class="auth-card-title">Вхід</h2>

          <form id="login-form" class="form-stack" novalidate>
            <div class="field">
              <label for="email">Email</label>
              <input class="input" id="email" name="email" type="email" inputmode="email" autocomplete="email" placeholder="olena@example.com" />
              <p class="field-error" id="email-error"></p>
            </div>

            ${passwordField('current-password', 'Твій пароль')}

            <p class="alert" id="form-alert" role="alert" hidden></p>
            <button class="btn btn-primary btn-block" type="submit" id="submit">Увійти</button>
          </form>

          ${socialButtons()}

          <p class="auth-footer small muted">Ще немає акаунта? <a href="#register">Зареєструватись</a></p>
        </section>
      </main>
    </div>
  `;

  const form = root.querySelector('#login-form');
  const ui = formHelpers(root, form);
  bindAuthCommon(root, loginWithProvider);

  FIELDS.forEach((name) => form.elements[name].addEventListener('input', () => ui.setFieldError(name, '')));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    ui.hideAlert();

    const values = {
      email: form.elements.email.value.trim(),
      password: form.elements.password.value,
    };

    // 1. перевірка на фронті
    const errors = validateLogin(values);
    FIELDS.forEach((name) => ui.setFieldError(name, errors[name] || ''));
    const firstInvalid = FIELDS.find((name) => errors[name]);
    if (firstInvalid) {
      form.elements[firstInvalid].focus();
      return;
    }

    // 2. запит на бекенд: POST /login
    ui.setLoading(true, 'Входимо…');
    try {
      const result = await loginUser(values);
      onLoggedIn(result, values.email);
    } catch (error) {
      showLoginError(error);
    } finally {
      ui.setLoading(false);
    }
  });

  // Вхід через Google / Apple
  async function loginWithProvider(provider) {
    ui.hideAlert();
    const account = await askSocialAccount(provider);
    if (!account) return;

    ui.setLoading(true, 'Входимо…');
    try {
      const result = await socialAuth(provider, 'login', account);
      onLoggedIn(result, account.email);
    } catch (error) {
      showLoginError(error);
    } finally {
      ui.setLoading(false);
    }
  }

  function onLoggedIn(result, email) {
    saveSession({ id: result.user_id, username: result.username, role: result.role, email: email.toLowerCase() });
    navigate('home'); // успішний вхід → головний екран (#19)
  }

  function showLoginError(error) {
    // сервер недоступний — кажемо прямо; будь-яка відмова бекенду — текст з #19
    ui.showAlert(error.status === 0 ? error.message : LOGIN_ERROR);
  }
}
