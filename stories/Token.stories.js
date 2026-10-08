import "../ui/token.js";
import { UI } from "./_frame.js";

export default {
  title: "Гра/Token",
  render: args => UI().createToken(args),
  args: { text: "already", used: false },
  argTypes: { onClick: { action: "click" } }
};

export const Default = {};
export const Used = { args: { used: true } };
