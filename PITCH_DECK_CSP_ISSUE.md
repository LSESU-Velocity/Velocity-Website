# Pitch Deck CSP Issue - Debug Document

## Problem Summary
The pitch deck in Launchpad doesn't show animations when navigating between slides on the deployed site. The iframe appears blank or the content is blocked. Works fine in offline/dev mode with mock data.

## Root Cause
A strict Content Security Policy (CSP) was implemented that doesn't allow `'unsafe-inline'` in `script-src`. The pitch deck uses Reveal.js which requires inline scripts to initialize and handle slide transitions.

---

## Current CSP Policy (vercel.json)

```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' https://cdn.tailwindcss.com https://aistudiocdn.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src https://fonts.gstatic.com https://cdn.jsdelivr.net; img-src 'self' data: https:; connect-src 'self' https://firestore.googleapis.com https://generativelanguage.googleapis.com https://*.vercel.app; frame-src 'self' blob:"
}
```

**Key issue**: `script-src` does NOT include `'unsafe-inline'`

---

## How the Pitch Deck Works

1. API generates HTML containing a Reveal.js presentation
2. HTML is loaded into an iframe via `srcDoc`
3. HTML contains:
   - External Reveal.js from `https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/`
   - Inline `<script>` for Reveal.js initialization: `Reveal.initialize({...})`
   - We inject an inline `<script>` for message handling (prev/next slide navigation via postMessage)

### Files Involved
- `vercel.json` - CSP headers configuration
- `components/LaunchpadDashboard.tsx` - Contains the pitch deck iframe (lines ~120-180)
- `test_deck.html` - Example of pitch deck HTML structure

---

## Fixes Attempted

### Attempt 1: Blob URLs
**Theory**: Blob URLs create documents with a unique/null origin that don't inherit parent CSP.

**Changes**:
```tsx
// Created blob URL from HTML
const blob = new Blob([htmlWithMessageListener], { type: 'text/html' });
const url = URL.createObjectURL(blob);

// Used src instead of srcDoc
<iframe src={pitchDeckBlobUrl} />
```

**Result**: Browser showed "This content is blocked. Contact the site owner to fix the issue."

---

### Attempt 2: Added `frame-src blob:` to CSP
**Theory**: Blob URLs need explicit permission in CSP to be used as iframe sources.

**Changes to vercel.json**:
```
frame-src 'self' blob:
```

**Result**: Iframe loads (no blocked message) but content is completely blank/black.

---

### Attempt 3: Back to srcDoc with Sandbox (no allow-same-origin)
**Theory**: Using `sandbox` attribute WITHOUT `allow-same-origin` creates a unique opaque origin that doesn't inherit parent CSP.

**Changes**:
```tsx
<iframe
  srcDoc={getPitchDeckHtml()}
  sandbox="allow-scripts allow-modals allow-popups allow-forms"
  // Note: NO allow-same-origin
/>
```

**Result**: Still blank in production.

---

### Attempt 4: Injected Permissive CSP Meta Tag Inside iframe HTML
**Theory**: Add a `<meta>` CSP tag inside the iframe's HTML to override any inherited restrictions.

**Changes**:
```tsx
const getPitchDeckHtml = () => {
  let html = data.artifacts.pitchDeckHtml.replace('<head>', `<head>
    <meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline';">`);
  // ... rest of modifications
  return html;
};
```

**Result**: Still blank in production.

---

## Current State of Code

### LaunchpadDashboard.tsx (relevant section)
```tsx
const getPitchDeckHtml = () => {
    if (!data?.artifacts?.pitchDeckHtml) return '';
    
    // Inject permissive CSP meta tag
    let html = data.artifacts.pitchDeckHtml.replace('<head>', `<head>
        <meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline';">`);
    
    // Add message listener for navigation
    html = html.replace('</body>', `
        <script>
            window.addEventListener('message', (event) => {
                if (event.data.type === 'prevSlide') {
                    Reveal.prev();
                } else if (event.data.type === 'nextSlide') {
                    Reveal.next();
                }
            });
        </script>
        <style>
            html, body { height: 100%; overflow: hidden !important; }
            .reveal { height: 100% !important; }
        </style>
        </body>
    `);
    
    return html;
};

// In the JSX:
<iframe
    ref={pitchDeckIframeRef}
    srcDoc={getPitchDeckHtml()}
    className="w-full h-full border-0"
    title="Pitch Deck Preview"
    id="pitch-deck-preview"
    sandbox="allow-scripts allow-modals allow-popups allow-forms"
/>
```

---

## Observations

| Environment | Result |
|-------------|--------|
| Local dev (mock data) | Works perfectly |
| Production (Vercel) | Blank iframe |

The key difference is that CSP headers from `vercel.json` only apply in production.

---

## Possible Next Steps to Try

### 1. Temporarily Disable CSP for Testing
Remove or comment out the CSP header in `vercel.json` to confirm CSP is the cause.

### 2. Add `'unsafe-inline'` to script-src (Quick Fix, Less Secure)
```
script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com ...
```

### 3. Use Nonces for Inline Scripts
Generate a nonce server-side and add it to both the CSP header and the inline script tags.

### 4. Use Script Hashes
Calculate SHA-256 hashes of the inline scripts and add them to CSP:
```
script-src 'self' 'sha256-HASH_HERE' https://cdn.jsdelivr.net ...
```

### 5. Move Inline Scripts to External Files
- Host Reveal.js initialization in a separate JS file
- Modify the API to not generate inline scripts

### 6. Check Browser Console in Production
Open DevTools on the deployed site and check Console for specific CSP violation errors.

### 7. Try Data URI Approach
Instead of blob URL or srcDoc, try using a data URI:
```tsx
<iframe src={`data:text/html;charset=utf-8,${encodeURIComponent(html)}`} />
```

### 8. Consider Alternative to iframe
- Render Reveal.js directly in React instead of iframe
- Use a different presentation library that doesn't require inline scripts

---

## Relevant Documentation

- [MDN: Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy)
- [MDN: CSP script-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src)
- [MDN: iframe sandbox](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#sandbox)
- [Reveal.js Documentation](https://revealjs.com/)

---

## Questions to Investigate

1. What exactly does the browser console show on the deployed site?
2. Does the waitlist iframe (also uses srcDoc) work in production?
3. What does the actual generated `pitchDeckHtml` look like from the API?
4. Are there any differences in how Chrome/Firefox/Safari handle this?
