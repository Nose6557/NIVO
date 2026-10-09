import { frame } from "./frame.js";
import { setMsg } from "./markup.js";

function note({ text, dim, type }) {
  const p = document.createElement("p");
  p.className = "note" + (dim ? " dim" : "");
  setMsg(p, text, type);
  return p;
}

export default {
  title: "Основа/Note",
  render: args => frame(note(args), 400),
  args: { text: "Без акаунта прогрес зберігається лише в цьому браузері.", dim: false, type: "" },
  argTypes: { type: { control: "inline-radio", options: ["", "error", "success"] } }
};

export const Default = {};
export const Dim = { args: { dim: true } };
export const ErrorNote = { name: "Error", args: { text: "Невірний email або пароль.", type: "error" } };
export const SuccessNote = { name: "Success", args: { text: "Лист надіслано — перевірте пошту.", type: "success" } };
