# CRM pipeline stage model

**11 September 2026 · PPO-009 / BP-03 · Accepted direction for I3 · Implementation separately bounded**

Dean proposed a five-stage sales pipeline while reviewing the deals board
presentation extracted from `ppo-ui-design-review_r11.html`, and on 11 September
2026 accepted it together with the four open points below. This document records
the model, the sub-status question raised against it, and the schema
consequences found by inspecting the current migration.

The [r11 board correction](crm-r11-board-polish.md) records that the database
supplies Enquiry and Qualified, and that a six-stage sequence remains a
follow-on pipeline contract and migration task. This document settles the model
for that task. It does not perform it. The
[shared UI specification](../standards/ui-style-specification.md) r05 separately
records the six displayed stages in the mockup as a requested future layout
reference that does not change I1 or accept operational pipeline mapping.

## Accepted stages

| Stage | Purpose |
|---|---|
| Qualified | A qualified lead has become an owned deal with a genuine requirement and next action. |
| Scoping | Establish the solution, technical requirements, responsibilities and scope boundaries. |
| Quoting | Obtain costs, prepare the estimate, review pricing, issue the quotation and follow up with the customer. |
| Negotiation | Resolve substantive changes to scope, price, options or commercial terms. |
| Closing | Obtain the outstanding formal acceptance or order evidence needed to mark the deal Won. |

Against the six screenshot labels this merges Estimating and Quote into a single
Quoting stage, and renames Lead to Qualified and Qualification to Scoping. A
separate Estimating stage is defensible, but it becomes valuable mainly for
managing an estimating team's workload or measuring its turnaround. That is a
different question from overall sales progress, and it belongs inside the
Estimating & Quotation module and the deal's linked records.

Won and Lost remain outcomes recorded on the deal, not board columns.

## Accepted answers to the open points

**Scoping is mandatory.** Every deal passes through Scoping, including
straightforward equipment sales. An exit condition remains to be defined: what a
deal must have recorded before it may leave Scoping. Without one the stage
becomes a formality that deals pass through without producing a scope outcome.

**Stage movement is bidirectional.** A deal may return to an earlier stage —
Negotiation to Quoting when a revision is required, for example. Permitted
transitions are therefore not forward-only. Whether any stage may move to any
other, or only to adjacent stages, remains to be defined.

**Enquiry is retired.** It does not appear in the accepted model. This is
coherent with the existing Leads module, which already converts a lead directly
to `stage_id='Qualified'` (`src/crm/leads/service.ts`). Pre-qualification is
already the Leads module's responsibility, so Enquiry is largely redundant
rather than load-bearing. Existing Enquiry records still need a destination —
see the migration constraint below.

**Closing is a waiting room.** No additional evidence is required to enter or
remain in Closing. This does not remove the evidence requirement from Won.
Closing never implies Won, customer acceptance or an ERP order, so the Won
transition retains its own gate; the accepted answer moves that gate to the
transition rather than to the stage.

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
closure.

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
together with the ordinal scheme, which currently hard-codes a position per
stage.

**Existing Enquiry records cannot simply be relabelled.** The opportunity table
enforces:

```
CHECK((stage_id='Enquiry'  AND qualification_note IS NULL AND identification_activity_id IS NULL) OR
      (stage_id='Qualified' AND qualification_note IS NOT NULL AND … ))
```

An Enquiry row has no qualification note by construction. Relabelling it
Qualified would require inventing qualification evidence that was never
recorded, which the constraint exists to prevent. Two honest options remain, and
the choice is open: return those records to the Leads module, where
pre-qualification belongs, or migrate them with an explicit recorded note
stating that the qualification was carried over rather than separately
evidenced. Fabricating a qualification note is not acceptable.

**Backward movement needs a new event type.** `opportunity_events` permits only
`OpportunityCreated` (to Enquiry), `OpportunityQualified` (Enquiry to Qualified)
and `OpportunityActionPlanned` (same stage), and rows are immutable under the
`event_immutable` trigger. Bidirectional movement therefore requires a general
stage-change event carrying `from_stage` and `to_stage`, which the table already
has columns for. Existing event rows must not be rewritten.

## Not included

No migration, seed change, schema amendment or transition rule is performed
here. I1 retains its bounded Enquiry → Qualified journey until the implementing
task lands. Stage movement continues to require an accessible form alternative,
required evidence or reason, server validation, version conflict handling and
durable history; nothing in this document relaxes that. Money display, forecast
basis and quotation or ERP links remain separately bounded commercial work.

Drag-and-drop stage movement and bulk stage changes appeared in the reviewed
presentation prototypes. They are not proposed and do not satisfy the evidence,
validation and conflict requirements above.

## Verification

The model itself carries no runtime evidence. The
[five-stage review fixture](https://github.com/deanrfiedler-gif/powerplants-one/pull/122)
renders the accepted stages using the actual worklist components, shell and CSS
against a synthetic API, and confirms the board is stage-count agnostic:
`shared-layout.css` sets `grid-template-columns:repeat(var(--crm-stage-count),minmax(0,1fr))`
from `data.stages.length`. That is presentation evidence only — no database,
permission or deployment proof.

## Remaining before implementation

1. The Scoping exit condition — what a deal must record before leaving the stage.
2. The permitted transition set — any stage to any stage, or adjacent only.
3. The destination for existing Enquiry records — Leads, or a carried-over
   qualification note.
4. The ordinal scheme, given that stages may now be entered more than once and
   in either direction.
5. The Won transition gate, now that Closing itself is unguarded.
