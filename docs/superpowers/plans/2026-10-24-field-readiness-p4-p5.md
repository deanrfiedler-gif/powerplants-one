---
document_id: PPO-FIELD-READINESS-P4-P5-PLAN
date: 2026-10-24
owner: Dean Fiedler
status: Authorised implementation in progress; independent review pending
source_commit: 79bef1d32f42cd2dcdbf04ce0f30a4374199db2e
versioning: git
---

# Field readiness P4 and P5 implementation plan

Owner: Codex for Dean. Authorisation: Dean replied **"Proceed."** on 24 October 2026 to the recommendation to build P4/P5 as a backend/API slice. Claim: PR #690, migration 0120. Source: [field readiness decision](../../decisions/field-readiness-gate-proposal.md), P4/P5, R7-R9/R11, Q3-Q5; SVC-03/SVC-04, ADR-0010, API-C24/API-R04; CS-06, SV-04, SV-05, FI-01 and PL-01.

## Outcome and boundaries

Record four site-readiness checks against the current appointment schedule version using the existing contact command and authority. Derive the P04 v3 dispatch criterion from current contact evidence. Show the synthetic confirmation window and pack issue deadline in authorised reads. Create owned, deduplicated Activities when either deadline is missed. Issue lead time is advisory and never a dispatch criterion. Customer sending, live systems, deployment and merge are excluded. UI wiring is a separate follow-up.

## Compatibility design

The existing scheduling publication family permits only duration and effectivity changes. Its fixed-term hashes, reviews and booking pins cannot represent preparation timing without a separate publication-contract change. Add an immutable scheduling-preparation policy version bound to P04 v3, keeping the duration-policy family unchanged. This is a bounded implementation departure from placing the new terms in the existing duration policy. The seed supplies explicitly synthetic five-day/24-hour confirmation boundaries and noon on the previous working day. Do not fabricate review records, repin old appointments, or alter issued pack bytes. Preserve P04 v1/v2 bindings and old contact-command hashes when purpose is omitted.

## Work sequence

1. Reserve 0120 and open the draft claim (done).
2. Add versioned timing terms, typed contact purpose/checks, database backstops and immutable deadline-to-Activity receipts. Add P04 v3 without changing old policies, identities, capabilities, grants or users.
3. Implement strict contact validation, derived readiness and deadlines; distinguish date agreement from site readiness. Keep receipt replay under current authority. Reassert dispatch holds on a later unsuccessful site contact before attendance.
4. Integrate authorised appointment/pack/readiness projections and existing worker. Use published calendars, explicit site time zones and owned Activities; disclose missing calendar authority rather than assume weekdays. Deadline work uses the shared workspace lock and durable uniqueness.
5. Add focused unit, database, populated-upgrade and HTTP proofs alongside the implementation. Fixture design uses explicit relative-to-server visit instants for P4 boundaries, and historical pins for existing older-policy journeys. Never relax the window for distant fixtures.
6. Dean explicitly authorised narrow shared-file edits with **"Allow narrow edits on #690"**. Make additive migration registry, demo gate and exact upgrade/seed ledger changes on #690; reconcile #673/#689 through merges from main. Do not modify either contributor's branch. Preserve original populated ledgers and add the late reserved Products case.
7. Maintain service API/data-dictionary chapters, dated decision notes, exact document-register/status fragments and narrow design-register entries. Preserve all protected landing pages and generated views.
8. Run the complete requested local validation on a disposable PostgreSQL 16 cluster, follow final-head CI, then obtain and disposition a different-model review. Mark ready only after both are complete; do not merge.

## Proof obligations

- Contact shape, four typed checks and notes; DateAgreement compatibility; SiteReadiness never supplies date agreement; earliest/exact/late boundaries, latest evidence ordering, schedule moves and old versions.
- Permission refusals, same-404 company/workspace isolation, read-only access, replay after version changes, concurrent original-operation recovery and changed-payload conflict.
- Derived Pass/Blocked/Unknown, refusal of manual clearance, database dispatch backstop, a later NotReady contact reholds only before attendance, no issued-byte or acknowledgement mutation.
- Calendar effectivity, holidays/exceptions, previous working day, time zones/DST; issue deadline remains a warning; checker Return deadline uses the same source.
- Worker retry/concurrency, exact Activity ownership/deduplication, absence of sending, late recovery and schedule-version separation.
- Populated upgrade preserves old contacts, policy hashes/pins, receipts, identities, users/grants and issued artifacts; reseeding is idempotent. Enumerate every exact migration/seed assertion from searches, including computed ledgers and demo counts.

## Validation record

Pending implementation. Local component results, CI, independent review, executed acceptance and business approval will be reported separately. No production readiness is claimed.
