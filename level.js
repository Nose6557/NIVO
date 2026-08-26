/* level.js — обчислення поточного рівня гравця (A1…C2).
   Підключати ДО app.js. Нічого не малює, лише рахує.

   Модель: рівень — ОДНЕ значення. Самооцінка й тест лише ініціалізують його,
   далі його безперервно коригують реальні відповіді. Звідки взялося значення
   (source) визначає, наскільки швидко адаптив має право його виправити. */
(function () {
  "use strict";

  const ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];

  const CFG = {
    ORDER,

    // Двоярусні пороги. Помірне відхилення вимагає підтверджень, різке —
    // виправляється одразу. Так користувач, посаджений не на свій рівень,
    // потрапляє на правильний швидко, а той, хто вже на своєму, не смикається.
    UP: 0.82,
    FAST_UP: 0.92,
    DOWN: 0.52,
    FAST_DOWN: 0.35,

    KEY: "nivo.level",
    VERSION: 3,

    // Довіра до джерела: слабша гіпотеза виправляється швидше.
    // Зниження всюди вимагає на одне підтвердження більше за підвищення —
    // захист від тимчасового спаду форми.
    TRUST: {
      self:      { window: 15, min: 15, confirmUp: 1, confirmDown: 2 },
      placement: { window: 20, min: 20, confirmUp: 2, confirmDown: 3 },
      adaptive:  { window: 30, min: 30, confirmUp: 2, confirmDown: 3 }
    },

    DEFAULT_SOURCE: "adaptive"
  };

  const idx = lv => ORDER.indexOf(lv);
  const valid = lv => idx(lv) !== -1;
  const trustOf = src => CFG.TRUST[src] || CFG.TRUST.adaptive;

  function blank() {
    return { v: CFG.VERSION, level: null, source: null, up: 0, down: 0, seen: null, locked: false };
  }

  function readState() {
    try {
      const raw = localStorage.getItem(CFG.KEY);
      if (!raw) return blank();
      const s = JSON.parse(raw) || {};

      // Міграція зі старої B1/B2-схеми (без поля v): рівень уже напрацьований
      // реальними відповідями, тому джерело — adaptive.
      // seen НЕ переносимо: стара схема рахувала його по питаннях B2, нова —
      // по питаннях поточного рівня. Це різні популяції, і перенесене число
      // дало б миттєву оцінку на першому ж рендері. null = перебазувати.
      if (!s.v) {
        return {
          v: CFG.VERSION,
          level: valid(s.level) ? s.level : null,
          source: valid(s.level) ? "adaptive" : null,
          up: 0,
          down: 0,
          seen: null,
          locked: false
        };
      }

      return {
        v: CFG.VERSION,
        level: valid(s.level) ? s.level : null,
        source: s.source && CFG.TRUST[s.source] ? s.source : (valid(s.level) ? CFG.DEFAULT_SOURCE : null),
        up: Number(s.up) || 0,
        down: Number(s.down) || 0,
        seen: s.seen === null ? null : (Number(s.seen) || 0),
        locked: !!s.locked
      };
    } catch (e) { return blank(); }
  }

  function writeState(s) {
    try { localStorage.setItem(CFG.KEY, JSON.stringify(s)); } catch (e) {}
  }

  /* ---------- зовнішня ініціалізація ---------- */

  /** Засіяти рівень із профілю Supabase. Сервер завжди виграє над локальним. */
  function hydrate(profile) {
    if (!profile || !valid(profile.level)) return readState();
    const cur = readState();
    const next = {
      v: CFG.VERSION,
      level: profile.level,
      source: CFG.TRUST[profile.level_source] ? profile.level_source : CFG.DEFAULT_SOURCE,
      up: 0,
      down: 0,
      // Набір питань "на рівні" змінився — старий лічильник несумісний.
      // null = перебазувати при першому compute, а не оцінювати одразу.
      seen: cur.level === profile.level ? cur.seen : null,
      locked: !!profile.level_locked
    };
    writeState(next);
    return next;
  }

  /** Самооцінка при онбордингу. Слабка гіпотеза — виправляється швидко. */
  function setSelf(lv) { return seed(lv, "self"); }

  /** Результат placement-тесту. */
  function setPlacement(lv) { return seed(lv, "placement"); }

  function seed(lv, source) {
    if (!valid(lv)) return readState();
    // seen: null — у користувача з історією вже можуть бути сотні відповідей
    // цього рівня; 0 означав би миттєву оцінку одразу після онбордингу.
    const next = { v: CFG.VERSION, level: lv, source, up: 0, down: 0, seen: null, locked: readState().locked };
    writeState(next);
    return next;
  }

  /** Ручна фіксація рівня користувачем — адаптив більше не втручається. */
  function setLocked(on) {
    const s = readState();
    s.locked = !!on;
    writeState(s);
    return s;
  }

  function current() { return readState(); }

  function reset() { writeState(blank()); }

  /* ---------- основний розрахунок ---------- */

  /**
   * @param {Array}  answers    рядки answers (question_id, is_correct, answered_at)
   * @param {Object} levelById  мапа id питання -> "A1".."C2"
   * @returns {{level, source, accuracy, counted, needed, changed}}
   *   changed === null | { from, to, dir: "up"|"down" }
   */
  function compute(answers, levelById) {
    const prev = readState();

    // Рівень ще не заданий — онбординг його поставить. Нічого не рахуємо.
    if (!prev.level) {
      return { level: null, source: null, accuracy: null, counted: 0, needed: null, changed: null };
    }

    const t = trustOf(prev.source);

    // Рахуємо ТІЛЬКИ питання поточного рівня: міра — "чи тягнеш ти свій рівень".
    const rows = (answers || [])
      .filter(a => a && a.question_id && levelById[a.question_id] === prev.level)
      .sort((a, b) => new Date(a.answered_at || 0) - new Date(b.answered_at || 0));

    if (rows.length < t.min) {
      return {
        level: prev.level, source: prev.source, accuracy: null,
        counted: rows.length, needed: t.min - rows.length, changed: null
      };
    }

    const win = rows.slice(-t.window);
    const acc = win.filter(a => a.is_correct).length / win.length;

    // Перебазування: рівень щойно заданий ззовні (онбординг, тест, профіль,
    // міграція). Фіксуємо точку відліку й чекаємо повне свіже вікно —
    // інакше рівень змінився б від старої історії, без жодної нової сесії.
    if (prev.seen === null) {
      writeState({ ...prev, seen: rows.length });
      return { level: prev.level, source: prev.source, accuracy: acc, counted: rows.length, needed: t.window, changed: null };
    }

    // Вікна для підтверджень мають не перекриватися, інакше "два підтвердження
    // поспіль" — це та сама вибірка двічі, і рівень починає скакати від шуму.
    // Оцінюємо лише коли вікно оновилося повністю.
    if (rows.length - prev.seen < t.window) {
      return { level: prev.level, source: prev.source, accuracy: acc, counted: rows.length, needed: 0, changed: null };
    }

    if (prev.locked) {
      writeState({ ...prev, seen: rows.length });
      return { level: prev.level, source: prev.source, accuracy: acc, counted: rows.length, needed: 0, changed: null };
    }

    const i = idx(prev.level);
    const next = {
      v: CFG.VERSION,
      level: prev.level,
      source: prev.source,
      up:   acc >= CFG.UP   ? prev.up + 1   : 0,
      down: acc <= CFG.DOWN ? prev.down + 1 : 0,
      seen: rows.length,
      locked: false
    };

    let changed = null;

    // Різке відхилення — виправляємо одразу, без накопичення підтверджень.
    const fastUp   = acc >= CFG.FAST_UP;
    const fastDown = acc <= CFG.FAST_DOWN;

    if ((fastUp || next.up >= t.confirmUp) && i < ORDER.length - 1) {
      changed = { from: prev.level, to: ORDER[i + 1], dir: "up" };
    } else if ((fastDown || next.down >= t.confirmDown) && i > 0) {
      changed = { from: prev.level, to: ORDER[i - 1], dir: "down" };
    }

    if (changed) {
      next.level = changed.to;
      next.source = "adaptive";   // будь-яка корекція робить значення підтвердженим
      next.up = 0;
      next.down = 0;
      // Набір питань "на рівні" змінився — старий лічильник більше не валідний.
      next.seen = (answers || []).filter(a => a && levelById[a.question_id] === changed.to).length;
    }

    writeState(next);

    return {
      level: next.level, source: next.source, accuracy: acc,
      counted: rows.length, needed: 0, changed
    };
  }

  /** Прогрес до наступного рівня, 0..1. null — якщо стеля або рівень невідомий. */
  function progressToNext(state) {
    if (!state || !state.level || state.accuracy == null) return null;
    if (idx(state.level) === ORDER.length - 1) return null;
    return Math.max(0, Math.min(1, state.accuracy / CFG.UP));
  }

  window.Level = {
    compute, progressToNext, reset, hydrate,
    setSelf, setPlacement, setLocked, current,
    ORDER, CFG
  };
})();
