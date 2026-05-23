import { CATALOGO } from "./producto-config.js";
import { hasAccess } from "./access-control.js";
import { getCurrentUser, resolveAccess } from "./entitlements.js";
import { ADMIN_EMAILS } from "./admin-config.js";

const libraryGrid = document.getElementById("libraryGrid");
const libraryStatus = document.getElementById("libraryStatus");
const READING_PROGRESS_KEY = "sombra_reading_progress_v1";

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

function getSessionEmailFallback() {
  try {
    const keys = Object.keys(localStorage || {});
    const authKey = keys.find((key) => key.includes("-auth-token"));
    if (!authKey) return "";
    const raw = localStorage.getItem(authKey);
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return normalizeEmail(parsed?.user?.email || parsed?.currentSession?.user?.email || "");
  } catch {
    return "";
  }
}

function isAdminUser(user) {
  const email = normalizeEmail(user?.email) || getSessionEmailFallback();
  if (!email) return false;

  const allowList = ADMIN_EMAILS.map(normalizeEmail);
  if (allowList.includes(email)) return true;

  return hasAdminRole(user?.user_metadata?.role)
    || hasAdminRole(user?.user_metadata?.roles)
    || hasAdminRole(user?.app_metadata?.role)
    || hasAdminRole(user?.app_metadata?.roles);
}

function readProgress() {
  try {
    const raw = localStorage.getItem(READING_PROGRESS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function formatPriceList(item) {
  if (Array.isArray(item.precios) && item.precios.length > 0) {
    return item.precios.map((entry) => `${entry.valor} ${entry.moneda}`).join(" / ");
  }
  if (!item.precio) return "Próximamente disponible";
  return `${item.precio} ${item.moneda}`;
}

function createCard(item, ctx) {
  const { unlocked, progressLine } = ctx;
  const lecturaPath = item.lecturaPath || "lectura.html";
  const readHref = `${lecturaPath}?product=${encodeURIComponent(item.id)}${progressLine ? `&line=${progressLine}` : ""}`;
  const buyHref = `ventas.html?product=${encodeURIComponent(item.id)}`;

  const actions = unlocked
    ? `<a href="${readHref}" class="btn-main btn-interact inline-flex">${progressLine ? `Continuar (línea ${progressLine})` : "Leer ahora"}</a>
       <a href="${buyHref}" class="btn-secondary btn-interact inline-flex">Ver compra</a>`
    : item.enlaceCheckoutActivo
      ? `<a href="${buyHref}" class="btn-main btn-interact inline-flex">Comprar libro</a>`
      : `<span class="btn-secondary inline-flex opacity-50 cursor-default">Próximamente</span>`;

  const productParam = `?product=${encodeURIComponent(item.id)}`;
  const previews = `
    <a href="prologo.html${productParam}" class="btn-secondary btn-interact inline-flex text-sm">Prólogo</a>
    <a href="epilogo.html${productParam}" class="btn-secondary btn-interact inline-flex text-sm">Epílogo</a>
    <a href="resumen.html${productParam}" class="btn-secondary btn-interact inline-flex text-sm">Sinopsis</a>
  `;

  return `
    <article class="sales-card card-reveal">
      <h2 class="section-title">${item.nombre}</h2>
      <p class="mb-3">${item.descripcionPublica || item.descripcion || ""}</p>
      <p class="mb-4 text-sm text-slate-600">${formatPriceList(item)}</p>
      <div class="flex flex-wrap gap-2 mb-3">${actions}</div>
      <div class="flex flex-wrap gap-2">${previews}</div>
    </article>
  `;
}

async function initLibrary() {
  if (!libraryGrid) return;

  const user = await getCurrentUser().catch(() => null);
  const userEmail = normalizeEmail(user?.email) || getSessionEmailFallback() || "anon";
  const adminUnlocked = isAdminUser(user);
  const progressState = readProgress();

  const activos = CATALOGO.productos.filter((item) => item.activo);
  const cards = await Promise.all(activos.map(async (item) => {
    const localUnlocked = hasAccess(item.accessGrantId);
    const remoteUnlocked = await resolveAccess(item.accessGrantId).catch(() => false);
    const unlocked = adminUnlocked || localUnlocked || remoteUnlocked;
    const entryKey = `${item.accessGrantId}::${userEmail}`;
    const progressLine = progressState?.[entryKey]?.line || null;
    return createCard(item, { unlocked, progressLine });
  }));

  libraryGrid.innerHTML = cards.join("\n");

  if (!libraryStatus) return;
  if (adminUnlocked) {
    libraryStatus.textContent = `Acceso administrador activo (${userEmail}).`;
    return;
  }

  const unlockedCount = cards.filter((html) => html.includes("Leer ahora") || html.includes("Continuar")).length;
  libraryStatus.textContent = unlockedCount
    ? `Tienes ${unlockedCount} libro(s) con acceso activo.`
    : "No hay libros activos en tu biblioteca todavía. Puedes comprarlos desde esta página.";
}

initLibrary();
