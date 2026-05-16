import { supabase } from "./supabase-client.js";
import { t } from "./i18n.js";

const authNotice = document.getElementById("authNotice");
const reviewForm = document.getElementById("reviewForm");
const reviewFeedback = document.getElementById("reviewFeedback");
const reviewsList = document.getElementById("reviewsList");
const submitReviewBtn = document.getElementById("submitReviewBtn");
const openComposerBtn = document.getElementById("openComposerBtn");
const cancelComposerBtn = document.getElementById("cancelComposerBtn");
const reviewRatingInput = document.getElementById("reviewRating");
const ratingPicker = document.getElementById("ratingPicker");
const ratingAverage = document.getElementById("ratingAverage");
const ratingStars = document.getElementById("ratingStars");
const ratingCount = document.getElementById("ratingCount");
const translateAllBtn = document.getElementById("translateAllBtn");

let currentUser = null;
let translatedMode = false;
let cachedItems = [];

function starsFromRating(rating) {
  const safeRating = Math.max(1, Math.min(5, Number(rating) || 1));
  return "★".repeat(safeRating) + "☆".repeat(5 - safeRating);
}

function formatScore(score) {
  return Number(score || 0).toFixed(1);
}

function formatReviewDate(isoDate) {
  const date = isoDate ? new Date(isoDate) : new Date();
  return new Intl.DateTimeFormat("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function parseReviewBody(raw = "") {
  const normalized = String(raw).trim();
  const [titleLine, ...rest] = normalized.split("\n\n");
  if (rest.length === 0) {
    return {
      title: "Opinión sin título",
      body: titleLine,
    };
  }
  return {
    title: titleLine,
    body: rest.join("\n\n"),
  };
}

function fakeTranslateToSpanish(text) {
  if (!text) return text;
  // Placeholder visual para UX tipo marketplace sin servicio externo de traducción.
  return `Versión en español: ${text}`;
}

function setComposerOpen(open) {
  reviewForm.classList.toggle("hidden", !open);
  openComposerBtn.classList.toggle("hidden", open);
}

function setSelectedRating(value) {
  const safe = Math.max(1, Math.min(5, Number(value) || 5));
  reviewRatingInput.value = String(safe);

  if (!ratingPicker) return;
  const starButtons = ratingPicker.querySelectorAll(".star-pick");
  starButtons.forEach((button) => {
    const buttonValue = Number(button.dataset.value || 0);
    button.classList.toggle("active", buttonValue <= safe);
    button.setAttribute("aria-checked", buttonValue === safe ? "true" : "false");
  });
}

function renderSummary(items) {
  if (!items.length) {
    ratingAverage.textContent = "0.0";
    ratingStars.textContent = "☆☆☆☆☆";
    ratingCount.textContent = "0 valoraciones globales";
    return;
  }

  const total = items.reduce((acc, item) => acc + (Number(item.rating) || 0), 0);
  const average = total / items.length;
  ratingAverage.textContent = formatScore(average);
  ratingStars.textContent = starsFromRating(Math.round(average));
  ratingCount.textContent = `${items.length} valoraciones globales`;
}

function setFormEnabled(enabled) {
  const controls = reviewForm.querySelectorAll("input, select, textarea, button");
  controls.forEach((control) => {
    control.disabled = !enabled;
  });
  submitReviewBtn.classList.toggle("opacity-50", !enabled);
  submitReviewBtn.classList.toggle("cursor-not-allowed", !enabled);
}

function renderReviews(items) {
  cachedItems = items;
  renderSummary(items);
  reviewsList.innerHTML = "";

  if (!items.length) {
    reviewsList.innerHTML = `<article class="review-card"><p>${t("dynamic.reviews.none")}</p></article>`;
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "review-card amazon-review-card";

    const parsed = parseReviewBody(item.comment);
    const effectiveBody = translatedMode ? fakeTranslateToSpanish(parsed.body) : parsed.body;

    const top = document.createElement("div");
    top.className = "review-topline";

    const name = document.createElement("h3");
    name.className = "m-0 text-xl review-user";
    name.textContent = item.name;

    const verified = document.createElement("span");
    verified.className = "review-verified";
    verified.textContent = "Compra verificada";

    top.append(name, verified);

    const starsLine = document.createElement("p");
    starsLine.className = "stars m-0";
    starsLine.textContent = `${formatScore(item.rating)} de 5 estrellas ${parsed.title}`;

    const meta = document.createElement("p");
    meta.className = "review-meta";
    meta.textContent = `Calificado en Estados Unidos el ${formatReviewDate(item.createdAt)} · Formato: Digital`;

    const stars = document.createElement("p");
    stars.className = "review-star-strip";
    stars.textContent = starsFromRating(item.rating);

    const comment = document.createElement("p");
    comment.className = "mt-2";
    comment.textContent = effectiveBody;

    const actions = document.createElement("div");
    actions.className = "review-actions";

    const helpfulBtn = document.createElement("button");
    helpfulBtn.type = "button";
    helpfulBtn.className = "review-pill-btn";
    helpfulBtn.textContent = "Útil";

    const reportBtn = document.createElement("button");
    reportBtn.type = "button";
    reportBtn.className = "review-pill-btn";
    reportBtn.textContent = "Reportar";

    const translateBtn = document.createElement("button");
    translateBtn.type = "button";
    translateBtn.className = "review-link-btn";
    translateBtn.textContent = "Traducir opinión al idioma Español";
    translateBtn.addEventListener("click", () => {
      comment.textContent = fakeTranslateToSpanish(parsed.body);
    });

    actions.append(helpfulBtn, reportBtn, translateBtn);

    card.append(top, starsLine, meta, stars, comment, actions);
    reviewsList.appendChild(card);
  });
}

async function loadReviews() {
  const { data, error } = await supabase
    .from("af_reviews")
    .select("id, nombre, valoracion, comentario, creado_en")
    .order("creado_en", { ascending: false })
    .limit(200);

  if (error) {
    reviewsList.innerHTML = `<article class="review-card"><p>${t("dynamic.reviews.readError", { message: error.message })}</p></article>`;
    return;
  }

  const items = (data || []).map((row) => ({
    id: row.id,
    name: row.nombre,
    rating: Number(row.valoracion),
    comment: row.comentario,
    createdAt: row.creado_en,
  }));

  renderReviews(items);
}

async function syncAuthState() {
  const { data } = await supabase.auth.getUser();
  currentUser = data.user;

  if (currentUser) {
    authNotice.textContent = t("dynamic.reviews.connectedAs", { email: currentUser.email || "usuario" });
    setFormEnabled(true);
  } else {
    authNotice.innerHTML = t("dynamic.reviews.mustLogin");
    setFormEnabled(false);
  }
}

supabase.auth.onAuthStateChange(() => {
  syncAuthState();
});

syncAuthState();
loadReviews();
setSelectedRating(5);

if (openComposerBtn) {
  openComposerBtn.addEventListener("click", () => {
    setComposerOpen(true);
  });
}

if (cancelComposerBtn) {
  cancelComposerBtn.addEventListener("click", () => {
    setComposerOpen(false);
    reviewFeedback.textContent = "";
  });
}

if (ratingPicker) {
  const starButtons = ratingPicker.querySelectorAll(".star-pick");
  starButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setSelectedRating(button.dataset.value);
    });
  });
}

if (translateAllBtn) {
  translateAllBtn.addEventListener("click", () => {
    translatedMode = !translatedMode;
    translateAllBtn.textContent = translatedMode
      ? "Mostrar texto original de las opiniones"
      : "Traducir todas las opiniones al Español";
    renderReviews(cachedItems);
  });
}

reviewForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser) {
    reviewFeedback.textContent = t("dynamic.reviews.needLoginToPost");
    return;
  }

  const formData = new FormData(reviewForm);
  const reviewTitle = String(formData.get("reviewTitle") || "").trim();
  const reviewBody = String(formData.get("reviewComment") || "").trim();
  const payload = {
    name: String(formData.get("reviewName") || "").trim(),
    rating: Number(formData.get("reviewRating") || 5),
    comment: `${reviewTitle}\n\n${reviewBody}`.trim(),
    userId: currentUser.id,
    email: currentUser.email,
  };

  if (!payload.name || !reviewTitle || !reviewBody) {
    reviewFeedback.textContent = t("dynamic.reviews.completeFields");
    return;
  }

  try {
    const { error } = await supabase.from("af_reviews").insert([
      {
        usuario_id: payload.userId,
        email: payload.email,
        nombre: payload.name,
        valoracion: payload.rating,
        comentario: payload.comment,
      },
    ]);

    if (error) {
      throw error;
    }

    reviewForm.reset();
    setSelectedRating(5);
    setComposerOpen(false);
    reviewFeedback.textContent = t("dynamic.reviews.publishOk");
    loadReviews();
  } catch (error) {
    reviewFeedback.textContent = t("dynamic.reviews.publishError", { message: error.message });
  }
});

