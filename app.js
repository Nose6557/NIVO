/* app.js — логіка гри Wordforge */

const CAT_UA = {
  "articles": "Артиклі",
  "tenses": "Часи",
  "prepositions": "Прийменники",
  "phrasal verbs": "Фразові дієслова",
  "conditionals": "Умовні речення",
  "vocabulary": "Лексика",
  "idioms": "Ідіоми",
  "word order": "Порядок слів"
};

const SESSION_LEN = 15;

let BANK = [];
let queue = [];
let idx = 0;
let session = null;
let answersLog = [];
let streak = 0;
let qStart = 0;

const $ = id => document.getElementById(id);

/* ---------- навігація між екранами ---------- */
function show(name) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  $("screen-" + name).classList.add("active");
  window.scrollTo(0, 0);
}

/* ---------- завантаження питань ---------- */
async function loadBank() {
  const res = await fetch("questions.json");
  const json = await res.json();
  BANK = json.questions;
}

/* ---------- вибір питань ---------- */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQueue(weak) {
  // Пріоритет тим питанням, де частка помилок вища.
  const errRate = {};
  (weak || []).forEach(w => {
    if (w.attempts > 0) errRate[w.item_key] = w.errors / w.attempts;
  });
  const scored = BANK.map(q => ({
    q,
    weight: (errRate[q.item] !== undefined ? errRate[q.item] : 0.35) + Math.random() * 0.5
  }));
  scored.sort((a, b) => b.weight - a.weight);
  return scored.slice(0, SESSION_LEN).map(s => s.q);
}

function buildWeakQueue(weak) {
  const problem = (weak || [])
    .filter(w => w.attempts >= 2 && w.errors / w.attempts > 0.3)
    .map(w => w.item_key);
  const pool = BANK.filter(q => problem.includes(q.item));
  if (pool.length < 5) return null;
  return shuffle(pool).slice(0, SESSION_LEN);
}

/* ---------- запуск сесії ---------- */
async function startSession(weakOnly) {
  const stats = await Store.getStats();
  let q = weakOnly ? buildWeakQueue(stats.weak) : buildQueue(stats.weak);
  if (!q) {
    alert("Поки замало даних про слабкі місця — зіграй кілька звичайних сесій.");
    return;
  }
  queue = q;
  idx = 0;
  streak = 0;
  answersLog = [];
  session = {
    started_at: new Date().toISOString(),
    total: queue.length,
    correct: 0,
    bestStreak: 0
  };
  show("play");
  renderQuestion();
}

/* ---------- рендер питання ---------- */
function renderQuestion() {
  const q = queue[idx];
  qStart = Date.now();

  $("prog").style.width = (idx / queue.length * 100) + "%";
  $("qcount").textContent = (idx + 1) + " / " + queue.length;
  $("streak-live").textContent = streak + " правильних поспіль";
  $("qcat").textContent = CAT_UA[q.category] || q.category;
  $("qprompt").textContent = q.prompt;
  $("feedback").hidden = true;
  $("btn-next").hidden = true;

  const body = $("qbody");
  body.innerHTML = "";

  if (q.type === "mcq") renderMCQ(q, body);
  else if (q.type === "fill") renderFill(q, body);
  else if (q.type === "order") renderOrder(q, body);
}

function renderMCQ(q, body) {
  shuffle(q.options).forEach(opt => {
    const b = document.createElement("button");
    b.className = "opt";
    b.textContent = opt;
    b.onclick = () => {
      const correct = opt === q.answer;
      body.querySelectorAll(".opt").forEach(x => {
        x.disabled = true;
        if (x.textContent === q.answer) x.classList.add("right");
        else if (x === b) x.classList.add("wrong");
      });
      grade(q, correct);
    };
    body.appendChild(b);
  });
}

function renderFill(q, body) {
  const inp = document.createElement("input");
  inp.className = "fill-input";
  inp.placeholder = "введіть слово і натисніть Enter";
  inp.autocomplete = "off";
  const check = () => {
    const val = inp.value.trim().toLowerCase();
    if (!val) return;
    const ok = (q.accept || [q.answer]).some(a => a.toLowerCase() === val);
    inp.disabled = true;
    grade(q, ok);
  };
  inp.addEventListener("keydown", e => { if (e.key === "Enter") check(); });
  body.appendChild(inp);
  inp.focus();

  const btn = document.createElement("button");
  btn.className = "btn ghost";
  btn.textContent = "Перевірити";
  btn.onclick = check;
  body.appendChild(btn);
}

function renderOrder(q, body) {
  const rail = document.createElement("div");
  rail.className = "slot-rail";
  body.appendChild(rail);

  const pool = document.createElement("div");
  pool.className = "tokens";
  body.appendChild(pool);

  const picked = [];

  shuffle(q.tokens).forEach(t => {
    const b = document.createElement("button");
    b.className = "token";
    b.textContent = t;
    b.onclick = () => {
      if (b.classList.contains("used")) return;
      b.classList.add("used");
      picked.push(t);
      const s = document.createElement("button");
      s.className = "token";
      s.textContent = t;
      s.onclick = () => {
        const i = picked.lastIndexOf(t);
        if (i > -1) picked.splice(i, 1);
        s.remove();
        b.classList.remove("used");
      };
      rail.appendChild(s);
    };
    pool.appendChild(b);
  });

  const btn = document.createElement("button");
  btn.className = "btn ghost";
  btn.textContent = "Перевірити";
  btn.onclick = () => {
    const built = picked.join(" ");
    const ok = built.toLowerCase() === q.answer.toLowerCase();
    rail.style.borderStyle = "solid";
    rail.style.borderColor = ok ? "var(--ok)" : "var(--no)";
    pool.querySelectorAll(".token").forEach(t => t.onclick = null);
    rail.querySelectorAll(".token").forEach(t => t.onclick = null);
    btn.disabled = true;
    grade(q, ok);
  };
  body.appendChild(btn);
}

/* ---------- оцінювання ---------- */
function grade(q, correct) {
  const ms = Date.now() - qStart;
  answersLog.push({
    question_id: q.id,
    category: q.category,
    item_key: q.item,
    is_correct: correct,
    response_ms: ms
  });

  if (correct) {
    session.correct++;
    streak++;
    if (streak > session.bestStreak) session.bestStreak = streak;
  } else {
    streak = 0;
  }

  const v = $("verdict");
  v.textContent = correct ? "Правильно" : "Правильна відповідь: " + q.answer;
  v.className = "verdict " + (correct ? "ok" : "no");
  $("explain").textContent = q.explain;
  $("feedback").hidden = false;
  $("btn-next").hidden = false;
  $("btn-next").textContent = (idx + 1 >= queue.length) ? "Завершити" : "Далі";
  $("btn-next").focus();
}

/* ---------- кінець сесії ---------- */
async function finish() {
  $("prog").style.width = "100%";
  await Store.saveSession(session, answersLog);

  $("res-score").textContent = session.correct + " / " + session.total;
  const pct = Math.round(session.correct / session.total * 100);
  let line;
  if (pct >= 90) line = "Рівень тримається впевнено. Час підвищувати складність.";
  else if (pct >= 70) line = "Міцний B1+ результат. Кілька категорій ще просідають.";
  else if (pct >= 50) line = "Основа є, але половина правил ще не стала автоматичною.";
  else line = "Багато нового — це нормально. Пояснення важливіші за рахунок.";
  $("res-line").textContent = line;

  const byCat = {};
  answersLog.forEach(a => {
    if (!byCat[a.category]) byCat[a.category] = { n: 0, ok: 0 };
    byCat[a.category].n++;
    if (a.is_correct) byCat[a.category].ok++;
  });

  const box = $("res-breakdown");
  box.innerHTML = "";
  Object.entries(byCat).forEach(([cat, d]) => {
    const row = document.createElement("div");
    row.className = "res-row";
    row.innerHTML = `<span>${CAT_UA[cat] || cat}</span><span>${d.ok}/${d.n}</span>`;
    box.appendChild(row);
  });

  show("result");
}

/* ---------- головний екран ---------- */
function temperColor(acc) {
  if (acc >= 0.85) return "var(--blue)";
  if (acc >= 0.7) return "var(--violet)";
  if (acc >= 0.5) return "var(--bronze)";
  return "var(--straw)";
}

async function renderHome() {
  const stats = await Store.getStats();

  $("s-sessions").textContent = stats.sessions.length;
  $("s-answers").textContent = stats.answers.length;

  const ok = stats.answers.filter(a => a.is_correct).length;
  $("s-acc").textContent = stats.answers.length
    ? Math.round(ok / stats.answers.length * 100) + "%"
    : "—";
  $("s-streak").textContent = stats.sessions.length
    ? Math.max(...stats.sessions.map(s => s.best_streak || 0))
    : 0;

  const byCat = {};
  stats.answers.forEach(a => {
    if (!byCat[a.category]) byCat[a.category] = { n: 0, ok: 0 };
    byCat[a.category].n++;
    if (a.is_correct) byCat[a.category].ok++;
  });

  const bars = $("temper-bars");
  bars.innerHTML = "";
  Object.keys(CAT_UA).forEach(cat => {
    const d = byCat[cat];
    const acc = d && d.n ? d.ok / d.n : 0;
    const row = document.createElement("div");
    row.className = "tbar";
    row.innerHTML = `
      <div class="tbar-name">${CAT_UA[cat]}</div>
      <div class="tbar-rail"><div class="tbar-fill" style="width:${d ? Math.max(acc * 100, 4) : 0}%; background:${temperColor(acc)}"></div></div>
      <div class="tbar-val">${d ? Math.round(acc * 100) + "%" : "—"}</div>`;
    bars.appendChild(row);
  });

  $("who").textContent = Store.mode === "supabase" && Store.user
    ? Store.user.email
    : "гостьовий режим";
}

/* ---------- експорт для аналізу ---------- */
async function buildExport() {
  const s = await Store.getStats();
  const lines = [];
  lines.push("WORDFORGE — звіт про прогрес");
  lines.push("Дата: " + new Date().toISOString().slice(0, 10));
  lines.push("Сесій: " + s.sessions.length + " | Відповідей: " + s.answers.length);

  const ok = s.answers.filter(a => a.is_correct).length;
  lines.push("Загальна точність: " + (s.answers.length ? Math.round(ok / s.answers.length * 100) : 0) + "%");
  lines.push("");
  lines.push("ЗА КАТЕГОРІЯМИ:");

  const byCat = {};
  s.answers.forEach(a => {
    if (!byCat[a.category]) byCat[a.category] = { n: 0, ok: 0, ms: 0 };
    byCat[a.category].n++;
    if (a.is_correct) byCat[a.category].ok++;
    byCat[a.category].ms += a.response_ms || 0;
  });
  Object.entries(byCat).forEach(([c, d]) => {
    lines.push(`- ${c}: ${d.ok}/${d.n} (${Math.round(d.ok / d.n * 100)}%), сер. час ${Math.round(d.ms / d.n / 100) / 10}с`);
  });

  lines.push("");
  lines.push("СЛАБКІ МІСЦЯ (помилки / спроби):");
  s.weak
    .filter(w => w.errors > 0)
    .sort((a, b) => (b.errors / b.attempts) - (a.errors / a.attempts))
    .slice(0, 15)
    .forEach(w => lines.push(`- ${w.item_key} [${w.category}]: ${w.errors}/${w.attempts}`));

  return lines.join("\n");
}

/* ---------- обробники ---------- */
let authMode = "in";

document.querySelectorAll("[data-authtab]").forEach(t => {
  t.onclick = () => {
    document.querySelectorAll("[data-authtab]").forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    authMode = t.dataset.authtab;
    $("auth-submit").textContent = authMode === "in" ? "Увійти" : "Створити акаунт";
    $("auth-msg").textContent = "";
  };
});

$("auth-submit").onclick = async () => {
  const email = $("auth-email").value.trim();
  const pass = $("auth-pass").value;
  const msg = $("auth-msg");
  if (!email || !pass) { msg.textContent = "Заповніть обидва поля."; return; }
  msg.textContent = "Хвилинку…";
  try {
    if (authMode === "in") await Store.signIn(email, pass);
    else {
      const r = await Store.signUp(email, pass);
      if (!r.session) {
        msg.textContent = "Акаунт створено. Підтвердьте пошту, потім увійдіть.";
        return;
      }
    }
    await renderHome();
    show("home");
  } catch (e) {
    msg.textContent = "Не вийшло: " + (e.message || "перевірте дані");
  }
};

$("auth-forgot").onclick = () => {
  $("forgot-email").value = $("auth-email").value.trim();
  $("forgot-msg").textContent = "";
  show("forgot");
};

$("forgot-back").onclick = () => {
  $("auth-msg").textContent = "";
  show("auth");
};

$("forgot-submit").onclick = async () => {
  const email = $("forgot-email").value.trim();
  const msg = $("forgot-msg");
  if (!email) { msg.textContent = "Вкажіть email."; return; }
  msg.textContent = "Хвилинку…";
  try {
    await Store.resetPasswordForEmail(email);
    msg.textContent = "Перевірте пошту — надіслали посилання для скидання пароля.";
  } catch (e) {
    msg.textContent = "Не вийшло: " + (e.message || "спробуйте пізніше");
  }
};

$("newpass-submit").onclick = async () => {
  const pass = $("newpass-pass").value;
  const msg = $("newpass-msg");
  if (!pass || pass.length < 6) { msg.textContent = "Мінімум 6 символів."; return; }
  msg.textContent = "Хвилинку…";
  try {
    await Store.updatePassword(pass);
    msg.textContent = "Пароль оновлено.";
    await renderHome();
    show("home");
  } catch (e) {
    msg.textContent = "Не вийшло: " + (e.message || "спробуйте ще раз");
  }
};

$("auth-skip").onclick = async () => {
  Store.useGuest();
  await renderHome();
  show("home");
};

$("btn-signout").onclick = async () => {
  await Store.signOut();
  $("auth-msg").textContent = "";
  show("auth");
};

$("btn-start").onclick = () => startSession(false);
$("btn-weak").onclick = () => startSession(true);

$("btn-next").onclick = () => {
  idx++;
  if (idx >= queue.length) finish();
  else renderQuestion();
};

$("btn-quit").onclick = async () => {
  if (answersLog.length) {
    session.total = answersLog.length;
    await Store.saveSession(session, answersLog);
  }
  await renderHome();
  show("home");
};

$("btn-again").onclick = () => startSession(false);
$("btn-home").onclick = async () => { await renderHome(); show("home"); };

function closeExportModal() {
  $("export-modal").hidden = true;
}

$("btn-export").onclick = async () => {
  const box = $("export-box");
  box.value = await buildExport();
  $("export-modal").hidden = false;
  box.select();
};

$("btn-export-close").onclick = closeExportModal;

$("export-modal").addEventListener("click", (e) => {
  if (e.target.id === "export-modal") closeExportModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !$("export-modal").hidden) closeExportModal();
});

/* ---------- старт ---------- */
Store.onPasswordRecovery(() => {
  $("newpass-msg").textContent = "";
  $("newpass-pass").value = "";
  show("newpass");
});

(async function () {
  await loadBank();
  const u = await Store.init();
  if (u) {
    await renderHome();
    show("home");
  } else {
    show("auth");
  }
})();
