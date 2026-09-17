---
document_id: PPO-CR05-RPT
revision: r01
date: 2026-09-16
owner: Dean Fiedler
status: Interactive design for review; application integration and owner acceptance separate
source_commit: 0769a16dd842e9dc1c349a853036ab71949e7807
---

# CR-05 Sales Aftercare & Renewal Worklist — workspace report

## 1. Purpose and delivery

The [interactive r01 HTML](PPO-Sales-Aftercare-and-Renewal-Worklist-r01.html) gives Sales and account owners one place to answer: **"Has the customer received the intended outcome, what support do they still need, and what should we follow up next?"**

It does that across five connected views — an aftercare worklist, a customer review workspace, a training and follow-up register, a maintenance and renewal worklist, and a history view that carries a commercial handover. The design's central discipline is that **completing an aftercare review completes nothing else**. Eleven business outcomes are held apart, each with its own value, source and date.

This report describes the actual standalone demonstration: its information model, every view and field group, its actions and state transitions, its permissions, provenance and recovery behaviour, its synthetic scenarios, and the boundaries it keeps with neighbouring modules. The application requirements are documented separately in the [receiving contract](../../../contracts/sales-aftercare-receiving.md), so this design can be reviewed without also reviewing a build plan.

The demonstration date is fixed at **16 September 2026** so overdue, due and upcoming scenarios remain reproducible. Every customer, person, site, equipment item, document, case, agreement and opportunity is fictional and labelled `SYN-`. The HTML changes only its own browser session. It does not operate the running PPO application, contact anyone, book anything, or write to any external system.

The package includes maintainable [design sources](../../../design/sales-aftercare/README.md), a deterministic builder, a model check, a native browser check, a [design decision and handover](../../../decisions/sales-aftercare-renewal-design.md) and the [receiving contract](../../../contracts/sales-aftercare-receiving.md).

| Deliverable | Path |
|---|---|
| Interactive standalone HTML | `docs/reference/ui/sales-aftercare/PPO-Sales-Aftercare-and-Renewal-Worklist-r01.html` |
| This report | `docs/reference/ui/sales-aftercare/PPO-Sales-Aftercare-and-Renewal-Worklist-Report-r01.md` |
| Maintainable sources | `docs/design/sales-aftercare/` |
| Builder | `scripts/build-sales-aftercare.py` |
| Model check | `scripts/check-sales-aftercare-model.mjs` |
| Native browser check | `scripts/check-sales-aftercare-browser.mjs` |
| Receiving contract | `docs/contracts/sales-aftercare-receiving.md` |
| Design decision and handover | `docs/decisions/sales-aftercare-renewal-design.md` |

## 2. Exact sources inspected

Inspected on 16 September 2026 against `main` head `0769a16dd842e9dc1c349a853036ab71949e7807` (merge of PR #209, 16 September 2026 08:54 UTC). Open pull requests at that point were #210 (ES-08), #211 (SH-03), #212 (ES-05/ES-06) and #213 (ES-07); none of them touch CR-05, `docs/design/sales-aftercare/` or `docs/reference/ui/sales-aftercare/`.

| Source | Revision inspected | How it is used here |
|---|---|---|
| [HTML page coverage register](../module-page-register/PPO-HTML-Page-Coverage-Register-r06.html) | r06 | CR-05 entry: state **N** (not started), placement **Page**, priority **P2**, reviewer **Sales lead**, entities *Opportunity, Activity, handover*, parents CRM-02/03/04/05/07/08, with three recorded checks. This design addresses that entry; the register entry state is not changed by the design existing. |
| [Theme & style board r20](../theme-style-board/powerplants-one-theme-style-board-r20.html) | r20 | Navy `#242a37`, green `#62bb46`, line `#e1e5eb`, muted `#596779`, link `#355b80`, info `#346580`, danger `#993b2a` and the Roboto family. Verified against the r20 file and reused unchanged. |
| [My Work & Action Centre r01](../my-work/PPO-My-Work-and-Action-Centre-r01.html) and its [sources](../../../design/my-work/README.md) | r01, merged by #209 | Register/worklist and detail-workspace patterns, filter panel, snapshot counts, drawer dialogs, recovery notices, storage and export/restore behaviour, and the Roboto `fonts.css` (copied byte for byte, SHA-256 `57b4aaf…`). Obligations raised here are described as projections of shared Activities, not a second task store. |
| [Service Cases & Triage r02](../service-cases/PPO-Service-Cases-and-Triage-Workspace-r02.html) | r02 | The shared synthetic customer context (`location-context` JSON): Willowbank Horticulture `SYN-PPO-ORG-000201`, sites `SYN-PPO-SIT-000301/302`, facilities `SYN-PPO-FAC-000401`–`000409`, asset `SYN-PPO-AST-000501`, contacts Casey Taylor / Jordan Lee / Sam Patel, secondary customer Fernbank Flower Farm `SYN-PPO-ORG-000900`, the internal user directory including Drew Wilson (Sales), and cases `SYN-PPO-TKT-000201`/`000203`. The intake and triage field set is reused for referrals rather than reinvented. |
| [Customers, Sites & Growing Areas r03](../customers/PPO-Customers-Sites-and-Growing-Areas-Workspace-r03.html) | r03 | Customer 360 context card shape, site/facility hierarchy and the source freshness/completeness treatment. |
| [Equipment & Installed Base r02](../equipment/PPO-Equipment-and-Installed-Base-Workspace-r02.html) | r02 | Model, serial, installed location and served-area separation, and the rule that a crop-impact label is not a diagnosis. |
| [Service Agreements & Maintenance r01](../maintenance/PPO-Service-Agreements-and-Maintenance-Workspace-r01.html) and its [sources](../../../design/maintenance/model.js) | r01 | MA-05 renewal review contract, reused exactly: `SYN-MA-RENEWAL-nn`, state `Open`, `crmState: "Activity preparation only"`, proposals with their own revisions, and agreement references `SYN-PPO-AGR-08010n` with source-defined expiry and review dates. |
| [Service Review & Reports r02](../service-review/PPO-Service-Review-and-Reports-Workspace-r02.html) | r02 | Issued report and customer response separation; the outstanding-response state used by `SYN-PPO-ACR-000902`. |
| [Warranty & Customer Resolution r01](../warranty/PPO-Warranty-and-Customer-Resolution-Workspace-r01.html) | r01 | Separation of customer outcome from supplier recovery, and the retention of original and successor assets. |
| [Project Delivery Readiness & Change Control](../projects/PPO-Project-Delivery-Readiness-and-Change-Control-r02.html) | filename r02, r01 content | Staged acceptance and closeout obligations, used by `SYN-PPO-ACR-000903`. |
| [Deals board r35](../crm/ppo-deal-pipeline_r35.html) | r35 | Opportunity card and stage vocabulary; qualification remains a CRM decision. |
| [Design index](../README.md) | r02 | Where a new design and its revision are recorded. |
| [PPO-STD-001](../../../standards/naming-conventions.md) and [ADR-0005](../../../decisions/ADR-0005-project-naming-adoption.md) | current | Separate UUID, readable reference, label, revision and state; six-digit synthetic sequences; `snake_case` fields, `PascalCase` types. |

### State of the modules CR-05 depends on

Checked rather than assumed. Recording this accurately matters because several "connections" in the brief are to things that do not exist yet.

| Module named in the brief | Actual state on `main`, 16 September 2026 | Dependency direction |
|---|---|---|
| Customer 360 (CS-01) | **Design only.** Register state D. The Customers, Sites & Growing Areas r03 workspace is a proposed design, not an accepted baseline. | Incoming: CR-05 reads customer, site, facility and equipment context. |
| CRM opportunity (CR-01), Deals r35 | Bounded runtime exists for Deals board, Leads, five-stage movement, Won/Lost and owner transfer. Opportunity detail tabs are design. | Outgoing: CR-05 prepares a handover; CRM decides qualification. |
| Order Fulfilment & Customer Delivery (SC-07) | **Not started.** Register state N; no design HTML exists. | Incoming: CR-05 reads a delivery reference and proof of delivery. Modelled here as a clearly labelled demonstration source; there is nothing to link to. |
| Service Cases (SC-04 extension) | r02 proposed workspace; bounded intake exists inside Service Operations. Draft PR #197 recorded in STATUS. | Outgoing: CR-05 prepares referrals into Service Cases intake and triage. |
| Equipment (EQ-01) | r02 proposed workspace; shared equipment context exists in the application. | Incoming: model, serial, installed location, served areas, configuration. |
| Service Agreements & Maintenance, MA-05 | r01 proposed workspace; only manual agreement references exist in the application. | Bidirectional read: CR-05 surfaces an open renewal review and links to it. It never writes. |
| My Work (SH-02) | r01 authorised design, merged by #209. No CR-05 route exists in `/work`. | Outgoing: owned obligations are projections of shared Activities. |
| Notifications (SH-03) | **Open contribution**, draft PR #211 on `design/notification-inbox-preferences-r01`. Not on `main`. | CR-05 raises no notifications in r01. Deliberately out of scope until SH-03 lands. |
| CS-07 Account development and visit plan | Register state N; no design exists. | Adjacent, deliberately excluded. See §4. |

**Nothing in CR-05 is implemented.** There is no route, service, schema, permission rule, adapter or migration for it. Every cross-module link in the HTML opens another standalone design document in a new tab; independent HTML sessions do not exchange records.

## 3. What CR-05 is

A worklist and review workspace for **post-delivery customer follow-up owned by Sales**. It answers three questions in order:

1. **Did the customer get what was intended?** — by showing what was supplied, commissioned and accepted, each with its own source, rather than inferring one from another.
2. **What support do they still need?** — outstanding commitments, unresolved technical concerns, training and documentation gaps.
3. **What should we follow up next?** — one next action with an owner and a date whose origin is recorded, plus evidence-supported commercial follow-up.

## 4. Boundaries

These are the lines the design holds. Each one is enforced in the model, not only stated in prose.

| Boundary | Where CR-05 stops |
|---|---|
| **Customer 360 (CS-01)** | CR-05 reads customer, site, facility, equipment and contact context and shows its `as_at` and completeness. It never edits a customer record, a site, a facility, an equipment record or a contact. Where two sources disagree about the account owner, CR-05 displays the conflict rather than choosing. |
| **CS-07 Account development and visit plan** | CS-07 owns territory and sector segmentation, relationship objectives, planned visit programmes and the account plan. CR-05 owns follow-up that arises from **a specific source event** — a delivery, a project stage, a visit, a resolved issue or an agreement expiry. An aftercare record always names its source event; a visit plan does not. If a review produces a broader account objective, that belongs in CS-07, and CR-05 records only the follow-up obligation it created. |
| **Service Cases (SC-04)** | CR-05 captures what the customer reported and prepares a referral. It performs no triage: no diagnosis, urgency category, priority, service level or permission to intervene is derived from free text. Service Cases owns intake, triage, priority, routing and resolution. Acceptance of a referral is Service's decision and is separate from resolution. |
| **MA-05 Renewals** | MA-05 owns agreement review, proposed successor terms, renewal acceptance and activation. CR-05 surfaces an open renewal review beside the Sales conversation and links to it. No aftercare action extends an agreement, varies its terms, infers warranty coverage or activates recurring maintenance. The model refuses to link an agreement that has no open MA-05 renewal review, and never writes to the agreement source. |
| **CRM (CR-01/CR-03)** | CR-05 prepares a handover carrying scope, recorded need, evidence, owner, next action and unresolved assumptions. CRM decides whether to accept it and applies its own qualification rules. An accepted handover produces an opportunity at Enquiry, explicitly **not qualified**. Originating from an existing customer is not qualification. |
| **My Work (SH-02)** | An obligation raised here is one shared Activity with one identity and one completion history. CR-05 shows a projection of it. It is not a second task store and it does not duplicate completion. |
| **Documents (DK-01/DK-02)** | CR-05 records which manual or procedure applies, at which revision, and raises a request. It stores no document bytes and creates no second repository. |
| **Scheduling** | Recording a requested training date is not a booking. Confirming an arrangement with the customer is not an appointment. Appointments, resources and travel belong to the scheduling workflow. |
| **Finance** | CR-05 records no price, quantity, cost, credit or invoice, and takes no Finance decision. |

## 5. The eleven distinct outcomes

The register entry for CR-05 is short, but the design problem is not. Most aftercare tooling fails by letting one completion imply another. This design makes that structurally impossible: each outcome is a separate fact with its own `value`, `source` and `as_at`, rendered as an outcome ledger in the record snapshot and in the review preparation panel.

| Outcome | Owned by | Never implied by |
|---|---|---|
| Goods delivered | Order fulfilment / delivery record | Anything else |
| Installation or commissioning completed | Service visit or project record | Delivery |
| Customer acceptance of a defined scope | Acceptance record, with its exact scope | Commissioning |
| Aftercare review conducted | **This module** | Any other outcome |
| Activity completed | Shared Activities | A review being completed |
| Technical issue resolved | Service Cases | A positive customer comment, or a referral being accepted |
| Training delivered | This module's training register | Attendance |
| Operator understanding or competence assessed | A separately defined assessment | Attendance or delivery |
| Opportunity created | CRM | A discussion, or a prepared handover |
| Renewal terms proposed | MA-05 | A conversation, or a linked renewal review |
| Renewed agreement accepted and activated | MA-05 | Proposed terms |

`SYN-PPO-ACR-000901` demonstrates the point: goods delivered, commissioned and accepted for the fertigation supply scope only, with an aftercare review outstanding and a technical issue open. Completing its review sets exactly one line.

## 6. Information model

### Aftercare record

| Field group | Fields |
|---|---|
| Identity | UUID, readable reference `SYN-PPO-ACR-nnnnnn`, record version |
| Customer scope | Organisation, site, facility/growing areas, equipment (name, model, serial, installed location, served areas, software/configuration) |
| Source | Kind (Order, Delivery, Project, Service visit, Resolved issue, Agreement), reference, title, date, **revision**, owner, read-as-at, completeness |
| Reason | Follow-up reason from a fixed list, plus the recorded basis for that reason |
| Ownership | Account owner, review owner — separate, and separate again from individual action owners |
| Date | Planned review date or null, plus a due basis: kind, detail, source reference and rule revision |
| State | Planned, Preparing, Review drafted, Review completed, Closed |
| Contact | Last contact or review date |
| Outcomes | The eleven facts in §5 |
| Commitments | Title, source, owner, due, disposition, disposition note |
| Review | See below |
| Concerns | See below |
| Training | See below |
| Commercial | See below |
| Obligations | Projected shared Activities: title, owner, due, state, source |
| Timeline and history | Every event, with actor, time, kind and reference |

### Review

Date, method (Site visit, Telephone call, Video call, Written response), participants with recorded roles, feedback items, reported benefits, remaining concerns, questions requiring clarification, agreed next steps, rating, rating basis, completion actor and time, and an append-only correction list. Review state is None → Draft → Saved → Completed.

Each **feedback item** carries a mandatory basis of **Quoted**, **Paraphrased** or **Internal interpretation**, plus the speaker and the time. The model refuses any other value, and validation rejects a stored session that contains one.

The **rating** is `Not assessed` by default and there is no mandatory satisfaction score. The rating basis states, on screen, that no scale, meaning, source or limit is defined in this design, and that `Not assessed` is preserved separately from a low score.

### Concern

Customer-reported symptom; exact site, equipment and configuration; when it occurs; reported operational or crop impact; evidence already available; troubleshooting already attempted; questions requiring specialist review; proposed receiving owner; next contact commitment. A concern either **links an existing case** or carries a **referral** with its own state and revision count.

### Training need

Readable reference `SYN-PPO-TRN-nnnnnn`; intended participants; equipment with model, serial and software/configuration; topic; identified gap; requested outcome; applicable material with reference, revision, state and an applicability statement; a flag when the material is superseded or missing; proposed trainer; target date; arrangement state and its note; attendance list; delivery flag and evidence; assessment value and its basis; remaining questions; follow-up owner and due date; optional document request.

### Commercial signal

Readable reference `SYN-PPO-CSG-nnnnnn`; kind (Maintenance, Renewal, Upgrade); source observation; identified need; recorded customer interest; agreement reference and revision; MA-05 renewal review identity; linked opportunity; owner; next action; open issues carried forward; optional handover.

### Handover

Readable reference `SYN-PPO-HDV-nnnnnn`; state; exact customer/site/equipment scope; recorded need; source evidence; receiving owner; next action; unresolved assumptions; open issues carried; confirmed receiving reference; returned reason; revision count; and an explicit qualification statement.

## 7. View 1 — Aftercare worklist

A searchable register of customer reviews and follow-up obligations.

**Columns.** Aftercare reference with customer, site, facility/growing area and equipment; source type, reference, revision and date with the source's completeness; account owner and review owner shown separately; outstanding commitments, actions, training needs and commercial discussions, with last contact; planned date with its due state, its **provenance chip** and the next action with its owner.

**Provenance chips.** A date is shown with where it came from: `User choice`, `Recorded commitment`, `Sourced rule` or `No date basis`. A record with no date shows **Date needed** — a real state, not a blank. The side panel explains the four kinds. No delivery, visit or project type carries an automatic review interval in this design, and the model refuses to record a planned date without a basis. A `Sourced rule` additionally requires the source reference and the exact rule revision.

**Views.** All aftercare, My follow-ups, Reviews due, Awaiting customer response, Needs internal action, Training outstanding, Renewal discussions.

**Filters.** Search across reference, source reference, reason, owners, customer, site, area and equipment; customer; site; owner; source type; follow-up reason; state; due date. Filters combine, and a Clear control resets them.

**Counts.** Reviews due, Date needed, Outstanding commitments, Commercial follow-up. Each count is a button that switches to the exact contributing view; a **Back to …** control then restores the previous view, saved view and filters. When a selected record falls outside the current filters, the side panel says so explicitly rather than dropping it.

**Repeat generation.** CR-05 r01 does not generate aftercare records on a schedule. The brief's condition — identify the exact source event and rule revision, preview the result and prevent duplicates — is not met by any rule that exists, so no generator is demonstrated. The due-basis field is the mechanism that would carry a rule revision if one were adopted. This is recorded as an open decision in §16.

## 8. View 2 — Customer review

Split into what is known **before** the review and what is captured **during or after** it.

**Before.** Exact scope (customer, site, growing areas); equipment with model, serial and configuration; the source record with its revision and date; source freshness and completeness; the purpose of the review and its intended outcome; the eleven-line outcome ledger; open cases, warranty matters and unresolved findings for the customer, each linking to Service Cases; outstanding promises and documentation with their disposition controls; existing maintenance agreements with coverage, source-defined expiry and any open MA-05 renewal review; relevant contacts with their recorded roles **and their recorded authority**; and previous customer feedback.

**During or after.** Review date and method; participants and their recorded roles; feedback in clear language with its basis; reported benefits; remaining concerns; questions requiring technical or commercial clarification; agreed next steps with owners and due dates; supporting notes and document references; rating with its stated meaning and limits.

**Mixed outcomes.** A two-column comparison sets customer statements beside measured or independently verified results, under an explicit statement that a positive comment certifies nothing. `SYN-PPO-ACR-000903` is seeded as exactly this case: satisfactory installed work reported, alongside an unissued as-built document and an undiscussed excluded scope.

**Completion.** A review can be completed while follow-up remains open, provided every outstanding commitment has a disposition and every remaining step and obligation has an owner and a due date. The model refuses completion otherwise, naming the commitments that block it. Completion sets only the aftercare outcome; the review outcome and the outstanding work are then displayed separately.

**Correction.** A completed review is corrected by appending a dated, attributed, explained correction. The original record, its feedback and its completion stamp are retained unchanged. Adding new feedback to a completed review is refused and directed to the correction path.

## 9. View 3 — Training & follow-up

A register and a detail drawer.

**Register columns.** Need reference with customer and originating aftercare record; equipment, configuration and the selected material with its state and applicability flag; arrangement state with target date and trainer; attendance, delivery and assessment as three separate badges; follow-up owner and due date.

**Five separate states.** Planned → Confirmed → Attendance → Delivered → Assessed. Each transition is its own command with its own guard:

* Confirming requires an explicit acknowledgement that the scheduling workflow owns the booking, and the stored note says no appointment was created.
* Attendance requires a confirmed arrangement and does not set delivery.
* Delivery requires recorded attendance and evidence, and sets an owned follow-up.
* Assessment requires recorded delivery, a stated method and its limits. `Not assessed` is preserved as a distinct value.

The model refuses attendance before confirmation, delivery before attendance and assessment before delivery, and validation rejects a stored session where an assessment precedes delivery.

**Material applicability.** Material is matched against the exact model and software/configuration. `SYN-PPO-TRN-000701` is seeded with manual `SYN-PPO-DOC-000301 r02`, written for firmware 3.x, against a unit delivered on firmware 4.2 — flagged as superseded with `r03` named as the current issue. Selecting no material at all is flagged as unresolved applicability rather than silently accepted. A Preview options scenario supersedes a currently issued revision mid-session, so the "superseded after selection" case is reviewable.

**Documents.** A document request is prepared for the established document workflow with what is needed, an owner and a due date. CR-05 stores nothing and refuses a second request for the same need.

## 10. View 4 — Maintenance, renewal & upgrade discussions

A worklist of evidence-supported commercial follow-up.

**Columns.** Discussion reference and kind with its originating aftercare record and source observation; customer, site and growing-area scope with any recorded customer interest; existing agreement with its exact revision, the source-defined expiry and review date, and the linked MA-05 renewal review; open technical and customer issues; owner and next action.

**Four distinct commercial states**, rendered as a stepper: an informal discussion, a prepared opportunity, a quotation (owned by Estimating & Quotation) and an accepted agreement (owned by MA-05) — with a fifth panel stating that no step implies the next.

**Guards.**

* A discussion requires a recorded source observation **and** an identified customer need. An unverified performance concern is not turned into a product recommendation.
* Linking a renewal review requires an open MA-05 review on the named agreement revision. The agreement source is never written to — the browser check compares the serialised agreement collection before and after.
* Linking an existing opportunity requires an explicit acknowledgement that the existing opportunities were reviewed, and refuses a second link.
* Preparing a handover is refused where an opportunity is already linked, and requires the same deliberate review.
* Every open technical and customer issue for the customer is carried onto the discussion and shown when a handover is prepared. Unresolved issues stay visible while commercial follow-up is planned.

## 11. View 5 — History & commercial handover

A single chronological list, grouped by kind: source events; review preparation and completed reviews; customer feedback and corrections; training and documentation actions; service referrals and receiving outcomes; maintenance and renewal discussions; CRM handover preparation and confirmed receiving references.

**Handover panel.** Reference and state; exact customer/site/equipment scope; recorded need; source evidence; receiving owner; next action; unresolved assumptions; open issues carried; the qualification statement; the confirmed receiving reference; any returned reason; and the revision count. Submit and receiving-outcome controls are enabled only for the roles that hold them.

**Receiving outcomes** are shown as they actually are: Prepared, Submitted, Accepted with a confirmed reference, Returned with a reason, or **Unknown**. An unknown outcome blocks a further submission on that record until it is reconciled.

**Links back** to Customer 360 and to the originating delivery, project, visit, resolved issue or agreement, with a plain statement that these are separate standalone design sessions and that receiving functionality is outstanding.

## 12. Actions and state transitions

| Action | Preconditions | Effect | What it explicitly does not do |
|---|---|---|---|
| Set or change the review date | Record not closed; a basis is chosen and detailed; a sourced rule names its reference and revision | Sets the date or `Date needed` with its basis | Apply a default interval |
| Change owners | Record not closed | Records account and review owner with a reason | Transfer individual action owners |
| Open review preparation | State Planned or Preparing | Takes a source snapshot | Contact the customer |
| Record feedback | Review not completed; basis and speaker given | Appends one feedback item | Change a measured outcome |
| Save review detail | Review not completed; date, method, ≥1 participant | Saves a draft | Complete anything |
| Add agreed next step | Review not completed | Records the step and one projected obligation | Create a second task record |
| Record commitment disposition | An open commitment | Sets the disposition; a carried commitment gains an owner, due date and obligation | Close the underlying promise silently |
| Complete review | Saved or drafted; feedback present; no open commitment; every step and obligation owned and dated | Sets only the aftercare outcome; state → Review completed | Complete delivery, acceptance, an Activity, an issue, training, an assessment, an opportunity or a renewal |
| Record a correction | Review completed | Appends a dated, explained correction | Overwrite or delete the original |
| Link an existing case | Case exists for this customer; not already linked | Records a concern linked to that case | Merge records, or create a second case |
| Prepare a Service referral | All receiving fields present; duplicate check acknowledged | Creates a referral at Prepared | Submit it, or imply a diagnosis, urgency or service level |
| Submit referral | State Prepared | State → Submitted | Establish that Service accepted it |
| Record referral outcome | State Submitted or Unknown; held by Service | Accepted (with reference), Returned (with reason) or Unknown | Resolve the issue |
| Correct and resubmit | State Returned | Appends the missing information; revision + 1 | Rewrite the original request or the return reason |
| Record a training need | Participants, topic, outcome, trainer, target given | Creates the need with resolved material applicability | Book anything |
| Confirm arrangement | State Requested; acknowledgement given | State → Confirmed | Create an appointment or allocate a resource |
| Record attendance | Arrangement Confirmed | Records who attended | Set delivery or competence |
| Record delivery | Attendance recorded; evidence given | Sets the training-delivered outcome and an owned follow-up | Set competence |
| Record assessment | Delivery recorded; method and limits given | Sets the competence outcome with its basis | Establish a qualification or an authorisation |
| Request a document | No existing request for this need | Prepares a request for the document workflow | Store a document |
| Prepare a commercial discussion | Observation and need given | Creates the discussion, carrying open issues | Create an opportunity or a quotation |
| Link an MA-05 renewal review | Agreement has an open renewal review; not already linked | Records the link | Write to the agreement, extend it, or activate maintenance |
| Link an existing opportunity | Opportunity exists; review acknowledged; not already linked | Records the link and the CRM outcome value | Change the opportunity's stage or qualification |
| Prepare a CRM handover | No linked opportunity; review acknowledged; all fields present | Creates the handover at Prepared | Create an opportunity |
| Submit handover | State Prepared | State → Submitted | Establish acceptance |
| Record handover outcome | State Submitted or Unknown; held by Commercial | Accepted creates an unqualified Enquiry opportunity; Returned records the reason; Unknown blocks resubmission | Qualify the opportunity |
| Close the record | Review completed; no open commitment or obligation; every receiving outcome reconciled | State → Closed | Close a case, training need, agreement or opportunity |

## 13. Permissions

Proposed capabilities, held by roles rather than by named employees. The preview role selector is a presentation control; it authenticates nobody.

| Preview role | Synthetic identity | Capabilities | Customer scope |
|---|---|---|---|
| Account owner | Drew Wilson · Sales | plan, prepare, review, feedback, complete, correct, concern, refer, training, document, commercial, handover, commitment, scenario | Both customers |
| Aftercare review owner | Riley Chen · Customer service | plan, prepare, review, feedback, complete, correct, concern, refer, training, document, commitment, scenario | Both customers |
| Service reviewer (receiving) | Alex Morgan · Service Manager | receive referral outcomes, read concerns | Both customers |
| Training coordinator | Morgan Ellis | training, document | Willowbank only |
| Commercial reviewer | Avery Cole | commercial, handover, receive handover outcomes | Both customers |
| Read-only observer | Jamie Walker | none | Willowbank only |

Customer scope applies uniformly to records, queries, saved views, counts, search, the filter option lists and snapshots. The training role cannot see Fernbank Flower Farm in any of them, and the browser check verifies that the customer filter does not even offer it. A session export contains the complete fixture including records outside the selected role, and the export dialog says so.

No real employee is assigned authority by these names. Departmental roles remain proposed.

## 14. Persistence and recovery

Browser `localStorage` under `ppo-sales-aftercare-r01` in one browser, on one device. The design says so on screen and never implies cross-device sync or production offline capability.

| Situation | Behaviour |
|---|---|
| Source record changes during review | A Preview options scenario advances the source revision. The record's completeness reads `Changed · …`, the completed review is retained and a correction entry records that reassessment is needed. |
| Concurrent edits to a record | Commands carry the record version. A stale version is refused with a message that keeps the user's entries, and the state is unchanged. |
| Concurrent session change | Commands carry the session version. A stale session is refused the same way. |
| A follow-up already created from the same source event | Duplicate references are rejected by validation; linking the same case twice, preparing a second handover, linking a second opportunity and making a second document request are each refused. |
| Customer and identity switching | Changing role reselects a permitted record, resets the filters and saved view, and never carries a record from a customer outside scope. |
| Access changes during an open workflow | Controls are re-evaluated on every render; a role without the capability sees the control disabled, and the model refuses it regardless. |
| Local storage failure | A visible notice states that the session is memory-only and that records should be exported before closing. The workspace keeps working. |
| Save failure | A Preview options scenario fails the next save before it is recorded. The form keeps every entry, the version is unchanged, and retrying the same form succeeds. |
| Lost response after submitting | A scenario loses the response. A recovery banner appears; **Recover original save** replays the original operation identity, which is recognised, returns the original result and creates no duplicate referral, handover, obligation or opportunity. |
| Reused identity, different content | Refused, with a message directing the user to reconcile the original result. |
| Partial or unknown receiving outcome | Recorded as `Unknown`, displayed as unknown, and blocking a further submission until reconciled. |
| Another tab changes the session | The workspace stops writing, says the other tab's session is newer, and offers export. |
| Malformed stored session | The original stored content is preserved and offered for export before any reset. |

**Nothing is sent.** No email, invitation, customer message, booking, calendar entry or external record is created by the demonstration.

## 15. Synthetic demonstration journeys

All ten journeys the brief asks for are present and reviewable.

| # | Journey | Where |
|---|---|---|
| 1 | Customer review following delivery, with positive feedback and a separate technical concern | `SYN-PPO-ACR-000901` — delivery `SYN-PPO-DLV-000551`, commissioning `SYN-PPO-WO-000503`, open case `SYN-PPO-TKT-000201` |
| 2 | Technical concern linked to an existing case rather than duplicated | Link `SYN-PPO-TKT-000201` from the record snapshot; the candidate list ranks by equipment, area and wording, and never merges |
| 3 | New concern prepared for Service, returned for missing information, corrected and resubmitted | Prepare `SYN-PPO-REF-000801`, submit, switch to the Service Manager to return it, correct, resubmit, accept as `SYN-PPO-TKT-000204` |
| 4 | Training need with exact equipment and material applicability, and an owned follow-up | `SYN-PPO-TRN-000701` on `SYN-WB-D12-260714` running firmware 4.2, with superseded manual `SYN-PPO-DOC-000301 r02` |
| 5 | Maintenance discussion linked to an existing MA-05 renewal review | `SYN-PPO-CSG-000601` linked to `SYN-MA-RENEWAL-14` on `SYN-PPO-AGR-080101 r02` |
| 6 | Proposed upgrade linked to an existing opportunity, or deliberately prepared as a new CRM handover | Either: link `SYN-PPO-OPP-000041`, or prepare `SYN-PPO-HDV-000651` on `SYN-PPO-ACR-000903` for the excluded Irrigation Block 02 scope |
| 7 | Completed review with unresolved actions still visible | `SYN-PPO-ACR-000903` — review completed 11 September 2026 with two obligations carried |
| 8 | Source change or superseded document requiring review | Preview options → Demonstrate a source change, in both variants |
| 9 | Lost handover response recovered without duplicate work | Preview options → next save loses its response; submit a handover; Recover original save |
| 10 | Switching customers and identities without mixing records | Switch to the Training coordinator: Fernbank Flower Farm `SYN-PPO-ORG-000900` disappears from records, counts, search and the filter list |

The **primary journey** runs Customer 360 → aftercare review on `SYN-PPO-ACR-000901` → Service referral and training follow-up → the maintenance discussion on `SYN-PPO-ACR-000904`. The in-page guide walks it step by step.

## 16. Working HTML interactions versus proposed application functionality

| Working in the standalone HTML | Proposed only; not implemented anywhere |
|---|---|
| Five views, filters, search, saved views, counts that open their contributing records, and Back with preserved context | Server-side permission and scope enforcement |
| Every command in §12, with its guards, against the local fixture | Persistence beyond one browser; any shared or multi-user state |
| Version conflict, duplicate prevention, retry idempotency and lost-response recovery | Durable outbox, real receipts and cross-service reconciliation |
| Session export, restore and malformed-session preservation | Any real integration with Customer 360, Service Cases, MA-05, CRM, My Work, Documents or Scheduling |
| Role switching as a presentation control | Authentication, authorisation or identity |
| Source-change and superseded-document scenarios | Real source-change detection from another module |
| Receiving outcomes recorded by switching preview role | An actual receiving system deciding anything |
| Responsive desktop and phone layouts, keyboard navigation, focus return | Notifications (SH-03 is an open contribution, not on `main`) |

## 17. Capability-to-HTML-and-verification traceability

| # | Capability from the brief | Where it is in the HTML | Verification |
|---|---|---|---|
| C-01 | Identify customers requiring follow-up | Worklist table, seven saved views, four counts | Model: filters/views/counts. Browser: five views render; counts open the contributing records |
| C-02 | Prepare for a useful customer review | Review view, "Before the review" panel | Browser: record snapshot shows eleven outcomes with their own sources |
| C-03 | Record feedback against the relevant work or equipment | Review capture; feedback items with basis and speaker | Model: feedback basis mandatory. Browser: completing a review is refused while a commitment is open (exercised after recording feedback) |
| C-04 | Identify training, documentation and support needs | Training register and drawer; document request | Model: applicability resolution and the five states. Browser: applicability flagged, five states separate |
| C-05 | Assign accountable follow-up | Agreed next steps, commitment dispositions, owner changes | Model: ownership recorded without transferring action owners; step creates one obligation |
| C-06 | Refer technical issues to Service | Concern block; link case; prepare/submit/revise referral | Model: duplicate check, four referral states. Browser: prepared → submitted → returned → corrected → resubmitted → accepted |
| C-07 | Prepare maintenance, renewal or upgrade discussions | Commercial view, four-state stepper, MA-05 link | Model: MA-05 link guards. Browser: agreement source unchanged by linking |
| C-08 | Track receiving outcomes without losing commitments | History view, handover panel, obligation panels | Model: unknown blocks resubmission. Browser: lost response recovered, no duplicate opportunity |
| C-09 | Preserve the eleven distinct outcomes | Outcome ledger in review preparation and record snapshot | Model: completing a review changes only the aftercare line. Browser: eleven ledger rows present |
| C-10 | Explicit due-date provenance | Provenance chips, due-basis panel, plan form | Model: no basis, no date; sourced rule needs its revision. Browser: a date cannot be saved without a recorded basis |
| C-11 | Summary counts open exact records, context preserved | Count buttons, Back control | Browser: renewal count opens one record; Back restores view and filters |
| C-12 | Draft, saved and completed review states; corrections retained | Review stepper, correction path | Model: correction appends and never overwrites |
| C-13 | Mixed outcomes in one review | Mixed-outcomes comparison; `SYN-PPO-ACR-000903` | Browser: completed review keeps its obligations visible |
| C-14 | No mandatory satisfaction score | Rating shown as `Not assessed` with its stated limits | Model: rating basis retained in validation; no command sets a score |
| C-15 | Attendance is not competence | Three separate badges; separate commands | Model: assessment refused before delivery; delivery does not set competence |
| C-16 | Permissions, scope and disclosure | Role scope on records, queries, counts, search, filter lists | Model: scope on every role and view. Browser: the training role cannot see, search or count Fernbank |
| C-17 | Recovery behaviour | Recovery banner, scenarios, export/restore | Model: idempotent replay; stale version refusals. Browser: failed save retains entries; malformed session preserved |
| C-18 | Responsive and accessible | r20 layout, 44px targets, keyboard tab strip, focus return | Browser: no horizontal scroll at 390px; no control under 44px; arrow/Home/End navigation; focus returns to the trigger |

## 18. Verification actually performed

Run on 16 September 2026 in this session, against the built HTML.

| Check | Command | Result |
|---|---|---|
| Deterministic build | `python3 scripts/build-sales-aftercare.py` | Rebuilt and printed the SHA-256 of the output |
| Source model | `node scripts/check-sales-aftercare-model.mjs` | **29 groups passed** |
| Native browser | `node scripts/check-sales-aftercare-browser.mjs` | **21 groups passed**, no page or console errors, on HTML `403a0a18…` using Chrome `141.0.7390.37` |
| Documentation foundation | `python3 scripts/check_foundation.py` | Passed |
| Prototype package | `python3 scripts/check_prototype.py` | Passed |
| Naming and register | `python3 scripts/check_naming.py` | Passed |
| Conflict markers | `git --no-pager grep -n -E "^(<<<<<<<\|=======$\|>>>>>>>)" -- docs` | No matches |
| Visual inspection | Desktop 1440×960 and phone 390×844 captures of all five views plus drawers and scenario states | 12 captures reviewed; findings and exact hashes in the [verification record](../../../testing/evidence/sales-aftercare-r01/visual-review.json) |

The browser used here is **not** the repository's pinned CI runtime (Playwright 1.63.0 with Chrome 153); `node_modules` was not installed in this session, so Playwright resolved from the environment. Any CI result must be read from its own run. Seven defects found during this session — duplicated history entries, counts that ignored the source scenario, stale dialog error text, duplicate-check candidates that depended on typed text, worklist column balance, phone reachability of the review capture form, and duplicated wording — were fixed in the sources before the final run. They are listed in the [verification record](../../../testing/evidence/sales-aftercare-r01/README.md).

**Accessibility checks performed.** Every interactive control is at least 44px high at phone width (asserted programmatically across buttons, links styled as buttons, selects and text inputs). No horizontal page scroll at 390px in the worklist or the review view. The view tab strip supports Arrow, Home and End. Opening a record drawer with Enter and closing it with Escape returns focus to the triggering control. Closing a dirty form asks before discarding entries. Colour is never the only signal — every badge carries text. Contrast uses the r20 tokens unchanged.

**Not verified.** No screen-reader pass, no assistive-technology testing, no zoom or reflow testing beyond the two widths, no colour-contrast measurement tool run, no cross-browser testing beyond the single browser recorded in the results file, no device testing, and no owner acceptance. No application behaviour was tested because none exists.

## 19. Open policy and integration decisions

| # | Decision needed | Consequence while it is open |
|---|---|---|
| D-01 | Follow-up intervals — whether any exist, per source type, with an owner and a revision | Every review date must come from a user choice or a recorded commitment. No generator can be built. |
| D-02 | Competence definition and assessment method | `Assessed` records only an observation and its stated limits. It authorises nothing. |
| D-03 | Satisfaction measurement — scale, meaning, source, limits | No rating is captured beyond `Not assessed`. |
| D-04 | Purchasing authority on contacts | Commercial follow-up cannot rely on any contact being able to commit. |
| D-05 | Account owner of record — the shared location fixture and Service Cases r02 disagree | CR-05 displays the conflict rather than choosing. |
| D-06 | Whether aftercare records are generated from source events at all | r01 generates none; all six are seeded as prepared fixtures. |
| D-07 | Retention and visibility of quoted customer statements | Feedback is stored in full in the local session and in exports. |
| D-08 | Reference series allocation for `ACR`, `REF`, `TRN`, `CSG`, `HDV`, `DKR` | Proposed synthetic series only; no operational counter is allocated. |
| D-09 | Whether SH-03 notifications carry aftercare events once it lands | CR-05 r01 raises no notifications. |
| D-10 | Whether SC-07 account planning consumes aftercare outcomes | The boundary is stated but no interface is designed. |

## 20. Limitations and the next bounded increment

**Limitations.**

* Design only. Nothing here is implemented, accepted or deployed.
* One browser, one device, one session. Export is the only way to move data, and it carries the full fixture including out-of-scope records.
* Preview roles are not authentication. Every permission statement is a proposal for the server.
* Receiving outcomes are recorded by switching preview role. No receiving system decided anything.
* Order fulfilment and customer delivery (SC-07) does not exist; the delivery source is a labelled demonstration reference.
* Notifications are out of scope while SH-03 is an open contribution.
* Six synthetic aftercare records across two customers. This exercises the distinctions; it does not exercise scale, and no performance claim is made.
* The demonstration date is fixed. Overdue and due-today states are relative to 16 September 2026.

**Next bounded increment, if this design is accepted.** Decide D-01 (follow-up intervals) and D-05 (account owner of record), then implement a read-only CR-05 worklist over existing customer, case and agreement data: the register, its filters and saved views, the outcome ledger populated from real source reads with their freshness, and the record snapshot — with server-enforced customer scope and no write commands at all. Review capture, referrals, training and the CRM handover would then follow as separate increments, each with its own receiving agreement, because each crosses a module boundary that currently has no interface.

---

*All records, people, sites, equipment, documents, cases, agreements and opportunities in this design are synthetic. Roboto is copyright 2011 Google Inc., licensed under the Apache License 2.0. The theme derives from the attached Powerplants One theme and style board r20.*
