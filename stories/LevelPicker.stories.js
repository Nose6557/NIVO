import { frame } from "./frame.js";
import { pick } from "./markup.js";

function picker({ level }) {
  const el = pick("#level-picker");
  el.hidden = false;
  const select = lv => el.querySelectorAll("button").forEach(b => b.classList.toggle("active", b.dataset.lv === lv));
  el.onclick = e => { const b = e.target.closest("button[data-lv]"); if (b) select(b.dataset.lv); };
  select(level);
  return frame(el, 288);
}

export default {
  title: "Меню/LevelPicker",
  render: picker,
  args: { level: "B2" },
  argTypes: { level: { control: "inline-radio", options: [null, "A1", "A2", "B1", "B2", "C1", "C2"] } }
};

export const Selected = {};
export const NothingSelected = { args: { level: null } };
