import "../ui/progress.js";
import { frame, UI } from "./_frame.js";

export default {
  title: "Гра/Progress",
  render: args => frame(UI().createProgress(args), 640),
  args: {
    value: 0.4,
    count: "7 / 15",
    streak: "3 правильних поспіль",
    actionLabel: "Вийти"
  },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 1, step: 0.01 } },
    onAction: { action: "action" }
  }
};

export const Start = { args: { value: 0, count: "1 / 15", streak: "0 правильних поспіль" } };
export const Middle = {};
export const Complete = { args: { value: 1, count: "15 / 15", streak: "12 правильних поспіль" } };

/* Тест рівня: без рядка серії, інша дія праворуч. */
export const PlacementTest = {
  args: { value: 0.25, count: "5 / 16", streak: null, actionLabel: "Пропустити тест" }
};
