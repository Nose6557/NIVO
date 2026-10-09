import "../ui/answer-option.js";
import "../ui/token.js";
import "../ui/order-board.js";
import "../ui/fill-input.js";
import "../ui/ua-toggle.js";
import "../ui/feedback.js";
import "../ui/question-card.js";
import { frame, UI } from "./frame.js";

const EXPLAIN = "Present Perfect: дія завершилась, а результат важливий зараз.";

function nextBtn(label) {
  const b = document.createElement("button");
  b.className = "btn primary";
  b.textContent = label;
  return b;
}

function body(...children) {
  const d = document.createElement("div");
  children.forEach(c => d.appendChild(c));
  return d;
}

const card = (props, children) =>
  frame(UI().createQuestionCard({ ...props, children }), 640);

export default { title: "Гра/QuestionCard" };

export const Mcq = {
  render: () => card(
    { category: "Часи", prompt: "She ___ the report, so we can send it now." },
    [body(...["has finished", "finished", "is finishing", "had finished"]
      .map(text => UI().createAnswerOption({ text })))]
  )
};

export const McqAnswered = {
  render: () => card(
    { category: "Часи", prompt: "She ___ the report, so we can send it now." },
    [
      body(
        UI().createAnswerOption({ text: "has finished", state: "right", disabled: true }),
        UI().createAnswerOption({ text: "finished", state: "wrong", disabled: true }),
        UI().createAnswerOption({ text: "is finishing", disabled: true }),
        UI().createAnswerOption({ text: "had finished", disabled: true })
      ),
      UI().createFeedback({
        correct: false, answer: "has finished", explain: EXPLAIN,
        ua: "Вона закінчила звіт, тож можемо його надсилати.", uaOpen: true
      }),
      nextBtn("Далі")
    ]
  )
};

export const Fill = {
  render: () => card(
    { category: "Прийменники", prompt: "I'm interested ___ learning Spanish." },
    [body(UI().createFillInput({})), nextBtn("Перевірити")]
  )
};

export const FillAnswered = {
  render: () => card(
    { category: "Прийменники", prompt: "I'm interested ___ learning Spanish." },
    [
      body(UI().createFillInput({ value: "in", disabled: true })),
      UI().createFeedback({
        correct: true, answer: "in",
        explain: "Interested in + герундій — стале сполучення.", ua: null
      }),
      nextBtn("Далі")
    ]
  )
};

export const Order = {
  render: () => card(
    { category: "Порядок слів", prompt: "Склади речення зі слів." },
    [
      body(UI().createOrderBoard({
        tokens: ["finished", "has", "she", "report", "already", "the"],
        picked: ["she", "has"]
      })),
      nextBtn("Перевірити")
    ]
  )
};

export const OrderAnswered = {
  render: () => card(
    { category: "Порядок слів", prompt: "Склади речення зі слів." },
    [
      body(UI().createOrderBoard({
        tokens: ["finished", "has", "she", "report", "already", "the"],
        picked: ["she", "has", "already", "finished", "the", "report"],
        result: "ok"
      })),
      UI().createFeedback({
        correct: true, answer: "she has already finished the report",
        explain: EXPLAIN, ua: "Вона вже закінчила звіт.", uaOpen: false
      }),
      nextBtn("Завершити")
    ]
  )
};

/* Тест рівня: варіанти лежать просто в картці, фідбеку немає. */
export const PlacementTest = {
  render: () => card(
    { category: "Тест рівня", prompt: "If I ___ more time, I would travel more." },
    ["have", "had", "will have", "would have"].map(text => UI().createAnswerOption({ text }))
  )
};
