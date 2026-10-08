import { frame } from "./frame.js";
import { pick } from "./markup.js";

function segmented(active) {
  const el = pick("#screen-auth .segmented");
  const tabs = [...el.querySelectorAll(".seg")];
  const select = name => tabs.forEach(t => {
    const on = t.dataset.authtab === name;
    t.classList.toggle("active", on);
    t.setAttribute("aria-selected", String(on));
  });
  tabs.forEach(t => { t.onclick = () => select(t.dataset.authtab); });
  select(active);
  return el;
}

export default { title: "Основа/Segmented" };

export const SignIn = { render: () => frame(segmented("in"), 400) };
export const SignUp = { render: () => frame(segmented("up"), 400) };
