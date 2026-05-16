const STORAGE_KEY = "af_lang";
const PARAM_KEY = "lang";

export const SUPPORTED_LANGS = ["es", "en", "fr", "de", "pt", "it", "zh"];

const DICT = {
  es: {
    langName: "Español",
    common: {
      menu: "Menú",
      language: "Idioma",
      nav: {
        home: "Inicio",
        synopsis: "Sinopsis",
        fullReading: "Lectura Completa",
        epilogue: "Epílogo",
        reviews: "Reseñas",
        buy: "Comprar",
        login: "Login"
      },
      actions: {
        buyNow: "Comprar ahora",
        goToBuy: "Ir a Comprar"
      }
    },
    pages: {
      index: {
        title: "Abel de Ferro | Sombra en el Espejo",
        eyebrow: "Novela psicológica",
        byline: "Por Abel de Ferro",
        tagline: "Abel de Ferro: narrativa psicológica con enfoque clínico y humano.",
        lead: "En esta web oficial, Abel de Ferro presenta su obra Sombra en el Espejo y su propuesta editorial: explicar con claridad las dinámicas de manipulación emocional, violencia psicológica y recuperación de la dignidad.",
        synopsisTitle: "Sinopsis",
        synopsisBody: "Sombra en el Espejo recorre la anatomía del control emocional y la dependencia, desde los gestos mínimos que parecen inofensivos hasta el momento en que todo vínculo se convierte en una jaula invisible. A través de personajes complejos y escenas de tensión contenida, el libro propone una lectura cruda pero necesaria sobre los límites del amor, la percepción y la dignidad personal.",
        quote: "\"No fue un grito lo que rompió el espejo; fue la costumbre de hablar en voz baja.\"",
        authorTitle: "Sobre Abel de Ferro",
        authorBody: "Abel de Ferro explora la narrativa de tensión emocional y los mecanismos del poder afectivo en relaciones contemporáneas. Su trabajo combina observación psicológica, ritmo literario y un enfoque crítico sobre la normalización del daño invisible.",
        footer: "© 2026 Abel de Ferro. Autor de Sombra en el Espejo."
      },
      ventas: {
        title: "Comprar | Abel de Ferro",
        eyebrow: "Compra oficial",
        loadingProduct: "Cargando producto...",
        buyBook: "Compra del Libro",
        buyBookLead: "Hay un único libro activo en este momento, con arquitectura lista para ampliar catálogo.",
        transparency: "Aviso de Transparencia",
        optionalEmbed: "Embed Opcional de Checkout",
        embedHint: "<!-- Inserta aquí tu código de Stripe Checkout embebido o Gumroad -->"
      },
      lectura: {
        title: "Lectura Completa | Abel de Ferro",
        eyebrow: "Contenido protegido",
        heading: "Lectura Completa",
        descriptionTitle: "Descripción del Libro",
        prologueTitle: "Prólogo (vista pública)",
        epilogueTitle: "Epílogo (vista pública)",
        lockedTitle: "Acceso no habilitado",
        lockedBody: "Para desbloquear el libro completo, realiza la compra y vuelve a esta sección.",
        fullTextTitle: "Texto completo"
      },
      epilogo: {
        title: "Epílogo | Abel de Ferro",
        eyebrow: "Cierre de obra",
        heading: "Epílogo",
        autoLoad: "Cargado automáticamente desde el manuscrito principal.",
        loading: "Cargando epílogo..."
      },
      reviews: {
        title: "Reseñas | Abel de Ferro",
        heading: "Sistema de Reseñas",
        intro: "Solo usuarios autenticados pueden enviar reseñas.",
        authChecking: "Verificando autenticación...",
        name: "Nombre",
        rating: "Valoración",
        comment: "Comentario",
        submit: "Publicar reseña",
        realtimeTitle: "Reseñas en tiempo real",
        realtimeBody: "Conectadas con Supabase.",
        star5: "5 estrellas",
        star4: "4 estrellas",
        star3: "3 estrellas",
        star2: "2 estrellas",
        star1: "1 estrella"
      },
      login: {
        title: "Login | Abel de Ferro",
        heading: "Acceso de Lectores",
        intro: "Inicia sesión para publicar reseñas y participar en la comunidad.",
        notice: "Si no tienes cuenta, puedes registrarte con email y contraseña.",
        google: "Entrar con Google",
        logout: "Cerrar sesión",
        email: "Email",
        password: "Contraseña",
        loginEmail: "Entrar con Email",
        createAccount: "Crear cuenta",
        forgot: "¿Olvidaste tu contraseña?"
      }
    },
    dynamic: {
      buy: {
        setupCta: "Configurar enlace de pago",
        grantedAccess: "Acceso otorgado",
        activeAccess: "Acceso activo al libro completo. Puedes entrar desde <a href=\"lectura.html\" class=\"underline\">Lectura Completa</a>.",
        pendingAccess: "Acceso no activo todavía. Completa la compra para habilitar <strong>Lectura Completa</strong>.",
        checkoutHint: "<strong>Tras completar el pago:</strong> tu acceso se activa automáticamente y puedes empezar a leer al instante.<br><br><span class=\"text-slate-600\">Si no se desbloquea al momento, recarga la página e inicia sesión de nuevo.</span>",
        productSubtitle: "Producto único activo ahora mismo. Plataforma: {platform}."
      },
      lectura: {
        loadError: "No se pudo cargar el libro completo.",
        active: "Acceso activo. Ya puedes leer el contenido completo.",
        pending: "Acceso pendiente. Activa tu compra en <a href=\"ventas.html\" class=\"underline\">Comprar</a> para desbloquear esta sección.",
        noPrologue: "Prólogo no disponible.",
        noEpilogue: "Epílogo no disponible.",
        prologueError: "Error al cargar prólogo: {message}",
        epilogueError: "Error al cargar epílogo: {message}"
      },
      epilogo: {
        noFound: "No se encontró el epílogo en el manuscrito.",
        readError: "No se pudo leer el manuscrito.",
        loadError: "No se pudo cargar el epílogo: {message}"
      },
      login: {
        sessionActive: "Sesión activa: {email}.",
        noSession: "No hay sesión activa.",
        redirectGoogle: "Redirigiendo a Google...",
        googleError: "Error con Google: {message}",
        fillEmailPassword: "Completa email y contraseña.",
        loginError: "No se pudo iniciar sesión: {message}",
        loginOk: "Sesión iniciada con email.",
        registerError: "No se pudo crear la cuenta: {message}",
        registerOk: "Cuenta creada correctamente. Revisa tu correo para confirmar.",
        logoutOk: "Sesión cerrada.",
        logoutError: "No se pudo cerrar sesión: {message}",
        fillResetEmail: "Introduce tu email para recuperar la contraseña.",
        resetError: "No se pudo enviar el correo: {message}",
        resetOk: "Correo de recuperación enviado. Revisa tu bandeja de entrada."
      },
      reviews: {
        none: "Aún no hay reseñas. Sé la primera persona en comentar.",
        firebaseConfig: "Reseñas conectadas con Supabase.",
        readError: "Error al leer reseñas: {message}",
        disabledPublic: "Publicación de reseñas no habilitada en esta versión pública.",
        connectedAs: "Conectado como {email}. Ya puedes publicar reseñas.",
        mustLogin: "Debes iniciar sesión para escribir reseñas. Ve a <a href=\"login.html\" class=\"underline\">Login</a>.",
        needLoginToPost: "Necesitas iniciar sesión para publicar.",
        completeFields: "Completa nombre y comentario.",
        publishOk: "Reseña publicada correctamente.",
        publishError: "No se pudo publicar la reseña: {message}"
      }
    },
    product: {
      name: "Sombra en el Espejo",
      description: "Compra única para habilitar acceso al libro completo en la plataforma.",
      publicDescription: "Sombra en el Espejo explora la violencia psicológica, la manipulación emocional y la recuperación de la dignidad personal desde una narrativa técnica y testimonial.",
      benefits: [
        { title: "Libro Completo", badge: "Acceso total", description: "Desbloquea la lectura completa dentro del sitio." },
        { title: "Formato Digital", badge: "Lectura inmediata", description: "Consulta online tras activar la compra." },
        { title: "Base Escalable", badge: "Preparado a futuro", description: "Catálogo listo para añadir nuevos libros o proyectos." }
      ],
      transparency: "Los fondos se destinan a edición, producción, distribución y mantenimiento del proyecto editorial. Los pagos se procesan mediante pasarela segura cifrada."
    }
  },
  en: {
    langName: "English",
    common: { menu: "Menu", language: "Language", nav: { home: "Home", synopsis: "Synopsis", fullReading: "Full Reading", epilogue: "Epilogue", reviews: "Reviews", buy: "Buy", login: "Login" }, actions: { buyNow: "Buy now", goToBuy: "Go to Buy" } },
    pages: { index: { title: "Abel de Ferro | Shadow in the Mirror", eyebrow: "Psychological novel", byline: "By Abel de Ferro", tagline: "Every reflection hides an invisible pact. Every silence does too.", lead: "A story that dives into psychological violence from an intimate lens.", synopsisTitle: "Synopsis", synopsisBody: "Shadow in the Mirror explores emotional control and dependency.", quote: "\"It was not a scream that broke the mirror; it was the habit of speaking softly.\"", authorTitle: "About Abel de Ferro", authorBody: "Abel de Ferro explores emotional tension narratives.", footer: "© 2026 Abel de Ferro. Author of Shadow in the Mirror." }, ventas: { title: "Buy | Abel de Ferro", eyebrow: "Official purchase", loadingProduct: "Loading product...", buyBook: "Buy the Book", buyBookLead: "There is one active book right now.", transparency: "Transparency Notice", optionalEmbed: "Optional Checkout Embed", embedHint: "<!-- Insert your Stripe Checkout embed or Gumroad code here -->" }, lectura: { title: "Full Reading | Abel de Ferro", eyebrow: "Protected content", heading: "Full Reading", descriptionTitle: "Book Description", prologueTitle: "Prologue (public preview)", epilogueTitle: "Epilogue (public preview)", lockedTitle: "Access not enabled", lockedBody: "To unlock the full book, complete the purchase and return here.", fullTextTitle: "Full text" }, epilogo: { title: "Epilogue | Abel de Ferro", eyebrow: "Work closure", heading: "Epilogue", autoLoad: "Loaded automatically from the main manuscript.", loading: "Loading epilogue..." }, reviews: { title: "Reviews | Abel de Ferro", heading: "Review System", intro: "Only authenticated users can post reviews.", authChecking: "Checking authentication...", name: "Name", rating: "Rating", comment: "Comment", submit: "Publish review", realtimeTitle: "Real-time reviews", realtimeBody: "Connected to Supabase.", star5: "5 stars", star4: "4 stars", star3: "3 stars", star2: "2 stars", star1: "1 star" }, login: { title: "Login | Abel de Ferro", heading: "Reader Access", intro: "Sign in to publish reviews and join the community.", notice: "If you do not have an account, register with email and password.", google: "Continue with Google", logout: "Sign out", email: "Email", password: "Password", loginEmail: "Sign in with Email", createAccount: "Create account", forgot: "Forgot your password?" } },
    dynamic: { buy: { setupCta: "Set payment link", grantedAccess: "Granted access", activeAccess: "Access active for the full book. You can enter from <a href=\"lectura.html\" class=\"underline\">Full Reading</a>.", pendingAccess: "Access not active yet. Complete the purchase to unlock <strong>Full Reading</strong>.", checkoutHint: "<strong>After payment:</strong> your access is activated automatically and you can start reading right away.<br><br><span class=\"text-slate-600\">If access does not unlock, refresh this page and log in again.</span>", productSubtitle: "Single active product right now. Platform: {platform}." }, lectura: { loadError: "Could not load the full book.", active: "Access active. You can now read the full content.", pending: "Access pending. Activate your purchase in <a href=\"ventas.html\" class=\"underline\">Buy</a> to unlock this section.", noPrologue: "Prologue not available.", noEpilogue: "Epilogue not available.", prologueError: "Error loading prologue: {message}", epilogueError: "Error loading epilogue: {message}" }, epilogo: { noFound: "Epilogue not found in manuscript.", readError: "Could not read manuscript.", loadError: "Could not load epilogue: {message}" }, login: { sessionActive: "Active session: {email}.", noSession: "No active session.", redirectGoogle: "Redirecting to Google...", googleError: "Google error: {message}", fillEmailPassword: "Complete email and password.", loginError: "Could not sign in: {message}", loginOk: "Signed in with email.", registerError: "Could not create account: {message}", registerOk: "Account created. Check your email to confirm.", logoutOk: "Session closed.", logoutError: "Could not sign out: {message}", fillResetEmail: "Enter your email to recover your password.", resetError: "Could not send email: {message}", resetOk: "Recovery email sent. Check your inbox." }, reviews: { none: "No reviews yet. Be the first to comment.", firebaseConfig: "Reviews connected to Supabase.", readError: "Error reading reviews: {message}", disabledPublic: "Review publishing is not enabled in this public version.", connectedAs: "Signed in as {email}. You can now post reviews.", mustLogin: "You must sign in to write reviews. Go to <a href=\"login.html\" class=\"underline\">Login</a>.", needLoginToPost: "You need to sign in to publish.", completeFields: "Fill name and comment.", publishOk: "Review published successfully.", publishError: "Could not publish review: {message}" } },
    product: { name: "Shadow in the Mirror", description: "One-time purchase to unlock full reading on the platform.", publicDescription: "Shadow in the Mirror explores psychological violence and emotional manipulation.", benefits: [{ title: "Full Book", badge: "Full access", description: "Unlock complete reading on site." }, { title: "Digital Format", badge: "Instant reading", description: "Read online after purchase activation." }, { title: "Scalable Base", badge: "Future-ready", description: "Catalog ready for more books and projects." }], transparency: "Funds support editing, production, distribution, and maintenance. Payments are securely processed." }
  }
};

DICT.fr = { ...DICT.en, langName: "Francais" };
DICT.de = { ...DICT.en, langName: "Deutsch" };
DICT.pt = { ...DICT.en, langName: "Portugues" };
DICT.it = { ...DICT.en, langName: "Italiano" };
DICT.zh = { ...DICT.en, langName: "中文" };

function replaceVars(template, vars) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => (vars[key] ?? ""));
}

function pathGet(obj, path) {
  return path.split(".").reduce((acc, key) => (acc && Object.prototype.hasOwnProperty.call(acc, key) ? acc[key] : undefined), obj);
}

export function normalizeLang(input) {
  const base = String(input || "").toLowerCase().split("-")[0];
  return SUPPORTED_LANGS.includes(base) ? base : "es";
}

export function getCurrentLang() {
  const url = new URL(window.location.href);
  const rawParam = (url.searchParams.get(PARAM_KEY) || "").toLowerCase().split("-")[0];
  if (SUPPORTED_LANGS.includes(rawParam)) {
    return rawParam;
  }

  const rawStorage = (localStorage.getItem(STORAGE_KEY) || "").toLowerCase().split("-")[0];
  if (SUPPORTED_LANGS.includes(rawStorage)) {
    return rawStorage;
  }

  return normalizeLang(navigator.language);
}

export function setCurrentLang(lang) {
  const next = normalizeLang(lang);
  localStorage.setItem(STORAGE_KEY, next);

  const url = new URL(window.location.href);
  url.searchParams.set(PARAM_KEY, next);
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  document.documentElement.lang = next;
  return next;
}

export function t(path, vars = {}, lang = getCurrentLang()) {
  const active = DICT[normalizeLang(lang)] || DICT.es;
  const fallback = DICT.es;
  const template = pathGet(active, path) ?? pathGet(fallback, path) ?? path;
  return replaceVars(template, vars);
}

export function getProductI18n(lang = getCurrentLang()) {
  const active = DICT[normalizeLang(lang)] || DICT.es;
  return active.product || DICT.es.product;
}

function localizeNavLinks(lang) {
  const links = document.querySelectorAll("a[href]");
  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("#")) {
      return;
    }

    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) {
      return;
    }

    url.searchParams.set(PARAM_KEY, lang);
    link.setAttribute("href", `${url.pathname.split("/").pop()}${url.search}${url.hash}`);
  });
}

function upsertLanguageSelectors(lang) {
  const nav = document.querySelector("header nav");
  if (!nav || document.getElementById("langSelector")) {
    return;
  }

  const wrap = document.createElement("div");
  wrap.className = "ml-2 flex items-center gap-2";

  const label = document.createElement("label");
  label.setAttribute("for", "langSelector");
  label.className = "text-xs font-semibold text-slate-600";
  label.textContent = t("common.language", {}, lang);

  const select = document.createElement("select");
  select.id = "langSelector";
  select.className = "lang-select";
  SUPPORTED_LANGS.forEach((code) => {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = (DICT[code] || DICT.en).langName || code;
    select.appendChild(option);
  });
  select.value = lang;
  select.addEventListener("change", () => {
    const next = setCurrentLang(select.value);
    applyTranslations(next);
  });

  wrap.append(label, select);
  nav.appendChild(wrap);
}

export function applyTranslations(lang = getCurrentLang()) {
  const active = setCurrentLang(lang);

  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.getAttribute("data-i18n");
    const text = t(key, {}, active);
    if (node.hasAttribute("data-i18n-html")) {
      node.innerHTML = text;
    } else {
      node.textContent = text;
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    const key = node.getAttribute("data-i18n-placeholder");
    node.setAttribute("placeholder", t(key, {}, active));
  });

  const page = document.body?.dataset?.page;
  if (page) {
    document.title = t(`pages.${page}.title`, {}, active);
  }

  const selectorLabel = document.querySelector("label[for='langSelector']");
  if (selectorLabel) {
    selectorLabel.textContent = t("common.language", {}, active);
  }

  localizeNavLinks(active);

  const selector = document.getElementById("langSelector");
  if (selector) {
    selector.value = active;
  }

  window.dispatchEvent(new CustomEvent("af:languageChanged", { detail: { lang: active } }));
}

export function initI18n() {
  const lang = getCurrentLang();
  upsertLanguageSelectors(lang);
  applyTranslations(lang);
  return lang;
}
