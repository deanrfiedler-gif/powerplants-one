# Site Access & Horticultural Readiness — design and feature report

| Document control | Value |
|---|---|
| Product / module | Powerplants One · CS-06 · Customers, Sites & Growing Areas |
| Document ID | PPO-CS-ACCESS-REPORT |
| Revision / date | r01 · 16 September 2026 |
| Owner | Dean Fiedler |
| State | Proposed standalone interactive design; application integration and owner acceptance remain separate |
| Interactive deliverable | [Site Access & Horticultural Readiness r01](PPO-Site-Access-and-Horticultural-Readiness-r01.html) |
| Source main | `07eb34d5df5ea430c365da78e160cb6aa0b76f20` |
| Design source | Supplied Powerplants One Theme & Style Board r20; SHA-256 `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617` |
| Design handover / verification | [Decision and receiving boundaries](../../../decisions/site-access-readiness-design.md) · [Verification record](../../../testing/evidence/site-access-r01/README.md) |

## 1. Purpose and business question

The workspace answers: **What applies here, what is missing, and who needs to confirm it?** It connects site instructions to a selected facility or growing area and a specific proposed visit. Coordinators can inspect sourced access requirements, evaluate crop-sensitive timing, record visitor and preparation evidence, assign clarification and retain the exact preparation basis for downstream review.

The page deliberately distinguishes a current source instruction, reviewed supporting evidence, personal acknowledgement and authority to perform work. A person reading an instruction cannot resolve a missing induction, approve a shutdown or grant blanket access. A facility’s structural type and its position in the hierarchy do not establish its readiness.

This is a self-contained HTML design using synthetic records. It demonstrates local workflows and their information requirements. It does not implement authenticated application services, perform equipment control, communicate with visitors or customers, book attendance, issue controlled documents or authorise field work.

## 2. Scope, source authority and traceability

The request matches **CS-06**, including the later site-approved visitor/contact, movement and clean-down extension in the [r04 coverage audit](../module-page-register/PPO-HTML-Page-Coverage-Audit-r04.md). It elaborates adopted feature **F08 — Horticulture-specific visit readiness**, with parent requirements **PRJ-04, SVC-03/04/06/10 and NFR-02**. It contributes design evidence toward F08-A; it does not complete that acceptance procedure or close [issue #181](https://github.com/deanrfiedler-gif/powerplants-one/issues/181).

The existing [Customers, Sites & Growing Areas r03 design](../customers/PPO-Customers-Sites-and-Growing-Areas-Workspace-r03.html) remains the hierarchy reference. Its Visit requirements view is retained, while this workspace provides the dedicated readiness journey. The [Service blueprint](../../../blueprints/BP-07-service-operations.md) and existing scheduling, work-scope and pack contracts continue to own operational authority. In particular, booking preparation is distinct from dispatch/start readiness.

All original parent identifiers and issued reference files remain unchanged. Open Quality, My Work and Notifications contributions were inspected as related design references; this package does not merge their code or imply that their receiving contracts are implemented.

## 3. Workspace composition and persistent context

The HTML is an operational workspace without a duplicated application rail. It follows the nearby Customers/Sites module’s workspace-only composition. A single page heading, short business question, guide and Preview options precede a compact synthetic-environment indicator and local-save status.

A shared context panel remains above all six views:

| Field | Meaning and behaviour |
|---|---|
| Site | Selects one of two fictional Willowbank Horticulture sites; changes the available destination list. |
| Facility / growing area | Selects the exact destination; display includes its readable reference, structure/type, use and dated demonstration crop context. |
| Parent relationship | Appears where present as location context only; no readiness inheritance occurs. |
| Visit date | A site-local date from the fixed demonstration date, 16 September 2026, through 31 December 2027. |
| Start / finish | Same-day site-local attendance interval. The complete interval must fit every applicable recorded window. |
| Work activity | Irrigation interruption or inspection without interruption. Shutdown-specific requirements are excluded for the inspection activity. |
| Attending crew | Riley Chen and Morgan Lee, or Riley alone. Each included person needs their own induction evidence. |
| Timezone | Both synthetic sites use Australia/Brisbane, UTC+10. Labels state the site-local basis explicitly. |

Changing this context recalculates the active view. Missing dates, reverse time ranges or an invalid visit suppress the readiness result and display a correction message. Context controls are session selections; business evidence and source changes have explicit saves. Reload returns to the initial visit selection while preserving valid saved records.

## 4. Overview

The Overview gives coordinators an immediate preparation summary, with four navigable metrics: applicable requirements, requirements needing attention, instruction drafts awaiting review and current crew acknowledgements. Counts refer to the selected facility, activity, crew and visit. They are evidence counts, not a percentage of work permission.

The attention list names each affected instruction, describes its missing or outdated prerequisite, identifies the owner and displays the category and review date. Review opens the exact source detail. A separate crop-context panel reminds the reader that descriptors are contextual and do not create access rules.

A visitor brief shows the named site contact, arrival route, exact destination and pre-entry reminders. Connected preparation identifies a synthetic work-order reference and clearly states that attendance is not booked, no crew is reserved and controlled pack checks remain in Service. The receiving-context dialog presents the selected identity and visit information alongside repository design links.

## 5. Requirements

The Requirements register shows current applicable instructions. Search matches title, instruction, owner and readable reference; category and Needs attention filters operate on the same scoped records. Columns contain requirement title, category, source reference, source revision, explicit applicability, accountable owner, review date and the current visit result. On phones, these become labelled record blocks rather than a wide table.

A disclosure lists other requirements at the same site that are excluded because of facility or activity scope. This makes the absence of inherited greenhouse, tunnel or sibling rules observable. An empty filtered result provides a Clear filters action.

Each source dialog displays the instruction text, requirement reference/revision, category, applicability, activity, source reference/date, source status, named site approver, owner and review date. Existing seasonal instructions also expose the recorded season and daily permitted window. The current missing-evidence or timing reasons appear beside the source.

Coordinators can create a new requirement draft or prepare a successor to an existing instruction. New drafts capture category, activity and required evidence type; both paths capture title, instruction, owner, source/date, review date, applicability and change reason. Applicability is either an explicit site-wide instruction or an explicit selection of same-site destinations. The form requires a scope confirmation. Existing window-bearing requirements also expose editable season and daily start/finish fields. Adding a new structured seasonal-window definition is a subsequent extension; the delivered new-requirement form records its prose and evidence requirements.

Drafts do not replace the active source. The reviewer compares active and proposed wording, scope, dates, source and owner, then publishes the reviewed source or returns the draft with a reason. Publishing records the named site approver and increments the source revision; the original is retained in history. An unreviewed draft cannot establish a site instruction. Pending drafts remain visible alongside the active evidence result and require review before operational reliance.

## 6. Visitor, biosecurity and evidence records

The evidence view separates the site instruction from evidence that its prerequisites have been met. Cards display type, person, recorded evidence details, applicability, named site approver, source reference, recorder, performed/source date, review date and status. A dedicated inspection dialog shows the exact source excerpt and whether the evidence belongs to a specific visit.

The delivered record types are:

| Evidence type | Scope and evaluation |
|---|---|
| Contact approval | Records the nominated site contact/visitor arrangement and source. It is not a generic right to enter every crop area. |
| Movement plan | Defines an approved route and explicit destinations; the starter greenhouse/shed route excludes the nested propagation bay. |
| Induction | Identifies one attending person. Validity is checked separately for each selected crew member. |
| Clean-down | Names the site-approved evidence and exact destination; bound to facility, visit date, times, activity and crew. |
| Shutdown approval | Bound to the same exact visit context; a recorded approval cannot override the separate crop-sensitive timing restriction. |
| Tool check | Requires the service tool identity and calibration/check reference. It is distinct from customer equipment and saleable stock. |

Coordinator entry creates **Captured** evidence. Site reviewer entry or a subsequent review establishes **Reviewed** evidence within the simulation. An expired, future-effective, differently scoped or differently bound record does not satisfy a current prerequisite. Records outside the selected scope are excluded, with their count shown. Original evidence remains after a later record is added.

New evidence applies to the selected facility only. The fixed demonstration date prevents asserting future clean-down performance; clean-down capture is limited to 16 September 2026. Advance shutdown approval may be recorded for a future exact visit using a source dated on or before the demonstration date, with validity covering that visit. It remains approval evidence, not a record that a shutdown occurred. Broader visitor rosters, external file uploads, evidence withdrawal and production credential management remain receiving implementation work. The source text is a synthetic excerpt; no live attachment repository is connected.

## 7. Seasonal work windows and crop-sensitive shutdown

The Work windows view presents recorded season dates, daily allowed time, instruction wording, source, owner and review date. A 24-hour strip compares the allowed daily interval with the proposed attendance. The exact date and time text remains available independently of colour or the bar.

The greenhouse example allows crop access between 14:00 and 16:30 during September. Its irrigation interruption rule is narrower, between 14:30 and 15:30, and additionally requires exact-visit shutdown evidence. A visit beginning before an allowed start or finishing after an allowed end remains blocked. Boundary equality is allowed in this synthetic rule set. Attendance outside the recorded season remains blocked even if the time of day matches.

For a non-interrupting inspection, the shutdown-specific instruction appears as reference-only in this view and is excluded from the active readiness assessment. Other applicable access, induction, biosecurity and tool requirements remain. Where no seasonal window exists, the interface says so; it does not describe the facility as unrestricted.

The delivered model uses the two Queensland site timezones. Overnight work, multiple daily windows, recurring weekday exceptions, daylight-saving regions, shared isolation/control groups and automatic downstream rescheduling require explicit additional definitions. These are boundaries, not inferred operating permissions. No irrigation equipment state is read or changed.

## 8. Visit preparation and acknowledgement

Visit preparation assembles all applicable requirements into an evidence checklist with source revision, owner, review date and explanatory gaps. Rows distinguish **Needs attention** from **Current evidence**. The aggregate state is **Preparation blocked** or **Prerequisites recorded**; the interface never converts the latter into work authorisation.

Each selected crew member can record a simulated acknowledgement. It is bound to the exact visit, instruction set and evidence set, and is idempotent for that exact person/basis. It does not alter readiness, resolve a clarification or create permission. Source, evidence or visit changes require a fresh acknowledgement; earlier ones remain visible as historical records.

A retained preparation snapshot freezes the visit, applicable instructions, their source revisions, relevant evidence, assessment, blockers and exact acknowledgements. Retaining a blocked snapshot is permitted because it is useful review evidence. Duplicate retention of an identical basis is refused. Its authority field is explicitly **Not granted**.

Work-order authorisation, appointment confirmation, issued pack state, dispatch readiness and permission to start are displayed as separate receiving checks. This distinction remains even after all demonstrated prerequisites are current.

## 9. Review, clarification and history

Review & history brings together pending instruction drafts, owned clarifications, retained preparation snapshots and an activity history. Draft review preserves active sources until a reviewed successor is recorded. New instructions start at r01 when published. Return decisions remove the pending draft and retain the reason in history; they do not alter the active instruction.

Creating a clarification captures an owner, due date and concrete next action for the chosen requirement and facility. Duplicate open clarifications for the same pair are refused. The local action stays Open; reading sources, acknowledging instructions or retaining snapshots does not complete it. Actual completion and notification delivery belong to the receiving action workflow.

Snapshots display their original preparation result and whether their exact basis still matches the current selection. A changed source, evidence set or visit marks the record **Recheck required**. Inspection exposes the original wording, revision, applicability and review dates. Downloading a snapshot preserves the full original JSON including evidence and acknowledgements.

History records local timestamps, preview actor, action and reason. Source publication retains complete before/after objects in the export. The visible history covers both demonstration sites; this is stated in the view and is not an operational permission model.

## 10. Demonstration records and scenarios

The fixture uses Willowbank Horticulture, two addressed site contexts and eight distinct locations: Greenhouse 01, nested Propagation Bay A, Tunnel 01, Propagation House 01, Pack Room 01, Irrigation Shed 01, Irrigation Block 01 and Open Field 02. A propagation facility’s function is separate from its recorded greenhouse structure; support facilities explicitly carry non-growing use.

Fifteen initial requirements cover site arrival, movement, induction, clean-down, seasonal access, shutdown, tools and unknown field/bay restrictions. Five initial evidence records include a nominated contact, greenhouse/shed movement plan, current Riley induction, expired Morgan induction and a gauge/tool check. Missing clean-down and shutdown evidence intentionally leave the initial greenhouse visit blocked.

Useful review paths include:

1. Open the initial greenhouse visit; inspect Morgan’s expired induction, missing clean-down and missing shutdown evidence. Acknowledge instructions and verify that blockers remain.
2. Move the proposed start to 13:30 or finish beyond 16:30. Inspect the full-interval restriction, then restore the planned visit.
3. Select Propagation Bay A. Confirm that greenhouse-only instructions and the greenhouse/shed movement evidence do not apply automatically.
4. Capture missing evidence as Coordinator, then review it as Site reviewer. Verify that captured-only records do not satisfy requirements.
5. Retain a preparation snapshot, revise a source and publish it. Inspect the unchanged original snapshot and the recheck requirement.
6. Select the field site. Confirm that nursery evidence cannot satisfy field entry and that the open field retains explicit unknown crop context.

## 11. Roles, local saving and recovery

Preview roles illustrate command separation: Coordinator prepares requirement revisions and captures evidence; Site reviewer records source and evidence review; Read-only disables mutations. These are demonstrative controls only. The HTML contains the synthetic data and cannot enforce server authorisation or private information boundaries.

Explicit saves retain the local record state under a module-specific browser key when storage is available. A generation/baseline comparison refuses a stale save after another tab changes that key and leaves the entered form available. Browser storage does not provide atomic multi-user transactions; server expected-version commands remain required.

Malformed or unreadable stored data is retained rather than silently overwritten, while a visible recovery message explains that starter records are being used in the session. A storage write failure retains the change in memory and clearly labels the session-only state. JSON export provides a recovery copy. Import/restore is not implemented in this revision. Reset requires explicit confirmation and affects this module’s local demonstration state only.

Preview options can simulate complete source unavailability. The workspace then suppresses readiness and mutation flows until the simulated source retry succeeds. Partial source sets and revoked operational access require future authenticated integration. An unavailable-source message cannot be interpreted as permission based on cached evidence.

## 12. Theme, responsiveness and accessibility

The supplied r20 file was inspected and hashed. Its three embedded Roboto faces are reused, with Roboto/Verdana fallbacks. The workspace uses the shared Intake palette: navy `#242a37`, green `#62bb46`, paper `#f5f6f8`, muted text `#667181` and borders `#e1e5eb`. Primary actions are white on navy; green indicates current navigation and selected source context. Status text accompanies warning, success and information colours.

Controls use 6 px corners, cards 7 px and dialogs 10 px. Thin separators, compact summary cells and readable source detail follow the board’s operational composition. No new logo or contact block is invented. Tables become labelled cards on narrow phones; the context panel stacks and the six views remain visible in a two-row navigation arrangement. Dialogs scroll inside the viewport and provide native focus containment, Escape handling, explicit close/cancel and unsaved-change confirmation.

Visible labels, keyboard focus, a skip link, semantic buttons, accessible error/status announcements and text explanations support review. The ordinary navigation buttons remain keyboard reachable without a custom ARIA tab widget. Print styles preserve the current view as reference information; printing is not controlled pack issue. Native browser verification and visual results are recorded separately. Screen-reader, physical-device, broad zoom and full WCAG acceptance remain open.

## 13. Receiving architecture and implementation boundaries

This contribution adds no application route, database migration, runtime dependency or external adapter. Source files under `docs/design/site-access/` assemble into one standalone HTML using the checked-in Python builder. The existing TypeScript/Next.js modular monolith and PostgreSQL architecture remain unchanged.

Future implementation must authorise every command on the server; persist stable site/facility IDs, exact instruction revisions and scoped evidence; compare expected versions; preserve original operation identity on retry; and re-evaluate current evidence at booking, pack issue and dispatch/start. Private visitor and induction evidence needs role-scoped access and controlled document references. SharePoint remains the intended business-document authority. MYOB remains the intended ERP authority; no ERP or crop-control endpoint is invented.

The receiving context identifies the selected facility, site, timezone, full visit range, activity and crew. Links to Customers/Sites, Work Orders and Job Pack open repository design references, not live records. They work when the folder tree is present; a downloaded standalone file still exposes the context but does not contain those other modules. Source changes signal recheck locally; automatic impact propagation into issued packs, bookings, My Work or Notifications remains a separate implementation increment.

## 14. Verification, acceptance and next bounded step

The focused verification checks facility applicability, individual and visit-specific evidence, date/time boundaries, separate review, unchanged blockers after acknowledgement, retained source/snapshot history, duplicate prevention and role restrictions. Nineteen model groups and fifteen DOM-emulation groups passed, as did focused ESLint and the foundation, prototype and naming checks. Native browser checks are prepared for the six views, forms, local saving, source failure, keyboard dialog use and responsive layouts, but have not run. The browser download timed out, and automatic approval review blocked GitHub publication. Native rendering, responsive geometry and visual inspection remain unverified. The [verification record](../../../testing/evidence/site-access-r01/README.md) holds actual results and limitations; no acceptance is inferred from a screenshot or test count alone.

The next bounded step is Dean’s visual and workflow review of this CS-06 design, followed by a specified server-backed increment that connects exact source revisions to one synthetic appointment and controlled pack. That increment must prove permission, source-change invalidation, concurrency and receiving-module behaviour before claiming operational readiness.
