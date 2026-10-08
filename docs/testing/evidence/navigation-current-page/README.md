# Current-page navigation and unsaved reload protection

Dean requested reproduction and correction on 8 October 2026 after independent review. Actual main is `f24e50b4d5fd954005e7f79873449595f0c58ec3`; PR #367 was already merged by the owner at 03:49 UTC before this request. This corrective branch, `codex/nav-unsaved-current-page`, must remain unmerged until verified. The original checkout and unrelated work are preserved.

## Plan and acceptance

1. Reproduce in the full application using the existing isolated `ppo_synthetic_test` database, coordinator identity and real unsaved Contact correction. Select that exact current record through shell search, approve, edit again without resetting dirty state, then attempt native Chrome reload. Observe actual dialogs and retained draft; no mocked application or saved business command. An initial Preferences probe could not reach this sequence because Updates is not a global-search destination; it is not counted as a reproduction.
2. Correct the shared approval lifecycle in `src/components/navigation-intent.ts`. Same-document/no-op approval must not suppress a future reload; an actual permitted departure must still work. Retained record views, pending/unknown command refusal and stronger Discovery recovery must remain intact.
3. Keep the regression in `tests/browser/navigation-safety.spec.ts` for pointer, touch and keyboard on the existing desktop/mobile Chrome projects. Cover approval consumption and cancellation in focused unit tests where needed.
4. Update the living shell component/state/consumer guidance and run studio, lint, TypeScript, unit/build/browser checks and affected full-application navigation/recovery suites. Publish a focused corrective PR and verify its required CI contexts before handover. No merge/deployment, dependency, schema, seed or grant change.

## Reproduction and cause

Full application on unchanged main `f24e50b`: both desktop and phone approve current-record search once, keep the correction mounted, accept another edit, then reload with **zero native unload warnings**. The four new standard compiled browser scenarios (mouse, phone touch and keyboard on both projects) likewise fail at the missing warning; warm-up succeeds, 670 routes with no unreachable route. Two focused approval-lifetime units fail and two retained-policy units pass on the baseline.

The shared guard sets `approved` when its reviewer permits a transition. Its Navigation API handler previously ignored a current-URL event before consuming that approval. The mounted dirty owner then skipped `beforeunload`. Dirty remaining true meant React did not reinstall its effect to rearm the warning.

The correction consumes approved non-reload navigation before current-URL/retained-view shortcuts. Explicit approved reload retains its permission until the one corresponding unload, which consumes it too. No global guard is released; cancelled transitions, retained record views, pending/unknown refusal and higher-priority Discovery remain unchanged.

## Executed verification

Environment: Windows, Node 24.21.0, npm 11.19.0, Playwright 1.63.0, stable Chrome 154.0.8037.98, task-owned PostgreSQL 16.15 and exact database `ppo_synthetic_test`. Windows later refused the old task port 5549, so the existing cluster runs on available loopback port 15549. No reset, migration or seed. Fixture Contact has its own UUID and one permitted synthetic company; fixture creation is separate from the zero UI correction commands asserted by the regression.

- Focused corrected context/safety/approval units: **12 passed**.
- Corrected compiled regression with the normal warm-up dependency: **five passed**, including all four regression cases. Each observes its successful exact scoped Contact read, approves same-record search once, edits while dirty stays true, dismisses actual native reload, retains the later value and observes zero correction POSTs. A real subsequent departure has one additional review.
- Corrected application build, full TypeScript and pinned browser-runtime check pass. Full Windows units: **626 passed / three failed out of 629**. All three document-storage/recovery failures reproduce on untouched main `f24e50b` in a separate worktree; no source defense is relaxed.
- Studio integrity passes: 350 unreviewed, zero stale and no errors. Source lint initially encountered a retained ignored generated Job Pack review bundle; that task-owned artifact was preserved outside the checkout before running default lint again. No lint rule is changed.
- Default full lint, studio, naming and foundation assurance pass; issued references are unchanged. Retained compiled department/shell/search/navigation-safety proof passes **34 cases / 13 explicit viewport skips**, including its warm-up. This run excludes the four already-passed new regression cases rather than repeating them.
- Focused Equipment/Sales/Discovery recovery and CI results are pending at this checkpoint. The corrective PR records actual final-head checks separately; a pending/unrun result is not pass.

The first corrected browser driver awaited `page.reload()` after dismissing its native warning, then timed out waiting for a document load that was cancelled. Its interrupted run and private traces are retained. The regression now invokes actual `window.location.reload()` and asserts the real dialog, unchanged exact URL, mounted draft and later permitted departure; no synthetic unload event substitutes for browser proof and no deadline is extended. Earlier unsuccessful probes (missing Updates search entry, invalid initial route and a cross-company seeded Contact lacking edit authority) are excluded from reproduction/pass counts.

Private raw logs, snapshots and traces remain in `C:/Users/Dean.Fiedler/.codex/tmp/nav-current-page-20261008/`. Bounded outcomes are in [regression-results.csv](regression-results.csv). Source delivery, functional proof, owner/physical-device/zoom acceptance and deployment remain separate. No layout/reference change or accepted review fingerprint is introduced.
