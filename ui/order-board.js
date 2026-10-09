/* ui/order-board.js — рейка (.slot-rail) і пул токенів (.tokens) для завдань
   на порядок слів. Потребує ui/token.js.

   Повертає обгортку з двома методами:
     el.getValue()  — зібране речення рядком
     el.lock(ok)    — зафіксувати відповідь і пофарбувати рейку */
(function () {
  "use strict";
  const UI = (window.NivoUI = window.NivoUI || {});

  /** @param {{tokens:string[], picked?:string[], result?:"ok"|"no"|null}} props
      tokens — у тому порядку, в якому їх показати (перемішує викликач);
      picked — слова, вже перенесені на рейку; result — зафіксований стан. */
  UI.createOrderBoard = function ({ tokens = [], picked: initial = [], result = null } = {}) {
    const el = document.createElement("div");
    el.className = "order-board";

    const rail = document.createElement("div");
    rail.className = "slot-rail";
    el.appendChild(rail);

    const pool = document.createElement("div");
    pool.className = "tokens";
    el.appendChild(pool);

    const picked = [];

    function pick(b, t) {
      if (b.classList.contains("used")) return;
      b.classList.add("used");
      picked.push(t);
      const s = UI.createToken({
        text: t,
        onClick: () => {
          const i = picked.lastIndexOf(t);
          if (i > -1) picked.splice(i, 1);
          s.remove();
          b.classList.remove("used");
        }
      });
      rail.appendChild(s);
    }

    const poolBtns = tokens.map(t => {
      const b = UI.createToken({ text: t, onClick: () => pick(b, t) });
      pool.appendChild(b);
      return { b, t };
    });

    initial.forEach(t => {
      const free = poolBtns.find(x => x.t === t && !x.b.classList.contains("used"));
      if (free) pick(free.b, t);
    });

    el.getValue = () => picked.join(" ");

    el.lock = ok => {
      rail.style.borderStyle = "solid";
      rail.style.borderColor = ok ? "var(--ok)" : "var(--no)";
      pool.querySelectorAll(".token").forEach(t => t.onclick = null);
      rail.querySelectorAll(".token").forEach(t => t.onclick = null);
    };

    if (result) el.lock(result === "ok");
    return el;
  };
})();
