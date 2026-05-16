import { captureAffiliateFromUrl } from "./affiliate.js";
import { initAnalytics, trackEvent } from "./analytics.js";

const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const mobileMenu = document.getElementById("mobileMenu");

captureAffiliateFromUrl();

if (initAnalytics()) {
  trackEvent("af_page_view", {
    path: window.location.pathname,
    lang: document.documentElement.lang || "es",
  });
}

if (mobileMenuBtn && mobileMenu) {
  mobileMenuBtn.addEventListener("click", () => {
    const expanded = mobileMenuBtn.getAttribute("aria-expanded") === "true";
    mobileMenuBtn.setAttribute("aria-expanded", String(!expanded));
    mobileMenu.classList.toggle("hidden", expanded);
  });
}
