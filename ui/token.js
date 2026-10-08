/* ui/token.js — слово-токен для завдань на порядок слів (.token). */
(function () {
  "use strict";
  const UI = (window.NivoUI = window.NivoUI || {});

  /** @param {{text:string, used?:boolean, onClick?:Function}} props */
  UI.createToken = function ({ text, used = false, onClick } = {}) {
    const b = document.createElement("button");
    b.className = "token";
    b.textContent = text;
    if (used) b.classList.add("used");
    if (onClick) b.onclick = () => onClick(b);
    return b;
  };
})();
