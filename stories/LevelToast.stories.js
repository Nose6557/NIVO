import { pick } from "./markup.js";

/* Тексти — ті самі, що в Onboard.notifyDown(). У застосунку тост сам зникає за 5 с. */
function toast({ weakLabel }) {
  const el = pick("#level-toast");
  el.textContent = weakLabel
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
