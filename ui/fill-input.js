/* ui/fill-input.js — поле для завдань «впиши слово» (.fill-input). */
(function () {
  "use strict";
  const UI = (window.NivoUI = window.NivoUI || {});

  /** @param {{value?:string, disabled?:boolean, onSubmit?:Function}} props
      onSubmit викликається на Enter. */
  UI.createFillInput = function ({ value = "", disabled = false, onSubmit } = {}) {
    const inp = document.createElement("input");
    inp.className = "fill-input";
    inp.placeholder = "введіть слово і натисніть Enter";
    inp.autocomplete = "off";
    inp.value = value;
    inp.disabled = disabled;
    inp.addEventListener("keydown", e => {
      if (e.key === "Enter") { e.preventDefault(); if (onSubmit) onSubmit(inp); }
    });
    return inp;
  };
})();
