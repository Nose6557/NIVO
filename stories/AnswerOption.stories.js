import "../ui/answer-option.js";
import { frame, UI } from "./_frame.js";

export default {
  title: "Гра/AnswerOption",
  render: args => frame(UI().createAnswerOption(args)),
  args: { text: "have been working", state: null, disabled: false },
  argTypes: {
    state: { control: "inline-radio", options: [null, "right", "wrong"] },
    onClick: { action: "click" }
  }
};

export const Default = {};
export const Right = { args: { state: "right", disabled: true } };
export const Wrong = { args: { state: "wrong", disabled: true } };
export const Disabled = { args: { disabled: true } };

/* Як у грі після відповіді: правильний варіант, обраний хибний і решта вимкнених. */
export const AnsweredGroup = {
  render: () => {
    const box = document.createElement("div");
    [
      { text: "has worked", state: "wrong", disabled: true },
      { text: "have been working", state: "right", disabled: true },
      { text: "am working", disabled: true },
      { text: "worked", disabled: true }
    ].forEach(o => box.appendChild(UI().createAnswerOption(o)));
    return frame(box);
  }
};
