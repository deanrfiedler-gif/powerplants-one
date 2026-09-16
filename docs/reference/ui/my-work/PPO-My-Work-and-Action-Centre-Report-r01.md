---
document_id: PPO-MYWORK-RPT
revision: r01
date: 2026-09-16
owner: Dean Fiedler
status: Interactive design for review; application integration and owner acceptance separate
source_commit: a4061c43b11d6a53604ec628cdf370ee72f54f7a
---

# My Work & Action Centre — workspace report

## 1. Purpose and delivery

The [interactive r01 HTML](PPO-My-Work-and-Action-Centre-r01.html) gives Powerplants One users a daily starting point for the question: **“What needs my attention, why does it matter, and what should I do next?”** It brings source-owned work into six connected views, with explicit responsibility, dates, context and receiving actions.

This report describes the actual standalone demonstration, its information model, interactions, workflow rules, visual treatment and implementation boundaries. It accompanies the HTML as a review and handover document. The HTML includes its fonts, styles, fictional records and scripts; it can be opened directly in a modern browser without a build or sign-in. A repository file preview may display source code: download the HTML and open that downloaded file to use the interactions.

The initial date is fixed at **16 September 2026** so overdue and upcoming scenarios remain reproducible. All people, customers, equipment, readings, instructions and outcomes are fictional. The demonstration changes its own browser session. It does not operate the running PPO application or any external business system.

The package includes maintainable [design sources](../../../design/my-work/README.md), a deterministic builder, model and native-browser checks, a [design decision](../../../decisions/my-work-action-centre-design.md), and a separate [verification record](../../../testing/evidence/my-work-r01/README.md). The latter identifies the exact checked source and HTML hash.

## 2. Relationship to existing PPO work

PPO already has `/work` and shared Activities. This design elaborates that foundation under adopted [F06](../../../requirements/product-quality-register.md#f06--actionable-my-work-and-notification-preferences), with selected [F04 saved-view concepts](../../../requirements/product-quality-register.md#f04--persistent-personal-and-team-views). It does not introduce another authoritative task system.

| Source | Application to this design |
|---|---|
| Coverage register SH-02, P1 | Dedicated My Work experience, including daily priorities and an actionable list. |
| SH-03, P1 | Permission-scoped updates, unread state and routine preferences. |
| SH-06, P1 | Cross-module review and handover inbox with distinct source decisions. |
| SH-05 / F04 | Named personal and permitted team criteria, with versions and management controls. |
| F06 parents CRM-03, PRJ-03, SVC-02/12, DOC-05, NFR-01/11 | Owned actions, dates or explicit unknowns, stable references, deduplication, safe recovery and source-owned commands. |
| Product quality delivery plan | Stage 3 My Work extension, with early reuse in stages 1–2. |

The [coverage register r06](../module-page-register/PPO-HTML-Page-Coverage-Register-r06.html) and [delivery plan](../../../delivery/product-quality-plan.md) remain planning authorities. The 78 original parent requirements are unchanged. The existence of this design does not mark those parents, F06, or the full F04 acceptance criteria complete.

## 3. Workspace structure

The navy header identifies the workspace and revision, gives the current fictional person and responsibility, and exposes Page guide and Preview options. Six navigation controls remain consistent across the workspace. The shared worklist controls sit above the selected view; Updates has its own notification and preference controls.

On desktop, the principal worklist occupies the wider column. A narrower companion column presents the explicitly selected record, its next action and relevant journey or coordination context. Selecting a title updates that snapshot. **Open** opens a source-specific drawer. If a selected record falls outside the current filters, the snapshot says so; it never silently substitutes a different record.

On narrow screens, the columns stack, rows become labelled record cards and actions remain touch-sized. Navigation wraps rather than requiring a wide desktop canvas. The page uses ordinary scrolling; it does not introduce nested scrolling for the main list.

## 4. Today

Today combines four linked summary cells, the current worklist, an exact selected-record snapshot, Northbank journey progress and upcoming commitments.

| Summary | Meaning and interaction |
|---|---|
| Overdue | Active matching obligations dated before the fixed demonstration date; opens the overdue filter. |
| Due today | Active matching obligations due on the demonstration date; opens that date filter. |
| Reviews | Matching review/release work; opens Reviews & handovers. |
| Date needed | Obligations without a known date; opens their distinct date category. |

The counts use the permitted, filtered set. They are not organisation-wide totals or a measure of staff capacity. Partial data is labelled with its missing sources; a loading failure displays unavailable counts. Missing dates are never classified as on time. Completed obligations remain available through the status filter without being treated as active priorities.

The journey panel explains the current inspection, correction, retest, acceptance and release state. It withholds its source assessment when the source scenario is incomplete. The upcoming panel retains customer and source context and opens each exact source action.

## 5. My actions

My actions brings together assigned Activities, internal tasks, corrective work and technical follow-ups. The default owner criterion is **My work**. Permitted coordinators can widen the owner filter; the assigned technician still sees only records allowed by that role.

Activities use the existing distinction between an Activity and the related opportunity or work order. The demonstration includes customer-contact examples and preserves UUID Activity identities. Completing an Activity requires its current owner and a recorded outcome. Completing an internal task requires its current owner and completion evidence. Neither action approves an estimate, accepts an inspection or releases equipment.

Source-owned Quality corrections and OEM follow-ups retain their own rules. A correction opens the corrective-work and retest controls; the OEM follow-up remains open for its technical workflow. There is no universal checkbox that completes all kinds of work.

## 6. Reviews & handovers

This view brings together inspection review, scoped release, Engineering submission, estimate-option and Service report examples. Every entry names its source, customer/site context, responsible reviewer, due date, reason and next action.

The Northbank inspection review is interactive. Its drawer shows the exact submission and revision, equipment UUID, installed and served locations, template revision, measured values and units, result, instrument identity, calibration reference, validity and retained evidence count. The reviewer can return the evidence for correction, hold it, request clarification or accept eligible evidence, with a reason and due date.

The Engineering, estimate and Service report entries link to their receiving designs and explicitly require the receiving review. Their detailed technical or commercial approval contracts are outside this HTML. They do not acquire a generic approval command merely because they appear in this inbox.

Evidence acceptance and release are separate decisions. Accepting the passing Northbank retest creates the release obligation. The user must then inspect and confirm the exact scope, exclusions and remaining work before recording the release.

## 7. Blocked & waiting

Blocked & waiting shows dependencies and corrections that prevent progress. The examples cover unavailable material after partial receipt/quarantine, a visitor-access dependency and a returned pressure finding.

Each row states what is needed and why it appears. Dependency records name the party or source being waited on and retain a follow-up date. A permitted coordinator can record a finding and the next date. That contact history does **not** clear the material or access blocker. The receiving module must decide whether the underlying prerequisite is satisfied.

Quality corrections follow the more specific inspection process. Recording corrective work changes the correction state; a new passing measurement still requires independent review. If a Quality source changes after inspection or release, a readiness obligation appears and the earlier release requires reassessment while its historical record remains intact.

## 8. Team queue

The Team queue is available to the coordinator and reviewer preview roles. It shows permitted team assignments, owner-needed work, missing dates and per-owner matching active counts. These counts describe obligations and must not be read as workload duration, availability or scheduling capacity.

A source Activity or internal task can be reassigned with an eligible owner, a valid due date or explicit **Due date is not yet known**, and a transfer reason. The record keeps its identity and gains source history. Assignment does not clone it. The model checks that the proposed owner has the relevant module scope.

Quality reviewer, correction and release responsibilities stay in the Quality workflow. The Team queue does not reassign arbitrary controlled reviews through its generic ownership form. The technician and observer cannot open Team queue; role changes also remove private saved views and unavailable modules from the visible controls.

## 9. Updates & preferences

Notifications are independent events pointing to source obligations. Each update includes a title, detail, source module, timestamp, required/routine classification, unread/read state and an **Open source action** control. Grouping by module is the default; it can be disabled for a single list.

Reading an update changes that person's read state only. It does not complete, cancel, approve or remove the associated work. Several updates may refer to one obligation without creating several worklist records. An earlier submission's update can remain in history after a retest; opening a superseded target asks the user to refresh the current worklist and does not open another record under the old identity.

Preferences include routine delivery **Immediate** or **Daily digest**, grouping, and a fictional quiet window of **18:00–08:00 AEST**. Required owned work remains visible regardless of these preferences. The preferences are illustrative local state: the HTML sends no emails, push notifications or digests and creates no schedule. Operational daylight-saving and delivery policies remain receiving work.

## 10. Shared controls and saved views

| Control | Supported behaviour |
|---|---|
| Search | Searches the displayed source context and action text; maximum 200 characters. |
| Owner | My work, all permitted owners, owner needed, or a named fictional person. Current role scope still governs results. |
| Module | All permitted modules or one available module. |
| Due | All dates, Overdue, Today, Upcoming or Date needed. |
| Status | Active obligations, all including completed, or Completed. |
| Clear filters | Restores the default criteria and clears the applied saved-view selection. |
| Save view | Stores the current view and criteria under a 1–80 character name and personal or permitted team visibility. |
| Manage views | Use, rename/edit metadata, duplicate and retire a visible view, according to management authority. |

Saved views store criteria, their version, owner and visibility. They do not store a list of authorised records. Every use recalculates current permission-scoped results. Owners can manage their personal views; permitted teammates can use a team view, while the coordinator can manage team definitions. Retirement requires confirmation and leaves business records unchanged.

To save revised filters, set the desired criteria and save the current view under a new name; duplicate names are rejected. The Edit dialog changes the definition's name and visibility using its retained criteria. Definitions use version checks to reject stale edits. Optional preferred/default views, shared URLs and the full CRM Detail/Back URL contract are not implemented in this standalone r01.

## 11. Information and field catalogue

| Information group | Included fields and purpose |
|---|---|
| Work identity | Stable source ID; readable originating record reference; source module; Activity, Task, Review, Blocked, Correction, Release or Follow-up type; source version. |
| Context | Customer; site; exact area; equipment reference and UUID where applicable; served area kept separate from physical installation. |
| Accountability | Current owner or Owner needed; due date or Date needed; active/completed state; source-specific reason for appearing. |
| Dependency | Waiting-on party/source; finding and follow-up date; unchanged underlying blocker until its own workflow clears it. |
| Completion | Recorded outcome or evidence; acting owner; time; retained source history. Reasons and evidence text require 8–2,000 characters. |
| Inspection | Submission ID/revision, submitter, template ID/revision, result, pressure and conductivity values/units, visible condition, instrument/calibration evidence and labelled attachment count. |
| Correction | Original defect ID; correction state; linked submissions; corrective-work note; evidence reference; retest date. |
| Review | Exact submission; Return for correction, Hold review, Request clarification or Accept evidence; reason; responsible correction owner; due date. |
| Release | Exact work order and scope; explicit exclusions; release reason and confirmation; effective release state; retained separate OEM action. |
| Update | Stable notification ID; target source ID; module; title/detail; timestamp; required/routine flag; per-person read state. |
| Saved view | ID, name, owner, visibility, version, view and validated filter criteria. |
| Local recovery | Session schema and version; command operation identity; source/workspace versions; receipts; history; saved UI state. |

Dates are calendar-validated. The fixture date is stable; displayed event timestamps use Australian Eastern time. UUIDs and synthetic readable references identify examples only and do not issue new business numbering rules.

## 12. Roles and action boundaries

| Preview person | Visible scope | Available responsibility |
|---|---|---|
| Casey Reed — Assurance reviewer | Quality, Engineering, Service and Projects; permitted team queue | Review current Northbank evidence and release eligible scope; permitted task/Activity coordination; personal preferences/views. |
| Alex Morgan — assigned technician | Owned Quality and Service work | Record owned correction and fresh retest; complete owned internal work; personal preferences/views. |
| Robin Ellis — Service coordinator | CRM, Projects, Supply Chain, Service, Engineering and Quality; permitted team queue | Complete owned Activities/tasks, coordinate eligible assignments/dates, record dependency follow-up, manage permitted team views. |
| Jamie Walker — read-only observer | Permitted Quality, Service and Projects context | Inspect information and sources; no domain writes, preference writes or saved-view management. |

These are explanatory preview roles, not authenticated accounts. The complete synthetic fixture is present in the downloadable HTML and session backup, including an intentionally hidden Finance example used to check visible filtering. The preview role controls presentation and model commands; it is not a security boundary. Runtime integration needs the existing server grant model on reads, aggregates and commands.

## 13. Northbank demonstration

The core fixture continues the fertigation job for **Northbank Nursery, Propagation site**. Asset **SYN-PPO-AST-000101**, UUID `11111111-1111-4111-8111-111111111101`, is installed in the **Irrigation room** and serves **Glasshouse 02**. Its work order is **SYN-PPO-WO-000241**. Those identities and location distinctions come from the preceding Equipment/Quality design journey.

The starting state has confirmed fictional preparation and a submitted failed inspection. Pressure is 5.60 bar; conductivity is 2.00 mS/cm; visible condition is Satisfactory. The pressure failure has a retained linked defect. The example limits of 4–5 bar and 1.8–2.2 mS/cm are labelled illustrative and are not an approved operating procedure.

1. Open the file as Casey. From Today or Reviews & handovers, open **Review inspection r01 · Northbank** and inspect its exact context.
2. Choose **Review in Assurance**, return the failed evidence for correction, and record a reason and date. The original submission remains; Alex owns the correction.
3. Use Preview options to become Alex. Open the correction under My actions; record corrective work and its evidence reference.
4. Capture a fresh retest: for the passing example, enter **4.60 bar**, **2.00 mS/cm**, Satisfactory, a reason and a fresh evidence caption. Confirm the exact equipment/preparation and the explicitly illustrative evidence fixture.
5. The new passing submission returns to Casey. The defect stays open pending acceptance. Switch to Casey, inspect the new revision, then accept eligible evidence with a review reason.
6. Open the separately created release action. Review the scope and exclusions, enter the release basis and confirm the stated boundary. The scope release is recorded separately from the evidence acceptance.
7. Return to Today. **Obtain OEM firmware clarification** remains an open obligation. Reading its update leaves it open.

The retest keeps the original failed submission, defect links, corrections, calibration snapshots and review decisions. It uses fresh labelled illustrative evidence; this workspace does not upload field photographs. The fuller Quality workspace owns that capture experience. A passing retest, its review acceptance and the release are three different events.

## 14. Additional fictional work

The surrounding records make cross-module behaviour reviewable without turning the Northbank journey into the entire daily workload. They include a Northbank quotation follow-up, revised estimate review, project scope comparison, material dependency and unassigned closeout task; Greenhaven Berries visitor access, Service report review and a missing-date task; and a Cedar Vale Growers Engineering review requiring its receiving workspace.

These records demonstrate an overdue customer contact, an upcoming internal commitment, unavailable receiving criteria, a blocked dependency, unassigned work and unknown dates. They do not represent imported operational records or claim coverage of every originating-module field. Warranty and maintenance are future receiving adapters for this same source-obligation approach; this r01 does not fabricate working integrations with those modules.

## 15. Receiving-module connections

The source drawer first preserves the exact item context, then offers the relevant receiving design. These are repository reference links. Separate standalone HTML sessions do not synchronise, and a repository link does not execute a live record command.

| Origin | Linked receiving design | Responsibility retained there |
|---|---|---|
| Quality | [Quality, Safety & Site Assurance r01, proposed PR #208](https://github.com/deanrfiedler-gif/powerplants-one/pull/208) | Preparation, inspection evidence, defects/retests, controlled review and scoped release. The matching local source panels use its copied model. |
| CRM Activity | [Deal pipeline r35](../crm/ppo-deal-pipeline_r35.html) | Opportunity/customer context and shared Activity outcome. |
| Estimate review | [Estimating container r03](../estimating/PPO-Estimation-Wizard-Container-r03.html) | Exact estimate-option and commercial review rules. This reference is an existing design, not a newly accepted estimating baseline. |
| Projects | [Project Delivery Readiness & Change Control r02](../projects/PPO-Project-Delivery-Readiness-and-Change-Control-r02.html) | Project scope, readiness, change consequences and closeout. |
| Engineering | [Engineering container r02](../engineering/PPO-Engineering-Container-r02.html) | Technical submission and design approval authority. |
| Service review | [Service Review & Reports r02](../service-review/PPO-Service-Review-and-Reports-Workspace-r02.html) | Completion evidence, controlled reports and customer response. |
| Service action/access | [Work Orders r01](../service/PPO-Work-Orders-Workspace-r01.html) | Visit/work scope, preparation and service delivery state. |
| Material dependency | [Supply Chain Material Readiness r03](../supply-chain/PPO-Supply-Chain-Material-Readiness-r03.html) | Receipt/quarantine availability and source readiness. |

For application integration, these references must resolve to exact authorised application records, with unavailable/stale target recovery. MYOB Acumatica remains the ERP authority; SharePoint remains the business-document authority; native CAD remains the engineering-authoring system. This design changes none of those relationships.

## 16. Persistence, consistency and recovery

The browser stores saved fictional records and UI criteria under `ppo-my-work-r01`. Reopening the same file in the same supported browser profile restores the session. Storage can vary by browser/file origin; export is the explicit portable backup mechanism. The file needs no network request to render or execute its local workflow.

Source commands operate on a validated clone and require current workspace/source versions. A command either validates and records its changes or leaves the prior state intact. Operation receipts distinguish recovery of the original command from a second business operation; changing the contents of a reused operation ID is rejected. Stable source IDs prevent duplicate worklist projections.

| Scenario | Actual response |
|---|---|
| Failed save before recording | Original records remain; form entries and error remain visible for correction/retry. |
| Lost response after recording | Saved work is retained; other changes pause until Recover original save reconciles the original receipt. No second obligation/history entry is created. |
| Partial source set | Quality and Engineering unavailable; loaded results/counts clearly qualified. |
| Failed loading | Unavailable counts and retry message; no false “all clear”. |
| Empty query scenario | Distinct empty-result explanation; saved source records are preserved. |
| Changed source revision | Earlier evidence/release retained; a new readiness requirement prevents relying on the old effective release. |
| Another tab changes storage | Idle tab reloads; an open form is preserved and stale writes are refused, with copy/export/reload guidance. |
| Unsaved form cancellation | Confirmation protects typed entries; declining cancellation keeps the form intact. |
| Damaged stored session | Original text retained and exportable; explicit reset required before replacing it. |
| Storage unavailable | Visible session-only warning and export guidance. |

Export downloads a JSON backup of the complete fictional fixture and saved UI state. It is not a permission-filtered business export. Restore accepts this schema, validates records, requires replacement confirmation, caps files at 4 MiB and starts in read-only mode. It replaces the demonstration rather than merging records. Unsaved form entries are separate from saved-record exports. Reset also requires explicit confirmation.

These are local consistency demonstrations. They are not proof of server concurrency, operational offline capture, authenticated isolation, delivery guarantees or production recovery. Those require the receiving application's contracts and verification.

## 17. Alignment with the attached r20 theme

The supplied `powerplants-one-theme-style-board-r20.html` was read directly and compared with the repository reference. The bytes match; SHA-256 is `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617`.

| Theme element | Implementation |
|---|---|
| Brand and surfaces | Navy `#242a37` header, green `#62bb46` accent, `#f5f6f8` page surface, white content panels and restrained neutral borders. |
| Typography | Embedded Roboto faces, with Verdana/Arial fallback; clear heading, label, body and secondary-text hierarchy. |
| Summary treatment | Contiguous square summary strip with dividers; no separate floating metric-card grid. |
| Shape and elevation | Existing 6/7/10 px radius vocabulary, restrained shadows, source drawer with the established corner treatment. |
| Controls | Consistent 44 px main/touch targets, aligned form labels, compact secondary actions and explicit disabled states. |
| State | Text accompanies colour; overdue, unknown, held, passing and completed states remain distinguishable by wording. |
| Focus and access | Visible `#365d8b` focus treatment, skip link, semantic labels, native dialog, Escape handling, focus return and arrow-key navigation. |
| Responsive composition | Wide worklist plus contextual column on desktop; stacked records, wrapping controls and accessible phone actions. |

The embedded font stylesheet has SHA-256 `57b4aafb71296b18d80408cb10aa972c87f5185deafd748c7fdcfb33e2bd4bef`. It is reused from the prior Quality design extraction of the same r20 board. Roboto is copyright 2011 Google Inc., licensed under [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). The package includes no remotely loaded font or stock photograph.

## 18. Implementation and provenance

The design retains the repository's standalone HTML/CSS/JavaScript and Python assembly pattern. It adds no framework, runtime dependency, application route, migration or adapter. Source files separate the My Work model, DOM interactions, theme styles, HTML template and embedded fonts.

The Assurance source model is copied byte-for-byte from Quality PR #208 head `23199a8a4e11e71c52d774d9d58ad5e4ae4c8c32`, as `assurance-model.js`, SHA-256 `d9c383a80e0d522d22fd502741d43ef90db2dd7373acd73958c3bf28d900cbcc`. That proposal is still a design dependency, not an accepted main baseline. My Work projects its current Northbank obligations and invokes its existing source commands; it does not replace its inspection/review logic. Other Quality packages retained inside the copied fixture are not exposed as this worklist's sample journey.

The branch starts from main `a4061c43b11d6a53604ec628cdf370ee72f54f7a`. The authored HTML is generated by `python3 scripts/build-my-work.py`. Maintainers should edit the source files and rebuild, rather than independently editing the generated HTML.

## 19. Verification and acceptance limits

The [evidence record](../../../testing/evidence/my-work-r01/README.md) contains the final model/native results, exact source provenance and visual review outcome. Tests target meaningful boundaries: retained failed evidence, owned corrections, independent acceptance, separate release, OEM persistence, permissions, deduplication, source version conflicts, recovery, saved views and notification separation.

The native browser review exercises controls and the complete Northbank journey, plus all six views at 1440, 1024, 820, 390 and 320 px widths. Original screenshots support inspection of desktop hierarchy, source details and phone layouts. Model checks supplement these interactions; neither replaces owner review or application integration testing. Keyboard and responsive checks are bounded evidence, not a claim of full assistive-technology certification.

## 20. Receiving implementation priorities

Application work should extend `/work` and the shared Activity contracts, then add explicit read projections and source action routes for each receiving module. Current server permissions must govern rows, search, aggregates, notifications and source navigation. Preserve exact source identity, revision, ownership and completeness in the read contract; use existing command receipts for mutations and recovery.

Confirm the operational team-management grants, unknown-date rules, source freshness policy, notification retention/delivery preferences and real timezone behaviour before expanding the demonstration into a live queue. Add warranty and maintenance obligations through their source modules, and keep required work visible when routine notices are quiet. Validate the complete runtime F04/F06 acceptance scenarios and measure queue-to-action steps, duplicate alerts and unowned/unknown-date work against declared fixtures. Owner visual acceptance, integration authorisation and production readiness remain distinct decisions.
