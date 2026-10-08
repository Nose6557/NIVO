/* Розмітка, якої немає в ui/*.js, живе в index.html. Щоб stories не
   розходилися із сайтом, беремо її просто звідти: pick(selector) повертає
   копію справжнього вузла. Стани (класи, атрибути, тексти) story виставляє
   так само, як це робить app.js. */
import html from "virtual:nivo-markup";

const doc = new DOMParser().parseFromString(html, "text/html");

export function pick(selector) {
  const node = doc.querySelector(selector);
  if (!node) throw new Error("index.html: немає елемента " + selector);
  return document.importNode(node, true);
}

/* Екран цілком: секція .screen, одразу активна. */
export function screen(name) {
  const el = pick("#screen-" + name);
  el.classList.add("active");
  return el;
}

/* Як setMsg() в app.js. */
export function setMsg(el, text, type = "") {
  el.textContent = text;
  el.classList.remove("error", "success");
  if (type) el.classList.add(type);
}
