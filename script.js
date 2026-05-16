const state = {
  lines: [],
  text: "",
  chapters: [],
  currentChapterIndex: -1,
  title: "",
  subtitle: "",
  dedication: "",
  prologue: "",
  bibliography: "",
  keywords: [],
};

const ui = {
  gate: document.getElementById("gate"),
  enterBtn: document.getElementById("enterBtn"),
  title: document.getElementById("bookTitle"),
  subtitle: document.getElementById("bookSubtitle"),
  resetViewBtn: document.getElementById("resetViewBtn"),
  navButtons: [...document.querySelectorAll(".nav-btn")],
  panels: [...document.querySelectorAll(".panel")],
  keywordCloud: document.getElementById("keywordCloud"),
  dedicationText: document.getElementById("dedicationText"),
  prologueText: document.getElementById("prologueText"),
  bibliographyText: document.getElementById("bibliographyText"),
  chapterSearch: document.getElementById("chapterSearch"),
  chapterList: document.getElementById("chapterList"),
  chapterTitle: document.getElementById("chapterTitle"),
  chapterBody: document.getElementById("chapterBody"),
};

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function compact(lines) {
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function firstIndex(regex, from = 0) {
  for (let i = from; i < state.lines.length; i += 1) {
    if (regex.test(state.lines[i])) return i;
  }
  return -1;
}

function parseMetadata() {
  const t = firstIndex(/^Sombras en el Espejo:?$/i);
  const subtitleIndex = firstIndex(/^\s*Entendiendo la Violencia Psicológica\s*$/i, t + 1);
  const dedicationIndex = firstIndex(/^A mi hijo\b/i);
  const prologueIndex = firstIndex(/^PRÓLOGO:/i);
  const indexLabel = firstIndex(/^Índice:\s*$/i, prologueIndex + 1);

  state.title = t !== -1 ? state.lines[t].replace(/:$/, "") : "Sombras en el Espejo";
  state.subtitle = subtitleIndex !== -1 ? state.lines[subtitleIndex].trim() : "";

  state.dedication = dedicationIndex !== -1 ? state.lines[dedicationIndex].trim() : "";

  if (prologueIndex !== -1 && indexLabel !== -1) {
    state.prologue = compact(state.lines.slice(prologueIndex, indexLabel));
  }

  const biblioStart = firstIndex(/^###\s*\*\*Bibliografía Consultada\*\*\s*$/i);
  const epilogueStart = firstIndex(/^Epílogo:/i, biblioStart + 1);
  if (biblioStart !== -1) {
    const end = epilogueStart !== -1 ? epilogueStart : state.lines.length;
    state.bibliography = compact(state.lines.slice(biblioStart, end));
  }
}

function parseChapters() {
  const bodyStart = firstIndex(/^PARTE I: EL CONTRATO SUBVERTIDO\s*$/i);
  const start = bodyStart !== -1 ? bodyStart : 0;
  const chapterHeading = /^cap[ií]tulo\s+(\d+)\s*:/i;

  const chapterStartIndexes = [];
  for (let i = start; i < state.lines.length; i += 1) {
    if (chapterHeading.test(state.lines[i])) {
      chapterStartIndexes.push(i);
    }
  }

  const unique = new Map();
  chapterStartIndexes.forEach((idx) => {
    const heading = state.lines[idx].trim();
    const numMatch = heading.match(chapterHeading);
    if (!numMatch) return;
    const chapterNumber = Number(numMatch[1]);
    if (!unique.has(chapterNumber)) {
      unique.set(chapterNumber, idx);
    }
  });

  const ordered = [...unique.entries()].sort((a, b) => a[0] - b[0]);

  state.chapters = ordered.map(([chapterNumber, idx], i) => {
    const nextIdx = i + 1 < ordered.length ? ordered[i + 1][1] : state.lines.length;
    const title = state.lines[idx].trim();
    const content = compact(state.lines.slice(idx + 1, nextIdx));

    return {
      chapterNumber,
      title,
      content,
    };
  });
}

function buildKeywords() {
  const corpus = [
    state.title,
    state.subtitle,
    state.prologue,
    ...state.chapters.map((c) => `${c.title} ${c.content.slice(0, 400)}`),
  ].join(" ");

  const stop = new Set([
    "el", "la", "los", "las", "de", "del", "y", "en", "un", "una", "que", "por",
    "para", "con", "como", "al", "su", "se", "es", "no", "lo", "le", "a", "o",
    "más", "sin", "sobre", "este", "esta", "hombre", "mujer", "capítulo"
  ]);

  const words = (corpus.toLowerCase().match(/[a-záéíóúñü]{4,}/g) || []).filter((w) => !stop.has(w));
  const freq = new Map();
  words.forEach((w) => freq.set(w, (freq.get(w) || 0) + 1));

  state.keywords = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 16)
    .map(([w]) => w);
}

function renderMetadata() {
  ui.title.textContent = state.title || "Sombras en el Espejo";
  ui.subtitle.textContent = state.subtitle;
  ui.dedicationText.textContent = state.dedication || "Sin dedicatoria detectada.";
  ui.prologueText.textContent = state.prologue || "No se encontró el prólogo.";
  ui.bibliographyText.textContent = state.bibliography || "No se encontró bibliografía.";

  ui.keywordCloud.innerHTML = "";
  state.keywords.forEach((k) => {
    const span = document.createElement("span");
    span.className = "keyword";
    span.textContent = k;
    ui.keywordCloud.appendChild(span);
  });
}

function selectChapter(index) {
  if (index < 0 || index >= state.chapters.length) return;
  state.currentChapterIndex = index;

  const chapter = state.chapters[index];
  ui.chapterTitle.textContent = chapter.title;
  ui.chapterBody.innerHTML = `<p>${escapeHtml(chapter.content).replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>`;

  [...ui.chapterList.querySelectorAll("button")].forEach((btn) => {
    btn.classList.toggle("active", Number(btn.dataset.index) === index);
  });
}

function renderChapterList(filter = "") {
  const q = filter.trim().toLowerCase();
  const filtered = state.chapters
    .map((chapter, index) => ({ chapter, index }))
    .filter(({ chapter }) => {
      if (!q) return true;
      return (
        chapter.title.toLowerCase().includes(q) ||
        chapter.content.toLowerCase().includes(q)
      );
    });

  ui.chapterList.innerHTML = "";
  filtered.forEach(({ chapter, index }) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.dataset.index = String(index);
    btn.textContent = chapter.title;
    btn.classList.toggle("active", index === state.currentChapterIndex);
    btn.addEventListener("click", () => selectChapter(index));
    li.appendChild(btn);
    ui.chapterList.appendChild(li);
  });

  if (!filtered.length) {
    ui.chapterTitle.textContent = "Sin resultados";
    ui.chapterBody.textContent = "No se encontraron capítulos con ese criterio.";
    return;
  }

  const currentVisible = filtered.some(({ index }) => index === state.currentChapterIndex);
  if (!currentVisible) {
    selectChapter(filtered[0].index);
  }
}

function showSection(id) {
  ui.navButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.section === id));
  ui.panels.forEach((panel) => panel.classList.toggle("active", panel.id === id));
}

function bindEvents() {
  ui.enterBtn.addEventListener("click", () => {
    ui.gate.classList.add("hidden");
    ui.gate.setAttribute("aria-hidden", "true");
  });

  ui.resetViewBtn.addEventListener("click", () => showSection("resumen"));

  ui.navButtons.forEach((btn) => {
    btn.addEventListener("click", () => showSection(btn.dataset.section));
  });

  ui.chapterSearch.addEventListener("input", (e) => {
    renderChapterList(e.target.value);
  });
}

async function loadBook() {
  try {
    const response = await fetch("sombraenelespejo.md", { cache: "no-store" });
    if (!response.ok) throw new Error("No se pudo leer el archivo.");

    state.text = await response.text();
    state.lines = state.text.replace(/\r/g, "").split("\n");

    parseMetadata();
    parseChapters();
    buildKeywords();

    renderMetadata();
    renderChapterList();
    if (state.chapters.length > 0) selectChapter(0);
  } catch (error) {
    ui.title.textContent = "No se pudo cargar el contenido";
    ui.subtitle.textContent = "Abre el proyecto con un servidor local para habilitar la lectura.";
    ui.prologueText.textContent = String(error.message || error);
  }
}

bindEvents();
loadBook();
