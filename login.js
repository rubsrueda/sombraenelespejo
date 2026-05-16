import { signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithProvider, signOut, getCurrentUser, upsertUsuario, resetPassword, logAuthAction } from "./auth-supabase.js";
import { setPreferredLoginOrigin } from "./affiliate.js";
import { trackEvent } from "./analytics.js";
import { t } from "./i18n.js";

const loginNotice = document.getElementById("loginNotice");
const authFeedback = document.getElementById("authFeedback");
const googleLoginBtn = document.getElementById("googleLoginBtn");
const facebookLoginBtn = document.getElementById("facebookLoginBtn");
const xLoginBtn = document.getElementById("xLoginBtn");
const tiktokOriginBtn = document.getElementById("tiktokOriginBtn");
const redditOriginBtn = document.getElementById("redditOriginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const emailLoginBtn = document.getElementById("emailLoginBtn");
const emailRegisterBtn = document.getElementById("emailRegisterBtn");
const userEmail = document.getElementById("userEmail");
const userPassword = document.getElementById("userPassword");
const resetPasswordBtn = document.getElementById("resetPasswordBtn");
// Recuperación de contraseña
resetPasswordBtn.addEventListener("click", async () => {
  const email = userEmail.value.trim();
  if (!email) {
    authFeedback.textContent = t("dynamic.login.fillResetEmail");
    return;
  }
  const { error } = await resetPassword(email);
  if (error) {
    authFeedback.textContent = t("dynamic.login.resetError", { message: error.message });
  } else {
    authFeedback.textContent = t("dynamic.login.resetOk");
  }
});

function readCredentials() {
  return {
    email: userEmail.value.trim(),
    password: userPassword.value,
  };
}

function setDisabled(disabled) {
  [
    googleLoginBtn,
    logoutBtn,
    emailLoginBtn,
    emailRegisterBtn,
    userEmail,
    userPassword,
  ].forEach((element) => {
    element.disabled = disabled;
  });
}


async function updateLoginStatus() {
  const user = await getCurrentUser();
  if (user) {
    loginNotice.textContent = t("dynamic.login.sessionActive", { email: user.email || "usuario" });
  } else {
    loginNotice.textContent = t("dynamic.login.noSession");
  }
}

googleLoginBtn.addEventListener("click", async () => {
  try {
    setPreferredLoginOrigin("google");
    trackEvent("af_login_attempt", { method: "google" });
    await signInWithGoogle();
    authFeedback.textContent = t("dynamic.login.redirectGoogle");
  } catch (error) {
    authFeedback.textContent = t("dynamic.login.googleError", { message: error.message });
  }
});

facebookLoginBtn.addEventListener("click", async () => {
  try {
    setPreferredLoginOrigin("facebook");
    trackEvent("af_login_attempt", { method: "facebook" });
    const { error } = await signInWithProvider("facebook");
    if (error) {
      throw error;
    }
    authFeedback.textContent = "Redirigiendo a Facebook...";
  } catch (error) {
    authFeedback.textContent = `Error con Facebook: ${error.message}`;
  }
});

xLoginBtn.addEventListener("click", async () => {
  try {
    setPreferredLoginOrigin("x");
    trackEvent("af_login_attempt", { method: "x" });
    const { error } = await signInWithProvider("twitter");
    if (error) {
      throw error;
    }
    authFeedback.textContent = "Redirigiendo a X...";
  } catch (error) {
    authFeedback.textContent = `Error con X: ${error.message}`;
  }
});

tiktokOriginBtn.addEventListener("click", () => {
  setPreferredLoginOrigin("tiktok");
  trackEvent("af_origin_selected", { origin: "tiktok" });
  authFeedback.textContent = "Origen TikTok guardado. Puedes continuar con Google o Email para iniciar sesión.";
});

redditOriginBtn.addEventListener("click", () => {
  setPreferredLoginOrigin("reddit");
  trackEvent("af_origin_selected", { origin: "reddit" });
  authFeedback.textContent = "Origen Reddit guardado. Puedes continuar con Google o Email para iniciar sesión.";
});

emailLoginBtn.addEventListener("click", async () => {
  const { email, password } = readCredentials();
  if (!email || !password) {
    authFeedback.textContent = t("dynamic.login.fillEmailPassword");
    return;
  }
  const { data, error } = await signInWithEmail(email, password);
  if (error) {
    authFeedback.textContent = t("dynamic.login.loginError", { message: error.message });
    return;
  }
  try {
    await upsertUsuario({ email, nombre: "", idioma: navigator.language });
    await logAuthAction("login_email", email, { metodo: "email" });
  } catch {
    // No bloquea el login si falla escritura auxiliar.
  }
  trackEvent("af_login_success", { method: "email" });
  authFeedback.textContent = t("dynamic.login.loginOk");
  updateLoginStatus();
});

emailRegisterBtn.addEventListener("click", async () => {
  const { email, password } = readCredentials();
  if (!email || !password) {
    authFeedback.textContent = t("dynamic.login.fillEmailPassword");
    return;
  }
  const { data, error } = await signUpWithEmail(email, password, "", navigator.language);
  if (error) {
    authFeedback.textContent = t("dynamic.login.registerError", { message: error.message });
    return;
  }
  try {
    await upsertUsuario({ email, nombre: "", idioma: navigator.language });
    await logAuthAction("registro_email", email, { metodo: "email" });
  } catch {
    // No bloquea el alta si falla escritura auxiliar.
  }
  trackEvent("af_signup_success", { method: "email" });
  authFeedback.textContent = t("dynamic.login.registerOk");
  updateLoginStatus();
});

logoutBtn.addEventListener("click", async () => {
  try {
    await signOut();
    authFeedback.textContent = t("dynamic.login.logoutOk");
    updateLoginStatus();
  } catch (error) {
    authFeedback.textContent = t("dynamic.login.logoutError", { message: error.message });
  }
});

updateLoginStatus();

window.addEventListener("af:languageChanged", () => {
  updateLoginStatus();
});
