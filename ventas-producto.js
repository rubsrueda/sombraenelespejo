import { CATALOGO, PRODUCTO_ACTUAL } from "./producto-config.js";
import { applyCheckoutGrantFromUrl, hasAccess } from "./access-control.js";
import { resolveAccess, saveEntitlementForCurrentUser } from "./entitlements.js";
import { getCurrentLang, getProductI18n, t } from "./i18n.js";

const benefitsGrid = document.getElementById("benefitsGrid");
const productTiers = document.getElementById("productTiers");
const salesTransparencyText = document.getElementById("salesTransparencyText");
const productTitle = document.getElementById("productTitle");
const productSubtitle = document.getElementById("productSubtitle");
const accessStatus = document.getElementById("accessStatus");
const checkoutSetupHint = document.getElementById("checkoutSetupHint");

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

function createTierCard(item) {
  const localized = getProductI18n(getCurrentLang());
  const article = document.createElement("article");
  article.className = "sales-card card-reveal tier-card";

  const cta = item.enlaceCheckoutActivo
    ? `<a href="${item.enlaceCheckout}" target="_blank" rel="noopener noreferrer" class="btn-main btn-interact inline-flex">${t("common.actions.buyNow")}</a>`
    : `<button class="btn-secondary opacity-70 cursor-not-allowed" type="button" disabled>${t("dynamic.buy.setupCta")}</button>`;

  article.innerHTML = `
    <p class="tier-price">${formatPriceList(item)}</p>
    <h3 class="mt-0 mb-2 text-3xl">${localized.name}</h3>
    <p class="mb-4">${localized.description}</p>
    <p class="mb-4 text-sm text-slate-500">${t("dynamic.buy.grantedAccess")}: ${item.accessGrantId}</p>
    ${cta}
  `;

  return article;
}

function renderPage() {
  const localized = getProductI18n(getCurrentLang());
  const successUrl = new URL("ventas.html", window.location.href);
  successUrl.search = "";
  successUrl.hash = "";
  successUrl.searchParams.set(CATALOGO.accesoRetornoUrlParam, "success");

  const tokenUrl = new URL("ventas.html", window.location.href);
  tokenUrl.search = "";
  tokenUrl.hash = "";
  tokenUrl.searchParams.set(CATALOGO.accesoUrlParam, PRODUCTO_ACTUAL.accessGrantToken);

  productTitle.textContent = localized.name;
  productSubtitle.textContent = t("dynamic.buy.productSubtitle", { platform: PRODUCTO_ACTUAL.plataforma });

  // Enfoca la experiencia en un único producto de compra.
  benefitsGrid.innerHTML = "";
  benefitsGrid.classList.add("hidden");

  productTiers.appendChild(createTierCard(PRODUCTO_ACTUAL));

  salesTransparencyText.textContent = localized.transparency;
  checkoutSetupHint.innerHTML = t("dynamic.buy.checkoutHint", {
    successUrl: successUrl.toString(),
    tokenUrl: tokenUrl.toString(),
  });
}

function renderAccessStatus() {
  const unlocked = hasAccess(PRODUCTO_ACTUAL.accessGrantId);
  accessStatus.innerHTML = unlocked
    ? t("dynamic.buy.activeAccess")
    : t("dynamic.buy.pendingAccess");
}

const checkoutGranted = applyCheckoutGrantFromUrl({
  token: PRODUCTO_ACTUAL.accessGrantToken,
  grantId: PRODUCTO_ACTUAL.accessGrantId,
  accessParam: CATALOGO.accesoUrlParam,
  returnParam: CATALOGO.accesoRetornoUrlParam,
});

if (checkoutGranted) {
  saveEntitlementForCurrentUser(PRODUCTO_ACTUAL.accessGrantId).catch(() => {
    // Mantiene acceso local incluso si no hay sesión o falla la escritura remota.
  });
}

renderPage();
renderAccessStatus();

resolveAccess(PRODUCTO_ACTUAL.accessGrantId)
  .then((unlocked) => {
    accessStatus.innerHTML = unlocked
      ? t("dynamic.buy.activeAccess")
      : t("dynamic.buy.pendingAccess");
  })
  .catch(() => {
    renderAccessStatus();
  });

window.addEventListener("af:languageChanged", () => {
  benefitsGrid.innerHTML = "";
  productTiers.innerHTML = "";
  renderPage();
  renderAccessStatus();
});
