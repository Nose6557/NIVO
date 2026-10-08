/* ui/answer-option.js — кнопка варіанта відповіді (.opt).
   Класичний скрипт без збірки: кладе функцію в window.NivoUI.
   Підключати ДО onboard.js і app.js. */
(function () {
  "use strict";
  const UI = (window.NivoUI = window.NivoUI || {});

  /** @param {{text:string, state?:"right"|"wrong"|null, disabled?:boolean, onClick?:Function}} props */
  UI.createAnswerOption = function ({ text, state = null, disabled = false, onClick } = {}) {
    const b = document.createElement("button");
    b.className = "opt";
    b.textContent = text;
    if (state) b.classList.add(state);
    b.disabled = disabled;
    if (onClick) b.onclick = () => onClick(b);
    return b;
  };
})();
