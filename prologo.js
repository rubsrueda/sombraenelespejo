import { CATALOGO, PRODUCTO_ACTUAL } from "./producto-config.js";
import { getCurrentLang } from "./i18n.js";

const prologueTitle = document.getElementById("prologueTitle");
const prologueBody = document.getElementById("prologueBody");
const bookNameLabel = document.getElementById("bookNameLabel");

function getSelectedProduct() {
  const params = new URLSearchParams(window.location.search);
  const requestedId = params.get("product");
  if (!requestedId) return PRODUCTO_ACTUAL;
  return CATALOGO.productos.find((item) => item.id === requestedId && item.activo) || PRODUCTO_ACTUAL;
}

function normalize(text) {
  return text.replace(/\r/g, "");
}

function compact(lines) {
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function extractStageBlock(lines, stageName) {
  const markerRegex = /<!--\s*STAGE:\s*([A-ZÁÉÍÓÚ_]+)\s*(START|END)\s*-->/i;
  let start = -1;
  let end = -1;
  for (let i = 0; i < lines.length; i += 1) {
    const m = lines[i].match(markerRegex);
    if (!m) continue;
    if (m[1].toUpperCase() === stageName && m[2].toUpperCase() === "START") start = i;
    if (m[1].toUpperCase() === stageName && m[2].toUpperCase() === "END") end = i;
  }
  if (start < 0 || end <= start) return null;
  return compact(lines.slice(start + 1, end));
}

function extractPrologue(lines) {
  const staged = extractStageBlock(lines, "PROLOGO");
  if (staged) {
    const [titleLine, ...bodyLines] = staged.split("\n");
    return {
      title: titleLine.replace(/^#{1,6}\s*/, "").replace(/^\*\*\s*/, "").replace(/\s*\*\*$/, "").trim(),
      body: bodyLines.join("\n").trim(),
    };
  }

  const startIndex = lines.findIndex((line) => /^(PRÓLOGO|PROLOGO|PROLOGUE|PROLOG|前言):?\s*/i.test(line.trim()));

  if (startIndex === -1) {
    return {
      title: "Prólogo",
      body: "No se encontró el prólogo en el manuscrito.",
    };
  }

  const endIndex = lines.findIndex((line, index) => index > startIndex && /^(ÍNDICE|INDICE|INDEX|INHALTSVERZEICHNIS|索引):?\s*$/i.test(line.trim()));
  const block = compact(lines.slice(startIndex, endIndex === -1 ? lines.length : endIndex));
  const [titleLine, ...bodyLines] = block.split("\n");

  return {
    title: titleLine.trim(),
    body: bodyLines.join("\n").trim(),
  };
}

async function loadPrologue() {
  const product = getSelectedProduct();

  if (bookNameLabel) {
    bookNameLabel.textContent = product.nombre || "";
  }
  document.title = `Prólogo — ${product.nombre || "Abel de Ferro"} | Abel de Ferro`;

  try {
    const lang = getCurrentLang();
    const sourceFile = product.archivoContenido || "sombraenelespejo.md";
    const extIdx = sourceFile.lastIndexOf(".");
    const baseName = extIdx > 0 ? sourceFile.slice(0, extIdx) : sourceFile;
    const ext = extIdx > 0 ? sourceFile.slice(extIdx) : ".md";
    const localizedFile = `${baseName}-${lang}${ext}`;

    let response = await fetch(localizedFile, { cache: "no-store" });
    if (!response.ok) {
      response = await fetch(sourceFile, { cache: "no-store" });
    }

    if (!response.ok) {
      throw new Error("No se pudo leer el manuscrito.");
    }

    const source = normalize(await response.text());
    const lines = source.split("\n");
    const prologue = extractPrologue(lines);

    prologueTitle.textContent = prologue.title;
    prologueBody.textContent = prologue.body;
  } catch (error) {
    prologueTitle.textContent = "Prólogo";
    prologueBody.textContent = `No se pudo cargar el prólogo: ${error.message}`;
  }
}

loadPrologue();
