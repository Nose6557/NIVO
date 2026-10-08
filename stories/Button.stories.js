import { frame } from "./frame.js";

/* Кнопки — це класи на <button>, окремого компонента немає. */
function button({ label, variant, size, loading, disabled, onClick }) {
  const b = document.createElement("button");
  b.className = ["btn", variant, size].filter(Boolean).join(" ");
  b.textContent = label;
  if (loading) { b.classList.add("loading"); b.disabled = true; }   // як setBtnLoading()
  if (disabled) b.disabled = true;
  if (onClick) b.onclick = onClick;
  return b;
}

export default {
  title: "Основа/Button",
  render: args => frame(button(args), 360),
  args: { label: "Почати сесію", variant: "primary", size: "", loading: false, disabled: false },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "ghost"] },
    size: { control: "inline-radio", options: ["", "big", "small"] },
    onClick: { action: "click" }
  }
};

export const Primary = {};
export const PrimaryBig = { args: { size: "big" } };
export const PrimaryLoading = { args: { label: "Завершити", loading: true } };
export const Ghost = { args: { label: "Тренувати слабкі місця", variant: "ghost" } };
export const GhostSmall = { args: { label: "Вийти", variant: "ghost", size: "small" } };
export const GhostLoading = { args: { label: "Копіювати", variant: "ghost", loading: true } };

export const Link = {
  render: () => {
    const b = document.createElement("button");
    b.className = "link-btn";
    b.textContent = "Забули пароль?";
    return b;
  }
};
