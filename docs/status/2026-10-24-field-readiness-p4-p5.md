---
title: Field readiness P4/P5 backend implementation and validation
date: 2026-10-24
---

Dean authorised the P4/P5 backend/API slice with **"Proceed."** and the shared migration/upgrade-test edits with **"Allow narrow edits on #690"**. Codex for Dean owns [draft PR #690](https://github.com/deanrfiedler-gif/powerplants-one/pull/690), branch `codex/field-readiness-p4-p5`, migration 0120. See the [implementation plan](../superpowers/plans/2026-10-24-field-readiness-p4-p5.md) and [adopted decision](../decisions/field-readiness-gate-proposal.md).

The slice adds typed SiteReadiness contact evidence, P04 v3's derived CustomerSiteReadiness criterion, synthetic preparation deadlines and owned deadline Activities. The service API and data dictionary record the contract; the design register records API availability separately from future UI wiring. Existing duration-policy publications, older readiness pins, command receipts and issued pack bytes are preserved.

The PR maintains the exact local and CI validation results, their tested commits and any outstanding checks. Integrated local upgrade proofs preserve populated histories and issued bytes; all nine late-0110 assistant upgrade cases and all four maintenance Service journeys passed after fixture corrections. These component results do not by themselves establish a green final head. On 24 October 2026 Dean explicitly waived the independent review for this PR: **"You can proceed without the review."** No independent review took place. This owner exception applies to #690 only; final-head CI must still pass before the PR is marked ready, and merge remains unauthorised. This fragment does not claim executed business acceptance, production readiness, deployment or merge. Service still owns real policy values under D-015. Other contributors' branches remain untouched.
