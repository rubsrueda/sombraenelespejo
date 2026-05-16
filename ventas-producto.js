import { CATALOGO, PRODUCTO_ACTUAL } from "./producto-config.js";
import { applyCheckoutGrantFromUrl, hasAccess } from "./access-control.js";

const benefitsGrid = document.getElementById("benefitsGrid");
const productTiers = document.getElementById("productTiers");
const salesTransparencyText = document.getElementById("salesTransparencyText");
const productTitle = document.getElementById("productTitle");
const productSubtitle = document.getElementById("productSubtitle");
const accessStatus = document.getElementById("accessStatus");
const checkoutSetupHint = document.getElementById("checkoutSetupHint");

function formatPrice(value, currency) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function createBenefitCard(item, index) {
  const article = document.createElement("article");
  article.className = `sales-card card-reveal delay-${Math.min(index + 1, 3)}`;
  article.innerHTML = `
    <h2 class="section-title">${item.titulo}</h2>
    <p class="badge">${item.badge}</p>
    <p class="mt-3">${item.descripcion}</p>
  `;
  return article;
}

function createTierCard(item) {
  const article = document.createElement("article");
  article.className = "sales-card card-reveal tier-card";

  const cta = item.enlaceCheckoutActivo
    ? `<a href="${item.enlaceCheckout}" target="_blank" rel="noopener noreferrer" class="btn-main btn-interact inline-flex">Comprar ahora</a>`
    : "<button class=\"btn-secondary opacity-70 cursor-not-allowed\" type=\"button\" disabled>Configurar enlace de pago</button>";

  article.innerHTML = `
    <p class="tier-price">${formatPrice(item.precio, item.moneda)}</p>
    <h3 class="mt-0 mb-2 text-3xl">${item.nombre}</h3>
    <p class="mb-4">${item.descripcion}</p>
    <p class="mb-4 text-sm text-slate-500">Acceso otorgado: ${item.accessGrantId}</p>
    ${cta}
  `;

  return article;
}

function renderPage() {
  productTitle.textContent = PRODUCTO_ACTUAL.nombre;
  productSubtitle.textContent = `Producto único activo ahora mismo. Plataforma: ${PRODUCTO_ACTUAL.plataforma}.`;

  PRODUCTO_ACTUAL.beneficios.forEach((item, index) => {
    benefitsGrid.appendChild(createBenefitCard(item, index));
  });

  productTiers.appendChild(createTierCard(PRODUCTO_ACTUAL));

  salesTransparencyText.textContent = PRODUCTO_ACTUAL.transparencia;
  checkoutSetupHint.textContent = `Configura la URL de éxito de checkout para volver a esta página con ?${CATALOGO.accesoRetornoUrlParam}=success o ?${CATALOGO.accesoUrlParam}=${PRODUCTO_ACTUAL.accessGrantToken}.`;
}

function renderAccessStatus() {
  const unlocked = hasAccess(PRODUCTO_ACTUAL.accessGrantId);
  accessStatus.innerHTML = unlocked
    ? 'Acceso activo al libro completo. Puedes entrar desde <a href="lectura.html" class="underline">Lectura Completa</a>.'
    : 'Acceso no activo todavía. Completa la compra para habilitar <strong>Lectura Completa</strong>.';
}

applyCheckoutGrantFromUrl({
  token: PRODUCTO_ACTUAL.accessGrantToken,
  grantId: PRODUCTO_ACTUAL.accessGrantId,
  accessParam: CATALOGO.accesoUrlParam,
  returnParam: CATALOGO.accesoRetornoUrlParam,
});

renderPage();
renderAccessStatus();
