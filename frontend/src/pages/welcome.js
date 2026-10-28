// Стартова сторінка (issues #1, #15): дві кнопки — "Розпочати безкоштовно" і "Увійти в акаунт"

export function renderWelcome(root) {
  root.innerHTML = `
    <main class="page welcome">
      <header class="welcome-bar">
        <a class="logo-link" href="#welcome"><img src="/logo.svg" width="34" height="34" alt="" /><b>LUMI</b></a>
        <a class="btn btn-ghost btn-sm" href="#login">Увійти</a>
      </header>

      <section class="welcome-hero">
        <div class="welcome-text">
          <p class="eyebrow">Твій персональний ШІ-дерматолог</p>
          <h1 class="display">Вітаємо <em>у LUMI</em></h1>
          <p class="welcome-lead muted">
            Пройди короткий тест шкіри, перевір склад будь-якого засобу
            і отримай рутину догляду, створену саме для тебе.
          </p>

          <div class="welcome-actions">
            <a class="btn btn-primary" href="#register" id="start-btn">Розпочати безкоштовно</a>
            <a class="btn btn-ghost" href="#login" id="login-btn">Увійти в акаунт</a>
          </div>

          <ul class="welcome-facts">
            <li><b>12 000+</b><span>перевірених компонентів</span></li>
            <li><b>5 питань</b><span>до твоєї рутини</span></li>
            <li><b>0 грн</b><span>базові функції</span></li>
          </ul>
        </div>

        <div class="welcome-preview" aria-hidden="true">
          <div class="glass preview-card preview-scan">
            <div class="score">87</div>
            <div>
              <p class="eyebrow">Аналіз складу</p>
              <b>Niacinamide 10% + Zinc 1%</b>
              <div class="tags"><span class="tag ok">Безпечно</span><span class="tag">Для жирної шкіри</span></div>
            </div>
          </div>

          <div class="glass preview-card preview-routine">
            <p class="eyebrow">Ранкова рутина</p>
            <ol>
              <li class="done">Гель для вмивання</li>
              <li class="done">Сироватка з ніацинамідом</li>
              <li>Крем SPF 50</li>
            </ol>
          </div>

          <div class="glass preview-card preview-streak">
            <b class="display">14</b>
            <span class="muted small">днів догляду поспіль</span>
          </div>
        </div>
      </section>

      <footer class="welcome-foot small muted">
        LUMI не замінює консультацію дерматолога · Твої дані захищені відповідно до Закону України «Про захист персональних даних»
      </footer>
    </main>
  `;
}
