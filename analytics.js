const GA_MEASUREMENT_ID = "G-XXXXXXXXXX";
let analyticsReady = false;

function canUseGA() {
  return GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== "G-XXXXXXXXXX";
}

export function initAnalytics() {
  if (!canUseGA()) {
    return false;
  }

  if (analyticsReady) {
    return true;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  if (!document.querySelector('script[data-af-ga="true"]')) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    script.dataset.afGa = "true";
    document.head.appendChild(script);
  }

  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID, {
    page_path: window.location.pathname + window.location.search,
  });

  analyticsReady = true;
  return true;
}

export function trackEvent(name, params = {}) {
  if (!analyticsReady || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", name, params);
}
