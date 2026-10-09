import "../ui/token.js";
import "../ui/order-board.js";
import { frame, UI } from "./frame.js";

const TOKENS = ["finished", "has", "she", "report", "already", "the"];

export default {
  title: "Гра/OrderBoard",
  render: args => frame(UI().createOrderBoard(args)),
  args: { tokens: TOKENS, picked: [], result: null },
  argTypes: { result: { control: "inline-radio", options: [null, "ok", "no"] } }
};

export const Empty = {};
export const Partial = { args: { picked: ["she", "has", "already"] } };
export const Correct = {
  args: { picked: ["she", "has", "already", "finished", "the", "report"], result: "ok" }
};
export const Incorrect = {
  args: { picked: ["she", "already", "has", "finished", "the", "report"], result: "no" }
};
