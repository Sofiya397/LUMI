// Точка входу фронтенду: підключаємо стилі й запускаємо роутер
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/welcome.css';

import { startRouter } from './router.js';

startRouter(document.querySelector('#app'));
