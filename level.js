/* level.js — обчислення поточного рівня гравця (A1…C2).
   Підключати ДО app.js. Нічого не малює, лише рахує.

   Модель: є ОЦІНКА додатка (est) — один рівень, який безперервно коригують
   реальні відповіді. Самооцінка й тест лише ініціалізують її. Звідки взялося
   значення (source) визначає, наскільки швидко трекер має право його виправити.

   Авто-режим: рівень = оцінка, це одне значення.
   Ручний режим (locked): рівень обирає людина, а оцінка живе поруч і рухається
   тим самим алгоритмом — це рівень, який був би зараз в авто-режимі. */
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
    VERSION: 5,

    // Ручний режим, оцінка ≠ обраному: у сесію підмішуються проби — завдання
    // рівня оцінки. Їх мало, тому вікно на пробах коротше за звичайне.
    PROBES: 4,
    PROBE_WINDOW: 20,

    // Довіра до джерела: слабша гіпотеза виправляється швидше.
    // Зниження всюди вимагає на одне підтвердження більше за підвищення —
    // захист від тимчасового спаду форми.
    TRUST: {
      self:      { window: 15, min: 15, confirmUp: 1, confirmDown: 2 },
      placement: { window: 20, min: 20, confirmUp: 2, confirmDown: 3 },
      // Ручний вибір більше не є джерелом для трекера: він міняє лише рівень,
      // оцінку не чіпає. Запис лишається для станів і профілів, збережених
      // до v5, де source "manual" ще трапляється.
      manual:    { window: 20, min: 20, confirmUp: 2, confirmDown: 3 },
      adaptive:  { window: 30, min: 30, confirmUp: 2, confirmDown: 3 }
    },

    DEFAULT_SOURCE: "adaptive"
  };

  const idx = lv => ORDER.indexOf(lv);
  const valid = lv => idx(lv) !== -1;
  const trustOf = src => CFG.TRUST[src] || CFG.TRUST.adaptive;

  // level  — рівень завдань (на аватарі). В авто дорівнює est.
  // est    — оцінка додатка. Лічильники up / down / seen належать саме їй:
  //          це трекер оцінки, і в авто, і в ручному режимі він один.
  // source — звідки взялась оцінка; від нього залежать вікно й підтвердження.
  function blank() {
    return { v: CFG.VERSION, level: null, source: null, up: 0, down: 0, seen: null, locked: false, est: null };
  }

  // Інваріанти стану: оцінка є завжди, коли є рівень; в авто вона дорівнює рівню.
  function norm(s) {
    if (!s.level) { s.est = null; return s; }
    if (!s.locked || !valid(s.est)) s.est = s.level;
    return s;
  }

  function readState() {
    try {
      const raw = localStorage.getItem(CFG.KEY);
      if (!raw) return blank();
      const s = JSON.parse(raw) || {};

      // Міграція зі старої B1/B2-схеми (без поля v): рівень уже напрацьований
      // реальними відповідями, тому джерело — adaptive.
      // seen НЕ переносимо: стара схема рахувала його по питаннях B2, нова —
      // по питаннях рівня оцінки. Це різні популяції, і перенесене число
      // дало б миттєву перевірку на першому ж рендері. null = перебазувати.
      if (!s.v) {
        return norm({
          v: CFG.VERSION,
          level: valid(s.level) ? s.level : null,
          source: valid(s.level) ? "adaptive" : null,
          up: 0,
          down: 0,
          seen: null,
          locked: false,
          est: null
        });
      }

      // Лічильники переносимо, лише якщо вони рахували ту саму популяцію
      // відповідей, що й тепер.
      //  - до v4 метрику годували й пакети "scored": false — старий seen
      //    завищений, умова непересічних вікон не виконалась би ніколи;
      //  - у v4 лічильники належали РІВНЮ, а з v5 — ОЦІНЦІ. В авто це одне й те
      //    саме, тож там нічого не губимо. У ручному режимі оцінка могла бути
      //    іншим щаблем, ніж рівень, — такі лічильники вже не про неї.
      // null = перебазувати при першому compute. Сам рівень зберігаємо завжди.
      const keep = s.v === CFG.VERSION || (s.v === 4 && !s.locked);

      return norm({
        v: CFG.VERSION,
        level: valid(s.level) ? s.level : null,
        source: s.source && CFG.TRUST[s.source] ? s.source : (valid(s.level) ? CFG.DEFAULT_SOURCE : null),
        up: keep ? (Number(s.up) || 0) : 0,
        down: keep ? (Number(s.down) || 0) : 0,
        seen: (!keep || s.seen === null || s.seen === undefined) ? null : (Number(s.seen) || 0),
        locked: !!s.locked,
        // Оцінку переживає навіть зміна версії: це вимірювання, а не лічильник.
        est: valid(s.est) ? s.est : null
      });
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
    const locked = !!profile.level_locked;
    const next = norm({
      v: CFG.VERSION,
      level: profile.level,
      source: CFG.TRUST[profile.level_source] ? profile.level_source : CFG.DEFAULT_SOURCE,
      up: 0,
      down: 0,
      seen: null,
      locked,
      // Сервер виграє, локальна оцінка — запасний варіант (колонки level_est
      // може ще не бути, тоді в профілі її просто немає). В авто оцінка
      // дорівнює рівню, що б не лежало в колонці.
      est: valid(profile.level_est) ? profile.level_est : (cur.locked ? cur.est : null)
    });
    // Лічильники трекера живуть лише в браузері. Якщо сервер підтвердив ту саму
    // оцінку з того самого джерела — це той самий трекер, і він продовжує
    // рахувати. Інакше оцінку змінили деінде: починаємо з чистого вікна.
    if (cur.est === next.est && cur.source === next.source) {
      next.up = cur.up;
      next.down = cur.down;
      next.seen = cur.seen;
    }
    writeState(next);
    return next;
  }

  /** Самооцінка при онбордингу. Слабка гіпотеза — виправляється швидко. */
  function setSelf(lv) { return seed(lv, "self"); }

  /** Результат тесту рівня: це вимірювання, тож ставить і рівень, і оцінку.
      Режим не чіпає — тест можна пройти й у ручному. */
  function setPlacement(lv) { return seed(lv, "placement"); }

  function seed(lv, source) {
    if (!valid(lv)) return readState();
    const cur = readState();
    // seen: null — у користувача з історією вже можуть бути сотні відповідей
    // цього рівня; 0 означав би миттєву перевірку одразу після онбордингу.
    const next = {
      v: CFG.VERSION, level: lv, source, up: 0, down: 0,
      seen: null, locked: cur.locked, est: lv
    };
    writeState(next);
    return next;
  }

  /** Перемикач «Автоматичний рівень» (увімкнено = locked: false).

      Авто → ручний: обраний рівень = поточний, оцінка = поточний, трекер
      рахує далі без скидання.

      Ручний → авто: людина віддає рівень додатку. Якщо оцінка розійшлася
      з обраним — рівень стає оцінкою. Оцінка тепер підтверджена тим самим
      алгоритмом, що й авто-рівень, тож брати її можна одразу. Трекер не
      скидаємо: він і так міряв саме цей рівень.

      У відповіді switched = { from, to } — рівень змінився перемиканням
      (інтерфейс показує тост, не привітання), або null. */
  function setLocked(on) {
    const s = readState();
    s.locked = !!on;
    let switched = null;
    if (!s.locked && s.level && valid(s.est) && s.est !== s.level) {
      switched = { from: s.level, to: s.est };
      s.level = s.est;
    }
    norm(s);
    writeState(s);
    return { ...s, switched };
  }

  /** Користувач обрав рівень зі списку (ручний режим). Це заява людини, а не
      вимірювання: змінюється лише рівень завдань. Оцінка, її джерело
      й лічильники лишаються як були. */
  function setManual(lv) {
    if (!valid(lv)) return readState();
    const s = readState();
    if (!s.level) return seed(lv, "manual");   // рівня ще не було — оцінити нічим
    s.level = lv;
    if (!s.locked) {
      // Список видно лише в ручному режимі; якщо ж рівень поставили в авто,
      // оцінка їде разом із ним і міряється з чистого аркуша.
      s.est = lv; s.up = 0; s.down = 0; s.seen = null;
    }
    writeState(s);
    return s;
  }

  /** Рівень проб для наступної сесії або null. Проби потрібні лише в ручному
      режимі, коли оцінка ≠ обраному: інакше сесія не дає жодної відповіді
      рівня оцінки, і міряти її нічим. */
  function probeLevel() {
    const s = readState();
    return (s.level && s.locked && s.est !== s.level) ? s.est : null;
  }

  function current() { return readState(); }

  function reset() { writeState(blank()); }

  /* ---------- основний розрахунок ---------- */

  /**
   * @param {Array}  answers    рядки answers (question_id, is_correct, answered_at)
   * @param {Object} levelById  мапа id питання -> "A1".."C2" (лише паки, що годують метрику)
   * @returns {{level, source, accuracy, counted, needed, changed, estimate, estChanged, probing}}
   *   changed    === null | { from, to, dir } — змінився РІВЕНЬ (тільки в авто)
   *   estChanged === null | { from, to, dir } — змінилась оцінка (в авто збігається з changed)
   *   estimate   — оцінка додатка; в авто дорівнює level
   *   probing    — оцінку міряють проби (ручний режим, оцінка ≠ обраному)
   */
  function compute(answers, levelById) {
    const prev = readState();

    // Рівень ще не заданий — онбординг його поставить. Нічого не рахуємо.
    if (!prev.level) {
      return { level: null, source: null, accuracy: null, counted: 0, needed: null, changed: null, estimate: null, estChanged: null, probing: false };
    }

    const t = trustOf(prev.source);
    const probing = prev.locked && prev.est !== prev.level;
    // На пробах відповідей рівня оцінки лише кілька на сесію — вікно коротше.
    const size = probing ? CFG.PROBE_WINDOW : t.window;

    // Рахуємо ТІЛЬКИ питання рівня оцінки. В авто це і є рівень сесії. У ручному
    // режимі тренування на обраному рівні оцінку не рухає: низька точність на
    // C1 нічого не каже про те, чи тягнеш ти B2.
    const rows = (answers || [])
      .filter(a => a && a.question_id && levelById[a.question_id] === prev.est)
      .sort((a, b) => new Date(a.answered_at || 0) - new Date(b.answered_at || 0));

    // Перебазування: оцінку щойно задано ззовні (онбординг, тест, профіль,
    // міграція). Точку відліку фіксуємо ОДРАЗУ: свіжим вимірюванням вважаються
    // тільки відповіді після цього. Інакше першим вікном пішла б стара історія
    // рівня — і оцінка змінилася б без жодної нової відповіді.
    if (prev.seen === null) {
      prev.seen = rows.length;
      writeState(prev);
    }

    // Вікна для підтверджень не перекриваються, інакше "дві перевірки поспіль" —
    // це та сама вибірка двічі, і оцінка починає скакати від шуму.
    const fresh = rows.length - prev.seen;
    const same = {
      level: prev.level, source: prev.source, counted: rows.length,
      changed: null, estimate: prev.est, estChanged: null, probing
    };

    if (fresh < size) {
      return { ...same, accuracy: null, needed: size - fresh };
    }

    const win = rows.slice(-size);
    const acc = win.filter(a => a.is_correct).length / win.length;

    const i = idx(prev.est);
    const next = {
      ...prev,
      up:   acc >= CFG.UP   ? prev.up + 1   : 0,
      down: acc <= CFG.DOWN ? prev.down + 1 : 0,
      seen: rows.length
    };

    let estChanged = null;

    // Різке відхилення — виправляємо одразу, без накопичення підтверджень.
    const fastUp   = acc >= CFG.FAST_UP;
    const fastDown = acc <= CFG.FAST_DOWN;

    if ((fastUp || next.up >= t.confirmUp) && i < ORDER.length - 1) {
      estChanged = { from: prev.est, to: ORDER[i + 1], dir: "up" };
    } else if ((fastDown || next.down >= t.confirmDown) && i > 0) {
      estChanged = { from: prev.est, to: ORDER[i - 1], dir: "down" };
    }

    if (estChanged) {
      next.est = estChanged.to;
      next.source = "adaptive";   // будь-яка корекція робить значення підтвердженим
      next.up = 0;
      next.down = 0;
      // Міряємо вже інший рівень — старі відповіді на ньому свіжими не є.
      next.seen = (answers || []).filter(a => a && levelById[a.question_id] === estChanged.to).length;
      // В авто рівень і є оцінка. У ручному рівень тримає людина.
      if (!prev.locked) next.level = estChanged.to;
    }

    writeState(next);

    return {
      level: next.level, source: next.source, accuracy: acc,
      counted: rows.length, needed: 0,
      changed: (estChanged && !prev.locked) ? estChanged : null,
      estimate: next.est, estChanged,
      probing: next.locked && next.est !== next.level
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
    setSelf, setPlacement, setManual, setLocked, current, probeLevel,
    ORDER, CFG
  };
})();
