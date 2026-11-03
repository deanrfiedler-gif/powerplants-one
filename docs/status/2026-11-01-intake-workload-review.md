---
title: Intake workload review corrections and current-main guide integration
date: 2026-11-01
---

PR [#703](https://github.com/deanrfiedler-gif/powerplants-one/pull/703) integrates current main and addresses the ten findings from [Claude’s review of f15c7a24](https://github.com/deanrfiedler-gif/powerplants-one/pull/703#pullrequestreview-5721353147). Background checks retain confirmed controls and focus; failure clears rows, counts and snapshot throughout pending retries. Query changes retain mounted controls. Selection replaces the normal toolbar without moving the register, supports Hide/Show panel, and resets sequence navigation on close/cancel/select-all/ordinary row opening.

Both registers retain complete native references/revisions and show successful read times. Phone sell uses AUD formatting; Saved search no matches is distinct from an empty register. Readiness follow-ups use Saved owner instead of displaying an internal UUID. The documented W6 footer keeps its two adopted handovers; no undefined ellipsis command is invented. See the [route contract](../design/development/pages/route-estimating.md) for bounded adaptations.

The missing per-module integration contract now supplies the retained source hashes and proof paths required by the CRM visual check. Main’s Markdown guide migration is preserved: the obsolete TypeScript guide stays deleted, ES-01 source paths point to Markdown, and the rewritten guide remains InReview. Its carry-over parity fixture is retired; content-owner review and publication remain separate.

Validation and capture results are recorded in the [implementation evidence](../testing/evidence/intake-workload-accepted/README.md). The prior head’s full application and compiled-browser CI passed; its CRM visual check failed on the missing module contract. The follow-up passed 66 focused units, 18 fixture UI cases, studio:check, ESLint and the adopted-module CRM conformance case. The latest native browser rerun passed one of eight cases; the other seven and their warm retries hit setup/read failures or time limits and remain unproven on this head. New-head CI and independent review remain distinct from earlier results. No receiving/linking mutation, native workload rule, migration, permission, allocation or priority policy changes in this follow-up. Owner/device acceptance, merge and deployment remain separate.
