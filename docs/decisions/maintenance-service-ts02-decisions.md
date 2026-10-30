---
document_id: PPO-MAINTENANCE-TS02-DEC
date: 2026-10-30
owner: Dean Fiedler
status: Dean adopted the recommended answers to TS-02 Q1–Q5 on 30 October 2026; build increments M1, M2 and C1 proposed for agent delivery under the standing order; no application change in this record
source_commit: fa15714324b1dcb939355666023272e0a4ffb0f3
versioning: git
---

# Planned maintenance improvements from TS-02

## Decision

End-to-end scenario TS-02 (PR #753, `docs/testing/TS-02-berry-farm-planned-maintenance.md`) (planned maintenance) found five gaps in how PPO turns a maintenance agreement into service work and charges. Claude recommended an answer to each. On 30 October 2026 Dean wrote: "Proceed based on your recommendations."

| Question (TS-02 section 11) | Adopted answer |
| --- | --- |
| Q1. Plans accept only Monthly or Quarterly intervals (finding F-12). Add six-monthly and yearly? | Yes |
| Q2. Should turning a due occurrence into work also create the work order, with the plan's tasks copied in? | Yes; it removes the exact-text trap (F2-01) |
| Q3. Should agreement-covered lines default to NonBillable with the agreement as the reason? | Yes. Project-linked lines keep project billing (PR #751, `docs/decisions/project-delivery-billing.md`) rule R3, which allows no override (rule M-R3 below) |
| Q4. How is the annual agreement fee invoiced? | Through a scheduled-charge Finance handoff sharing one pipeline with project milestone claims (rule C below: an `AgreementCharge` kind beside `ProjectClaim`) |
| Q5. When an occurrence is received as Partial, how is the remaining work raised? | Allow a follow-on request from a Partial occurrence, keeping the original |

The detailed rules below are Claude's proposals adopted under Dean's standing order, as agent decisions rather than Dean's acceptance of each rule. Dean can reverse any of them.

## Rules

### M-R1. Six-monthly and yearly intervals

- A maintenance plan's sourced interval is one of Monthly, Quarterly, SixMonthly or Yearly, giving 1, 3, 6 or 12 months between due dates from the plan's anchor, month-end safe as today.
- The generation window stays at most 12 months, so a Yearly plan generates at most one or two occurrences per run.
- Existing plans keep their interval and revision bytes. Changing interval needs a successor plan revision and review, as today.

### M-R2. Preparing work creates the work order with the plan's tasks

- Prepare owned Service request also creates a Draft work order for the request. It has one scope item per plan task, with the task's exact description and kind, the occurrence's asset bound to each item, and the coverage block filled from the Covered assessment: status Covered, the agreement reference, its source revision and the assessment.
- Everything is created in one operation with one receipt, so a retry cannot create a second request or work order. The work order still needs a person to complete the remaining authorisation fields (authority evidence, shutdown conditions) and to authorise it.
- If a person edits a task description on the work order, receiving the result still refuses the unmatched task, as today. The page warns before saving such an edit.

### M-R3. Agreement-covered lines default to NonBillable; project-linked lines follow project R3

- **Project-linked work orders.** Project billing (PR #751, `docs/decisions/project-delivery-billing.md`) rule R3 governs them, unchanged: every line is `NonBillable` with the reason "Included in project contract", rechecked at submit, approval and begin processing, with no override. This record adds nothing to that rule and relaxes none of it. When a work order is both linked to a project and covered by an agreement, R3 applies and the agreement default below does not.
- **Agreement-covered work orders not linked to a project.** When a Finance handoff is prepared for a work order whose coverage is Covered by an agreement, each source line defaults to `NonBillable` with the reason "Covered by agreement SYN-AGR-…". This is a default, not a rule: Finance can change a line to `Billable`, with a reason, before approval, for example for parts the agreement excludes.
- Unknown or Disputed coverage keeps today's forced FinanceReview route.
- Submit, approval and begin processing decide which case applies from the work order's current project link, so a Draft prepared before a link was added cannot use the agreement override.

### Worked example: a covered work order on a project

Synthetic. Work order WO-A is covered by agreement SYN-AGR-0001 and is not linked to a project. WO-P is covered by the same agreement and is also linked to the TS-01 project.

1. WO-A's handoff is prepared with every line `NonBillable`, "Covered by agreement SYN-AGR-0001". Finance changes the filter-cartridge line to `Billable`, "Consumable excluded from agreement schedule 2". That is accepted.
2. WO-P's handoff is prepared with every line `NonBillable`, "Included in project contract". Finance makes the same change to its filter-cartridge line. Submitting is refused: the work order is linked to a project, so R3 applies.
3. Finance changes only the reason text on a WO-P line and leaves it `NonBillable`. That is accepted, and it bills nothing.
4. If the cartridge really is outside the project contract, it is charged only through an approved project variation and its claim line, never through WO-P's handoff.

### M-R4. Follow-on work from a Partial occurrence

- An occurrence received as Partial offers Prepare follow-on Service request. It needs a current Covered assessment for the same original due, names the tasks still outstanding, and creates a request and work order as M-R2 does, linked to the occurrence as its follow-on.
- The occurrence stays Partial while follow-on work is open. When a follow-on result is received with every outstanding task Complete, the occurrence becomes Completed. The original request, report and result are kept unchanged.
- One open follow-on at a time per occurrence.

### C. Agreement charges share the Finance pipeline with project claims

- A maintenance agreement gains a charge schedule: one or more dated charges in exact cents, with currency and tax basis. The default is one annual charge in advance on the effective date. The schedule is part of the agreement revision that Finance reviewer approves, so it changes only through a successor revision.
- A charge becomes claimable on its date while the agreement is Active. Finance prepares the claim as a Finance handoff of a new source kind, `AgreementCharge`, for one agreement. Project billing keeps its own source kind, `ProjectClaim`, exactly as #751 R2 and B3 define it; this record does not rename or amend it.
- **One pipeline, two typed kinds.** `AgreementCharge` reuses the same machinery as `ProjectClaim`: the existing handoff states, review, processing claim, ERP outcome as evidence, reconciliation, and the entitlement holds and lifecycle of #751 R2 (Held from submission, including while Returned, OutcomeUnknown or ReconciliationRequired; Consumed once processed and reconciled; released only by a pre-effect cancellation, a revised Draft or an explicit release with a reason, atomically under the workspace lock). It adds no second allocation scheme.
- **Disjoint entitlements.** Each scheduled agreement charge is one claimable entitlement, identified by its agreement, agreement revision and charge line. A `ProjectClaim` can name only milestones and variation lines of its project's basis, and an `AgreementCharge` can name only charge lines of its agreement's schedule. Neither kind can reserve the other's entitlements, so one charge has exactly one entitlement identity and one hold, whichever kind claims it.
- **Agreements sold with a project.** As #751 R3 says, such an agreement is billed under the agreement. Its fee is a charge on the agreement's schedule, and the project's claim schedule must not also contain it: the basis's `original_control_value` excludes the agreement fee, as in the TS-01 example ($129,910.00 base scope; the $4,800.00 agreement billed separately).
- A claim takes a whole charge line. Renewal does not extend charges; a successor agreement revision carries its own schedule.

## Build increments

| ID | Increment | Depends on |
| --- | --- | --- |
| M1 | M-R1 intervals, M-R2 work-order creation, M-R4 follow-on requests (one migration) | The work-order project link (B1), which is in progress, so their database changes do not collide |
| M2 | M-R3 agreement-covered default dispositions, with the project-link check at submit, approval and begin processing deferring to R3 | M1; project billing B4 (the R3 enforcement), so the agreement override never reaches a project-linked line |
| C1 | Agreement charge schedule and the `AgreementCharge` Finance handoff source kind, reusing the entitlement holds and processing that project billing B3 builds for `ProjectClaim` | Project billing B3 |

Changes to migrations or grants need a cross-model review before merge. TS-01 and TS-02 move back to six-monthly service when M1 lands.

## Traceability

SVC-01, SVC-03, FIN-05, FIN-06; BP-01 section 6.3 (journey J-02); D-017 and D-018 stay open for operational Finance and coverage policy. TS-02 findings F2-01, F2-03, F2-05 and F-12; acceptance AT-14, AT-19 and AT-33. All 78 parent requirement IDs are unchanged.
