/* ui/progress.js — верх ігрового екрана (.play-top): смуга прогресу,
   лічильник питань, серія і кнопка дії праворуч.

   el.update({ value, count, streak }) змінює стан на місці — смуга тоді
   їде плавно (transition), а не перемальовується з нуля. */
(function () {
  "use strict";
  const UI = (window.NivoUI = window.NivoUI || {});

  /** @param {{value?:number, count?:string, streak?:string|null, actionLabel?:string, onAction?:Function}} props
      value — частка 0…1; streak: null — рядка серії немає взагалі. */
  UI.createProgress = function ({ value = 0, count = "", streak = null, actionLabel, onAction } = {}) {
    const el = document.createElement("div");
    el.className = "play-top";

    const rail = document.createElement("div");
    rail.className = "progress-rail";
    const fill = document.createElement("div");
    fill.className = "progress-fill";
    rail.appendChild(fill);
    el.appendChild(rail);

    const meta = document.createElement("div");
    meta.className = "play-meta";
    el.appendChild(meta);

    const countEl = document.createElement("span");
    countEl.className = "mono qcount";
    meta.appendChild(countEl);

    let streakEl = null;
    if (streak !== null) {
      streakEl = document.createElement("span");
      streakEl.className = "mono streak";
      meta.appendChild(streakEl);
    }

    if (actionLabel) {
      const btn = document.createElement("button");
      btn.className = "btn ghost small";
      btn.textContent = actionLabel;
      if (onAction) btn.onclick = () => onAction(btn);
      meta.appendChild(btn);
    }

    el.update = next => {
      if (next.value !== undefined) fill.style.width = (next.value * 100) + "%";
      if (next.count !== undefined) countEl.textContent = next.count;
      if (streakEl && next.streak !== undefined && next.streak !== null) streakEl.textContent = next.streak;
    };

    el.update({ value, count, streak });
    return el;
  };
})();
