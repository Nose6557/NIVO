/* ui/ua-toggle.js — переклад речення під поясненням (.ua-wrap):
   кнопка-перемикач і сам текст.

   el.update({ text, open }) — без text блок ховається цілком. */
(function () {
  "use strict";
  const UI = (window.NivoUI = window.NivoUI || {});
  let seq = 0;

  /** @param {{text?:string|null, open?:boolean, onToggle?:Function}} props
      onToggle(open) — новий стан після кліку користувача. */
  UI.createUaToggle = function ({ text = null, open = false, onToggle } = {}) {
    const el = document.createElement("div");
    el.className = "ua-wrap";

    const p = document.createElement("p");
    p.className = "ua-text";
    p.id = "ua-text-" + (++seq);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ua-toggle";
    btn.setAttribute("aria-controls", p.id);

    el.appendChild(btn);
    el.appendChild(p);

    function setOpen(v) {
      p.hidden = !v;
      btn.textContent = v ? "Сховати переклад" : "Переклад";
      btn.setAttribute("aria-expanded", String(v));
    }

    btn.addEventListener("click", () => {
      const v = p.hidden;   // згорнуто → розгортаємо, і навпаки
      setOpen(v);
      if (onToggle) onToggle(v);
    });

    el.update = next => {
      if (!next.text) { el.hidden = true; return; }
      p.textContent = next.text;
      setOpen(!!next.open);
      el.hidden = false;
    };

    el.update({ text, open });
    return el;
  };
})();
