/* store.js — єдиний шар доступу до даних.
   Працює у двох режимах: Supabase (з акаунтом) або localStorage (гість).
   Уся решта коду знає лише про цей інтерфейс — тому бекенд можна замінити,
   не чіпаючи логіку гри. */

(function () {
  const cfg = window.NIVO_CONFIG || {};
  let sb = null;
  let mode = "local";           // "supabase" | "local"
  let user = null;
  const LS = "nivo_local_v1";
  const LS_LEGACY = "wordforge_local_v1"; // старий ключ (Wordforge) — для міграції даних гостей

  if (window.supabase && cfg.SUPABASE_URL && cfg.SUPABASE_KEY) {
    sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY);
  }

  /* ---------- локальне сховище ---------- */
  function readLocal() {
    try {
      const raw = localStorage.getItem(LS);
      if (raw) return JSON.parse(raw) || blank();
      const legacy = localStorage.getItem(LS_LEGACY);
      if (legacy) {
        localStorage.setItem(LS, legacy);
        localStorage.removeItem(LS_LEGACY);
        return JSON.parse(legacy) || blank();
      }
      return blank();
    } catch { return blank(); }
  }
  function blank() {
    return { sessions: [], answers: [], weak: {} };
  }
  function writeLocal(d) {
    try { localStorage.setItem(LS, JSON.stringify(d)); } catch {}
  }

  /* Наскрізна серія «правильних поспіль». Живе окремим ключем і на пристрої:
     це лічильник точності, а не межа сесії, тому не обнуляється між сесіями
     і не впирається в SESSION_LEN. Найкраще значення дублюється тут, щоб
     пережити кинуту на середині сесію (answers пишуться лише у finish()). */
  const LS_STREAK = "nivo_streak_v1";
  function readStreak() {
    try {
      const d = JSON.parse(localStorage.getItem(LS_STREAK) || "null");
      return { current: (d && d.current) || 0, best: (d && d.best) || 0 };
    } catch { return { current: 0, best: 0 }; }
  }
  function writeStreak(current, best) {
    try { localStorage.setItem(LS_STREAK, JSON.stringify({ current, best })); } catch {}
  }

  /* ---------- авторизація ---------- */
  const Store = {
    get mode() { return mode; },
    get user() { return user; },

    /* серія правильних поспіль */
    getStreak() { return readStreak(); },
    setStreak(current, best) { writeStreak(current, best); },

    async init() {
      if (!sb) return null;
      const { data } = await sb.auth.getSession();
      if (data && data.session) {
        user = data.session.user;
        mode = "supabase";
      }
      return user;
    },

    async signUp(email, password) {
      if (!sb) throw new Error("Supabase недоступний");
      const { data, error } = await sb.auth.signUp({ email, password });
      if (error) throw error;
      if (data.session) { user = data.user; mode = "supabase"; }
      return data;
    },

    async signIn(email, password) {
      if (!sb) throw new Error("Supabase недоступний");
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      user = data.user;
      mode = "supabase";
      return data;
    },

    async signOut() {
      if (sb && mode === "supabase") await sb.auth.signOut();
      user = null;
      mode = "local";
    },

    useGuest() { mode = "local"; user = null; },

    async resetPasswordForEmail(email) {
      if (!sb) throw new Error("Supabase недоступний");
      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + window.location.pathname
      });
      if (error) throw error;
    },

    async updatePassword(password) {
      if (!sb) throw new Error("Supabase недоступний");
      const { data, error } = await sb.auth.updateUser({ password });
      if (error) throw error;
      user = data.user;
      mode = "supabase";
      return data;
    },

    // викликається, коли Supabase відкриває посилання зі скидання пароля
    onPasswordRecovery(cb) {
      if (!sb) return;
      sb.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") cb();
      });
    },

    /* ---------- запис сесії ---------- */
    async saveSession(session, answers) {
      if (mode === "supabase" && sb && user) {
        const { data, error } = await sb.from("sessions").insert({
          user_id: user.id,
          started_at: session.started_at,
          finished_at: new Date().toISOString(),
          total_questions: session.total,
          correct_count: session.correct,
          best_streak: session.bestStreak
        }).select().single();
        if (error) { console.warn("session insert", error); return; }

        const rows = answers.map(a => ({
          user_id: user.id,
          session_id: data.id,
          question_id: a.question_id,
          category: a.category,
          is_correct: a.is_correct,
          response_ms: a.response_ms
        }));
        const r2 = await sb.from("answers").insert(rows);
        if (r2.error) console.warn("answers insert", r2.error);

        await this._bumpWeak(answers);
      } else {
        const d = readLocal();
        d.sessions.push({
          started_at: session.started_at,
          finished_at: new Date().toISOString(),
          total_questions: session.total,
          correct_count: session.correct,
          best_streak: session.bestStreak
        });
        answers.forEach(a => {
          d.answers.push({ ...a, answered_at: new Date().toISOString() });
          const k = a.item_key;
          if (!d.weak[k]) d.weak[k] = { item_key: k, category: a.category, attempts: 0, errors: 0 };
          d.weak[k].attempts++;
          if (!a.is_correct) d.weak[k].errors++;
        });
        writeLocal(d);
      }
    },

    async _bumpWeak(answers) {
      // читаємо наявні записи, оновлюємо лічильники, пишемо назад
      const keys = [...new Set(answers.map(a => a.item_key))];
      const { data: existing } = await sb.from("weak_items")
        .select("*").eq("user_id", user.id).in("item_key", keys);
      const map = {};
      (existing || []).forEach(r => { map[r.item_key] = r; });

      const rows = keys.map(k => {
        const mine = answers.filter(a => a.item_key === k);
        const prev = map[k] || { attempts: 0, errors: 0 };
        return {
          user_id: user.id,
          item_key: k,
          category: mine[0].category,
          attempts: prev.attempts + mine.length,
          errors: prev.errors + mine.filter(a => !a.is_correct).length,
          last_seen: new Date().toISOString()
        };
      });
      const { error } = await sb.from("weak_items")
        .upsert(rows, { onConflict: "user_id,item_key" });
      if (error) console.warn("weak upsert", error);
    },

    /* ---------- профіль і рівень ---------- */

    // true, поки не доведено протилежне. Якщо SQL-міграція ще не виконана,
    // Supabase поверне помилку про невідому колонку — тоді тихо переходимо
    // на localStorage і більше не смикаємо сервер. Завдяки цьому файли можна
    // заливати до міграції, нічого не ламаючи.
    _levelCols: true,

    _missingCol(error) {
      const s = ((error && (error.message || error.details || "")) + "").toLowerCase();
      return error && (error.code === "42703" || s.includes("column") || s.includes("schema cache"));
    },

    async getProfile() {
      if (mode !== "supabase" || !sb || !user || !this._levelCols) return null;
      const { data, error } = await sb.from("profiles")
        .select("level,level_source,level_locked")
        .eq("id", user.id).maybeSingle();
      if (error) {
        if (this._missingCol(error)) {
          this._levelCols = false;
          console.info("profiles: колонок рівня ще немає — рівень тримаємо локально");
        } else console.warn("profile select", error);
        return null;
      }
      return data || null;
    },

    async saveLevel(level, source, locked) {
      if (mode !== "supabase" || !sb || !user || !this._levelCols) return false;
      const row = {
        id: user.id,
        level,
        level_source: source,
        level_updated_at: new Date().toISOString()
      };
      if (typeof locked === "boolean") row.level_locked = locked;
      const { error } = await sb.from("profiles").upsert(row, { onConflict: "id" });
      if (error) {
        if (this._missingCol(error)) {
          this._levelCols = false;
          console.info("profiles: колонок рівня ще немає — рівень тримаємо локально");
        } else console.warn("level upsert", error);
        return false;
      }
      return true;
    },

    // так само тихо вимикається, якщо колонки profiles.theme ще немає
    _themeCol: true,

    async saveTheme(theme) {
      if (mode !== "supabase" || !sb || !user || !this._themeCol) return false;
      const { error } = await sb.from("profiles")
        .upsert({ id: user.id, theme }, { onConflict: "id" });
      if (error) {
        if (this._missingCol(error)) {
          this._themeCol = false;
          console.info("profiles: колонки theme ще немає — тему тримаємо локально");
        } else console.warn("theme upsert", error);
        return false;
      }
      return true;
    },

    /* ---------- читання статистики ---------- */
    async getStats() {
      if (mode === "supabase" && sb && user) {
        const [s, a, w] = await Promise.all([
          sb.from("sessions").select("*").eq("user_id", user.id),
          sb.from("answers").select("question_id,category,is_correct,response_ms,answered_at").eq("user_id", user.id).order("answered_at", { ascending: true }),
          sb.from("weak_items").select("*").eq("user_id", user.id)
        ]);
        return {
          sessions: s.data || [],
          answers: a.data || [],
          weak: w.data || []
        };
      }
      const d = readLocal();
      return {
        sessions: d.sessions,
        answers: d.answers,
        weak: Object.values(d.weak)
      };
    }
  };

  window.Store = Store;
})();
