/* ui/level-badge.js — бейдж рівня CEFR (.level-badge). Колір дає CSS
   за data-level.

   У застосунку бейдж лежить у розмітці index.html, тому поруч є
   updateLevelBadge(el, level) — оновити вже наявний елемент. */
(function () {
  "use strict";
  const UI = (window.NivoUI = window.NivoUI || {});

  /** level: "A1"…"C2"; без рівня бейдж просто ховається. */
  UI.updateLevelBadge = function (el, level) {
    if (!level) { el.hidden = true; return el; }
    el.hidden = false;
    el.textContent = level;
    el.dataset.level = level;
    return el;
  };

  /** @param {{level?:string|null}} props */
  UI.createLevelBadge = function ({ level = null } = {}) {
    const el = document.createElement("span");
    el.className = "level-badge";
    return UI.updateLevelBadge(el, level);
  };
})();
