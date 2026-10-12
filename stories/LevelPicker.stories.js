import { frame } from "./frame.js";
import { pick } from "./markup.js";

/* Обраний рівень — заливка, оцінка додатка — точка (як renderLevelMenu в app.js).
   Коли вони збігаються, точки немає. */
function picker({ level, estimate }) {
  const el = pick("#level-picker");
  el.hidden = false;
  const select = lv => el.querySelectorAll("button").forEach(b => {
    b.classList.toggle("active", b.dataset.lv === lv);
    b.classList.toggle("est", !!estimate && b.dataset.lv === estimate && estimate !== lv);
  });
  el.onclick = e => { const b = e.target.closest("button[data-lv]"); if (b) select(b.dataset.lv); };
  select(level);
  return frame(el, 288);
}

export default {
  title: "Меню/LevelPicker",
  render: picker,
  args: { level: "B2", estimate: null },
  argTypes: {
    level: { control: "inline-radio", options: [null, "A1", "A2", "B1", "B2", "C1", "C2"] },
    estimate: { control: "inline-radio", options: [null, "A1", "A2", "B1", "B2", "C1", "C2"] }
  }
};

export const Selected = {};
export const EstimateHigher = { args: { estimate: "C1" } };
export const EstimateLower = { args: { estimate: "B1" } };
export const NothingSelected = { args: { level: null } };
