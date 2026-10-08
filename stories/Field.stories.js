import { frame } from "./frame.js";
import { pick } from "./markup.js";

function emailField({ value = "", error = "" } = {}) {
  const el = pick('#screen-auth .field[data-field="email"]');
  el.querySelector("input").value = value;
  el.querySelector(".field-error").textContent = error;
  el.classList.toggle("has-error", !!error);
  return el;
}

function passField({ value = "", error = "", visible = false } = {}) {
  const el = pick('#screen-auth .field[data-field="pass"]');
  const inp = el.querySelector("input");
  const btn = el.querySelector(".pw-toggle");
  const setVisible = on => {
    inp.type = on ? "text" : "password";
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.setAttribute("aria-label", on ? "Сховати пароль" : "Показати пароль");
  };
  inp.value = value;
  setVisible(visible);
  btn.onclick = () => setVisible(inp.type === "password");
  el.querySelector(".field-error").textContent = error;
  el.classList.toggle("has-error", !!error);
  return el;
}

export default { title: "Основа/Field" };

export const Empty = { render: () => frame(emailField(), 400) };
export const Filled = { render: () => frame(emailField({ value: "you@example.com" }), 400) };
export const WithError = {
  render: () => frame(emailField({ value: "you@example", error: "Схоже, це не email" }), 400)
};
export const Password = { render: () => frame(passField({ value: "secret123" }), 400) };
export const PasswordVisible = {
  render: () => frame(passField({ value: "secret123", visible: true }), 400)
};
export const PasswordError = {
  render: () => frame(passField({ value: "123", error: "Пароль має бути щонайменше 6 символів." }), 400)
};
