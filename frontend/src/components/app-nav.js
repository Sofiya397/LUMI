// Навігація застосунку.
// Телефон і планшет: нижня панель із 5 вкладками.
// Ноутбук (від 1000px): бічне меню зліва з тими самими пунктами + «Мої дані» і картка користувача.
import { getSession, clearSession } from '../api/auth.js';
import { navigate } from '../router.js';

const ICONS = {
  home: '<path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z"/>',
  scan: '<circle cx="11" cy="11" r="6"/><path d="m20 20-4.2-4.2"/>',
  feed: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9.5" r="2.5"/><path d="M15.8 14.3c2.3.2 4 1.8 4.6 4.7"/>',
  progress: '<path d="M4 20h16M7 16v-4M12 16V8M17 16v-6"/>',
  profile: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c.9-3.8 3.9-6 7.5-6s6.6 2.2 7.5 6"/>',
  privacy: '<path d="M12 3 5 6v5.5c0 4.3 3 7.8 7 9.5 4-1.7 7-5.2 7-9.5V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
};
const icon = (name, size = 22) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

const esc = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Пункти меню. short — підпис у нижній панелі телефона (коротший).
export const NAV_ITEMS = [
  { id: 'home', title: 'Головна', short: 'Головна' },
  { id: 'scan', title: 'Аналіз складу', short: 'Склад' },
  { id: 'feed', title: 'Спільнота', short: 'Спільнота' },
  { id: 'progress', title: 'Прогрес', short: 'Прогрес' },
  { id: 'profile', title: 'Профіль', short: 'Профіль' },
];
const SIDE_EXTRA = [{ id: 'privacy', title: 'Мої дані' }];

function sideNav(active, user) {
  const links = [...NAV_ITEMS, ...SIDE_EXTRA]
    .map(
      (n) => `<a class="side-link${n.id === active ? ' on' : ''}" href="#${n.id}"${
        n.id === active ? ' aria-current="page"' : ''
      }>${icon(n.id)}<span>${n.title}</span></a>`,
    )
    .join('');
  const name = user?.username || (user?.email ? user.email.split('@')[0] : '');
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  return `
    <aside class="side-nav glass" aria-label="Меню">
      <a class="logo-link" href="#home"><img src="/logo.svg" width="34" height="34" alt="" /><b>LUMI</b></a>
      <nav class="side-links">${links}</nav>
      <div class="side-user">
        <span class="avatar" aria-hidden="true">${esc(initial)}</span>
        <b class="side-name">${esc(name)}</b>
        <button class="icon-btn" type="button" data-logout title="Вийти" aria-label="Вийти">${icon('logout', 20)}</button>
      </div>
    </aside>`;
}

function bottomNav(active) {
  const links = NAV_ITEMS.map(
    (n) => `<a href="#${n.id}"${n.id === active ? ' class="on" aria-current="page"' : ''}>
        <span class="nav-pill">${icon(n.id)}</span>${n.short}
      </a>`,
  ).join('');
  return `<nav class="bottom-nav glass" aria-label="Навігація">${links}</nav>`;
}

// Обгортка для сторінок усередині застосунку: меню + вміст сторінки
export function appShell(active, content) {
  const user = getSession();
  return `
    <div class="app-shell">
      ${sideNav(active, user)}
      <div class="app-main">${content}</div>
      ${bottomNav(active)}
    </div>`;
}

// Кнопки «Вийти» (і в бічному меню, і на сторінках)
export function bindAppShell(root) {
  root.querySelectorAll('[data-logout]').forEach((btn) =>
    btn.addEventListener('click', () => {
      clearSession();
      navigate('welcome');
    }),
  );
}
