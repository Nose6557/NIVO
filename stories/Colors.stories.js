import { rootTokens } from "./css-source.js";

/* Кольори — усе, що оголошено в :root у style.css, групами так, як вони там
   стоять. Значення читаються наживо: поміняєш колір у CSS — зміниться й тут. */

const h = (tag, style, text) => {
  const el = document.createElement(tag);
  if (style) el.style.cssText = style;
  if (text != null) el.textContent = text;
  return el;
};

// Будь-яке CSS-значення кольору → [r, g, b] через браузер.
function toRgb(value) {
  const probe = h("span", "display:none; color:" + value);
  document.body.appendChild(probe);
  const c = getComputedStyle(probe).color;
  probe.remove();
  const m = c.match(/[\d.]+/g);
  return m ? m.slice(0, 3).map(Number) : null;
}
const hex = rgb => "#" + rgb.map(v => Math.round(v).toString(16).padStart(2, "0")).join("");

function luminance([r, g, b]) {
  const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

// Назви груп — за першою змінною групи; коментар із CSS іде підписом.
const TITLES = [
  [/^--gray-/, "Нейтральна шкала — примітиви"],
  [/^--bg$/, "Ролі: фон, поверхні, текст"],
  [/^--red$/, "Системна палітра"],
  [/^--ok$/, "Стани: правильно / помилка"],
  [/-fg$/, "Колір тексту для станів"],
  [/^--lvl-/, "Рівні CEFR"]
];
const groupTitle = g => (TITLES.find(([re]) => re.test(g.tokens[0].name)) || [, "Інше"])[1];

function isColor(value) {
  return CSS.supports("color", value);
}

function render() {
  const root = getComputedStyle(document.documentElement);
  const resolved = name => root.getPropertyValue(name).trim();
  const bg = toRgb(resolved("--bg"));
  const surface = toRgb(resolved("--surface"));

  const page = h("div", "padding:32px; max-width:1100px; color:var(--text); font-family:'IBM Plex Sans',sans-serif");
  page.appendChild(h("h1", "font-size:28px; margin:0 0 6px", "Кольори"));
  page.appendChild(h("p", "margin:0 0 28px; color:var(--text-muted); font-size:14px; line-height:1.5",
    "Змінні з :root у style.css. Контраст — для тексту цього кольору на фоні сторінки (--bg) і на картці (--surface). " +
    "Для звичайного тексту потрібно щонайменше 4.5, для великого — 3."));

  const other = [];

  for (const group of rootTokens()) {
    const colorTokens = [];
    for (const t of group.tokens) {
      const val = resolved(t.name);
      if (/-rgb$/.test(t.name)) { colorTokens.push({ ...t, rgbTriplet: true, val }); continue; }
      if (isColor(val)) colorTokens.push({ ...t, val });
      else other.push({ ...t, val });
    }
    if (!colorTokens.length) continue;

    const sec = h("section", "margin-bottom:36px");
    sec.appendChild(h("h2", "font-size:16px; margin:0 0 4px; letter-spacing:0; font-family:'IBM Plex Sans',sans-serif; font-weight:600",
      groupTitle(group)));
    sec.appendChild(h("p", "margin:0 0 14px; font-size:13px; line-height:1.5; color:var(--text-muted); max-width:760px",
      group.note || ""));
    const grid = h("div", "display:grid; grid-template-columns:repeat(auto-fill,minmax(230px,1fr)); gap:12px");

    for (const t of colorTokens) {
      if (t.rgbTriplet) {
        // --lvl-a1-rgb і подібні: трійка для rgba(). Звіряємо з основним кольором.
        const baseName = t.name.replace(/-rgb$/, "");
        const base = toRgb(resolved(baseName));
        const own = t.val.split(",").map(Number);
        const same = base && own.every((v, i) => Math.abs(v - base[i]) <= 2);
        const card = h("div", "border:1px solid var(--border); border-radius:14px; padding:10px 12px; display:flex; gap:10px; align-items:center");
        card.appendChild(h("div", `width:28px; height:28px; border-radius:8px; flex-shrink:0; background:rgb(${t.val})`));
        const txt = h("div", "font-size:12px; line-height:1.45; min-width:0");
        txt.appendChild(h("div", "font-family:'IBM Plex Mono',ui-monospace,monospace; color:var(--text)", t.name));
        txt.appendChild(h("div", "color:var(--text-muted)", "rgb(" + t.val + ")"));
        if (!same && base) txt.appendChild(h("div", "color:var(--orange)",
          `≠ ${baseName} ${hex(base)} (${base.join(",")})`));
        card.appendChild(txt);
        grid.appendChild(card);
        continue;
      }

      const rgb = toRgb(t.val);
      const card = h("div", "border:1px solid var(--border); border-radius:14px; overflow:hidden; background:var(--fill)");
      card.appendChild(h("div", `height:64px; background:${t.val}; border-bottom:1px solid var(--border)`));
      const body = h("div", "padding:10px 12px; font-size:12px; line-height:1.5");
      body.appendChild(h("div", "font-family:'IBM Plex Mono',ui-monospace,monospace; font-size:13px; color:var(--text)", t.name));
      const decl = /^var\(/.test(t.value) ? `${t.value} → ${hex(rgb)}` : hex(rgb);
      body.appendChild(h("div", "color:var(--text-muted)", decl));
      const cBg = contrast(rgb, bg), cSf = contrast(rgb, surface);
      const mark = c => c >= 4.5 ? "" : c >= 3 ? " (лише великий текст)" : " ✕";
      body.appendChild(h("div", "color:var(--text-muted)",
        `на фоні ${cBg.toFixed(1)}${mark(cBg)} · на картці ${cSf.toFixed(1)}${mark(cSf)}`));
      card.appendChild(body);
      grid.appendChild(card);
    }
    sec.appendChild(grid);
    page.appendChild(sec);
  }

  if (other.length) {
    const sec = h("section", "margin-bottom:24px");
    sec.appendChild(h("h2", "font-size:16px; margin:0 0 10px; font-family:'IBM Plex Sans',sans-serif; font-weight:600; letter-spacing:0", "Інші змінні"));
    other.forEach(t => sec.appendChild(h("div",
      "font-family:'IBM Plex Mono',ui-monospace,monospace; font-size:13px; color:var(--text-muted); padding:3px 0",
      `${t.name}: ${t.val}`)));
    page.appendChild(sec);
  }
  return page;
}

export default {
  title: "Основи/Кольори",
  render,
  parameters: { layout: "fullscreen" }
};

export const Palette = { name: "Палітра" };
