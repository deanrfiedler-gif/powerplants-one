---
title: Organisations CS-01 CI corrections before owner review
date: 2026-10-19
---

Dean initially requested that [PR #604](https://github.com/deanrfiedler-gif/powerplants-one/pull/604) remain unmerged until its CI failures are resolved and he reviews CS-01. His later instruction to fix and merge #604 and #607 supersedes that merge hold; visual acceptance remains separate. The [integration status](2026-10-19-organisations-ci-repair.md) records the coordinated repair. The completed `8a7db7be` run exposed a register load problem, an obsolete performance-sampler endpoint, a Stakeholders navigation race, a Sales test asserting before its source read completed, and a notification test still targeting the replaced directory table. Summary-gate failures reflect these member failures; the performance cancellation was an automatic execution timeout, not a user cancellation.

The [implementation](../decisions/organisations-figma-implementation.md) now materialises matching names and groups related register reads in the existing SQL snapshot, retaining the same visibility predicates, matching rule, counts and signed pagination. The sampler observes the actual register GET; the browser tests synchronise with the requested handover/source response and use the accepted D1/D3/D5 composition. No test deadline, load size, fixture date, permission or business rule is relaxed.

The [follow-up evidence](../testing/evidence/organisations-native-r01/README.md#ci-correction-follow-up) separates the original CI failures, local load comparison and subsequent verification. Current `main` is integrated at `47e47361`, including its Conversations changes and owner decision records. Owner visual review, baseline acceptance, merge and deployment remain separate. No next page is started.
