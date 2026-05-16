import { signInWithEmail, signUpWithEmail, signInWithGoogle, signOut, getCurrentUser, upsertUsuario, resetPassword } from "./auth-supabase.js";

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
    authFeedback.textContent = "Introduce tu email para recuperar la contraseña.";
    return;
  }
  const { error } = await resetPassword(email);
  if (error) {
    authFeedback.textContent = `No se pudo enviar el correo: ${error.message}`;
  } else {
    authFeedback.textContent = "Correo de recuperación enviado. Revisa tu bandeja de entrada.";
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
    loginNotice.textContent = `Sesión activa: ${user.email || "usuario"}.`;
  } else {
    loginNotice.textContent = "No hay sesión activa.";
  }
}

googleLoginBtn.addEventListener("click", async () => {
  try {
    await signInWithGoogle();
    authFeedback.textContent = "Redirigiendo a Google...";
  } catch (error) {
    authFeedback.textContent = `Error con Google: ${error.message}`;
  }
});

emailLoginBtn.addEventListener("click", async () => {
  const { email, password } = readCredentials();
  if (!email || !password) {
    authFeedback.textContent = "Completa email y contraseña.";
    return;
  }
  const { data, error } = await signInWithEmail(email, password);
  if (error) {
    authFeedback.textContent = `No se pudo iniciar sesión: ${error.message}`;
    return;
  }
  await upsertUsuario({ email, nombre: "", idioma: navigator.language });
  authFeedback.textContent = "Sesión iniciada con email.";
  updateLoginStatus();
});

emailRegisterBtn.addEventListener("click", async () => {
  const { email, password } = readCredentials();
  if (!email || !password) {
    authFeedback.textContent = "Completa email y contraseña.";
    return;
  }
  const { data, error } = await signUpWithEmail(email, password, "", navigator.language);
  if (error) {
    authFeedback.textContent = `No se pudo crear la cuenta: ${error.message}`;
    return;
  }
  await upsertUsuario({ email, nombre: "", idioma: navigator.language });
  authFeedback.textContent = "Cuenta creada correctamente. Revisa tu correo para confirmar.";
  updateLoginStatus();
});

logoutBtn.addEventListener("click", async () => {
  try {
    await signOut();
    authFeedback.textContent = "Sesión cerrada.";
    updateLoginStatus();
  } catch (error) {
    authFeedback.textContent = `No se pudo cerrar sesión: ${error.message}`;
  }
});

updateLoginStatus();
