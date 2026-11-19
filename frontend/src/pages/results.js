// Результати тесту (#105).
// 1. Повідомлення про створений профіль, тип шкіри і коротка інформація.
// 2. Секції «Аналіз від LUMI AI» і «Твій персональний догляд».
//    Аналіз і засоби з бази даних залежать від AI agent chat #82 — для них підготовлене місце.
import { getSession } from '../api/auth.js';
import { navigate } from '../router.js';
import { loadLastAnswers, buildProfile } from '../data/skin-profile.js';

const ICONS = {
  check: '<path d="m5 12 5 5 9-10"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  bottle: '<path d="M10 2h4v3h-4zM9 5h6l1 3v12a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V8z"/>',
};
const icon = (name, size = 20) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

// текст з відповідей вставляємо безпечно
const esc = (text) => String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function routineList(steps) {
  return `<ol class="care-steps">
    ${steps
      .map(
        (s, i) => `<li>
          <span class="care-num">${i + 1}</span>
          <div class="care-body">
            <b>${esc(s.step)}</b>
            <span class="muted">${esc(s.what)}</span>
            <span class="product-slot">${icon('bottle', 16)}Засіб з каталогу LUMI — скоро</span>
          </div>
        </li>`,
      )
      .join('')}
  </ol>`;
}

export function renderResults(root) {
  const user = getSession();
  if (!user?.id) {
    navigate('login');
    return;
  }

  const answers = loadLastAnswers(user.id);

  // тест ще не пройдено на цьому пристрої
  if (!answers) {
    root.innerHTML = `
      <main class="page placeholder">
        <section class="glass placeholder-card">
          <p class="eyebrow">Результати тесту</p>
          <h1 class="display">Спершу <em>пройди тест</em></h1>
          <p class="muted">Відповідай на 10 коротких питань, і LUMI складе профіль твоєї шкіри.</p>
          <a class="btn btn-primary btn-block" href="#quiz">Пройти тест</a>
        </section>
      </main>`;
    return;
  }

  const profile = buildProfile(answers);
  const name = user.username ? `, ${esc(user.username)}` : '';

  root.innerHTML = `
    <div class="results-page">
      <header class="quiz-bar page-x">
        <a class="logo-link" href="#home"><img src="/logo.svg" width="34" height="34" alt="" /><b>LUMI</b></a>
        <a class="back-link" href="#quiz">Пройти тест знову</a>
      </header>

      <main class="results-main page-x">
        <!-- 1. Профіль створено -->
        <section class="glass result-hero">
          <div class="result-badge">${icon('check', 26)}</div>
          <div class="result-hero-text">
            <p class="eyebrow">Профіль створено${name}</p>
            <h1 class="display">Твій тип шкіри — <em>${esc(profile.type.name.toLowerCase())}</em></h1>
            <p class="muted result-about">${esc(profile.type.about)}</p>
            <ul class="result-tags">
              ${profile.tags.map((t) => `<li class="tag ${t.tone}">${esc(t.text)}</li>`).join('')}
            </ul>
          </div>
        </section>

        <div class="results-grid">
          <!-- 2. Аналіз від LUMI AI (місце для #82) -->
          <section class="glass result-card ai-card" aria-labelledby="ai-title">
            <div class="result-card-head">
              <span class="result-card-ic">${icon('spark')}</span>
              <h2 id="ai-title">Аналіз від LUMI AI</h2>
              <span class="soon">Скоро</span>
            </div>
            <p class="muted">LUMI AI готує детальний аналіз твоєї шкіри за відповідями тесту. Він з’явиться тут найближчим часом.</p>
            <div class="skeleton" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
            <ul class="tips">
              ${profile.tips.map((t) => `<li>${esc(t)}</li>`).join('')}
            </ul>
          </section>

          <!-- 3. Твій персональний догляд -->
          <section class="glass result-card" aria-labelledby="care-title">
            <div class="result-card-head">
              <span class="result-card-ic">${icon('bottle')}</span>
              <h2 id="care-title">Твій персональний догляд</h2>
            </div>
            <p class="muted">Кроки й компоненти підібрані за твоїми відповідями.</p>
            <div class="care-cols">
              <div class="care-col">
                <h3>${icon('sun', 18)}Ранок</h3>
                ${routineList(profile.routine.morning)}
              </div>
              <div class="care-col">
                <h3>${icon('moon', 18)}Вечір</h3>
                ${routineList(profile.routine.evening)}
              </div>
            </div>
          </section>
        </div>

        <div class="results-actions">
          <a class="btn btn-primary" href="#home">Перейти на головну</a>
          <a class="btn btn-ghost" href="#quiz">Пройти тест знову</a>
        </div>
      </main>
    </div>
  `;
}
