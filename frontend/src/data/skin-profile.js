// Профіль шкіри для сторінки результатів (#105).
// З відповідей тесту (10 рядків у порядку QUIZ_QUESTIONS) складаємо:
//   - тип шкіри і короткий опис;
//   - теги профілю (чутливість, проблеми, сонце, вік);
//   - кроки персонального догляду з ключовими компонентами.
// Конкретні засоби з бази даних і аналіз від LUMI AI з'являться після #82 — для них на сторінці є місце.
import { QUIZ_QUESTIONS } from './quiz-questions.js';

// ---------- збереження останніх відповідей (бекенд поки не віддає їх через GET) ----------
const key = (userId) => `lumi_quiz_answers_${userId}`;

export function saveLastAnswers(userId, answers) {
  try {
    localStorage.setItem(key(userId), JSON.stringify(answers));
  } catch {
    /* приватний режим — не зберігаємо */
  }
}

export function loadLastAnswers(userId) {
  try {
    const answers = JSON.parse(localStorage.getItem(key(userId)));
    return Array.isArray(answers) && answers.length === QUIZ_QUESTIONS.length ? answers : null;
  } catch {
    return null;
  }
}

// ---------- допоміжне: номер обраного варіанта у питанні ----------
function pick(answers, id) {
  const index = QUIZ_QUESTIONS.findIndex((q) => q.id === id);
  if (index === -1) return { text: '', option: -1, list: [] };
  const question = QUIZ_QUESTIONS[index];
  const text = answers[index] || '';
  const list = question.multiple ? text.split(', ').filter(Boolean) : [text];
  return { text, option: question.options.indexOf(text), list };
}

// ---------- довідник ----------
const SKIN_TYPES = [
  {
    name: 'Суха',
    about:
      'Шкірі бракує ліпідів, тому вона швидко втрачає вологу. Головне — м’яке очищення, кераміди та щільний крем.',
  },
  {
    name: 'Жирна',
    about:
      'Сальні залози працюють активно, звідси блиск і схильність до висипань. Потрібні легкі текстури й регулярне, але делікатне очищення.',
  },
  {
    name: 'Комбінована',
    about:
      'Т-зона жирніша, а щоки — нормальні або сухі. Найкраще працюють легкі зволожувальні засоби й точковий догляд за Т-зоною.',
  },
  {
    name: 'Нормальна',
    about:
      'Шкіра збалансована й рідко реагує. Достатньо базового догляду: очищення, зволоження і щоденний SPF.',
  },
];

const CONCERN_ACTIVES = {
  'Висипання та акне': 'саліцилова кислота (BHA)',
  'Розширені пори': 'ніацинамід',
  'Пігментні плями': 'вітамін C',
  'Зморшки та втрата пружності': 'ретинол',
  'Сухість і лущення': 'гіалуронова кислота',
  Почервоніння: 'пантенол і центела',
};

const CLEANSER = ['кремова пінка або гель без сульфатів', 'гель з цинком', 'м’який гель', 'м’який гель'];
const MOISTURIZER = ['крем з керамідами', 'легкий гель-крем', 'легкий гель-крем', 'зволожувальний крем'];

// ---------- профіль ----------
export function buildProfile(answers) {
  const skin = pick(answers, 'skin_type');
  const sensitivity = pick(answers, 'sensitivity');
  const concerns = pick(answers, 'concerns');
  const sun = pick(answers, 'sun');
  const age = pick(answers, 'age');

  const typeIndex = skin.option >= 0 ? skin.option : 3;
  const type = SKIN_TYPES[typeIndex];
  const sensitive = sensitivity.option === 0;
  const muchSun = sun.option >= 2;

  // теги під типом шкіри
  const tags = [];
  if (sensitivity.option === 0) tags.push({ text: 'Чутлива', tone: 'warn' });
  else if (sensitivity.option === 1) tags.push({ text: 'Помірно чутлива', tone: '' });
  else if (sensitivity.option === 2) tags.push({ text: 'Стійка до подразнень', tone: 'ok' });
  concerns.list.forEach((c) => tags.push({ text: c, tone: 'lilac' }));
  if (muchSun) tags.push({ text: 'Багато сонця', tone: 'warn' });
  if (age.text) tags.push({ text: `Вік: ${age.text}`, tone: '' });

  // активні компоненти під проблеми (не більше двох, щоб не перевантажити шкіру)
  const actives = concerns.list.map((c) => CONCERN_ACTIVES[c]).filter(Boolean).slice(0, 2);
  const morningActive = actives.find((a) => a === 'вітамін C' || a === 'ніацинамід') || actives[0];
  const eveningActive = actives.find((a) => a !== morningActive) || morningActive;

  const routine = {
    morning: [
      { step: 'Очищення', what: CLEANSER[typeIndex] },
      morningActive && { step: 'Сироватка', what: morningActive },
      { step: 'Зволоження', what: MOISTURIZER[typeIndex] },
      { step: 'Захист від сонця', what: muchSun ? 'SPF 50, оновлювати кожні 2 години' : 'SPF 30–50 щодня' },
    ].filter(Boolean),
    evening: [
      { step: 'Демакіяж', what: 'гідрофільна олія або міцелярна вода' },
      { step: 'Очищення', what: CLEANSER[typeIndex] },
      eveningActive && {
        step: 'Активний догляд',
        what: eveningActive === 'ретинол' && sensitive ? 'ретинол 0,2%, двічі на тиждень' : eveningActive,
      },
      { step: 'Зволоження', what: MOISTURIZER[typeIndex] },
    ].filter(Boolean),
  };

  const tips = [];
  if (sensitive) tips.push('Обирай засоби без ароматизаторів і спирту. Новий засіб спершу тестуй на зап’ястку.');
  if (actives.includes('ретинол') && actives.includes('саліцилова кислота (BHA)'))
    tips.push('Ретинол і кислоти наноси в різні вечори, щоб не подразнити шкіру.');
  tips.push(muchSun ? 'Ти багато на сонці — SPF обов’язковий навіть узимку.' : 'SPF щодня, навіть коли хмарно.');

  return { type, tags, routine, tips };
}
