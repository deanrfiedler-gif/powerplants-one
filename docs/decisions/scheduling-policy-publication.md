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
