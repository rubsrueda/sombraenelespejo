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
  const email = normalizeEmail(user?.email);
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

  if (markedPrologue || markedIndex || markedChapters || markedBibliography || markedEpilogue) {
    return {
      prologue: markedPrologue || t("dynamic.lectura.noPrologue"),
      chapters: markedChapters || t("dynamic.lectura.noChapters"),
      epilogue: markedEpilogue || t("dynamic.lectura.noEpilogue"),
      index: markedIndex || "Índice no disponible.",
      bibliography: markedBibliography || "Bibliografía no disponible.",
    };
  }

  const prologueStart = findIndexByRegex(lines, /^PR[ÓO]LOGO:/i);
  const indexStart = findIndexByRegex(lines, /^[ÍI]ndice:\s*$/i, Math.max(0, prologueStart));
  const firstPartBodyStart = findNthIndexByRegex(lines, /^PARTE\s+I:/i, 2, Math.max(0, indexStart));
  const bibliographyStart = findIndexByRegex(lines, /^###\s*\*\*Bibliograf[íi]a Consultada\*\*\s*$/i);
  const epilogueStart = findIndexByRegex(lines, /^Ep[íi]logo:/i, Math.max(0, bibliographyStart));

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
  };
}

function cleanHeading(raw = "") {
  return raw
    .replace(/^#{1,6}\s+/, "")
    .replace(/^[-*]\s+/, "")
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

    // Renderizar tabs
    contentNav.innerHTML = availableTabs
      .map((tab, idx) => `
        <button class="tab-btn ${idx === 0 ? "active" : ""}" data-tab="${tab.id}">
          ${tab.label}
        </button>
      `)
      .join("");

    // Mostrar primera sección por defecto
    sectionContent.innerHTML = renderSectionContent(availableTabs[0]);

    // Event listeners para tabs
    const tabButtons = document.querySelectorAll(".tab-btn");
    tabButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const tabId = btn.getAttribute("data-tab");
        const tab = availableTabs.find((t) => t.id === tabId);
        if (!tab) return;

        // Actualizar tab activo
        tabButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        // Mostrar contenido
        sectionContent.innerHTML = renderSectionContent(tab);
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
    }
  } catch (error) {
    console.error("Error cargando lectura:", error);
    sectionContent.innerHTML = `<p class="reading-paragraph">${escapeHtml(error.message || "Error cargando el contenido.")}</p>`;
  }
}

document.addEventListener("DOMContentLoaded", init);
