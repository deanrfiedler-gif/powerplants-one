# CRM pipeline stage model

**11 September 2026, amended 12 September 2026 · PPO-009 / BP-03 · Accepted
direction for I3 · Implementation separately bounded**

**Amendment, 12 September 2026.** Dean confirmed Discovery as the first stage
name, and accepted drag-and-drop as the board's stage interaction. The first
confirms the model as written and changes nothing in the runtime, which retains
its bounded Enquiry → Qualified journey. The second replaces the closing
paragraph of "Not included" with an assessment against the five stage-movement
requirements. Bulk stage changes remain not proposed.

Dean accepted a five-stage sales pipeline on 11 September 2026, together with
its exit conditions, permitted transitions and the retirement of Enquiry. This
document records the model, the naming and sub-status questions raised against
it, the schema consequences found in the current migration, and the two
dependencies that remain open.

The [r11 board correction](crm-r11-board-polish.md) records that the database
supplies Enquiry and Qualified, and that a six-stage sequence remains a
follow-on pipeline contract and migration task. This document settles the model
for that task. It does not perform it. The
[shared UI specification](../standards/ui-style-specification.md) r05 separately
records the six displayed stages in the mockup as a requested future layout
reference that does not change I1 or accept operational pipeline mapping.

## Accepted stages

Qualification happens in the Leads module. A lead that qualifies becomes an
opportunity and enters the board at the first stage. Everything on the board is
therefore already qualified.

| Stage | Purpose | Ends when |
|---|---|---|
| Discovery | Meet the customer, uncover the requirement, establish high-level goals and confirm budget, authority and timing. | An initial discovery meeting is completed and both parties agree the project is worth exploring. |
| Scoping | Establish the solution, technical requirements, responsibilities and scope boundaries. | The customer accepts the technical feasibility and the concept of the proposed solution. |
| Quoting | Obtain costs, prepare the estimate, review pricing, issue the quotation and follow up. | The quotation is formally issued to and acknowledged by the customer's decision-makers. |
| Negotiation | Resolve substantive changes to scope, price, options or commercial terms. | There is verbal or written alignment on final price, scope and terms. |
| Closing | Obtain the outstanding formal acceptance or order evidence needed to mark the deal Won. | A signed contract or order is received, or a documented rejection is recorded. |

Against the six labels in the r11 mockup this merges Estimating and Quote into a
single Quoting stage, renames Qualification to Scoping, and replaces Lead with
Discovery. A separate Estimating stage is defensible, but it becomes valuable
mainly for managing an estimating team's workload or measuring its turnaround.
That is a different question from overall sales progress, and it belongs inside
the Estimating & Quotation module and the deal's linked records.

Won and Lost remain outcomes recorded on the deal, not board columns.

**On the first stage name.** An earlier draft called it Qualified. Because
qualification is the Leads module's responsibility and the board's entry
condition, that name described a state every deal on the board already holds,
and so distinguished nothing. Discovery names the work done in the stage, which
is consistent with the other four and makes a stalled deal legible.

**On Quoting rather than Proposal Sent.** A common reference model names this
stage for the milestone of sending the proposal. That milestone is this stage's
exit condition, not its content: costing, pricing and internal review all occur
before it and need somewhere to live. Naming the stage for its final event would
push that work back into Scoping, where it does not belong.

**On exit conditions.** None of the five is machine-verifiable. Record each the
way qualification is already recorded — an asserted note, with an optional link
to the activity or document that evidences it — rather than attempting automated
proof.

## Permitted transitions

| Movement | Rule |
|---|---|
| Forward | One stage at a time. This is what makes Scoping mandatory rather than advisory. |
| Backward | To any earlier stage. A deal in Closing whose scope collapses returns directly to Scoping. |
| Lost | From any stage. A deal that dies during Scoping is recorded there, not marched forward to be closed. |
| Won | From Closing only. |

## Enquiry is retired

Enquiry does not appear in the accepted model, and pre-qualification is the
Leads module's responsibility. This is consistent with existing behaviour:
`src/crm/leads/service.ts` already converts a qualifying lead directly to an
opportunity rather than through an Enquiry state.

Existing Enquiry opportunity records are by definition not yet qualified, so
they belong in Leads. Because the data is entirely synthetic, the honest routes
are to move those records to Leads or to reseed under a new database and storage
epoch. Relabelling them Qualified is not acceptable — see the constraint below.

## Quotation sub-status: considered and rejected

Quoting covers a large part of the process, so the board shows no position
within it. A sub-status badge on each card was considered, carrying Costing,
Preparing quote, Internal review, Sent — awaiting response and Revision
required, read from the linked estimate or quotation rather than maintained on
the deal.

It is rejected for three reasons. The accepted card definition in the shared UI
specification §4 lists title, organisation, value, expected close, next action
and owner; a status badge is a deviation from it. The next-action text already
distinguishes position in plain language — "Review the scope with engineering"
and "Follow up the draft quotation" sit at visibly different points — so the
badge would add a second vocabulary conveying what the card already says. And a
CRM-side status, even when read from a linked record, invites divergence from
the status the Estimating & Quotation module owns.

Finding every quotation awaiting response is a legitimate question. It belongs
to the module that owns the quotation record, not to the sales board.

An unanswered quotation therefore remains in Quoting with a scheduled follow-up
activity. The deal enters Negotiation when substantive commercial discussion
begins. A customer who accepts without negotiation may proceed directly to
Closing.

## Schema consequences

Found by inspecting `db/migrations/0010-crm-opportunities.sql` at
`e48206bf7fcc87e65b4a1a43d9534a0b062aa2af`. These are observations for the
implementing task, not a migration design.

**Stages are already a reference table.** `ppo.crm_stage_definitions` exists,
with foreign keys from `opportunities.stage_id` and from both
`opportunity_events.from_stage` and `to_stage`. Adding stages is therefore
largely a matter of inserting definition rows and relaxing check constraints,
rather than introducing a new concept.

**Four check constraints name the current two stages.** `stage_id IN
('Enquiry','Qualified')`; the stage-to-ordinal pairing; `definition_key =
'SyntheticEnquiryI1'`; and the event-type constraint. Each must be reconsidered
together with the ordinal scheme, which currently hard-codes one position per
stage and assumes a stage is entered once.

**Existing Enquiry records cannot be relabelled.** The opportunity table
enforces:

```
CHECK((stage_id='Enquiry'   AND qualification_note IS NULL AND identification_activity_id IS NULL) OR
      (stage_id='Qualified' AND qualification_note IS NOT NULL AND … ))
```

An Enquiry row has no qualification note by construction. Relabelling it would
require inventing qualification evidence that was never recorded, which the
constraint exists to prevent. This is why those records move to Leads or are
reseeded.

**Backward movement needs a new event type.** `opportunity_events` permits only
`OpportunityCreated` (to Enquiry), `OpportunityQualified` (Enquiry to Qualified)
and `OpportunityActionPlanned` (same stage), and rows are immutable under the
`event_immutable` trigger. Bidirectional movement therefore requires a general
stage-change event carrying `from_stage` and `to_stage`, which the table already
has columns for. Existing event rows must not be rewritten.

**Won and Lost do not exist yet.** `close_outcome` is constrained to `'Open'`.
Adding the outcomes is a separate change from adding the stages, and should
capture a structured lost reason — price, competitor, timing, no decision —
alongside free text, so the outcome data supports later analysis rather than
only narrative.

## Open dependencies

**The Won handover.** A won deal hands the project to delivery. That is a
contract between CRM and Projects (BP-06): whether Won creates a project,
links an existing one, or only records that a handover is due. It should be
settled before the Won transition is built, not after.

**The ordinal scheme.** Stages may now be entered more than once and in either
direction, so the current one-ordinal-per-stage pairing and the meaning of
`stage_entered_at` on re-entry both need definition.

## Not included

No migration, seed change, schema amendment or transition implementation is
performed here. I1 retains its bounded Enquiry → Qualified journey until the
implementing task lands. Stage movement continues to require an accessible form
alternative, required evidence or reason, server validation, version conflict
handling and durable history; nothing in this document relaxes that. Money
display, forecast basis and quotation or ERP links remain separately bounded
commercial work.

Drag-and-drop stage movement and bulk stage changes appeared in the reviewed
presentation prototypes. On 12 September 2026 Dean accepted drag-and-drop as
the correct board interaction; bulk stage changes remain not proposed.

Drag-and-drop is accepted against the five requirements above, not in spite of
them. Assessed on the branch that implements it:

- **Required evidence or reason** — satisfied. A drop into a stage whose
  transition the server requires evidence for opens the dialog on that target
  stage; every other drop saves directly and carries `reason: "Move on the
  board"`. `stageRequiresEvidence` in `src/components/crm-deal-controls.tsx` is
  the single place naming that transition, and the dialog's own payload reads
  from it, so the board cannot drift from the rule the dialog applies.
- **Server validation** — satisfied. `parseDealStage` rejects a null
  qualification outcome, and the `ppo.opportunities` check constraint makes the
  outcome a data invariant of the evidence-bearing stage rather than only a
  validator rule.
- **Version conflict handling** — satisfied. The drag path sends
  `expected_version` from the record it moved; the service raises
  `VersionConflict` on mismatch and the validator requires the field, so a drag
  cannot bypass the guard a dialog obeys. A refused or uncertain save drops the
  optimistic placement, so a card is never left in a column the server has not
  confirmed.
- **Durable history** — satisfied. `opportunity_events` records the opportunity
  version and previous version under the immutability trigger; a board move is
  as traceable as a dialog move.
- **Accessible form alternative** — satisfied off the board, and this remains
  open. The stage track on the deal page renders real buttons with
  `aria-current="step"` and is the keyboard path to a stage change. There is no
  keyboard equivalent on the board itself. Dragging is therefore accepted as
  the board's primary interaction, not as its only one, and a board-level
  keyboard path remains required before the board is the sole route to a stage
  change.

One assertion is still missing: no test covers the drag path's behaviour when
the command returns `VersionConflict`. The behaviour is implemented; it is not
asserted. Recorded as open work rather than resolved here.

## Verification

The model itself carries no runtime evidence. The
[five-stage review fixture](https://github.com/deanrfiedler-gif/powerplants-one/pull/122)
renders the accepted stages using the actual worklist components, shell and CSS
against a synthetic API, and confirms the board is stage-count agnostic:
`shared-layout.css` sets `grid-template-columns:repeat(var(--crm-stage-count),minmax(0,1fr))`
from `data.stages.length`. That is presentation evidence only — no database,
permission or deployment proof.
