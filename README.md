# sombraenelespejo
Libro sobre la situación actual de las relaciones.

## Modo actual: GitHub Pages (sin instalaciones adicionales)

Este proyecto esta preparado para ejecutarse como sitio estatico en GitHub Pages.

### Flujo de compra

1. En Stripe, configura la redireccion despues de pago exitoso a:
   - `https://rubsrueda.github.io/sombraenelespejo/ventas.html?checkout=success`
2. Al volver a [ventas.html](ventas.html), se activa el acceso en el navegador actual.
3. [lectura.html](lectura.html) detecta ese acceso y desbloquea el contenido completo.

### Alcance de este modo

- No requiere instalar nada adicional.
- Funciona directamente en GitHub Pages.
- El acceso es local al navegador/dispositivo.
