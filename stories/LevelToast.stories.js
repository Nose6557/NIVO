import { pick } from "./markup.js";

/* Тексти — ті самі, що в Onboard.notifyDown() і в обробнику перемикача
   «Автоматичний рівень» (app.js). У застосунку тост сам зникає за 5 с. */
function toast({ weakLabel, switchedTo }) {
  const el = pick("#level-toast");
  el.textContent = switchedTo
    ? `Рівень змінено на ${switchedTo} — за оцінкою додатка`
    : weakLabel
    ? `Підбираємо завдання простіше — попрацюємо над темою «${weakLabel}»`
    : "Трохи спростимо завдання, щоб закріпити основу";
  el.hidden = false;
  return el;
}

export default {
  title: "Модалки/LevelToast",
  parameters: { layout: "fullscreen" },
  render: toast,
  args: { weakLabel: "Third conditional" }
};

export const WithTopic = {};
export const Generic = { args: { weakLabel: "" } };
/* Ручний → авто, коли оцінка додатка ≠ обраному рівню. */
export const SwitchedToEstimate = { args: { switchedTo: "C1" } };
