// Сторінка тесту шкіри (#34).
// 1. Доступна лише користувачу, що увійшов (після реєстрації або для повторного опитування з профілю).
// 2. Після останнього питання відповіді йдуть на бекенд: POST /sendAnswers (або PUT, якщо тест уже проходили).
// 3. Питання, підказки й варіанти — у src/data/quiz-questions.js.
// Ноутбук: ліворуч список кроків, праворуч картка з питанням. Телефон: смужка прогресу і картка.
import { QUIZ_QUESTIONS } from '../data/quiz-questions.js';
import { sendQuizAnswers } from '../api/quiz.js';
import { getSession, saveSession } from '../api/auth.js';
import { navigate } from '../router.js';

const TOTAL = QUIZ_QUESTIONS.length;
const LETTERS = 'АБВГДЕ';

// Незавершені відповіді зберігаємо до кінця сесії браузера, щоб не загубити їх при оновленні сторінки
function draftKey(userId) {
  return `lumi_quiz_draft_${userId}`;
}
function loadDraft(userId) {
  try {
    const draft = JSON.parse(sessionStorage.getItem(draftKey(userId)));
    if (draft && Array.isArray(draft.answers) && draft.answers.length === TOTAL) return draft;
  } catch {
    /* немає чернетки */
  }
  return { step: 0, answers: QUIZ_QUESTIONS.map((q) => (q.multiple ? [] : null)) };
}
function saveDraft(userId, draft) {
  try {
    sessionStorage.setItem(draftKey(userId), JSON.stringify(draft));
  } catch {
    /* приватний режим — не зберігаємо */
  }
}
function clearDraft(userId) {
  try {
    sessionStorage.removeItem(draftKey(userId));
  } catch {
    /* нічого */
  }
}

function isAnswered(question, answer) {
  return question.multiple ? answer.length > 0 : answer !== null;
}

export function renderQuiz(root) {
  const user = getSession();
  if (!user?.id) {
    navigate('register'); // без акаунта тест недоступний (#34, п. 1)
    return;
  }

  const state = loadDraft(user.id);
  let sending = false;

  root.innerHTML = `
    <div class="quiz-page">
      <header class="quiz-bar page-x">
        <a class="logo-link" href="#home"><img src="/logo.svg" width="34" height="34" alt="" /><b>LUMI</b></a>
        <span class="quiz-counter" id="quiz-counter"></span>
      </header>

      <main class="quiz-main page-x">
        <aside class="quiz-aside">
          <p class="eyebrow">Тест шкіри · крок 2 з 2</p>
          <h1 class="display">Розкажи про <em>свою шкіру</em></h1>
          <p class="quiz-lead muted">10 коротких питань. На основі відповідей LUMI створить твій профіль і персональний догляд.</p>
          <ol class="quiz-steps" id="quiz-steps"></ol>
        </aside>

        <section class="glass quiz-card" aria-live="polite">
          <div class="quiz-progress" aria-hidden="true"><i id="quiz-progress-bar"></i></div>
          <div id="quiz-question"></div>
          <p class="alert" id="quiz-alert" role="alert" hidden></p>
          <div class="quiz-nav">
            <button class="btn btn-ghost" type="button" id="quiz-back">Назад</button>
            <button class="btn btn-primary" type="button" id="quiz-next">Далі</button>
          </div>
        </section>
      </main>
    </div>
  `;

  const $ = (sel) => root.querySelector(sel);
  const backBtn = $('#quiz-back');
  const nextBtn = $('#quiz-next');
  const alertBox = $('#quiz-alert');

  function render() {
    const q = QUIZ_QUESTIONS[state.step];
    const answer = state.answers[state.step];
    const isLast = state.step === TOTAL - 1;

    $('#quiz-counter').textContent = `Питання ${state.step + 1} з ${TOTAL}`;
    $('#quiz-progress-bar').style.width = `${((state.step + 1) / TOTAL) * 100}%`;

    // список кроків ліворуч (на ноутбуці)
    $('#quiz-steps').innerHTML = QUIZ_QUESTIONS.map((item, i) => {
      const status = i === state.step ? 'current' : isAnswered(item, state.answers[i]) ? 'done' : '';
      const clickable = status === 'done' || i <= firstUnanswered();
      return `<li class="${status}">
        <button type="button" data-step="${i}" ${clickable ? '' : 'disabled'} ${i === state.step ? 'aria-current="step"' : ''}>
          <span class="dot">${status === 'done' ? '✓' : i + 1}</span>${item.short}
        </button>
      </li>`;
    }).join('');
    root.querySelectorAll('[data-step]').forEach((btn) =>
      btn.addEventListener('click', () => goTo(Number(btn.dataset.step))),
    );

    // саме питання
    $('#quiz-question').innerHTML = `
      <p class="quiz-num">Питання ${state.step + 1}</p>
      <h2 class="quiz-title" id="quiz-title" tabindex="-1">${q.title}</h2>
      <p class="quiz-hint"><span aria-hidden="true">💡</span>${q.hint}</p>
      <div class="quiz-options" role="${q.multiple ? 'group' : 'radiogroup'}" aria-labelledby="quiz-title">
        ${q.options
          .map((text, i) => {
            const selected = q.multiple ? answer.includes(text) : answer === text;
            return `<button type="button" class="quiz-option${selected ? ' selected' : ''}"
                      role="${q.multiple ? 'checkbox' : 'radio'}" aria-checked="${selected}" data-option="${i}">
                      <span class="quiz-letter">${q.multiple ? (selected ? '✓' : '') : LETTERS[i]}</span>
                      <span>${text}</span>
                    </button>`;
          })
          .join('')}
      </div>
      ${q.multiple ? `<p class="quiz-note small muted">Обрано ${answer.length} з ${q.max}</p>` : ''}
    `;
    root.querySelectorAll('[data-option]').forEach((btn) =>
      btn.addEventListener('click', () => choose(Number(btn.dataset.option))),
    );

    backBtn.textContent = state.step === 0 ? 'Пізніше' : 'Назад';
    nextBtn.textContent = isLast ? 'Завершити тест' : 'Далі';
    nextBtn.disabled = !isAnswered(q, answer) || sending;
  }

  function firstUnanswered() {
    const i = QUIZ_QUESTIONS.findIndex((q, idx) => !isAnswered(q, state.answers[idx]));
    return i === -1 ? TOTAL - 1 : i;
  }

  function choose(index) {
    const q = QUIZ_QUESTIONS[state.step];
    const text = q.options[index];
    alertBox.hidden = true;

    if (q.multiple) {
      const list = state.answers[state.step];
      if (list.includes(text)) list.splice(list.indexOf(text), 1);
      else if (list.length < q.max) list.push(text);
      else {
        showAlert(`Можна обрати не більше ${q.max} варіантів`);
        return;
      }
      saveDraft(user.id, state);
      render();
    } else {
      state.answers[state.step] = text;
      saveDraft(user.id, state);
      render();
      // одна відповідь — одразу переходимо далі (крім останнього питання)
      if (state.step < TOTAL - 1) setTimeout(() => goTo(state.step + 1), 220);
    }
  }

  function goTo(step) {
    state.step = Math.max(0, Math.min(TOTAL - 1, step));
    saveDraft(user.id, state);
    alertBox.hidden = true;
    render();
    $('#quiz-title')?.focus?.();
  }

  function showAlert(message) {
    alertBox.textContent = message;
    alertBox.hidden = false;
  }

  backBtn.addEventListener('click', () => {
    if (state.step === 0) navigate('home');
    else goTo(state.step - 1);
  });

  nextBtn.addEventListener('click', async () => {
    const q = QUIZ_QUESTIONS[state.step];
    if (!isAnswered(q, state.answers[state.step])) return;
    if (state.step < TOTAL - 1) {
      goTo(state.step + 1);
      return;
    }
    await submit();
  });

  async function submit() {
    const missing = firstUnanswered();
    if (!isAnswered(QUIZ_QUESTIONS[missing], state.answers[missing])) {
      goTo(missing);
      showAlert('Дай відповідь на це питання, щоб завершити тест');
      return;
    }

    // на бекенд — текст відповіді; кілька відповідей — через кому (#34, п. 2)
    const answers = state.answers.map((a) => (Array.isArray(a) ? a.join(', ') : a));

    sending = true;
    nextBtn.disabled = true;
    nextBtn.innerHTML = '<span class="spinner"></span>Зберігаємо…';
    try {
      await sendQuizAnswers(user.id, answers);
      saveSession({ ...user, quizDone: true });
      sessionStorage.setItem('lumi_quiz_answers', JSON.stringify(answers)); // для сторінки результатів (#105)
      clearDraft(user.id);
      navigate('results');
    } catch (error) {
      if (error.status === 404) showAlert('Акаунт не знайдено. Зареєструйся ще раз, будь ласка.');
      else if (error.status === 422) showAlert('Схоже, не всі відповіді заповнені. Перевір питання.');
      else showAlert(error.message);
      sending = false;
      render();
    }
  }

  // клавіатура: 1–6 або А–Е обирають варіант, Enter — далі
  function onKey(event) {
    if (!root.contains($('#quiz-question'))) {
      document.removeEventListener('keydown', onKey);
      return;
    }
    if (event.target.closest('input, textarea')) return;
    const n = Number(event.key);
    if (n >= 1 && n <= QUIZ_QUESTIONS[state.step].options.length) choose(n - 1);
    if (event.key === 'Enter' && !nextBtn.disabled && document.activeElement?.tagName !== 'BUTTON') nextBtn.click();
  }
  document.addEventListener('keydown', onKey);

  render();
}
