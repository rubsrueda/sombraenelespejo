import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { getFirestore, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "REEMPLAZAR_API_KEY",
  authDomain: "REEMPLAZAR_AUTH_DOMAIN",
  projectId: "REEMPLAZAR_PROJECT_ID",
  storageBucket: "REEMPLAZAR_STORAGE_BUCKET",
  messagingSenderId: "REEMPLAZAR_MESSAGING_SENDER_ID",
  appId: "REEMPLAZAR_APP_ID",
};

const isConfigured = !Object.values(firebaseConfig).some((value) =>
  String(value).startsWith("REEMPLAZAR_"),
);

let auth = null;
let db = null;
let googleProvider = null;

if (isConfigured) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
  setPersistence(auth, browserLocalPersistence).catch(() => {
    // Mantiene funcionamiento incluso si el navegador bloquea persistencia.
  });
}

export {
  auth,
  db,
  googleProvider,
  isConfigured,
  serverTimestamp,
};
