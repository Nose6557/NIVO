import "../ui/category-bar.js";
import { frame, UI } from "./_frame.js";

export default {
  title: "Головна/CategoryBar",
  render: args => frame(UI().createCategoryBar(args), 640),
  args: { name: "Часи", accuracy: 0.76 },
  argTypes: { accuracy: { control: { type: "range", min: 0, max: 1, step: 0.01 } } }
};

/* Колір смуги — чотири пороги точності: <50%, 50%+, 70%+, 85%+. */
export const NoData = { args: { accuracy: null } };
export const Below50 = { args: { accuracy: 0.32 } };
export const From50 = { args: { accuracy: 0.58 } };
export const From70 = { args: { accuracy: 0.76 } };
export const From85 = { args: { accuracy: 0.93 } };
export const Zero = { args: { accuracy: 0 } };

export const Scale = {
  render: () => {
    const box = document.createElement("div");
    box.className = "temper-bars";
    [
      ["Артиклі", 0.9], ["Часи", 0.76], ["Прийменники", 0.58],
      ["Умовні речення", 0.32], ["Ідіоми", null]
    ].forEach(([name, accuracy]) => box.appendChild(UI().createCategoryBar({ name, accuracy })));
    return frame(box, 640);
  }
};
