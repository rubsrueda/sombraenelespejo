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

function normalizeEmail(email) {
  const value = String(email || "").trim().toLowerCase();
  const [local = "", domain = ""] = value.split("@");
  if (domain === "gmail.com" || domain === "googlemail.com") {
    const cleanLocal = local.split("+")[0].replace(/\./g, "");
    return `${cleanLocal}@gmail.com`;
  }
  return value;
}

function hasAdminRole(rawRole) {
  if (typeof rawRole === "string") {
    const normalized = rawRole.trim().toLowerCase();
    return ["admin", "administrador", "superadmin"].includes(normalized);
  }
  if (Array.isArray(rawRole)) {
    return rawRole.some((item) => hasAdminRole(item));
  }
  return false;
}

async function injectAdminLinksForAdmins() {
  try {
    const [{ ADMIN_EMAILS }, authModule] = await Promise.all([
      import("./admin-config.js"),
      import("./auth-supabase.js"),
    ]);

    const user = await authModule.getCurrentUser();
    const userEmail = normalizeEmail(user?.email);
    const allowList = (ADMIN_EMAILS || []).map(normalizeEmail);
    const isAdmin = allowList.includes(userEmail)
      || hasAdminRole(user?.user_metadata?.role)
      || hasAdminRole(user?.user_metadata?.roles)
      || hasAdminRole(user?.app_metadata?.role)
      || hasAdminRole(user?.app_metadata?.roles);

    if (!isAdmin) {
      return;
    }

    const desktopNav = document.querySelector("header nav ul");
    if (desktopNav && !desktopNav.querySelector('a[href="admin-afiliados.html"]')) {
      const li = document.createElement("li");
      li.innerHTML = '<a class="nav-link" href="admin-afiliados.html">Gestion</a>';
      desktopNav.appendChild(li);
    }

    const mobileNav = document.getElementById("mobileMenu");
    if (mobileNav && !mobileNav.querySelector('a[href="admin-afiliados.html"]')) {
      const a = document.createElement("a");
      a.className = "mobile-link";
      a.href = "admin-afiliados.html";
      a.textContent = "Gestion";
      mobileNav.appendChild(a);
    }
  } catch {
    // Navigation enhancement only; fail silently outside auth-enabled flows.
  }
}

injectAdminLinksForAdmins();
