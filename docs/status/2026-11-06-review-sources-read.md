---
title: Review source Engineering page reads
date: 2026-11-06
---

[PR #865](https://github.com/deanrfiedler-gif/powerplants-one/pull/865) batches Engineering review sources with native per-package access checks and five set reads per 50-package page. The unchanged workspace readers supply the frozen oracle. Five principals, two company filters, revoked/expired/site-scoped grants, site policy, native denial/refusal, exact JSON order and My Work slicing pass; the 205-package case retains rich task coverage inside the 200-package bound. This is an agent decision under the standing order, not owner acceptance.

Single final warmed samples on the same synthetic fixture (205 packages, two Service reports, four Finance handoffs), with compiled servers and PostgreSQL pinned to CPU 0:

| Measurement | Before | After |
| --- | ---: | ---: |
| reviewSources executed statements | 4,517 | 149 |
| reviewSources summed database duration | 2,528.482 ms | 1,456.270 ms |
| reviewSources longest statement | 48.583 ms | 348.621 ms |
| reviewSources wall time | 4,455.588 ms | 1,661.210 ms |
| Compiled work overview wall time | 4,090.286 ms | 1,693.822 ms |
| Compiled work navigation wall time | 3,728.038 ms | 1,634.578 ms |

Service and Finance remain per-row: respectively 93 statements for two Draft reports and 114 for four handoffs. The existing company-filter failure remains for a separate PR. The [evidence record](../testing/evidence/review-sources-read/README.md) retains methods, hashes, final and preliminary samples, authority reasoning and each failure classification.

Foundation, prototype, naming, status, studio, lint, typecheck, all 1,426 unit tests, production build and both final equivalence tests passed. Existing database suites: 30/125 passed, 94 renderer-blocked and one reproduced on clean main; the additional download proof also reproduced on main and exposes a renderer failure. Shared HTTP: 92/115 passed; all 23 failures reproduced on main (15 renderer-blocked, eight pre-existing fixture/assertion failures). The unchanged HTTP runner stopped before its 33 exclusive files. Those files and local browser suites were **not run here; left to GitHub CI**. Ready-head CI and comparison with the most recent successful main browser runs are recorded in the PR completion comment. No independent review or merge is claimed.
