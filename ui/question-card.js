/* ui/question-card.js — картка питання (.card): тег категорії, промпт
   і довільний вміст під ними (варіанти, поле, фідбек, кнопка).

   badge — необов'язкова мітка поруч із категорією («Перевірка рівня»
   на пробі); порожній рядок її ховає.
   review — необов'язкова позначка «Повторення» там само: питання повернулося
   в сесію зі слабкої теми.

   el.update({ category, prompt, badge, review }) міняє шапку, не чіпаючи вміст. */
(function () {
  "use strict";
  const UI = (window.NivoUI = window.NivoUI || {});

  /** @param {{category?:string, prompt?:string, badge?:string, review?:boolean, children?:HTMLElement[]}} props */
  UI.createQuestionCard = function ({ category = "", prompt = "", badge = "", review = false, children = [] } = {}) {
    const el = document.createElement("div");
    el.className = "card";

    const cat = document.createElement("p");
    cat.className = "cat-tag mono";
    const catText = document.createElement("span");
    const tag = document.createElement("span");
    tag.className = "probe-tag";
    const rev = document.createElement("span");
    rev.className = "review-tag";
    rev.textContent = "Повторення";
    cat.append(catText, tag, rev);
    el.appendChild(cat);

    const pr = document.createElement("p");
    pr.className = "q-prompt";
    el.appendChild(pr);

    children.forEach(c => el.appendChild(c));

    el.update = next => {
      if (next.category !== undefined) catText.textContent = next.category;
      if (next.badge !== undefined) { tag.textContent = next.badge; tag.hidden = !next.badge; }
      if (next.review !== undefined) rev.hidden = !next.review;
      if (next.prompt !== undefined) pr.textContent = next.prompt;
    };

    el.update({ category, prompt, badge, review });
    return el;
  };
})();
