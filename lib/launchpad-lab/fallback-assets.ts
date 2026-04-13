import type { ArtifactBundle } from './schemas.js';
import type { ArtifactPromptContext } from './prompts.js';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderList(items: string[]): string {
  return items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join('');
}

function renderWaitlistHtml(context: ArtifactPromptContext): string {
  const benefits = context.market.keyInsights.slice(0, 3);
  const tests = context.market.whatToTestFirst.slice(0, 2);
  const primarySegment = context.customerSegments[0];

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(context.identity.name)} | Join the waitlist</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Arial, Helvetica, sans-serif;
      background:
        radial-gradient(circle at top left, rgba(255, 59, 48, 0.18), transparent 28%),
        linear-gradient(180deg, #111111 0%, #050505 100%);
      color: #f5f5f5;
    }
    .shell { max-width: 420px; margin: 0 auto; min-height: 100vh; padding: 24px 20px 48px; }
    .eyebrow {
      display: inline-flex; align-items: center; gap: 8px; border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.04); border-radius: 999px; padding: 8px 12px; font-size: 11px;
      letter-spacing: 0.18em; text-transform: uppercase; color: #ff6b61;
    }
    h1 { font-size: 42px; line-height: 1.02; margin: 18px 0 12px; letter-spacing: -0.04em; }
    p { color: rgba(255,255,255,0.72); line-height: 1.6; }
    .card {
      margin-top: 18px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04);
      border-radius: 24px; padding: 18px;
    }
    .label { font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(255,255,255,0.42); margin-bottom: 10px; }
    ul { margin: 0; padding-left: 18px; }
    li { margin: 0 0 10px; color: rgba(255,255,255,0.86); line-height: 1.5; }
    form { display: flex; flex-direction: column; gap: 12px; margin-top: 14px; }
    input {
      width: 100%; border-radius: 16px; border: 1px solid rgba(255,255,255,0.12); background: #0a0a0a;
      color: #fff; padding: 14px 16px; font-size: 16px;
    }
    button {
      border: 0; border-radius: 16px; background: #ff3b30; color: white; padding: 14px 16px; font-weight: 700;
      font-size: 13px; letter-spacing: 0.14em; text-transform: uppercase;
    }
    .proof { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 18px; }
    .proof .cell { border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 14px; background: rgba(0,0,0,0.24); }
    .proof strong { display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 0.14em; color: rgba(255,255,255,0.42); margin-bottom: 8px; }
    .success { display: none; margin-top: 12px; color: #86efac; font-size: 14px; }
  </style>
</head>
<body>
  <main class="shell">
    <div class="eyebrow">Launchpad asset</div>
    <h1>${escapeHtml(context.identity.name)}</h1>
    <p>${escapeHtml(context.identity.tagline)}</p>

    <section class="card">
      <div class="label">Built for</div>
      <p>${escapeHtml(primarySegment ? `${primarySegment.segment} who care about ${primarySegment.interest.toLowerCase()}` : context.idea)}</p>
      <form id="waitlist-form">
        <input type="email" placeholder="Enter your email" required />
        <button type="submit" id="submit-btn">Join waitlist</button>
      </form>
      <p class="success" id="success-msg">You're in. We will send early access details soon.</p>
    </section>

    <section class="card">
      <div class="label">Why join</div>
      <ul>${renderList(benefits)}</ul>
    </section>

    <section class="card">
      <div class="label">What happens first</div>
      <ul>${renderList(tests)}</ul>
    </section>

    <section class="proof">
      <div class="cell">
        <strong>Positioning</strong>
        <p>${escapeHtml(context.marketGap)}</p>
      </div>
      <div class="cell">
        <strong>Channel</strong>
        <p>${escapeHtml(context.distributionChannels[0]?.name || 'Founder-led outreach')}</p>
      </div>
    </section>
  </main>
  <script>
    const form = document.getElementById('waitlist-form');
    const button = document.getElementById('submit-btn');
    const success = document.getElementById('success-msg');
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      button.disabled = true;
      button.textContent = "You're in!";
      success.style.display = 'block';
    });
  </script>
</body>
</html>`;
}

function renderPitchDeckHtml(context: ArtifactPromptContext): string {
  const keyInsights = context.market.keyInsights.slice(0, 3);
  const risks = context.market.risks.slice(0, 2);
  const tests = context.market.whatToTestFirst.slice(0, 2);
  const monetization = context.monetization[0];
  const segment = context.customerSegments[0];
  const channel = context.distributionChannels[0];

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(context.identity.name)} Pitch Deck</title>
  <link rel="stylesheet" href="/reveal/reveal.css">
  <link rel="stylesheet" href="/reveal/theme/black.css">
  <style>
    :root { color-scheme: dark; }
    body { margin: 0; background: #050505; font-family: Arial, Helvetica, sans-serif; }
    .reveal { color: #f4f4f5; }
    .reveal .slides section { text-align: left; }
    .eyebrow {
      display: inline-block; margin-bottom: 18px; color: #ff6b61; font-size: 18px;
      text-transform: uppercase; letter-spacing: 0.18em;
    }
    h1, h2 { letter-spacing: -0.04em; margin-bottom: 16px; }
    p, li { color: rgba(255,255,255,0.76); line-height: 1.5; }
    ul { margin-top: 20px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .card {
      border: 1px solid rgba(255,255,255,0.12); border-radius: 18px; padding: 18px;
      background: rgba(255,255,255,0.04);
    }
  </style>
</head>
<body>
  <div class="reveal">
    <div class="slides">
      <section>
        <div class="eyebrow">Hook</div>
        <h1>${escapeHtml(context.identity.name)}</h1>
        <p>${escapeHtml(context.identity.tagline)}</p>
        <p>${escapeHtml(context.marketGap)}</p>
      </section>
      <section>
        <div class="eyebrow">Problem</div>
        <h2>What is broken</h2>
        <ul>${renderList(risks.length ? risks : ['Users still rely on fragmented tools and generic advice.', 'Current alternatives leave the core pain point unresolved.'])}</ul>
      </section>
      <section>
        <div class="eyebrow">Solution</div>
        <h2>What we are building</h2>
        <p>${escapeHtml(context.interface)}</p>
        <ul>${renderList(keyInsights)}</ul>
      </section>
      <section>
        <div class="eyebrow">Audience</div>
        <h2>Who this is for</h2>
        <div class="grid">
          <div class="card">
            <p><strong>${escapeHtml(segment?.segment || 'Target customer')}</strong></p>
            <p>${escapeHtml(segment?.interest || context.idea)}</p>
          </div>
          <div class="card">
            <p><strong>Go to market</strong></p>
            <p>${escapeHtml(channel?.name || 'Founder-led distribution')}</p>
          </div>
        </div>
      </section>
      <section>
        <div class="eyebrow">Business model</div>
        <h2>How it makes money</h2>
        <p>${escapeHtml(monetization?.model || 'Subscription')}</p>
        <p>${escapeHtml(monetization?.pricing || 'Monetization still being validated')}</p>
        <ul>${renderList(monetization?.strategies?.slice(0, 3) || ['Start narrow, then expand pricing tiers.'])}</ul>
      </section>
      <section>
        <div class="eyebrow">Next step</div>
        <h2>What to prove first</h2>
        <ul>${renderList(tests.length ? tests : ['Validate demand with a narrow pilot.', 'Measure willingness to pay before expanding scope.'])}</ul>
      </section>
    </div>
  </div>
  <script src="/reveal/reveal.js"></script>
</body>
</html>`;
}

export function generateFallbackArtifacts(context: ArtifactPromptContext): ArtifactBundle {
  return {
    waitlistHtml: renderWaitlistHtml(context),
    pitchDeckHtml: renderPitchDeckHtml(context),
  };
}
