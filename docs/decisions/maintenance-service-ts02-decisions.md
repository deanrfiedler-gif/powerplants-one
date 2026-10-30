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
| Q3. Should agreement-covered lines default to NonBillable with the agreement as the reason? | Yes, matching project billing (PR #751, `docs/decisions/project-delivery-billing.md`) rule R3 |
| Q4. How is the annual agreement fee invoiced? | Through a scheduled-charge Finance handoff shared with project milestone claims (rule C below) |
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

### M-R3. Covered lines default to NonBillable

- When a Finance handoff is prepared for a work order whose coverage is Covered by an agreement, or which is linked to a project (project billing (PR #751, `docs/decisions/project-delivery-billing.md`) R3), each source line defaults to NonBillable with the reason "Covered by agreement SYN-AGR-…" or "Included in project contract".
- Finance can change any line, with a reason, before approval. Unknown or Disputed coverage keeps today's forced FinanceReview route.

### M-R4. Follow-on work from a Partial occurrence

- An occurrence received as Partial offers Prepare follow-on Service request. It needs a current Covered assessment for the same original due, names the tasks still outstanding, and creates a request and work order as M-R2 does, linked to the occurrence as its follow-on.
- The occurrence stays Partial while follow-on work is open. When a follow-on result is received with every outstanding task Complete, the occurrence becomes Completed. The original request, report and result are kept unchanged.
- One open follow-on at a time per occurrence.

### C. Scheduled charges for agreements and projects

- A maintenance agreement gains a charge schedule: one or more dated charges in exact cents, with currency and tax basis. The default is one annual charge in advance on the effective date. The schedule is part of the agreement revision that Finance reviewer approves, so it changes only through a successor revision.
- A charge becomes claimable on its date while the agreement is Active. Finance prepares the claim as a Finance handoff of the same scheduled-charge source kind that project billing (PR #751, `docs/decisions/project-delivery-billing.md`) increment B3 introduces for milestone claims. The kind is named `ScheduledCharge`, with the source (agreement or project) recorded on the handoff. One pipeline serves both: allocation against double claiming, ERP outcome as evidence, and reconciliation.
- Renewal does not extend charges; a successor agreement revision carries its own schedule.

## Build increments

| ID | Increment | Depends on |
| --- | --- | --- |
| M1 | M-R1 intervals, M-R2 work-order creation, M-R4 follow-on requests (one migration) | The work-order project link (B1), which is in progress, so their database changes do not collide |
| M2 | M-R3 default dispositions for agreement-covered and project-linked lines | M1; B1 |
| C1 | The `ScheduledCharge` handoff kind for agreement charges, built together with project billing B3 | Project billing B2 |

Changes to migrations or grants need a cross-model review before merge. TS-01 and TS-02 move back to six-monthly service when M1 lands.

## Traceability

SVC-01, SVC-03, FIN-05, FIN-06; BP-01 section 6.3 (journey J-02); D-017 and D-018 stay open for operational Finance and coverage policy. TS-02 findings F2-01, F2-03, F2-05 and F-12; acceptance AT-14, AT-19 and AT-33. All 78 parent requirement IDs are unchanged.
