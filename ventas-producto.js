import { CATALOGO, PRODUCTO_ACTUAL } from "./producto-config.js";
import { applyCheckoutGrantFromUrl, hasAccess } from "./access-control.js";
import { getCurrentUser, resolveAccess, saveEntitlementForCurrentUser } from "./entitlements.js";
import { ADMIN_EMAILS } from "./admin-config.js";
import { getCurrentLang, getProductI18n, t } from "./i18n.js";

const benefitsGrid = document.getElementById("benefitsGrid");
const productTiers = document.getElementById("productTiers");
const salesTransparencyText = document.getElementById("salesTransparencyText");
const productTitle = document.getElementById("productTitle");
const productSubtitle = document.getElementById("productSubtitle");
const accessStatus = document.getElementById("accessStatus");
const currentUrl = new URL(window.location.href);

function getSelectedProduct() {
  const requestedId = currentUrl.searchParams.get("product");
  if (!requestedId) {
    return PRODUCTO_ACTUAL;
  }
  const requested = CATALOGO.productos.find((item) => item.id === requestedId && item.activo);
  return requested || PRODUCTO_ACTUAL;
}

const SELECTED_PRODUCT = getSelectedProduct();

function formatPrice(value, currency) {
  const useDecimals = currency !== "MXN";
  const locale = getCurrentLang() === "es" ? "es-ES" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: useDecimals ? 2 : 0,
    maximumFractionDigits: useDecimals ? 2 : 0,
  }).format(value);
}

function formatPriceList(item) {
  if (Array.isArray(item.precios) && item.precios.length > 0) {
    return item.precios.map((entry) => formatPrice(entry.valor, entry.moneda)).join(" / ");
  }

  return formatPrice(item.precio, item.moneda);
}

function createBenefitCard(item, index) {
  const title = item.titulo || item.title || "";
  const badge = item.badge || "";
  const description = item.descripcion || item.description || "";

  const article = document.createElement("article");
  article.className = `sales-card card-reveal delay-${Math.min(index + 1, 3)}`;
  article.innerHTML = `
    <h2 class="section-title">${title}</h2>
    <p class="badge">${badge}</p>
    <p class="mt-3">${description}</p>
  `;
  return article;
}

function normalizeEmail(email) {
  const value = String(email || "").trim().toLowerCase();
  const [local = "", domain = ""] = value.split("@");
  if (domain === "gmail.com" || domain === "googlemail.com") {
    const cleanLocal = local.split("+")[0].replace(/\./g, "");
    return `${cleanLocal}@gmail.com`;
  }
  return value;
}

function getSessionEmailFallback() {
  try {
    const keys = Object.keys(localStorage || {});
    const authKey = keys.find((key) => key.includes("-auth-token"));
    if (!authKey) {
      return "";
    }
    const raw = localStorage.getItem(authKey);
    if (!raw) {
      return "";
    }
    const parsed = JSON.parse(raw);
    const email = parsed?.user?.email || parsed?.currentSession?.user?.email || "";
    return normalizeEmail(email);
  } catch {
    return "";
  }
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

function isAdminUser(user) {
  const email = normalizeEmail(user?.email) || getSessionEmailFallback();
  if (!email) {
    return false;
  }

  const allowList = ADMIN_EMAILS.map(normalizeEmail);
  if (allowList.includes(email)) {
    return true;
  }

  return hasAdminRole(user?.user_metadata?.role)
    || hasAdminRole(user?.user_metadata?.roles)
    || hasAdminRole(user?.app_metadata?.role)
    || hasAdminRole(user?.app_metadata?.roles);
}

function createTierCard(item, { unlocked = false } = {}) {
  const localized = getProductI18n(getCurrentLang());
  const productName = item.nombre || localized.name;
  const productDescription = item.descripcionPublica || item.descripcion || localized.description;
  const article = document.createElement("article");
  article.className = "sales-card card-reveal tier-card";

  let cta = "";
  if (unlocked) {
    cta = `<a href="lectura.html?product=${encodeURIComponent(item.id)}" class="btn-main btn-interact inline-flex">Ir a lectura</a>`;
  } else if (item.enlaceCheckoutActivo) {
    cta = `<a href="${item.enlaceCheckout}" target="_blank" rel="noopener noreferrer" class="btn-main btn-interact inline-flex">${t("common.actions.buyNow")}</a>`;
  } else {
    cta = `<button class="btn-secondary opacity-70 cursor-not-allowed" type="button" disabled>${t("dynamic.buy.setupCta")}</button>`;
  }

  article.innerHTML = `
    <p class="tier-price">${formatPriceList(item)}</p>
    <h3 class="mt-0 mb-2 text-3xl">${productName}</h3>
    <p class="mb-4">${productDescription}</p>
    <p class="mb-4 text-sm text-slate-500">${t("dynamic.buy.grantedAccess")}: ${item.accessGrantId}</p>
    ${cta}
  `;

  return article;
}

function renderPage({ unlocked = false } = {}) {
  const localized = getProductI18n(getCurrentLang());
  const productName = SELECTED_PRODUCT.nombre || localized.name;
  const productTransparency = SELECTED_PRODUCT.transparencia || localized.transparency;

  productTitle.textContent = productName;
  productSubtitle.textContent = t("dynamic.buy.productSubtitle", { platform: SELECTED_PRODUCT.plataforma });

  // Enfoca la experiencia en un único producto de compra.
  benefitsGrid.innerHTML = "";
  benefitsGrid.classList.add("hidden");

  productTiers.appendChild(createTierCard(SELECTED_PRODUCT, { unlocked }));

  salesTransparencyText.textContent = productTransparency;
}

function renderCheckoutNotice({ checkoutGranted = false, unlocked = false, adminUnlocked = false } = {}) {
  if (!accessStatus) {
    return;
  }
  accessStatus.classList.toggle("hidden", !unlocked && !checkoutGranted);
  if (adminUnlocked) {
    accessStatus.textContent = "Acceso administrador activo. Puedes entrar a Lectura sin comprar.";
    return;
  }
  if (unlocked || checkoutGranted) {
    accessStatus.innerHTML = t("dynamic.buy.activeAccess");
  }
}

const state = {
  checkoutGranted: false,
  unlocked: false,
  adminUnlocked: false,
};

async function init() {
  if (!SELECTED_PRODUCT) {
    console.error("No hay producto activo disponible en ventas-producto.js");
    return;
  }

  state.checkoutGranted = applyCheckoutGrantFromUrl({
    token: SELECTED_PRODUCT.accessGrantToken,
    grantId: SELECTED_PRODUCT.accessGrantId,
    accessParam: CATALOGO.accesoUrlParam,
    returnParam: CATALOGO.accesoRetornoUrlParam,
  });

  if (state.checkoutGranted) {
    saveEntitlementForCurrentUser(SELECTED_PRODUCT.accessGrantId).catch(() => {
      // Mantiene acceso local incluso si no hay sesión o falla la escritura remota.
    });
  }

  const user = await getCurrentUser().catch(() => null);
  state.adminUnlocked = isAdminUser(user);
  const localUnlocked = hasAccess(SELECTED_PRODUCT.accessGrantId);
  const remoteUnlocked = await resolveAccess(SELECTED_PRODUCT.accessGrantId).catch(() => false);
  state.unlocked = state.checkoutGranted || localUnlocked || remoteUnlocked || state.adminUnlocked;

  renderPage({ unlocked: state.unlocked });
  renderCheckoutNotice({
    checkoutGranted: state.checkoutGranted,
    unlocked: state.unlocked,
    adminUnlocked: state.adminUnlocked,
  });
}

init();

window.addEventListener("af:languageChanged", () => {
  if (!SELECTED_PRODUCT) {
    return;
  }
  benefitsGrid.innerHTML = "";
  productTiers.innerHTML = "";
  renderPage({ unlocked: state.unlocked });
  renderCheckoutNotice({
    checkoutGranted: state.checkoutGranted,
    unlocked: state.unlocked,
    adminUnlocked: state.adminUnlocked,
  });
});
