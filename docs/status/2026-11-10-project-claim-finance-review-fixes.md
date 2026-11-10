---
title: Project billing B3 review corrections
date: 2026-11-10
---

Codex addresses Claude's five findings on [PR #883](https://github.com/deanrfiedler-gif/powerplants-one/pull/883). B2 #881 is merged; B3 targets main and has merged main `900daa9d0` without conflicts. The [review-fix evidence](../testing/evidence/project-commercial/README.md#b3-review-corrections--10-november-2026) records historical Finance compatibility, exact preserved-row/default assertions, the Contacts source re-read and pin, historical-authority ProjectClaim reconciliation after closure, and the two documentation corrections.

Validation passed: `npm run check` (Studio, lint, TypeScript, all 1,449 unit tests and production build); 14 focused command-only database cases (all eight B3 cases, populated 0125 Finance upgrade, both existing Finance upgrades and all three P11 migration-12 cases); all 103 Contacts model groups; deterministic Contacts HTML; and 44 documentation tests. An earlier broad command-only Finance run completed 18 boundary cases without failure, including stale WorkOrder reconciliation and account/source/rollback guards, then was deliberately stopped to prioritise the focused run. It is not reported as a complete suite pass.

Both browser probes failed because the configured Chrome and Playwright Chromium binaries are absent. Database proofs explicitly use the existing synthetic-byte renderer helper; they are not rendered-output or browser evidence. Normal rendered database/HTTP/browser suites and database-process restart were not rerun locally. The closed-project fixture isolates Finance with a test-only lifecycle update, so native closeout and TS-01 acceptance remain unproven here. Claude's confirmation, full rendered CI and Dean's merge remain outstanding. The PR stays draft while those review gates are open. No B4, TS-01 acceptance, deployment or real ERP processing is claimed.
