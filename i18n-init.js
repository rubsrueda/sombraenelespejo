import { initI18n } from "./i18n.js";

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initI18n();
  });
} else {
  initI18n();
}
