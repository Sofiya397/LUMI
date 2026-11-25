// Простий роутер на хешах: #welcome, #register, #login ...
// Нова сторінка = новий рядок у ROUTES.
import { renderWelcome } from './pages/welcome.js';
import { renderRegister } from './pages/register.js';
import { renderLogin } from './pages/login.js';
import { renderHome } from './pages/home.js';
import { renderQuiz } from './pages/quiz.js';
import { renderResults } from './pages/results.js';
import { renderSoon } from './pages/soon.js';
import { renderProfile } from './pages/profile.js';

const ROUTES = {
  welcome: (root) => renderWelcome(root),
  register: (root) => renderRegister(root),
  login: (root) => renderLogin(root),
  home: (root) => renderHome(root),
  quiz: (root) => renderQuiz(root),
  results: (root) => renderResults(root),
  profile: (root) => renderProfile(root),
  // розділи меню, які ще в роботі
  scan: (root) => renderSoon(root, 'scan'),
  feed: (root) => renderSoon(root, 'feed'),
  progress: (root) => renderSoon(root, 'progress'),
  privacy: (root) => renderSoon(root, 'privacy'),
  // розділи, що відкриваються з профілю (#6)
  settings: (root) => renderSoon(root, 'settings'),
  routine: (root) => renderSoon(root, 'routine'),
  reports: (root) => renderSoon(root, 'reports'),
  support: (root) => renderSoon(root, 'support'),
  rate: (root) => renderSoon(root, 'rate'),
};

// при відкритті застосунку — стартова сторінка (#1)
const DEFAULT_ROUTE = 'welcome';

export function navigate(name) {
  location.hash = name;
}

export function startRouter(root) {
  const render = () => {
    const name = location.hash.slice(1);
    const page = ROUTES[name] || ROUTES[DEFAULT_ROUTE];
    page(root);
    window.scrollTo(0, 0);
  };
  window.addEventListener('hashchange', render);
  render();
}
