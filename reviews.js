import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { auth, db, isConfigured, serverTimestamp } from "./firebase-config.js";
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

function startRealtimeReviews() {
  if (!isConfigured || !db) {
    reviewsList.innerHTML =
      `<article class="review-card"><p>${t("dynamic.reviews.firebaseConfig")}</p></article>`;
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
      reviewsList.innerHTML = `<article class="review-card"><p>${t("dynamic.reviews.readError", { message: error.message })}</p></article>`;
    },
  );
}

if (!isConfigured || !auth || !db) {
  authNotice.textContent = t("dynamic.reviews.disabledPublic");
  setFormEnabled(false);
  startRealtimeReviews();
} else {
  onAuthStateChanged(auth, (user) => {
    currentUser = user;

    if (currentUser) {
      authNotice.textContent = t("dynamic.reviews.connectedAs", { email: currentUser.email || "usuario" });
      setFormEnabled(true);
    } else {
      authNotice.innerHTML = t("dynamic.reviews.mustLogin");
      setFormEnabled(false);
    }
  });

  startRealtimeReviews();
}

reviewForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser || !db) {
    reviewFeedback.textContent = t("dynamic.reviews.needLoginToPost");
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
    reviewFeedback.textContent = t("dynamic.reviews.completeFields");
    return;
  }

  try {
    await addDoc(collection(db, "reviews"), payload);
    reviewForm.reset();
    reviewFeedback.textContent = t("dynamic.reviews.publishOk");
  } catch (error) {
    reviewFeedback.textContent = t("dynamic.reviews.publishError", { message: error.message });
  }
});

