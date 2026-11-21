// Розділи, які ще в роботі: місце в меню вже є, вміст з'явиться у своїх задачах.
import { getSession } from '../api/auth.js';
import { navigate } from '../router.js';
import { appShell, bindAppShell } from '../components/app-nav.js';

const PAGES = {
  scan: {
    title: 'Аналіз складу',
    text: 'Встав склад засобу, і LUMI покаже корисні й небажані для твоєї шкіри компоненти.',
  },
  feed: {
    title: 'Спільнота',
    text: 'Ділись своєю рутиною й дивись рутини інших. Ти сама обираєш, хто бачить твій допис і чи показувати тип шкіри.',
  },
  progress: {
    title: 'Прогрес',
    text: 'Статистика виконаної рутини за тиждень і місяць.',
  },
  profile: {
    title: 'Профіль',
    text: 'Твої дані, результати тесту, дописи та налаштування.',
  },
  privacy: {
    title: 'Мої дані',
    text: 'Згоди на обробку даних, хто й коли отримував доступ до твоїх даних, видалення акаунта.',
  },
};

const SPARK =
  '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg>';

export function renderSoon(root, id) {
  if (!getSession()?.id) {
    navigate('login');
    return;
  }
  const page = PAGES[id];
  root.innerHTML = appShell(
    id,
    `<main class="soon-page page-x">
      <section class="glass soon-card">
        <span class="widget-ic">${SPARK}</span>
        <span class="soon">Скоро</span>
        <h1 class="display">${page.title}</h1>
        <p class="muted">${page.text}</p>
        <a class="btn btn-ghost" href="#home">На головну</a>
      </section>
    </main>`,
  );
  bindAppShell(root);
}
