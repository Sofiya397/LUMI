// Стартова сторінка (issues #1, #15): дві кнопки — "Розпочати безкоштовно" і "Увійти в акаунт".
// На ноутбуці — дві колонки (текст ліворуч, ілюстрація праворуч), на телефоні — одна колонка по центру.

const ICONS = {
  flask:
    '<path d="M9 3h6M10 3v6l-5.5 9.2A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.8L14 9V3M7.5 15h9"/>',
  drop: '<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
};

function icon(name) {
  return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}

export function renderWelcome(root) {
  root.innerHTML = `
    <div class="welcome">
      <header class="welcome-bar page-x">
        <a class="logo-link" href="#welcome"><img src="/logo.svg" width="34" height="34" alt="" /><b>LUMI</b></a>
      </header>

      <main class="welcome-main page-x">
        <section class="welcome-text">
          <p class="eyebrow">Твій персональний ШІ-дерматолог</p>
          <h1 class="display">Вітаємо <em>у&nbsp;LUMI</em></h1>
          <p class="welcome-lead muted">
            Пройди короткий тест шкіри, перевір склад засобів
            і отримай догляд, створений саме для тебе.
          </p>

          <div class="welcome-actions">
            <a class="btn btn-primary" href="#register" id="start-btn">Розпочати безкоштовно</a>
            <a class="btn btn-ghost" href="#login" id="login-btn">Увійти в акаунт</a>
          </div>
        </section>

        <div class="welcome-art" aria-hidden="true">
          <div class="orb">
            <div class="orb-ring"></div>
            <div class="orb-core glass"><img src="/logo.svg" alt="" /></div>
          </div>
          <span class="chip glass chip-1">${icon('flask')}Аналіз складу</span>
          <span class="chip glass chip-2">${icon('drop')}Рутина догляду</span>
          <span class="chip glass chip-3">${icon('sun')}Захист від сонця</span>
        </div>
      </main>

            <footer class="welcome-foot page-x small muted">Поради LUMI мають довідковий характер і не замінюють консультацію дерматолога</footer>
    </div>
  `;
}
