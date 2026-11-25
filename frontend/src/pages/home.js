// Головна сторінка (#83, адаптивність — #89). Меню — components/app-nav.js.
// Гість (#120) теж бачить головну, а замість профілю — заклик зареєструватися.
// 1. Звертання на ім'я, введене при реєстрації (бекенд #100, поки — з сесії).
// 2. Поточна дата.
// 3. Профіль шкіри з результатів тесту.
// 4. Віджети, які ще не реалізовані, — порожні, але вже оформлені під майбутні дані.
import { getSession } from '../api/auth.js';
import { getUserName } from '../api/user.js';
import { loadLastAnswers, buildProfile } from '../data/skin-profile.js';
import { appShell, bindAppShell } from '../components/app-nav.js';

const ICONS = {
  drop: '<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>',
  flask: '<path d="M9 3h6M10 3v6l-5.5 9.2A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.8L14 9V3M7.5 15h9"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  chart: '<path d="M3 21h18M6 17v-5M11 17V7M16 17v-8M21 17V4"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
  arrow: '<path d="m9 6 6 6-6 6"/>',
};
const icon = (name, size = 20) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

const esc = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Майбутні віджети: місце й оформлення вже є, дані з'являться у своїх задачах
const SOON_WIDGETS = [
  {
    id: 'routine',
    icon: 'drop',
    title: 'Моя рутина сьогодні',
    text: 'Тут можна буде відмічати ранкові та вечірні кроки догляду.',
    rows: ['Ранок', 'Вечір'],
  },
  {
    id: 'scan',
    icon: 'flask',
    title: 'Аналіз складу',
    text: 'Встав склад засобу, і LUMI покаже безпечні та небажані компоненти.',
    rows: ['Остання перевірка'],
  },
  {
    id: 'ai',
    icon: 'spark',
    title: 'Чат з LUMI AI',
    text: 'Запитай про засіб, компонент або свою рутину.',
    rows: ['Нове повідомлення'],
  },
  {
    id: 'progress',
    icon: 'chart',
    title: 'Прогрес догляду',
    text: 'Статистика виконаної рутини за тиждень і місяць.',
    chart: true,
  },
  {
    id: 'favorites',
    icon: 'heart',
    title: 'Улюблені засоби',
    text: 'Засоби, які ти збережеш, з’являться тут.',
    rows: ['Засіб', 'Засіб'],
  },
];

function soonWidget(w) {
  const inner = w.chart
    ? `<div class="empty-chart" aria-hidden="true">${[40, 65, 30, 80, 55, 70, 45].map((h) => `<i style="height:${h}%"></i>`).join('')}</div>`
    : `<div class="empty-rows" aria-hidden="true">${w.rows.map((r) => `<div><span>${r}</span><i></i></div>`).join('')}</div>`;
  return `
    <section class="glass widget widget-soon widget-${w.id}" aria-labelledby="w-${w.id}">
      <div class="widget-head">
        <span class="widget-ic">${icon(w.icon)}</span>
        <h2 id="w-${w.id}">${w.title}</h2>
        <span class="soon">Скоро</span>
      </div>
      <p class="muted small">${w.text}</p>
      ${inner}
    </section>`;
}

function formatToday() {
  const now = new Date();
  const text = now.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function renderHome(root) {
  const user = getSession();
  const guest = !user?.id; // #120: гість переглядає застосунок без реєстрації

  const answers = guest ? null : loadLastAnswers(user.id);
  const profile = answers ? buildProfile(answers) : null;
  const initial = guest ? '' : (user.username || user.email || '?').trim().charAt(0).toUpperCase();

  const guestCard = `
      <section class="glass widget widget-profile" aria-labelledby="w-profile">
        <div class="widget-head">
          <span class="widget-ic">${icon('sun')}</span>
          <h2 id="w-profile">Профіль шкіри</h2>
        </div>
        <p class="muted">Зареєструйся й пройди тест з 10 питань — LUMI визначить тип шкіри й складе догляд саме для тебе.</p>
        <div class="widget-links">
          <a class="btn btn-primary" href="#register">Зареєструватися</a>
          <a class="btn btn-ghost" href="#login">Увійти</a>
        </div>
      </section>`;

  const profileCard = guest
    ? guestCard
    : profile
    ? `
      <section class="glass widget widget-profile" aria-labelledby="w-profile">
        <div class="widget-head">
          <span class="widget-ic">${icon('sun')}</span>
          <h2 id="w-profile">Профіль шкіри</h2>
        </div>
        <p class="profile-type">Тип шкіри: <em>${esc(profile.type.name.toLowerCase())}</em></p>
        <p class="muted profile-about">${esc(profile.type.about)}</p>
        <ul class="result-tags">${profile.tags
          .slice(0, 4)
          .map((t) => `<li class="tag ${t.tone}">${esc(t.text)}</li>`)
          .join('')}</ul>
        <p class="day-tip"><b>Порада на сьогодні</b>${esc(profile.tips[0])}</p>
        <div class="widget-links">
          <a class="link-arrow" href="#results">Мої результати ${icon('arrow', 16)}</a>
          <a class="link-arrow muted" href="#quiz">Пройти тест знову ${icon('arrow', 16)}</a>
        </div>
      </section>`
    : `
      <section class="glass widget widget-profile" aria-labelledby="w-profile">
        <div class="widget-head">
          <span class="widget-ic">${icon('sun')}</span>
          <h2 id="w-profile">Профіль шкіри</h2>
        </div>
        <p class="muted">Ти ще не проходила тест. 10 питань — і LUMI складе профіль твоєї шкіри.</p>
        <a class="btn btn-primary" href="#quiz">Пройти тест</a>
      </section>`;

  root.innerHTML = appShell('home', `
    <div class="home-page">
      <header class="home-bar page-x">
        <a class="logo-link" href="#home"><img src="/logo.svg" width="34" height="34" alt="" /><b>LUMI</b></a>
        ${
          guest
            ? `<div class="home-user"><a class="btn btn-ghost btn-sm" href="#login">Увійти</a></div>`
            : `<div class="home-user">
          <span class="avatar" aria-hidden="true">${esc(initial)}</span>
          <button class="btn btn-ghost btn-sm" type="button" data-logout>${icon('logout', 18)}<span>Вийти</span></button>
        </div>`
        }
      </header>

      <main class="home-main page-x">
        <section class="home-hello">
          <p class="eyebrow" id="today">${formatToday()}</p>
          <h1 class="display">${guest ? 'Привіт!' : `Привіт, <em id="user-name">${esc(user.username || '')}</em>`}</h1>
          <p class="muted home-sub">${guest ? 'Знайомся з LUMI — усі особисті функції відкриються після реєстрації' : 'Гарного дня для твоєї шкіри 🌸'}</p>
        </section>

        <div class="home-grid">
          ${profileCard}
          ${SOON_WIDGETS.map(soonWidget).join('')}
        </div>
      </main>
    </div>
  `);
  bindAppShell(root);

  // ім'я з бекенду (#100)
  if (!guest) getUserName(user).then((name) => {
    const el = root.querySelector('#user-name');
    if (el && name) el.textContent = name;
  });
}
