# Automation Intake — Implementation Record

This document captures the Automation Intake feature **as built**. It was originally a design plan; this revision rewrites it in sync with the shipped code so future contributors have a single accurate reference.

## Objective

An AI-powered business-discovery and automation-intake experience at `/automation-intake`. Partner businesses describe their operations through a guided chat or structured form; the feature produces a persisted submission plus an AI-generated project brief that Velocity staff can turn into student automation work.

Non-negotiable product properties:

- isolated from Launchpad so cross-project regressions don't happen
- chat and form are two views over one shared draft
- the conversation is deterministic — AI extracts and acknowledges; the step order is code
- final submissions persist server-side with sensitive fields encrypted at rest
- public API surface assumes the repo is public and under attack

## Core Product Decisions

### 1. Isolated from Launchpad

Separate product module, not a variation of `Launchpad.tsx`.

- frontend components under `components/automation-intake/` (plus `components/AutomationIntake.tsx`)
- client logic under `lib/automation-intake/`
- server logic under `api/automation-intake-*.ts` and `lib/automation-intake/`
- shared site wiring only: `App.tsx`, `Navbar.tsx`, `.env.example`, `PrivacyPolicy.tsx`, `scripts/dev-api.ts`, `lib/encryption.ts`
- no imports from `lib/launchpad-lab/*`, `lib/launchpad-storage`, or any Launchpad component

### 2. Chat and form are two views over one draft

Both views read from and write to the same `AutomationIntakeDraft` object.

- switching views loses no information
- chat answers prefill form fields
- form edits update the review summary immediately
- the toggle is a UX switch, not a data-model switch

### 3. AI extracts and acknowledges, never drives the flow

Conversation structure is deterministic.

- fixed step order with limited adaptive follow-ups
- AI does schema-constrained extraction per step
- AI also returns a one-sentence **acknowledgment** that references what the user just said; this is prepended to the next question to make the assistant feel responsive rather than robotic
- AI generates the final project brief (structured output)
- AI never decides step order, authorization, storage shape, or rate limits

### 4. Velocity-owned server key (not BYOK)

Distinct from Launchpad, which uses BYOK. Partner businesses should not need to bring a key.

- `AUTOMATION_INTAKE_GEMINI_API_KEY` — server-owned Gemini key
- `AUTOMATION_INTAKE_GEMINI_MODEL` — default `gemini-2.5-flash-lite`
- when the key is absent, the engine falls back to deterministic heuristic extraction so local dev still works end-to-end

### 5. Server-side persistence

Real business intake, not a browser-local experiment.

- final submissions written to Firestore collection `automationIntakes`
- sensitive free-text fields encrypted at rest with AES-256-GCM
- only a small set of operational index fields kept plaintext for routing

## Security Model

### Open-source assumption

This repo is public. Security must not depend on hiding code, routes, field names, or request shapes.

### Trust boundaries

1. Browser draft state
2. Public intake API endpoints
3. AI model interaction layer
4. Firestore persistence

Each boundary validates, sanitizes, and constrains data independently.

### Assets protected

- client submission content
- contact information
- workflow descriptions
- encrypted transcript payloads
- the server-owned model API key
- Firestore write access
- the AES-256-GCM encryption key

### Controls in place

- every public request body validated with Zod (`.strict()` on top-level request envelopes)
- payload size caps: 48 KB on chat, 96 KB on submit (checked via `content-length` before parse)
- per-field length caps on every free-text field in `AutomationIntakeDraftSchema`
- prompt-injection sanitizer strips dangerous markers and instruction-overrides before any model call (`lib/automation-intake/sanitize.ts`)
- acknowledgment strings are re-sanitized on return to strip filler ("Great!", "Awesome!", etc.) and collapse newlines
- per-IP rate limits via the existing `rateLimits` Firestore collection, doc-ids prefixed `intake_chat_` (30/min) and `intake_submit_` (5/min)
- honeypot field `__website_secondary` in form mode; if filled, submit endpoint returns a convincing 200 with no write
- submission minimum-completeness check re-enforced on the submit endpoint; client-side validation is never trusted
- generic user-facing error messages on public failures; error details only in server logs, never including request bodies
- submission payloads encrypted at rest; only operational index fields kept plaintext
- no public read endpoint for stored submissions
- all rendering paths output plain text (no `dangerouslySetInnerHTML`); free text is escaped by React by default

### Repository hygiene

- never commit real client submissions
- never commit exported Firestore dumps
- never commit model keys, Firebase credentials, or encryption keys
- `.env.local` is gitignored
- screenshots and fixtures use synthetic data

## Shared Data Contract

### Draft shape

Source of truth: `lib/automation-intake/schemas.ts`. Zod-first — types are inferred from schemas, not declared separately.

```ts
type AutomationIntakeDraft = {
  sessionId: string;
  schemaVersion: 2;                   // bumped from 1 when the workflow step split landed
  status: 'collecting' | 'review' | 'submitted';
  currentStep: StepId;                // see step list below
  questionCount: number;
  followUpsUsed: number;
  business: {
    businessName?: string;
    website?: string;
    sector?: string;
    teamSizeBand?: string;
    whatTheyDo?: string;
    whoTheyServe?: string;
    primarySystems: string[];
    toolStack: {                      // 10 named buckets — see TOOL_STACK_CATEGORIES
      emailAndCalendar: string[];
      communication: string[];
      docsAndPresentations: string[];
      designAndCreative: string[];
      projectManagement: string[];
      fileStorage: string[];
      reportingAndDashboards: string[];
      crmAndSupport: string[];
      automationAndIntegrations: string[];
      other: string[];
    };
  };
  workflows: Array<{                  // max 5; form caps add-button at 3
    id: string;
    name: string;
    owner?: string;
    frequency?: string;
    tools: string[];
    currentSteps: string[];
    painPoints: string[];
    priority?: 'low' | 'medium' | 'high';
  }>;
  aiUsage: {
    currentTools: string[];
    currentUseCases: string[];
    nonUseAreas: string[];
    blockers: string[];
    maturity?: 'none' | 'experimental' | 'active';
  };
  constraints: {
    sensitiveData?: boolean;
    sensitiveDataNotes?: string;
    approvalRequirements: string[];
    complianceNotes: string[];
    integrationLimits: string[];
  };
  goals: {
    desiredOutcomes: string[];
    successMetrics: string[];
    timeline?: string;
    preferredProjectShape?: string;
  };
  contact: {
    name?: string;
    role?: string;
    email?: string;
    consent: boolean;
  };
  transcript: ChatMessage[];          // max 120
  finalBrief?: FinalBrief;
};
```

### Minimum-completeness split

`schemas.ts` exports **two** checks:

- `checkMinimumCompleteness(draft)` — blocks submission. Required:
  - `business.whatTheyDo` (≥ 8 chars)
  - `contact.name`
  - `contact.email` (regex-valid)
  - `contact.consent === true`
- `checkRecommendedCompleteness(draft)` — surfaced in UI hints but does not block:
  - at least one workflow with a name
  - workflow scope detail (tools / steps / pain points / owner / frequency)
  - at least one desired outcome

This split was a deliberate refinement from the original plan. The original required workflows and outcomes as hard gates, which created a dead-end when partners legitimately had no concrete metrics yet. Making them recommended keeps the form useful; Velocity staff can follow up on gaps via the generated `openQuestions`.

## Conversation Design

### Step list (12 steps — `STEP_IDS`)

Defined in `lib/automation-intake/questions.ts` as `STEP_DEFINITIONS`.

1. `business` — business overview
2. `systems` — tool stack across categories (allows 1 follow-up)
3. `workflow-name` — *"What's one recurring workflow you'd most like help with?"*
4. `workflow-ownership` — *"Who owns it, and how often does it run?"*
5. `workflow-tools` — *"Which tools does it touch?"*
6. `workflow-steps` — *"Walk me through the main steps in plain English."* (allows 1 follow-up)
7. `pain-points` — *"What's painful about it today?"* (allows 1 follow-up)
8. `ai-usage` — current AI tools & maturity
9. `ai-non-use` — gaps and blockers
10. `constraints` — sensitive data, approvals, compliance, integration limits
11. `goals` — desired outcomes, success metrics, timeline
12. `contact` — name, role, email, consent

The workflow phase was originally a single "primary workflow" step asking owner / cadence / tools / steps all at once. It was split into four focused steps (`workflow-name`, `workflow-ownership`, `workflow-tools`, `workflow-steps`) after early testing showed the mega-prompt felt robotic and users couldn't tell which part to answer first.

### Follow-up rules

Coded in `lib/automation-intake/patch.ts#shouldEmitFollowUp`:

- maximum 1 follow-up per step
- maximum 2 follow-ups per conversation (`MAX_FOLLOW_UPS` in `questions.ts`)
- only emitted on `systems` (if tool stack nearly empty), `workflow-steps` (if no steps captured), `pain-points` (if fewer than 2 painpoints)
- follow-up text comes from the model's `followUpQuestion` field — not hand-authored strings

### Opt-out handling

User phrases like `no`, `skip`, `stop`, `done`, `that's all`, `nothing else`, `pass`, `move on`, `i'm good` are detected by `isOptOut` in `engine.ts`.

- **During steps 1–11**: opt-out skips the current step entirely (no extraction) and advances to the next step. Assistant says *"No problem — skipping that. [next question]"*.
- **On step 12 (contact)**: opt-out routes to review if minimum fields are met, otherwise falls into catch-up.
- **Past step 12**: opt-out ends the catch-up loop and routes to review (if ready) or suggests form mode (if not).

### Catch-up loop (past the last step)

When the user answers step 12 but required fields are still missing, the engine enters catch-up mode:

- runs a multi-field extraction (not a per-step extraction) — fires the relevant step extractors in sequence against the same user answer so a single message can populate multiple missing fields
- looks for explicit consent phrasing (`"i agree"`, `"consent is ok"`, etc.) to set `contact.consent`
- varies the assistant wording across retries (three variants)
- caps at 3 retries; then emits *"No problem — I'll stop asking. Form mode lets you fill the last bits in whenever you're ready."*

### Acknowledgment generation

Every per-step Zod extraction schema includes an optional `acknowledgment: z.string().max(240)` field. The model returns a one-sentence acknowledgment referencing something specific the user said, alongside the structured patch — in the same call, no extra API round-trip. `withAcknowledgment(ack, nextQuestion)` prepends it with a blank-line separator.

The prompt (in `prompts.ts` as `ACKNOWLEDGMENT_GUIDANCE`) explicitly bans filler openers (*"Great!"*, *"Awesome!"*, *"I love that!"*). `sanitizeAcknowledgment` in the engine re-strips them defensively. Temperature for the extraction model is 0.3 so acknowledgments get some stylistic variety; the structured-output constraint still binds the patch fields.

Heuristic fallback (no model key): no acknowledgments — the static step prompt is emitted as-is. Acceptable for local dev.

## Architecture

### Frontend

Entry component: `components/AutomationIntake.tsx`. Holds the draft state, persists to sessionStorage, switches between view modes (`chat` / `form`) and page modes (`collect` / `review` / `complete`). Scrolls to top on mount (same pattern as Blog/Events/Launchpad).

Sub-components under `components/automation-intake/`:

- `AutomationIntakeShell.tsx` — layout wrapper, three-layer radial gradient background (fixed to viewport so it stays consistent on scroll), title block, progress rail, mode toggle
- `AutomationIntakeProgress.tsx` — 12-segment bar driven by `STEP_DEFINITIONS`
- `AutomationIntakeToggle.tsx` — chat / form segmented control with spring-animated active indicator (framer-motion `layoutId`)
- `AutomationIntakeChat.tsx` — message bubbles, composer, three-dot typing indicator; user bubble uses a `linear-gradient(135deg, #FF5A7A → #FF1F1F → #C70F0F)` + soft red glow; assistant bubble is translucent dark with `border-white/10`
- `AutomationIntakeForm.tsx` — sectioned form: Business, Tool Stack (grouped by category), Workflows (repeater, max 3, first = primary), AI Usage, Constraints, Goals, Contact; includes honeypot; "Add workflow" is disabled while the last row has an empty name
- `AutomationIntakeReview.tsx` — grouped summary cards with per-section Edit buttons that route back to form mode and scroll to the section anchor
- `AutomationIntakeComplete.tsx` — thank-you state showing client summary + recommended projects + open questions

### Client lib

`lib/automation-intake/`:

- `schemas.ts` — Zod contract (single source of truth); exports `checkMinimumCompleteness` + `checkRecommendedCompleteness`
- `questions.ts` — `STEP_DEFINITIONS`, `TOOL_CATEGORIES`, `MAX_FOLLOW_UPS`, step-navigation helpers
- `sanitize.ts` — `sanitizeFreeText` (prompt-injection guard) + `safeNormalizeUrl`
- `storage.ts` — sessionStorage helpers (`loadDraft`, `saveDraft`, `clearDraft`); `safeParse` fails → clear (so `SCHEMA_VERSION` bump auto-discards stale drafts)
- `client.ts` — `postIntakeChat` and `postIntakeSubmit` via `fetch`; `IntakeApiError` for typed error surfacing
- `draft.ts` — **browser-safe** pure helpers (`createInitialDraft`, `isDraftReadyForReview`, `makeId`, `nowIso`); split out from `engine.ts` so the Node-only LangChain import path doesn't leak into the client bundle

### Server lib

`lib/automation-intake/`:

- `model.ts` — `createIntakeModel`, `hasModelKey`, `MissingModelKeyError`; thin LangChain `ChatGoogle` wrapper, deliberately duplicated from `lib/launchpad-lab/model.ts` to keep the isolation boundary
- `prompts.ts` — static system prompts per step + final-brief system prompt + `ACKNOWLEDGMENT_GUIDANCE`
- `patch.ts` — per-step `StepPatch` union, `applyPatch` (pure, clamps strings, dedupes arrays, rejects unknown keys), `shouldEmitFollowUp`
- `engine.ts` — `advanceDraftFromAnswer`, `generateFinalBrief`, `buildHeuristicPatch`; re-exports `createInitialDraft` / `isDraftReadyForReview` from `draft.ts` so existing imports still resolve
- `persistence.ts` — `saveIntakeSubmission`; writes to Firestore with encrypted payload fields; fails closed if `AUTOMATION_INTAKE_ENCRYPTION_KEY` is unset

### API handlers

`api/`:

- `automation-intake-chat.ts` — POST; content-length cap → Zod parse → rate-limit → `advanceDraftFromAnswer` → return
- `automation-intake-submit.ts` — POST; same guards → minimum-completeness re-check → strip empty-named workflows → `generateFinalBrief` → `saveIntakeSubmission` → return

### Shared infrastructure touched

- `lib/encryption.ts` — refactored to expose generic `encryptText(plain, envVarName)` / `decryptText(stored, envVarName)`; legacy `encryptIdea` / `decryptIdea` kept as thin wrappers over the legacy key for Launchpad's `api/analyses.ts`
- `lib/serverAuth.ts` — `setCorsHeaders` reused
- `lib/firebase.ts` — Firestore admin init reused

### Routing / wiring

- `App.tsx` — `<Route path="/automation-intake" element={<AutomationIntake />} />`
- `components/Navbar.tsx` — `{ label: 'For Businesses', path: '/automation-intake' }`
- `scripts/dev-api.ts` — `app.all('/api/automation-intake-chat', ...)` and `app.all('/api/automation-intake-submit', ...)`
- `.env.example` — three new vars with dev-generation notes:
  - `AUTOMATION_INTAKE_GEMINI_API_KEY` (empty allowed; heuristic fallback kicks in)
  - `AUTOMATION_INTAKE_GEMINI_MODEL` (defaults to `gemini-2.5-flash-lite`)
  - `AUTOMATION_INTAKE_ENCRYPTION_KEY` (64 hex chars; `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- `components/PrivacyPolicy.tsx` — new paragraph distinguishing Launchpad (browser-only) from Automation Intake (server-side, encrypted index/payload split); retention + deletion-contact text added

## API Contract

### `POST /api/automation-intake-chat`

```ts
Request: { draft: AutomationIntakeDraft; answer: string }
Response:
  200 { draft, assistantMessage: ChatMessage, readyForReview: boolean }
  400 { error }       // invalid JSON / schema
  405 { error }       // non-POST
  413 { error }       // > 48 KB
  429 { error }       // rate-limited
  500 { error }       // internal
```

### `POST /api/automation-intake-submit`

```ts
Request: { draft: AutomationIntakeDraft; submissionMode: 'chat' | 'form'; honeypot?: string }
Response:
  200 { success: true, draft, savedId, finalBrief }
  200 { error: 'Thanks!' }  // silent honeypot reject
  400 { error }             // schema or minimum-completeness
  405 { error }
  413 { error }             // > 96 KB
  429 { error }
  500 { error }             // generic; real error in server logs only
```

## Persistence Layer

### Firestore collection: `automationIntakes`

Plaintext index fields (queryable):

- `businessName`
- `website`
- `sector`
- `teamSizeBand`
- `contactName`
- `contactEmail`
- `submissionMode`
- `workflowTitles: string[]`
- `status: 'new'`
- `schemaVersion`
- `createdAt` / `updatedAt` (server timestamps)
- `ipHash` — SHA-256 truncated to 24 chars, for abuse pattern detection without storing raw IP

Encrypted payload fields (opaque at rest; decryption requires `AUTOMATION_INTAKE_ENCRYPTION_KEY`):

- `draftEncrypted` — full structured draft including final brief
- `transcriptEncrypted` — the chat transcript
- `finalBriefEncrypted` — client/internal summary + recommended projects + open questions

Pre-persistence cleanup: empty-named workflows are stripped from the draft before `generateFinalBrief` or Firestore writes. This prevents accidental empty rows (from extraction misfires or form + button presses) from polluting the brief.

### Rate limiting

Firestore `rateLimits` collection, doc ids:

- `intake_chat_<sanitized-ip>` — 30 requests / 60 s
- `intake_submit_<sanitized-ip>` — 5 requests / 60 s

Same pattern used by `api/login.ts`. IP sanitization replaces `/` and `.` per the existing convention.

## Final Brief Shape

```ts
type FinalBrief = {
  clientSummary: string;           // 3–5 sentences, warm, shown on completion screen
  internalSummary: string;         // 3–5 sentences for Velocity staff
  recommendedProjects: Array<{     // 1–3 entries
    title: string;
    targetWorkflow: string;
    problemSummary: string;
    proposedAutomation: string;
    expectedImpact: string;
    dataSensitivity: 'low' | 'medium' | 'high';
    studentDeliveryFit: string;    // rough 4-8 week scoping note
    feasibility: 'low' | 'medium' | 'high';
  }>;
  openQuestions: string[];         // up to 6, specific follow-ups for Velocity
};
```

Generated by the same Gemini model via `model.withStructuredOutput(FinalBriefSchema)`. Deterministic fallback (`buildHeuristicFinalBrief`) produces a single project anchored to the primary workflow when the model is unavailable.

## UI Design

### Visual direction

- palette: `velocity-black` (#000), `velocity-red` (#FF1F1F), `velocity-darkRed` (#500a0a), `velocity-grid` (#1F1F1F)
- background: four stacked fixed radial gradients (center, top-left, top-right, bottom-center) so the shell maintains a warm red ambient glow regardless of scroll position
- cards: `bg-white/[0.02]` with `border-white/10` and `backdrop-blur-sm` — translucent enough that the page gradient shows through rather than being masked
- user chat bubble: pink-red diagonal gradient + soft red box-shadow
- assistant chat bubble: dark translucent with subtle border
- typing indicator: three pulsing red dots in a pill
- toggle: segmented with `framer-motion` spring-animated active background

### Accessibility

- semantic buttons for the mode toggle (`role="tab"`, `aria-selected`)
- `aria-label` on icon-only controls (send button, remove-tag button)
- honeypot is `aria-hidden="true"` + `tabIndex={-1}` + absolutely positioned off-screen
- focus remains on the composer after send; textarea auto-sizes up to 180px
- keyboard: Enter sends, Shift+Enter newline; comma or Enter commits a tag in `TagInput`

### Responsiveness

- mobile-first: max-width container with `px-5` gutters
- chat bubbles cap at 80% / 85% max-width
- form grid collapses to single column below `md`
- sticky composer styling via the input row (not position: sticky — the scroll container is already capped)

## Local Development

```bash
# one-time setup
cp .env.example .env.local
# generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# paste into AUTOMATION_INTAKE_ENCRYPTION_KEY in .env.local
# (optional) paste AUTOMATION_INTAKE_GEMINI_API_KEY from Google AI Studio

# two terminals
npm run dev:api    # local API server on :8787 (proxied via Vite)
npm run dev        # Vite dev server on :5173
```

Visit `http://localhost:5173/automation-intake`.

Without `AUTOMATION_INTAKE_GEMINI_API_KEY`, the chat still advances through all 12 steps using deterministic heuristic extraction and static prompts — acknowledgments won't appear, but the structural flow works.

Without `AUTOMATION_INTAKE_ENCRYPTION_KEY`, chat works but submit fails closed with a 500.

## Verification Record

What was tested during implementation:

- `npm run build:api` (tsc --noEmit): clean on all intake files; only pre-existing Launchpad errors remain
- `npm run build`: Vite production bundle succeeds; no Node-only imports leak into the browser bundle (verified after splitting `draft.ts` out of `engine.ts`)
- live local test: POST to `/api/automation-intake-chat` with a fresh draft correctly advances from `business` → `systems` with heuristic extraction (no AI key), user message stored in transcript, assistant emits next step's prompt
- isolation grep: `rg "launchpad"` against `components/automation-intake/`, `components/AutomationIntake.tsx`, and `api/automation-intake-*.ts` returns zero matches (the only hit is a comment in `lib/automation-intake/model.ts` explicitly noting the deliberate separation)
- `/launchpad` still loads and behaves identically

## Deltas From the Original Plan

Documented here so the intent behind refinements isn't lost:

- **Step count 10 → 12**. The workflow phase was originally one omnibus step; it's now four focused steps (`workflow-name`, `workflow-ownership`, `workflow-tools`, `workflow-steps`). The progress bar auto-scales to whatever `STEP_DEFINITIONS` contains.
- **`lib/automation-intake/draft.ts` added**. The original plan put `createInitialDraft` and `isDraftReadyForReview` in `engine.ts`. That path transitively imports `@langchain/google/node`, which is Node-only and breaks the Vite browser bundle. Pure helpers are now in `draft.ts`; the engine re-exports them so existing import sites still work.
- **Required completeness relaxed**. Original plan required a workflow name, workflow scope detail, and at least one desired outcome. All three are now recommendations (surfaced in UI hints, not submit gates). Partners without concrete metrics can still submit; Velocity's generated `openQuestions` picks up the slack.
- **Opt-out and catch-up loop**. Original plan assumed users would answer every question. Engine now detects opt-out language and either advances (mid-flow) or ends the loop (past-end), with a retry cap of 3 and varied wording so it never robotically repeats.
- **Acknowledgment layer**. Not in the original plan. Added after early testing revealed the assistant felt scripted. One-sentence acknowledgment piggybacks on the same model call as the extraction patch (no extra latency or cost).
- **Empty-workflow cleanup**. Original plan didn't specify; implementation filters empty-named workflows in the review display, disables the "Add workflow" button while the previous row is unnamed, and strips empties server-side before brief generation and Firestore write.
- **Navbar label**. Shipped as "For Businesses". Can be iterated.
- **`lib/automation-intake/types.ts`** was listed in the original plan but skipped — types are inferred directly from Zod schemas to avoid a second source of truth.

## File-Level Change List

### New (21)

- `components/AutomationIntake.tsx`
- `components/automation-intake/AutomationIntakeShell.tsx`
- `components/automation-intake/AutomationIntakeChat.tsx`
- `components/automation-intake/AutomationIntakeForm.tsx`
- `components/automation-intake/AutomationIntakeReview.tsx`
- `components/automation-intake/AutomationIntakeComplete.tsx`
- `components/automation-intake/AutomationIntakeToggle.tsx`
- `components/automation-intake/AutomationIntakeProgress.tsx`
- `lib/automation-intake/schemas.ts`
- `lib/automation-intake/questions.ts`
- `lib/automation-intake/sanitize.ts`
- `lib/automation-intake/storage.ts`
- `lib/automation-intake/client.ts`
- `lib/automation-intake/draft.ts`
- `lib/automation-intake/model.ts`
- `lib/automation-intake/prompts.ts`
- `lib/automation-intake/engine.ts`
- `lib/automation-intake/patch.ts`
- `lib/automation-intake/persistence.ts`
- `api/automation-intake-chat.ts`
- `api/automation-intake-submit.ts`

### Modified (6)

- `App.tsx`
- `components/Navbar.tsx`
- `scripts/dev-api.ts`
- `.env.example`
- `components/PrivacyPolicy.tsx`
- `lib/encryption.ts`

## Open Work / Follow-ups

Not required to ship but worth considering:

- **Internal review surface**. No authenticated admin page yet. The plan calls this out as intentionally deferred — any future internal list / read / status-update endpoint must require authenticated access, never reuse the public submit contract, and treat any CSV export as sensitive.
- **Cloudflare Turnstile**. Not wired up. If abuse becomes a problem, the chat and submit endpoints are the places to add it.
- **Acknowledgment in fallback mode**. When `AUTOMATION_INTAKE_GEMINI_API_KEY` is unset, the heuristic path emits static prompts only. Fine for dev; production always has the key.
- **Metrics & observability**. Currently only `console.warn` on extraction / rate-limit / persistence failures. No structured metrics pipeline. Good enough for v1; revisit if write volume grows.
- **Data retention automation**. Retention policy is documented in the privacy copy but enforcement is manual. If a cron-driven purge is ever added, it should live in a new `api/` endpoint behind an admin auth guard.
