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
const publicIndex = document.getElementById("publicIndex");
const publicBibliography = document.getElementById("publicBibliography");
const catalogList = document.getElementById("catalogList");
const readingProgressWrap = document.getElementById("readingProgressWrap");
const readingProgressBar = document.getElementById("readingProgressBar");
const readingProgressText = document.getElementById("readingProgressText");

const SECTION_ALIASES = {
  prologue: ["prologo", "prólogo", "prologue", "preface", "avantpropos", "vorwort", "前言"],
  index: ["indice", "índice", "index", "tableofcontents", "inhaltsverzeichnis", "目录"],
  epilogue: ["epilogo", "epílogo", "epilogue", "epilog", "epilogue", "结语"],
  bibliography: [
    "bibliografia",
    "bibliografía",
    "bibliography",
    "references",
    "referencias",
    "fuentes",
    "referencedocumental",
    "literaturverzeichnis",
    "参考文献",
  ],
};

const PROGRESS_SAVE_THROTTLE_MS = 700;

function normalizeHeading(text = "") {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[#*_`>\[\]()/\\:;,.!?-]/g, "")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
}

function compact(lines) {
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function cut(text, max = 6000) {
  if (text.length <= max) {
    return text;
  }

  return `${text.slice(0, max).trim()}...`;
}

function isLikelyHeading(line) {
  const trimmed = line.trim();
  if (!trimmed) {
    return false;
  }

  if (/^#{1,6}\s+/.test(trimmed)) {
    return true;
  }

  if (/^(cap[ií]tulo|chapter|parte|part|section|secci[oó]n)\s+/i.test(trimmed)) {
    return true;
  }

  return trimmed.length < 80 && /^(\d+\.?\s+)?[A-ZÁÉÍÓÚÑÜ\s]{4,}$/.test(trimmed);
}

function matchesAliases(line, aliases) {
  const normalized = normalizeHeading(line);
  return aliases.some((alias) => normalized.startsWith(normalizeHeading(alias)));
}

function findHeadingStart(lines, aliases) {
  return lines.findIndex((line) => matchesAliases(line, aliases));
}

function findNextHeading(lines, from) {
  for (let index = from + 1; index < lines.length; index += 1) {
    if (isLikelyHeading(lines[index])) {
      return index;
    }
  }

  return -1;
}

function getSection(lines, key) {
  const aliases = SECTION_ALIASES[key] || [];
  const start = findHeadingStart(lines, aliases);

  if (start === -1) {
    return "";
  }

  const end = key === "bibliography" ? lines.length : findNextHeading(lines, start);
  return compact(lines.slice(start, end === -1 ? lines.length : end));
}

function fallbackBibliography(lines) {
  const citationStart = lines.findIndex((line) => /^(\[\d+\]|\d+\.|•|-)\s+/.test(line.trim()));
  if (citationStart === -1) {
    return "";
  }

  const window = lines.slice(citationStart, Math.min(citationStart + 120, lines.length));
  const score = window.filter((line) => /(https?:\/\/|doi|isbn|editorial|press|vol\.|pp\.|\(\d{4}\))/.test(line.toLowerCase())).length;
  if (score < 3) {
    return "";
  }

  return compact(lines.slice(citationStart, Math.min(citationStart + 180, lines.length)));
}

function extractPublicBlocks(text) {
  const lines = text.replace(/\r/g, "").split("\n");

  const prologue = getSection(lines, "prologue") || t("dynamic.lectura.noPrologue");
  const epilogue = getSection(lines, "epilogue") || t("dynamic.lectura.noEpilogue");
  const indexBlock = getSection(lines, "index") || "Indice no disponible.";

  const bibliographyRaw = getSection(lines, "bibliography") || fallbackBibliography(lines);
  const bibliography = bibliographyRaw || "Bibliografia no disponible.";

  return {
    prologue: cut(prologue),
    epilogue: cut(epilogue),
    index: cut(indexBlock),
    bibliography: cut(bibliography),
  };
}

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

function renderPublicContent(sourceText) {
  const product = getProductI18n(getCurrentLang());
  publicDescription.textContent = product.publicDescription;
  const extracted = extractPublicBlocks(sourceText);
  publicPrologue.textContent = extracted.prologue;
  publicEpilogue.textContent = extracted.epilogue;
  publicIndex.textContent = extracted.index;
  publicBibliography.textContent = extracted.bibliography;
}

function renderMiniCatalog() {
  if (!catalogList) {
    return;
  }

  const activos = CATALOGO.productos.filter((item) => item.activo);
  if (!activos.length) {
    catalogList.innerHTML = "<p>No hay libros activos en este momento.</p>";
    return;
  }

  catalogList.innerHTML = activos
    .map((item) => {
      const precio = Array.isArray(item.precios) && item.precios.length
        ? item.precios.map((p) => `${p.valor} ${p.moneda}`).join(" / ")
        : `${item.precio} ${item.moneda}`;
      return `
        <article class="mini-book-card">
          <h3>${item.nombre}</h3>
          <p>${item.descripcionPublica || item.descripcion}</p>
          <p class="mini-book-price">${precio}</p>
          <a class="mini-book-link" href="ventas.html">Ver compra</a>
        </article>
      `;
    })
    .join("");
}

function getProgressStorageKey() {
  return `af:reading-progress:${PRODUCTO_ACTUAL.accessGrantId}:${getCurrentLang()}`;
}

function applyProgress(value) {
  if (!readingProgressWrap || !readingProgressBar || !readingProgressText) {
    return;
  }

  const safe = Math.max(0, Math.min(100, Math.round(value)));
  readingProgressWrap.classList.remove("hidden");
  readingProgressBar.style.width = `${safe}%`;
  readingProgressText.textContent = `${safe}% leido`;
}

function computeProgress() {
  if (!readerContent) {
    return 0;
  }

  const maxScroll = readerContent.scrollHeight - readerContent.clientHeight;
  if (maxScroll <= 0) {
    return 100;
  }

  return (readerContent.scrollTop / maxScroll) * 100;
}

function restoreProgress() {
  if (!readerContent) {
    return;
  }

  const raw = localStorage.getItem(getProgressStorageKey());
  const progress = raw ? Number.parseFloat(raw) : 0;
  if (!Number.isFinite(progress) || progress <= 0) {
    applyProgress(0);
    return;
  }

  const maxScroll = readerContent.scrollHeight - readerContent.clientHeight;
  readerContent.scrollTop = (Math.max(0, Math.min(100, progress)) / 100) * Math.max(0, maxScroll);
  applyProgress(progress);
}

function setupReadingProgress() {
  if (!readerContent) {
    return;
  }

  let lastSavedAt = 0;
  readerContent.addEventListener("scroll", () => {
    const now = Date.now();
    const progress = computeProgress();
    applyProgress(progress);

    if (now - lastSavedAt >= PROGRESS_SAVE_THROTTLE_MS) {
      localStorage.setItem(getProgressStorageKey(), String(progress));
      lastSavedAt = now;
    }
  });

  requestAnimationFrame(() => {
    restoreProgress();
    applyProgress(computeProgress());
  });
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
      // Si no hay sesion o falla la escritura remota, el acceso local sigue vigente.
    });
  }

  renderMiniCatalog();

  let bookText = "";
  try {
    bookText = await loadBook();
    renderPublicContent(bookText);
  } catch (error) {
    const product = getProductI18n(getCurrentLang());
    publicDescription.textContent = product.publicDescription;
    publicPrologue.textContent = t("dynamic.lectura.prologueError", { message: error.message });
    publicEpilogue.textContent = t("dynamic.lectura.epilogueError", { message: error.message });
    publicIndex.textContent = `Error al cargar indice: ${error.message}`;
    publicBibliography.textContent = `Error al cargar bibliografia: ${error.message}`;
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
  setupReadingProgress();
}

init();

window.addEventListener("af:languageChanged", () => {
  init();
});
