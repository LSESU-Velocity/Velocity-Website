function showError() {
  var errorEl = document.getElementById("error");
  var iframe = document.getElementById("preview");
  if (iframe) iframe.classList.add("is-hidden");
  if (errorEl) errorEl.classList.add("is-visible");
}

function readStorageKeyFromHash() {
  var raw = (location.hash || "").slice(1);
  if (!raw) return "";
  try {
    return decodeURIComponent(raw);
  } catch (e) {
    return raw;
  }
}

function isAllowedStorageKey(key) {
  return /^velocity:(waitlist|pitchDeck):[0-9]{10,}:[a-f0-9]+$/.test(key);
}

function init() {
  var key = readStorageKeyFromHash();
  if (!key || !isAllowedStorageKey(key)) {
    showError();
    return;
  }

  var html = null;
  try {
    html = localStorage.getItem(key);
    localStorage.removeItem(key);
  } catch (e) {}

  if (!html) {
    showError();
    return;
  }

  var iframe = document.getElementById("preview");
  if (!iframe) {
    showError();
    return;
  }

  iframe.srcdoc = html;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
