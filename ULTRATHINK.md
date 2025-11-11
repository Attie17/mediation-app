# ULTRATHINK operating guide

A practical rubric for how we design, implement, and ship changes in this repo.

## Principles

- Question assumptions: propose the simplest solution that clearly solves the real problem.
- Obsess over details: consistent spacing, colors, copy, and loading/empty states.
- Plan architecturally: prefer single, role-adaptive components and shared utilities over duplication.
- Craft elegantly: smooth interactions, predictable navigation, clear affordances.
- Simplify ruthlessly: remove toggles, dead code, and duplicate entry points when safe.

## Engineering checklist

Use this checklist for features and fixes. All items should be N/A or checked before merge.

- Problem clarity: the user-facing problem is stated and validated.
- Minimal viable change: smallest slice that resolves the core need.
- Single source of truth: reused logic/components instead of copy-paste.
- Navigation is explicit: predictable routes, no hidden side effects.
- States covered: loading, empty, error, success.
- Logs for diagnosis: dev-only console logs around key actions and failures.
- Edge cases: empty/null data, permissions/403, missing IDs, timeouts.
- Tests or harness: tiny script/test or manual steps to verify happy path + 1 edge.
- Accessibility basics: keyboard focus, button semantics, color contrast.
- Cleanup: dead code removed, names consistent, docs updated.

## How to apply

- In PRs: copy the checklist into the description or use the PR template boxes.
- In Copilot Chat: ask “Apply ULTRATHINK to this task” to steer suggestions using this guide.

## References

- See `LETS_TALK_ROLE_ADAPTIVE_SYSTEM.md` for a worked example (design, routing, philosophy).

## Activation Prompt (copy/paste)

Use this at the start of any task (human or AI):

```
Apply ULTRATHINK.
1. Problem clarity: one user-facing sentence.
2. Assumptions (mark risky).
3. Minimal viable change (smallest slice) + what is explicitly out-of-scope.
4. States: loading / empty / error / success definitions.
5. Edge cases: empty data, permissions/403, missing IDs, timeouts, rapid user interaction.
6. Single source of truth: reuse plan (list existing components/helpers).
7. Implementation plan: ≤6 ordered steps.
8. Test harness: happy path + 1 edge (inputs, expected outputs).
9. Accessibility & cleanup: focus order, semantics, remove dead code.
10. Checklist result: mark each ULTRATHINK item ✅ or N/A; flag any ⚠️ with remediation.
Output sections in the same order.
```

## Example Short Prompts

- "ULTRATHINK: smallest viable diff for X; list states + edge cases then 5-step plan."
- "Apply ULTRATHINK; refactor for single source of truth around Y (show reuse vs new)."
- "ULTRATHINK checklist audit on this PR: (paste description)."
- "ULTRATHINK error triage: classify console errors, propose smallest first fix." 
- "ULTRATHINK self-review of this diff: highlight principle coverage + micro-improvements (<5 lines)."

## Pattern Library (condensed)

| Goal | Prompt Snippet |
|------|----------------|
| Kickoff | Problem, assumptions, minimal change, states, edge cases, plan |
| Refactor | Identify duplication, propose consolidated helper + before/after diff |
| Navigation | Map actions → routes; verify predictability & reversibility |
| Edge Audit | Enumerate failure modes + handling strategy |
| Logs Hygiene | Classify logs: keep (guarded), remove, normalize prefix |
| Production Pass | Verify no dev-only leaks, graceful errors, timeouts, cleanup |

## Usage Guidance

1. Paste the Activation Prompt for substantial tasks; use Short Prompts for quick interactions.
2. Always prefer marking items N/A over silently skipping them.
3. If any checklist item is ⚠️, add a follow-up task before merging.
4. Keep added logging behind a debug flag or environment check to avoid noise in production.

