import "../ui/result-row.js";
import { frame, UI } from "./_frame.js";

export default {
  title: "Підсумок/ResultRow",
  render: args => frame(UI().createResultRow(args)),
  args: { label: "Часи", value: "4/5" }
};

export const Default = {};

export const Breakdown = {
  render: () => {
    const box = document.createElement("div");
    box.className = "res-breakdown";
    [["Часи", "4/5"], ["Артиклі", "3/3"], ["Прийменники", "1/4"], ["Лексика", "3/3"]]
      .forEach(([label, value]) => box.appendChild(UI().createResultRow({ label, value })));
    return frame(box);
  }
};
