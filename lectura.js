import { CATALOGO, PRODUCTO_ACTUAL } from "./producto-config.js";
import { applyCheckoutGrantFromUrl, hasAccess } from "./access-control.js";

const statusNode = document.getElementById("readingAccessStatus");
const lockedPanel = document.getElementById("lockedPanel");
const readerPanel = document.getElementById("readerPanel");
const readerContent = document.getElementById("readerContent");

async function loadBook() {
  const response = await fetch("sombraenelespejo.md", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("No se pudo cargar el libro completo.");
  }
  return response.text();
}

function togglePanels(unlocked) {
  lockedPanel.classList.toggle("hidden", unlocked);
  readerPanel.classList.toggle("hidden", !unlocked);
}

function renderStatus(unlocked) {
  if (unlocked) {
    statusNode.textContent = "Acceso activo. Ya puedes leer el contenido completo.";
    return;
  }

  statusNode.innerHTML = 'Acceso pendiente. Activa tu compra en <a href="ventas.html" class="underline">Comprar</a> para desbloquear esta sección.';
}

async function init() {
  applyCheckoutGrantFromUrl({
    token: PRODUCTO_ACTUAL.accessGrantToken,
    grantId: PRODUCTO_ACTUAL.accessGrantId,
    accessParam: CATALOGO.accesoUrlParam,
    returnParam: CATALOGO.accesoRetornoUrlParam,
  });

  const unlocked = hasAccess(PRODUCTO_ACTUAL.accessGrantId);
  renderStatus(unlocked);
  togglePanels(unlocked);

  if (!unlocked) {
    return;
  }

  try {
    const text = await loadBook();
    readerContent.textContent = text;
  } catch (error) {
    readerContent.textContent = `Error: ${error.message}`;
  }
}

init();
