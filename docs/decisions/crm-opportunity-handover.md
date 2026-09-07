# BP-03 — Controlled opportunity handover decisions

**Revision:** r01 · **Date:** 7 September 2026 · **Owner:** Dean Fiedler · **State:** Proposed policy; design publication authorised, policy acceptance outstanding. **Work:** [#55](https://github.com/deanrfiedler-gif/powerplants-one/issues/55), under [#9](https://github.com/deanrfiedler-gif/powerplants-one/issues/9).

[Contract and physical map](../contracts/crm-opportunity-handover.md) · [Screen journey](../blueprints/crm-handover-journey.md) · [Future verification](../testing/crm-handover-verification.md) · [Publication handover](../delivery/crm-handover-design-handover.md).

## Recommendation for Dean

Allow the current opportunity owner, with an explicit scoped handover permission, to hand one opportunity immediately to another already eligible sales actor. Keep every existing Activity with its current owner. Show the opportunity owner and next-action owner separately before confirmation. Retain original qualification and ownership evidence, and let the original actor recover an already accepted operation only while their required current permissions remain.

This is a proposed private synthetic policy. Merging these documents does not accept it or permit implementation. No previous explicit transfer-authority decision was found in the accepted repository or retrieved prior decisions. The broad BP-03 manager rows are proposals, not implemented grants. These local H decisions do not create parent requirements or close D-013/D-020/D-025.

| Decision | Recommended proposal | Alternative and consequence | State / decision needed |
|---|---|---|---|
| H-01 Initiator | Current owner plus new `crm.opportunity.transfer.own`, all current edit/relationship/Activity eligibility and exact scope. Receiving the record does not grant onward-transfer permission. | Any scoped editor could transfer colleagues' records without their involvement. A manager-only route needs a separately defined manage scope/delegation and unavailable-owner process. Both enlarge authority. | **Open — Dean to accept or amend.** No manager override, taking ownership or inactive-owner rescue in this command. |
| H-02 Effective handover | Immediate when the current owner confirms the comparison and the server accepts. Record Submitted/Saving versus Handed over accurately; no recipient acceptance fact. | Recipient acceptance would need a pending offer, expiry/withdrawal, competing offers and a separate acceptance command. The old owner would remain accountable pending acceptance. | **Open — Dean to accept or amend.** Recommend immediate handover for the first bounded command. |
| H-03 Original-operation recovery | Original actor can recover their exact accepted CRM create/qualify/plan/handover receipt after ownership changes, with current command capability, current record/context scope and all original Activity-target checks. New effects still require today's owner. Revoked required grants mean no recovery disclosure. | Keep today's-owner check for all prior qualify/plan receipts: simpler, but an accepted response lost just before transfer becomes unrecoverable even for a still-permitted original actor. Broader historical access after grant revocation is excluded. | **Open — Dean to accept or amend** the narrow owner-check exception for proven accepted originals. |
| H-04 Activity and downstream ownership | No Activity, estimate, quotation, service, project or Finance ownership transfer. A future action reassignment remains an explicit existing Activity command with its own version/reason/eligibility. | Bundling reassignment would expand the authorised command and introduce multi-aggregate policy and effects. | **Fixed by this invocation and accepted source boundaries; no repeat approval requested.** |
| H-05 Qualification/history | Keep the immutable Enquiry → Qualified definition, Open outcome, original qualification and stage-entry time. An identification action is evidence of the qualification decision at that time, not a requirement to reassign that historical action to each later owner. | Requalifying or moving the action during transfer rewrites meaning and exceeds scope. | **Fixed preservation requirement.** Physical enforcement and historical projection still require future verification. |

The implementation starter is conditional on recorded H-01–H-03 answers. Accepting one does not silently accept the others. An explicit acceptance of the recommended package can resolve all three together; implementation still needs its own invocation.

## Technical proposal and interpretation

Reuse the existing domain services, canonical hash, operation/workspace locks, receipts and immutable event registry. Add a dedicated owner-only branch of the Opportunity invariant rather than a general update. Keep original owner in a separate immutable provenance anchor; do not mistake `created_by` for owner, because I1 creation permits an eligible owner other than its author. Extend new handover events with from/to owner evidence while preserving all old event bytes and hashes.

The recipient must pass actual `eligibleOpportunityOwner` rules and read the designated next and qualification-identification Activities under all-target visibility. The initiator must be able to review those same consequences. Historical unrelated Activities stay filtered independently; ownership must not broaden their audience. Terminal actions are retained and shown as Next action needed; transfer creates no replacement task.

Separate receipt recovery from authority to perform a new effect. Do not put generic receipt access ahead of authorisation in `sharedOperation`, or relax Activity/P09/P10/E1 receipt dispatch. The contract specifies a CRM-only proof of an accepted original and its current authority. All proposed endpoint/capability/type names are local candidates, not live interfaces or reserved migration/ADR numbers.

No changes to operational Pipedrive use, permissions, source access, sales hierarchy, corporate role assignments or migration policy follow. Account-specific parity Q5 and full AT-25 remain open/Planned; #9 stays open.
