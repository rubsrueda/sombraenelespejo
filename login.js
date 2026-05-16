import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { auth, googleProvider, isConfigured } from "./firebase-config.js";

const loginNotice = document.getElementById("loginNotice");
const authFeedback = document.getElementById("authFeedback");
const googleLoginBtn = document.getElementById("googleLoginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const emailLoginBtn = document.getElementById("emailLoginBtn");
const emailRegisterBtn = document.getElementById("emailRegisterBtn");
const userEmail = document.getElementById("userEmail");
const userPassword = document.getElementById("userPassword");

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

if (!isConfigured || !auth) {
  loginNotice.textContent = "Acceso de cuenta no habilitado en esta versión pública.";
  authFeedback.textContent = "Modo de navegación abierta: puedes continuar sin iniciar sesión.";
  setDisabled(true);
} else {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      loginNotice.textContent = `Sesión activa: ${user.email || "usuario"}.`;
    } else {
      loginNotice.textContent = "No hay sesión activa.";
    }
  });

  googleLoginBtn.addEventListener("click", async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      authFeedback.textContent = "Sesión iniciada con Google.";
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

    try {
      await signInWithEmailAndPassword(auth, email, password);
      authFeedback.textContent = "Sesión iniciada con email.";
    } catch (error) {
      authFeedback.textContent = `No se pudo iniciar sesión: ${error.message}`;
    }
  });

  emailRegisterBtn.addEventListener("click", async () => {
    const { email, password } = readCredentials();

    if (!email || !password) {
      authFeedback.textContent = "Completa email y contraseña.";
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      authFeedback.textContent = "Cuenta creada correctamente.";
    } catch (error) {
      authFeedback.textContent = `No se pudo crear la cuenta: ${error.message}`;
    }
  });

  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      authFeedback.textContent = "Sesión cerrada.";
    } catch (error) {
      authFeedback.textContent = `No se pudo cerrar sesión: ${error.message}`;
    }
  });
}
