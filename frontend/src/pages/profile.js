// Сторінка «Профіль» (епік #6).
// #121 — макет: окремий вигляд для гостя і для користувачки, навігація на інші сторінки.
// #122 — коротка інформація: ім'я та email з БД, тип шкіри, серія днів (вогник).
// Гість бачить лише навігацію, без іконки, імені, email, типу шкіри й вогника.
import { getSession } from '../api/auth.js';
import { getUserInfo, getSkinType, getStreak } from '../api/user.js';
import { appShell, bindAppShell } from '../components/app-nav.js';
import { loadLastAnswers, buildProfile } from '../data/skin-profile.js';

const ICONS = {
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  routine: '<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>',
  quiz: '<path d="M9 4h6M9 4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2M10 11l1.5 1.5L14 10M10 16h4"/>',
  reports: '<path d="M4 20h16M7 16v-4M12 16V8M17 16v-6"/>',
  support: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M9.5 10a2.5 2.5 0 0 1 4.8 1c0 1.5-2.3 2-2.3 3M12 17h.01"/>',
  rate: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  privacy: '<path d="M12 3 5 6v5.5c0 4.3 3 7.8 7 9.5 4-1.7 7-5.2 7-9.5V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  fire: '<path d="M12 21c4 0 7-2.8 7-6.8 0-3.2-2-5.7-3.6-7.2.1 1.9-.9 3.4-2.3 3.4C13 7.6 11.5 5 9 3c.3 3-3 5.4-3 10.2C6 18.2 8.6 21 12 21z"/>',
  drop: '<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>',
  arrow: '<path d="m9 6 6 6-6 6"/>',
  logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
  guest: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c.9-3.8 3.9-6 7.5-6s6.6 2.2 7.5 6"/>',
};
const icon = (name, size = 20) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

const esc = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Навігація з профілю (#6, п. 5)
const LINKS = [
  { href: '#settings', icon: 'settings', title: 'Налаштування', text: 'Мова, тема, сповіщення' },
  { href: '#routine', icon: 'routine', title: 'Моя рутина', text: 'Ранкові й вечірні кроки догляду' },
  { href: '#quiz', icon: 'quiz', title: 'Пройти тест знову', text: 'Оновити профіль шкіри' },
  { href: '#reports', icon: 'reports', title: 'Звіт за місяць', text: 'Як ти дотримувалась догляду' },
  { href: '#privacy', icon: 'privacy', title: 'Мої дані', text: 'Згоди й хто отримував твої дані' },
  { href: '#support', icon: 'support', title: 'Підтримка LUMI', text: 'Напиши нам, якщо щось не так' },
  { href: '#rate', icon: 'rate', title: 'Оцінка сервісу', text: 'Розкажи, як тобі LUMI' },
];

function linksList() {
  return `
    <nav class="glass profile-links" aria-label="Розділи профілю">
      ${LINKS.map(
        (l) => `
        <a class="profile-link" href="${l.href}">
          <span class="widget-ic">${icon(l.icon)}</span>
          <span class="profile-link-text"><b>${l.title}</b><span class="muted">${l.text}</span></span>
          <span class="profile-link-arrow">${icon('arrow', 18)}</span>
        </a>`,
      ).join('')}
    </nav>`;
}

function dayWord(n) {
  const a = n % 10;
  const b = n % 100;
  if (a === 1 && b !== 11) return 'день';
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return 'дні';
  return 'днів';
}

function guestView() {
  return `
    <main class="profile-main page-x">
      <h1 class="display profile-title">Профіль</h1>
      <div class="profile-grid">
        <section class="glass profile-card profile-guest">
          <span class="profile-guest-ic">${icon('guest', 30)}</span>
          <h2>Ти переглядаєш LUMI як гість</h2>
          <p class="muted">Зареєструйся, щоб зберігати профіль шкіри, рутину й серію днів догляду.</p>
          <div class="gate-actions">
            <a class="btn btn-primary" href="#register">Зареєструватися</a>
            <a class="btn btn-ghost" href="#login">Увійти</a>
          </div>
        </section>
        ${linksList()}
      </div>
    </main>`;
}

function userView(user) {
  const name = user.username || (user.email ? user.email.split('@')[0] : '');
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  return `
    <main class="profile-main page-x">
      <h1 class="display profile-title">Профіль</h1>
      <div class="profile-grid">
        <section class="glass profile-card" aria-labelledby="profile-name">
          <span class="profile-avatar" aria-hidden="true">${esc(initial)}</span>
          <h2 id="profile-name">${esc(name)}</h2>
          <p class="muted profile-email" id="profile-email">${esc(user.email || '')}</p>

          <div class="profile-stats">
            <div class="profile-stat" id="stat-skin">
              <span class="stat-ic">${icon('drop')}</span>
              <span class="stat-label">Тип шкіри</span>
              <b class="stat-value"><i class="stat-skeleton"></i></b>
            </div>
            <div class="profile-stat" id="stat-streak">
              <span class="stat-ic fire">${icon('fire')}</span>
              <span class="stat-label">Серія догляду</span>
              <b class="stat-value"><i class="stat-skeleton"></i></b>
            </div>
          </div>
          <p class="profile-error small" id="profile-error" hidden></p>

          <button class="btn btn-ghost profile-logout" type="button" data-logout>${icon('logout', 18)}Вийти з акаунта</button>
        </section>
        ${linksList()}
      </div>
    </main>`;
}

export function renderProfile(root) {
  const user = getSession();
  if (!user?.id) {
    root.innerHTML = appShell('profile', guestView());
    return;
  }

  root.innerHTML = appShell('profile', userView(user));
  bindAppShell(root); // кнопки «Вийти» (у профілі й у бічному меню)

  loadInfo(root, user);
}

async function loadInfo(root, user) {
  const setStat = (id, html) => {
    const el = root.querySelector(`#${id} .stat-value`);
    if (el) el.innerHTML = html;
  };
  let failed = false;

  // 1. ім'я та email з БД
  getUserInfo(user.id)
    .then((data) => {
      if (data?.username) root.querySelector('#profile-name').textContent = data.username;
      if (data?.email) root.querySelector('#profile-email').textContent = data.email;
    })
    .catch(() => (failed = true))
    .finally(showError);

  // 2. тип шкіри: з бекенду; якщо ендпоінт ще недоступний — з останнього тесту на цьому пристрої
  getSkinType(user.id)
    .then((type) => setStat('stat-skin', type ? esc(type) : '<a href="#quiz">Пройти тест</a>'))
    .catch(() => {
      const answers = loadLastAnswers(user.id);
      setStat('stat-skin', answers ? esc(buildProfile(answers).type.name) : '<a href="#quiz">Пройти тест</a>');
    });

  // 3. серія днів (вогник)
  getStreak(user.id)
    .then((data) => {
      const n = Number(data?.streak) || 0;
      setStat('stat-streak', n > 0 ? `${n} ${dayWord(n)} поспіль` : 'Почни сьогодні');
      if (n > 0) root.querySelector('#stat-streak .stat-ic').classList.add('on');
    })
    .catch(() => {
      failed = true;
      setStat('stat-streak', '—');
      showError();
    });

  function showError() {
    const el = root.querySelector('#profile-error');
    if (el && failed) {
      el.hidden = false;
      el.textContent = 'Частину даних не вдалося завантажити. Перевір, чи запущено бекенд.';
    }
  }
}
