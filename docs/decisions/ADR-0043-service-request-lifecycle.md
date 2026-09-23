# ADR-0043 — Service request lifecycle: work, waiting, resolution review and closure

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **State:** Proposed, 23 September 2026. Not accepted. It authorises no migration, command, capability, seed or deployment. **Raised by:** D3 of the [service requests native refinement](service-requests-native-refinement.md). Dean accepted the recommendation to draft this record for his review on 23 September 2026.

**Related:**
- Requirements, data, transitions and APIs: SVC-01, SVC-02, SVC-06; DAT-04; TR-01, TR-15; API-R03, API-C23, API-C24; SR-04; AT-06, AT-30; D-002, D-007.
- Screens: BP-07 SC-04 *Service intake*, the PP-01 screen at `/service/tickets/:id`. This is not the page register's `scope:SC-04` *Receipt, inspection and quarantine*. Page-register scopes: `scope:SV-01` and `scope:SV-02`.

## Context

### Known

1. **The state values already exist.** `ppo.tickets.status` has accepted New, NeedsInformation, Triaged, Active, Waiting, Resolved, Closed and Cancelled since migration `0001-foundation.sql`. The [data dictionary](../contracts/service-data-dictionary.md) `TicketState` enum lists the same eight.
2. **Only three are reachable.**
   - Creation starts New.
   - P03 adds New → NeedsInformation and New/NeedsInformation → Triaged ([ADR-0008](ADR-0008-p03-customer-intake.md)). ADR-0008 states that Triaged is terminal for P03 commands.
   - `listTickets` in `src/service/intake.ts` accepts only those three as a filter.
3. **The later transitions are designed logically.**
   - [BP-01](../blueprints/BP-01-master-blueprint.md) §18.3 and [BP-07](../blueprints/BP-07-service-operations.md) §6 TR-15 give the ticket branch as `Triaged → Active/Waiting → Resolved → Closed`, with `Closed → Active` on a recorded reason.
   - BP-07 §6 adds cancellation with a reason, which first checks for linked active work.
   - BP-07 §13 says: "A ticket can remain Waiting while attendance is complete. Resolve requires a recorded resolution or accepted disposition of the issue; close is a separate owner action."
   - API-C23 lists `/service/tickets/:id/resolve`, `/close` and `/reopen`.
   - The dictionary lists a `resolution` field (G resolve/close), but no column holds it.
4. **Work orders link to tickets.**
   - P04 links work orders through `work_order_tickets`, each link with an issue disposition.
   - Authorising an order requires every linked ticket to be Triaged (`src/service/work-orders.ts`).
   - P09 records that whole-order InProgress and WorkComplete, and ticket closure, are not implemented. Current orders stop at Authorised.
5. **Activities already model owned work.**
   - Kinds: TechnicalFollowUp, CustomerContact, MaterialAction, FinanceQuery and RelationshipReview.
   - Each has an owner, a due time or an explicit due-needed marker, and a state: Open, InProgress, Completed or Cancelled.
   - Activities link to a Ticket through `activity_links`.
   - P03's clarification is a CustomerContact activity designated by `tickets.clarification_activity_id`.
6. **r02's model rules are the design source.** [Service Cases & Triage r02](service-cases-workspace-design.md) implements the full lifecycle in a browser model:
   - **Commands:** start, wait, resume, review, return, resolve, close and reopen.
   - **Waiting reasons:** Customer information, Parts, Supplier advice, Quotation approval and Site access.
   - **Evidence bases:** Reported symptom, Suspected cause, Attempted fix, Verified finding and Work completed.
   - **Resolution blockers:** open actions, a waiting dependency, no recorded evidence, and draft work or proposed visits.
   - **Closure rule:** closure needs successful customer contact after the resolution review.
   - **Status:** r02 states that it "is not a new application API".

### Unknown or unresolved

- Operational service-owner roles and delegation (D-002).
- Any customer-communication policy.
- Any service level.
- The Finance disposition that TR-15 lists among its closure guards.

None of these is decided here. Nothing is sent to a customer.

## Options

| Option | Assessment |
|---|---|
| **A. Intent-specific commands on the existing Ticket.** Activities hold owned actions and the customer-update commitment; small typed child records hold waiting periods, evidence, contacts and resolution reviews | **Proposed.** It keeps one Ticket identity and reuses Activity ownership, links and My Work. It adds guarded, audited commands and needs no new state values |
| B. A generic status update endpoint | Rejected. [Service API §3](../contracts/service-api.md#3-command-catalogue) forbids arbitrary `status` updates, and the guards would move into the client |
| C. Derive the request stage from work-order and appointment states | Rejected. SR-04 keeps the lifecycles independent, and a finished visit must not resolve a request (BP-01 §13.1) |
| D. Show the later stages as labels over the three native states | Rejected. The screen would show a stage the record does not hold |
| E. Store r02's case document as JSON | Rejected. It duplicates Activity, bypasses the typed company and site keys, and cannot be checked per record |

## Proposed decision

### Transitions

Every command below is a POST to `/api/v1/service/tickets/:id/<route>`. Each one:
- carries the common envelope, `expected_version` and a `reason` of 1–4000 characters;
- rechecks current authority before replaying a receipt;
- commits the ticket, its child records, audit, receipt and outbox in one transaction.

A stale version refuses the save and keeps the proposal (r02 rule).

| Route | From → to | Capability | Guards | Effects |
|---|---|---|---|---|
| `start-work` | Triaged → Active | `service.ticket.edit` | At least one open (Open or InProgress) linked Activity other than the commitment, and an open customer-update commitment | State only. Completing an action never moves the request (an r02 departure; see below) |
| `set-waiting` | Triaged, Active or Waiting → Waiting | `service.ticket.edit` | `waiting_reason` is one of CustomerInformation, Parts, SupplierAdvice, QuotationApproval or SiteAccess; `detail` 1–2000 characters; a valid scoped follow-up owner; a UTC `review_at`. Missing intake information before triage still uses RequestInformation (NeedsInformation) | Opens, or replaces, the single current waiting period. The commitment stays open |
| `resume` | Waiting → Active | `service.ticket.edit` | A reason stating what changed | Ends the waiting period with that reason |
| `propose-resolution` | Triaged or Active (not Waiting) | `service.ticket.edit` | No resolution blockers (below); a `summary` of 1–4000 characters; 1–20 cited current evidence entries | One open proposal. The state is unchanged; the register shows *Resolution review* |
| `return-resolution` | Open proposal → Active | `service.ticket.resolve` | An owned correction: owner, due time and summary | Proposal marked Returned; a TechnicalFollowUp activity is created and linked |
| `resolve` (API-C23) | Triaged or Active with an open proposal → Resolved | `service.ticket.resolve` | Blockers re-evaluated at acceptance | Proposal marked Accepted with the reviewer and time. That row is the dictionary's `resolution` value. Closure warnings are returned |
| `close` (API-C23) | Resolved → Closed | `service.ticket.resolve` | A recorded contact with outcome Contacted, on a channel other than Internal, at or after the acceptance time; the commitment no longer open | Closure reason and time recorded on the accepted resolution |
| `reopen` (API-C23) | Resolved or Closed → Active | `service.ticket.resolve` | A new owned next action (TechnicalFollowUp) and a new commitment (CustomerContact), each with an owner and due time | Earlier resolutions, contacts and closure details are kept. Additional physical work uses a linked new work order (TR-15) |
| `cancel` | New, NeedsInformation, Triaged, Active or Waiting → Cancelled | `service.ticket.resolve` | No linked work order with a Proposed, Confirmed or InProgress appointment (BP-07 §6) | Open linked activities stay with their owners; nothing is deleted |

**Resolution blockers** are reported in words, as r02 does:

1. The request is New or NeedsInformation.
2. A linked Activity is open, other than the commitment.
3. A waiting period is open.
4. No current evidence entry exists.
5. A linked work order has a Proposed, Confirmed, InProgress or CompletedPendingReview appointment.

**Closure warnings** do not block (D4, accepted as advisory). Today there is one: site and equipment not recorded.

### Customer-update commitment

The commitment is a CustomerContact Activity. `tickets.customer_update_activity_id` designates it, following the `clarification_activity_id` precedent.

- **Creation:** triage creates the commitment. Recording a contact on an open request requires a new or updated commitment due time (r02 rule).
- **Completion:** only the commitment's owner completes it, under the existing Activity rules.
- **Activity rules:** unchanged.

### Child records

None of these child records takes a readable reference or a business identity, so no `ppo.business_identities` change is needed.

| Record | Content | Rules |
|---|---|---|
| `ticket_waiting_periods` | Reason, detail, follow-up owner, review time, start, end and end reason | At most one open period per ticket; history kept |
| `ticket_evidence` | Basis (ReportedSymptom, SuspectedCause, AttemptedFix, VerifiedFinding or WorkCompleted), body 1–8000, method 1–1000, source 1–500, occurred time, optional site or asset target within the ticket's context, author, and `supersedes` | Allowed while the request is New to Waiting. A correction supersedes only the current entry and never deletes it. File attachments are out of scope. A follow-up call is a ReportedSymptom entry that never changes priority, owner or stage (D8) |
| `ticket_contacts` | Channel (Phone, Email, Internal or Other), outcome (Contacted, MessageLeft or NoResponse), contact label, summary, source and occurred time | Allowed from New to Resolved. On an open request it also sets or updates the commitment's due time (r02 rule). A record of a conversation, not a sent message. Separate from appointment ContactOutcome |
| `ticket_resolutions` | Summary, cited evidence, proposer and time; outcome (Open, Returned or Accepted); reviewer and time; closure time and reason | At most one open proposal. Accepted rows are immutable apart from the closure fields |

### Reads (API-R03 amendment)

- **List:**
  - The `status` filter accepts all eight values, plus `include_closed` (D5).
  - The projection adds customer, site, equipment, owner name, received time and channel, the next open action with its owner and due time, the commitment due time, the waiting reason and review time, linked work orders with their own states, and whether a proposal is open.
- **Record:**
  - The timeline merges evidence, contacts and transitions, newest first.
  - The record also returns the blockers, the warnings and the permitted actions.
- **Access:** every linked record is still scope-checked, and an inaccessible link is withheld rather than counted.

### Compatibility and consequences

- **Work-order authorisation:** the P04 guard changes from "every linked ticket Triaged" to "every linked ticket Triaged, Active or Waiting". Without this, starting work on a request would block authorising its order.
- **New capability:** `service.ticket.resolve` separates the resolution decision, as `service.scope.authorise` does for scope. Per `AGENTS.md`, adding a Capability regenerates the AD-01 access review and moves its pinned sizes. A seed that grants it extends the reseed allowlist, the Estimating grant snapshot and the hosted-demo user count.
- **One migration.** At build time it takes the next free number (after `0044` today). It adds the four child tables, `tickets.customer_update_activity_id` and eleven outbox kinds: TicketWorkStarted, TicketWaitingSet, TicketResumed, TicketEvidenceRecorded, TicketContactRecorded, TicketResolutionProposed, TicketResolutionReturned, TicketResolved, TicketClosed, TicketReopened and TicketCancelled. The status check is unchanged. Per `AGENTS.md`, the migration also updates the registry assertions in the database and demo suites and is proved across an upgrade through `0026` with estimates present.
- **Existing records:** no backfill. Existing Triaged requests stay Triaged until someone starts work on them.
- **Departures from r02:**
  - Completing an action no longer moves a Triaged request to Active automatically; a stage change is its own decision with its own reason.
  - Cancellation is added from BP-07; r02 has no cancel.
- **Reversal:** withdraw the routes. The records stay readable, and requests keep their recorded states.

## Open questions for Dean

| # | Question | Recommendation |
|---|---|---|
| Q1 | A new `service.ticket.resolve` for return, resolve, close, reopen and cancel, or reuse `service.ticket.edit`? | New capability. Resolution and closure are service-owner decisions in r02 and BP-07 |
| Q2 | Whole-order completion is not implemented. Is blocker 5 (no live appointment on a linked order) enough until it is? | Yes, as an interim rule, reviewed when the work-order branch of TR-15 is built |
| Q3 | Who may record Verified finding and Work completed? | Holders of `service.ticket.resolve`, and technicians with accepted attendance on a linked appointment |
| Q4 | May the proposer accept their own resolution? | Allowed, as in r02, with both identities recorded; revisit under D-002 |
| Q5 | Should open waiting reviews appear in My Work? | Yes, as a separate group in the native build |
| Q6 | P03 triage requires a known site ([ADR-0008](ADR-0008-p03-customer-intake.md)), so an organisation-level request such as the invoice query cannot be triaged today. Should triage accept an explicit "no site applies" for named categories? | Yes, for *Account & invoice* first, as an explicit category rule, never an empty site. This is the same category rule D4 would need before missing site and equipment could ever block closure |
| Q7 | The Ticket has no customer field; `company_id` is the ERP company context. The native register derives the customer from the site's current Operator party or the requester's single relationship ([build plan](../delivery/service-requests-integration-build-plan.md) P1). Should the lifecycle migration add an explicit `customer_id`? | Yes. Validate it against current site parties, as WorkOrder already does, then retire the derivation |

## Validation required before acceptance

The build must prove each transition's guards, refusals, stale versions, idempotent replay and scope checks in the PostgreSQL suites, and the HTTP contract in the route suites. It must also pass the migration-registry and upgrade proofs above, and browser checks against the refinement frames. None of this has been run: this record is a proposal.
