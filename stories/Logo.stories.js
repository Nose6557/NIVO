import { pick } from "./markup.js";

export default { title: "Основа/Logo" };

/* Смужки логотипа «виростають» при появі — перезавантаж story, щоб побачити. */
export const Mark = { render: () => pick("#screen-auth .mark") };
export const Topbar = { render: () => pick("#screen-home .brand-sm") };
