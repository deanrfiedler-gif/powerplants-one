---
title: CR05 completed-read timer floor
date: 2026-11-04
---

Codex claims the narrow timing fix in `tests/browser/sales-workflows.spec.ts`: release completed reads only after `Date.now()` measures at least 6,000 ms since the completion receipt, re-arming the timer for any remainder. The existing elapsed-time assertion, bounded `finally` release, other test behaviour and application code stay unchanged. Implementation and checks are pending.

Cloud setup succeeded with PostgreSQL ready and browser unavailable. Repeated desktop and mobile browser runs are **not run here; left to GitHub CI**. The separately reported CI browser startup failure is **environment-blocked: Chrome 157**, addressed by [PR #859](https://github.com/deanrfiedler-gif/powerplants-one/pull/859), not this contribution.

Synthetic data only. Claude's one independent review and Dean's merge remain separate; no merge or deployment is performed.
