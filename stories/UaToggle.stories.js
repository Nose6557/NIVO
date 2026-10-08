import "../ui/ua-toggle.js";
import { frame, UI } from "./frame.js";

export default {
  title: "Гра/UaToggle",
  render: args => frame(UI().createUaToggle(args)),
  args: { text: "Вона вже закінчила звіт.", open: false },
  argTypes: { onToggle: { action: "toggle" } }
};

export const Collapsed = {};
export const Expanded = { args: { open: true } };
