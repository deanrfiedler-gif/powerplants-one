# BP-03 — Controlled opportunity handover contract

**Revision:** r01 · **Date:** 7 September 2026 · **Owner:** Dean Fiedler · **State:** Proposed, design only; H-01–H-03 unresolved. **Baseline:** `744b6e6b89e69abdd0fbd4bfdd6ef5ae51e154f3`.

[Decisions](../decisions/crm-opportunity-handover.md) · [Journey](../blueprints/crm-handover-journey.md) · [Future proof](../testing/crm-handover-verification.md) · [Handover](../delivery/crm-handover-design-handover.md).

## 1. Accepted source facts and the precise gap

| Source at the baseline | Accepted fact | Consequence for this proposal |
|---|---|---|
| [ADR-0015](../decisions/ADR-0015-crm-i1-owned-opportunities.md), [0010](../../db/migrations/0010-crm-opportunities.sql) | Owner is in the immutable Opportunity context tuple; one exact event is required for every version. Pipeline/stages and all existing events are immutable. | A future additive migration must introduce a guarded transfer case, not merely remove `owner_id` from protection. |
| [CRM context](../../src/crm/context.ts) | Create checks eligible owners; qualify/plan require the current owner plus scoped edit. No manager or transfer capability exists. | Broad BP-03 manage/transfer rows remain unaccepted future proposals. H-01 introduces the smallest additional authority. |
| [CRM commands](../../src/crm/opportunities.ts) | Qualification needs a contact or an active identification Activity owned by the owner at qualification. Planning is separate. | Retain that historical eligibility fact after transfer. An Enquiry's new owner still needs their own eligible identification action before qualifying without a contact. |
| [Activity](../../src/activities/activities.ts) | All linked targets must be readable. Update/reassign is scoped; only Activity owner starts/completes/cancels. Terminal content and links are retained. | Neither new nor former opportunity ownership substitutes for Activity authority. |
| [Operations](../../src/platform/operations.ts), [receipts](../../src/shared/receipts.ts), [CRM receipt actions](../../src/crm/receipt-authority.ts) | Current authority precedes replay; key is workspace/actor/operation; canonical SHA-256 includes command name. Existing qualify/plan lookup checks current owner. Receipt actions come from the original event, not today's designation. | Accepted-original recovery needs H-03's explicit CRM-only exception to today's-owner check; hashes/results remain unchanged. |
| [I2 worklist](../../src/crm/worklist.ts), [read decision](../decisions/crm-i2-worklist.md) | Owner labels and two views are read projections of the same permitted records; signed page context and changed-window handling are in place. | Refresh the resulting server view; do not infer command authority from filters/preferences or add a Board mutation. |
| [E1 context](../../src/estimating/context.ts), [E1 contract](estimating-e1.md) | Estimate owner is fixed independently; saves/preparation require estimate ownership and their own grants. All reads require the underlying Opportunity and relationship visibility. | Handover does not transfer the estimate, edit its versions or alter exact draft bytes. Losing CRM scope can still block an estimator's dependent access. |
| [P09](../decisions/ADR-0014-p09-service-reports.md), [P10](../decisions/ADR-0016-p10-finance-handoff.md) | Service review, exact reports/responses and restricted Finance prepare/review/process/reconcile/output/account are independent. | No automatic work, approval, allocation, issue, message or financial effect; preserve their unions and receipt dispatch. |

The verified I2/P10/E1 publications supersede old pending paragraphs in their maintained handovers only for delivery state. They do not accept any ownership-transfer policy. P11 [#54](https://github.com/deanrfiedler-gif/powerplants-one/issues/54) and Projects PR #52 are concurrent; reread their actual accepted changes before future implementation.

## 2. Authority and recipient eligibility — proposed H-01

Initiator: active server-resolved user in the same workspace, currently the Opportunity owner, with `crm.opportunity.transfer.own` **and** the existing `crm.opportunity.edit`, `crm.opportunity.read`, shared read/Internal and Activity read/edit checks in the exact company/site context. Use the same current relationship validation and original immutable pipeline. The transfer grant alone grants no read/edit rights. Reject a forged actor, owner, company or display label. No `crm.opportunity.manage` is implemented or implied.

Recipient: a different active user selected by UUID in the same workspace, passing `eligibleOpportunityOwner(c, principal, opportunity, recipient_id)`. This requires actual edit/read/Internal/shared and Activity read/edit grants, current company/site/organisation/person visibility, active primary contact and its effective affiliation, effective organisation/site relationship and actual pipeline definition. Company/Workspace grants may satisfy the specific scope; Site grants cover only that site. Unknown site remains null and cannot be assigned a broader meaning merely to make a candidate eligible.

| Identity/context case | Proposed result |
|---|---|
| Current eligible sales actor, same actual context | May receive if different from current owner; receiving needs no transfer grant. |
| Inactive user, expired grants or partially revoked required capability | Excluded; submission rechecks and fails without any effect. |
| Systems, unassigned or read-only fixture | Excluded by missing explicit business grants; profile/name is never a business role. No automatic Systems privilege. A label alone is neither permission nor a hard-coded role model. |
| Other workspace or only other-company grants | Excluded and not exposed as a directory match. A same-workspace person with independently granted coverage for this company is assessed on those actual grants. |
| Site-limited actor, opportunity in the exact permitted site | Eligible only if all context, contact and Activity targets pass; the site-observer fixture's read-only grants are insufficient. |
| Site-limited actor, unknown site or a different site | Excluded; no null-site promotion or company-wide owner picker. |
| Required next/identification Activity has another hidden linked target | Recipient excluded; initiator cannot submit without seeing the required comparison. No hidden title, owner, link ID, count or rejection reason leaks. |
| Other historical Activity is unreadable | It remains independently filtered. No requirement to reveal or transfer it, and no new hidden-history count. |
| Existing Activity owner inactive/revoked, but required Activity remains readable | May hand over the opportunity if other checks pass. The Activity remains with that owner and needs a separate authorised review/reassignment. Never silently restore grants or invent a successor. |

Read and recheck the required Activities for **both** initiator and recipient with `visibleActivity` and every actual target. Do not use the creation owner picker unchanged: it does not by itself prove access to an existing Activity's extra targets. The recipient is not required to own, complete or edit every linked record; grants to read the required Activity targets are distinct from being their owner.

## 3. One proposed command and comparison read

These are BP-03-local interface candidates only, not allocated PP-01 API-C/API-R IDs.

| Interface | Proposed boundary |
|---|---|
| `GET /api/v1/crm/opportunities/{id}/handover-options` | Initiator authority above; derive all context from the scoped Opportunity. Bounded literal `q`, limit 25/default and 100/max, signed workspace/actor/opportunity/version/query/page-size cursor. Return only eligible ID/display-name labels, safe current comparison and observed time. Never return raw grants, ineligible people/counts or a workspace directory. No mutations. |
| `POST /api/v1/crm/opportunities/{id}/transfer-owner` | `TransferOpportunityOwner` with strict schema below. New effect requires H-01, exact expected versions, different eligible recipient and explicit reason. H-02 recommends immediate atomic acceptance, not a pending offer. |
| Existing Opportunity GET/history | Add distinct Original opportunity owner, Current opportunity owner and safe handover evidence/`can_transfer`. Add no unfiltered action/history projection. Current display labels are resolved labels, not immutable identity. |
| Existing operations GET | H-03's actor-bound original receipt path for accepted CRM operations only; all non-CRM cases unchanged. |

Proposed payload fields: `schema_version: 1`, `operation_id` UUID, `expected_version` positive safe integer, `new_owner_id` UUID, `reason` trimmed 1–1000 characters, `expected_next_activity: {id, version}`, and `expected_identification_activity: {id, version} | null`. IDs must equal the server's current designated/historical identification references; the same Activity can fulfil both roles with the same version. They are **read fences**, not instructions to mutate actions. Reuse the existing 64 KiB body limit, unknown-key refusal and accepted common-envelope validation. Route ID enters the canonical normalised command. Server derives actor/workspace/company/time, from-owner, stage, original owner and all evidence IDs. No client-supplied grant, stage, owner history, hash, receipt, money or Activity edits.

The Activity versions matter because completion/reassignment can change the comparison without changing the Opportunity version. A new effect with an outdated next/identification Activity version must conflict and require a fresh review. A receipt replay uses the original accepted payload, ignoring today's changed business versions after current recovery authority passes. This distinction avoids both stale consent and duplicate effects.

Transaction proposal, retaining the existing order: lock original operation; lock workspace; resolve current principal/required grants and record; lock Opportunity, then distinct required Activity rows in deterministic UUID order; validate comparisons and recipient; execute one owner/version update with conventional `updated_by`/`updated_at`; append exact evidence, audit, receipt and minimal outbox; commit together. Authorisation always precedes returning any original receipt. Do not replace the platform transaction framework.

User activity/grant/relationship revocation races need a defined serialisation boundary, not a claim that the workspace lock already covers all administration. Inspect current triggers and take suitable user/required-grant/relationship locks or an equivalent existing shared protocol so a revocation committed first causes refusal and a transfer committed first retains its historic acceptance. Time-expiring grants must be rechecked at the final authority point. There is no promise of authority after a later revocation. Direct database administration remains outside server permission guarantees; SQL integrity is tested separately.

## 4. Exact changes, history and physical invariants

Only `owner_id`, aggregate `version` (+1), conventional update actor/time and append-only handover/provenance/audit/receipt/outbox evidence may change. Keep UUID, OPP reference, company, customer/site/contact and unknown reasons, pipeline definition, title/source, need, qualification note, identification pointer, designated next-action pointer, stage, Open outcome, stage-entered time and original `created_by`/`created_at` exactly. Existing Activity versions/owners/dates/content/status/outcomes/links and all estimate/quote/service/Finance rows/bytes stay unchanged.

| Affected invariant | Proposed physical enforcement / evidence |
|---|---|
| Original owner distinct from author | Add an immutable companion origin record keyed by `(workspace_id, opportunity_id)` with company, `original_owner_id`, source Opportunity version, observed/captured time and provenance kind. On an upgrade, capture from the still-immutable pre-transfer owner under a controlled transaction; preserve Opportunity and old event rows. For new creates, atomically capture the selected owner. Mark upgrade capture time as migration time, not a fabricated original event time. Real composite FKs to Opportunity and users. |
| Owner change is a narrow command | Replace `protect_opportunity` only through an additive migration: owner-change branch requires same stage/qualification/context/next pointers, +1 version, active eligible target and exact handover evidence. Non-owner-change branches retain existing qualification/plan guards. SQL constraints are integrity guards; server services enforce business grants. |
| Every version has exact evidence | Extend existing `OpportunityEvent` type/event checks with `OpportunityOwnerTransferred`. New event carries `from_owner_id`, `to_owner_id`, origin reference, prior/resulting Opportunity versions and references/versions of reviewed next/identification Activities. Add fields without rewriting prior rows. All existing types/constraints and immutable triggers retained. |
| Chain cannot fake an owner | Handover from-owner must match the locked pre-update owner and latest owner-chain entry/origin; to-owner must equal resulting owner and differ. Exact actor, opportunity, version, stage/pipeline, reason and operation must match the aggregate and accepted audit/receipt. Deferred checks cover each intermediate version in a transaction, not just the final row. Missing, duplicate, orphan, fabricated and cross-company/workspace evidence rejected. |
| Qualification evidence | Keep original qualification events and their author/definition/actions byte-for-byte. For pre-migration qualification, origin owner plus the existing owner-only command and event establish who owned it then; do not infer owner from create author. After transfers, derive owner at a qualification version from origin and preceding handovers. Later owner changes must not rerun stage-entry ownership eligibility or alter the historical identification Activity. |
| Durable operation evidence | Retain workspace/actor/operation identity, unchanged canonical SHA-256 input hash and immutable receipt result, accepted server time, reason, event UUID, audit UUID and outbox UUID. Link exact event/audit/receipt in the same transaction; all or nothing. Reuse the existing OpportunityEvent registry. Do not allocate another OPP or Activity reference. |
| Outbox | Minimal `OpportunityOwnerTransferred` record: target/version/type/synthetic markers using the shared pattern. Extend the actual current outbox union; no worker/send/notification or new commercial effect. |
| Ownership labels | Original/current/from/to/initiator UUIDs are retained despite later renaming or inactivity. UI labels are resolved under the permitted record and described as current labels; no copied private user-directory data. |

Origin/table/field names are concrete proposals, not applied schemas. No numbered migration or ADR is reserved here. A future migration must inspect all then-current P10/E1/P11+ unions, FKs and fixtures. Rejected shortcut: simply making owner mutable leaves no owner-chain evidence and breaks original recovery. Rejected shortcut: replacing old event bodies or hashes destroys accepted evidence.

## 5. Recovery and post-handover authority — proposed H-03

| Situation | Proposed observable outcome |
|---|---|
| New qualification/plan/handover by former owner | Refuse owner-only effect, even if edit grants remain. A scoped read can remain available; transfer does not revoke grants. |
| New owner qualifies/plans | Existing owner+capability/context rules apply. For an Enquiry without a contact, qualifying requires that new owner's active identification action. Handing over an already Qualified record does not repeat qualification. |
| Activity completion after handover | Existing Activity owner with current all-target scope/edit may complete it. New Opportunity owner cannot complete someone else's action merely by owning the pursuit. Separate active-Activity reassignment remains available through its existing command. |
| Lost accepted handover response | Freeze original payload in current online memory. GET original operation; return the exact original receipt only after current recovery checks. Same original POST may replay it once; never hand the record back or create another transfer. |
| Original I1 qualify/plan receipt after handover | H-03 would allow exact proven original actor's receipt while their corresponding current capability, record/relationship access and original action checks remain. Current owner equality is waived **only for this accepted original**, not for a fresh command. |
| Another actor supplies that operation ID | Actor-bound lookup finds no original; no disclosure or replay. A fresh intent cannot override owner/version requirements. |
| Changed recipient/reason/version using accepted operation ID | Once currently authorised for recovery, canonical mismatch yields `OperationConflict`; no new effect. Never canonicalise old accepted input differently. |
| Grant/access revoked or actor inactive | Session fails or receipt/record is unavailable; no historical bypass or new receipt-status oracle. Keep database evidence; clear sensitive UI. Later restoration is outside this command. |
| Unknown or unavailable lookup | Missing and denied stay indistinguishable. Do not interpret unavailable as Not accepted or mint a replacement. Retry identical original only after current authority and original-outcome handling permit; unresolved remains unresolved. |
| Application/PostgreSQL restart | Accepted origin/history/receipt survive; recover exact originals under current authority. Unsaved online form memory is not durable and no CRM offline queue/cache is introduced. |

Implement recovery as a narrow CRM authorisation path proving an existing accepted receipt **and** matching actor-owned command event/audit for that opportunity. Require today's capability for the original command (`create`, `edit`, or proposed `transfer.own` plus its prerequisites), current visible Opportunity/relationship context and exact original-event Activity checks. Original create/plan keep original Activity edit requirements; qualification retains its original visibility rules. Historical terminal status, changed designation, today's owner or today's recipient eligibility must not be rerun as conditions for an already accepted effect. Required permissions of the recovering actor are still live. A later receiver's revocation must not in itself erase a still-authorised initiator's receipt.

Perform this proof inside the same lock/authorisation sequence for POST replay and a coherent read transaction for GET. Before exposing a hash conflict or result, current authority must pass. An internal lookup to identify the candidate is not permission to return it. For a key without an accepted original, run **all** new-effect guards. Do not globally move `priorReceipt` before authorisation or relax Activity, offline, report, Finance, estimate, quote, worker or file authorisation.

## 6. Interface/permission map and preserved consumers

| Existing location | Bounded future change | Preserved behaviour |
|---|---|---|
| `src/crm/context.ts`, `reads.ts`, `validation.ts`, `opportunities.ts` | Explicit owner-transfer authoriser, recipient comparison read, strict payload, safe history and one command | Existing create/qualify/plan validation, fixed relationships and two-stage/Open definition |
| `src/crm/receipt-authority.ts`, Opportunity branch of `src/shared/receipts.ts` | H-03 original-proof authorisation for CRM only | Other object dispatch, accepted hash normalisation/results and all-target original checks |
| `src/platform/permissions.ts`; additive SQL capability/event constraints | Candidate own-transfer union and once-only explicitly scoped synthetic fixture under later authority | No role-derived grants, no resurrected revocations or P10/E1 union loss |
| `src/activities/activities.ts`; P09 related Activity projection | Reuse all-target predicate and existing Activity commands | No reassignment, status, link, content-class or recovery-policy change |
| `src/components/crm-screens.tsx`/`crm-state.ts`; canonical detail route | Labelled comparison, reason, deliberate confirmation/conflict and original recovery | Identity clearing, unsaved/saved distinction and existing action/qualification flows |
| `src/crm/worklist.ts`, `src/components/crm-worklist.tsx` | Read changed server owner/version and use existing window refresh | Same permitted Board/Grid records, filters/sort/search; no drag/drop/bulk command or counts of hidden owners |
| E1 estimator/quote reads, workers, files and receipt dispatch | Regression verification only | Estimate owner, saved-version/source hashes, safe projection and exact draft bytes; independent capabilities |
| P09/P10/portal/Projects/P11+ | Reconcile actual delivered interfaces; regression verification | Service/Finance ownership, allocation, output and account scope; portal/Projects remain bounded by their own instructions |

Future errors retain current semantics: malformed/oversize/validation 400/413/422; no current action permission 403 where safe; missing/hidden target 404; version/comparison or operation conflict 409; unavailable service 503. No response contains hidden target IDs, candidate exclusion counts, grant rows or historical private content. Full matrix and design-state messages are linked above. All transfer runtime cases remain **Not run**.

Mechanism references checked 7 September 2026: [PostgreSQL 16 row/advisory locks](https://www.postgresql.org/docs/16/explicit-locking.html) support transaction coordination, and [composite foreign-key constraints](https://www.postgresql.org/docs/16/ddl-constraints.html) support matching typed relationships. Neither establishes PPO business authority; the explicit owner-chain/grant checks and competing tests above remain required. Preserve old event projections and schema-versioned receipt payloads when adding columns: do not inject new nullable fields into an old accepted hash or serialisation.
