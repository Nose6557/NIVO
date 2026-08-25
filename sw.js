/* Nivo service worker — офлайн-оболонка + інсталяція PWA.
   Стратегії:
   - навігація (HTML)       → network-first, фолбек на кешований index.html
   - banks/*.json           → network-first (щоб BANK_VERSION завжди підтягував свіже), фолбек на кеш
   - інші свої статики       → stale-while-revalidate (швидко + оновлюється у фоні)
   - крос-домен (Supabase,   → не перехоплюємо, віддаємо браузеру
     jsDelivr, Umami, шрифти)
   Бампни CACHE при кожному релізі оболонки — старий кеш видалиться сам. */
const CACHE = "nivo-v1";

const SHELL = [
  ".",
  "index.html",
  "style.css",
  "app.js",
  "store.js",
  "config.js",
  "favicon/icon.svg",
  "favicon/icon-192.png",
  "favicon/icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Чужі домени лишаємо браузеру (Supabase / CDN / Umami / Google Fonts).
  if (url.origin !== self.location.origin) return;

  // Навігація → network-first, офлайн-фолбек на оболонку.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => { caches.open(CACHE).then((c) => c.put("index.html", res.clone())); return res; })
        .catch(() => caches.match("index.html").then((r) => r || caches.match(".")))
    );
    return;
  }

  // Питання → network-first, фолбек на кеш (працює офлайн після першого завантаження).
  if (url.pathname.includes("/banks/")) {
    e.respondWith(
      fetch(req)
        .then((res) => { caches.open(CACHE).then((c) => c.put(req, res.clone())); return res; })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Решта своїх статик → stale-while-revalidate.
  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => { caches.open(CACHE).then((c) => c.put(req, res.clone())); return res; })
        .catch(() => cached);
      return cached || network;
    })
  );
});
