import { supabase } from "./supabase-client.js";
import { t } from "./i18n.js";

const authNotice = document.getElementById("authNotice");
const reviewForm = document.getElementById("reviewForm");
const reviewFeedback = document.getElementById("reviewFeedback");
const reviewsList = document.getElementById("reviewsList");
const submitReviewBtn = document.getElementById("submitReviewBtn");

let currentUser = null;

function starsFromRating(rating) {
  const safeRating = Math.max(1, Math.min(5, Number(rating) || 1));
  return "★".repeat(safeRating) + "☆".repeat(5 - safeRating);
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
  reviewsList.innerHTML = "";

  if (!items.length) {
    reviewsList.innerHTML = `<article class="review-card"><p>${t("dynamic.reviews.none")}</p></article>`;
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "review-card";

    const name = document.createElement("h3");
    name.className = "m-0 text-xl";
    name.textContent = item.name;

    const stars = document.createElement("p");
    stars.className = "stars m-0";
    stars.textContent = starsFromRating(item.rating);

    const comment = document.createElement("p");
    comment.className = "mt-2";
    comment.textContent = item.comment;

    card.append(name, stars, comment);
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
    rating: row.valoracion,
    comment: row.comentario,
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

reviewForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser) {
    reviewFeedback.textContent = t("dynamic.reviews.needLoginToPost");
    return;
  }

  const formData = new FormData(reviewForm);
  const payload = {
    name: String(formData.get("reviewName") || "").trim(),
    rating: Number(formData.get("reviewRating") || 5),
    comment: String(formData.get("reviewComment") || "").trim(),
    userId: currentUser.id,
    email: currentUser.email,
  };

  if (!payload.name || !payload.comment) {
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
    reviewFeedback.textContent = t("dynamic.reviews.publishOk");
    loadReviews();
  } catch (error) {
    reviewFeedback.textContent = t("dynamic.reviews.publishError", { message: error.message });
  }
});

