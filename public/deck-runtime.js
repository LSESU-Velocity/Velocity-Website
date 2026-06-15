/**
 * Reveal.js runtime for pitch deck iframes.
 * Loaded externally to avoid 'unsafe-inline' in CSP.
 */

var revealInitStarted = false;
var revealInitAttempts = 0;

function initializeRevealWhenReady() {
  if (revealInitStarted) return;

  if (typeof Reveal === 'undefined') {
    revealInitAttempts += 1;
    if (revealInitAttempts <= 40) {
      window.setTimeout(initializeRevealWhenReady, 50);
    }
    return;
  }

  revealInitStarted = true;
  Reveal.initialize({
    hash: false,
    controls: true,
    progress: true,
    center: true,
    transition: 'slide',
    embedded: true,
    keyboardCondition: 'focused'
  }).catch(function(err) {
    console.error('Reveal.js initialization failed:', err);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeRevealWhenReady, { once: true });
} else {
  initializeRevealWhenReady();
}

window.addEventListener('load', initializeRevealWhenReady);

// Listen for parent navigation commands via postMessage
window.addEventListener('message', function(event) {
  if (typeof Reveal === 'undefined') return;
  
  if (event.data && event.data.type === 'prevSlide') {
    Reveal.prev();
  } else if (event.data && event.data.type === 'nextSlide') {
    Reveal.next();
  }
});
