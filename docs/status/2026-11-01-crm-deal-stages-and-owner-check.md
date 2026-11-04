---
title: Deal stage definitions proposed, and Edit deal uses the stage-change owner rule
date: 2026-11-01
---

On 1 November 2026, under the standing order, Claude proposed the stage definitions and made the owner-check fix, the two points the CRM Deals guide needs settled before a business review.

**Proposed** (not accepted): [What each deal stage means](../decisions/crm-deal-stage-definitions.md) (PPO-CRM-STAGES-DEC) defines Discovery, Scoping, Quoting, Negotiation and Closing by the evidence needed to enter and leave each stage. The definitions are team practice; the application does not check them. Dean accepts or amends them.

**Implemented** (code on this branch; not reviewed, accepted or deployed): Edit deal now checks a contact-less deal's contact-identification activity against the same owner as a stage change does.
- **Rule:** that owner is the owner the deal had when it was created, or the current owner for a deal still in Enquiry or Qualified. Clearing a contact the deal already has is a contact change, so Edit deal checks the current owner then, as the database guard from migration 0024 does (Codex review of #822, finding 1).
- **The fault:** the activity keeps its owner when a deal is transferred, and stage changes were already designed for that (test HV-10/22). Edit deal checked the current owner instead, so after **Transfer deal owner** the receiver could move a contact-less deal but could not save its details.
- **The change:** both paths now use one helper, `identificationOwner` in `src/crm/refinements.ts`.
- **Test:** a new database test in `tests/helpers/crm-owner-transfer-cases.ts` failed with `CRM_IDENTIFICATION_REQUIRED` before the change and passes after it. It also proves that a completed identification activity still blocks the edit. A second test clears an existing contact after a transfer: it is refused with `CRM_IDENTIFICATION_REQUIRED` while the activity is the original owner's, and saved once the activity is reassigned to the receiver. Without the contact-change rule the refusal reached the database guard instead.

**Guide:** the [CRM Deals guide](../guides/crm-deals.md) uses the proposed definitions in its stage table, marked as proposed and awaiting acceptance, and describes one contact-owner rule for both paths. Its row for the original I1 pipeline no longer describes that pipeline's rules. It stays InReview and hidden.

**Not done:** the definitions are not accepted, no guide was reviewed or published, and no walkthrough of the running application was made.
