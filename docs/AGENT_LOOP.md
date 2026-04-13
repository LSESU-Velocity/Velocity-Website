# Codex Claude Phase Loop

Use this playbook when you want Codex to coordinate the work and Claude Code Opus to implement phases.

## One-Line Trigger

Tell Codex:

```text
Follow docs/AGENT_LOOP.md for this task: <your task here>
```

That is the only standing instruction you should need to repeat.

## Role Split

- Codex owns repo inspection, planning, phase boundaries, code review, targeted verification, and final acceptance.
- Claude Opus owns implementation of the current phase only.
- Codex may fix small review issues directly instead of round-tripping them back to Claude.
- Claude should not begin the next phase unless Codex explicitly tells it to.

## Standard Loop

1. Codex inspects the repo and writes or updates [docs/IMPLEMENTATION_PLAN.md](/c:/Users/yamin/Desktop/Velocity-Website/docs/IMPLEMENTATION_PLAN.md).
2. Codex defines clear phases with acceptance checks.
3. Codex sends only the next phase to Claude by running [scripts/claude-phase.ps1](/c:/Users/yamin/Desktop/Velocity-Website/scripts/claude-phase.ps1).
4. Claude implements that phase and reports what changed.
5. Codex reviews the diff, checks for bugs or regressions, and runs targeted verification.
6. If issues are small, Codex fixes them directly.
7. If issues are larger, Codex sends a focused follow-up to Claude in the same Claude session.
8. Once the phase passes review, Codex marks it complete in the plan and either stops or dispatches the next phase.

## Codex Rules

When Codex is asked to follow this playbook, it should:

- Plan first unless the user explicitly asks to continue an existing plan.
- Keep `docs/IMPLEMENTATION_PLAN.md` current.
- Give Claude one bounded phase at a time.
- Review from actual repo state and diff, not from Claude's summary alone.
- Prefer direct fixes for small defects found in review.
- Only move Claude to the next phase after the current one passes review or has accepted residual risk.

## Claude Dispatch Commands

Start a fresh Claude implementation run for a phase:

```powershell
.\scripts\claude-phase.ps1 -Task "Implement Phase 1 only from docs/IMPLEMENTATION_PLAN.md. Do not start later phases."
```

Continue the same Claude session with review feedback:

```powershell
.\scripts\claude-phase.ps1 -ContinueLatest -Task "Address these review findings only: <paste findings>. Do not change scope."
```

Ask Claude to continue with the next approved phase:

```powershell
.\scripts\claude-phase.ps1 -ContinueLatest -Task "Phase 1 is accepted. Implement Phase 2 only from docs/IMPLEMENTATION_PLAN.md."
```

## Suggested User Prompts For Codex

Fresh task:

```text
Follow docs/AGENT_LOOP.md for this task: <task>
```

Resume after a stop:

```text
Follow docs/AGENT_LOOP.md and continue from docs/IMPLEMENTATION_PLAN.md.
```

Planning only:

```text
Follow docs/AGENT_LOOP.md, but stop after updating docs/IMPLEMENTATION_PLAN.md.
```

Review only:

```text
Follow docs/AGENT_LOOP.md, but review the current phase without dispatching Claude unless needed.
```

## Review Standard

Codex should check:

- correctness and regressions
- phase scope drift
- missing or weak verification
- mismatches between implementation and plan
- risky assumptions or incomplete edge cases

## Notes

- In PowerShell, use `claude.cmd`, not `claude`, because the `.ps1` wrapper can be blocked by execution policy.
- Keep phases small enough that one review cycle can fully evaluate them.
- This workflow is meant to be iterative. `docs/IMPLEMENTATION_PLAN.md` is a live file, not a static spec.
