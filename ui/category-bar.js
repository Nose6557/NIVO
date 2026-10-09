/* ui/category-bar.js — рядок «Шкали рівнів» (.tbar): назва категорії,
   смуга точності й відсоток. */
(function () {
  "use strict";
  const UI = (window.NivoUI = window.NivoUI || {});

  const REDUCE_MOTION = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function temperColor(acc) {
    if (acc >= 0.85) return "var(--indigo)";
    if (acc >= 0.7) return "var(--blue)";
    if (acc >= 0.5) return "var(--cyan)";
    return "var(--teal)";
  }

  /* Лічильник відсотка біжить синхронно зі смугою (.tbar-fill, той самий
     тайминг progress-grow), а не з'являється миттю. */
  function animateCount(el, target, duration = 900) {
    if (REDUCE_MOTION) { el.textContent = target + "%"; return; }
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);   // easeOutCubic — той самий характер, що й у progress-grow
      el.textContent = Math.round(target * eased) + "%";
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /** @param {{name:string, accuracy?:number|null}} props
      accuracy — частка 0…1; null — у категорії ще немає відповідей. */
  UI.createCategoryBar = function ({ name, accuracy = null } = {}) {
    const has = accuracy !== null;
    const acc = has ? accuracy : 0;

    const el = document.createElement("div");
    el.className = "tbar";

    const nameEl = document.createElement("div");
    nameEl.className = "tbar-name";
    nameEl.textContent = name;
    el.appendChild(nameEl);

    const rail = document.createElement("div");
    rail.className = "tbar-rail";
    const fill = document.createElement("div");
    fill.className = "tbar-fill";
    fill.style.width = (has ? Math.max(acc * 100, 4) : 0) + "%";
    fill.style.background = temperColor(acc);
    rail.appendChild(fill);
    el.appendChild(rail);

    const val = document.createElement("div");
    val.className = "tbar-val";
    val.textContent = has ? "0%" : "—";
    el.appendChild(val);

    if (has) animateCount(val, Math.round(acc * 100));
    return el;
  };
})();
