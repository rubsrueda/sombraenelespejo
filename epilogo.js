const epilogueTitle = document.getElementById("epilogueTitle");
const epilogueBody = document.getElementById("epilogueBody");

function normalize(text) {
  return text.replace(/\r/g, "");
}

function compact(lines) {
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function extractEpilogue(lines) {
  const startIndex = lines.findIndex((line) => /^Epílogo:\s*/i.test(line.trim()));

  if (startIndex === -1) {
    return {
      title: "Epílogo",
      body: "No se encontró el epílogo en el manuscrito.",
    };
  }

  const nextSectionIndex = lines.findIndex(
    (line, index) => index > startIndex && /^\[\d+\]/.test(line.trim()),
  );

  const endIndex = nextSectionIndex === -1 ? lines.length : nextSectionIndex;
  const block = compact(lines.slice(startIndex, endIndex));

  const [titleLine, ...bodyLines] = block.split("\n");
  return {
    title: titleLine.trim(),
    body: bodyLines.join("\n").trim(),
  };
}

async function loadEpilogue() {
  try {
    const response = await fetch("sombraenelespejo.md", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("No se pudo leer el manuscrito.");
    }

    const source = normalize(await response.text());
    const lines = source.split("\n");
    const epilogue = extractEpilogue(lines);

    epilogueTitle.textContent = epilogue.title;
    epilogueBody.textContent = epilogue.body;
  } catch (error) {
    epilogueTitle.textContent = "Epílogo";
    epilogueBody.textContent = `No se pudo cargar el epílogo: ${error.message}`;
  }
}

loadEpilogue();
