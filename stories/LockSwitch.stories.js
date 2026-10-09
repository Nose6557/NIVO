import { pick } from "./markup.js";

function lockSwitch({ on, disabled }) {
  const el = pick("#level-lock");
  el.setAttribute("aria-checked", on ? "true" : "false");
  el.disabled = disabled;
  el.onclick = () => el.setAttribute("aria-checked", el.getAttribute("aria-checked") === "true" ? "false" : "true");
  return el;
}

export default {
  title: "Меню/LockSwitch",
  render: lockSwitch,
  args: { on: true, disabled: false }
};

export const On = {};
export const Off = { args: { on: false } };
export const Disabled = { args: { on: true, disabled: true } };
