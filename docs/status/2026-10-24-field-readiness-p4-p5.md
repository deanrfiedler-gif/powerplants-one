---
title: Field readiness P4/P5 backend implementation in progress
date: 2026-10-24
---

Dean authorised the P4/P5 backend/API slice with **"Proceed."** and the shared migration/upgrade-test edits with **"Allow narrow edits on #690"**. Codex for Dean owns [draft PR #690](https://github.com/deanrfiedler-gif/powerplants-one/pull/690), branch `codex/field-readiness-p4-p5`, migration 0120. See the [implementation plan](../superpowers/plans/2026-10-24-field-readiness-p4-p5.md) and [adopted decision](../decisions/field-readiness-gate-proposal.md).

The slice adds typed SiteReadiness contact evidence, P04 v3's derived CustomerSiteReadiness criterion, synthetic preparation deadlines and owned deadline Activities. The service API and data dictionary record the contract; the design register records API availability separately from future UI wiring. Existing duration-policy publications, older readiness pins, command receipts and issued pack bytes are preserved.

Validation and independent review remain in progress. The PR will record exact commands, final-head CI and review disposition before it is marked ready. This fragment does not claim executed business acceptance, production readiness, deployment or merge. Service still owns real policy values under D-015. Other contributors' branches remain untouched.
