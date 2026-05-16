# Instrucciones para Rediseño Web: "Sombra en el Espejo"

## 1. Contexto del Proyecto
Estoy desarrollando la web oficial para mi libro titulado **"Sombra en el Espejo"**. La web actual es básica (alojada en GitHub Pages) y busco transformarla en una plataforma profesional de autor.
URL de referencia actual: https://rubsrueda.github.io/sombraenelespejo/

## 2. Objetivos Técnicos
- **Plataforma:** Contenido estático compatible con GitHub Pages.
- **Tecnologías Sugeridas:** HTML5, CSS3 (usar Tailwind CSS vía CDN para diseño moderno) y JavaScript (Vanilla o Firebase para lógica).
- **Diseño:** Estética de misterio/literaria, profesional, minimalista y responsiva (mobile-first).

## 3. Guía de Estilo y Formato
- **Tipografía:** 
    - Títulos: 'Playfair Display' (Serif) para un aire literario.
    - Cuerpo: 'Inter' o 'Montserrat' (Sans-serif) para legibilidad.
- **Paleta de Colores:** 
    - Primario: Negro profundo o Azul noche (#0f172a).
    - Acento: Dorado suave (#d4af37) o Gris plata para elementos de interacción.
    - Fondo: Blanco roto (#f8fafc) para evitar fatiga visual.
- **Estructura de Encabezados:**
    - H1: Título del libro (grande, elegante, con tracking ligero).
    - H2: Títulos de sección (con línea decorativa inferior).

## 4. Estructura de la Web (Páginas y Secciones)

### A. Home (index.html)
- **Hero Section:** Imagen de la portada a la izquierda, título, tagline intrigante y botón "Comprar Ahora" (CTA) a la derecha.
- **Sinopsis:** Sección con padding generoso, texto justificado y una cita destacada del libro.
- **Sobre el Autor:** Breve biografía con foto circular.

### B. Página de Ventas (ventas.html)
- Integración visual de un botón de compra. 
- *Instrucción:* Preparar un layout donde pueda pegar un "Embed" de Gumroad o un botón de Stripe Checkout.
- Incluir beneficios: "Formato Digital", "Tapa Blanda", "Envío Internacional".

### C. Sistema de Reseñas (reseñas.html)
- **Interfaz:** Tarjetas (cards) que muestren: Nombre del lector, valoración (estrellas) y comentario.
- **Lógica:** Implementar un sistema usando **Firebase Firestore** para que las reseñas se guarden y muestren en tiempo real sin necesidad de un backend propio.

### D. Sistema de Login (login.html)
- Crear un formulario de acceso elegante.
- **Lógica:** Usar **Firebase Authentication** (Google y Email/Password).
- **Objetivo:** Solo usuarios logueados podrán escribir reseñas.

## 5. Tareas Específicas de Código
1. **Layout Global:** Crear un `navbar` pegajoso (sticky) con enlaces a: Inicio, Sinopsis, Reseñas, Comprar y Login.
2. **Formato de Texto:** Configurar tamaños de fuente:
   - H1: 4rem (Desktop) / 2.5rem (Mobile).
   - Cuerpo: 1.1rem, line-height: 1.8.
3. **Componentes:**
   - Botones con efecto `hover:scale-105` y transición suave.
   - Contenedores con bordes redondeados (`12px`) y sombras sutiles.

## 6. Entrega de Código
Por favor, genera primero la estructura de archivos necesaria y luego el código para `index.html` y un archivo `style.css` que use Tailwind como base de diseño.