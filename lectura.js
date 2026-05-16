import { CATALOGO, PRODUCTO_ACTUAL } from "./producto-config.js";
import { applyCheckoutGrantFromUrl, hasAccess } from "./access-control.js";
import { saveEntitlementForCurrentUser } from "./entitlements.js";
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

function extractSections(text) {
  const lines = text.replace(/\r/g, "").split("\n");
  return {
    prologue: getSection(lines, "prologue") || t("dynamic.lectura.noPrologue"),
    chapters: getSection(lines, "chapters") || t("dynamic.lectura.noChapters"),
    epilogue: getSection(lines, "epilogue") || t("dynamic.lectura.noEpilogue"),
    index: getSection(lines, "index") || "Índice no disponible.",
    bibliography: getSection(lines, "bibliography") || fallbackBibliography(lines) || "Bibliografía no disponible.",
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

function renderStatus(unlocked) {
  if (unlocked) {
    statusNode.textContent = t("dynamic.lectura.active");
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
    const unlocked = checkoutGranted || hasAccess(PRODUCTO_ACTUAL.accessGrantId);

    if (checkoutGranted) {
      saveEntitlementForCurrentUser(PRODUCTO_ACTUAL.accessGrantId).catch(() => {
        // Mantiene acceso local aunque falle la escritura remota.
      });
    }

    renderStatus(unlocked);

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
    sectionContent.textContent = availableTabs[0].content;

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
        sectionContent.textContent = tab.content;
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
    sectionContent.textContent = error.message || "Error cargando el contenido.";
  }
}

document.addEventListener("DOMContentLoaded", init);
