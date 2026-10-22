/* ui/result-row.js — рядок підсумку сесії: категорія, смуга точності й рахунок.
   Та сама шкала, що й «Шкали рівнів» (createCategoryBar), лише праворуч «ok/n». */
(function () {
  "use strict";
  const UI = (window.NivoUI = window.NivoUI || {});

  /** @param {{label:string, value:string}} props  value — рахунок у форматі «ok/n». */
  UI.createResultRow = function ({ label, value } = {}) {
    const [ok, n] = String(value).split("/").map(Number);
    const accuracy = n > 0 ? ok / n : null;
    return UI.createCategoryBar({ name: label, accuracy, value });
  };
})();
