import { CATALOGO, PRODUCTO_ACTUAL } from "./producto-config.js";
import { applyCheckoutGrantFromUrl, hasAccess } from "./access-control.js";
import { getCurrentUser, resolveAccess, saveEntitlementForCurrentUser } from "./entitlements.js";
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
const lockedBuyLink = document.getElementById("lockedBuyLink");
const audioBookControls = document.getElementById("audioBookControls");
const audioPlayBtn = document.getElementById("audioPlayBtn");
const audioPauseBtn = document.getElementById("audioPauseBtn");
const audioStopBtn = document.getElementById("audioStopBtn");
const audioBookStatus = document.getElementById("audioBookStatus");
const audioBookHint = document.getElementById("audioBookHint");
const audioStateValue = document.getElementById("audioStateValue");
const audioChunkValue = document.getElementById("audioChunkValue");
const audioWordsValue = document.getElementById("audioWordsValue");
const audioTimeValue = document.getElementById("audioTimeValue");
const savePositionBtn = document.getElementById("savePositionBtn");
const continuePositionBtn = document.getElementById("continuePositionBtn");
const clearPositionBtn = document.getElementById("clearPositionBtn");
const readingPageInput = document.getElementById("readingPageInput");
const goToPageBtn = document.getElementById("goToPageBtn");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const readingSegmentInput = document.getElementById("readingSegmentInput");
const goToSegmentBtn = document.getElementById("goToSegmentBtn");
const prevSegmentBtn = document.getElementById("prevSegmentBtn");
const nextSegmentBtn = document.getElementById("nextSegmentBtn");
const readingPositionInfo = document.getElementById("readingPositionInfo");

const READING_PROGRESS_KEY = "sombra_reading_progress_v1";

const readingState = {
  availableTabs: [],
  activeTabId: null,
  sectionRanges: null,
  progressEntryKey: "anon",
  unlocked: false,
  renderTabById: null,
  words: [],
  currentPage: 1,
  currentSegment: 1,
  totalPages: 1,
  totalSegments: 1,
  currentView: "page",
  renderPage: null,
  renderSegment: null,
};

const MAX_TTS_CHUNK = 260;
const WORDS_PER_PAGE = 220;
const WORDS_PER_SEGMENT = 400;
const PREVIEW_WORDS = 400;

const audioState = {
  supported:
    typeof window !== "undefined"
    && "speechSynthesis" in window
    && "SpeechSynthesisUtterance" in window,
  voice: null,
  chunks: [],
  chunkIndex: 0,
  speaking: false,
  paused: false,
  sourceText: "",
};

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

function extractChapters(chaptersText) {
  const lines = chaptersText.replace(/\r/g, "").split("\n");
  const chapters = [];
  
  // Regex para detectar líneas que inician un capítulo: "### Capítulo N:" o "### Chapter N:"
  const chapterRegex = /^#+\s*(?:Capítulo|Capitulo|Chapter|Cap\.?|Kap\.?)\s+(\d+)[:\s]/i;
  
  let currentChapter = null;
  let currentContent = [];
  
  lines.forEach((line, index) => {
    const match = line.match(chapterRegex);
    
    if (match) {
      // Guardamos el capítulo anterior si existe
      if (currentChapter !== null) {
        chapters.push({
          number: currentChapter.number,
          label: currentChapter.label,
          id: `chapter-${currentChapter.number}`,
          content: compact(currentContent),
        });
      }
      
      // Extraer número y título del capítulo
      const chapterNum = parseInt(match[1], 10);
      const fullLine = line.trim();
      
      currentChapter = {
        number: chapterNum,
        label: fullLine.replace(/^#+\s*/, "").replace(/:.*$/, "").trim() || `Capítulo ${chapterNum}`,
      };
      currentContent = [line];
    } else if (currentChapter !== null) {
      currentContent.push(line);
    }
  });
  
  // Guardar el último capítulo
  if (currentChapter !== null) {
    chapters.push({
      number: currentChapter.number,
      label: currentChapter.label,
      id: `chapter-${currentChapter.number}`,
      content: compact(currentContent),
    });
  }
  
  return chapters;
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

function plainTextFromMarkdown(text = "") {
  return String(text)
    .replace(/\r/g, "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<a\b[^>]*>(.*?)<\/a>/gi, " $1 ")
    .replace(/<\/?[^>]+>/g, " ")
    .split("\n")
    .map((line) => line
      .replace(/^#{1,6}\s+/, "")
      .replace(/^>\s?/, "")
      .replace(/^[-*+]\s+/, "")
      .replace(/^\d+[\.)]\s+/, "")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitWords(text = "") {
  return String(text).split(/\s+/).filter(Boolean);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getWordsSlice(words = [], start = 0, amount = WORDS_PER_PAGE) {
  if (!Array.isArray(words) || !words.length) {
    return [];
  }
  const safeStart = clamp(start, 0, Math.max(0, words.length - 1));
  const safeEnd = clamp(safeStart + amount, safeStart + 1, words.length);
  return words.slice(safeStart, safeEnd);
}

function chunkText(words = []) {
  if (!words.length) {
    return "";
  }
  const text = words.join(" ").trim();
  const chunks = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  return chunks
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `<p class="reading-paragraph">${escapeHtml(part)}</p>`)
    .join("");
}

function renderReadingChunk({ title, words, isPreview = false }) {
  const body = chunkText(words);
  const previewNotice = isPreview
    ? '<p class="reading-paragraph"><strong>Vista previa:</strong> desbloquea el acceso para leer el libro completo.</p>'
    : "";
  return `
    <article class="reading-body stage-chapters">
      <header class="reading-stage-header">
        <p class="reading-stage-kicker">Lectura continua</p>
        <h2 class="reading-stage-title">${escapeHtml(title)}</h2>
      </header>
      ${previewNotice}
      ${body || '<p class="reading-paragraph">No hay contenido disponible.</p>'}
    </article>
  `;
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

  const pushStructuredLines = (text = "") => {
    const lines = String(text)
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    lines.forEach((line) => {
      if (/^#{1,6}\s+/.test(line)) {
        articleParts.push(`<h4 class="reading-subtitle">${formatInline(cleanHeading(line))}</h4>`);
        return;
      }

      if (/^>\s?/.test(line)) {
        articleParts.push(`<p class="reading-paragraph">${formatInline(line.replace(/^>\s?/, ""))}</p>`);
        return;
      }

      if (/^[-*]\s+/.test(line)) {
        articleParts.push(`<p class="reading-paragraph">• ${formatInline(line.replace(/^[-*]\s+/, ""))}</p>`);
        return;
      }

      if (/^\d+[\.)]\s+/.test(line)) {
        articleParts.push(`<p class="reading-paragraph">${formatInline(line)}</p>`);
        return;
      }

      articleParts.push(`<p class="reading-paragraph">${formatInline(line)}</p>`);
    });
  };

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
        pushStructuredLines(remainingLines);
      }
      return;
    }

    if (/^#{1,6}\s+/.test(firstLine)) {
      articleParts.push(`<h3 class="reading-subtitle">${formatInline(cleanHeading(firstLine))}</h3>`);
      if (remainingLines) {
        pushStructuredLines(remainingLines);
      }
      return;
    }

    if (/^(parte|part)\b/i.test(normalized)) {
      articleParts.push(`<h3 class="reading-part-title">${formatInline(normalized)}</h3>`);
      if (remainingLines) {
        pushStructuredLines(remainingLines);
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
        pushStructuredLines(remainder);
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
        pushStructuredLines(remainingLines);
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
        pushStructuredLines(remainingLines);
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

async function loadBook(product) {
  const lang = getCurrentLang();
  const sourceFile = product?.archivoContenido || "sombraenelespejo.md";
  const extensionIndex = sourceFile.lastIndexOf(".");
  const baseName = extensionIndex > 0 ? sourceFile.slice(0, extensionIndex) : sourceFile;
  const extension = extensionIndex > 0 ? sourceFile.slice(extensionIndex) : ".md";
  const localizedFile = `${baseName}-${lang}${extension}`;
  let response = await fetch(localizedFile, { cache: "no-store" });
  if (!response.ok) {
    response = await fetch(sourceFile, { cache: "no-store" });
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
  statusNode.innerHTML = "Modo vista previa gratuito activo. Para desbloquear capítulos completos, compra este libro.";
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
  if (!readingState.progressEntryKey) {
    return;
  }

  const state = readProgressState();
  state[readingState.progressEntryKey] = {
    page: readingState.currentPage,
    segment: readingState.currentSegment,
    view: readingState.currentView || "page",
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

function clearReadingProgress() {
  if (!readingState.progressEntryKey) {
    return;
  }
  const state = readProgressState();
  delete state[readingState.progressEntryKey];
  writeProgressState(state);
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

function getShareableUrl() {
  const baseUrl = new URL(window.location.origin + window.location.pathname);
  const product = SELECTED_PRODUCT?.id;
  
  if (product) {
    baseUrl.searchParams.set("product", product);
  }
  baseUrl.searchParams.set("page", String(readingState.currentPage || 1));
  baseUrl.searchParams.set("segment", String(readingState.currentSegment || 1));
  return baseUrl.toString();
}

function updateAudioStatus(message) {
  if (!audioBookStatus) {
    return;
  }
  audioBookStatus.textContent = message;
}

function updateAudioHint(message) {
  if (!audioBookHint) {
    return;
  }
  audioBookHint.textContent = message;
}

function updateAudioMeta({ stateLabel = "En espera", chunkIndex = 0, totalChunks = 0, words = 0, minutes = 0 } = {}) {
  if (audioStateValue) audioStateValue.textContent = stateLabel;
  if (audioChunkValue) audioChunkValue.textContent = `${chunkIndex} / ${totalChunks}`;
  if (audioWordsValue) audioWordsValue.textContent = String(words);
  if (audioTimeValue) audioTimeValue.textContent = `${minutes} min`;
}

function updateAudioButtons() {
  if (!audioPlayBtn || !audioPauseBtn || !audioStopBtn) {
    return;
  }
  if (!audioState.supported) {
    audioPlayBtn.disabled = true;
    audioPauseBtn.disabled = true;
    audioStopBtn.disabled = true;
    return;
  }
  const canPause = audioState.speaking || audioState.paused;
  const canStop = audioState.speaking || audioState.paused;
  audioPauseBtn.disabled = !canPause;
  audioStopBtn.disabled = !canStop;
  audioPauseBtn.textContent = audioState.paused ? "⏯️ Reanudar" : "⏸️ Pausar";
}

function cleanNarrationText(text = "") {
  return String(text)
    .replace(/\s+/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
}

function isNodeInsideSection(node) {
  if (!sectionContent || !node) {
    return false;
  }
  if (node === sectionContent) {
    return true;
  }
  return sectionContent.contains(node.nodeType === Node.TEXT_NODE ? node.parentNode : node);
}

function getTextFromCursorToEnd(range) {
  if (!sectionContent || !range) {
    return "";
  }
  const cursorRange = range.cloneRange();
  cursorRange.setEnd(sectionContent, sectionContent.childNodes.length);
  return cleanNarrationText(cursorRange.toString());
}

function getNarrationSourceText() {
  const fullText = cleanNarrationText(sectionContent?.innerText || "");
  const selection = window.getSelection?.();
  if (!selection || !selection.rangeCount) {
    return fullText;
  }

  const range = selection.getRangeAt(0);
  if (!isNodeInsideSection(range.commonAncestorContainer)) {
    return fullText;
  }

  const selectedText = cleanNarrationText(selection.toString());
  if (selectedText) {
    return selectedText;
  }

  if (!range.collapsed) {
    return fullText;
  }

  const fromCursor = getTextFromCursorToEnd(range);
  return fromCursor || fullText;
}

function estimateNarrationMeta(chunks = [], sourceText = "") {
  const words = sourceText ? sourceText.split(/\s+/).filter(Boolean).length : 0;
  const minutes = words ? Math.max(1, Math.round(words / 150)) : 0;
  return {
    words,
    minutes,
    totalChunks: chunks.length,
  };
}

function splitNarrationText(text, maxLength = MAX_TTS_CHUNK) {
  const normalized = cleanNarrationText(text);
  if (!normalized) {
    return [];
  }

  const pieces = normalized.match(/[^.!?;:,]+[.!?;:,]?|.+$/g) || [normalized];
  const chunks = [];
  let buffer = "";

  pieces.forEach((piece) => {
    const part = piece.trim();
    if (!part) {
      return;
    }

    if (part.length > maxLength) {
      if (buffer) {
        chunks.push(buffer.trim());
        buffer = "";
      }
      const words = part.split(" ");
      let wordBuffer = "";
      words.forEach((word) => {
        const candidate = wordBuffer ? `${wordBuffer} ${word}` : word;
        if (candidate.length <= maxLength) {
          wordBuffer = candidate;
        } else {
          if (wordBuffer) {
            chunks.push(wordBuffer.trim());
          }
          wordBuffer = word;
        }
      });
      if (wordBuffer) {
        chunks.push(wordBuffer.trim());
      }
      return;
    }

    const candidate = buffer ? `${buffer} ${part}` : part;
    if (candidate.length <= maxLength) {
      buffer = candidate;
    } else {
      chunks.push(buffer.trim());
      buffer = part;
    }
  });

  if (buffer) {
    chunks.push(buffer.trim());
  }

  return chunks.filter(Boolean);
}

function findBestSpanishVoice() {
  if (!audioState.supported) {
    return null;
  }
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) {
    return null;
  }

  const spanishVoices = voices.filter((voice) => String(voice.lang || "").toLowerCase().startsWith("es"));
  if (!spanishVoices.length) {
    return voices[0] || null;
  }

  const maleHints = ["male", "hombre", "jorge", "pablo", "julio", "diego", "carlos", "enrique", "antonio"];
  const hinted = spanishVoices.find((voice) => {
    const name = String(voice.name || "").toLowerCase();
    return maleHints.some((hint) => name.includes(hint));
  });

  return hinted || spanishVoices[0];
}

function syncVoice() {
  audioState.voice = findBestSpanishVoice();
}

function stopNarration({ silent = false } = {}) {
  if (!audioState.supported) {
    return;
  }
  window.speechSynthesis.cancel();
  audioState.speaking = false;
  audioState.paused = false;
  audioState.chunkIndex = 0;
  audioState.chunks = [];
  audioState.sourceText = "";
  updateAudioMeta({ stateLabel: "En espera", chunkIndex: 0, totalChunks: 0, words: 0, minutes: 0 });
  if (!silent) {
    updateAudioStatus("Sin lectura activa.");
    updateAudioHint("Listo.");
  }
  updateAudioButtons();
}

function speakChunk(index) {
  if (!audioState.supported) {
    return;
  }
  const chunk = audioState.chunks[index];
  if (!chunk) {
    const meta = estimateNarrationMeta(audioState.chunks, audioState.sourceText);
    audioState.speaking = false;
    audioState.paused = false;
    audioState.chunkIndex = 0;
    updateAudioMeta({
      stateLabel: "En espera",
      chunkIndex: meta.totalChunks,
      totalChunks: meta.totalChunks,
      words: meta.words,
      minutes: meta.minutes,
    });
    updateAudioStatus("Sin lectura activa.");
    updateAudioHint("Lectura completada.");
    updateAudioButtons();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(chunk);
  utterance.lang = "es-ES";
  utterance.rate = 1.2;
  utterance.pitch = 1;
  if (audioState.voice) {
    utterance.voice = audioState.voice;
  }

  utterance.onend = () => {
    if (audioState.paused) {
      return;
    }
    audioState.chunkIndex += 1;
    const meta = estimateNarrationMeta(audioState.chunks, audioState.sourceText);
    updateAudioMeta({
      stateLabel: "Escuchando",
      chunkIndex: Math.min(meta.totalChunks, audioState.chunkIndex + 1),
      totalChunks: meta.totalChunks,
      words: meta.words,
      minutes: meta.minutes,
    });
    speakChunk(audioState.chunkIndex);
  };

  utterance.onerror = () => {
    audioState.speaking = false;
    audioState.paused = false;
    updateAudioMeta({ stateLabel: "En espera", chunkIndex: 0, totalChunks: 0, words: 0, minutes: 0 });
    updateAudioStatus("Sin lectura activa.");
    updateAudioHint("No fue posible continuar la lectura en este navegador.");
    updateAudioButtons();
  };

  window.speechSynthesis.speak(utterance);
}

function startNarration() {
  if (!audioState.supported) {
    updateAudioStatus("Tu navegador no soporta la función de audiolibro.");
    updateAudioButtons();
    return;
  }

  if (audioState.paused && window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
    audioState.paused = false;
    audioState.speaking = true;
    updateAudioMeta({
      stateLabel: "Escuchando",
      chunkIndex: audioState.chunkIndex + 1,
      totalChunks: audioState.chunks.length,
      ...estimateNarrationMeta(audioState.chunks, audioState.sourceText),
    });
    updateAudioStatus("Lectura reanudada.");
    updateAudioHint("Listo.");
    updateAudioButtons();
    return;
  }

  const textToRead = getNarrationSourceText();
  audioState.chunks = splitNarrationText(textToRead);
  audioState.chunkIndex = 0;
  audioState.sourceText = textToRead;

  if (!audioState.chunks.length) {
    updateAudioMeta({ stateLabel: "En espera", chunkIndex: 0, totalChunks: 0, words: 0, minutes: 0 });
    updateAudioStatus("Sin lectura activa.");
    updateAudioHint("No hay texto disponible para leer.");
    updateAudioButtons();
    return;
  }

  const meta = estimateNarrationMeta(audioState.chunks, textToRead);
  window.speechSynthesis.cancel();
  audioState.speaking = true;
  audioState.paused = false;
  updateAudioMeta({
    stateLabel: "Escuchando",
    chunkIndex: 1,
    totalChunks: meta.totalChunks,
    words: meta.words,
    minutes: meta.minutes,
  });
  updateAudioStatus("Lectura en curso.");
  updateAudioHint("Si seleccionas texto, se leerá solo esa selección.");
  updateAudioButtons();
  speakChunk(0);
}

function togglePauseNarration() {
  if (!audioState.supported || !audioState.speaking) {
    return;
  }

  if (audioState.paused) {
    window.speechSynthesis.resume();
    audioState.paused = false;
    updateAudioStatus("Lectura reanudada.");
    updateAudioMeta({
      stateLabel: "Escuchando",
      chunkIndex: audioState.chunkIndex + 1,
      totalChunks: audioState.chunks.length,
      ...estimateNarrationMeta(audioState.chunks, audioState.sourceText),
    });
  } else {
    window.speechSynthesis.pause();
    audioState.paused = true;
    updateAudioStatus("Lectura en pausa.");
    updateAudioMeta({
      stateLabel: "Pausado",
      chunkIndex: audioState.chunkIndex + 1,
      totalChunks: audioState.chunks.length,
      ...estimateNarrationMeta(audioState.chunks, audioState.sourceText),
    });
  }
  updateAudioButtons();
}

function setupAudioControls() {
  if (!audioBookControls || !audioPlayBtn || !audioPauseBtn || !audioStopBtn) {
    return;
  }

  syncVoice();
  if (audioState.supported) {
    window.speechSynthesis.onvoiceschanged = () => {
      syncVoice();
    };
  }

  audioPlayBtn.addEventListener("click", () => {
    startNarration();
  });

  audioPauseBtn.addEventListener("click", () => {
    togglePauseNarration();
  });

  audioStopBtn.addEventListener("click", () => {
    stopNarration();
  });

  // Atajos de teclado para control de audio
  document.addEventListener("keydown", (e) => {
    // Solo si el usuario está en el capítulo actual y no en un input
    if (!readingState.activeTabId) return;
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

    // Space o 'p': reproducir/pausar
    if (e.code === "Space" || e.key.toLowerCase() === "p") {
      e.preventDefault();
      if (audioState.speaking && !audioState.paused) {
        togglePauseNarration();
      } else if (audioState.paused) {
        togglePauseNarration();
      } else {
        startNarration();
      }
    }

    // Escape o 's': detener
    if (e.code === "Escape" || e.key.toLowerCase() === "s") {
      e.preventDefault();
      stopNarration();
    }
  });

  if (savePositionBtn) {
    savePositionBtn.addEventListener("click", () => {
      saveReadingProgress();
      updateAudioHint("Posición guardada.");
    });
  }

  if (continuePositionBtn) {
    continuePositionBtn.addEventListener("click", () => {
      const saved = restoreReadingProgress();
      if (!saved) {
        updateAudioHint("No hay posición guardada.");
        return;
      }
      if (saved.view === "segment" && typeof readingState.renderSegment === "function") {
        readingState.renderSegment(Number(saved.segment) || 1);
      } else if (typeof readingState.renderPage === "function") {
        readingState.renderPage(Number(saved.page) || 1);
      }
      updateAudioHint("Lectura retomada desde guardado.");
    });
  }

  if (clearPositionBtn) {
    clearPositionBtn.addEventListener("click", () => {
      clearReadingProgress();
      updateAudioHint("Posición guardada eliminada.");
    });
  }

  if (!audioState.supported) {
    updateAudioStatus("Sin lectura activa.");
    updateAudioHint("Tu navegador no soporta la función de audiolibro.");
  } else {
    updateAudioStatus("Sin lectura activa.");
    updateAudioHint("Listo.");
  }
  updateAudioMeta({ stateLabel: "En espera", chunkIndex: 0, totalChunks: 0, words: 0, minutes: 0 });
  updateAudioButtons();
}

async function init() {
  try {
    if (!SELECTED_PRODUCT) {
      console.error("No hay producto activo disponible");
      return;
    }

    const checkoutGranted = applyCheckoutGrantFromUrl({
      token: SELECTED_PRODUCT.accessGrantToken,
      grantId: SELECTED_PRODUCT.accessGrantId,
      accessParam: CATALOGO.accesoUrlParam,
      returnParam: CATALOGO.accesoRetornoUrlParam,
    });
    const user = await getCurrentUser().catch(() => null);
    const adminUnlocked = isAdminUser(user);
    const localUnlocked = hasAccess(SELECTED_PRODUCT.accessGrantId);
    const remoteUnlocked = await resolveAccess(SELECTED_PRODUCT.accessGrantId).catch(() => false);
    const unlocked = checkoutGranted || localUnlocked || remoteUnlocked || adminUnlocked;
    const userKey = normalizeEmail(user?.email) || getSessionEmailFallback() || "anon";
    readingState.progressEntryKey = `${SELECTED_PRODUCT.accessGrantId}::${userKey}`;
    readingState.unlocked = unlocked;

    if (checkoutGranted) {
      saveEntitlementForCurrentUser(SELECTED_PRODUCT.accessGrantId).catch(() => {
        // Mantiene acceso local aunque falle la escritura remota.
      });
    }

    renderStatus(unlocked, adminUnlocked);

    // Cargar datos del producto
    const localizedProduct = getProductI18n(getCurrentLang());
    bookTitle.textContent = SELECTED_PRODUCT.nombre || localizedProduct.nombre;
    bookDescription.textContent = SELECTED_PRODUCT.descripcionPublica || localizedProduct.publicDescription;
    if (lockedBuyLink) {
      lockedBuyLink.href = `ventas.html?product=${encodeURIComponent(SELECTED_PRODUCT.id)}`;
    }

    // Cargar libro en formato continuo (sin depender de una estructura rígida de secciones)
    const sourceText = await loadBook(SELECTED_PRODUCT);
    const plainText = plainTextFromMarkdown(sourceText);
    const allWords = splitWords(plainText);
    const visibleWords = unlocked ? allWords : allWords.slice(0, PREVIEW_WORDS);

    readingState.words = visibleWords;
    readingState.totalPages = Math.max(1, Math.ceil(visibleWords.length / WORDS_PER_PAGE));
    readingState.totalSegments = Math.max(1, Math.ceil(visibleWords.length / WORDS_PER_SEGMENT));
    readingState.currentPage = 1;
    readingState.currentSegment = 1;
    readingState.currentView = "page";
    readingState.sectionRanges = null;

    const availableTabs = [{ id: "book", label: "Libro completo", content: plainText }];
    readingState.availableTabs = availableTabs;
    readingState.activeTabId = "book";
    readingState.renderTabById = () => ({ id: "book" });

    const updatePositionUi = () => {
      if (readingPositionInfo) {
        readingPositionInfo.textContent = `Página ${readingState.currentPage} / ${readingState.totalPages} · Segmento ${readingState.currentSegment} / ${readingState.totalSegments}`;
      }
      if (readingPageInput) {
        readingPageInput.value = String(readingState.currentPage);
        readingPageInput.max = String(readingState.totalPages);
      }
      if (prevPageBtn) {
        prevPageBtn.disabled = readingState.currentPage <= 1;
      }
      if (nextPageBtn) {
        nextPageBtn.disabled = readingState.currentPage >= readingState.totalPages;
      }
      if (readingSegmentInput) {
        readingSegmentInput.value = String(readingState.currentSegment);
        readingSegmentInput.max = String(readingState.totalSegments);
      }
      if (prevSegmentBtn) {
        prevSegmentBtn.disabled = readingState.currentSegment <= 1;
      }
      if (nextSegmentBtn) {
        nextSegmentBtn.disabled = readingState.currentSegment >= readingState.totalSegments;
      }
    };

    const renderFromWordStart = (startWord, amount, viewMode) => {
      const safeStart = clamp(startWord, 0, Math.max(0, readingState.words.length - 1));
      const chunk = getWordsSlice(readingState.words, safeStart, amount);
      const page = clamp(Math.floor(safeStart / WORDS_PER_PAGE) + 1, 1, readingState.totalPages);
      const segment = clamp(Math.floor(safeStart / WORDS_PER_SEGMENT) + 1, 1, readingState.totalSegments);
      readingState.currentPage = page;
      readingState.currentSegment = segment;
      readingState.currentView = viewMode;

      stopNarration({ silent: true });
      updateAudioStatus("Sin lectura activa.");
      updateAudioHint("Listo.");
      updateAudioButtons();

      sectionContent.innerHTML = renderReadingChunk({
        title: SELECTED_PRODUCT.nombre || "Libro",
        words: chunk,
        isPreview: !unlocked,
      });
      updatePositionUi();
      saveReadingProgress();
    };

    function renderPage(pageNumber = 1) {
      const safePage = clamp(pageNumber, 1, readingState.totalPages);
      const startWord = (safePage - 1) * WORDS_PER_PAGE;
      renderFromWordStart(startWord, WORDS_PER_PAGE, "page");
    }

    function renderSegment(segmentNumber = 1) {
      const safeSegment = clamp(segmentNumber, 1, readingState.totalSegments);
      const startWord = (safeSegment - 1) * WORDS_PER_SEGMENT;
      renderFromWordStart(startWord, WORDS_PER_SEGMENT, "segment");
    }

    readingState.renderPage = renderPage;
    readingState.renderSegment = renderSegment;

    contentNav.innerHTML = '<button class="tab-btn active" data-tab="book">Libro completo</button>';

    const url = new URL(window.location.href);
    const requestedPage = Number(url.searchParams.get("page") || url.searchParams.get("pagina"));
    const requestedSegment = Number(url.searchParams.get("segment") || url.searchParams.get("segmento"));
    const savedProgress = restoreReadingProgress();

    if (Number.isFinite(requestedSegment) && requestedSegment > 0) {
      renderSegment(requestedSegment);
    } else if (Number.isFinite(requestedPage) && requestedPage > 0) {
      renderPage(requestedPage);
    } else if (savedProgress?.view === "segment" && Number(savedProgress.segment) > 0) {
      renderSegment(Number(savedProgress.segment));
    } else if (Number(savedProgress?.page) > 0) {
      renderPage(Number(savedProgress.page));
    } else {
      renderPage(1);
    }

    if (goToPageBtn && readingPageInput) {
      goToPageBtn.addEventListener("click", () => {
        renderPage(Number(readingPageInput.value) || 1);
      });
    }

    if (prevPageBtn) {
      prevPageBtn.addEventListener("click", () => {
        renderPage(readingState.currentPage - 1);
      });
    }

    if (nextPageBtn) {
      nextPageBtn.addEventListener("click", () => {
        renderPage(readingState.currentPage + 1);
      });
    }

    if (goToSegmentBtn && readingSegmentInput) {
      goToSegmentBtn.addEventListener("click", () => {
        renderSegment(Number(readingSegmentInput.value) || 1);
      });
    }

    if (prevSegmentBtn) {
      prevSegmentBtn.addEventListener("click", () => {
        renderSegment(readingState.currentSegment - 1);
      });
    }

    if (nextSegmentBtn) {
      nextSegmentBtn.addEventListener("click", () => {
        renderSegment(readingState.currentSegment + 1);
      });
    }

    if (readingPageInput) {
      readingPageInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          renderPage(Number(readingPageInput.value) || 1);
        }
      });
    }

    if (readingSegmentInput) {
      readingSegmentInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          renderSegment(Number(readingSegmentInput.value) || 1);
        }
      });
    }

    // Mostrar/ocultar paneles según acceso
    if (!unlocked) {
      contentPanel.classList.remove("hidden");
      contentNav.classList.remove("hidden");
      lockedPanel.classList.remove("hidden");
      renderMiniCatalog();
      setupAudioControls();
    } else {
      contentPanel.classList.remove("hidden");
      contentNav.classList.remove("hidden");
      lockedPanel.classList.add("hidden");
      setupAudioControls();

      window.addEventListener("beforeunload", () => {
        saveReadingProgress();
        stopNarration({ silent: true });
      });
    }
  } catch (error) {
    console.error("Error cargando lectura:", error);
    sectionContent.innerHTML = `<p class="reading-paragraph">${escapeHtml(error.message || "Error cargando el contenido.")}</p>`;
  }
}

document.addEventListener("DOMContentLoaded", init);
