const STORAGE_KEY = "sombra_entitlements";

function readState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function writeState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function grantAccess(accessGrantId) {
  const state = readState();
  state[accessGrantId] = {
    grantedAt: new Date().toISOString(),
  };
  writeState(state);
}

export function hasAccess(accessGrantId) {
  if (!accessGrantId) {
    return false;
  }
  const state = readState();
  return Boolean(state[accessGrantId]);
}

export function applyCheckoutGrantFromUrl(params = {}) {
  const {
    token,
    grantId,
    accessParam = "access",
    returnParam = "checkout",
  } = params || {};
  
  if (!token || !grantId) {
    return false;
  }
  const url = new URL(window.location.href);
  const accessValue = url.searchParams.get(accessParam);
  const checkoutValue = url.searchParams.get(returnParam);

  if (accessValue !== token && checkoutValue !== "success") {
    return false;
  }

  grantAccess(grantId);

  url.searchParams.delete(accessParam);
  url.searchParams.delete(returnParam);
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  return true;
}
