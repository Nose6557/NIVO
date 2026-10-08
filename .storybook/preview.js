/* Увесь CSS NIVO — один файл, той самий, що підключає index.html. */
import "../style.css";

/** @type { import('@storybook/html-vite').Preview } */
const preview = {
  parameters: {
    layout: "centered",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    }
  },

  /* Перемикач теми в тулбарі. Ставить data-theme на <html>; сам style.css
     поки має одну тему — темну, тож "light" запрацює, щойно в CSS з'являться
     токени під :root[data-theme="light"]. */
  globalTypes: {
    theme: {
      description: "Тема NIVO (data-theme на root)",
      toolbar: {
        title: "Тема",
        icon: "circlehollow",
        items: [
          { value: "dark", title: "Темна", icon: "moon" },
          { value: "light", title: "Світла", icon: "sun" }
        ],
        dynamicTitle: true
      }
    }
  },
  initialGlobals: { theme: "dark" },

  decorators: [
    (story, context) => {
      document.documentElement.setAttribute("data-theme", context.globals.theme || "dark");
      return story();
    }
  ]
};

export default preview;
