import "../ui/fill-input.js";
import { frame, UI } from "./_frame.js";

export default {
  title: "Гра/FillInput",
  render: args => frame(UI().createFillInput(args)),
  args: { value: "", disabled: false },
  argTypes: { onSubmit: { action: "submit" } }
};

export const Empty = {};
export const Filled = { args: { value: "went" } };
export const Disabled = { args: { value: "went", disabled: true } };
