---
title: S3 review corrections and current-main integration
date: 2026-10-28
---

Dean authorised the professional next-step sequence on 28 October 2026. This Codex session owns PR #730, a bounded correction contribution into PR #695 at `5f6962e3`, retaining that branch's ownership and the existing-build completion rule. The contribution integrates main `4d4e4d9c` and addresses the two Medium review findings. It does not open a new feature workstream.

A Queued ancestral dispatch now holds a correction because its worker may already have claimed it. Confirmation and hand-over also compare the recomputed predecessor with the immutable message's predecessor. Resolving the original requires deliberate re-preparation of the correctly marked correction; an earlier ordinary draft cannot silently become a correction.

An inactive Demand owner, or one without either scoped `activity.read` or `shared.read`, no longer rolls back valid native Dispatch or customer-ETA evidence. The native audit event records `NotPrepared` / `OwnerUnavailable`, with no communication or follow-up created. The implementation catches only that owner eligibility refusal, retains all caller/source/catalogue checks and never guesses another owner. Explicit preparation refuses until owner setup is repaired; replay keeps the original receipt and does not prepare retrospectively. The existing communications contract documents this boundary.

Four database regressions cover a correction during claimed hand-over, and native Dispatch plus ETA updates for inactive owners and each missing permission. They assert held correction recovery, exact sent-copy identity, native facts, audit reasons, receipt replay, original-operation recovery and deliberate preparation after owner restoration. These regressions are authored and typechecked; PostgreSQL execution remains pending in CI.

Integration preserves migrations 0120 and 0121, both seeds and original migration/seed ledgers. Upgrade assertions retain the 0120 readiness-policy and contact-column changes while checking the exact 0121 binding additions. The late reserved Products cases include both 0120 and 0121 starting points, and the hosted upgrade count includes both migrations. No migration file, issued source or original receipt is rewritten.

Local validation: TypeScript, ESLint, all 1,160 unit tests, development-register integrity (no errors; 26 stale and 346 unreviewed entries remain), foundation (78 requirements), naming, migration numbering and all 22 documentation regression tests passed. The full default Next/Turbopack build passed after dependencies were copied inside the isolated checkout; the initial external dependency symlink was unsupported by the compiler. Node 24.22.1 and npm 11.9.0 were used with the unchanged locked dependency tree; CI supplies the pinned npm 11.19.0 runtime. No local PostgreSQL, HTTP, browser or hosted-upgrade pass is claimed.

Final-head CI and independent different-model re-review remain pending before any merge. Review should concentrate on the source/predecessor gate, owner refusal boundary, concurrent hand-over regression and full-transaction upgrade assertions. Automated proof, business acceptance and production readiness remain separate. No live messaging, deployment or merge was performed; the existing merge hold and three-build limit remain in force.
