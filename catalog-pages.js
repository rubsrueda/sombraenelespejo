import { CATALOGO } from "./producto-config.js";

function getActiveBooks() {
  return CATALOGO.productos.filter((item) => item.activo && item.tipo === "libro");
}

function createBookLink(item) {
  const link = document.createElement("a");
  link.className = "btn-main btn-interact inline-flex";
  link.href = `lectura.html?product=${encodeURIComponent(item.id)}`;
  link.textContent = item.nombre;
  return link;
}

function renderBooks(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const books = getActiveBooks();
  container.innerHTML = "";

  books.forEach((item) => {
    container.appendChild(createBookLink(item));
  });
}

renderBooks("homeBooksList");
renderBooks("authorBooksList");
