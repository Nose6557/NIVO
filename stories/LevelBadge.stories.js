import "../ui/level-badge.js";
import { UI } from "./_frame.js";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

/* У застосунку бейдж сидить на кнопці аватара — показуємо в тому ж оточенні. */
function onAvatar(level) {
  const btn = document.createElement("button");
  btn.className = "avatar-btn";
  if (level) btn.dataset.level = level;
  const initial = document.createElement("span");
  initial.textContent = "N";
  const wrap = document.createElement("span");
  wrap.className = "level-badge-wrap";
  wrap.appendChild(UI().createLevelBadge({ level }));
  btn.append(initial, wrap);
  return btn;
}

export default {
  title: "Рівень/LevelBadge",
  render: args => UI().createLevelBadge(args),
  args: { level: "B1" },
  argTypes: { level: { control: "inline-radio", options: [null, ...LEVELS] } }
};

export const A1 = { args: { level: "A1" } };
export const A2 = { args: { level: "A2" } };
export const B1 = { args: { level: "B1" } };
export const B2 = { args: { level: "B2" } };
export const C1 = { args: { level: "C1" } };
export const C2 = { args: { level: "C2" } };

export const OnAvatar = { render: args => onAvatar(args.level) };

export const AllLevelsOnAvatar = {
  render: () => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.gap = "16px";
    LEVELS.forEach(lv => row.appendChild(onAvatar(lv)));
    return row;
  }
};

/* Рівень ще не визначено — бейджа немає. */
export const NoLevelOnAvatar = { render: () => onAvatar(null) };
