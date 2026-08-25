/* level.js — обчислення поточного рівня гравця.
   Підключати ДО app.js. Нічого не малює, лише рахує. */
(function () {
  "use strict";

  const CFG = {
    TARGET: "B2",      // рівень, який треба підтвердити
    BASE: "B1",        // підлога: нижче не опускаємось, бо A2-контенту в банку немає
    WINDOW: 30,        // скільки останніх відповідей рівня TARGET беремо
    MIN: 30,           // менше — рівень невідомий, бейдж ховаємо
    UP: 0.75,          // поріг підвищення
    DOWN: 0.60,        // поріг зниження (між 0.60 і 0.75 нічого не змінюється)
    CONFIRM: 2,        // скільки перевірок поспіль мають бути вище UP
    KEY: "nivo.level"
  };

  const BLANK = { level: CFG.BASE, up: 0, seen: 0 };

  function readState() {
    try {
      const raw = localStorage.getItem(CFG.KEY);
      if (!raw) return { ...BLANK };
      const s = JSON.parse(raw);
      return {
        level: s.level === CFG.TARGET ? CFG.TARGET : CFG.BASE,
        up: Number(s.up) || 0,
        seen: Number(s.seen) || 0
      };
    } catch (e) { return { ...BLANK }; }
  }

  function writeState(s) {
    try { localStorage.setItem(CFG.KEY, JSON.stringify(s)); } catch (e) {}
  }

  /**
   * @param {Array} answers  рядки progress.answers (потрібні question_id, is_correct, answered_at)
   * @param {Object} levelById  мапа id питання -> "B1"|"B2"
   */
  function compute(answers, levelById) {
    const rows = (answers || [])
      .filter(a => a && a.question_id && levelById[a.question_id] === CFG.TARGET)
      .sort((a, b) => new Date(a.answered_at || 0) - new Date(b.answered_at || 0));

    if (rows.length < CFG.MIN) {
      return {
        level: null, accuracy: null, counted: rows.length,
        needed: CFG.MIN - rows.length, changed: null
      };
    }

    const win = rows.slice(-CFG.WINDOW);
    const acc = win.filter(a => a.is_correct).length / win.length;
    const prev = readState();

    // Ідемпотентність: перезавантаження сторінки не рухає лічильник підтверджень.
    if (rows.length === prev.seen) {
      return { level: prev.level, accuracy: acc, counted: rows.length, needed: 0, changed: null };
    }

    const next = { level: prev.level, up: acc >= CFG.UP ? prev.up + 1 : 0, seen: rows.length };

    if (prev.level !== CFG.TARGET && next.up >= CFG.CONFIRM) {
      next.level = CFG.TARGET;
      next.up = 0;
    } else if (prev.level === CFG.TARGET && acc < CFG.DOWN) {
      next.level = CFG.BASE;
      next.up = 0;
    }

    writeState(next);

    return {
      level: next.level,
      accuracy: acc,
      counted: rows.length,
      needed: 0,
      changed: next.level !== prev.level ? next.level : null
    };
  }

  /** Прогрес до наступного рівня, 0..1. null — якщо рівень цільовий або невідомий. */
  function progressToNext(state) {
    if (!state || state.level === null || state.level === CFG.TARGET) return null;
    return Math.max(0, Math.min(1, state.accuracy / CFG.UP));
  }

  /** Знадобиться, коли з'явиться тест на визначення рівня. */
  function reset(lv) {
    writeState({ level: lv === CFG.TARGET ? CFG.TARGET : CFG.BASE, up: 0, seen: 0 });
  }

  window.Level = { compute, progressToNext, reset, CFG };
})();
