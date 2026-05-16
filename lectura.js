import { CATALOGO, PRODUCTO_ACTUAL } from "./producto-config.js";
import { applyCheckoutGrantFromUrl, hasAccess } from "./access-control.js";
import { getCurrentUser, saveEntitlementForCurrentUser } from "./entitlements.js";
import { ADMIN_EMAILS } from "./admin-config.js";
import { getCurrentLang, getProductI18n, t } from "./i18n.js";

const bookTitle = document.getElementById("bookTitle");
const bookDescription = document.getElementById("bookDescription");
const contentNav = document.getElementById("contentNav");
const contentPanel = document.getElementById("contentPanel");
const sectionContent = document.getElementById("sectionContent");
const statusNode = document.getElementById("readingAccessStatus");
const lockedPanel = document.getElementById("lockedPanel");
const catalogList = document.getElementById("catalogList");

const READING_PROGRESS_KEY = "sombra_reading_progress_v1";

const readingState = {
  availableTabs: [],
  activeTabId: null,
  sectionRanges: null,
  progressEntryKey: "anon",
  unlocked: false,
};

const SECTION_ALIASES = {
  prologue: ["prologo", "prólogo", "prologue", "preface", "avantpropos", "vorwort", "前言"],
  index: ["indice", "índice", "index", "tableofcontents", "inhaltsverzeichnis", "目录"],
  chapters: ["capitulo", "capítulo", "chapter", "capitulos", "capítulos", "chapters"],
  epilogue: ["epilogo", "epílogo", "epilogue", "epilog", "结语"],
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

function escapeHtml(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatInline(text = "") {
  const escaped = escapeHtml(text);
  return escaped
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function cut(text, max = 6000) {
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max).trim()}...`;
}

function isLikelyHeading(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/^#{1,6}\s+/.test(trimmed)) return true;
  if (/^(cap[ií]tulo|chapter|parte|part|section|secci[oó]n)\s+/i.test(trimmed)) return true;
  return trimmed.length < 80 && /^(\d+\.?\s+)?[A-ZÁÉÍÓÚÑÜ\s]{4,}$/.test(trimmed);
}

function matchesAliases(line, aliases) {
  const normalized = normalizeHeading(line);
  return aliases.some((alias) => normalized.startsWith(normalizeHeading(alias)));
}

function findHeadingStart(lines, aliases) {
  return lines.findIndex((line) => matchesAliases(line, aliases));
}

function findIndexByRegex(lines, regex, from = 0) {
  for (let index = from; index < lines.length; index += 1) {
    if (regex.test(lines[index])) {
      return index;
    }
  }
  return -1;
}

function findNthIndexByRegex(lines, regex, nth = 1, from = 0) {
  let matches = 0;
  for (let index = from; index < lines.length; index += 1) {
    if (regex.test(lines[index])) {
      matches += 1;
      if (matches === nth) {
        return index;
      }
    }
  }
  return -1;
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
  if (start === -1) return "";
  const end = key === "bibliography" ? lines.length : findNextHeading(lines, start);
  return compact(lines.slice(start, end === -1 ? lines.length : end));
}

function fallbackBibliography(lines) {
  const citationStart = lines.findIndex((line) => /^(\[\d+\]|\d+\.|•|-)\s+/.test(line.trim()));
  if (citationStart === -1) return "";
  const window = lines.slice(citationStart, Math.min(citationStart + 120, lines.length));
  const score = window.filter((line) => /(https?:\/\/|doi|isbn|editorial|press|vol\.|pp\.|\(\d{4}\))/.test(line.toLowerCase())).length;
  if (score < 3) return "";
  return compact(lines.slice(citationStart, Math.min(citationStart + 180, lines.length)));
}

function extractStageBounds(lines) {
  const markerRegex = /<!--\s*STAGE:\s*([A-ZÁÉÍÓÚ_]+)\s*(START|END)\s*-->/i;
  const bounds = new Map();

  lines.forEach((line, index) => {
    const match = line.match(markerRegex);
    if (!match) {
      return;
    }
    const stage = match[1].toUpperCase();
    const edge = match[2].toUpperCase();

    if (!bounds.has(stage)) {
      bounds.set(stage, { start: -1, end: -1 });
    }
    const node = bounds.get(stage);
    if (edge === "START") {
      node.start = index;
    }
    if (edge === "END") {
      node.end = index;
    }
  });

  return bounds;
}

function stageSlice(lines, bounds, stageName) {
  const node = bounds.get(stageName);
  if (!node || node.start < 0 || node.end <= node.start) {
    return "";
  }
  return compact(lines.slice(node.start + 1, node.end));
}

function extractSections(text) {
  const lines = text.replace(/\r/g, "").split("\n");

  const markerBounds = extractStageBounds(lines);
  const markedPrologue = stageSlice(lines, markerBounds, "PROLOGO");
  const markedIndex = stageSlice(lines, markerBounds, "INDICE");
  const markedChapters = stageSlice(lines, markerBounds, "CAPITULOS");
  const markedBibliography = stageSlice(lines, markerBounds, "BIBLIOGRAFIA");
  const markedEpilogue = stageSlice(lines, markerBounds, "EPILOGO");

  const rangeFromStage = (name) => {
    const node = markerBounds.get(name);
    if (!node || node.start < 0 || node.end <= node.start) {
      return null;
    }
    return {
      start: node.start + 2,
      end: node.end,
    };
  };

  if (markedPrologue || markedIndex || markedChapters || markedBibliography || markedEpilogue) {
    return {
      prologue: markedPrologue || t("dynamic.lectura.noPrologue"),
      chapters: markedChapters || t("dynamic.lectura.noChapters"),
      epilogue: markedEpilogue || t("dynamic.lectura.noEpilogue"),
      index: markedIndex || "Índice no disponible.",
      bibliography: markedBibliography || "Bibliografía no disponible.",
      _meta: {
        ranges: {
          prologue: rangeFromStage("PROLOGO"),
          index: rangeFromStage("INDICE"),
          chapters: rangeFromStage("CAPITULOS"),
          bibliography: rangeFromStage("BIBLIOGRAFIA"),
          epilogue: rangeFromStage("EPILOGO"),
        },
      },
    };
  }

  const prologueStart = findIndexByRegex(lines, /^(\*\*\s*)?PR[ÓO]LOGO:/i);
  const indexStart = findIndexByRegex(lines, /^[ÍI]ndice:\s*$/i, Math.max(0, prologueStart));
  const firstPartBodyStart = findNthIndexByRegex(lines, /^(\*\*\s*)?PARTE\s+I:/i, 2, Math.max(0, indexStart));
  const bibliographyStart = findIndexByRegex(lines, /^###\s*\*\*Bibliograf[íi]a Consultada\*\*\s*$/i);
  const epilogueStart = findIndexByRegex(lines, /^(\*\*\s*)?Ep[íi]logo:/i, Math.max(0, bibliographyStart));

  const safeSlice = (start, end) => {
    if (start < 0) return "";
    const endIndex = end > start ? end : lines.length;
    return compact(lines.slice(start, endIndex));
  };

  const prologue = safeSlice(prologueStart, indexStart);
  const index = safeSlice(indexStart, firstPartBodyStart);
  const chapters = safeSlice(firstPartBodyStart, bibliographyStart);
  const bibliography = safeSlice(bibliographyStart, epilogueStart);
  const epilogue = safeSlice(epilogueStart, lines.length);

  if (prologue || index || chapters || bibliography || epilogue) {
    return {
      prologue: prologue || t("dynamic.lectura.noPrologue"),
      chapters: chapters || t("dynamic.lectura.noChapters"),
      epilogue: epilogue || t("dynamic.lectura.noEpilogue"),
      index: index || "Índice no disponible.",
      bibliography: bibliography || "Bibliografía no disponible.",
    };
  }

  return {
    prologue: getSection(lines, "prologue") || t("dynamic.lectura.noPrologue"),
    chapters: getSection(lines, "chapters") || t("dynamic.lectura.noChapters"),
    epilogue: getSection(lines, "epilogue") || t("dynamic.lectura.noEpilogue"),
    index: getSection(lines, "index") || "Índice no disponible.",
    bibliography: getSection(lines, "bibliography") || fallbackBibliography(lines) || "Bibliografía no disponible.",
    _meta: {
      ranges: null,
    },
  };
}

function cleanHeading(raw = "") {
  return raw
    .replace(/^#{1,6}\s+/, "")
    .replace(/^[-*]\s+/, "")
    .replace(/^\*\*\s*/, "")
    .replace(/\s*\*\*$/, "")
    .trim();
}

function renderSectionContent(tab) {
  const sectionId = tab?.id || "chapters";
  const source = String(tab?.content || "").trim();
  const blocks = source
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  const articleParts = [];
  let insideChapter = false;
  let phaseNarrativeShown = false;
  let phaseAnalysisShown = false;
  let phaseMirrorShown = false;

  blocks.forEach((block, index) => {
    const blockLines = block.split("\n");
    const firstLine = blockLines[0]?.trim() || "";
    const remainingLines = blockLines.slice(1).join("\n").trim();
    const normalized = cleanHeading(firstLine);
    const compactBlock = block.replace(/\n+/g, " ").trim();
    const formattedCompact = formatInline(compactBlock);

    if (index === 0) {
      articleParts.push(`<h2 class="reading-stage-main-title">${formatInline(normalized || tab.label)}</h2>`);
      if (remainingLines) {
        articleParts.push(`<p class="reading-paragraph">${formatInline(remainingLines.replace(/\n+/g, " "))}</p>`);
      }
      return;
    }

    if (/^#{1,6}\s+/.test(firstLine)) {
      articleParts.push(`<h3 class="reading-subtitle">${formatInline(cleanHeading(firstLine))}</h3>`);
      return;
    }

    if (/^(parte|part)\b/i.test(normalized)) {
      articleParts.push(`<h3 class="reading-part-title">${formatInline(normalized)}</h3>`);
      if (remainingLines) {
        articleParts.push(`<p class="reading-paragraph">${formatInline(remainingLines.replace(/\n+/g, " "))}</p>`);
      }
      return;
    }

    if (/^(cap[ií]tulo|chapter|secci[oó]n|ep[ií]logo|pr[oó]logo)\b/i.test(normalized)) {
      articleParts.push(`<h3 class="reading-chapter-title">${formatInline(normalized)}</h3>`);
      insideChapter = /^cap[ií]tulo\b/i.test(normalized);
      phaseNarrativeShown = false;
      phaseAnalysisShown = false;
      phaseMirrorShown = false;
      const remainder = block
        .split("\n")
        .slice(1)
        .join("\n")
        .trim();
      if (remainder) {
        articleParts.push(`<p class="reading-paragraph">${formatInline(remainder.replace(/\n+/g, " "))}</p>`);
      }
      return;
    }

    if (sectionId === "chapters" && /^\d+\.\d+\.\s+/.test(normalized)) {
      if (insideChapter && !phaseAnalysisShown) {
        articleParts.push('<h4 class="reading-phase-title">Fase 2: Análisis</h4>');
        phaseAnalysisShown = true;
      }
      articleParts.push(`<h4 class="reading-point-title">${formatInline(normalized)}</h4>`);
      if (remainingLines) {
        articleParts.push(`<p class="reading-paragraph">${formatInline(remainingLines.replace(/\n+/g, " "))}</p>`);
      }
      return;
    }

    if (sectionId === "chapters" && /^\[bloque:/i.test(firstLine)) {
      if (insideChapter && !phaseMirrorShown) {
        articleParts.push('<h4 class="reading-phase-title">Fase 3: Bloque Espejo</h4>');
        phaseMirrorShown = true;
      }
      articleParts.push(`<h4 class="reading-mirror-title">${formatInline(firstLine)}</h4>`);
      if (remainingLines) {
        articleParts.push(`<p class="reading-paragraph">${formatInline(remainingLines.replace(/\n+/g, " "))}</p>`);
      }
      return;
    }

    if (sectionId === "chapters" && insideChapter && !phaseAnalysisShown && !phaseMirrorShown && !phaseNarrativeShown) {
      articleParts.push('<h4 class="reading-phase-title">Fase 1: Viñeta / Narración</h4>');
      phaseNarrativeShown = true;
    }

    if (sectionId === "index" && /^(\d+[\.)]|cap[ií]tulo\s+\d+)/i.test(normalized)) {
      articleParts.push(`<p class="reading-index-item">${formattedCompact}</p>`);
      return;
    }

    if (sectionId === "bibliography" && /^(\[\d+\]|\d+[\.)]|•|-)\s+/.test(firstLine)) {
      articleParts.push(`<p class="reading-biblio-item">${formatInline(block.replace(/\n+/g, " "))}</p>`);
      return;
    }

    articleParts.push(`<p class="reading-paragraph">${formattedCompact}</p>`);
  });

  return `
    <article class="reading-body stage-${sectionId}">
      <header class="reading-stage-header">
        <p class="reading-stage-kicker">Etapa</p>
        <h2 class="reading-stage-title">${formatInline(tab.label)}</h2>
      </header>
      ${articleParts.join("\n")}
    </article>
  `;
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

function renderStatus(unlocked, isAdmin) {
  if (unlocked) {
    statusNode.textContent = isAdmin
      ? "Acceso administrador activo. Contenido completo habilitado."
      : t("dynamic.lectura.active");
    return;
  }
  statusNode.innerHTML = t("dynamic.lectura.pending");
}

function renderMiniCatalog() {
  if (!catalogList) return;
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
          <p class="small-text">${precio}</p>
        </article>
      `;
    })
    .join("");
}

function readProgressState() {
  try {
    const raw = localStorage.getItem(READING_PROGRESS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function writeProgressState(state) {
  try {
    localStorage.setItem(READING_PROGRESS_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures.
  }
}

function getLineRatioFromScroll() {
  const rect = sectionContent.getBoundingClientRect();
  const sectionTop = window.scrollY + rect.top - 120;
  const maxScrollable = Math.max(1, sectionContent.offsetHeight - window.innerHeight * 0.55);
  const ratio = (window.scrollY - sectionTop) / maxScrollable;
  return Math.max(0, Math.min(1, ratio));
}

function estimateLineForActiveTab() {
  const ranges = readingState.sectionRanges;
  const tabId = readingState.activeTabId;
  if (!ranges || !tabId || !ranges[tabId]) {
    return null;
  }
  const range = ranges[tabId];
  const ratio = getLineRatioFromScroll();
  return Math.round(range.start + ratio * Math.max(0, range.end - range.start));
}

function saveReadingProgress() {
  if (!readingState.unlocked || !readingState.progressEntryKey || !readingState.activeTabId) {
    return;
  }

  const state = readProgressState();
  state[readingState.progressEntryKey] = {
    tabId: readingState.activeTabId,
    ratio: getLineRatioFromScroll(),
    line: estimateLineForActiveTab(),
    savedAt: new Date().toISOString(),
  };
  writeProgressState(state);
}

function restoreReadingProgress() {
  if (!readingState.progressEntryKey) {
    return null;
  }
  const state = readProgressState();
  return state[readingState.progressEntryKey] || null;
}

function tabIdForLine(line) {
  const ranges = readingState.sectionRanges;
  if (!ranges || !Number.isFinite(line)) {
    return null;
  }

  const entries = Object.entries(ranges);
  const found = entries.find(([, range]) => range && line >= range.start && line <= range.end);
  return found ? found[0] : null;
}

function ratioForLine(tabId, line) {
  const range = readingState.sectionRanges?.[tabId];
  if (!range || !Number.isFinite(line) || range.end <= range.start) {
    return 0;
  }
  return Math.max(0, Math.min(1, (line - range.start) / (range.end - range.start)));
}

function scrollToRatio(ratio = 0) {
  const rect = sectionContent.getBoundingClientRect();
  const sectionTop = window.scrollY + rect.top - 120;
  const maxScrollable = Math.max(1, sectionContent.offsetHeight - window.innerHeight * 0.55);
  const targetTop = sectionTop + ratio * maxScrollable;
  window.scrollTo({ top: targetTop, behavior: "auto" });
}

async function init() {
  try {
    if (!PRODUCTO_ACTUAL) {
      console.error("PRODUCTO_ACTUAL no está disponible");
      return;
    }

    const checkoutGranted = applyCheckoutGrantFromUrl({
      token: PRODUCTO_ACTUAL.accessGrantToken,
      grantId: PRODUCTO_ACTUAL.accessGrantId,
      accessParam: CATALOGO.accesoUrlParam,
      returnParam: CATALOGO.accesoRetornoUrlParam,
    });
    const user = await getCurrentUser().catch(() => null);
    const adminUnlocked = isAdminUser(user);
    const unlocked = checkoutGranted || hasAccess(PRODUCTO_ACTUAL.accessGrantId) || adminUnlocked;
    const userKey = normalizeEmail(user?.email) || getSessionEmailFallback() || "anon";
    readingState.progressEntryKey = `${PRODUCTO_ACTUAL.accessGrantId}::${userKey}`;
    readingState.unlocked = unlocked;

    if (checkoutGranted) {
      saveEntitlementForCurrentUser(PRODUCTO_ACTUAL.accessGrantId).catch(() => {
        // Mantiene acceso local aunque falle la escritura remota.
      });
    }

    renderStatus(unlocked, adminUnlocked);

    // Cargar datos del producto
    const product = getProductI18n(getCurrentLang());
    bookTitle.textContent = product.nombre;
    bookDescription.textContent = product.publicDescription;

    // Cargar libro y extraer secciones
    const sourceText = await loadBook();
    const sections = extractSections(sourceText);
    readingState.sectionRanges = sections?._meta?.ranges || null;

    // Definir navegación disponible
    const availableTabs = [
      { id: "prologue", label: "Prólogo", content: sections.prologue },
      { id: "index", label: "Índice", content: sections.index },
    ];

    // Capítulos solo si tiene acceso
    if (unlocked) {
      availableTabs.push({ id: "chapters", label: "Capítulos", content: sections.chapters });
    }

    // Agregar el resto
    availableTabs.push(
      { id: "bibliography", label: "Bibliografía", content: sections.bibliography },
      { id: "epilogue", label: "Epílogo", content: sections.epilogue }
    );
    readingState.availableTabs = availableTabs;

    function renderTabById(tabId) {
      const tab = availableTabs.find((item) => item.id === tabId) || availableTabs[0];
      readingState.activeTabId = tab.id;

      const tabButtons = document.querySelectorAll(".tab-btn");
      tabButtons.forEach((btn) => {
        btn.classList.toggle("active", btn.getAttribute("data-tab") === tab.id);
      });

      sectionContent.innerHTML = renderSectionContent(tab);
      return tab;
    }

    // Renderizar tabs
    contentNav.innerHTML = availableTabs
      .map((tab, idx) => `
        <button class="tab-btn ${idx === 0 ? "active" : ""}" data-tab="${tab.id}">
          ${tab.label}
        </button>
      `)
      .join("");

    const url = new URL(window.location.href);
    const requestedLine = Number(url.searchParams.get("line"));
    const savedProgress = restoreReadingProgress();

    let targetTabId = availableTabs[0].id;
    let targetRatio = 0;

    if (Number.isFinite(requestedLine) && requestedLine > 0) {
      const lineTabId = tabIdForLine(requestedLine);
      if (lineTabId) {
        targetTabId = lineTabId;
        targetRatio = ratioForLine(lineTabId, requestedLine);
      }
    } else if (savedProgress?.tabId && availableTabs.some((tab) => tab.id === savedProgress.tabId)) {
      targetTabId = savedProgress.tabId;
      targetRatio = Number(savedProgress.ratio) || 0;
    }

    renderTabById(targetTabId);

    // Event listeners para tabs
    const tabButtons = document.querySelectorAll(".tab-btn");
    tabButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const tabId = btn.getAttribute("data-tab");
        renderTabById(tabId);
        scrollToRatio(0);
        saveReadingProgress();
      });
    });

    // Mostrar/ocultar paneles según acceso
    if (!unlocked) {
      contentPanel.classList.add("hidden");
      contentNav.classList.add("hidden");
      lockedPanel.classList.remove("hidden");
      renderMiniCatalog();
    } else {
      contentPanel.classList.remove("hidden");
      contentNav.classList.remove("hidden");
      lockedPanel.classList.add("hidden");

      // Restore scroll position after initial render.
      setTimeout(() => {
        scrollToRatio(targetRatio);
      }, 30);

      let saveTimer = null;
      window.addEventListener("scroll", () => {
        if (saveTimer) {
          clearTimeout(saveTimer);
        }
        saveTimer = setTimeout(() => {
          saveReadingProgress();
        }, 250);
      }, { passive: true });

      window.addEventListener("beforeunload", () => {
        saveReadingProgress();
      });
    }
  } catch (error) {
    console.error("Error cargando lectura:", error);
    sectionContent.innerHTML = `<p class="reading-paragraph">${escapeHtml(error.message || "Error cargando el contenido.")}</p>`;
  }
}

document.addEventListener("DOMContentLoaded", init);
