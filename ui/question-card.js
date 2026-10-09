/* ui/question-card.js — картка питання (.card): тег категорії, промпт
   і довільний вміст під ними (варіанти, поле, фідбек, кнопка).

   el.update({ category, prompt }) міняє шапку, не чіпаючи вміст. */
(function () {
  "use strict";
  const UI = (window.NivoUI = window.NivoUI || {});

  /** @param {{category?:string, prompt?:string, children?:HTMLElement[]}} props */
  UI.createQuestionCard = function ({ category = "", prompt = "", children = [] } = {}) {
    const el = document.createElement("div");
    el.className = "card";

    const cat = document.createElement("p");
    cat.className = "cat-tag mono";
    el.appendChild(cat);

    const pr = document.createElement("p");
    pr.className = "q-prompt";
    el.appendChild(pr);

    children.forEach(c => el.appendChild(c));

    el.update = next => {
      if (next.category !== undefined) cat.textContent = next.category;
      if (next.prompt !== undefined) pr.textContent = next.prompt;
    };

    el.update({ category, prompt });
    return el;
  };
})();
