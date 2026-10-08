/* Спільні обгортки для stories: компоненти NIVO розраховані на ширину
   картки питання, тож у «голому» вигляді розтягуються або стискаються. */
export function frame(el, width = 480) {
  const box = document.createElement("div");
  box.style.width = width + "px";
  box.style.maxWidth = "100%";
  box.appendChild(el);
  return box;
}

export const UI = () => window.NivoUI;
