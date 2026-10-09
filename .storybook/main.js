import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const INDEX_HTML = fileURLToPath(new URL("../index.html", import.meta.url));

/* Віддає stories розмітку справжнього index.html як рядок
   (import html from "virtual:nivo-markup"). Звичайний імпорт "../index.html?raw"
   не працює: за адресою /index.html Storybook віддає власну сторінку. */
function nivoMarkup() {
  const id = "virtual:nivo-markup";
  const resolved = "\0" + id;
  return {
    name: "nivo-markup",
    resolveId: source => (source === id ? resolved : null),
    load(loadedId) {
      if (loadedId !== resolved) return null;
      this.addWatchFile(INDEX_HTML);
      return "export default " + JSON.stringify(readFileSync(INDEX_HTML, "utf8")) + ";";
    }
  };
}

/** @type { import('@storybook/html-vite').StorybookConfig } */
const config = {
  stories: ["../stories/**/*.stories.js"],
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs"],
  framework: "@storybook/html-vite",
  // розмітка з index.html посилається на favicon/icon.svg
  staticDirs: [{ from: "../favicon", to: "/favicon" }],
  viteFinal: viteConfig => {
    viteConfig.plugins = [...(viteConfig.plugins || []), nivoMarkup()];
    return viteConfig;
  }
};
export default config;
