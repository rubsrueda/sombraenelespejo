import { getCurrentLang } from "./i18n.js";

const prologueTitle = document.getElementById("prologueTitle");
const prologueBody = document.getElementById("prologueBody");

function normalize(text) {
  return text.replace(/\r/g, "");
}

function compact(lines) {
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function extractPrologue(lines) {
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
  try {
    const lang = getCurrentLang();
    const localizedFile = `sombraenelespejo-${lang}.md`;
    let response = await fetch(localizedFile, { cache: "no-store" });
    if (!response.ok) {
      response = await fetch("sombraenelespejo.md", { cache: "no-store" });
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
