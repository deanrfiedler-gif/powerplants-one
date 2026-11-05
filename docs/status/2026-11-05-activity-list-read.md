---
title: Batched Activity list detail reads
date: 2026-11-05
---

[PR #862](https://github.com/deanrfiedler-gif/powerplants-one/pull/862), branch `codex/activity-list-read`, addresses the Customer 360 N+1 read identified in [Claude's #707 evidence](https://github.com/deanrfiedler-gif/powerplants-one/pull/707#issuecomment-6652225470). The implementation is a Codex decision under the standing order. No merge or deployment is performed.

The existing list query is the page's Activity visibility authority. It now retains the row data and owner names, reads all page links in one permission-scoped statement and batches the remaining native detail lookups on one client. Required evidence, incident/report/escalation sources and source-specific edit restrictions remain present. Ordering, filters, signed cursors and DTOs are unchanged. Customer workspace reads enter the existing sanitised server diagnostics.

The [equivalence proof and measurement record](../testing/evidence/activity-list-read/README.md) covers multiple principals, owners, current assignments, mixed links, other-company records, source and shared-read revocation, escalation-associated chase Activities, selected working company, three-row paging and a 100-row page plus one-row continuation. No existing test expectation is changed.

On the same main-seeded database plus 100 synthetic customer-linked Activities, summed PostgreSQL parse/bind/execute/simple-statement time falls from **36,927.062 ms to 217.498 ms**, and executed statement count from **2,817 to 134**. Workspace wall time is **2,982.314 ms before and 350.441 ms after**. This is one local compiled-HTTP sample per implementation after warm-up, with SQL logging enabled and each server plus PostgreSQL pinned to CPU 0, not a hosted or ten-user result. [Exact timestamps and counts](../testing/evidence/activity-list-read/measurements.json).

Setup reports PostgreSQL ready and the browser unavailable. Foundation, prototype, naming, status, migrations, 44 documentation unit checks, Studio and `npm run check` passed; the latter includes 1,405 unit tests, lint, typecheck and the compiled build. The selected database run passed 81/92 and the shared HTTP group 90/113. All 11 database and 23 HTTP failures reproduced with the same messages on clean main `3faff7aef476904a30e878be8bdc9e95792fb4fb`; individual names, messages and environment-blocked or pre-existing classifications are in the evidence records. The final two-test equivalence rerun, including one pool acquisition for a 100-row page, passed.

The 33 exclusive HTTP files that the runner did not reach, local browser suites and ready-head compiled-application/P01–P11 CI jobs: **not run here; left to GitHub CI**. The new-PR instruction requires every check to pass before marking ready, so the PR remains draft with those gates unmet. Claude's one independent review has not yet been requested. No migration, capability, grant, dependency or API-shape change is included.
