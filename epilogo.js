import { getCurrentLang, t } from "./i18n.js";

const epilogueTitle = document.getElementById("epilogueTitle");
const epilogueBody = document.getElementById("epilogueBody");

function normalize(text) {
  return text.replace(/\r/g, "");
}

function compact(lines) {
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function extractEpilogue(lines) {
  const startIndex = lines.findIndex((line) => /^(EPÍLOGO|EPILOGO|EPILOGUE|EPILOG|ÉPILOGUE|结语):?\s*/i.test(line.trim()));

  if (startIndex === -1) {
    return {
      title: t("pages.epilogo.heading"),
      body: t("dynamic.epilogo.noFound"),
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
    const lang = getCurrentLang();
    const localizedFile = `sombraenelespejo-${lang}.md`;
    let response = await fetch(localizedFile, { cache: "no-store" });
    if (!response.ok) {
      response = await fetch("sombraenelespejo.md", { cache: "no-store" });
    }

    if (!response.ok) {
      throw new Error(t("dynamic.epilogo.readError"));
    }

    const source = normalize(await response.text());
    const lines = source.split("\n");
    const epilogue = extractEpilogue(lines);

    epilogueTitle.textContent = epilogue.title;
    epilogueBody.textContent = epilogue.body;
  } catch (error) {
    epilogueTitle.textContent = t("pages.epilogo.heading");
    epilogueBody.textContent = t("dynamic.epilogo.loadError", { message: error.message });
  }
}

loadEpilogue();

window.addEventListener("af:languageChanged", () => {
  loadEpilogue();
});
