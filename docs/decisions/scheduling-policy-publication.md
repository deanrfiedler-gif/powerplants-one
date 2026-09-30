# Controlled scheduling-policy publication continuation

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **Date:** 27 September 2026. **Status:** Proposed synthetic implementation contract prepared under Dean's instruction to stabilise/integrate #322/#323/#324 and plan the next increment. Publication is not implemented; operational policy and owner acceptance are not granted.

## Evidence and scope

The integrated read-only PL-04 component compares permitted future bookings with a duration/effective-date scenario. Its exact runtime source is `89faa078a22525653e6e8f07cb82425372385b07`. It creates no proposal, task, policy or receipt. The [existing decision](scheduling-policy-impact-review.md) leaves API-C26/EVT-12 open. ADR-0010 requires shared graph locking, immutable published sources and retained booking pins.

Fresh live-schema inspection confirms scheduling policies are synthetic Published-only immutable records, with fixed mandatory contact/crew terms. The registry runs through 0050; Maintenance/Warranty and Products still have unpublished local 0049 proposals allocated to 0051/0052. They are not implemented predecessors. This plan preserves those worktrees and allocations.

## Planned approach

Use the existing TypeScript/Next.js/PostgreSQL stack, canonical hashes, `sharedOperation`, typed Activity links and shared controls. Add no new technology. Keep the first publisher limited to the predefined synthetic scheduling family, duration and future effective instant; do not implement template publication or a generic policy engine.

Allocate **0053** to the next scheduling publication increment, subject to refreshing main immediately before implementation. Leave 0051/0052 absent from the registry until their real, reviewed migrations exist. The current local and hosted runners apply missing registered versions, so an explicit reserved gap is supported. Publication must depend only on schema through 0050. Later integration of the reserved branches must prove both ascending installation and their missing migrations applied after 0053; allocation is not proof of compatibility. No applied migration, hosted gate or schema is changed by this planning decision.

The [implementation plan](../delivery/scheduling-policy-publication-plan.md) defines dedicated synthetic reviewer/publisher authority, immutable exact reviewed proposals, a monotonic append-only effective-policy chain, fresh complete booking evaluation under the existing workspace lock, atomic publication/owned impacts/audit/EVT-12/receipt and exact original recovery. Existing pins and issued bytes remain unchanged. Pending impacts block dispatch/start until a controlled fresh resolution; merely completing an Activity is insufficient. These are proposed prototype rules, not approved operational policy values.

## Alternatives and limits

| Alternative | Disposition |
|---|---|
| Reuse `schedule.manage` as publisher | Reject: booking authority does not confer business-policy authority. |
| Publish from the scoped #324 preview | Reject: transient duration analysis has no durable reviewed population or complete authority. |
| Mutate old policy or repin all bookings | Reject: loses immutable source/history and silently changes reviewed commitments. |
| Change only an outbox consumer and defer impact evaluation | Reject: creates a publication window without authoritative owned impacts or start enforcement. |
| Occupy 0051/0052, register placeholders or merge unfinished features to advance the sequence | Reject: violates reserved work and upgrade provenance. |
| Wait for unrelated features despite an independent additive contract | Not required by the current runner. Use explicit 0053 allocation, actual-file-only registration and upgrade proofs; revise if a real dependency emerges. |

The plan selects no operational duration, expiry extension, waiver authority, customer notification channel or real role assignment. Older application rollback cannot be presumed safe after publication because old code does not enforce new holds; this is a distinct obligation from #323's timer-schema rollback proof. Full PT-28/PT-30 and independent owner/device/visual/accessibility review remain open.

Traceability: SVC-04/05, DAT-06, NFR-08, D-015/D-020, TR-03/08, API-R04/API-C26, EVT-12, PT-08/09/28, AT-35. Preserve all parent IDs and issued references. No deployment, live integration or production data/business action is authorised.

## Step 2 persistence implementation — 28 September 2026

Dean explicitly authorised the bounded persistence increment and reviewable PR. Refreshed main is `a9840183` after #327; 0053 remained free and is now the actual additive scheduling-policy migration. 0051/0052 remain reserved. The unchanged TypeScript/PostgreSQL stack and Step 1 canonical contracts are reused; no technology decision changes.

Live-schema inspection established that existing `operation_receipts.record_id` requires a global business identity. Only `SchedulingPolicyPublication` is added to that registry, with the mandatory immediate/deferred identity-constraint sequence. All other new evidence remains typed child storage. This supports an exact original publication receipt without changing existing receipt meaning or assigning a publication receipt to an unrelated Activity. No audit/outbox type, capability or operational command is introduced by this storage increment. Activity keeps its existing typed Site link and gains an immutable impact companion with exact reviewed ownership/context.

Canonical unsigned UTF-8 text is stored alongside JSONB and its digest; database checks verify text/JSON/digest agreement, while unchanged Step 1 validators enforce exact shape and canonical semantics at the server adapter. The seed adds only the trusted root family/member/head, preserving old policy bytes, booking pins and later heads/evidence. Dedicated reviewer/publisher grants remain Step 3 work. The [source-linked verification and boundaries](../testing/evidence/scheduling-policy-persistence/README.md) distinguish structural database integrity from full command authority, freshness and atomicity. Independent review and owner acceptance are not granted by this edit.

## Step 3 command boundary — 28 September 2026

Dean authorised the complete synthetic command increment after protected Step 2 integration. PR #328's checked head `84401753` merged as `0d294d1d` at 2026-09-28T04:54:17Z; their trees match. All 20 checks, including the seven protected contexts, passed. The existing TypeScript/PostgreSQL stack, canonical contracts and shared operation/workspace lock remain the selected technology under ADR-0010.

Allocation refresh found 0054 free. Use additive **0054 scheduling-policy commands**, preserving installed 0053 and reserved 0051/0052. Proposal, review and resolution now need typed identities because each actual command must retain its own original receipt; using an unrelated Activity or publication as the result would misrepresent it. Add identities and immutable review-context evidence without rewriting prior policy/review bytes or inventing earlier receipts. Flush deferred identity events before altering the identity registry. Dedicated fictional review/publish actors have explicit Workspace duties and only the source reads needed for the complete workspace family; no existing role inherits a duty, and publishing grants no booking or dispatch authority.

**Activation dependency:** Step 3 handlers and HTTP adapters are exercised only by an isolated synthetic test harness. They are not registered in the live application or offline dispatcher, and no environment flag or user choice enables them. Step 4 must implement and verify booking selection, unresolved-impact readiness/start and offline-original enforcement together before routes can be registered. Step 5 owns PL-04 publication UI. Shared-lock serialization is not proof of Step 4 hold enforcement. Source implementation, independent review, owner acceptance and production readiness remain separate.


## Step 4 coordinated enforcement and compatibility — 30 September 2026

Dean authorised complete booking/readiness/start/offline integration, verification and a reviewable PR, without merge or deployment. Refreshed `origin/main` is `a9cead152a99a89be1476284e7c5d6fc4c462f5f` after #330; no open PR overlapped at preflight. The isolated branch is `codex/scheduling-step4`. The original checkout and unfinished Maintenance, Products and Excel-import work remain untouched. The live task-owned synthetic schema through 0054 was inspected. No schema, seed, grant, capability, framework or service is added: installed SQL and #330's exact two-root repair stay unchanged; 0051/0052 remain reserved.

The Step 1 selector and Step 3 guarded commands are reused. Booking preparation binds the pin (if any), applicable policy reference and publication-head version to the proposed interval. Confirm/move/request acceptance recompute those exact references under the existing original-operation then workspace graph lock. Half-open windows select the successor at equality; crossing, missing, expired and corrupt lineage refuse. New bookings can pin a published future policy. Controlled moves retain their existing pin and must also fit the current applicable policy. No publication repins or rewrites a booking/revision or issued output.

Durable impacts are authoritative immediately. Readiness computes their state from immutable impact/resolution evidence, not Activity completion, pack acknowledgement or a mutable dispatch flag. A resolution requires a recorded controlled move/change acceptance after the impacted version, fresh complete applicable evaluation, or the existing controlled cancellation/replacement evidence. Source/head/booking/crew/contact/preparation changes invalidate that exact resolution. Reaching the scheduled start alone is not a source change: new resolutions still require future bookings, while saved exact dispositions are checked at arrival against current time-dependent authority. Started/completed attendance remains historical. After all independent start checks pass, the actual-start write records the derived dispatch-ready/acknowledged state so a prior policy hold cannot leave factual capture falsely blocked by an old flag.

Pack preparation resolves the immutable pin against its scheduled interval, allowing preparation for a future published policy; it does not use wall-clock policy selection. Actual readiness/start still requires that retained pin to be currently effective; preparation does not bring future actual-attendance authority forward. Existing current expiry, work authority, customer, crew, acknowledgement and exact-document requirements remain. Delayed offline Start uses the same server command and current policy holds; `StartBlocked` becomes `ReviewRequired`. Original captured timestamps do not confer current authority. Already accepted originals recover their exact receipt before new-operation checks. Publication and resolution are absent from the offline protocol.

The live online API is activated only as part of the verified complete Step 4 contribution. Dedicated review/publish Workspace duties remain unchanged. There is no feature flag, bypass or ordinary-user publication grant. Step 5 still owns proposal/review/publication screens; Step 4 adds hold visibility and existing guarded resolution on the appointment. Visual/owner/device acceptance remains pending. [Verification](../testing/evidence/scheduling-policy-enforcement/README.md) records actual checks and failures separately.

### Compatibility and rollback boundary

This is a coordinated server/client activation. Older application code does not enforce durable impacts or select successor policies and is **not a safe rollback target after publication**. Even before publication, older parsers do not understand new booking preparation fields. Do not run mixed pre-Step-4 writers, workers or start/sync endpoints against an activated environment. A supported software rollback must retain Step 4 selection, resolution, start and offline enforcement plus its command parsers. If such a release is unavailable, retain the enforcing release or stop writes and repair forward; do not delete publications, rewrite receipts, downgrade schema or restore over later evidence to simulate rollback.

Legacy accepted booking originals omit the new fields. Parsing preserves that exact shape solely for authorised existing-receipt recovery; a new operation without complete preparation refuses. Unsupported unsent originals stay retained for fresh online review. Older-schema populated upgrade fixtures remain supported only while publication tables do not exist, using one of the two exact known roots. Existing but missing/corrupt lineage never falls back. The shared storage check uses publication-family and installed seed-receipt evidence to distinguish an older schema from missing installed tables; damaged storage refuses booking and hold reads instead of restoring root-only authority. Pre-Step-4 internal resolution evidence lacking the new controlled-change binding becomes stale conservatively, without rewriting its bytes. This does not grant old-code rollback safety or complete PT-28/PT-30 acceptance.
