// Точка входу фронтенду: підключаємо стилі й запускаємо роутер
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/welcome.css';
import './styles/auth.css';
import './styles/quiz.css';
import './styles/results.css';
import './styles/home.css';
import './styles/nav.css';

import { startRouter } from './router.js';

startRouter(document.querySelector('#app'));
