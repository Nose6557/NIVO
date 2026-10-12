import "../level.js";
import "../ui/answer-option.js";
import "../ui/token.js";
import "../ui/order-board.js";
import "../ui/fill-input.js";
import "../ui/progress.js";
import "../ui/ua-toggle.js";
import "../ui/feedback.js";
import "../ui/question-card.js";
import "../ui/level-badge.js";
import "../ui/category-bar.js";
import "../ui/result-row.js";
import "../onboard.js";
import { UI } from "./frame.js";
import { pick, screen, setMsg } from "./markup.js";

/* Екрани цілком: розмітка з index.html + компоненти з ui/, заповнені
   прикладом даних. Логіки застосунку тут немає — кнопки нікуди не ведуть. */
export default { title: "Екрани", parameters: { layout: "fullscreen" } };

/* ---------- вхід ---------- */
function auth({ mode = "in", email = "", pass = "", error = "", fields = [] } = {}) {
  const el = screen("auth");
  el.querySelectorAll("[data-authtab]").forEach(t => {
    const on = t.dataset.authtab === mode;
    t.classList.toggle("active", on);
    t.setAttribute("aria-selected", String(on));
  });
  el.querySelector("#auth-submit").textContent = mode === "in" ? "Увійти" : "Створити акаунт";
  el.querySelector("#auth-email").value = email;
  el.querySelector("#auth-pass").value = pass;
  setMsg(el.querySelector("#auth-msg"), error, error ? "error" : "");
  fields.forEach(f => el.querySelector(`.field[data-field="${f}"]`).classList.add("has-error"));
  return el;
}

export const SignIn = { render: () => auth() };
export const SignUp = { render: () => auth({ mode: "up" }) };
export const SignInError = {
  render: () => auth({
    email: "you@example.com", pass: "wrong-pass",
    error: "Невірний email або пароль.", fields: ["email", "pass"]
  })
};

export const ForgotPassword = { render: () => screen("forgot") };
export const ForgotPasswordSent = {
  render: () => {
    const el = screen("forgot");
    el.querySelector("#forgot-email").value = "you@example.com";
    setMsg(el.querySelector("#forgot-msg"), "Лист надіслано — перевірте пошту.", "success");
    return el;
  }
};
export const NewPassword = { render: () => screen("newpass") };

/* ---------- головна ---------- */
const CATEGORIES = [
  ["Артиклі", 0.9], ["Часи", 0.76], ["Прийменники", 0.58], ["Фразові дієслова", 0.4],
  ["Умовні речення", 0.32], ["Лексика", 0.81], ["Ідіоми", null]
];

function home({ sessions, answers, accuracy, streak, level, email, bars }) {
  const el = screen("home");
  el.querySelector("#s-sessions").textContent = sessions;
  el.querySelector("#s-answers").textContent = answers;
  el.querySelector("#s-acc").textContent = accuracy;
  el.querySelector("#s-streak").textContent = streak;
  el.querySelector("#avatar-initial").textContent = email ? email[0].toUpperCase() : "?";
  el.querySelector("#who").textContent = email || "гостьовий режим";
  UI().updateLevelBadge(el.querySelector(".level-badge"), level);
  if (level) el.querySelector(".avatar-btn").dataset.level = level;
  const box = el.querySelector("#temper-bars");
  bars.forEach(([name, accuracy]) => box.appendChild(UI().createCategoryBar({ name, accuracy })));
  return el;
}

export const Home = {
  render: () => home({
    sessions: 63, answers: 888, accuracy: "76%", streak: 33,
    level: "B2", email: "nivo@example.com", bars: CATEGORIES
  })
};
export const HomeNewUser = {
  render: () => home({
    sessions: 0, answers: 0, accuracy: "—", streak: 0,
    level: null, email: null, bars: CATEGORIES.map(([name]) => [name, null])
  })
};

/* ---------- гра ---------- */
function play({ progress, category, prompt, body, feedback, nextLabel }) {
  const el = screen("play");
  const qBody = document.createElement("div");
  body.forEach(c => qBody.appendChild(c));
  const next = document.createElement("button");
  next.className = "btn primary";
  next.textContent = nextLabel || "Далі";
  next.hidden = !nextLabel;
  const fb = feedback ? UI().createFeedback(feedback) : UI().createFeedback();
  fb.hidden = !feedback;
  el.querySelector("#play-body").append(
    UI().createProgress({ actionLabel: "Вийти", ...progress }),
    UI().createQuestionCard({ category, prompt, children: [qBody, fb, next] })
  );
  return el;
}

export const PlayQuestion = {
  render: () => play({
    progress: { value: 6 / 15, count: "7 / 15", streak: "3 правильних поспіль" },
    category: "Часи",
    prompt: "She ___ the report, so we can send it now.",
    body: ["has finished", "finished", "is finishing", "had finished"]
      .map(text => UI().createAnswerOption({ text }))
  })
};

export const PlayAnswered = {
  render: () => play({
    progress: { value: 6 / 15, count: "7 / 15", streak: "0 правильних поспіль" },
    category: "Часи",
    prompt: "She ___ the report, so we can send it now.",
    body: [
      UI().createAnswerOption({ text: "has finished", state: "right", disabled: true }),
      UI().createAnswerOption({ text: "finished", state: "wrong", disabled: true }),
      UI().createAnswerOption({ text: "is finishing", disabled: true }),
      UI().createAnswerOption({ text: "had finished", disabled: true })
    ],
    feedback: {
      correct: false, answer: "has finished",
      explain: "Present Perfect: дія завершилась, а результат важливий зараз.",
      ua: "Вона закінчила звіт, тож можемо його надсилати.", uaOpen: true
    },
    nextLabel: "Далі"
  })
};

export const PlayOrder = {
  render: () => play({
    progress: { value: 14 / 15, count: "15 / 15", streak: "9 правильних поспіль" },
    category: "Порядок слів",
    prompt: "Склади речення зі слів.",
    body: [UI().createOrderBoard({
      tokens: ["finished", "has", "she", "report", "already", "the"],
      picked: ["she", "has"]
    })],
    nextLabel: "Перевірити"
  })
};

/* ---------- підсумок ---------- */
export const Result = {
  render: () => {
    const el = screen("result");
    el.querySelector("#res-score").textContent = "12 / 15";
    el.querySelector("#res-line").textContent = "Міцний B1+ результат. Кілька категорій ще просідають.";
    const box = el.querySelector("#res-breakdown");
    [["Часи", "4/5"], ["Артиклі", "3/3"], ["Прийменники", "2/4"], ["Лексика", "3/3"]]
      .forEach(([label, value]) => box.appendChild(UI().createResultRow({ label, value })));
    return el;
  }
};

/* ---------- онбординг: справжній onboard.js ---------- */
const TEST_BANK = Array.from({ length: 8 }, (_, i) => ({
  id: "sb-" + i, type: "mcq", level: "B1",
  prompt: "If I ___ more time, I would travel more.",
  options: ["have", "had", "will have", "would have"], answer: "had"
}));

export const OnboardSelfAssessment = {
  render: () => screen("onboard"),
  play: async () => window.Onboard.start(TEST_BANK, () => {})
};

export const OnboardTest = {
  render: () => screen("onboard"),
  play: async () => window.Onboard.retest(TEST_BANK, () => {})
};

/* Підтвердження рівня — та сама картка #level-up, що й на підвищенні. */
export const OnboardConfirmed = {
  render: () => {
    const wrap = document.createElement("div");
    wrap.append(screen("onboard"), pick("#level-up"));
    return wrap;
  },
  play: async ({ canvasElement }) => {
    window.Onboard.start(TEST_BANK, () => {});
    canvasElement.querySelector('.ob-opt[data-level="B1"]').click();
  }
};
