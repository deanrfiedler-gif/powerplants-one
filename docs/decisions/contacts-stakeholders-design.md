---
document_id: PPO-CS02-DES
title: Contacts, Stakeholders and Relationships design and receiving handover
revision: r01
date: 2026-09-18
owner: Dean Fiedler
status: Standalone CS-02 / CS-03 design delivered against the build plan; owner acceptance, the open role-vocabulary question, the theme-edition departure and application integration remain separate
source_commit: 01b9824a63e468b393265b159fa681f83f6e668c
---

# CS-02 / CS-03 — Contacts, Stakeholders & Relationships design decision

## Context

People are the only shared record several issued designs depend on and none of them owns. [ADR-0014](ADR-0014-p09-service-reports.md) blocks service report approval without a currently permitted active site primary contact; `src/finance/context.ts` selects that contact with `AND u.active`; `src/scheduling/planner.ts` refuses its contact command when the person is inactive; database triggers refuse a deal or a project task whose contact holds no current affiliation. Meanwhile `src/shared/commands.ts` exports `createPerson` and `addAffiliation` for this record type **and nothing else**.

This package designs the contact record, the stakeholder map and the downstream reliance view against that contract, and renders the gap honestly rather than drawing controls over commands that do not exist.

Delivered: [design HTML](../reference/ui/customers/PPO-Contacts-Stakeholders-and-Relationships-r01.html) · [report](../reference/ui/customers/PPO-Contacts-Stakeholders-and-Relationships-Report-r01.md) · [change record](../reference/ui/customers/PPO-Contacts-Stakeholders-and-Relationships-r01-change-record.md) · [sources](../design/contacts/README.md) · [evidence](../testing/evidence/contacts-r01/README.md) · [build plan](../delivery/contacts-stakeholders-build-plan.md).

## Decision

Deliver CS-02 and CS-03 as one standalone design package under the `PPO-CS02-` register stem, built from maintained sources by a deterministic Python builder, with:

1. **Restricted never rendered as empty.** A four-value presence vocabulary — present, restricted, none, unknown — on every list, count and panel, following the existing `owner_unavailable` precedent in `src/projects/service.ts`.
2. **No control implying a command that does not exist.** Corrections, deactivation, affiliation-end and duplicate resolution are **proposals with reasons and an independent reviewer**, and every apply carries a visible **Simulated** label.
3. **Authority basis in three values** — Recorded, Asserted by us, Unknown — and never a claim that a person can commit the customer.
4. **Affiliation concurrency shown as belonging to the organisation**, because `addAffiliation` takes the organisation's `expected_version` and bumps the organisation.
5. **The directory built on the CRM directory contract**, with `organisations` and `preference` rendered without a sort affordance because `parseDirectory` refuses them.
6. **No new person reference type.** `register_identity('Person','')` allocates none and `reference_counters.record_type` admits only ORG, SITE, AST and TKT.
7. **Interaction history derived, labelled, with the derivation stated**, because `activity_links.object_type` has no `'Person'` value.

## Status of the build plan's decisions

| # | Plan decision | Outcome |
|---|---|---|
| 1 | Theme edition | **Departed. Needs Dean.** See below |
| 2 | One package covering CS-02 and CS-03, stem `PPO-CS02-` | Followed |
| 3 | Simulate corrections; record a receiving contract | Followed |
| 4 | Three-value authority basis | Followed |
| 5 | Use the CRM directory's real sorts | Followed |
| 6 | Interaction history derived only | Followed |
| 7 | No new person reference type | Followed |
| 8 | Branch after #239, or from `01b9824a` if it stalls | **Fallback taken.** #239 had not merged; the branch is based on `01b9824a` |
| 9 | Deterministic Python builder | Followed |

### The theme-edition departure

Plan decision 1 recorded r22 as measured, strictly additive over r20, and introduced by PR #239, and instructed this module to adopt r22's selection family and menu patterns. **#239 has not merged**, and at the base commit:

- the theme board directory contains boards up to **r20**; there is no r22 file;
- the merged AD-03 package pins `powerplants-one-theme-style-board-r22.html` at SHA-256 `a305361c…` but that file is absent, so AD-03's own build check skips the assertion;
- AD-03's stylesheet carries **no `--nca-*` or `--ss22-*` tokens** — the 24 component-local aliases decision 1 describes are not observable here.

This design therefore builds on the **shared token core**, which is present and identical in both editions, and adopts the r22 **selection and menu vocabulary as it appears in the merged AD-03 source** — the selected-row surface with a green inset marker, the tab underline, the choice-card treatment — expressed as a local `--sel-*` family aliasing existing brand tokens and introducing no new colour. Nothing is claimed about the r22 board, which was not seen.

**Dean's decision.** If r22 adoption matters in name, rebase this package after #239 merges and revise the reused-components declaration. If the shared core is what matters, nothing changes. Either way the estimate is unaffected.

## Status of the build plan's open questions

| # | Question | Resolution |
|---|---|---|
| 1 | Theme edition | **Re-opened.** See above |
| 2 | Communication preference | Closed by contract. `contact_preference` is rendered as the free text it is, with no consent semantics; the data dictionary states *"No automatic marketing consent inferred"* and the API contract *"no inferred consent"*. A structured preference stays Proposed |
| 3 | Role vocabulary | **Open — needs Dean.** No vocabulary exists anywhere in the repository; the seed carries only `SYN site contact` and `SYN supplier liaison`. `role_label` stays free text, fixture roles are plausible and explicitly fictional, and a responsibility taxonomy stays Proposed |
| 4 | "No contact available" reason | Closed by precedent. `opportunities.contact_unknown_reason` and `tickets.requester_description` are both free text; r01 matches them |
| 5 | Site primary contact count | Closed by contract. One optional `primary_contact_id` per site; ADR-0014 depends on exactly one being selected before approval |
| 6 | Duplicates and merge | Closed by contract. A superseded-by pointer with evidence, never a merge, never a delete |

## Proposed extensions — labelled, costed, not adopted

Each is rendered in the page with a visible **Proposed** marker, and states both what it would cost and what exists today.

| Proposal | What adopting it would cost |
|---|---|
| **ContactDesignation** (Primary / Secondary / None, per organisation and per site) | A designation column on `ppo.relationships` or a separate table, plus a command to set it. `sites.primary_contact_id` already carries one designation per site, and no command updates it |
| **ResponsibilityClass** over `role_label` | A controlled vocabulary, a migration to hold it, and a decision about the free text already recorded against every existing relationship |
| **CommunicationPreference** (structured, with an explicit *not stated*) | A structured column replacing `people.contact_preference`, and an explicit decision about what a preference does and does not mean |
| **RelationshipHealth** | A derivation rule the owner has to agree, and somewhere to record it. An indicator that looks measured but is guessed is worse than none |
| **`'Person'` in `activity_links.object_type`** | A migration extending the CHECK constraint, and a decision about existing rows. Until then, interaction history can only be derived |
| **A reason vocabulary for "no contact available"** | A vocabulary, a migration, and a migration path for the free text already held |
| **Contact maintenance commands** | See the receiving contract below |

## Receiving contract for a future runtime increment (recorded, not built)

If a runtime increment is later authorised, it needs at minimum:

- **Commands:** `revisePersonIdentity` (with `expected_version` and before/after audit details, mirroring `renameOrganisation`), `setPersonActive`, `endAffiliation` (writing `relationships.valid_to`, respecting the GiST exclusion constraint), `setSitePrimaryContact`, `setContactDesignation`.
- **`business_identities.object_type` and `audit_events.object_type`** to accept a contact-change proposal type, if proposals become durable.
- **A decision** on whether `relationships` gains a designation column or a separate designation table.
- **`activity_links.object_type` extended with `'Person'`**, if interaction history becomes linked rather than derived.
- **A capability decision:** whether contact maintenance sits under existing `shared.edit` or gains its own capability. A new capability means touching `ck_grants_capability` and interacts with D-020 and AD-01.
- **A `can_edit` flag on the Person projection**, which it currently lacks — unlike Organisation, Site and Asset.
- **A decision on whether a merge command may ever exist**, given `immutable_evidence` refuses deletion of `people` and `relationships` rows.

None of this is proposed for adoption here. It is recorded so the design is not mistaken for a delivery plan.

## Consequences

**Accepted.** A coordinator can see who a contact is, why they are visible, what depends on them and what breaks if they go; the four honesty problems in this record type are rendered rather than hidden; and eight downstream designs gain one place to point at instead of eight synthetic populations.

**Not accepted by this decision.** No application, API, migration, seed, permission or deployment change. No real customer communication. No marketing consent or subscription policy. No contact-level ERP identity — `erp_account_mappings.entity_type` is constrained to `'Customer'` and binds an organisation. No portal account. No assertion that any contact holds purchasing authority. No bulk import, address-book sync, vCard or copied Pipedrive contacts.

**Cost of not deciding.** The four contract problems stay unrendered, and every consuming design keeps inventing its own contacts. Retrofitting a contact model behind eight consumers is materially harder later than defining it now.

## Verification

98 model groups and 57 native browser groups passed, with zero page, console or request errors, zero horizontal overflow at the four declared viewports, no phone target under 44 px, and keyboard-only completion of a proposal and a duplicate resolution. Five defects were found by the checks and fixed before issue; they are listed in report §10.1. Full detail in the [evidence record](../testing/evidence/contacts-r01/README.md).

**Not verified:** native visual review by Dean in a browser; CI execution of `contacts-design.yml`, because this branch has not been pushed; owner acceptance; application integration; production readiness.
