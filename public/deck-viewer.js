function showError(message) {
  var el = document.getElementById("error");
  if (!el) return;
  el.classList.add("is-visible");
  if (message) {
    var p = document.createElement("p");
    p.className = "viewer-error-detail";
    p.textContent = message;
    el.appendChild(p);
  }
}

function readDeckKeyFromHash() {
  var raw = (location.hash || "").slice(1);
  if (!raw) return "";
  try {
    return decodeURIComponent(raw);
  } catch (e) {
    return raw;
  }
}

function isAllowedDeckKey(key) {
  return /^velocity:deck:[0-9]{10,}:[a-f0-9]+$/.test(key);
}

function init() {
  var key = readDeckKeyFromHash();
  if (!key || !isAllowedDeckKey(key)) {
    showError("Missing deck key.");
    return;
  }

  var deckHtml = null;
  try {
    deckHtml = localStorage.getItem(key);
  } catch (e) {}

  if (!deckHtml) {
    showError("Deck content not found in localStorage.");
    return;
  }

  // Best-effort cleanup (safe if it fails).
  try {
    localStorage.removeItem(key);
  } catch (e) {}

  var frame = document.getElementById("deck-frame");
  if (!frame) {
    showError("Viewer error: deck frame missing.");
    return;
  }

  frame.srcdoc = deckHtml;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

