---
document_id: PPO-PROJECT-DELIVERY-BILLING-DEC
date: 2026-10-30
owner: Dean Fiedler
status: Dean answered Q1–Q4 on 30 October 2026; build increments B1–B4 proposed for agent delivery under the standing order; no application change in this record
source_commit: fa15714324b1dcb939355666023272e0a4ffb0f3
versioning: git
---

# Project field work and milestone billing

## Decision

A project's field work is linked to the project by a typed reference, and a project is invoiced through milestone claims that Finance approves and MYOB processes. Field hours and parts on a fixed-price project are cost evidence, not separate charges. Retentions are left for later.

End-to-end scenario TS-01 (berry farm fertigation) found the gap on 30 October 2026, as finding F-02. A project cannot hold appointments, job packs, reports or Finance handoffs. A work order names its project only in a free-text `project_reference` (migration 0004). Finance handoffs are per work order, so a project's contract value has no path to Finance. BP-06 section 8 already expected this: "Existing P05 ProjectReference is contextual text, not a typed Project. Add a validated junction later."

Dean asked for the gap to be closed so that more scenarios can be tested. Claude asked four questions with recommendations, and Dean chose the recommended answer to each:

| Question | Dean's answer, 30 October 2026 |
| --- | --- |
| Q1. How should project field work be linked to its project? | "Typed link (Recommended)": each work order belongs to at most one project; project field work is raised from the project and listed on it; Service still owns bookings |
| Q2. How does Powerplants usually invoice a project like the berry farm fertigation job? | "Milestone claims (Recommended)": fixed stages set at contract; PPO prepares each claim; Finance approves; MYOB issues the invoice |
| Q3. On a fixed-price project, how should technicians' field hours and parts be treated for billing? | "Cost only (Recommended)": hours and parts on project work orders are cost and evidence, not billed separately; only approved variations add charges |
| Q4. Do Powerplants' project contracts use retentions? | "Not needed now (Recommended)": leave retentions out of the first increment; record them as a later extension |

These answers decide direction. The detailed rules below are Claude's proposals for building them, adopted under Dean's standing order of 30 October 2026 as agent decisions, not as Dean's acceptance. Dean can reverse any of them.

## Rules

### R1. A work order may belong to one project

- A work order gains an optional typed `project_id`. When set, the project must be in the same company, for the same customer, and Active. A work order belongs to at most one project. A project may have many work orders.
- Project field work is raised from the project: Raise field work creates the service request and work order with the link already set. An existing work order can be linked or unlinked, with a reason, while it has no started visit.
- The free-text `project_reference` stays as it is for existing records and is no longer written by new links. Nothing is guessed from it: an old work order whose text names a project stays unlinked until someone links it.
- Linking needs `project.edit` on the project and `service.work_order.edit` on the work order. Each record keeps its own read permission, so the project page lists a linked work order only to people who may read it, and never shows a count of hidden ones.
- Service still owns the confirmed field schedule (BP-01 section 5.3). The link gives Projects no authority to confirm, move or cancel an appointment; projects keep asking through a schedule change request.

### R2. A project is invoiced by milestone claims

- **Claim schedule.** The approved commercial basis (PJ-05) gains a claim schedule: an ordered list of milestones, each with a name, the evidence that triggers it, and an amount in exact cents. The schedule's amounts must add up to the basis's `original_control_value` exactly; a percentage may be shown, but cents are stored. The schedule comes from the reviewed contract, is reviewed independently like the basis, and changes only through a new basis revision.
- **Variations.** Each approved variation becomes claimable as its own claim line, at its frozen approved amount, once its work is evidenced as done. It is never folded into a milestone silently.
- **Evidence.** The project manager records a milestone as reached, linking the evidence: an acceptance stage, commissioning results, a delivery record or the customer acceptance. Reaching a milestone creates nothing financial by itself.
- **Claim handoff.** Finance prepares the claim. It is a Finance handoff of a new source kind, `ProjectClaim`, for one project, listing the reached milestones and evidenced variations it claims. It reuses the existing handoff states, review, processing claim, ERP outcome and reconciliation, so there is one Finance pipeline, not two. Finance owns invoice release (BP-01 section 5.2; FIN-05).
- **No double claiming.** Each milestone and each claimable variation line is one claimable entitlement in exact cents. It is conserved the way a work-order source quantity is under the [Finance handoff](../contracts/finance-handoff.md) section 3 and its P10 amendment, and the existing lifecycle applies unchanged:
  - Submitting a claim reserves each entitlement it names in `finance_allocation_holds`, under the same workspace lock. A competing claim cannot reserve an entitlement that is Held or Consumed.
  - ReadyForReview, Approved and AwaitingERP keep the entitlement Held.
  - Returned keeps it Held by the returned claim. Only creating a revised Draft of that claim, or an explicit release with a reason, transfers or frees it, atomically under the lock.
  - Cancelled before any possible external effect releases it.
  - OutcomeUnknown and ReconciliationRequired keep it Held, because an external effect may have happened.
  - Processed and reconciled entitlements become Consumed. A successor claim on a consumed entitlement needs a linked correction or reversal under an evidenced policy, which this record does not define; until one exists, a consumed entitlement cannot be claimed again.
  - A claim takes a whole milestone or variation line. Partial claims of one entitlement are not part of the first increment.
- **ERP.** The processor records the MYOB outcome as evidence (document type, document number, observed time), simulated in the prototype. No invoice number is invented, and no MYOB endpoint is assumed.
- **Measures.** The project shows claimed amounts by claim state, beside `adjusted_control_value`. `billed_value`, `cash_received` and `open_receivable` stay unavailable until Finance definitions under D-017 exist; a processed claim is reported as "processed per recorded ERP outcome", not as revenue or cash.

### R3. Field hours and parts on a fixed-price project are cost evidence

- Every line of a Finance handoff for a work order linked to a project is `NonBillable` with the reason "Included in project contract". This is a rule, not a default: submit, approval and begin processing each recheck the work order's current project link and refuse any `Billable` line, including on a revised Draft of a returned handoff. Changing a line's reason or disposition cannot make included work billable.
- There is no override in the first increment. Work outside the contract is charged only through an approved variation and its claim line (R2), never by billing hours or parts. A later exception would need its own decision, naming the exact contract or variation entitlement and a cross-pipeline allocation that stops the same work being charged twice.
- Work for an approved variation is charged through the variation's claim line, never by billing its hours; its hours and parts are cost evidence like the rest.
- R1 already stops a work order being linked or unlinked once a visit has started, so a handoff cannot predate its work order's link. The checks above apply at each boundary anyway, so an existing Draft cannot slip through.
- The first increment supports fixed-price milestone bases only, so R3 applies to every project-linked work order. A schedule-of-rates or cost-plus project needs its own decision.
- A maintenance agreement sold with the project is billed under the agreement, not through a project claim.

### R4. Retentions later

The first increment has no retention fields. A later increment can add an optional retention percentage, the amount held per claim, and its release at the end of the defects period. Progress claims (a monthly value of work done) are also left for later.

## Worked example: TS-01

Synthetic figures, not Powerplants policy. Rev B base scope: $129,910.00 excluding GST.

| Milestone | Evidence that triggers it | Share | Amount ex GST |
| --- | --- | --- | --- |
| M1 Acceptance | Customer acceptance of rev B recorded | 30% | $38,973.00 |
| M2 Equipment delivered | Supply shows every released line received | 40% | $51,964.00 |
| M3 Commissioning | Commissioning results recorded, all tests passed or accepted with conditions | 20% | $25,982.00 |
| M4 Practical completion | Acceptance stage closed | 10% | $12,991.00 |
| Total | | 100% | $129,910.00 |

Variation V-01 (booster pump, $5,180.00) is claimed as its own line once the APT-2 work is evidenced. The $4,800.00 maintenance agreement is billed under the agreement. The 116 hours of field labour on the work order go to Finance as NonBillable cost evidence.

## Worked example: competing claims

Synthetic, using the TS-01 milestones above.

1. Claim A names M1 and M2 and is submitted. M1 and M2 are Held by A.
2. Finance returns A because M2's delivery evidence is incomplete. M1 and M2 stay Held by A.
3. Claim B names M2 and is submitted. It is refused: M2 is Held by A.
4. Finance creates revised Draft A2, claiming M1 only. In one locked step, M1's hold transfers to A2 and M2 is released.
5. Claim B is submitted again and now reserves M2. Revising A2 to add M2 back is refused while B holds it.
6. A2 is processed and reconciled, so M1 becomes Consumed. Claim C naming M1 is refused, and stays refused until a linked correction or reversal policy exists.
7. B is dispatched and its MYOB outcome is Unknown. M2 stays Held by B: B cannot be cancelled or returned, and no other claim can take M2, until the outcome is verified.

## Worked example: an attempted billability override

The TS-01 work order is linked to the project, and its Finance handoff carries 116 hours of labour as `NonBillable`, "Included in project contract".

1. A Finance user changes the labour line to `Billable` with the reason "Extra site time requested by customer". Submitting is refused: the work order is linked to a project.
2. The user changes only the reason text, leaving the line `NonBillable`. That is accepted, and it bills nothing.
3. If the extra time really is outside the contract, the project manager raises variation V-02. Once it is approved and its work evidenced, it is charged through its own claim line, and the hours stay `NonBillable` cost evidence.

## Build increments

Each increment is its own pull request. Increments that change a migration or a grant need a cross-model review before merging.

| ID | Increment | Depends on |
| --- | --- | --- |
| B1 | Typed `project_id` on work orders, with the Raise field work, link and unlink commands, the project's work list, and the R1 permission rules (migration) | — |
| B2 | Claim schedule on the commercial basis, milestone evidence, and claimable variation lines (migration) | PJ-05 page, so people can use it |
| B3 | `ProjectClaim` Finance handoff source kind, entitlement holds under the existing allocation lifecycle (R2), ERP evidence and the project's claim measures (migration) | B2 |
| B4 | R3 rule for project-linked work orders, enforced at submit, approval and begin processing; TS-01 updated to raise field work from the project and to claim M1–M4 and V-01 | B1, B3 |

## Still open

- Real milestone schedules come from each reviewed contract; this record sets none.
- Tax invoice content, payment terms and MYOB document types need Finance's definitions under D-017.
- Retentions, progress claims, deposits held as security and project cost reporting are not decided.
- Correction or reversal of a processed claim, and so any successor claim on a consumed entitlement, needs its own policy.
- Projects priced other than as fixed-price milestones are not decided.
- PJ-07 delivery readiness (PR #712) refers to scheduling's `ProjectReference` request source. Once B1 lands, it should use the typed link.

## Traceability

PRJ-01, PRJ-05, FIN-05, FIN-06, SVC-03; BP-01 sections 5.2, 5.3 and 12.2; BP-06 section 8; D-017; [project commercial controls](project-commercial-controls.md); [Finance definitions PJ05-FD08](../contracts/project-commercial-finance-definitions.md); [Finance handoff](../contracts/finance-handoff.md); acceptance AT-18, AT-31 and AT-38. All 78 parent requirement IDs are unchanged.
