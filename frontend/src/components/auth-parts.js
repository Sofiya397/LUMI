// Спільні частини сторінок реєстрації та входу, щоб вони виглядали однаково (#19)

const ICONS = {
  back: '<path d="m15 6-6 6 6 6"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  flask: '<path d="M9 3h6M10 3v6l-5.5 9.2A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.8L14 9V3M7.5 15h9"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
};

export function icon(name, size = 20) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}

// Шапка сторінки: логотип і повернення на стартову
export function authBar() {
  return `
    <header class="auth-bar page-x">
      <a class="logo-link" href="#welcome"><img src="/logo.svg" width="34" height="34" alt="" /><b>LUMI</b></a>
      <a class="back-link" href="#welcome">${icon('back', 18)}<span>На головну</span></a>
    </header>
  `;
}

export function socialButtons() {
  return `
    <div class="divider">або</div>
    <div class="social">
      <button class="btn btn-ghost" type="button" data-soon>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" fill="#34A853"/><path d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.6 10.6 0 0 0 12 1 11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" fill="#EA4335"/></svg>
        Google
      </button>
      <button class="btn btn-ghost" type="button" data-soon>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11"/></svg>
        Apple
      </button>
    </div>
  `;
}

export function passwordField(autocomplete, placeholder) {
  return `
    <div class="field">
      <label for="password">Пароль</label>
      <div class="password-wrap">
        <input class="input" id="password" name="password" type="password" autocomplete="${autocomplete}" placeholder="${placeholder}" />
        <button class="password-toggle" type="button" id="toggle-password" aria-controls="password">Показати</button>
      </div>
      <p class="field-error" id="password-error"></p>
    </div>
  `;
}

// Кнопка "Показати/Сховати" пароль і заглушки Google/Apple (окремі задачі #22, #24)
export function bindAuthCommon(root, showAlert) {
  const toggle = root.querySelector('#toggle-password');
  const input = root.querySelector('#password');
  toggle.addEventListener('click', () => {
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    toggle.textContent = show ? 'Сховати' : 'Показати';
  });

  root.querySelectorAll('[data-soon]').forEach((btn) =>
    btn.addEventListener('click', () => showAlert('Вхід через Google та Apple з’явиться найближчим часом.', true)),
  );
}

// Помилки під полями, загальна плашка над кнопкою і стан "завантаження"
export function formHelpers(root, form) {
  const alertBox = root.querySelector('#form-alert');
  const submit = root.querySelector('#submit');
  const submitLabel = submit.textContent;

  return {
    setFieldError(name, message) {
      root.querySelector(`#${name}-error`).textContent = message;
      form.elements[name].setAttribute('aria-invalid', message ? 'true' : 'false');
    },
    showAlert(message, success = false) {
      alertBox.textContent = message;
      alertBox.classList.toggle('success', success);
      alertBox.hidden = false;
    },
    hideAlert() {
      alertBox.hidden = true;
    },
    setLoading(isLoading, loadingText) {
      submit.disabled = isLoading;
      submit.innerHTML = isLoading ? `<span class="spinner"></span>${loadingText}` : submitLabel;
    },
  };
}
