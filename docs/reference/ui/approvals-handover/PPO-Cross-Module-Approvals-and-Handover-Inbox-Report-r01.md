---
document_id: PPO-SH06-REPORT
title: Cross-module approvals and handover inbox — feature and design report
revision: r01
date: 2026-09-17
owner: Dean Fiedler
status: Proposed standalone design; owner acceptance and application integration separate
scope_id: SH-06
source_commit: e1b705acc5457dab6fc0b6a2f0c977132cbd2215
---

# Cross-module approvals and handover inbox

## 1. Purpose and delivered outcome

The [interactive HTML](PPO-Cross-Module-Approvals-and-Handover-Inbox-r01.html) provides one place to find, understand and open review work across Powerplants One. It answers four practical questions: **what needs attention, who owns the next action, how long has it been waiting, and which workspace owns the decision?**

The inbox is a focused extension of the existing My Work direction. It projects domain-owned tasks; it does not establish a shared approval policy. A quotation approval, Engineering review, receiving handover, Service correction and Finance reconciliation retain different meanings and controls.

This package delivers the SH-06 workspace interior, six queue views, persistent selected detail, seven domain-specific destination previews, demonstrable failure/recovery states, editable source, reproducible builder and focused verification. Everything in the examples is synthetic. It adds no application route, server service, database migration, integration or deployed page.

## 2. Scope and design conformance

| Required declaration | This package |
|---|---|
| Existing scope | **SH-06 — Cross-module approvals and handover inbox**, retained from the issued HTML Page Coverage Register r06. Its exact wording also appears in the companion audit r04. Neither issued source is edited. |
| Requested increment | One entry point to domain-owned review tasks, ageing and returned submissions; each item opens the applicable review destination. Interactive HTML and detailed companion report. |
| Primary r20 page type | **Work queue + persistent detail**: a selectable queue beside a durable context pane. |
| Supporting page types | **Record detail** and **Review / comparison** for domain destination previews; a short centred dialog for help, preview configuration and saved-view reset. |
| Reused components | r20 colour, typography, controls, feedback badges, card geometry, focus treatment and page-composition guidance; SH-03 Notifications header/environment line, embedded Roboto and icon assets; My Work's source-owned obligation direction. |
| Shell boundary | Workspace interior only. Application branding, rail, global search, quick add and account controls belong to the shared application shell. |
| Incoming handover | Permitted source task, company, record identity, submitted revision, source state, accountable owner, submitter, due date or explicit unknown, next action, exact evidence and known source freshness. |
| Outgoing handover | Open the appropriate domain screen with the exact source identity/revision and retain a safe return to the queue. Only the owning domain can make decisions, change ownership or create acceptance/processing receipts. |
| Exception treatment | Returned, unassigned, date needed, changed revision, unavailable target, mismatched link, read-only visibility, unknown Finance outcome, partial loading, failed loading, genuine empty result, withdrawn and superseded history. |
| Proposed departures | Phone uses list-to-detail navigation with a Back to list control, instead of r20's simple stacked queue/detail. This keeps a long queue from burying the selected record. Six task-specific views and authored destination previews are new proposed compositions. |
| Verification status | Actual model, documentation, browser and visual results are recorded in the [verification record](../../../testing/evidence/approvals-handover-r01/README.md). Package creation and publication do not establish owner acceptance or runtime delivery. |

### Requirement relationships

The SH family-level mapping remains CRM-03, DOC-06, NFR-01, NFR-05, NFR-08 and NFR-11. The adopted [F06/F06-A contract](../../../requirements/product-quality-register.md) additionally maps CRM-03, PRJ-03, SVC-02/12, DOC-05 and NFR-01/11. These are different source mappings, not a newly invented combined parent requirement. No parent ID is changed or marked complete.

The local **Save view** function demonstrates a bounded personal preference. It does not implement the full SH-05/F04 shared-view service, team sharing, concurrent editing or server persistence.

## 3. Information architecture

The workspace has five levels:

1. **Page context:** title, purpose, SH-06 revision, synthetic environment and visibility example.
2. **Queue views:** My reviews, All permitted, Returned to me, Handovers, Sent by me and History.
3. **Workload context:** four actionable measures, fixed source snapshot and explicit completeness.
4. **Search and filtering:** customer/record/owner search, domain, work type, date condition and sort.
5. **Work processing:** selectable queue, selected-record context, Summary/Evidence/History and the domain-owned next action.

A destination occupies the main workspace, identifies the owning domain and review purpose, and retains the task's source reference, revision and location context. It offers return navigation and a clearly described repository design reference. It contains no generic approval or completion control.

## 4. Queue views

| View | Inclusion rule | User purpose |
|---|---|---|
| My reviews | Open items whose current action owner is the demonstration user, Dean Fiedler. Includes owned handovers and corrections. | Personal starting point. |
| All permitted | All open items in the current visibility example, including unassigned work and other owners. | Coordination across domains. It does not imply organisation-wide access. |
| Returned to me | Open Returned items originally submitted by Dean. The current correction owner remains explicit in detail. | Find work requiring correction and resubmission. |
| Handovers | Open items of kind Handover, irrespective of current owner within visible scope. | Distinguish sending, receipt and receiving acceptance. |
| Sent by me | Open items originally submitted by Dean, including those awaiting another reviewer. | Follow up without assuming the submitter can approve. |
| History | Accepted, Superseded and Withdrawn tasks. | Inspect retained source evidence without reopening completed decisions. |

Counts on the view buttons are calculated before toolbar filters. The queue count and selected detail use the filtered dataset. When a search has no results, the selection is cleared, preventing details from a previously visible record remaining on screen.

## 5. Workload measures, dates and ageing

The fixed example time is **17 September 2026, 9:00 am AEST**, using the Brisbane calendar date. The HTML never implies that this is a live refresh timestamp.

| Measure | Initial count | Basis and click behaviour |
|---|---:|---|
| Assigned to me | 9 | All open, permitted source tasks currently owned by Dean. Opens My reviews with other criteria cleared. |
| Overdue | 5 | Open tasks with an explicit source due date earlier than 17 September. Opens All permitted with Overdue selected. |
| Returned to me | 2 | Open returned submissions originally authored by Dean. Opens Returned to me. |
| Date needed | 2 | Open tasks without a source due date. Opens All permitted with Date needed selected. |

**Age** is elapsed calendar days since first submission, calculated at midnight boundaries. It is descriptive, not an SLA or escalation threshold. The detail pane separately shows the current review-cycle start and age. Returning Engineering's drawing on 15 September does not erase its original 6 September submission or 11-day total age.

A due date of 17 September is **Due today**, not overdue at 9:00 am. Missing dates remain **Date needed** and sort after known dates. The design does not fabricate a date, label an undated item on time, infer working days or convert age into automatic escalation. History items display a closed-source indication rather than an active overdue warning.

Partial loading explicitly qualifies the snapshot and measures. Complete failure displays dashes in the measures, not zero outstanding work. An empty success uses zero and explains that all permitted sources loaded successfully.

## 6. Finding and comparing work

The search matches title, customer, readable source reference, current owner, named location and source state. Search text is length-limited and safely escaped when rendered. It can be combined with:

- Owning domain: all seven domains, or one domain.
- Work type: Review or Handover.
- Date condition: all, overdue, today, date needed or upcoming.
- Sort: due date first, oldest submission or most recent review cycle.

**Clear** removes toolbar criteria while retaining the chosen view. **Save view** explicitly stores the view and criteria on the current browser. Changing filters shows that the new state has not yet been saved. No source-task state is stored by this operation.

The seven domains are represented without forcing their states into one approval lifecycle. A common display kind helps discovery; the actual source state remains visible on each item.

## 7. Queue cards and selected detail

Each card shows the owning domain, source state, task title, customer, work type, submitted revision, total age and due condition. The selected card uses a pale green surface, green leading edge and `aria-current` state. Colour is accompanied by text.

The persistent detail pane shows:

| Information | Purpose |
|---|---|
| Domain, task kind and revision | Establish the review context before any navigation. |
| State and due condition | Explain why the item remains visible. |
| Title, customer, site and named facility/growing area | Distinguish similar records and preserve horticultural applicability. |
| Readable reference | Allow recognition and communication without treating a label as the primary key. |
| Current action owner and submitter | Separate the person who must act from the author. Unassigned ownership is explicit. |
| Due date, first submission and review-cycle start | Support follow-up without losing original age. |
| Receiving team | Identify the domain accountable for the next step. |
| Next action | Say what the owner must resolve in plain language. |
| Domain rule | Preserve the specific boundary for approval, issue, release, receiving or reconciliation. |

Three secondary views are provided. **Summary** contains ownership, dates, return reason, handover stages and next action. **Evidence** contains labelled synthetic source extracts, reference and revision, plus a clear statement that no operational documents are attached. **History** retains the original submission and authored return/acceptance/source-state events.

Evidence is illustrative content, not an attachment repository or cryptographic proof. Production evidence requires authoritative document IDs, exact issue/version references and hashes where applicable.

## 8. Returned submissions and resubmission boundary

Two examples demonstrate returned work:

| Source | Return evidence | Required next action |
|---|---|---|
| Engineering control drawing r02 | Reviewer Morgan Ellis returned the drawing on 15 September because sensor S-04 does not match the growing-area schedule. | Correct the source drawing, explain the revision and submit a successor through Engineering. |
| Service labour submission r01 | Morgan Ellis returned an overlapping labour interval on 15 September. The original entry remains retained. | Correct the interval in Service, retaining original capture and correction lineage. |

The inbox displays the exact reason, returning reviewer, date and correction owner. It does not edit the drawing or labour entry, remove the return, reuse a prior approval or resubmit on the author's behalf. These actions belong in the destination module with its required checks.

The fixture retains both original age and current-cycle age. In production, a source resubmission event must carry predecessor/successor linkage so the inbox can update the existing obligation without deleting the prior history or creating duplicate work.

## 9. Handover evidence

The detail pane uses three individually labelled outcomes: **Sent**, **Received** and **Accepted**. Each stage shows its own date or receipt, or an explicit absence of evidence.

- The berry block CRM intake is Sent with no receiving receipt.
- The propagation-house Project handover was sent on 8 September and received on 9 September; acceptance remains outstanding.
- The accepted climate-upgrade CRM intake is retained in History with receipt `SYN-PPO-RCP-000024`, tied to intake r02.
- The Finance handoff retains its received context while its processing outcome is unknown; receiving acceptance and ERP processing are separate facts.

Opening, reading or returning from a handover changes none of these states. No customer notice or external message is sent by this package.

## 10. Domain destinations and ownership

Every item creates a local route containing the task UUID, source-record UUID, exact revision and allowlisted screen key. The source resolver checks their consistency before displaying a destination. Readable names are never used to resolve a target.

| Domain | Local destination preview | Review content and retained boundary |
|---|---|---|
| CRM | Sales-to-estimating handover review · CR-03 / ES-01 | Customer/scope, receiving requirements and handover evidence. Sending is distinct from receiver acceptance. |
| Estimating & Quotation | Quotation approval review · ES-05 | Exact quotation basis, commercial evidence and issue boundary. Approval, issue, distribution and customer acceptance remain distinct. |
| Engineering & Design Control | Technical review and transmittal · EN-05 | Drawing/calculation set, findings and release purpose. For-review acceptance is not installation release. |
| Projects & Commercial Delivery | Project readiness and change review · PJ-01 / PJ-07 | Proposed access change, crop-sensitive delivery consequences and receiving prerequisites. Review does not authorise work or confirm bookings. |
| Service Operations | Service evidence and report review · SV-06 / SV-07 | Original submitted visit evidence, findings/corrections and remaining work. Captured, reviewed, billable and ERP-processed quantities remain distinct. |
| Supply Chain Management | Material readiness exception review · SC-01 / SC-09 | Demand, allocation, source unit, exception and downstream impact. Review does not post receipts or approve substitutes. |
| Finance & Commercial Controls | Finance handoff and reconciliation review · FN-01 | Reviewed handoff, original simulated operation and reconciliation boundary. Unknown external outcome prevents blind replacement processing. |

**Implementation boundary:** these are authored, read-only destination previews within the portable HTML, not embedded copies of seven complete modules. Their purpose is to make the route and carried context reviewable. The full domain policy engines and permission services are not connected. No domain-specific approval logic has been invented to make the demo appear complete.

The “View related design reference” control explains this distinction before linking to the pinned repository HTML source. Those references do not receive the synthetic task. In particular, the existing Engineering container is a broader reference rather than proof that EN-05 is fully implemented. Production navigation must use the real permission-checked domain screen.

## 11. Integrity, access and recovery

| Condition | Demonstrated behaviour |
|---|---|
| Duplicate source delivery | Records are deduplicated by company + owning domain + source task identity. The fixture intentionally supplies one duplicate. |
| Changed revision | The lighting quotation remains tied to r02. Opening it reveals current r03 and requires an explicit “Open current r03” action. The original revision remains unchanged. |
| Mismatched deep link | A mismatched record, screen or unsupported revision does not open another source. |
| Source unavailable | A generic explanation replaces the destination; no source details are rendered there. |
| Access revoked while navigating | Current destination access fails closed. No permission or substitute record is inferred from a previously visible card. |
| Read-only observer | Source previews visibly identify read-only access. All destination previews remain non-operational in this package. |
| Service-only visibility | Source rows and counts are filtered to Service before rendering. Deep links to other domains cannot expose their content. |
| Unknown Finance outcome | Preserve the original operation reference and require Finance reconciliation; there is no inbox posting or retry command. |
| Partial queue | Finance is excluded with an explicit warning and retry control; other work remains inspectable. Counts are labelled partial. |
| Failed queue | Explain failure, retain filters and offer retry. No current workload count is claimed. |
| Empty queue | Confirm a successful read with no tasks. Distinct from a failed read and a filtered no-match state. |
| Corrupt saved preference | Preserve the saved bytes, explain session-only use and require explicit reset before overwriting. |
| Storage blocked/full | Retain current filter use in memory, show “not saved” and offer retry. Source records remain unaffected. |
| Withdrawn/superseded item | Remain in History and open as retained read-only evidence; no earlier revision is silently promoted. |

Preview identity selection is an explanatory fixture, **not authentication**. No secret, real customer record, operational export or employee role assignment is included. The fictional examples do not establish authority for any named person.

The package deliberately has no approve-all, generic reject, universal monetary threshold, business completion, reassignment, delegation, customer-send or ERP-posting operation. Required review tasks cannot be archived or muted out of the queue. Notification preferences remain with SH-03.

## 12. Data and receiving contract

The following is a proposed receiving model, not a new API or database schema:

| Field/group | Meaning and production expectation |
|---|---|
| `id` | Stable inbox projection identity; fixture UUID. |
| `source_id`, `source_task_id` | Separate domain record and review-obligation identities; fixture UUIDs. |
| `company_id`, domain | Company and owning-domain context. Production visibility and deduplication must include the applicable tenant/company scope. |
| Reference, title and customer/location | Readable labels; not primary keys. Runtime location IDs must preserve organisation, site and named facility/area identity. |
| `revision`, `current_revision` | Submitted revision and observed current revision; neither substitutes for the other. |
| Kind and source state | Discovery category plus retained domain state. Display mapping does not establish state-transition authority. |
| Owner and submitter | Current action owner and submitting actor. Runtime requires identity keys and domain-approved routing. |
| Submission/receipt/cycle/due dates | Distinct events; optional due date is explicitly unknown. Runtime requires authoritative timestamps and source timezone. |
| Evidence and history | Revision-bound excerpts/events. Runtime needs exact source attachments, event IDs, approval/receipt identities and recorded actors. |
| Screen key | Allowlisted domain destination, validated with the complete source context. |

A receiving implementation should read permission-filtered projections from the modular monolith, compute aggregates from the same visible scope, and validate current record access on navigation. Domain services retain command validation, separation of duties, delegation policy, idempotency and immutable receipts.

Source events should carry stable event/operation identity and sequence or version evidence. Duplicate deliveries update one projection; stale events must not overwrite a newer source state. This prototype proves read deduplication and navigation, not a transactional event pipeline or out-of-order replay. It defines no ERP endpoint and changes no MYOB or SharePoint authority.

A domain decision must update its own source and durable receipt before the inbox reflects it. A notification acknowledgement is separate. On an uncertain command result, recovery must reconcile the original operation; the inbox must not assume success, close the task or submit a second operation.

## 13. Visual alignment and responsive behaviour

The supplied r20 file matches the repository byte for byte: SHA-256 `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617`.

| Component | Applied treatment |
|---|---|
| Typography | Embedded r20 Roboto 400/500/700, with Roboto/Verdana/sans-serif fallback. Page title 28 px, task title 23 px, primary content 13–14 px and supporting labels 11–12 px. |
| Palette | Navy `#242a37`, green `#62bb46`, paper `#f5f6f8`, white surfaces, line `#e1e5eb`. Green identifies selection and emphasis, not blanket approval. |
| Status language | r20 labelled neutral, information, warning, danger and success badges. Red overdue text retains an explicit date label. |
| Geometry | 6 px controls, 7 px cards, 10 px dialogs; restrained borders and spacing. |
| Workspace | Header, context/environment row, tabs, measures, tools and one queue/detail composition. No competing app masthead or logo. |
| Desktop | 360–385 px queue beside flexible persistent detail. Queue and detail own their vertical scroll regions, following r20 processing-layout guidance. |
| Narrow screens | Below 760 px, selecting a card shows detail with a prominent Back to list control. The existing filters and queue remain recoverable. |
| Source preview | Flexible evidence area plus review-context panel; panels stack on smaller screens. |
| Focus and controls | Semantic buttons, labelled form inputs, visible focus rings, keyboard card selection, focused phone detail and dialog Escape/focus return. |
| Motion and print | Reduced-motion rules and print treatment favour selected source content. Print is a review convenience, not an issued business document. |

The phone composition is a proposed usability refinement. Native visual verification is recorded separately; these choices do not silently replace an accepted shell or component baseline.

## 14. Review walkthrough

1. Open the HTML. Confirm My reviews, nine items, and the four initial measures.
2. Select the Screen system quotation. Inspect its revision, age, due date, source extracts and domain rule.
3. Open quotation review. Confirm the source reference and review purpose, then return to the queue.
4. Open Returned to me. Inspect both return reasons and compare original submission age with current-cycle age.
5. Open Handovers. Compare the Project receipt with the CRM item still awaiting receipt.
6. Select Revised lighting quotation. Confirm the r02/r03 warning, then explicitly open current r03. Reload the destination and verify the exact context remains.
7. Inspect the Finance unknown-outcome item and its original operation reference.
8. Use All permitted to find the unassigned Supply Chain item and the two missing due dates.
9. Inspect History and the separate CRM acceptance receipt.
10. Save a filtered view, reload and confirm restoration.
11. Use Preview options to inspect partial, failed, empty, read-only, Service-only and unavailable-source states.
12. Repeat selection and return navigation on a phone-sized viewport.

## 15. Source package and verification

| File | Responsibility |
|---|---|
| [HTML](PPO-Cross-Module-Approvals-and-Handover-Inbox-r01.html) | Portable review deliverable with embedded CSS, font, icons, model and controller. |
| [Source guide](../../../design/approvals-handover/README.md) | Editable source inventory and reproducible build/check commands. |
| [Design decision](../../../decisions/cross-module-approvals-handover-design.md) | Authorisation, source baseline, conformance, handover and remaining decisions. |
| [Verification record](../../../testing/evidence/approvals-handover-r01/README.md) | Actual check results, browser evidence, artifact hashes and limitations. |

Model checks cover domain routing, permissions before projection, dates, returned ageing, deduplication, source mismatch, stale revision selection, terminal history, unknown/missing data and non-mutation. Native checks cover the implemented interface, navigation/reload, storage recovery, responsive layouts and focus. Foundation, prototype and naming checks protect repository documentation consistency.

The local runtime differs from the repository's pinned application runtime. Model/syntax checks are bounded evidence; the focused workflow uses the existing repository runtime and browser pins. No claim of application or production acceptance follows from a passing design check.

## 16. Open decisions and next bounded increment

The design is ready for review as a standalone module. Operational decisions remain with domain owners: reviewer/deputy policy, any separation of duties, routing authority, escalation rules, service levels, accepted return reasons, exact approval/issue semantics and real document applicability. This report does not assign those policies.

The next bounded implementation would connect **one existing permission-checked domain review task** to the shared My Work projection, preserve an exact revision deep link and return context, then prove that its real source receipt updates the inbox without duplicate work. Expand to further domains only after their receiving contracts are specified and verified.

Live integration, production authentication, shared preference storage, real-time queue updates, cross-device persistence, true source mutations, notification delivery and operator acceptance remain outside this HTML package.
