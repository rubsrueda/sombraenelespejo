import { signInWithEmail, signUpWithEmail, signInWithGoogle, signOut, getCurrentUser, upsertUsuario, resetPassword } from "./auth-supabase.js";
import { t } from "./i18n.js";

const loginNotice = document.getElementById("loginNotice");
const authFeedback = document.getElementById("authFeedback");
const googleLoginBtn = document.getElementById("googleLoginBtn");
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
    await signInWithGoogle();
    authFeedback.textContent = t("dynamic.login.redirectGoogle");
  } catch (error) {
    authFeedback.textContent = t("dynamic.login.googleError", { message: error.message });
  }
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
  await upsertUsuario({ email, nombre: "", idioma: navigator.language });
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
  await upsertUsuario({ email, nombre: "", idioma: navigator.language });
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
