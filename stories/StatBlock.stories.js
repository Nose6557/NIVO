import { frame } from "./frame.js";
import { pick } from "./markup.js";

function stats({ sessions, answers, accuracy, streak }) {
  const el = pick("#screen-home .stat-block");
  el.querySelector("#s-sessions").textContent = sessions;
  el.querySelector("#s-answers").textContent = answers;
  el.querySelector("#s-acc").textContent = accuracy;
  el.querySelector("#s-streak").textContent = streak;
  return frame(el, 640);
}

export default {
  title: "Головна/StatBlock",
  render: stats,
  args: { sessions: 63, answers: 888, accuracy: "76%", streak: 33 }
};

export const WithData = {};
export const NewUser = { args: { sessions: 0, answers: 0, accuracy: "—", streak: 0 } };
