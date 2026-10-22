import { textStyles, familyName, sizePx } from "./css-source.js";

/* Типографіка — усі правила style.css, що задають font-size, згруповані
   за розміром. Окремих текстових стилів (токенів) у проєкті поки немає:
   ця сторінка показує, що є насправді, щоб з цього можна було зібрати шкалу. */

const h = (tag, style, text) => {
  const el = document.createElement(tag);
  if (style) el.style.cssText = style;
  if (text != null) el.textContent = text;
  return el;
};

const SAMPLE = "Англійська рівень за рівнем · Level up your English";

function render() {
  const styles = textStyles();
  const bySize = new Map();
  styles.forEach(s => {
    if (!bySize.has(s.size)) bySize.set(s.size, []);
    bySize.get(s.size).push(s);
  });
  const sizes = [...bySize.keys()].sort((a, b) => sizePx(b) - sizePx(a));

  const page = h("div", "padding:32px; max-width:1100px; color:var(--text); font-family:'IBM Plex Sans',sans-serif");
  page.appendChild(h("h1", "font-size:28px; margin:0 0 6px", "Типографіка"));
  page.appendChild(h("p", "margin:0 0 8px; color:var(--text-muted); font-size:14px; line-height:1.5",
    `У style.css ${styles.length} правил задають розмір тексту, різних розмірів — ${sizes.length}. ` +
    "Нижче кожен розмір з усіма варіантами шрифту й ваги та переліком селекторів, де він використаний."));
  page.appendChild(h("p", "margin:0 0 32px; color:var(--text-muted); font-size:13px; line-height:1.5",
    "Позначка «успадк.» — правило саме шрифт чи вагу не задає, тут показано те, що воно отримає від body або h1–h3."));

  for (const size of sizes) {
    const list = bySize.get(size);
    const sec = h("section", "border-top:1px solid var(--border); padding:20px 0 8px");
    const head = h("div", "display:flex; align-items:baseline; gap:12px; margin-bottom:12px; flex-wrap:wrap");
    head.appendChild(h("span", "font-family:'IBM Plex Mono',ui-monospace,monospace; font-size:15px; color:var(--text); font-weight:600", size));
    head.appendChild(h("span", "font-size:13px; color:var(--text-muted)",
      `${list.length} ${list.length === 1 ? "правило" : list.length < 5 ? "правила" : "правил"}`));
    sec.appendChild(head);

    // Однакові комбінації (шрифт, вага, регістр, трекінг) показуємо одним зразком.
    const combos = new Map();
    list.forEach(s => {
      const key = [familyName(s.family), s.weight, s.transform || "", s.letterSpacing || "", s.lineHeight || ""].join("|");
      if (!combos.has(key)) combos.set(key, { s, selectors: [] });
      combos.get(key).selectors.push(s.selector + (s.media ? `  @${s.media.replace(/^@media\s*/, "")}` : ""));
    });

    for (const { s, selectors } of combos.values()) {
      const row = h("div", "display:grid; grid-template-columns:minmax(0,1fr) 280px; gap:20px; padding:10px 0 14px; align-items:start");
      const sample = h("div", [
        `font-size:${s.size}`,
        `font-family:${s.family}`,
        `font-weight:${s.weight}`,
        s.lineHeight ? `line-height:${s.lineHeight}` : "line-height:1.3",
        s.letterSpacing ? `letter-spacing:${s.letterSpacing}` : "",
        s.transform ? `text-transform:${s.transform}` : "",
        "overflow-wrap:anywhere"
      ].filter(Boolean).join(";"), SAMPLE);
      row.appendChild(sample);

      const meta = h("div", "font-size:12px; line-height:1.55; color:var(--text-muted)");
      const spec = [
        familyName(s.family) + (s.familyInherited ? " (успадк.)" : ""),
        s.weight + (s.weightInherited ? " (успадк.)" : ""),
        s.lineHeight && "line-height " + s.lineHeight,
        s.letterSpacing && "трекінг " + s.letterSpacing,
        s.transform
      ].filter(Boolean).join(" · ");
      meta.appendChild(h("div", "color:var(--text); margin-bottom:4px", spec));
      selectors.forEach(sel => meta.appendChild(h("div",
        "font-family:'IBM Plex Mono',ui-monospace,monospace; overflow-wrap:anywhere", sel)));
      row.appendChild(meta);
      sec.appendChild(row);
    }
    page.appendChild(sec);
  }
  return page;
}

export default {
  title: "Основи/Типографіка",
  render,
  parameters: { layout: "fullscreen" }
};

export const InCode = { name: "Розміри в коді" };
