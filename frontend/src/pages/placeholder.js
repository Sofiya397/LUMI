// Тимчасова сторінка для екранів, які ще не зроблені
export function renderPlaceholder(root, title, issue) {
  root.innerHTML = `
    <main class="page placeholder">
      <section class="glass placeholder-card">
        <h1 class="display">${title}</h1>
        <p class="muted">Ця сторінка з'явиться в задачі ${issue}.</p>
        <a class="btn btn-ghost btn-block" href="#welcome">На стартову сторінку</a>
      </section>
    </main>
  `;
}
