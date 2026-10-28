// Тимчасовий головний екран після входу (#19). Повна сторінка — окрема задача Main page #3.
import { getSession, clearSession } from '../api/auth.js';
import { navigate } from '../router.js';

export function renderHome(root) {
  const user = getSession();
  if (!user) {
    navigate('login'); // без входу на головну не пускаємо
    return;
  }

  root.innerHTML = `
    <main class="page placeholder">
      <section class="glass placeholder-card">
        <p class="eyebrow">Ти увійшла</p>
        <h1 class="display">Привіт, <em id="home-name"></em></h1>
        <p class="muted">Головна сторінка з'явиться в задачі Main page #3.</p>
        <button class="btn btn-ghost btn-block" type="button" id="logout">Вийти з акаунта</button>
      </section>
    </main>
  `;
  // ім'я вставляємо як текст, а не HTML — так безпечніше
  root.querySelector('#home-name').textContent = user.username || user.email;

  root.querySelector('#logout').addEventListener('click', () => {
    clearSession();
    navigate('welcome');
  });
}
