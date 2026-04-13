# Implementation Plan

This file is a live plan that Codex can rewrite for each task.

Status values: `pending`, `in_progress`, `in_review`, `done`, `blocked`

## Task

Refactor the current `Launchpad` experience into `Launchpad Lab`: a BYOK, LangChain-powered, LangGraph-orchestrated startup analysis lab that replaces the current single-shot Gemini prompt with a staged workflow, real execution progress, stronger trust/transparency UX, and a more interactive set of founder outputs.

## Constraints

- Keep the existing `/launchpad` route working while the refactor is in progress.
- Remove dependence on the platform-owned `GEMINI_API_KEY` for Launchpad analysis. Users should supply their own key.
- Never persist or log raw user API keys. Client storage should default to session-only storage unless the user explicitly opts into device persistence.
- Preserve the current high-value outputs during migration: waitlist HTML, pitch deck HTML, prompt chain, market map, customer segments, monetization, and distribution channels.
- Avoid a flag day rewrite. Each phase must leave the repo in a reviewable, runnable state.
- Use current repo primitives where practical: React, TypeScript, Vite, Vercel serverless functions, and existing Firebase/Firestore infrastructure.
- LangChain package choice should follow the current official Google integration guidance and use `@langchain/google` rather than deprecated Google adapter packages.
- LangGraph durability should not be faked. If durable interrupts and resume require a proper checkpointer, phase that separately instead of pretending in-memory state is production-safe on Vercel.

## Phases

### Phase 1 - BYOK And Trust Foundation
Status: `done`

Goal:
- Replace the invite-code/member gate with a BYOK entry flow and make Launchpad's trust model explicit before deeper workflow changes.

Scope:
- Replace [components/InviteCodeLogin.tsx](/c:/Users/yamin/Desktop/Velocity-Website/components/InviteCodeLogin.tsx) with a BYOK modal or panel tailored to Google AI Studio keys.
- Remove Launchpad's dependence on [hooks/useAuth.ts](/c:/Users/yamin/Desktop/Velocity-Website/hooks/useAuth.ts), [api/login.ts](/c:/Users/yamin/Desktop/Velocity-Website/api/login.ts), [api/me.ts](/c:/Users/yamin/Desktop/Velocity-Website/api/me.ts), and cookie auth for the Launchpad route.
- Update [components/Launchpad.tsx](/c:/Users/yamin/Desktop/Velocity-Website/components/Launchpad.tsx) to support:
  - key entry
  - clear key
  - optional "remember on this device"
  - private mode by default
  - concise transparency copy about key handling and idea processing
- Update [lib/api.ts](/c:/Users/yamin/Desktop/Velocity-Website/lib/api.ts) and [api/analyze.ts](/c:/Users/yamin/Desktop/Velocity-Website/api/analyze.ts) so the backend accepts a user-supplied Gemini key header and no longer reads `process.env.GEMINI_API_KEY` for Launchpad requests.
- De-scope cloud history temporarily if needed. If history remains, it must not require the raw key as identity.

Acceptance checks:
- A user can run Launchpad with their own Gemini key and no platform `GEMINI_API_KEY`.
- Raw user keys are not written to Firestore, cookies, logs, or returned in responses.
- The UI clearly states that ideas are sent to Google Gemini and whether analyses are stored locally or remotely.
- The current dashboard still renders a successful analysis response end to end.

Notes for Claude:
- Keep this phase focused on access, trust, and request plumbing. Do not introduce LangChain or LangGraph yet.
- Preserve the existing output shape from `/api/analyze` so later phases can swap internals without breaking the current dashboard.
- If cloud history becomes messy during this phase, prefer temporarily hiding it over carrying insecure identity assumptions forward.

### Phase 2 - LangChain Core Extraction
Status: `done`

Goal:
- Replace the monolithic prompt + manual JSON parsing path with typed LangChain building blocks that still return the current report shape.

Scope:
- Add the core packages required for the refactor:
  - `langchain`
  - `@langchain/google`
  - `@langchain/langgraph`
  - `zod`
- Create a dedicated `launchpad-lab` server module tree under `lib/` for:
  - provider/model setup
  - Zod schemas
  - prompt builders
  - output normalizers
- Break the current schema in [api/analyze.ts](/c:/Users/yamin/Desktop/Velocity-Website/api/analyze.ts) into smaller typed outputs such as:
  - intake brief
  - market findings
  - council memos
  - artifact specs
  - final report DTO
- Replace manual `JSON.parse` cleanup logic with schema-validated structured output through LangChain.
- Keep `/api/analyze` behavior backward-compatible with the current dashboard contract.

Acceptance checks:
- The Launchpad analysis pipeline uses LangChain model wrappers instead of raw Gemini fetch calls.
- Structured outputs are schema-validated with explicit repair or failure handling.
- The final API response remains compatible with [components/LaunchpadDashboard.tsx](/c:/Users/yamin/Desktop/Velocity-Website/components/LaunchpadDashboard.tsx).
- The old giant prompt is no longer the only source of truth for the analysis contract.

Notes for Claude:
- Do not add graph orchestration yet. This phase is about typed model boundaries and safer composition.
- Prefer small prompt modules over one very large replacement prompt.
- Keep compatibility adapters in place so the frontend does not need to change in the same phase.

### Phase 3 - LangGraph Execution Pipeline
Status: `done`

Goal:
- Introduce a real staged workflow so Launchpad Lab runs as an orchestrated analysis graph instead of one giant model call.

Scope:
- Create a LangGraph state definition for the lab workflow and implement bounded nodes such as:
  - `classifyIdea`
  - `normalizeIntake`
  - `runBullAnalyst`
  - `runBearAnalyst`
  - `runBuilderAnalyst`
  - `synthesizeOpportunity`
  - `qaAndRepair`
- Run the analyst council nodes in parallel and reduce them into a single synthesis state.
- Add server-side progress events so frontend loading states reflect actual node execution rather than simulated percentages.
- Introduce a new `Launchpad Lab` orchestration entrypoint while keeping the response DTO backward-compatible for the current dashboard.
- Keep founder assets opt-in. The default graph path should optimize for free-tier BYOK keys and must not reintroduce waitlist/pitch generation into the main analysis flow.

Acceptance checks:
- Analysis execution flows through a LangGraph graph with multiple nodes, not a single linear prompt call.
- At least one parallel branch is used in production code.
- The frontend can display real progress/status updates derived from graph execution.
- Failures identify the node that failed rather than returning only a generic "analysis failed" error.
- The default `/api/analyze` path remains analysis-only; optional founder assets stay on a separate path.

Notes for Claude:
- Keep the first graph run one-shot and server-driven. Do not add durable interrupts in this phase unless there is already a production-safe checkpointer configured.
- If streaming progress complicates the existing API too much, add a dedicated lab endpoint rather than destabilizing the legacy route.

### Phase 4 - Launchpad Lab Product Surface
Status: `done`

Goal:
- Rework the frontend from a static report viewer into a lab-style experience that exposes the graph's intermediate reasoning and gives founders multiple strategic angles to explore.

Scope:
- Refactor [components/Launchpad.tsx](/c:/Users/yamin/Desktop/Velocity-Website/components/Launchpad.tsx) and [components/LaunchpadDashboard.tsx](/c:/Users/yamin/Desktop/Velocity-Website/components/LaunchpadDashboard.tsx) into a Lab UI with:
  - live execution timeline
  - analyst council cards for bull, bear, and builder perspectives
  - synthesis summary with confidence and open risks
  - artifact workspace for waitlist, pitch deck, and prompt chain
- Add an `Idea Mutation Lab` that creates a few differentiated wedges for the same concept, such as:
  - premium B2B
  - prosumer/self-serve
  - community-led or niche wedge
- Add an `Investor Diligence Simulator` section that surfaces likely objections and de-risking steps.
- Preserve current artifact actions such as preview, copy, open, and download.

Acceptance checks:
- Users can inspect more than just the final answer; they can see intermediate analyst outputs.
- Users can compare multiple strategy mutations from the same base idea.
- Current artifact generation remains usable and discoverable.
- The UI language consistently reflects `Launchpad Lab` rather than the old membership-gated product.

Notes for Claude:
- Keep the lab UX bold but disciplined. Do not regress usability by turning the page into a raw debug console.
- Maintain clear hierarchy between "what the graph did" and "what the founder should do next."

### Phase 5 - Durable Threads, Interrupts, And Branching
Status: `done`

Goal:
- Add the features that make LangGraph worth using deeply: pause/resume, clarification interrupts, and branchable founder threads.

Scope:
- Add a production-safe persistence/checkpoint strategy for LangGraph threads.
- If the repo stays on Vercel serverless, use a durable backend appropriate for checkpointers rather than relying on process memory.
- Add workflow interrupts when the idea is too vague or underspecified and require the user to answer targeted clarifying questions before the graph continues.
- Add resumable threads and branching so users can:
  - revisit a prior run
  - fork from a prior checkpoint
  - compare two strategy branches
- Decide whether cloud thread storage is:
  - local-only
  - Firestore-backed metadata with external durable graph state
  - or a new dedicated DB for graph checkpoints

Acceptance checks:
- A graph run can pause for clarification and resume later with the same thread identity.
- Branching from a previous state produces separate follow-on analyses without clobbering the original.
- No raw API key is required for thread identity or persistence.
- The chosen persistence story is explicit in code and docs, not implied.

Notes for Claude:
- Do not fake durable resume on top of server memory.
- If this phase needs a new database or managed service, make the infrastructure choice explicit and keep the code changes tightly scoped to that decision.

### Phase 6 - Accessibility, Transparency, And Release Hardening
Status: `done`

Goal:
- Make Launchpad Lab trustworthy, accessible, and maintainable enough to ship confidently.

Scope:
- Audit the Lab UI for:
  - labels and descriptions
  - keyboard navigation
  - focus management
  - `aria-live` status regions
  - color contrast
  - reduced-motion support
- Replace misleading copy such as fake "Searching the web" progress if the product is not actually performing that action.
- Update [README.md](/c:/Users/yamin/Desktop/Velocity-Website/README.md), [.env.example](/c:/Users/yamin/Desktop/Velocity-Website/.env.example), and any privacy-facing pages to reflect:
  - BYOK
  - Google AI Studio onboarding
  - data handling
  - optional storage modes
  - any LangSmith or tracing configuration
- Remove or deprecate obsolete auth endpoints and docs that refer to invite-code-only access.
- Add targeted verification for the most failure-prone areas of the refactor.

Acceptance checks:
- The key user journey is keyboard accessible and screen-reader legible.
- Product copy accurately describes what is processed, where it goes, and what is stored.
- Setup docs no longer describe Launchpad as depending on a platform Gemini key or invite-code membership gate.
- Residual risks and migration tradeoffs are documented.

Notes for Claude:
- This is the cleanup and trust-hardening phase, not a place to add new product surface area.
- Prefer removing misleading or low-confidence behavior over preserving it for nostalgia.

## Review Log

- 2026-04-11: Plan rewritten for the Launchpad Lab refactor following `docs/AGENT_LOOP.md`.
- 2026-04-11: No Claude phase dispatched in this turn because the user explicitly asked for a concrete refactor plan first.
- 2026-04-11: Phase 1 marked `in_progress` and ready for Claude implementation dispatch.
- 2026-04-12: Phase 1 implementation dispatched through the WSL Claude runner using `claude-opus-4-6`.
- 2026-04-12: Codex review accepted Phase 1 after tightening trust copy, fixing session-only key persistence behavior, allowing `x-gemini-key` in CORS headers, and clearing TypeScript errors.
- 2026-04-12: Phase 2 marked `in_progress` and queued for Claude implementation through the Opus 4.6 WSL runner.
- 2026-04-12: Codex review accepted Phase 2 after migrating the Google integration to `@langchain/google`, validating the normalized dashboard DTO at the API boundary, and passing `npm install` plus `npx tsc --noEmit`.
- 2026-04-12: Phase 3 marked `in_progress` with a bounded LangGraph implementation brief that preserves the newer free-tier-first, opt-in-founder-assets architecture.
- 2026-04-12: Codex completed Phase 4 directly after Claude hit usage limits, extending the DTO with lab-specific council/mutation/diligence data and replacing the old static report surface with a Launchpad Lab dashboard while keeping founder assets separate from the default analysis path.
- 2026-04-12: Phase 5 marked `in_progress` and queued for Claude implementation through the Opus 4.6 WSL runner.
- 2026-04-12: Claude dispatch for Phase 5 reached a usage limit before implementation began, so Phase 5 is temporarily `blocked` pending Claude availability or direct Codex implementation.
- 2026-04-12: Phase 5 implementation completed by Claude. Added client-side thread persistence via localStorage, graph interrupt detection for vague ideas with clarification resume, thread branching from saved analyses, and SSE interrupt event plumbing. Persistence is explicit and local-only — no fake server memory.
- 2026-04-13: Phase 5 review fixes applied: (1) narrowed AnalyzeInterrupt before reading error/statusCode in api/analyze.ts and api/analyze-stream.ts, (2) removed dead builder node from nodeDisplayMap and fixed TOTAL_NODES to 6 in Launchpad.tsx, (3) made interrupt/resume durable by persisting interruptState to localStorage and restoring it on thread load, (4) fixed branching bug so reruns update the branch record via activeSavedId instead of creating duplicates.
- 2026-04-13: Codex accepted Phase 5 after fixing the final api/analyze.ts union narrowing issue, verifying the local-only persistence story is explicit in code/docs, and passing `npx tsc --noEmit`.
- 2026-04-13: Phase 6 marked `in_progress` and queued for Claude implementation through the Opus 4.6 WSL runner.
- 2026-04-13: Phase 6 implementation completed by Claude and moved to Codex review. Accessibility changes typecheck cleanly, but acceptance is pending follow-up fixes for remaining BYOK/trust inconsistencies in README and legal copy.
- 2026-04-13: Phase 6 review fixes applied: (1) Updated TermsOfService.tsx eligibility (Section 3) and PrivacyPolicy.tsx children (Section 11) to reflect that Launchpad Lab is publicly available to anyone 18+ with a BYOK key, not restricted to LSE students, while keeping the LSESU society context accurate. (2) Rewrote PrivacyPolicy.tsx Data Security (Section 10) to remove overclaimed protections (AES-256-GCM encryption at rest, HttpOnly cookies, rate limiting) that applied to the old server-storage model and replaced them with accurate client-side storage and no-key-logging descriptions. Updated Firebase third-party entry to clarify Launchpad Lab does not store content in Firebase. (3) Fixed README.md Getting Started to document both `npm run dev:api` (API server) and `npm run dev` (frontend) as separate steps required for the full local Launchpad Lab flow.
- 2026-04-13: Codex accepted Phase 6 after verifying the accessibility changes in the UI files, confirming the BYOK/transparency docs and legal copy are internally consistent, and passing `npx tsc --noEmit`.
