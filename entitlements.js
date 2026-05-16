import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { auth, db, isConfigured, serverTimestamp } from "./firebase-config.js";
import { hasAccess } from "./access-control.js";

function authReady() {
  if (!isConfigured || !auth) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

function entitlementRef(userId, grantId) {
  return doc(db, "users", userId, "entitlements", grantId);
}

export async function saveEntitlementForCurrentUser(grantId) {
  if (!isConfigured || !db || !auth) {
    return false;
  }

  const user = await authReady();
  if (!user) {
    return false;
  }

  await setDoc(
    entitlementRef(user.uid, grantId),
    {
      grantId,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return true;
}

export async function hasEntitlementInFirebase(grantId) {
  if (!isConfigured || !db || !auth) {
    return false;
  }

  const user = await authReady();
  if (!user) {
    return false;
  }

  const snapshot = await getDoc(entitlementRef(user.uid, grantId));
  return snapshot.exists();
}

export async function resolveAccess(grantId) {
  if (hasAccess(grantId)) {
    return true;
  }

  try {
    return await hasEntitlementInFirebase(grantId);
  } catch {
    return false;
  }
}
