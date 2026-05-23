import { CATALOGO, PRODUCTO_ACTUAL } from "./producto-config.js";

const resumenTitle = document.getElementById("resumenTitle");
const resumenBody = document.getElementById("resumenBody");
const resumenBullets = document.getElementById("resumenBullets");
const resumenAutor = document.getElementById("resumenAutor");
const linkPrologo = document.getElementById("linkPrologo");
const linkLectura = document.getElementById("linkLectura");
const linkEpilogo = document.getElementById("linkEpilogo");
const linkCompra = document.getElementById("linkCompra");

function getSelectedProduct() {
  const params = new URLSearchParams(window.location.search);
  const requestedId = params.get("product");
  if (!requestedId) return PRODUCTO_ACTUAL;
  return CATALOGO.productos.find((item) => item.id === requestedId && item.activo) || PRODUCTO_ACTUAL;
}

function renderResumen() {
  const product = getSelectedProduct();
  const productParam = `?product=${encodeURIComponent(product.id)}`;

  document.title = `Sinopsis — ${product.nombre} | Abel de Ferro`;

  if (resumenTitle) {
    resumenTitle.textContent = `Sinopsis: ${product.nombre}`;
  }

  if (resumenBody) {
    resumenBody.textContent = product.descripcionPublica || product.descripcion || "";
  }

  if (resumenBullets && Array.isArray(product.beneficios) && product.beneficios.length) {
    resumenBullets.innerHTML = product.beneficios
      .map((b) => `<li><strong>${b.titulo}:</strong> ${b.descripcion}</li>`)
      .join("");
  }

  if (linkPrologo) {
    linkPrologo.href = `prologo.html${productParam}`;
  }
  if (linkLectura) {
    linkLectura.href = `lectura.html${productParam}`;
  }
  if (linkEpilogo) {
    linkEpilogo.href = `epilogo.html${productParam}`;
  }
  if (linkCompra) {
    if (product.enlaceCheckoutActivo && product.enlaceCheckout) {
      linkCompra.href = `ventas.html${productParam}`;
      linkCompra.classList.remove("hidden");
    } else {
      linkCompra.textContent = "Próximamente";
      linkCompra.removeAttribute("href");
      linkCompra.classList.add("opacity-50", "cursor-default");
    }
  }
}

renderResumen();
