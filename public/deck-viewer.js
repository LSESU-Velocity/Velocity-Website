/* global Reveal */

function showError(message) {
  var el = document.getElementById("error");
  if (!el) return;
  el.style.display = "block";
  if (message) {
    var p = document.createElement("p");
    p.style.margin = "12px 0 0 0";
    p.style.opacity = "0.8";
    p.textContent = message;
    el.appendChild(p);
  }
}

function extractSlidesInnerHtml(deckHtml) {
  try {
    var doc = new DOMParser().parseFromString(deckHtml, "text/html");
    var slides = doc.querySelector(".reveal .slides") || doc.querySelector(".slides");
    return slides ? slides.innerHTML : null;
  } catch (e) {
    return null;
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

function init() {
  var key = readDeckKeyFromHash();
  if (!key) {
    showError("Missing deck key.");
    return;
  }

  var deckHtml = null;
  try {
    deckHtml = localStorage.getItem(key);
  } catch (e) {}

  if (!deckHtml) {
    showError("Deck content not found in localStorage for key: " + key);
    return;
  }

  // Best-effort cleanup (safe if it fails).
  try {
    localStorage.removeItem(key);
  } catch (e) {}

  var slidesInner = extractSlidesInnerHtml(deckHtml);
  if (!slidesInner) {
    showError("Could not extract slides from deck HTML.");
    return;
  }

  var slidesEl = document.getElementById("slides");
  if (!slidesEl) {
    showError("Viewer error: slides container missing.");
    return;
  }
  slidesEl.innerHTML = slidesInner;

  if (typeof Reveal === "undefined") {
    showError("Reveal.js failed to load from /reveal/reveal.js.");
    return;
  }

  Reveal.initialize({
    hash: false,
    controls: true,
    progress: true,
    center: true,
    transition: "slide",
  }).catch(function (err) {
    showError(
      "Reveal.initialize() failed: " +
        (err && err.message ? err.message : String(err))
    );
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

