/* Читає style.css як текст, щоб розділ «Основи» показував те, що реально лежить
   у CSS, а не копію, яка застаріє. Імпорт ?raw дає Vite: сам файл не змінюється. */
import css from "../style.css?raw";
import markup from "virtual:nivo-markup";

const stripComments = s => s.replace(/\/\*[\s\S]*?\*\//g, "");

/* ---------- кольори з :root ---------- */

// Групи — блоки, розділені порожнім рядком; назва групи — перший рядок
// коментаря над блоком, якщо він є.
export function rootTokens() {
  const m = css.match(/:root\s*\{([\s\S]*?)\n\}/);
  if (!m) return [];
  const groups = [];
  let cur = null, pendingTitle = null, inComment = false, commentFirst = null;

  for (const raw of m[1].split("\n")) {
    const line = raw.trim();
    if (inComment) {
      commentFirst += " " + line.replace(/\s*\*\/.*$/, "");
      if (line.includes("*/")) { inComment = false; pendingTitle = commentFirst; }
      continue;
    }
    if (line.startsWith("/*")) {
      commentFirst = line.replace(/^\/\*\s*/, "").replace(/\s*\*\/$/, "");
      if (line.includes("*/")) pendingTitle = commentFirst; else inComment = true;
      cur = null;
      continue;
    }
    if (!line) { cur = null; continue; }
    const decls = [...line.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)];
    if (!decls.length) continue;
    if (!cur) { cur = { note: pendingTitle, tokens: [] }; groups.push(cur); pendingTitle = null; }
    decls.forEach(([, name, value]) => cur.tokens.push({ name, value: value.trim() }));
  }
  return groups;
}

/* ---------- текстові стилі з усіх правил ---------- */

// Плаский список правил: { selector, decls, media }. Вкладеність — лише @media,
// у style.css іншої немає.
function rules() {
  const src = stripComments(css);
  const out = [];
  let i = 0;
  const parseBlock = (media) => {
    while (i < src.length) {
      const open = src.indexOf("{", i);
      const close = src.indexOf("}", i);
      if (close !== -1 && (open === -1 || close < open)) { i = close + 1; return; }
      if (open === -1) { i = src.length; return; }
      const head = src.slice(i, open).trim();
      i = open + 1;
      if (head.startsWith("@media") || head.startsWith("@supports")) { parseBlock(head); continue; }
      if (head.startsWith("@keyframes")) { skipBlock(); continue; }
      const end = src.indexOf("}", i);
      const body = src.slice(i, end);
      i = end + 1;
      const decls = {};
      body.split(";").forEach(d => {
        const k = d.indexOf(":");
        if (k > 0) decls[d.slice(0, k).trim()] = d.slice(k + 1).trim();
      });
      out.push({ selector: head.replace(/\s+/g, " "), decls, media });
    }
  };
  const skipBlock = () => {
    let depth = 1;
    while (i < src.length && depth) {
      if (src[i] === "{") depth++;
      else if (src[i] === "}") depth--;
      i++;
    }
  };
  parseBlock(null);
  return out;
}

const HEADING = /(^|[\s,>+~])h[1-3](?=$|[\s,.:#\[>+~])/;

// Справжня розмітка index.html: щоб дізнатися, чи селектор описує заголовок
// (h1–h3 отримують Unbounded 700 від спільного правила), дивимося, на який тег
// він потрапляє. Елементи, які створює JS, тут не знайдуться — тоді лише за селектором.
const DOC = new DOMParser().parseFromString(markup, "text/html");
function hitsHeading(selector) {
  if (HEADING.test(selector)) return true;
  for (const part of selector.split(",")) {
    const clean = part.replace(/::?[\w-]+(\([^)]*\))?/g, "").trim();
    if (!clean) continue;
    try {
      const el = DOC.querySelector(clean);
      if (el && /^H[1-3]$/.test(el.tagName)) return true;
    } catch { /* селектор, який DOMParser не розуміє */ }
  }
  return false;
}

// Кожне правило з font-size — один «текстовий стиль у коді». Шрифт і вага, яких
// правило не задає, беремо з того, що воно успадкує: заголовки h1–h3 — Unbounded 700,
// решта — IBM Plex Sans 400 з body.
export function textStyles() {
  return rules()
    .filter(r => r.decls["font-size"])
    .map(r => {
      const d = r.decls;
      const isHeading = hitsHeading(r.selector);
      const fam = d["font-family"];
      return {
        selector: r.selector,
        media: r.media,
        size: d["font-size"],
        family: fam || (isHeading ? "'Unbounded',sans-serif" : "'IBM Plex Sans',system-ui,sans-serif"),
        familyInherited: !fam,
        weight: d["font-weight"] || (isHeading ? "700" : "400"),
        weightInherited: !d["font-weight"],
        lineHeight: d["line-height"] || null,
        letterSpacing: d["letter-spacing"] || null,
        transform: d["text-transform"] || null
      };
    });
}

// Перший шрифт зі стеку без лапок — для підпису.
export const familyName = f => f.split(",")[0].replace(/['"]/g, "").trim();

// Розмір у px для сортування; clamp(a, b, c) — за максимумом.
export function sizePx(size) {
  const nums = [...String(size).matchAll(/([\d.]+)px/g)].map(m => +m[1]);
  return nums.length ? Math.max(...nums) : 0;
}
