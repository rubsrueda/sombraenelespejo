import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { auth, db, isConfigured, serverTimestamp } from "./firebase-config.js";

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
    reviewsList.innerHTML = '<article class="review-card"><p>Aún no hay reseñas. Sé la primera persona en comentar.</p></article>';
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

function startRealtimeReviews() {
  if (!isConfigured || !db) {
    reviewsList.innerHTML =
      '<article class="review-card"><p>Configura Firebase en firebase-config.js para activar las reseñas en tiempo real.</p></article>';
    return;
  }

  const reviewsRef = collection(db, "reviews");
  const reviewsQuery = query(reviewsRef, orderBy("createdAt", "desc"));

  onSnapshot(
    reviewsQuery,
    (snapshot) => {
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      renderReviews(items);
    },
    (error) => {
      reviewsList.innerHTML = `<article class="review-card"><p>Error al leer reseñas: ${error.message}</p></article>`;
    },
  );
}

if (!isConfigured || !auth || !db) {
  authNotice.textContent = "Firebase no está configurado todavía. Completa firebase-config.js para activar login y reseñas.";
  setFormEnabled(false);
  startRealtimeReviews();
} else {
  onAuthStateChanged(auth, (user) => {
    currentUser = user;

    if (currentUser) {
      authNotice.textContent = `Conectado como ${currentUser.email || "usuario"}. Ya puedes publicar reseñas.`;
      setFormEnabled(true);
    } else {
      authNotice.innerHTML = 'Debes iniciar sesión para escribir reseñas. Ve a <a href="login.html" class="underline">Login</a>.';
      setFormEnabled(false);
    }
  });

  startRealtimeReviews();
}

reviewForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser || !db) {
    reviewFeedback.textContent = "Necesitas iniciar sesión para publicar.";
    return;
  }

  const formData = new FormData(reviewForm);
  const payload = {
    name: String(formData.get("reviewName") || "").trim(),
    rating: Number(formData.get("reviewRating") || 5),
    comment: String(formData.get("reviewComment") || "").trim(),
    userId: currentUser.uid,
    createdAt: serverTimestamp(),
  };

  if (!payload.name || !payload.comment) {
    reviewFeedback.textContent = "Completa nombre y comentario.";
    return;
  }

  try {
    await addDoc(collection(db, "reviews"), payload);
    reviewForm.reset();
    reviewFeedback.textContent = "Reseña publicada correctamente.";
  } catch (error) {
    reviewFeedback.textContent = `No se pudo publicar la reseña: ${error.message}`;
  }
});
