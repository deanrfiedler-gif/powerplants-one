---
title: Reviews and approvals page implementation
date: 2026-10-24
---

The accepted Reviews & approvals register is implemented on `codex/estimate-reviews`, preserving navigation ID `estimate-reviews` and ES-04/ES-05. `/estimating/reviews` follows the path already planned in scope:ES-04; no runtime destination existed at the implementation baseline. The [queue decision](../decisions/estimating-review-queue.md), [accepted design](../decisions/estimate-reviews-design.md) and [working page contract](../design/development/pages/route-estimating-reviews.md) govern the delivered source.

Six permission-scoped views, type/site/search filters, exact snapshots, returned findings/responses, source changes, selected-only export and native review/release handovers are implemented with shared controls. Counts identify readable rows in a candidate window; 25 estimates can produce 75 rows. Empty filters retain continuation. Waiting uses recorded elapsed time without an SLA. The native commands retain own-work exclusions and decision duties; a superseded estimate submission needs a deliberate current-review handover. No migration, seed, permission, dependency or operational integration is added.

Local validation in progress: 28 native ES-04/ES-05 and queue database tests, 24 focused unit tests, type checking, lint, build and studio coverage have passed. Connected HTTP/browser proof, capture comparison and repository assurance are being completed in the same PR. Early two-minute database setup/upgrade timeouts were rerun successfully with sufficient local time. No independent review, owner visual acceptance, merge or deployment is claimed. Final results belong in the [execution evidence](../testing/evidence/estimating-review-queue/README.md).
