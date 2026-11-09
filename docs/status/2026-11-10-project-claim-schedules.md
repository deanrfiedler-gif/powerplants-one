---
title: Project billing B2 claim-schedule backend
date: 2026-11-10
---

[PR #881](https://github.com/deanrfiedler-gif/powerplants-one/pull/881) implements B2's backend slice: independently reviewed claim-schedule revisions on an approved commercial basis, exact milestone totals, document-bound completion evidence and positive approved variation lines. The [contract](../contracts/project-commercial-controls.md#b2-claim-schedules-and-completion-evidence) defines commands, permission-scoped reads, bounded history and original-operation recovery. The [implementation choices](../decisions/project-delivery-billing.md#b2-backend-implementation-choices--10-november-2026) preserve the immutable original basis and hold schedule replacement after completion evidence, plus signed/zero claim corrections pending their policy.

Migration 0125 adds an empty append-only ledger, database guards and deferred audit/receipt/outbox checks. No seed, capability or grant is added. Historical migration assertions, the late Products upgrade and the reviewed demo upgrade gate are extended without changing original ledgers or seed/grant expectations.

Verification: 1,447 unit tests, nine unmocked historical/demo upgrade cases, and four separately labelled command-only database cases passed. The latter use explicitly synthetic retained output bytes, not a renderer. Lint, TypeScript, Studio, foundation/prototype/naming and migration checks passed. Four normal B2 database cases fail at the missing Chrome prerequisite; unchanged-main PJ05-01 reproduces the same ExactDraftUnavailable. Compiled HTTP/browser journeys and full database CI remain unrun here. See the [execution evidence](../testing/evidence/project-commercial/README.md#b2-claim-schedule-backend--10-november-2026).

Production build passed. Claim-schedule UI controls, B3 Finance holds/processing, B4 non-billable enforcement, maintenance M2/C1 and TS-01 acceptance remain open. Claude's one review and full ready-head CI remain outstanding. No merge or deployment.
