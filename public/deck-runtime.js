/**
 * Reveal.js runtime for pitch deck iframes.
 * Loaded externally to avoid 'unsafe-inline' in CSP.
 */

// Initialize Reveal.js when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  if (typeof Reveal !== 'undefined') {
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
});

// Listen for parent navigation commands via postMessage
window.addEventListener('message', function(event) {
  if (typeof Reveal === 'undefined') return;
  
  if (event.data && event.data.type === 'prevSlide') {
    Reveal.prev();
  } else if (event.data && event.data.type === 'nextSlide') {
    Reveal.next();
  }
});
