import "../ui/level-badge.js";
import { UI } from "./frame.js";
import { pick } from "./markup.js";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

/* Меню акаунта: аватар із бейджем і дропдаун. Стан виставляємо так само,
   як renderHome / renderLevelBadge / renderLevelMenu в app.js. */
function menu({ email, level, auto, estimate, open }) {
  const el = pick("#screen-home .avatar-menu");
  const btn = el.querySelector(".avatar-btn");
  const dd = el.querySelector(".avatar-dropdown");

  el.querySelector("#who").textContent = email || "гостьовий режим";
  el.querySelector("#avatar-initial").textContent = email ? email[0].toUpperCase() : "?";
  UI().updateLevelBadge(el.querySelector(".level-badge"), level);
  if (level) btn.dataset.level = level;

  const picker = el.querySelector(".level-picker");
  picker.hidden = auto;
  picker.querySelectorAll("button").forEach(b => b.classList.toggle("active", b.dataset.lv === level));

  const sw = el.querySelector(".lock-switch");
  sw.setAttribute("aria-checked", auto ? "true" : "false");
  sw.disabled = !level;

  el.querySelector("#lock-hint").textContent = auto
    ? "Рівень підлаштовується під твої відповіді."
    : "Обери рівень для запитань.";

  const est = el.querySelector(".level-est");
  if (!level) {
    est.textContent = "";
  } else if (!estimate) {
    est.textContent = "Ще мало свіжих відповідей, щоб оцінити рівень.";
  } else {
    est.dataset.level = estimate;
    if (estimate === level) {
      est.innerHTML = `Оцінка додатка: <b>${estimate}</b> — ти на своєму рівні.`;
    } else {
      const higher = LEVELS.indexOf(estimate) > LEVELS.indexOf(level);
      est.innerHTML = auto
        ? `Оцінка додатка: <b>${estimate}</b>.`
        : `Оцінка додатка: <b>${estimate}</b> — це ${higher ? "вище" : "нижче"} за обраний.`;
    }
  }

  dd.hidden = !open;
  btn.setAttribute("aria-expanded", String(open));
  btn.onclick = () => {
    dd.hidden = !dd.hidden;
    btn.setAttribute("aria-expanded", String(!dd.hidden));
  };

  // дропдаун висить під аватаром праворуч — лишаємо йому місце
  const box = document.createElement("div");
  box.style.cssText = "width:360px; max-width:100%; min-height:460px; display:flex; justify-content:flex-end; align-items:flex-start";
  box.appendChild(el);
  return box;
}

export default {
  title: "Меню/LevelMenu",
  render: menu,
  args: { email: "nivo@example.com", level: "B2", auto: true, estimate: "B2", open: true },
  argTypes: {
    level: { control: "inline-radio", options: [null, ...LEVELS] },
    estimate: { control: "inline-radio", options: [null, ...LEVELS] }
  }
};

export const Closed = { args: { open: false } };
export const AutoOnLevel = {};
export const AutoEstimateDiffers = { args: { estimate: "C1" } };
export const AutoNoEstimate = { args: { estimate: null } };
export const ManualPicker = { args: { auto: false } };
export const ManualEstimateLower = { args: { auto: false, level: "C1", estimate: "B2" } };
export const ManualEstimateHigher = { args: { auto: false, level: "B1", estimate: "B2" } };
export const Guest = { args: { email: null } };
export const NoLevelYet = { args: { level: null, estimate: null } };
