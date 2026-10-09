import { pick } from "./markup.js";

const REPORT = `NIVO — звіт про прогрес
Дата: 2026-10-08
Сесій: 63 | Відповідей: 888
Загальна точність: 76%

ЗА КАТЕГОРІЯМИ:
- Артиклі: 29/32 (91%), сер. час 6.1с
- Часи: 52/69 (75%), сер. час 12.4с

ЗА РІВНЯМИ CEFR:
- A2: 61/63 (97%), сер. час 5.7с
- B1: 161/196 (82%), сер. час 9.8с
- B2: 304/403 (75%), сер. час 16.2с

СЛАБКІ МІСЦЯ (помилки / спроби):
- Third conditional [Умовні речення]: 4/6`;

export default { title: "Модалки/ExportModal", parameters: { layout: "fullscreen" } };

export const Open = {
  render: () => {
    const el = pick("#export-modal");
    el.hidden = false;
    el.querySelector(".export-box").value = REPORT;
    return el;
  }
};
