// Вікно "Увійти через Google / Apple".
// На бекенді OAuth поки імітований (#43, #44), тому замість справжнього вікна Google
// користувач сам вводить email акаунта, а бекенд видає і перевіряє підписаний токен.
import { isEmail } from '../utils/validate.js';

const PROVIDERS = {
  google: { title: 'Google', color: '#4285F4' },
  apple: { title: 'Apple', color: 'currentColor' },
};

// Повертає Promise: { email, name } або null, якщо користувач закрив вікно
export function askSocialAccount(provider, { withName = false } = {}) {
  const info = PROVIDERS[provider];

  return new Promise((resolve) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'social-dialog glass';
    dialog.innerHTML = `
      <form method="dialog" class="form-stack" novalidate>
        <div class="social-dialog-head">
          <h2>Продовжити з ${info.title}</h2>
          <p class="small muted">Демо-режим: введи email свого акаунта ${info.title}</p>
        </div>

        <div class="field">
          <label for="social-email">Email акаунта ${info.title}</label>
          <input class="input" id="social-email" name="email" type="email" inputmode="email" autocomplete="email" placeholder="name@${provider === 'google' ? 'gmail.com' : 'icloud.com'}" />
          <p class="field-error" id="social-email-error"></p>
        </div>

        ${
          withName
            ? `<div class="field">
                 <label for="social-name">Твоє ім'я</label>
                 <input class="input" id="social-name" name="name" autocomplete="given-name" placeholder="Олена" maxlength="50" />
               </div>`
            : ''
        }

        <div class="social-dialog-actions">
          <button class="btn btn-ghost" type="button" value="cancel" data-cancel>Скасувати</button>
          <button class="btn btn-primary" type="submit" value="ok">Продовжити</button>
        </div>
      </form>
    `;
    document.body.appendChild(dialog);

    const form = dialog.querySelector('form');
    const emailInput = dialog.querySelector('#social-email');
    const emailError = dialog.querySelector('#social-email-error');

    const finish = (result) => {
      dialog.close();
      dialog.remove();
      resolve(result);
    };

    dialog.querySelector('[data-cancel]').addEventListener('click', () => finish(null));
    dialog.addEventListener('cancel', (e) => {
      e.preventDefault(); // Esc
      finish(null);
    });
    emailInput.addEventListener('input', () => (emailError.textContent = ''));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();
      if (!isEmail(email)) {
        emailError.textContent = 'Введи коректний email';
        emailInput.focus();
        return;
      }
      const name = withName ? dialog.querySelector('#social-name').value.trim() : '';
      finish({ email: email.toLowerCase(), name });
    });

    dialog.showModal();
    emailInput.focus();
  });
}
