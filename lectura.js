import { CATALOGO, PRODUCTO_ACTUAL } from "./producto-config.js";
import { applyCheckoutGrantFromUrl, hasAccess } from "./access-control.js";
import { resolveAccess, saveEntitlementForCurrentUser } from "./entitlements.js";
import { getCurrentLang, getProductI18n, t } from "./i18n.js";

const statusNode = document.getElementById("readingAccessStatus");
const lockedPanel = document.getElementById("lockedPanel");
const readerPanel = document.getElementById("readerPanel");
const readerContent = document.getElementById("readerContent");
const publicDescription = document.getElementById("publicDescription");
const publicPrologue = document.getElementById("publicPrologue");
const publicEpilogue = document.getElementById("publicEpilogue");

async function loadBook() {
  const lang = getCurrentLang();
  const localizedFile = `sombraenelespejo-${lang}.md`;

  let response = await fetch(localizedFile, { cache: "no-store" });
  if (!response.ok) {
    response = await fetch("sombraenelespejo.md", { cache: "no-store" });
  }

  if (!response.ok) {
    throw new Error(t("dynamic.lectura.loadError"));
  }

  return response.text();
}

function togglePanels(unlocked) {
  lockedPanel.classList.toggle("hidden", unlocked);
  readerPanel.classList.toggle("hidden", !unlocked);
}

function renderStatus(unlocked) {
  if (unlocked) {
    statusNode.textContent = t("dynamic.lectura.active");
    return;
  }

  statusNode.innerHTML = t("dynamic.lectura.pending");
}

function compact(lines) {
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function cut(text, max = 1300) {
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max).trim()}...`;
}

function extractPublicBlocks(text) {
  const lines = text.replace(/\r/g, "").split("\n");
  const prologueStart = lines.findIndex((line) => /^(PRÓLOGO|PROLOGO|PROLOGUE|PROLOG|前言):?/i.test(line.trim()));
  const indexStart = lines.findIndex(
    (line, index) => index > prologueStart && /^(ÍNDICE|INDICE|INDEX|INHALTSVERZEICHNIS|索引):?\s*$/i.test(line.trim()),
  );

  const epilogueStart = lines.findIndex((line) => /^(EPÍLOGO|EPILOGO|EPILOGUE|EPILOG|ÉPILOGUE|结语):?/i.test(line.trim()));
  const epilogueEnd = lines.findIndex(
    (line, index) => index > epilogueStart && /^\[\d+\]/.test(line.trim()),
  );

  const prologue =
    prologueStart !== -1 && indexStart !== -1
      ? compact(lines.slice(prologueStart, indexStart))
      : t("dynamic.lectura.noPrologue");

  const epilogue =
    epilogueStart !== -1
      ? compact(lines.slice(epilogueStart, epilogueEnd === -1 ? lines.length : epilogueEnd))
      : t("dynamic.lectura.noEpilogue");

  return {
    prologue: cut(prologue, 1700),
    epilogue: cut(epilogue, 1700),
  };
}

function renderPublicContent(sourceText) {
  const product = getProductI18n(getCurrentLang());
  publicDescription.textContent = product.publicDescription;
  const extracted = extractPublicBlocks(sourceText);
  publicPrologue.textContent = extracted.prologue;
  publicEpilogue.textContent = extracted.epilogue;
}

async function init() {
  const checkoutGranted = applyCheckoutGrantFromUrl({
    token: PRODUCTO_ACTUAL.accessGrantToken,
    grantId: PRODUCTO_ACTUAL.accessGrantId,
    accessParam: CATALOGO.accesoUrlParam,
    returnParam: CATALOGO.accesoRetornoUrlParam,
  });

  if (checkoutGranted) {
    saveEntitlementForCurrentUser(PRODUCTO_ACTUAL.accessGrantId).catch(() => {
      // Si no hay sesión o falla Firebase, el acceso local sigue vigente.
    });
  }

  let bookText = "";

  try {
    bookText = await loadBook();
    renderPublicContent(bookText);
  } catch (error) {
    const product = getProductI18n(getCurrentLang());
    publicDescription.textContent = product.publicDescription;
    publicPrologue.textContent = t("dynamic.lectura.prologueError", { message: error.message });
    publicEpilogue.textContent = t("dynamic.lectura.epilogueError", { message: error.message });
  }

  let unlocked = hasAccess(PRODUCTO_ACTUAL.accessGrantId);
  if (!unlocked) {
    unlocked = await resolveAccess(PRODUCTO_ACTUAL.accessGrantId);
  }

  renderStatus(unlocked);
  togglePanels(unlocked);

  if (!unlocked || !bookText) {
    return;
  }

  readerContent.textContent = bookText;
}

init();

window.addEventListener("af:languageChanged", () => {
  init();
});
