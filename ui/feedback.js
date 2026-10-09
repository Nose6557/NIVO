/* ui/feedback.js — блок після відповіді (.feedback): вердикт, пояснення
   і переклад. Потребує ui/ua-toggle.js.

   el.update({ correct, answer, explain, ua, uaOpen }) заповнює блок наново. */
(function () {
  "use strict";
  const UI = (window.NivoUI = window.NivoUI || {});

  /** @param {{correct?:boolean, answer?:string, explain?:string, ua?:string|null, uaOpen?:boolean, onUaToggle?:Function}} props */
  UI.createFeedback = function (props = {}) {
    const el = document.createElement("div");
    el.className = "feedback";

    const verdict = document.createElement("p");
    verdict.className = "verdict";
    el.appendChild(verdict);

    const explain = document.createElement("p");
    explain.className = "explain";
    el.appendChild(explain);

    const ua = UI.createUaToggle({ onToggle: props.onUaToggle });
    el.appendChild(ua);

    el.update = next => {
      verdict.textContent = next.correct ? "Правильно" : "Правильна відповідь: " + next.answer;
      verdict.className = "verdict " + (next.correct ? "ok" : "no");
      explain.textContent = next.explain;
      ua.update({ text: next.ua, open: next.uaOpen });
    };

    if (props.explain !== undefined) el.update(props);
    return el;
  };
})();
