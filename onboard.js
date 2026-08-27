/* onboard.js — онбординг рівня та екрани транзицій.
   Підключати ПІСЛЯ level.js і ДО app.js.

   Асиметрія навмисна: підвищення святкуємо повноекранно, зниження — тихий
   тост про зміну складності. Демоція демотивує за визначенням, тому вона
   говорить про контент, а не про статус користувача. */
(function () {
  "use strict";

  const ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];

  // Мітки CEFR користувачеві не показуємо: аудиторія їх не знає.
  // Мітка з'являється лише в результаті.
  const SELF = [
    { level: "A1", text: "Знаю окремі слова, речення даються важко" },
    { level: "A2", text: "Розумію прості фрази, можу представитись" },
    { level: "B1", text: "Спілкуюсь на побутові теми, плутаюсь у часах" },
    { level: "B2", text: "Читаю статті, дивлюсь без субтитрів" },
    { level: "C1", text: "Вільно обговорюю складні теми" }
    // C2 через самооцінку не даємо — його треба підтвердити тестом або грою.
  ];

  const TEST_LEN = 16;

  // Зважений сходинковий метод. Симетричні кроки (вгору = вниз) сходяться
  // до рівня, де людина відповідає на 50% — а «свій рівень» це ~70%.
  // Тому крок угору менший за крок униз у пропорції (1-0.7)/0.7.
  const STEP_UP = 0.43;
  const STEP_DOWN = 1;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  let bank = [];
  let done = null;

  /* ---------- крок 1: самооцінка ---------- */

  function start(bankRef, onDone) {
    bank = bankRef || [];
    done = onDone || function () {};
    fromMenu = false;
    renderSelf();
    showScreen();
  }

  /** Повторне визначення рівня з налаштувань — одразу тест, без самооцінки:
      людина вже свідомо його обрала, питати думку вдруге не треба. */
  function retest(bankRef, onDone) {
    bank = bankRef || [];
    done = onDone || function () {};
    fromMenu = true;
    showScreen();
    startTest();
  }

  function showScreen() {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    const el = $("screen-onboard");
    if (el) el.classList.add("active");
    window.scrollTo(0, 0);
  }

  function renderSelf() {
    const body = $("onboard-body");
    if (!body) return;
    body.innerHTML = `
      <div class="ob-head">
        <h1>Наскільки добре ти знаєш англійську?</h1>
        <p class="note dim">Це лише відправна точка. Застосунок сам підлаштується під тебе.</p>
      </div>
      <div class="ob-list">
        ${SELF.map(s => `<button class="ob-opt" data-level="${s.level}">${esc(s.text)}</button>`).join("")}
      </div>
      <button class="btn ghost" id="ob-test">Краще пройти тест — 16 питань</button>`;

    body.querySelectorAll(".ob-opt").forEach(b => {
      b.onclick = () => finish(b.dataset.level, "self");
    });
    const t = $("ob-test");
    if (t) t.onclick = startTest;
  }

  /* ---------- крок 2: адаптивний тест ---------- */

  // Рівні, на яких у банку досить MCQ, щоб питання не повторювались.
  function testableLevels() {
    const n = {};
    bank.forEach(q => { if (q.type === "mcq" && q.level) n[q.level] = (n[q.level] || 0) + 1; });
    return ORDER.filter(lv => (n[lv] || 0) >= 6);
  }

  let test = null;
  let fromMenu = false;      // тест запущено з налаштувань, а не з онбордингу

  function startTest() {
    const avail = testableLevels();
    if (!avail.length) { finish("B1", "self"); return; }

    const lo = ORDER.indexOf(avail[0]);
    const hi = ORDER.indexOf(avail[avail.length - 1]);
    // Старт із середини доступного діапазону.
    test = { i: 0, est: (lo + hi) / 2, lo, hi, used: {}, correct: 0 };
    nextTestQuestion();
  }

  function pickQuestion() {
    // Питання беремо з найближчого доступного рівня до поточної оцінки.
    const want = Math.max(test.lo, Math.min(test.hi, Math.round(test.est)));
    for (let d = 0; d <= ORDER.length; d++) {
      for (const lv of [ORDER[want - d], ORDER[want + d]]) {
        if (!lv) continue;
        const pool = bank.filter(q => q.type === "mcq" && q.level === lv && !test.used[q.id]);
        if (pool.length) return pool[Math.floor(Math.random() * pool.length)];
      }
    }
    return null;
  }

  function nextTestQuestion() {
    if (test.i >= TEST_LEN) return finishTest();
    const q = pickQuestion();
    if (!q) return finishTest();
    test.used[q.id] = true;
    renderTestQuestion(q);
  }

  function renderTestQuestion(q) {
    const body = $("onboard-body");
    if (!body) return;
    const pct = Math.round(test.i / TEST_LEN * 100);
    body.innerHTML = `
      <div class="ob-head">
        <p class="note dim">Питання ${test.i + 1} з ${TEST_LEN}</p>
        <div class="ob-rail"><div class="ob-fill" style="width:${pct}%"></div></div>
      </div>
      <p class="ob-prompt">${esc(q.prompt)}</p>
      <div class="ob-list">
        ${shuffle(q.options.slice()).map(o => `<button class="opt ob-answer" data-opt="${esc(o)}">${esc(o)}</button>`).join("")}
      </div>
      <button class="link-btn" id="ob-skip-test">${fromMenu ? "Скасувати" : "Пропустити тест"}</button>`;

    // Під час тесту правильну відповідь НЕ показуємо: інакше це навчання,
    // а не вимір — людина калібрується по ходу і результат зміщується.
    body.querySelectorAll(".ob-answer").forEach(b => {
      b.onclick = () => {
        body.querySelectorAll(".ob-answer").forEach(x => { x.disabled = true; });
        answerTest(b.dataset.opt === q.answer);
      };
    });
    const s = $("ob-skip-test");
    if (s) s.onclick = () => { if (fromMenu) done(null); else renderSelf(); };
  }

  function answerTest(ok) {
    // Великі кроки на початку звужують діапазон швидко, далі — точне доведення.
    const scale = test.i < 4 ? 1 : 0.5;
    test.est += (ok ? STEP_UP : -STEP_DOWN) * scale;
    if (ok) test.correct++;
    test.i++;
    // Оцінка може вийти за межі банку на крок — так виявляється рівень,
    // під який контенту ще немає.
    test.est = Math.max(test.lo - 1, Math.min(test.hi + 1, test.est));
    setTimeout(nextTestQuestion, 160);
  }

  function finishTest() {
    const i = Math.max(0, Math.min(ORDER.length - 1, Math.round(test.est)));
    finish(ORDER[i], "placement");
  }

  /* ---------- крок 3: підтвердження ---------- */

  function finish(level, source) {
    if (source === "placement") Level.setPlacement(level); else Level.setSelf(level);
    if (window.Store && Store.saveLevel) Store.saveLevel(level, source, false);

    const body = $("onboard-body");
    if (!body) return done(level);
    body.innerHTML = `
      <div class="ob-head">
        <div class="ob-level">${esc(level)}</div>
        <h1>Почнемо з ${esc(level)}</h1>
        <p class="note dim">Застосунок стежитиме за твоїми відповідями й сам підбере складність. Рівень може змінитись в обидва боки — це нормально.</p>
      </div>
      <button class="btn primary big" id="ob-go">Почати</button>`;
    const g = $("ob-go");
    if (g) g.onclick = () => done(level);
  }

  /* ---------- транзиції ---------- */

  /** Підвищення — рідка й значима подія, показуємо повноекранно. */
  function celebrate(changed) {
    const el = $("level-up");
    if (!el) return;
    const t = $("level-up-title");
    const s = $("level-up-sub");
    if (t) t.textContent = `Рівень ${changed.to}`;
    if (s) s.textContent = `Ти впевнено тягнеш ${changed.from}. Далі буде складніше — і цікавіше.`;
    el.hidden = false;
    const btn = $("level-up-close");
    if (btn) { btn.onclick = () => { el.hidden = true; }; btn.focus(); }
  }

  /** Зниження — тихе перекалібрування. Говоримо про контент, не про статус. */
  function notifyDown(changed, weakLabel) {
    const el = $("level-toast");
    if (!el) return;
    el.textContent = weakLabel
      ? `Підбираємо завдання простіше — попрацюємо над темою «${weakLabel}»`
      : "Трохи спростимо завдання, щоб закріпити основу";
    el.hidden = false;
    clearTimeout(notifyDown._t);
    notifyDown._t = setTimeout(() => { el.hidden = true; }, 5000);
  }

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  window.Onboard = { start, retest, celebrate, notifyDown, SELF, TEST_LEN };
})();
