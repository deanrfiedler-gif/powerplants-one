---
title: CR05 completed-read timer floor
date: 2026-11-04
---

The CR05 completed-read hold in `tests/browser/sales-workflows.spec.ts` now releases only after `Date.now()` measures at least 6,000 ms since the completion receipt, re-arming the timer for any remainder. A timer firing one millisecond early previously produced 5999 against the unchanged 6000 floor, as reported in [PR #803](https://github.com/deanrfiedler-gif/powerplants-one/pull/803). The bounded `finally` release remains unchanged; a queued callback stops if that release has already run. No other test behaviour, timeout or application code changes.

Foundation, naming, status-source validation, prototype consistency, migration numbering, 44 documentation regressions and focused ESLint pass. A controlled execution of the actual callback holds at 5999 ms, schedules the remaining 1 ms and releases at 6000 ms; it also stops re-arming after the failure-path release. Byte comparison confirms the rest of the test, including the exact elapsed-time assertion and `finally` block, matches the base.

The full `npm run check` passes with network access enabled: development register, repository-wide lint, TypeScript, all 1,356 unit tests and the build. The first restricted run passed register/lint/typecheck but reported 10 test-file failures and stopped before the build; a local listener probe confirmed `EPERM` at `127.0.0.1`. The authorised network retry passed without a source change. The register retains 26 existing stale reviews; passing checks do not grant visual or owner acceptance.

Cloud setup succeeded with PostgreSQL ready and browser unavailable. Repeated desktop and mobile browser runs are **not run here; left to GitHub CI**. The separately reported CI browser startup failure is **environment-blocked: Chrome 157**, addressed by [PR #859](https://github.com/deanrfiedler-gif/powerplants-one/pull/859), not this contribution.

Synthetic data only. Claude's one independent review and Dean's merge remain separate; no merge or deployment is performed.
