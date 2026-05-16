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

async function renderVersionWatermark() {
  const watermarkId = "versionWatermark";
  if (document.getElementById(watermarkId)) return;

  try {
    const response = await fetch(`VERSION?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error("VERSION no disponible");

    const version = (await response.text()).trim();
    if (!version) return;

    const stamp = document.createElement("div");
    stamp.id = watermarkId;
    stamp.className = "version-watermark";
    stamp.setAttribute("aria-label", `Version activa ${version}`);
    stamp.textContent = `Version ${version}`;
    document.body.appendChild(stamp);
  } catch {
    // The watermark is only a visual verification aid; app behavior should continue.
  }
}

renderVersionWatermark();
