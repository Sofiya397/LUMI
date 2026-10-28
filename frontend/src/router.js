// Простий роутер на хешах: #welcome, #register, #login ...
// Нова сторінка = новий рядок у ROUTES.
import { renderWelcome } from './pages/welcome.js';
import { renderRegister } from './pages/register.js';
import { renderLogin } from './pages/login.js';
import { renderHome } from './pages/home.js';
import { renderPlaceholder } from './pages/placeholder.js';

const ROUTES = {
  welcome: (root) => renderWelcome(root),
  register: (root) => renderRegister(root),
  login: (root) => renderLogin(root),
  home: (root) => renderHome(root),
  quiz: (root) => renderPlaceholder(root, 'Тест шкіри', 'Quiz page #2'),
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
