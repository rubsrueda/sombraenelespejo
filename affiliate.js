const ATTRIBUTION_KEY = "af_affiliate_attribution";
const PREFERRED_ORIGIN_KEY = "af_preferred_login_origin";
const TTL_DAYS = 30;

function nowMs() {
  return Date.now();
}

function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors in private mode.
  }
}

function writeCookie(name, value, days) {
  const expires = new Date(nowMs() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function normalizeSource(value) {
  return String(value || "").trim().toLowerCase();
}

export function captureAffiliateFromUrl() {
  const url = new URL(window.location.href);
  const ref = url.searchParams.get("ref") || url.searchParams.get("affiliate") || url.searchParams.get("aff") || "";
  const source = url.searchParams.get("utm_source") || ref || "";
  const medium = url.searchParams.get("utm_medium") || "";
  const campaign = url.searchParams.get("utm_campaign") || "";
  const term = url.searchParams.get("utm_term") || "";
  const content = url.searchParams.get("utm_content") || "";

  if (!ref && !source && !medium && !campaign && !term && !content) {
    return null;
  }

  const attribution = {
    ref: normalizeSource(ref),
    utm_source: normalizeSource(source),
    utm_medium: normalizeSource(medium),
    utm_campaign: campaign.trim(),
    utm_term: term.trim(),
    utm_content: content.trim(),
    landing_path: `${url.pathname}${url.search}`,
    captured_at: new Date().toISOString(),
    expires_at: new Date(nowMs() + TTL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
  };

  writeJson(ATTRIBUTION_KEY, attribution);
  writeCookie("af_ref", attribution.ref || attribution.utm_source || "direct", TTL_DAYS);

  return attribution;
}

export function getAffiliateAttribution() {
  const attribution = readJson(ATTRIBUTION_KEY);
  if (!attribution) {
    return null;
  }

  if (!attribution.expires_at || nowMs() > new Date(attribution.expires_at).getTime()) {
    localStorage.removeItem(ATTRIBUTION_KEY);
    return null;
  }

  return attribution;
}

export function setPreferredLoginOrigin(origin) {
  const normalized = normalizeSource(origin);
  if (!normalized) {
    return;
  }
  localStorage.setItem(PREFERRED_ORIGIN_KEY, normalized);
}

export function getPreferredLoginOrigin() {
  return normalizeSource(localStorage.getItem(PREFERRED_ORIGIN_KEY) || "");
}

export function getAttributionSnapshot(extra = {}) {
  const attribution = getAffiliateAttribution();
  const preferredOrigin = getPreferredLoginOrigin();

  return {
    ...extra,
    preferred_origin: preferredOrigin || null,
    attribution,
  };
}
