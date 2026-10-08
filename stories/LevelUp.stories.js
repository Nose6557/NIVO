import "../onboard.js";
import { pick } from "./markup.js";

const LEVELS = ["A2", "B1", "B2", "C1", "C2"];
const PREV = { A2: "A1", B1: "A2", B2: "B1", C1: "B2", C2: "C1" };

/* Справжній Onboard.celebrate(): картка в кольорі рівня й салют на canvas.
   Салюту немає, якщо в системі ввімкнено «зменшити рух». */
export default {
  title: "Модалки/LevelUp",
  parameters: { layout: "fullscreen" },
  render: () => pick("#level-up"),
  play: async ({ args }) => window.Onboard.celebrate({ from: PREV[args.to], to: args.to, dir: "up" }),
  args: { to: "B2" },
  argTypes: { to: { control: "inline-radio", options: LEVELS } }
};

export const ToA2 = { args: { to: "A2" } };
export const ToB1 = { args: { to: "B1" } };
export const ToB2 = { args: { to: "B2" } };
export const ToC1 = { args: { to: "C1" } };
export const ToC2 = { args: { to: "C2" } };
