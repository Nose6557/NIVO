import "../ui/ua-toggle.js";
import "../ui/feedback.js";
import { frame, UI } from "./_frame.js";

const EXPLAIN = "Present Perfect: дія завершилась, а результат важливий зараз. «Already» стоїть між have/has і третьою формою дієслова.";

export default {
  title: "Гра/Feedback",
  render: args => frame(UI().createFeedback(args)),
  args: {
    correct: true,
    answer: "has already finished",
    explain: EXPLAIN,
    ua: "Вона вже закінчила звіт.",
    uaOpen: false
  },
  argTypes: { onUaToggle: { action: "uaToggle" } }
};

export const Correct = {};
export const Incorrect = { args: { correct: false } };
export const TranslationOpen = { args: { uaOpen: true } };
export const NoTranslation = { args: { ua: null } };
