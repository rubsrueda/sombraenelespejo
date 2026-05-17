export const CATALOGO = {
  accesoUrlParam: "access",
  accesoRetornoUrlParam: "checkout",
  productos: [
    {
      id: "libro-sombra-en-el-espejo",
      tipo: "libro",
      activo: true,
      destacado: true,
      nombre: "Sombra en el Espejo",
      moneda: "EUR",
      plataforma: "Stripe",
      precio: 8.39,
      precios: [
        { valor: 8.39, moneda: "EUR" },
        { valor: 9.75, moneda: "USD" },
        { valor: 169, moneda: "MXN" },
      ],
      descripcion:
        "Compra única para habilitar acceso al libro completo en la plataforma.",
      descripcionPublica:
        "Sombra en el Espejo explora la violencia psicológica, la manipulación emocional y la recuperación de la dignidad personal desde una narrativa técnica y testimonial.",
      archivoContenido: "sombraenelespejo.md",
      lecturaPath: "lectura.html",
      accessGrantId: "sombraenelespejo-libro-completo",
      accessGrantToken: "sombraenelespejo-completo",
      enlaceCheckout: "https://buy.stripe.com/bJecN6eYG8nz6I83S9fjG00",
      enlaceCheckoutActivo: true,
      beneficios: [
        {
          titulo: "Libro Completo",
          badge: "Acceso total",
          descripcion:
            "Desbloquea la lectura completa dentro del sitio.",
        },
        {
          titulo: "Formato Digital",
          badge: "Lectura inmediata",
          descripcion: "Consulta online tras activar la compra.",
        },
        {
          titulo: "Base Escalable",
          badge: "Preparado a futuro",
          descripcion:
            "Catálogo listo para añadir nuevos libros o proyectos.",
        },
      ],
      transparencia:
        "Los fondos se destinan a edición, producción, distribución y mantenimiento del proyecto editorial. Los pagos se procesan mediante pasarela segura cifrada.",
    },
  ],
  // Este espacio permite añadir nuevos elementos sin cambiar la lógica principal.
  proyectosFuturos: [],
};

export const PRODUCTO_ACTUAL =
  CATALOGO.productos.find((item) => item.destacado && item.activo) || CATALOGO.productos[0];
