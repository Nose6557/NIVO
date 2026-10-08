/* ui/result-row.js — рядок підсумку сесії (.res-row): категорія і рахунок. */
(function () {
  "use strict";
  const UI = (window.NivoUI = window.NivoUI || {});

  /** @param {{label:string, value:string}} props */
  UI.createResultRow = function ({ label, value } = {}) {
    const el = document.createElement("div");
    el.className = "res-row";
    const l = document.createElement("span");
    l.textContent = label;
    const v = document.createElement("span");
    v.textContent = value;
    el.appendChild(l);
    el.appendChild(v);
    return el;
  };
})();
