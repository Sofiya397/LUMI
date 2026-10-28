// Простий роутер на хешах: #welcome, #register, #login ...
// Нова сторінка = новий рядок у ROUTES.
import { renderWelcome } from './pages/welcome.js';
import { renderPlaceholder } from './pages/placeholder.js';

const ROUTES = {
  welcome: (root) => renderWelcome(root),
  register: (root) => renderPlaceholder(root, 'Реєстрація', '#20'),
  login: (root) => renderPlaceholder(root, 'Вхід', '#26'),
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
