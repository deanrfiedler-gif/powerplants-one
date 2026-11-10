---
document_id: PPO-PROJECTS-REFINED-FIGMA-PROP
date: 2026-11-09
owner: Dean Fiedler
status: Proposal complete and awaiting Dean's review (10 November 2026); design acceptance is Dean's and has not been given; not an implementation baseline; no application code, route, read model, migration, permission, capability, grant, seed or deployment; every record shown is synthetic
source_commit: 0d1959f7363ef3434fefa4434904724b9e4af78a
versioning: git
---

# Projects module refined UI pages — proposal

**Owner:** Dean Fiedler · **Date:** 9 November 2026, completed 10 November 2026 · **Status:** Proposal complete, awaiting Dean's review. Sections 1 to 8 are the proposal record with the inventory, the verification and the audit; later sections will record Dean's acceptance, his decisions on A1 to A92 and the named versions exactly as the [Sales record](sales-module-refined-ui-proposal.md) does.

On 9 November 2026 Dean asked for the complete, refined UI page set of the Powerplants One Projects module to be drawn in Figma, in the new empty file "PPO - Projects module (proposal)", composed inside the accepted shell chrome, organised with the page template adopted for the Sales file, and recorded here with a dated status fragment and a draft pull request. His standing instruction applies: where a decision would otherwise be his, proceed with the most professional and advanced approach, state the assumption on the sheet and in this record, and keep going. The shell is the source of truth; register cells hold one line; no second search box in the content area.

This record is a **proposal**. It changes no code, test, migration, seed, permission or route. Acceptance of the design, when Dean gives it, does not make the drawn pages an implementation baseline: source presence, visual review of built pages, functional proof and deployment stay separate.

## 1. Sources

| Source | Use |
|---|---|
| Private Figma file "PPO - Shell (accepted)", pages "Shell refined · desktop shell and menus" and "Workspace menus · flyout and docked (accepted 8 November 2026)" | Chrome and geometry: 48 px top bar, 80 px collapsed rail, 48 px right strip, content x 80 to 1392, 280 px docked workspace menu, 432 px drawers and panels at x 960, tablet 1024 bar zones 332 / 360 / 332. The accepted Projects flyout and docked menus (Quick create New project and New activity; groups Delivery, Commercial & risk, Insights; docked Pinned group) are drawn as accepted, with no item invented |
| Private Figma file "PPO - Sales module (accepted)", named versions "PPO - Sales module (accepted)", "… · batch 2" and "… · batch 2 · N13", live file read on 9 November 2026 | Page template, Read me cards, the local copies of the shell components, the kit (Status chip, Button, Avatar, Checkbox, Filter chip, Tab, KPI tile), the 101 Lucide icon stand-ins and the derived tablet and phone chrome. The Plugin API cannot copy nodes between files, so each was serialised from the Sales file and rebuilt in the new file by script under the same component names, bound to a recreated "PPO colour" collection with the same 66 variable names and values. Exemplars studied: D01, D04, R01, X07, X23, X24, AD05, AD06, X25, AD07, AD08, ST01 and the Handovers page (W01, W02, AC01, AC02) |
| Private Figma file "PPO - Design", "— Projects —" pages | Frozen reference for content, accepted rules and stories: Projects register, Project record, Project initiation, Baseline, forecast and dependency review, Risks & issues (proposal), Contract obligations, notices and variations, Subcontractor packages (proposal), Delivery readiness (proposal), Stakeholder updates, Site assurance, Acceptance & closeout (proposal), Delivery performance, Project financial performance. Its shell is not the one copied |
| [Sales module refined UI proposal](sales-module-refined-ui-proposal.md) and its status fragment | The record this one mirrors |
| [Project initiation](project-initiation-figma-design.md) (PPO-PJ01-INITIATION-FIGMA-DEC), [Project record page](project-record-page-design.md) (PPO-PJ-RECORD-DESIGN-DEC), [Projects register](projects-register-design.md), [Baseline, forecast and dependency review](baseline-forecast-figma-design.md) (PPO-PJ03-BASELINE-FORECAST-FIGMA-DEC), [RAID backend](project-raid-backend.md), [Contract obligations, notices and variations](project-commercial-figma-design.md) (PPO-PJ05-COMMERCIAL-FIGMA-DEC), [Project field work and milestone billing](project-delivery-billing.md), [Delivery readiness](project-delivery-readiness-design.md) (PPO-012-READINESS-DES), [Site assurance](site-assurance-figma-design.md) (PPO-PJ09-SITE-ASSURANCE-FIGMA-DEC), [Stakeholder updates](stakeholder-updates-figma-design.md) (PPO-PJ08-STAKEHOLDER-UPDATES-FIGMA-DEC), [ADR-0033 staged acceptance](ADR-0033-staged-acceptance.md), [specialist packages](project-specialist-packages.md), [specialist handover](project-specialist-handover.md), [work evidence](project-specialist-work-evidence.md), [Delivery performance](delivery-performance-figma-design.md), [Project financial performance](project-financial-performance-figma-design.md), [Sales-to-Delivery handover](sales-delivery-handover-design.md), [Won delivery continuity](won-delivery-continuity.md), [Sales aftercare](sales-aftercare-figma-design.md), [Estimate–actual review](estimate-actual-review-figma-design.md), [Material changes](material-changes-figma-design.md), [Commissioning & as-built](engineering-commissioning-as-built-design.md), [customer communications D-025](customer-communications-d025.md) | Page content, lifecycles, rules and vocabulary carried into the refined pages |
| `src/shell/navigation.ts`, `src/components/product-navigation.tsx`, `src/projects/model.ts`, `src/platform/permissions.ts`, `docs/testing/evidence/permissions-matrix/role-grants.json` | The Projects rail and phone bar, phases and task statuses, capabilities and observed role profiles |
| [BP-06](../blueprints/BP-06-projects-commercial-delivery.md), [PPO-STD-001](../standards/naming-conventions.md), [Readable reference namespaces](readable-reference-namespaces.md) (PPO-REFERENCE-NAMESPACES-DEC), [design-to-build standard](../standards/design-to-build-standard.md), [ADR-0067](ADR-0067-design-to-build-operating-model.md), [Build from the named Figma version](figma-named-version-build-handoff.md), [ADR-0053](ADR-0053-figma-page-design.md), [ADR-0050](ADR-0050-font-awesome-light-icons.md), [product direction](product-direction-quality.md) | Naming, reference form, tokens, the separation of acceptance from shipped values, and what may be recorded here |

The new file's link and key are not recorded in this public repository (ADR-0050, ADR-0053). Node IDs are recorded so each sheet can be opened from the file.

## 2. Conformance declaration

Seeded from the interface matrix of the brief. Ownership: PJ-01 prepares only; PJ-05 is the commercial authority; PJ-07 and PJ-09 stay independent; Site assurance owns the ITP and EN-08 owns the test basis; PJ-09 owns the acceptance decisions; Service owns bookings; Supply owns receiving; Finance owns claims.

| Field | Declaration |
|---|---|
| Scope identity | The Projects workspace: `route:/projects` and the register views (scope PJ-02), `route:/projects/new` and the proposed `/projects/initiation` (PJ-01), `route:/projects/[id]` and its views (PJ-02, PJ-03), `route:/projects/programme` (PJ-03), `/projects/readiness` (PJ-07, proposed), `route:/projects/commercial` and `/projects/[id]/commercial/[entry]` (PJ-05), `/projects/risks` (PJ-04, proposed), `/projects/subcontracts` (PJ-06, proposed), `/projects/assurance` (PJ-09/site-assurance, proposed), `/projects/updates` (PJ-08, proposed), `route:/projects/acceptance` and its six routes (PJ-09), the Projects view of field work, the two Projects insight pages (RP-03, FN-03) and the Projects settings pages. No parent requirement ID is added or renamed; all 78 remain |
| Page types (r20) | Register / worklist; Record detail; Overview / dashboard; Planning workspace (Schedule, Programme, readiness Programme); Review / comparison (Baselines, work evidence, retest, update approval, stage closeout); Work queue + persistent detail (Changes); Document & evidence (stage pack, update preview); Form / guided workflow and centred dialogs; states. Each sheet's type is in section 3 |
| Reused components | Local copies of the accepted shell under the Sales file's names: Shell / Top bar, Shell / Rail · collapsed (with Projects as the current workspace), Shell / Right rail · collapsed, Shell / Workspace menu · docked (Sales and Projects), Shell / Top bar · 1024, Phone / Header · compact, Phone / Status bar, Phone / Tab bar (Sales and Projects); the proposed Shell / Workspace menu · collapsed 56 px; the kit Sales / Status chip (nine tones), Sales / Button (six kinds), Sales / Avatar, Sales / Checkbox, Sales / Filter chip, Sales / Tab, Sales / KPI tile; 101 Icon/* components and Brand/Logo mark; the "PPO colour" collection (66 variables). Component names are kept identical to the Sales file so the module files converge on one library |
| Source authority | The decisions in section 1 and Dean's 9 November direction with Addendum A2. The fixture is synthetic: as at Thursday 5 November 2026, 09:00 AEDT (Melbourne), signed in as project manager Morgan Lee unless a sheet names another person; site facts in site time with the zone named when it differs; a few sheets are dated at the event they show and say "as at" (A30, A44) |
| Incoming handover | The exact accepted Won event and handover r01 from CR-03 (frozen text, fingerprint); the exact quotation revision from ES-07 for the source check; customer, contacts, witnesses and sites from CS-01 to CS-06; design basis, change events and the test, release and configuration basis from EN-02, EN-07 and EN-08; demand from SC-01 and withdrawals from SC-09; bookings, field hours, inspections and incidents from Service and Field (FI-03, FI-05, FI-06, SV-01); the Project update template from DK-06. Arriving creates no business record |
| Outgoing handover | Questions to Sales and Estimating; the receiving decision and Started; prepared requests to EN-02, PJ-03, SC-01, PJ-06, PJ-08 and PJ-04; the accepted subcontract brief as an EN-06 version-2 handover; `ProjectClaim` to Finance on each milestone claim; approved updates as M4 messages through EC-04; stage pack OUT-13 issue through DK-03; Assurance released to PJ-09; a customer need to Sales as a lead; a schedule change request to Service; a CR-05 aftercare item and an ES-09 outcome review when a project closes; Waiting on customer, Waiting on others, reviews, ageing escalations, owned follow-ups and review deadlines to My Work. Nothing drawn awards, purchases, books, invoices or posts to MYOB |
| Exceptions and recovery | Loading permitted evidence (PS01, PS08, PS12); true-empty with counts 0 (PS09, PS16, PS23, PS27); filtered-empty with filters restated (PS02, PS14, PS20); could not load (PS03, PS25); denied or not found (PS05, PS11, PS18, IS04); stale, a newer save by someone else (PS06, PS10, PS22, PS26, PS24, PS29); partial source (PS07 outcome unknown; PS13 Engineering, PS15 and PS21 Supply, PS19 My Work, PS30 Service unavailable); outcome unknown with recovery (PS07); read only (RC17, RK11, PS28, PS31, released plans on SA02); bulk action partial failure (PS04); Held (PS17); hold point (SA10) |
| Departures | Section 5, A1 to A92 |
| Verification | Section 6 |

Per scope area, the declaration reads:

| Scope | Page types drawn | Ownership statement on the sheets | Incoming | Outgoing | Departures |
|---|---|---|---|---|---|
| PJ-02 register and Pulse | Register, Overview (Pulse), board, dialogs, states | The register reads facts; attention is a rule in words | CR-03, PJ-03, PJ-05, PJ-07, PJ-04, PJ-08, PJ-09 facts | Saved views; reassignment and delegation logged | A4, A7, A9, A14 to A18 |
| PJ-01 initiation | Register, record detail, forms, dialogs, states | PJ-01 prepares only; Started is the project manager's fact | CR-03 handover r01, ES-07 quotation, CS-01 to CS-04 | Questions, receiving decision, prepared requests, RAID assumptions | A19 to A21 |
| PJ-02 record | Record detail, planning workspace, dialogs, states | The record shows each module's decision; it decides nothing for them | PJ-03, PJ-05, PJ-07, PJ-08, PJ-09, FI, SV, CR-03 | Sales lead (customer need); Update draft; acceptance link | A22 to A29 |
| PJ-03 programme | Planning workspace, drawer, dialogs, review, evidence | Only the project manager edits the calendar; nothing moves by itself | Calendars, tasks, baselines, V-03 | My Work activities; PJ-08 draft; readiness warning | A30 to A36 |
| PJ-07 readiness | Overview, register, panel, planning workspace, work queue, decision | Independent of PJ-09; completing an action never clears a blocker | EN-02, EN-07, SC-01, SC-09, PJ-06, PJ-04, FI inductions | Work release; EN-07 response; SA release exclusion | A37 to A42 |
| PJ-05 commercial | Register, record detail, decision, dialogs, states | PJ-05 is the commercial authority; Finance owns claims | ES quotations and estimates, Sales PO, SC-09, EN-07 | `ProjectClaim`, adjusted value, notices, decisions to My Work | A43 to A50 |
| PJ-04 RAID | Register, record detail, form, decision, states | A Decision grants no approval; not a closeout gate | PJ-01 assumptions, PJ-07 blockers, PJ-05 variations, PJ-03 tasks | Needs attention; readiness link; never to PJ-08 | A51 to A56 |
| PJ-06 packages | Register, record detail, dialog, review, panel, states | Supply receiving is the authority; no award or booking | PJ-05 basis, EN documents by revision, Supply receiving, subcontractor evidence | EN-06 version-2 handover; Waiting on others; SA hold point | A57 to A62 |
| PJ-09 site assurance | Overview, register, record detail, dialogs, review, panel, states | Site assurance owns the ITP; EN-08 owns the test basis; a hold has no override | CS-06, FI-03, FI-05, FI-06, EN-07, EN-08, PJ-06 | Assurance released to PJ-09; defects to Field | A63 to A68 |
| PJ-08 updates | Register, form, document, review, record detail, panel, dialogs, states | Approver is a send-duty holder who is not the preparer; nothing from RAID | PJ-03, PJ-05, PJ-09 sources; CS-06 contacts; M4 trigger | EC-04 send; My Work items | A69 to A74 |
| PJ-09 acceptance | Register + inspector, record detail, document, decisions, states | PJ-09 owns the four decisions; each actor's decision is their own | EN-08, SA releases, PJ-05 basis, SV-01, CS-06, DK-03 | CR-05 aftercare; ES-09 review; Service ownership | A75 to A80 |
| Field work and insights | Register, dialog, overview, state | Service owns bookings; margin is from the adjusted value only | FI/SV work orders, PJ-05 values, MYOB billed (indicative) | Schedule change requests | A81 to A86 |
| Interaction states | Specimen board | — | PPO colour variables | — | — |
| Administration | Overview, forms, decision, state | Draft and publish with a reviewer who is not the editor; fixed lists are decisions, not settings | Repository decisions | Published versions to every page | A87 to A92 |

## 3. Sheet inventory

Desktop sheets are 1440 × 900 frames; the ST01 board is 1440 wide and hugs its content. Node IDs are those of the sheet frames in the new file. Each scope page carries the sections Desktop 1440, Dialogs and panels, States, Tablet 1024, Phone 390 and 320, and Flows and notes, stacked with 360 px gaps and refitted with 60 px padding; sheets sit at x 60, 1660, 3260 with rows 1060 apart (tablets at x 60, 1144; phones at pitch 450); every sheet has a one-line label at y − 26.

Counts: 248 frames on the 14 scope pages, being 234 sheets (139 desktop including the ST01 board, 33 dialogs and panels, 31 page states, 16 tablets, 15 phones of which one is at 320) and 14 Flows and notes cards. The brief's minimums (30 dialogs, 10 states, 16 tablets, 14 phones plus one 320, 9 administration sheets) are met. Read me cards: header `35:2`, Sheet index and notes `35:8`, audit `35:77`, Page template `35:82`. Shell and kit page: shell `12:87`, kit `12:88`, icons `12:89`, chrome `12:90`; hidden helper nodes `12:91`, `23:130`, `25:308`, `27:182`, `28:182`.

| Code | Sheet | Page | Route or scope | Type | Node |
|---|---|---|---|---|---|
| PJ01 | Projects register — Active view (PJ-02) | Projects register and Pulse · PJ-02 | `route:/projects` · PJ-02 | Register / worklist | `29:2` |
| PJ02 | Projects register — Active, docked workspace menu (PJ-02) | Projects register and Pulse · PJ-02 | `route:/projects` · PJ-02 | Register / worklist | `29:743` |
| PJ03 | Projects register — Active, collapsed docked menu 56 px (PJ-02) | Projects register and Pulse · PJ-02 | `route:/projects` · PJ-02 | Register / worklist | `29:1518` |
| PJ04 | Projects register — two selected, selection bar and snapshot panel (PJ-02) | Projects register and Pulse · PJ-02 | `route:/projects` · PJ-02 | Register / worklist | `29:2722` |
| PJ05 | Projects register — Needs attention view, three rows with their rule in words (PJ-02) | Projects register and Pulse · PJ-02 | `route:/projects` · PJ-02 | Register / worklist | `29:2253` |
| PJ06 | Projects Pulse — day start, Focus for today ranked by rule (PJ-02) | Projects register and Pulse · PJ-02 | `route:/projects` · PJ-02 | Record detail | `29:4243` |
| PJ07 | Portfolio board by phase (PJ-02) | Projects register and Pulse · PJ-02 | `route:/projects` · PJ-02 | Record detail | `31:1969` |
| PJ08 | Projects register — Health view (PJ-02) | Projects register and Pulse · PJ-02 | `route:/projects` · PJ-02 | Register / worklist | `29:3535` |
| X01 | Columns panel over the register — frozen set, order, density, saved with the view (PJ-02) | Projects register and Pulse · PJ-02 | `route:/projects` · PJ-02 | Panel | `32:2190` |
| X02 | Filters panel over the register — 3 of 9 match, filters restated (PJ-02) | Projects register and Pulse · PJ-02 | `route:/projects` · PJ-02 | Panel | `32:3104` |
| X03 | Export register dialog — scope, columns, format; restricted fields never exported (PJ-02) | Projects register and Pulse · PJ-02 | `route:/projects` · PJ-02 | Dialog | `32:3634` |
| X04 | Reassign projects dialog — bulk reassignment, effective date, reason, logged (PJ-02) | Projects register and Pulse · PJ-02 | `route:/projects` · PJ-02 | Dialog | `32:4355` |
| X05 | Delegate approvals dialog — while Jess Wong is away, scope and dates, both names recorded (PJ-02) | Projects register and Pulse · PJ-02 | `route:/projects` · PJ-02 | Dialog | `32:5120` |
| X33 | Projects register — the accepted Projects workspace flyout open from the rail: Find in workspace, quick create, Delivery, Commercial & risk, Insights (shell) | Projects register and Pulse · PJ-02 | `route:/projects` · PJ-02 | Panel | `126:5103` |
| PS01 | Projects register — loading permitted evidence (PJ-02) | Projects register and Pulse · PJ-02 | `route:/projects` · PJ-02 | State | `32:5960` |
| PS02 | Projects register — filtered, nothing matches, filters restated (PJ-02) | Projects register and Pulse · PJ-02 | `route:/projects` · PJ-02 | State | `32:6427` |
| PS03 | Projects register — could not load, counts read a dash (PJ-02) | Projects register and Pulse · PJ-02 | `route:/projects` · PJ-02 | State | `32:6751` |
| PS04 | Projects register — bulk action partial failure, 2 of 3 reassigned (PJ-02) | Projects register and Pulse · PJ-02 | `route:/projects` · PJ-02 | State | `32:7074` |
| TB01 | Projects register — Active, tablet 1024 (PJ-02) | Projects register and Pulse · PJ-02 | `route:/projects` · PJ-02 | Tablet 1024 variant | `32:7763` |
| TB02 | Projects Pulse — tablet 1024 (PJ-02) | Projects register and Pulse · PJ-02 | `route:/projects` · PJ-02 | Tablet 1024 variant | `32:8349` |
| PH01 | Projects Pulse — phone 390 (PJ-02) | Projects register and Pulse · PJ-02 | `route:/projects` · PJ-02 | Phone 390 or 320 variant | `32:8629` |
| PH02 | Projects register — list rows, phone 390 (PJ-02) | Projects register and Pulse · PJ-02 | `route:/projects` · PJ-02 | Phone 390 or 320 variant | `32:8784` |
| PH03 | Projects register — list rows, phone 320 (PJ-02) | Projects register and Pulse · PJ-02 | `route:/projects` · PJ-02 | Phone 390 or 320 variant | `32:8939` |
| — | Flows and notes card | Projects register and Pulse · PJ-02 | `route:/projects` · PJ-02 | Flows and notes | `33:5103` |
| IN01 | Initiation — handovers worklist grouped by who acts next, ageing flag (PJ-01) | Initiation · PJ-01 | `/projects/initiation` (proposed), `route:/projects/new` · PJ-01 | Register / worklist | `37:13` |
| IN02 | Handover record — Receiving review, nine-event chain, r01 beside project context, source check, date runway (PJ-01) | Initiation · PJ-01 | `/projects/initiation` (proposed), `route:/projects/new` · PJ-01 | Record detail | `38:487` |
| IN03 | Handover record — Questions tab: sent with answer needed by, answered, resolved (PJ-01) | Initiation · PJ-01 | `/projects/initiation` (proposed), `route:/projects/new` · PJ-01 | Record detail | `38:1058` |
| IN04 | Handover record — Assumptions tab: drafted, sent to Risks & issues with the link back (PJ-01) | Initiation · PJ-01 | `/projects/initiation` (proposed), `route:/projects/new` · PJ-01 | Record detail | `39:913` |
| IN05 | Handover record — Project & link: create, then link, match check on company, customer and site (PJ-01) | Initiation · PJ-01 | `/projects/initiation` (proposed), `route:/projects/new` · PJ-01 | Record detail | `39:1295` |
| IN06 | Handover record — Start checklist: prepared requests Sent, Received, Not needed with reason; Started (PJ-01) | Initiation · PJ-01 | `/projects/initiation` (proposed), `route:/projects/new` · PJ-01 | Record detail | `39:1732` |
| IN07 | Mark Started — blocked by an open source difference, the difference named (PJ-01) | Initiation · PJ-01 | `/projects/initiation` (proposed), `route:/projects/new` · PJ-01 | Record detail | `40:1527` |
| IN08 | Handover record — waiting over the 5-day limit, ageing flag and My Work escalation (PJ-01) | Initiation · PJ-01 | `/projects/initiation` (proposed), `route:/projects/new` · PJ-01 | Record detail | `40:1975` |
| IN09 | Handover record — History grouped by day, who did what and when (PJ-01) | Initiation · PJ-01 | `/projects/initiation` (proposed), `route:/projects/new` · PJ-01 | Record detail | `40:2349` |
| IN10 | New project without a handover — /projects/new, Sales attribution None (PJ-01) | Initiation · PJ-01 | `/projects/initiation` (proposed), `route:/projects/new` · PJ-01 | Form / guided workflow | `37:528` |
| X06 | Ask a question dialog — named owner, linked item, answer needed by, must be answered (PJ-01) | Initiation · PJ-01 | `/projects/initiation` (proposed), `route:/projects/new` · PJ-01 | Dialog | `40:2751` |
| X07 | Send assumptions to Risks & issues dialog — kind Assumption, owner, priority by hand (PJ-01) | Initiation · PJ-01 | `/projects/initiation` (proposed), `route:/projects/new` · PJ-01 | Dialog | `40:3141` |
| X08 | Send start-checklist requests dialog — each request sent by a person, Not needed with reason, Decide later (PJ-01) | Initiation · PJ-01 | `/projects/initiation` (proposed), `route:/projects/new` · PJ-01 | Dialog | `40:3526` |
| X09 | Mark Started dialog — enabled, every condition met (PJ-01, as at Fri 23 Oct) | Initiation · PJ-01 | `/projects/initiation` (proposed), `route:/projects/new` · PJ-01 | Dialog | `41:2736` |
| X10 | Link handover to project dialog — match check on company, customer and site; separate from Create (PJ-01) | Initiation · PJ-01 | `/projects/initiation` (proposed), `route:/projects/new` · PJ-01 | Dialog | `41:3132` |
| X11 | Return to Sales dialog — reasons, successor r02 keeps r01 and its acceptance (PJ-01) | Initiation · PJ-01 | `/projects/initiation` (proposed), `route:/projects/new` · PJ-01 | Dialog | `41:3513` |
| PS05 | Handover — denied or not found, no title, count or owner leaks (PJ-01) | Initiation · PJ-01 | `/projects/initiation` (proposed), `route:/projects/new` · PJ-01 | State | `41:3893` |
| PS06 | Handover record — stale: a newer save by someone else; reload keeps your unsaved reason (PJ-01) | Initiation · PJ-01 | `/projects/initiation` (proposed), `route:/projects/new` · PJ-01 | State | `41:4101` |
| PS07 | Project & link — outcome unknown on Create project, the original kept and recovery offered (PJ-01) | Initiation · PJ-01 | `/projects/initiation` (proposed), `route:/projects/new` · PJ-01 | State | `41:4506` |
| TB03 | Handover record — Receiving review, tablet 1024, details folded to a 44 px strip (PJ-01) | Initiation · PJ-01 | `/projects/initiation` (proposed), `route:/projects/new` · PJ-01 | Tablet 1024 variant | `41:4901` |
| PH04 | Handover question — read the answer and resolve, phone 390 (PJ-01) | Initiation · PJ-01 | `/projects/initiation` (proposed), `route:/projects/new` · PJ-01 | Phone 390 or 320 variant | `41:5323` |
| — | Flows and notes card | Initiation · PJ-01 | `/projects/initiation` (proposed), `route:/projects/new` · PJ-01 | Flows and notes | `41:5444` |
| RC01 | Project record — Overview: key dates, signals, Needs attention, summaries (PJ-02) | Project record · PJ-02 | `route:/projects/[id]` and its views · PJ-02, PJ-03 | Overview / dashboard | `50:2` |
| RC02 | Project record — Schedule (Gantt) with the task panel, FS warning on Controls commissioning (PJ-02, PJ-03) | Project record · PJ-02 | `route:/projects/[id]` and its views · PJ-02, PJ-03 | Planning workspace | `50:1121` |
| RC03 | Project record — Schedule list, the same tasks as rows with variance per task (PJ-02, PJ-03) | Project record · PJ-02 | `route:/projects/[id]` and its views · PJ-02, PJ-03 | Record detail | `50:1806` |
| RC04 | Project record — Baselines: r01 Customer-agreed programme, r02 proposed after V-03, calendar per baseline (PJ-02, PJ-03) | Project record · PJ-02 | `route:/projects/[id]` and its views · PJ-02, PJ-03 | Record detail | `51:1000` |
| RC05 | Project record — Commercial view: summary from PJ-05, Held when a source drifts, links into Variations & obligations (PJ-02, PJ-05) | Project record · PJ-02 | `route:/projects/[id]` and its views · PJ-02, PJ-03 | Record detail | `51:1636` |
| RC06 | Project record — Acceptance view: the stage and its four decisions, read only (PJ-02, PJ-09) | Project record · PJ-02 | `route:/projects/[id]` and its views · PJ-02, PJ-03 | Record detail | `51:2213` |
| RC07 | Project record — Updates view: Update 4 sent, Update 5 due Tue 10 Nov, cadence 14 days (PJ-02, PJ-08) | Project record · PJ-02 | `route:/projects/[id]` and its views · PJ-02, PJ-03 | Record detail | `55:1926` |
| RC08 | Project record — Files: SharePoint links, stage packs issued (DK-03), issued manifests (PJ-02) | Project record · PJ-02 | `route:/projects/[id]` and its views · PJ-02, PJ-03 | Decision / dialog | `55:2524` |
| RC09 | Project record — History grouped by day, who did what and when (PJ-02) | Project record · PJ-02 | `route:/projects/[id]` and its views · PJ-02, PJ-03 | Record detail | `55:3016` |
| RC10 | Project record — Record baseline r02 dialog: name, calendar, reason, impact on variance (PJ-02, PJ-03) | Project record · PJ-02 | `route:/projects/[id]` and its views · PJ-02, PJ-03 | Decision / dialog | `55:3486` |
| RC11 | Project record — Add task dialog: title, owner, dates, phase, dependency checked inline (PJ-02, PJ-03) | Project record · PJ-02 | `route:/projects/[id]` and its views · PJ-02, PJ-03 | Decision / dialog | `55:3916` |
| RC12 | Project record — Sales handovers from the … menu, r01 handover and chain read only (PJ-02) | Project record · PJ-02 | `route:/projects/[id]` and its views · PJ-02, PJ-03 | Record detail | `50:598` |
| RC13 | Project record — Record a customer need: hands a need heard on site to Sales (PJ-02, CR-05) | Project record · PJ-02 | `route:/projects/[id]` and its views · PJ-02, PJ-03 | Record detail | `55:4372` |
| RC14 | Project record — Scope & sites: sites, areas and equipment carried from the Sales Scope & sites tab (PJ-02) | Project record · PJ-02 | `route:/projects/[id]` and its views · PJ-02, PJ-03 | Record detail | `57:2926` |
| RC15 | Project record — Team & stakeholders: project team, customer contacts, witnesses, receivers (PJ-02) | Project record · PJ-02 | `route:/projects/[id]` and its views · PJ-02, PJ-03 | Record detail | `57:3419` |
| RC16 | Project record — Field work & bookings: typed work orders, cost evidence read only (PJ-02, FI, SV) | Project record · PJ-02 | `route:/projects/[id]` and its views · PJ-02, PJ-03 | Record detail | `57:3896` |
| RC17 | Project record — Closed project: read only everywhere, closure decision and reopen path (PJ-02, PJ-09) | Project record · PJ-02 | `route:/projects/[id]` and its views · PJ-02, PJ-03 | Decision / dialog | `58:3580` |
| X12 | Project record — the … menu open: Sales handovers, Record a customer need, Open Acceptance & closeout, Copy link (PJ-02) | Project record · PJ-02 | `route:/projects/[id]` and its views · PJ-02, PJ-03 | Dialog | `58:4011` |
| X13 | Project record — Catch me up: a reviewed summary with the suggested next step and its rule, never saved (PJ-02, N-P1) | Project record · PJ-02 | `route:/projects/[id]` and its views · PJ-02, PJ-03 | Panel | `58:4471` |
| X14 | Project record — Display options on the Gantt: baseline bars, non-working shading, variance unit (PJ-02, PJ-03) | Project record · PJ-02 | `route:/projects/[id]` and its views · PJ-02, PJ-03 | Dialog | `59:4208` |
| X15 | Project record — Reopen project: reason, affected scope or source, current version, closure authority (PJ-02, PJ-09) | Project record · PJ-02 | `route:/projects/[id]` and its views · PJ-02, PJ-03 | Dialog | `59:4820` |
| PS08 | Project record — Loading permitted evidence: shell first, skeleton rows, counts withheld (PJ-02) | Project record · PJ-02 | `route:/projects/[id]` and its views · PJ-02, PJ-03 | State | `59:5184` |
| PS09 | Project record — No tasks and no baseline: opens on Schedule, "No baseline recorded", Needs attention from readiness (PJ-02) | Project record · PJ-02 | `route:/projects/[id]` and its views · PJ-02, PJ-03 | State | `59:5458` |
| PS10 | Project record — Stale: Jordan Hale saved a newer forecast while your reason was open; reload keeps your unsaved reason (PJ-02, PJ-03) | Project record · PJ-02 | `route:/projects/[id]` and its views · PJ-02, PJ-03 | State | `60:5006` |
| PS11 | Project record — Denied or not found: no title, count, owner or customer leaks (PJ-02) | Project record · PJ-02 | `route:/projects/[id]` and its views · PJ-02, PJ-03 | State | `60:5600` |
| TB04 | Project record — Overview at 1024, details folded to 44 px, key dates and Needs attention (PJ-02) | Project record · PJ-02 | `route:/projects/[id]` and its views · PJ-02, PJ-03 | Tablet 1024 variant | `60:5807` |
| TB05 | Project record — Schedule (Gantt) at 1024, task panel closed, chart scrolled to today (PJ-02, PJ-03) | Project record · PJ-02 | `route:/projects/[id]` and its views · PJ-02, PJ-03 | Tablet 1024 variant | `60:6148` |
| PH05 | Project record — Overview on the phone: key dates stacked, Needs attention, summaries (PJ-02) | Project record · PJ-02 | `route:/projects/[id]` and its views · PJ-02, PJ-03 | Phone 390 or 320 variant | `60:6685` |
| PH06 | Project record — Schedule list on the phone: task rows with status and variance (PJ-02, PJ-03) | Project record · PJ-02 | `route:/projects/[id]` and its views · PJ-02, PJ-03 | Phone 390 or 320 variant | `60:6867` |
| — | Flows and notes card | Project record · PJ-02 | `route:/projects/[id]` and its views · PJ-02, PJ-03 | Flows and notes | `60:7060` |
| PG01 | Programme — all active projects against their latest baselines, variance per project (PJ-03) | Programme and baselines · PJ-03 | `route:/projects/programme` · PJ-03 | Planning workspace | `65:2` |
| PG02 | Programme — Block C expanded, collapsed docked menu 56 px (PJ-03) | Programme and baselines · PJ-03 | `route:/projects/programme` · PJ-03 | Planning workspace | `65:604` |
| PG03 | Programme — Gantt with baseline bars on, Display menu open, ghost bars beneath each task (PJ-03) | Programme and baselines · PJ-03 | `route:/projects/programme` · PJ-03 | Planning workspace | `66:780` |
| PG04 | Programme — task panel, reasoned forecast save: Dosing skid commissioning Fri 13 Nov → Wed 18 Nov with reason and history (PJ-03) | Programme and baselines · PJ-03 | `route:/projects/programme` · PJ-03 | Planning workspace | `66:1539` |
| PG05 | Programme — FS dependency warning on Controls commissioning: successor warned, dates unchanged (PJ-03) | Programme and baselines · PJ-03 | `route:/projects/programme` · PJ-03 | Planning workspace | `66:2368` |
| PG06 | Programme — non-working-day forecast warning: Dosing skid delivered forecast to Fri 23 Oct, site closed (PJ-03) | Programme and baselines · PJ-03 | `route:/projects/programme` · PJ-03 | Planning workspace | `67:1427` |
| PG07 | Programme — Working calendar editor: Block C r01 exceptions, add the customer shutdown Mon 16 to Wed 18 Nov, project manager only (PJ-03) | Programme and baselines · PJ-03 | `route:/projects/programme` · PJ-03 | Planning workspace | `67:2200` |
| PG08 | Programme — Record actual dates: Zone 1–2 tie-ins actual start Sat 7 Nov, a working exception (PJ-03) | Programme and baselines · PJ-03 | `route:/projects/programme` · PJ-03 | Planning workspace | `67:3139` |
| PG09 | Programme — variance unit toggle: working days, each value naming its calendar (PJ-03) | Programme and baselines · PJ-03 | `route:/projects/programme` · PJ-03 | Planning workspace | `65:1415` |
| PG10 | Programme — Ask owners to review: owners listed and ticked by default, one My Work activity each (PJ-03) | Programme and baselines · PJ-03 | `route:/projects/programme` · PJ-03 | Planning workspace | `67:3961` |
| PG11 | Programme — Draft a customer update handed to Stakeholder updates: calendar days, no internal names (PJ-03, PJ-08) | Programme and baselines · PJ-03 | `route:/projects/programme` · PJ-03 | Planning workspace | `67:4783` |
| PG12 | Programme — Baseline comparison: r01 against proposed r02, per-task deltas in calendar and working days (PJ-03) | Programme and baselines · PJ-03 | `route:/projects/programme` · PJ-03 | Planning workspace | `67:5588` |
| PG13 | Programme — task chain shapes drawn as evidence: dependency, chain, branch, merge, diamond (PJ-03) | Programme and baselines · PJ-03 | `route:/projects/programme` · PJ-03 | Planning workspace | `69:2820` |
| X16 | Programme — Working calendar saved as r02: open forecasts recalculated and flagged, nothing moved (PJ-03) | Programme and baselines · PJ-03 | `route:/projects/programme` · PJ-03 | Dialog | `69:3435` |
| X17 | Programme — Draft handed to Stakeholder updates: Update 5 draft, Programme section, nothing sent (PJ-03, PJ-08) | Programme and baselines · PJ-03 | `route:/projects/programme` · PJ-03 | Dialog | `69:4235` |
| PS12 | Programme — Loading: shell first, skeleton rows, counts withheld (PJ-03) | Programme and baselines · PJ-03 | `route:/projects/programme` · PJ-03 | State | `69:5015` |
| PS13 | Programme — Partial source: Engineering unavailable, its dates a dash, the list may be incomplete (PJ-03) | Programme and baselines · PJ-03 | `route:/projects/programme` · PJ-03 | State | `69:5284` |
| PS14 | Programme — Filtered empty: filters restated, clear filters, counts 0 by rule (PJ-03) | Programme and baselines · PJ-03 | `route:/projects/programme` · PJ-03 | State | `69:5831` |
| TB06 | Programme — all active projects at 1024, project rows only (PJ-03) | Programme and baselines · PJ-03 | `route:/projects/programme` · PJ-03 | Tablet 1024 variant | `69:6120` |
| TB07 | Programme — task panel at 1024: reasoned forecast save, Block C expanded (PJ-03) | Programme and baselines · PJ-03 | `route:/projects/programme` · PJ-03 | Tablet 1024 variant | `69:6591` |
| PH07 | Programme — reasoned forecast save on the phone: Dosing skid commissioning, reason required, dependency check (PJ-03) | Programme and baselines · PJ-03 | `route:/projects/programme` · PJ-03 | Phone 390 or 320 variant | `70:4441` |
| — | Flows and notes card | Programme and baselines · PJ-03 | `route:/projects/programme` · PJ-03 | Flows and notes | `70:4610` |
| RD01 | Delivery readiness — Overview across projects: four summary cells, blockers and actions apart, no percentage, shutdown context (PJ-07) | Delivery readiness · PJ-07 | `/projects/readiness` (proposed) · PJ-07 | Overview / dashboard | `73:10` |
| RD02 | Delivery readiness — Block C, six categories: a state per prerequisite, the blocker, filters by state, category, owner and attention (PJ-07) | Delivery readiness · PJ-07 | `/projects/readiness` (proposed) · PJ-07 | Record detail | `73:648` |
| RD03 | Delivery readiness — Blocker detail: owner module, evidence needed, linked RAID entry and actions (PJ-07) | Delivery readiness · PJ-07 | `/projects/readiness` (proposed) · PJ-07 | Record detail | `74:592` |
| RD04 | Delivery readiness — Actions list across projects: owner, due, linked blocker; completing one never clears a blocker (PJ-07) | Delivery readiness · PJ-07 | `/projects/readiness` (proposed) · PJ-07 | Register / worklist | `74:1293` |
| RD05 | Delivery readiness — Programme view: current programme against the proposed one, shutdown and permit applied (PJ-07) | Delivery readiness · PJ-07 | `/projects/readiness` (proposed) · PJ-07 | Record detail | `79:2567` |
| RD06 | Delivery readiness — Changes (EN-07): SYN-ECR-000014 K3 contactor assessed, three response options, reasoned return (PJ-07, EN-07) | Delivery readiness · PJ-07 | `/projects/readiness` (proposed) · PJ-07 | Work queue + persistent detail | `79:3153` |
| RD07 | Delivery readiness — Work release gate: readiness class before work release, blocked by the permit, a narrower scope named (PJ-07) | Delivery readiness · PJ-07 | `/projects/readiness` (proposed) · PJ-07 | Decision / dialog | `76:1124` |
| X18 | Delivery readiness — Record evidence for a prerequisite: Brightline inductions, reviewed before the state changes (PJ-07) | Delivery readiness · PJ-07 | `/projects/readiness` (proposed) · PJ-07 | Dialog | `76:1526` |
| X19 | Delivery readiness — Complete an action: the linked blocker stays until evidence is recorded (PJ-07) | Delivery readiness · PJ-07 | `/projects/readiness` (proposed) · PJ-07 | Dialog | `76:1922` |
| PS15 | Delivery readiness — Partial source: Supply unavailable, Materials shows a dash and is not counted (PJ-07) | Delivery readiness · PJ-07 | `/projects/readiness` (proposed) · PJ-07 | State | `77:1816` |
| PS16 | Delivery readiness — Planning project: Engineering blocked, five categories Not assessed, counts by rule (PJ-07) | Delivery readiness · PJ-07 | `/projects/readiness` (proposed) · PJ-07 | State | `77:2453` |
| TB08 | Delivery readiness — Block C readiness at 1024: six categories, states and the blocker (PJ-07) | Delivery readiness · PJ-07 | `/projects/readiness` (proposed) · PJ-07 | Tablet 1024 variant | `77:2972` |
| — | Flows and notes card | Delivery readiness · PJ-07 | `/projects/readiness` (proposed) · PJ-07 | Flows and notes | `77:3557` |
| CM01 | Variations & obligations — project picker and Variations view: groups Waiting for decision, Open, Disputed, Approved, Closed; display numbers proposed (PJ-05) | Variations & obligations · PJ-05 | `route:/projects/commercial`, `/projects/[id]/commercial/[entry]` · PJ-05 | Record detail | `82:2` |
| CM02 | Variations & obligations — variation record, Requested: requested amount only, Unknown as a value (PJ-05) | Variations & obligations · PJ-05 | `route:/projects/commercial`, `/projects/[id]/commercial/[entry]` · PJ-05 | Record detail | `83:803` |
| CM03 | Variations & obligations — Assessed and priced: priced amount beside requested, never summed, difference explained (PJ-05) | Variations & obligations · PJ-05 | `route:/projects/commercial`, `/projects/[id]/commercial/[entry]` · PJ-05 | Record detail | `83:1149` |
| CM04 | Variations & obligations — Submitted: bound version and fingerprint shown, decision waiting on the reviewer (PJ-05) | Variations & obligations · PJ-05 | `route:/projects/commercial`, `/projects/[id]/commercial/[entry]` · PJ-05 | Record detail | `83:1496` |
| CM05 | Variations & obligations — decision dialog: Approve, Reject or Dispute bound to the exact version, reviewer differs from author (PJ-05) | Variations & obligations · PJ-05 | `route:/projects/commercial`, `/projects/[id]/commercial/[entry]` · PJ-05 | Decision / dialog | `83:1852` |
| CM06 | Variations & obligations — Approved and frozen; the signed adjustment is a separate reviewed record (PJ-05) | Variations & obligations · PJ-05 | `route:/projects/commercial`, `/projects/[id]/commercial/[entry]` · PJ-05 | Record detail | `83:2216` |
| CM07 | Variations & obligations — Obligations view: Open, Satisfied, Waived; overdue in words; waiver by an independent reviewer (PJ-05) | Variations & obligations · PJ-05 | `route:/projects/commercial`, `/projects/[id]/commercial/[entry]` · PJ-05 | Decision / dialog | `82:645` |
| CM08 | Variations & obligations — Waive an obligation with an independent reviewer: O-04 induction records, Jordan Hale not the author (PJ-05, as at Fri 16 Oct) | Variations & obligations · PJ-05 | `route:/projects/commercial`, `/projects/[id]/commercial/[entry]` · PJ-05 | Decision / dialog | `83:2560` |
| CM09 | Variations & obligations — Notices: append-only evidence, successor corrections, the SC-09 withdrawal notice; never sent from PPO (PJ-05) | Variations & obligations · PJ-05 | `route:/projects/commercial`, `/projects/[id]/commercial/[entry]` · PJ-05 | Record detail | `82:1175` |
| CM10 | Variations & obligations — Commercial basis: Draft → Submitted → Approved, one original; Potting machine awaiting Jamie Ellis (PJ-05) | Variations & obligations · PJ-05 | `route:/projects/commercial`, `/projects/[id]/commercial/[entry]` · PJ-05 | Record detail | `84:1998` |
| CM11 | Variations & obligations — Value breakdown for Finance readers: original, approved changes, adjusted, pending priced, disputed; Held rule (PJ-05) | Variations & obligations · PJ-05 | `route:/projects/commercial`, `/projects/[id]/commercial/[entry]` · PJ-05 | Record detail | `84:2354` |
| CM12 | Variations & obligations — Claims schedule: milestone claims totalling exactly, ProjectClaim handoff to Finance (PJ-05, FN-04) | Variations & obligations · PJ-05 | `route:/projects/commercial`, `/projects/[id]/commercial/[entry]` · PJ-05 | Record detail | `84:2806` |
| CM13 | Variations & obligations — cross-project commercial queue: decisions, disputes and bases waiting across projects (PJ-05, proposed G1) | Variations & obligations · PJ-05 | `route:/projects/commercial`, `/projects/[id]/commercial/[entry]` · PJ-05 | Register / worklist | `85:2687` |
| CM14 | Variations & obligations — Withdrawn and Rejected both visible as records: Propagation house fit-out, all variations closed (PJ-05) | Variations & obligations · PJ-05 | `route:/projects/commercial`, `/projects/[id]/commercial/[entry]` · PJ-05 | Record detail | `85:3153` |
| X20 | Variations & obligations — Withdraw a variation: the author withdraws with a reason; the record stays visible as Closed (PJ-05) | Variations & obligations · PJ-05 | `route:/projects/commercial`, `/projects/[id]/commercial/[entry]` · PJ-05 | Dialog | `85:3622` |
| X21 | Variations & obligations — Resolve a dispute: a new version for decision, a withdrawal, or a notice of the position (PJ-05) | Variations & obligations · PJ-05 | `route:/projects/commercial`, `/projects/[id]/commercial/[entry]` · PJ-05 | Dialog | `85:3937` |
| PS17 | Variations & obligations — Held: the quotation drifted to r03, every total reads Held with the drifted line named (PJ-05) | Variations & obligations · PJ-05 | `route:/projects/commercial`, `/projects/[id]/commercial/[entry]` · PJ-05 | State | `85:4279` |
| PS18 | Variations & obligations — Value breakdown without Finance access: not available, no preview, strip still readable (PJ-05) | Variations & obligations · PJ-05 | `route:/projects/commercial`, `/projects/[id]/commercial/[entry]` · PJ-05 | State | `85:4703` |
| TB09 | Variations & obligations — Variations register at 1024: picker, four control values, grouped rows (PJ-05) | Variations & obligations · PJ-05 | `route:/projects/commercial`, `/projects/[id]/commercial/[entry]` · PJ-05 | Tablet 1024 variant | `85:4988` |
| TB10 | Variations & obligations — decision dialog at 1024: Approve, Reject or Dispute bound to v3 (PJ-05) | Variations & obligations · PJ-05 | `route:/projects/commercial`, `/projects/[id]/commercial/[entry]` · PJ-05 | Tablet 1024 variant | `85:5428` |
| PH08 | Variations & obligations — Variations under More on the phone: grouped list, amounts apart, read only (PJ-05) | Variations & obligations · PJ-05 | `route:/projects/commercial`, `/projects/[id]/commercial/[entry]` · PJ-05 | Phone 390 or 320 variant | `85:5661` |
| — | Flows and notes card | Variations & obligations · PJ-05 | `route:/projects/commercial`, `/projects/[id]/commercial/[entry]` · PJ-05 | Flows and notes | `85:5818` |
| RK01 | Risks & issues — RAID register across projects: kind, priority Normal or High, owner, review deadline, state; 19 open (PJ-04) | Risks & issues · PJ-04 | `/projects/risks` (proposed) · PJ-04 | Register / worklist | `86:2` |
| RK02 | Risks & issues — Project RAID view: Block C's entries, open and closed, with links to readiness and variations (PJ-04) | Risks & issues · PJ-04 | `/projects/risks` (proposed) · PJ-04 | Record detail | `86:960` |
| RK03 | Risks & issues — Risk record: owner, review deadline, linked activities, history (PJ-04) | Risks & issues · PJ-04 | `/projects/risks` (proposed) · PJ-04 | Record detail | `87:870` |
| RK04 | Risks & issues — New entry side form: kind first, kind cannot change later; owner and review deadline or due needed (PJ-04) | Risks & issues · PJ-04 | `/projects/risks` (proposed) · PJ-04 | Form / guided workflow | `87:1876` |
| RK05 | Risks & issues — Close with outcome: terminal linked activities required, outcome recorded (PJ-04) | Risks & issues · PJ-04 | `/projects/risks` (proposed) · PJ-04 | Record detail | `87:2397` |
| RK06 | Risks & issues — Reopen: explicit, with a reason; the closed outcome stays in the history (PJ-04) | Risks & issues · PJ-04 | `/projects/risks` (proposed) · PJ-04 | Decision / dialog | `87:2904` |
| RK07 | Risks & issues — Monitoring record: the review deadline shown, back to Open or on to Closed (PJ-04) | Risks & issues · PJ-04 | `/projects/risks` (proposed) · PJ-04 | Record detail | `87:1218` |
| RK08 | Risks & issues — Decision kind record: an owned observation and outcome; grants no approval and says so (PJ-04) | Risks & issues · PJ-04 | `/projects/risks` (proposed) · PJ-04 | Record detail | `87:1544` |
| RK09 | Risks & issues — Assumption received from initiation: linked back to the handover and the receiving review (PJ-04, PJ-01) | Risks & issues · PJ-04 | `/projects/risks` (proposed) · PJ-04 | Record detail | `88:2186` |
| RK10 | Risks & issues — Review deadline passed: danger tone with the rule in words, no score (PJ-04) | Risks & issues · PJ-04 | `/projects/risks` (proposed) · PJ-04 | Record detail | `88:2542` |
| RK11 | Risks & issues — Closed project refuses a new entry: explained, existing entries read only (PJ-04) | Risks & issues · PJ-04 | `/projects/risks` (proposed) · PJ-04 | Form / guided workflow | `86:1461` |
| X22 | Risks & issues — Set a new review deadline after one has passed: site time, reason recorded (PJ-04) | Risks & issues · PJ-04 | `/projects/risks` (proposed) · PJ-04 | Dialog | `90:2566` |
| X23 | Risks & issues — Move to Monitoring: review deadline required, back to Open is explicit (PJ-04) | Risks & issues · PJ-04 | `/projects/risks` (proposed) · PJ-04 | Dialog | `90:3077` |
| PS19 | Risks & issues — Partial source: My Work unavailable, linked-activity counts a dash, closing with outcome blocked (PJ-04) | Risks & issues · PJ-04 | `/projects/risks` (proposed) · PJ-04 | State | `90:3589` |
| PS20 | Risks & issues — Filtered empty: filters restated, counts 0 by rule, clear filters (PJ-04) | Risks & issues · PJ-04 | `/projects/risks` (proposed) · PJ-04 | State | `90:4061` |
| TB11 | Risks & issues — RAID register at 1024: kind, priority, owner, deadline, state (PJ-04) | Risks & issues · PJ-04 | `/projects/risks` (proposed) · PJ-04 | Tablet 1024 variant | `90:4312` |
| PH09 | Risks & issues — New entry on the phone: kind first and fixed, owner, Normal or High, review deadline (PJ-04) | Risks & issues · PJ-04 | `/projects/risks` (proposed) · PJ-04 | Phone 390 or 320 variant | `90:4838` |
| — | Flows and notes card | Risks & issues · PJ-04 | `/projects/risks` (proposed) · PJ-04 | Flows and notes | `88:2861` |
| SP01 | Subcontractor packages — packages register across projects: Accepted 3, Draft 1, Evidence awaiting review 1, Blocked 1 (PJ-06) | Subcontractor packages · PJ-06 | `/projects/subcontracts` (proposed) · PJ-06 | Register / worklist | `92:2` |
| SP02 | Subcontractor packages — package brief, draft: SYN-SUB-000015 controls commissioning, receiver to be named (PJ-06) | Subcontractor packages · PJ-06 | `/projects/subcontracts` (proposed) · PJ-06 | Record detail | `92:538` |
| SP03 | Subcontractor packages — submit blocked: no approved commercial basis; subcontractor qualification expired (PJ-06) | Subcontractor packages · PJ-06 | `/projects/subcontracts` (proposed) · PJ-06 | Record detail | `92:928` |
| SP04 | Subcontractor packages — submit for receiving: receiver differs from the author (Robin Hale), documents bound by revision (PJ-06) | Subcontractor packages · PJ-06 | `/projects/subcontracts` (proposed) · PJ-06 | Decision / dialog | `93:733` |
| SP05 | Subcontractor packages — accepted and frozen: EN-06 version-2 handover created with its fingerprint; evidence awaiting review (PJ-06, EN-06) | Subcontractor packages · PJ-06 | `/projects/subcontracts` (proposed) · PJ-06 | Review / comparison | `93:1123` |
| SP06 | Subcontractor packages — successor correction: v3 names what it corrects in v2; both accepted briefs stay visible (PJ-06) | Subcontractor packages · PJ-06 | `/projects/subcontracts` (proposed) · PJ-06 | Record detail | `93:1478` |
| SP07 | Subcontractor packages — work evidence review against the exact handover and document revisions: certificate of compliance, one item not matched (PJ-06) | Subcontractor packages · PJ-06 | `/projects/subcontracts` (proposed) · PJ-06 | Review / comparison | `94:1329` |
| SP08 | Subcontractor packages — references panel: Engineering and Supply links are references only, no award or booking authority; qualification expired (PJ-06) | Subcontractor packages · PJ-06 | `/projects/subcontracts` (proposed) · PJ-06 | Panel / drawer | `94:1683` |
| X24 | Subcontractor packages — return evidence with reasons: the not-matched items named, evidence stays as received (PJ-06) | Subcontractor packages · PJ-06 | `/projects/subcontracts` (proposed) · PJ-06 | Dialog | `94:2080` |
| X25 | Subcontractor packages — create a successor correction from an accepted brief: what it corrects and why (PJ-06) | Subcontractor packages · PJ-06 | `/projects/subcontracts` (proposed) · PJ-06 | Dialog | `94:2419` |
| PS21 | Subcontractor packages — partial source: Supply unavailable, receiving states a dash, nothing submitted meanwhile (PJ-06) | Subcontractor packages · PJ-06 | `/projects/subcontracts` (proposed) · PJ-06 | State | `95:2155` |
| PS22 | Subcontractor packages — stale after acceptance: an Engineering revision superseded a bound document; a successor correction is needed (PJ-06) | Subcontractor packages · PJ-06 | `/projects/subcontracts` (proposed) · PJ-06 | State | `95:2576` |
| TB12 | Subcontractor packages — package brief at 1024: details folded, scope and bound documents (PJ-06) | Subcontractor packages · PJ-06 | `/projects/subcontracts` (proposed) · PJ-06 | Tablet 1024 variant | `95:2918` |
| — | Flows and notes card | Subcontractor packages · PJ-06 | `/projects/subcontracts` (proposed) · PJ-06 | Flows and notes | `95:3225` |
| SA01 | Site assurance — overview by project: plans, hold points pending 1, defects open 3, releases (PJ-09) | Site assurance · PJ-09 | `/projects/assurance` (proposed) · PJ-09 (PRJ-06) | Overview / dashboard | `98:2` |
| SA02 | Site assurance — ITP register per work package, grouped by release state: SYN-ITP-000009 to 000014 (PJ-09) | Site assurance · PJ-09 | `/projects/assurance` (proposed) · PJ-09 (PRJ-06) | Register / worklist | `98:556` |
| SA03 | Site assurance — ITP record SYN-ITP-000014 r02: the five checks of the stage 2 work package, no details column (PJ-09) | Site assurance · PJ-09 | `/projects/assurance` (proposed) · PJ-09 (PRJ-06) | Record detail | `99:531` |
| SA04 | Site assurance — check attempt, pass: earth continuity 0.09 Ω against ≤ 0.5 Ω, attempt kept (PJ-09, as at Tue 13 Oct) | Site assurance · PJ-09 | `/projects/assurance` (proposed) · PJ-09 (PRJ-06) | Decision / dialog | `99:1784` |
| SA05 | Site assurance — failed attempt raises a defect: screen motor current 3.1 A against ≤ 2.4 A, SYN-DEF-000027 Major (PJ-09, as at Wed 28 Oct) | Site assurance · PJ-09 | `/projects/assurance` (proposed) · PJ-09 (PRJ-06) | Decision / dialog | `99:2193` |
| SA06 | Site assurance — defects register: Minor, Major, Critical; one defect per failed check with one retest chain; Critical prompts FI-06 (PJ-09) | Site assurance · PJ-09 | `/projects/assurance` (proposed) · PJ-09 (PRJ-06) | Register / worklist | `100:1919` |
| SA07 | Site assurance — retest reviewed: attempt 1 failed 3.1 A kept, Kim Taylor fixed, attempt 2 passed 2.1 A, Casey Quinn reviews (PJ-09) | Site assurance · PJ-09 | `/projects/assurance` (proposed) · PJ-09 (PRJ-06) | Decision / dialog | `100:2317` |
| SA08 | Site assurance — witness invitation and attendance: Noah Patel invited, Attended recorded (PJ-09, as at Thu 15 Oct) | Site assurance · PJ-09 | `/projects/assurance` (proposed) · PJ-09 (PRJ-06) | Decision / dialog | `99:2628` |
| SA09 | Site assurance — release with exclusions: screen drive 3 excluded by name (SYN-ECR-000014), independent reviewer, handed to Acceptance & closeout (PJ-09) | Site assurance · PJ-09 | `/projects/assurance` (proposed) · PJ-09 (PRJ-06) | Decision / dialog | `100:2667` |
| SA10 | Site assurance — hold point stops the next step: certificate of compliance outstanding, no override, read from PJ-06 (PJ-09) | Site assurance · PJ-09 | `/projects/assurance` (proposed) · PJ-09 (PRJ-06) | Record detail | `99:941` |
| SA11 | Site assurance — inputs received: CS-06, FI-03, FI-05, FI-06, EN-07, EN-08 read only (PJ-09) | Site assurance · PJ-09 | `/projects/assurance` (proposed) · PJ-09 (PRJ-06) | Record detail | `99:1355` |
| X26 | Site assurance — issue plan revision r03 from SYN-ECR-000014: a changed plan is a new revision; checks run against r02 are flagged (PJ-09) | Site assurance · PJ-09 | `/projects/assurance` (proposed) · PJ-09 (PRJ-06) | Dialog | `100:3053` |
| X27 | Site assurance — Critical defect: as Major, and prompts an FI-06 incident report (PJ-09) | Site assurance · PJ-09 | `/projects/assurance` (proposed) · PJ-09 (PRJ-06) | Dialog | `100:3488` |
| PS23 | Site assurance — No ITP for this work package yet: create from a template, nothing assumed (PJ-09) | Site assurance · PJ-09 | `/projects/assurance` (proposed) · PJ-09 (PRJ-06) | State | `100:3943` |
| PS24 | Site assurance — plan changed since a check: r03 issued, attempts run against r02 flagged, release proposal withdrawn (PJ-09) | Site assurance · PJ-09 | `/projects/assurance` (proposed) · PJ-09 (PRJ-06) | State | `100:4224` |
| PS25 | Site assurance — could not load: counts a dash, retry, nothing assumed (PJ-09) | Site assurance · PJ-09 | `/projects/assurance` (proposed) · PJ-09 (PRJ-06) | State | `100:4577` |
| TB13 | Site assurance — ITP record at 1024: the five checks, hold point and release state (PJ-09) | Site assurance · PJ-09 | `/projects/assurance` (proposed) · PJ-09 (PRJ-06) | Tablet 1024 variant | `100:4837` |
| PH10 | Site assurance — supervisor's queue on the phone: record a pass, earth continuity 0.09 Ω (PJ-09) | Site assurance · PJ-09 | `/projects/assurance` (proposed) · PJ-09 (PRJ-06) | Phone 390 or 320 variant | `100:5143` |
| PH11 | Site assurance — supervisor's queue on the phone: a fail raises one defect, severity by hand (PJ-09) | Site assurance · PJ-09 | `/projects/assurance` (proposed) · PJ-09 (PRJ-06) | Phone 390 or 320 variant | `100:5286` |
| PH12 | Site assurance — witness attendance on the phone: Attended, Declined or Did not attend (PJ-09) | Site assurance · PJ-09 | `/projects/assurance` (proposed) · PJ-09 (PRJ-06) | Phone 390 or 320 variant | `100:5414` |
| — | Flows and notes card | Site assurance · PJ-09 | `/projects/assurance` (proposed) · PJ-09 (PRJ-06) | Flows and notes | `100:5526` |
| SU01 | Stakeholder updates — worklist grouped To prepare 2, With approver 1, Needs follow-up 1, Sent, Not scheduled 1 (PJ-08) | Stakeholder updates · PJ-08 | `/projects/updates` (proposed) · PJ-08 | Register / worklist | `103:2` |
| SU02 | Stakeholder updates — prepare Update 5 from sources: statements checked Matches or Judgement; internal notes and RAID excluded by rule (PJ-08) | Stakeholder updates · PJ-08 | `/projects/updates` (proposed) · PJ-08 | Form / guided workflow | `103:1290` |
| SU03 | Stakeholder updates — preview as the customer sees it: consistent with CP-03, internal names removed, empty sections left out (PJ-08) | Stakeholder updates · PJ-08 | `/projects/updates` (proposed) · PJ-08 | Document & evidence | `103:1692` |
| SU04 | Stakeholder updates — approval: Jess Wong approves, the preparer is blocked, an approval note is required, Return for changes needs a reason (PJ-08) | Stakeholder updates · PJ-08 | `/projects/updates` (proposed) · PJ-08 | Review / comparison | `103:1988` |
| SU05 | Stakeholder updates — handed to EC-04 and sent: delivery steps Prepared, Queued, Submitted, Sent; copy in Sent Items (PJ-08, EC-04) | Stakeholder updates · PJ-08 | `/projects/updates` (proposed) · PJ-08 | Register / worklist | `103:2324` |
| SU06 | Stakeholder updates — successor correction: Update 5 corrects Update 4 and says what it corrects; Update 4 stays as sent (PJ-08) | Stakeholder updates · PJ-08 | `/projects/updates` (proposed) · PJ-08 | Record detail | `103:2653` |
| SU07 | Stakeholder updates — update settings per project: cadence 7, 14, 30 shown as Due; recipients from named contacts with notice preference; approvers (PJ-08) | Stakeholder updates · PJ-08 | `/projects/updates` (proposed) · PJ-08 | Record detail | `103:648` |
| SU08 | Stakeholder updates — customer question: owner, answer-by date, shown in My Work as Waiting on customer until answered here (PJ-08) | Stakeholder updates · PJ-08 | `/projects/updates` (proposed) · PJ-08 | Record detail | `104:1706` |
| SU09 | Stakeholder updates — recipients panel: named contacts only with notice preference; a departed recipient flagged before preparing (PJ-08) | Stakeholder updates · PJ-08 | `/projects/updates` (proposed) · PJ-08 | Panel / drawer | `104:2051` |
| SU10 | Stakeholder updates — history: revisions and sends on Block C, immutable revisions with successors (PJ-08) | Stakeholder updates · PJ-08 | `/projects/updates` (proposed) · PJ-08 | Record detail | `103:978` |
| X28 | Stakeholder updates — Approve and send: the EC-04 dialog with the required approval note and the fixed recipients (PJ-08, EC-04) | Stakeholder updates · PJ-08 | `/projects/updates` (proposed) · PJ-08 | Dialog | `104:2421` |
| X29 | Stakeholder updates — Return for changes: reason required, the prepared message is withdrawn, the draft returns to the preparer (PJ-08) | Stakeholder updates · PJ-08 | `/projects/updates` (proposed) · PJ-08 | Dialog | `104:2734` |
| PS26 | Stakeholder updates — a source changed after preparing: schedule v32 saved, the prepared message withdrawn, statements re-checked (PJ-08) | Stakeholder updates · PJ-08 | `/projects/updates` (proposed) · PJ-08 | State | `106:2507` |
| PS27 | Stakeholder updates — cannot prepare without recipients: Water treatment plant has no named contact; cadence not scheduled (PJ-08) | Stakeholder updates · PJ-08 | `/projects/updates` (proposed) · PJ-08 | State | `106:2827` |
| TB14 | Stakeholder updates — prepare Update 5 at 1024: statements with checks, details folded (PJ-08) | Stakeholder updates · PJ-08 | `/projects/updates` (proposed) · PJ-08 | Tablet 1024 variant | `106:3091` |
| PH13 | Stakeholder updates — approval on the phone: read the statements, approve with a note or return; no drafting (PJ-08) | Stakeholder updates · PJ-08 | `/projects/updates` (proposed) · PJ-08 | Phone 390 or 320 variant | `106:3374` |
| — | Flows and notes card | Stakeholder updates · PJ-08 | `/projects/updates` (proposed) · PJ-08 | Flows and notes | `106:3508` |
| AC01 | Acceptance & closeout — workspace: stages across projects with an inline inspector, recomposed inside the shell (PJ-09) | Acceptance & closeout · PJ-09 | `route:/projects/acceptance` and its six routes · PJ-09 | Record detail | `108:2` |
| AC02 | Acceptance & closeout — stage record: four parallel decisions with status, source revision, actor, time and conditions; identity once in a context strip (PJ-09) | Acceptance & closeout · PJ-09 | `route:/projects/acceptance` and its six routes · PJ-09 | Record detail | `108:584` |
| AC03 | Acceptance & closeout — readiness for acceptance: gates and blockers before decisions can be recorded (PJ-09) | Acceptance & closeout · PJ-09 | `route:/projects/acceptance` and its six routes · PJ-09 | Decision / dialog | `108:989` |
| AC04 | Acceptance & closeout — outstanding items: requirement type, owner, date needed; activity completion never completes a source obligation (PJ-09) | Acceptance & closeout · PJ-09 | `route:/projects/acceptance` and its six routes · PJ-09 | Record detail | `108:1389` |
| AC05 | Acceptance & closeout — stage pack OUT-13 issue: audience-safe preview, private Finance fields excluded by the allowlist (PJ-09, OUT-13, DK-03) | Acceptance & closeout · PJ-09 | `route:/projects/acceptance` and its six routes · PJ-09 | Decision / dialog | `108:1844` |
| AC06 | Acceptance & closeout — technical acceptance: EN-08 basis and manifest, holds not waivable, technical-only receiving (PJ-09, EN-08) | Acceptance & closeout · PJ-09 | `route:/projects/acceptance` and its six routes · PJ-09 | Record detail | `108:2249` |
| AC07 | Acceptance & closeout — customer acceptance: response recorded, then validated; partial, returned, declined and conditional shown apart (PJ-09) | Acceptance & closeout · PJ-09 | `route:/projects/acceptance` and its six routes · PJ-09 | Record detail | `108:2607` |
| AC08 | Acceptance & closeout — commercial acceptance: Finance reviewer, disposition separate, blocked by the V-02 dispute (PJ-09, FN) | Acceptance & closeout · PJ-09 | `route:/projects/acceptance` and its six routes · PJ-09 | Record detail | `108:2945` |
| AC09 | Acceptance & closeout — Service receiving: an independent named receiver works a receiving checklist (PJ-09, SV-01) | Acceptance & closeout · PJ-09 | `route:/projects/acceptance` and its six routes · PJ-09 | Record detail | `109:1827` |
| AC10 | Acceptance & closeout — Assurance released from Site assurance, with exclusions, as stage evidence (PJ-09) | Acceptance & closeout · PJ-09 | `route:/projects/acceptance` and its six routes · PJ-09 | Record detail | `109:2168` |
| AC11 | Acceptance & closeout — close stage: complete snapshot, explicit blockers, guarded close (PJ-09) | Acceptance & closeout · PJ-09 | `route:/projects/acceptance` and its six routes · PJ-09 | Decision / dialog | `111:2421` |
| AC12 | Acceptance & closeout — close project: downstream effects stated (CR-05, ES-09), blocked by the Boiler room dispute (PJ-09) | Acceptance & closeout · PJ-09 | `route:/projects/acceptance` and its six routes · PJ-09 | Decision / dialog | `111:2819` |
| AC13 | Acceptance & closeout — reopen a closed stage: reason, affected scope or source, current version, closure authority; prior acceptance retained (PJ-09) | Acceptance & closeout · PJ-09 | `route:/projects/acceptance` and its six routes · PJ-09 | Decision / dialog | `111:3217` |
| AC14 | Acceptance & closeout — history: decisions and lifecycle events across both stages (PJ-09) | Acceptance & closeout · PJ-09 | `route:/projects/acceptance` and its six routes · PJ-09 | Record detail | `109:2491` |
| X30 | Acceptance & closeout — record a customer response: Accepted, Partial, Conditional, Returned or Declined shown apart from satisfaction (PJ-09, as at Tue 3 Nov) | Acceptance & closeout · PJ-09 | `route:/projects/acceptance` and its six routes · PJ-09 | Dialog | `112:3063` |
| X31 | Acceptance & closeout — request Service receiving from an independent named receiver (PJ-09, SV-01, as at Wed 4 Nov) | Acceptance & closeout · PJ-09 | `route:/projects/acceptance` and its six routes · PJ-09 | Dialog | `112:3439` |
| PS28 | Acceptance & closeout — observer: reads the stage, no amounts, no Finance fields, no actions (PJ-09) | Acceptance & closeout · PJ-09 | `route:/projects/acceptance` and its six routes · PJ-09 | State | `112:3804` |
| PS29 | Acceptance & closeout — a later source change: EN-08 bundle r03 issued after technical acceptance, scoped reassessment of that decision only (PJ-09) | Acceptance & closeout · PJ-09 | `route:/projects/acceptance` and its six routes · PJ-09 | State | `112:4153` |
| TB15 | Acceptance & closeout — stage record at 1024: four decisions stacked, context strip once (PJ-09) | Acceptance & closeout · PJ-09 | `route:/projects/acceptance` and its six routes · PJ-09 | Tablet 1024 variant | `113:3867` |
| PH14 | Acceptance & closeout — technical acceptance on the phone: EN-08 basis and manifest, read only (PJ-09) | Acceptance & closeout · PJ-09 | `route:/projects/acceptance` and its six routes · PJ-09 | Phone 390 or 320 variant | `113:4171` |
| — | Flows and notes card | Acceptance & closeout · PJ-09 | `route:/projects/acceptance` and its six routes · PJ-09 | Flows and notes | `113:4313` |
| FS01 | Field work and Service link — project field work: typed work orders, hours and parts as cost evidence only (PJ, FI, SV) | Field work and insights · PJ | Projects field work view · RP-03 · FN-03 | Record detail | `114:2` |
| FS02 | Field work and Service link — schedule change request and Service's answer; bookings untouched until Service moves them (PJ, SV) | Field work and insights · PJ | Projects field work view · RP-03 · FN-03 | Record detail | `114:520` |
| IS01 | Insights — Delivery performance: one page, five sections, working days first with calendar days beside, counts with their rules, no targets or good-or-bad colour (RP-03) | Field work and insights · PJ | Projects field work view · RP-03 · FN-03 | Record detail | `116:734` |
| IS02 | Insights — Project financial performance: margin from the adjusted value, billed and indicative over or under billing, finance.read (FN-03) | Field work and insights · PJ | Projects field work view · RP-03 · FN-03 | Record detail | `116:1160` |
| IS03 | Insights — drill-through list: from a count to its rows, the count's rule restated (RP-03) | Field work and insights · PJ | Projects field work view · RP-03 · FN-03 | Record detail | `116:1637` |
| IS04 | Insights — Project financial performance withheld for a non-Finance reader: no amounts, no counts, the grant named (FN-03) | Field work and insights · PJ | Projects field work view · RP-03 · FN-03 | Record detail | `116:1957` |
| PS30 | Field work and Service link — partial source: Service unavailable, booking states, hours and parts a dash; requests withheld (PJ, SV) | Field work and insights · PJ | Projects field work view · RP-03 · FN-03 | State | `114:897` |
| TB16 | Insights — Delivery performance at 1024: five sections stacked, counts with rules (RP-03) | Field work and insights · PJ | Projects field work view · RP-03 · FN-03 | Tablet 1024 variant | `116:2174` |
| PH15 | Field work and Service link — field work summary on the phone: linked work orders, hours and parts as cost evidence (PJ, FI) | Field work and insights · PJ | Projects field work view · RP-03 · FN-03 | Phone 390 or 320 variant | `116:2513` |
| — | Flows and notes card | Field work and insights · PJ | Projects field work view · RP-03 · FN-03 | Flows and notes | `117:1904` |
| ST01 | Interaction states and accessibility — register rows, column headers, inline edit, address lookup, Gantt, buttons, chips, checkboxes, keyboard order, tabular figures, contrast proof (PJ) | Interaction states · PJ | — (specimen board) | Specimen board | `123:2` |
| AD01 | Administration — Projects settings hub: what can be changed, by whom, at which scope; recent changes (PJ) | Administration · PJ | `/settings/projects/…` · PJ | Overview | `119:8` |
| AD02 | Administration — project classes and start conditions: draft v4 beside published v3, draft and publish (PJ-01 A2) | Administration · PJ | `/settings/projects/…` · PJ | Form / guided (settings, draft and publish) | `119:433` |
| AD03 | Administration — publish version dialog over the classes page: impact on live projects stated (PJ) | Administration · PJ | `/settings/projects/…` · PJ | Decision (dialog) | `119:798` |
| AD04 | Administration — phases, task statuses and attention rules: rules in words, thresholds "Policy not configured" where none is adopted (PJ-02 D4, D5) | Administration · PJ | `/settings/projects/…` · PJ | Form / guided (settings, draft and publish) | `119:1113` |
| AD05 | Administration — working calendars and holidays: company default PPO-PJ-CALENDAR-01 and site calendars per project (PJ-03) | Administration · PJ | `/settings/projects/…` · PJ | Form / guided (settings, draft and publish) | `119:1547` |
| AD06 | Administration — RAID kinds and priorities, readiness categories: fixed by decision, words not scores (PJ-04, PJ-07) | Administration · PJ | `/settings/projects/…` · PJ | Form / guided (settings, draft and publish) | `119:1907` |
| AD07 | Administration — ITP templates, point kinds and severity words: draft v3 adds a point kind; pick-list values retire, never delete (PJ-09) | Administration · PJ | `/settings/projects/…` · PJ | Form / guided (settings, draft and publish) | `120:1290` |
| AD08 | Administration — update cadences, waiting limit, recipients policy and acceptance stage templates (PJ-08, PJ-01, PJ-09) | Administration · PJ | `/settings/projects/…` · PJ | Form / guided (settings, draft and publish) | `120:1738` |
| AD09 | Administration — numbering, notifications, saved views, columns, density and record layout for Projects (PJ) | Administration · PJ | `/settings/projects/…` · PJ | Form / guided (settings, draft and publish) | `120:2057` |
| X32 | Administration — retire a pick-list value: retired values stay on existing records and are never deleted (PJ) | Administration · PJ | `/settings/projects/…` · PJ | Dialog | `122:1892` |
| PS31 | Administration — settings read only for a project manager: what applies to them, no edit, who to ask (PJ) | Administration · PJ | `/settings/projects/…` · PJ | State | `122:2166` |
| — | Flows and notes card | Administration · PJ | `/settings/projects/…` · PJ | Flows and notes | `122:2439` |

## 4. Rules applied

- **Reference form.** Every new PPO record reads `<NAMESPACE>-<TYPE>-<NUMBER>`: `SYN-PRJ-000027`, `SYN-QUO-000174 r02`, `SYN-OPP-000326`, `SYN-ITP-000014 r02`, `SYN-SUB-000011`, `SYN-ECR-000014`, per [PPO-REFERENCE-NAMESPACES-DEC](readable-reference-namespaces.md) and Addendum A2 of the brief. Revision labels are two-digit (`r01`, `r02`). The longer `SYN-PPO-…` form on the accepted Design pages is legacy and is listed in section 5 (A1). Display numbers `V-01`, `O-01`, `N-01` are proposed (A8); `SYN-ITP-`, `SYN-ASR-`, `SYN-DEF-`, `SCR-` are labels only.
- **Role words.** "Project manager", never "Coordinator"; the portfolio owner is the "Projects lead"; field capture is by the "Site supervisor". The scan in section 6 found the word Coordinator only in the notes card that says it is never used.
- **No score, percentage or index** of health, readiness or risk anywhere. Attention is a rule in words (PJ05, RC01); the CR-03 chain is nine cells (IN02, RC12); readiness is a state per prerequisite (RD02); RAID priority is Normal or High (RK01); the Health view exists only as a proposal with every threshold "Policy not configured" (PJ08, AD04). Margin on FN-03 and the on-time measures on RP-03 are accepted facts and stay.
- **Lifecycle.** Active or Closed (RC17, RK11); phases Planning, Procurement, Delivery, Handover; task statuses Planned, In progress, At risk, Complete; Started is the project manager's own fact (IN06, IN07, X09); stages close and reopen under guard (AC11 to AC13). Overdue means not complete and dated before today in site time (RK10, PJ05).
- **Schedule.** Baselines are immutable revisions that keep their calendar (RC04, RC10, PG12); the forecast is a reasoned task save (PG04, PH07); FS and SS dependencies warn and never move dates (RC02, PG05, PG13); variance names its calendar ("+6 calendar days · +4 working days, Block C calendar r01"); only the project manager edits the calendar (PG07); a RAID Dependency is not a Gantt predecessor (RK08, PG13); Gantt colours follow [PPO-GANTT-FIGMA-COLOURS-DEC](gantt-figma-colours.md) (A14).
- **Money.** Requested, priced and approved amounts are never added together (CM01 to CM06, CM11); Unknown is never A$0.00 (CM02); totals read Held when a source drifts (PS17); the reviewer differs from the author (CM05, CM08); approved variations freeze and a signed adjustment is its own record (CM06); margin uses only the PJ-05 adjusted value and is visible to `finance.read` or `shared.finance.read` holders (IS02, IS04); milestone claims total exactly, `ProjectClaim` hands to Finance, no retentions (CM12); field hours and parts are cost evidence only (FS01, RC16).
- **Register standard.** One line per cell with ellipsis and sideways scroll; view tiles under the title; toolbar with segmented views, filter chips, Filters and Columns; frozen first column and row menu; group rows in the scroll band; footer with the count, as-at time and pager; no second search box. The structural pass counted 4,234 register cells, none wrapping.
- **Shell geometry and tokens.** Every sheet instances the copied top bar, rail, right strip and, where shown, the docked or collapsed menu; content runs from x 80 to 1392 with 24 px gutters; drawers and panels are 432 px at x 960 (the working calendar 680 px, D3); dialogs 560 to 720 px with a plain navy scrim at 32 %; Roboto 11 to 20 px; colours bound to the "PPO colour" variables; the accepted flyout and docked menus carry exactly the Shell file's items (PJ02, X33).
- **Counts state their rule** and read a dash when a source cannot be read (PS13, PS15, PS19, PS21, PS30, PS25); unavailable or restricted sources are never zero. Who did what and when sits on every record (history tabs on IN09, RC09, RK03, SU10, AC14); frozen revisions carry fingerprints (handover r01, baseline r01, accepted briefs, approved variations, closeout snapshots); derived values carry a "why this" trace (Needs attention, variance, readiness class).
- **Tablet and phone.** Tablet 1024 keeps the rail and folds the details column to 44 px; the phone bar is My Work, Projects, Programme, Acceptance & closeout, More (A6, A18); phones read and record site facts, decide where the decision has a phone (variation decision, update approval, check attempts), and never draft updates (Q3) or close a project.

## 5. Assumptions and proposed departures

Each item is for Dean's decision; the sheet that shows it carries the A-number in its notes card. A1 to A13 were recorded with the claim; A14 to A92 were added batch by batch.

| ID | Assumption or departure | Recommendation |
|---|---|---|
| A1 | Project references use the short namespace form (`SYN-PRJ-000027`); the `SYN-PPO-QUO-000174 r02` and `SYN-PPO-PRJ-000027` references on the accepted PJ-03 and PJ-05 Design pages are legacy examples whose numbers carry over unchanged (Addendum A2) | Keep; no rewrite of the Design pages |
| A2 | The three project classes are drawn as "Class 1 · Class 2 · Class 3 · illustrative" (PJ-01 Q11) | Dean names them |
| A3 | A critical path or what-if resequencing appears only as a proposal on the register page notes, never moving dates (PJ-03 Q5, N-P9) | Keep as proposal |
| A4 | The Projects Pulse (PJ06) is a new page under Delivery, proposed, with My Work remaining the cross-module queue | Keep |
| A5 | Acceptance & closeout is recomposed inside the shell's 1312 px content region (AC01); the Design file's fixed 220 / 464 layout is the departure | Keep |
| A6 | The phone bar is My Work, Projects, Programme, Acceptance & closeout, More, as the code carries it; Updates sits under More (PJ-08 proposal recorded) | Keep |
| A7 | A Health view is drawn once as a proposal (PJ08) with every threshold marked "Policy not configured" (PJ-02 Q, NAD-04, D-017) | Keep as proposal |
| A8 | Display numbers V-01…, O-01…, N-01… for variations, obligations and notices are drawn and marked proposed (PJ-05 G3); the allocation rule is left to the build | Keep as proposal |
| A9 | The collapsed docked workspace menu is a 56 px icon strip with per-user persistence (PJ03, PG02), derived here because the Shell file has none; a proposed shell departure | Keep as proposal |
| A10 | The rebuilt shell copy "Shell / Rail · collapsed" shows Projects as the current workspace; everything else matches the Sales copy except node IDs | Keep |
| A11 | Capabilities marked † in the brief (updates prepare and approve, site assurance plan, check, review and release, RAID read and edit) do not exist in `src/platform/permissions.ts`; the sheets draw them as design assumptions. The observed `coordinator` profile holds no `project.commercial.*` or `project.specialist.*` grant and no `acceptance.technical`, `.commercial`, `.receive` or `.response.validate`; `acceptance.commercial` sits with `finance-reviewer` | Record; a build needs its own capability decision |
| A12 | Code, the role profile `coordinator` and the earlier Design pages still say Coordinator; renaming them is a separate change | Record |
| A13 | `docs/design/development/pages/scope-pj-09-site-assurance.md` still reads "Draft for visual review" although the design was accepted on 1 November 2026 | Record as stale; fix in its own change |
| A14 | Gantt bars are coloured by task status per PPO-GANTT-FIGMA-COLOURS-DEC; the brief's "pastel by phase" wording is read as that decision | Keep |
| A15 | Register view tiles double as the counts (Active 9, Needs attention 3, Starting 2, Closing 2, Closed 2026 6) | Keep |
| A16 | A selection bar appears above the register when rows are selected (PJ04), with Open in sequence and Export list | Keep |
| A17 | The docked Projects menu is drawn as the Shell file has it, with a Pinned group; the brief's Favourites, Saved views and Recent sit in the flyout's third column | Keep |
| A18 | The phone bar label reads "Acceptance" for Acceptance & closeout at 390 px | Keep |
| A19 | Initiation story references (SYN-OPP-000301, -000318, -000296, deal owners, fingerprints) are synthetic where the brief named none | Record |
| A20 | A reminder and escalate rule on the waiting limit (ageing flag at 5 days, My Work escalation) is drawn as proposed (IN08) | Keep as proposal |
| A21 | Receiving-state words follow the Sales file's Handovers page (Sales A6): Receiving review, question sent, returned, started | Keep |
| A22 | The record's accepted six views gain Commercial and Updates as tabs; Scope & sites, Team & stakeholders and Field work & bookings sit under a More tab as proposals; Schedule list is a switch inside Schedule | Keep |
| A23 | The Commercial view shows the PJ-05 summary to holders of `project.commercial.read`; PJ-02 Q3 tied it to a MYOB read, which does not exist yet, so the MYOB line stays hidden | Keep |
| A24 | Scope & sites carried from the Sales Scope & sites tab at handover r01 (RC14), proposed | Dean decides |
| A25 | Team & stakeholders as names and roles, not grants (RC15), proposed | Dean decides |
| A26 | Field work & bookings on the record as typed work-order links and cost evidence read only (RC16), proposed | Dean decides |
| A27 | Catch me up (N-P1) drawn integrated as a panel from the … menu, reviewed and never saved (X13) | Keep |
| A28 | Gantt Display options (X14, PG03) are saved per person and project; the variance unit defaults to calendar days first (PJ-03 Q1) | Keep |
| A29 | Block C Sales attribution (SYN-OPP-000274, handover r01 Mon 14 Sep, Taylor Brooks), the closed Dosing upgrade decisions and the Water treatment handover are synthetic additions | Record |
| A30 | PG04, PG06, PG08, SA04, SA05, SA08, X09, X30 and X31 are dated at the event they show (labels say "as at") so the brief's facts can be drawn truthfully | Keep |
| A31 | Programme rows need a start and a baseline finish for every project; where the brief gives none the dates are synthetic and consistent with the register | Record |
| A32 | Programme row statuses read On baseline, Behind, At risk, No baseline, Complete; task rows keep the four accepted statuses | Keep |
| A33 | Ask owners to review routes an external owner (SYN Brightline Electrical, no account) to the package receiver; the project manager's own tasks are not requested | Keep |
| A34 | The Working calendar editor adds a non-working-hours exception kind (07:00 to 15:00) for the customer shutdown; the accepted decision names whole-day exceptions only | Dean decides |
| A35 | PG12 compares r01 with the proposed r02 (the current forecast) because r02 is not recorded in the story | Keep |
| A36 | X16 and X17 are confirmation dialogs for the calendar save and the handed draft; the brief lists neither | Keep |
| A37 | Readiness category names follow the r01 HTML (Engineering, Materials, Site & customer, Crew & attendance, Work preparation, Commercial) rather than the brief's paraphrase | Keep |
| A38 | Two prerequisites per category for Block C and their evidence lines are synthetic; the blocker, the three actions and the shutdown are the brief's facts | Record |
| A39 | The work release gate (RD07) offers a narrower stated scope named by the project manager; the accepted design names the class and the blocker only | Dean decides |
| A40 | RD05 shows a proposed programme as a comparison only; saving stays in Programme and baselines | Keep |
| A41 | RD06 keeps the three EN-07 response options from the r01 HTML; "Exclude by name" feeds the Site assurance release exclusion (SA09) | Keep |
| A42 | Readiness evidence (X18) is recorded by one person and reviewed by another before a state changes | Keep |
| A43 | V-06 Zone 2 flow meter relocation is a synthetic Requested variation so the Requested state and Unknown as a value can be drawn; it keeps the brief's open count of 3 | Record |
| A44 | CM08 is drawn as at Fri 16 Oct, when O-04 was waived; the register row reads Overdue · 2 days in words (R7) | Keep |
| A45 | Claim lines allocate V-01 to claim 1 and V-03 to claim 2 as separate lines; the brief gives the claim totals only | Record |
| A46 | CM13 cross-project commercial queue is proposed (G1); counts only, amounts per record, never totalled | Dean decides |
| A47 | Held clears by re-approval or by a dismissal recorded by a reviewer who is not the basis author | Dean decides |
| A48 | The phone reads variations and records; decisions and pricing stay on desktop and tablet | Keep |
| A49 | A disputed variation is resolved by a new version, a withdrawal or a notice (X21); the accepted decision names Disputed without its exit | Dean decides |
| A50 | Sources by name and revision for the Potting machine and Propagation house commercial records are synthetic | Record |
| A51 | The 19 open RAID entries are the brief's 12 named rows plus 7 synthetic entries so the register shows the stated count | Record |
| A52 | Block C has 7 RAID entries (6 open or monitoring per the brief plus the closed Issue listed in 9.6) | Record |
| A53 | The RAID register groups by project with view tiles Open, High, Review deadline passed, Monitoring, Closed · 30 days | Keep |
| A54 | A RAID owner may be a customer contact by name (Sam Okafor); "active scoped owner" is read as any named person with current access | Dean decides |
| A55 | Monitoring sets a review deadline when entered; the decision requires one on creation only | Keep |
| A56 | A RAID entry may link to a variation, a readiness item, a schedule task or a handover; the decision defines links to Activities only | Keep |
| A57 | The certificate of compliance in review is SYN-SUB-000011's evidence (Block C), reviewed by its receiver Robin Hale; Site assurance hold point 5 on Glasshouse 4 reads a Brightline certificate through PJ-06 as received | Record |
| A58 | Document revisions are bound at submission and frozen with acceptance (four per brief) | Keep |
| A59 | A Blocked register state is shown for a draft that cannot be submitted (no approved basis) | Keep |
| A60 | Successor corrections carry the predecessor's other bound documents forward at their accepted revisions unless changed | Keep |
| A61 | Evidence review records matched and not-matched items per bound document; a return names the not-matched items | Keep |
| A62 | Receiving states read a dash while Supply is unavailable and submission is withheld | Keep |
| A63 | The Block C and Boiler room plans, SYN-ASR-000005 and the two Minor defects are synthetic to fill the register and the counts | Record |
| A64 | Check rows show kind, result, when and by; the release proposal and rules cards sit beside each other on the ITP record | Keep |
| A65 | Hold point 5 stays Outstanding until the PJ-06 receiver accepts the evidence; the brief's "Jamie Rossi accepts it there" is read as the receiver on that package | Dean decides |
| A66 | A Critical defect (X27) is drawn on a Block C plan because the Glasshouse 4 story has no Critical defect; the FI-06 prompt is a link to Field's record | Keep |
| A67 | Issuing r03 flags earlier attempts "run against r02" and keeps them | Keep |
| A68 | The supervisor's phone queue is drawn as three single-check screens; the queue list itself is on the Field work page | Keep |
| A69 | Update 5 on Block C is both the scheduled cadence update and the successor that corrects Update 4 | Keep |
| A70 | The phone may approve an update with a note or return it, but never drafts (Q3) | Keep |
| A71 | Statement checks are Matches, Judgement (forecast) or Re-check (source changed) | Keep |
| A72 | The customer preview is rendered to the CP-03 standard as a letter-style email; CP-03's exact layout is not in this file | Keep |
| A73 | The approver list per project is the send-duty holders Jess Wong and Jordan Hale; Morgan Lee is blocked when preparer | Keep |
| A74 | The Glasshouse 4 statements, the Propagation house answer text and the departed recipient (Noah Patel) are synthetic | Record |
| A75 | The six acceptance routes are drawn as tabs on one page; each keeps its route | Dean decides |
| A76 | An inline 440 px inspector replaces the Design file's 464 px inspector and collapses below 1312 px; the project context strip is the record subtitle | Dean decides |
| A77 | Customer response types Accepted, Partial, Conditional, Returned, Declined are recorded verbatim and validated in a second step | Keep |
| A78 | Commercial acceptance separates the decision from a disposition; carrying a dispute needs a second Finance reviewer | Dean decides |
| A79 | Propagation house stage 2 facts beyond section 9.8 and the Boiler room amounts are synthetic | Record |
| A80 | Reopen a stage (AC13) mirrors the project reopen (X15) | Keep |
| A81 | The field work register's "work orders linked 5" counts open links; completed Block C work orders sit under History | Keep |
| A82 | Project financial performance is drawn as the Projects view of the Finance rail page (FN-03 D1) | Keep |
| A83 | All amounts on IS02 and the milestone and acceptance counts on IS01 are synthetic | Record |
| A84 | Schedule change requests carry a label SCR-nn and a lifecycle Requested → Accepted, Proposed another window or Declined | Dean decides |
| A85 | A drill-through restates the count's rule and opens the records, not a copy | Keep |
| A86 | Service unavailable withholds the request action | Keep |
| A87 | A 280 px settings navigation column lists the eight settings pages inside the content region | Keep |
| A88 | Every publish needs a reviewer who is not the editor | Dean decides |
| A89 | Publishing applies to new projects by default, with an opt-in for live projects in Planning and no retroactive change past Started | Dean decides |
| A90 | Draft v3 of the cadences makes the default phase-dependent (7 days in Delivery) | Dean decides |
| A91 | An "Inspector hold" point kind is added in draft v3 as the brief's S-28 example | Keep |
| A92 | Notifications are company defaults with personal overrides; no decision defines the notification set | Dean decides |

## 6. Verification

Every sheet was rendered at 1200 to 1440 px and inspected after its batch; corrections were made in the same batch and are listed in section 7. The routines of the brief's section 11.6 were run per page after each batch and across the whole file on 10 November 2026.

| Page | Frames | Register cells | Structural issues | Position audit |
|---|---|---|---|---|
| Projects register and Pulse · PJ-02 | 24 | 1,197 | 0 | clean |
| Initiation · PJ-01 | 22 | 78 | 0 | clean after re-placing IN07 (had shared a slot with IN10) |
| Project record · PJ-02 | 30 | 336 | 0 | clean |
| Programme and baselines · PJ-03 | 22 | 863 | 0 | clean |
| Delivery readiness · PJ-07 | 13 | 354 | 0 | clean |
| Variations & obligations · PJ-05 | 22 | 297 | 0 | clean |
| Risks & issues · PJ-04 | 18 | 389 | 0 | clean |
| Subcontractor packages · PJ-06 | 14 | 74 | 0 | clean |
| Site assurance · PJ-09 | 21 | 117 | 0 | clean after re-placing SA08 (had shared a slot with SA09) |
| Stakeholder updates · PJ-08 | 17 | 64 | 0 | clean after re-placing SU10 (had shared a slot with SU09) |
| Acceptance & closeout · PJ-09 | 21 | 32 | 0 | clean |
| Field work and insights · PJ | 10 | 203 | 0 | clean |
| Interaction states · PJ | 2 | 160 | 0 | clean |
| Administration · PJ | 12 | 70 | 0 | clean |
| **Total** | **248** | **4,234** | **0** | separators and Scratch empty; nothing loose on any page |

- **Structural pass.** Every sheet's direct children sit inside its bounds; no register cell wraps; Roboto is the only family; every sheet carries a label with its code.
- **Position audit.** Sheets inside their sections; no sheet, label, section or card overlap at any level; labels truncated to the sheet width; the two separator pages and Scratch are empty (the probe sheet was removed).
- **Contrast.** ST01 computes 29 foreground-on-background pairs from the 66 "PPO colour" variable values at build time: every text pair meets 4.5:1, the non-text pairs (control borders, focus ring, Gantt bar edge) meet 3:1, none passes only at large text.
- **Wording scans.** No digit followed by a percent sign appears on any sheet except the phrase "200 % zoom" in tablet labels; "score" appears only in sentences that say there is none; "Coordinator" appears only in the register notes that say it is never used; the `SYN-PPO-` form appears only in two notes cards that cite it as legacy (A1).
- **Story scan.** Every count, name, date and value on the sheets was taken from section 9 of the brief or from the story node derived from it (`27:182`); where the brief is silent the value is synthetic and listed in section 5 (A19, A29, A31, A38, A43, A45, A50, A51, A52, A63, A74, A79, A83). The Projects side of the Mallee, Yarra and Greenhill handovers matches the Sales file's Handovers page cell for cell; the Woodhaven quotation reads SYN-QUO-000177 r02 as section 9 says, not the Design page's earlier fixture.
- **Capability scan.** Each sheet names its signed-in person in its label or subtitle and withholds what that person may not see: observers see no amounts (PS28, IS04), non-Finance readers see no value breakdown (PS18), authors cannot decide (CM04), preparers cannot approve (SU04), the project manager cannot override a hold (SA10) or clear a blocker (X19). Capabilities marked † remain assumptions (A11).
- **Repository checks** run for this change: `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py`; results in the pull request. `origin/main` was re-merged before the push.

## 7. Audit and open questions

**Corrections made during the build (C, all fixed).** Three slot collisions where two sheets were placed on the same grid position (IN07 over IN10, SA08 over SA09, SU09 over SU10), found by the position audit and fixed by re-placing each page's desktop sheets in code order; the Gantt variance column reading a dash because the story field is named differently, fixed in the Gantt builder; the record's eleven-tab row overflowing the 884 px main column, fixed by keeping the accepted six views plus Commercial and Updates as tabs and moving the three proposed views under More (A22); three header or footer labels that overflowed (RD02 picker, SA03 action, SA09 footer note); the baseline-comparison KPI values and column headers (PG12); the variations table wider than its card (RC05); V-03's signed-adjustment cell aligned with the value breakdown (CM01); RD05 redrawn after a build error left it incomplete. No correction is open.

**Refinements (R).** R1 The record's Overview and its details column run below 852 px and scroll; consider collapsing the Sales attribution card by default. R2 The Schedule task panel overlays the timeline at 1440 px; pin it inline above 1600 px. R3 Gantt bar labels truncate inside short bars at 1024. R4 Tablet avatars render late in Figma (a render-timing artefact only). R5 Register tables inside cards sometimes exceed the card width and scroll; narrow the default columns per view.

**Gaps (G).** G1 The Health view (PJ08), Projects Pulse (PJ06), critical path and what-if (A3), the cross-project commercial queue (CM13), Scope & sites, Team & stakeholders and Field work & bookings (RC14 to RC16) and the collapsed docked menu (PJ03) are proposals for Dean's decision. G2 The flyout (X33) and docked (PJ02) menus are kit compositions of the accepted items, not copied Shell components, because the Plugin API cannot copy across files; swap to the library component when PPO - Library exists. G3 Competence and insurance checks read Not checked here (PJ-06). G4 Class names (PJ-01 Q11) and Health thresholds (NAD-04, D-017) wait on Dean. G5 No RD or SP phone sheet (not required by the brief). G6 The exact CP-03 layout is not in this file.

**New features (N).** N-P1 Catch me up is integrated (X13) and referenced on IN02 and AC02 notes; N-P2 Why this date is integrated as "Why it moved" (RC02, PG04, PH07); N-P3 Attention explained is integrated as "Why these" (PJ05, RC01); N-P4 Focus for today is integrated on the Pulse (PJ06). N-P5 statement checks (SU02), N-P6 suggested RAID entries (IN04, RD03), N-P7 variation impact preview (CM03, CM12), N-P8 photo-to-defect (PH11), N-P9 what-if (register notes), N-P10 difference explanation (IN02) are marked as proposals on the sheets or their notes cards; every AI feature is a reviewed summary or suggestion that never writes to a record.

**Polish (P).** P1 Default column widths against card widths; P2 label truncation on long sheet names; P3 the Shell's exact flyout spacing once the component is copied.

**Recommended order.** Dean's decisions on A1 to A92 and the G items first (they change what is accepted), then R1, R2 and R5, then P. No C remains open.

**Coverage matrix (section 4.3 of the brief).** Each scenario is completable on the sheets named; states and dialogs are listed where the scenario needs them.

| Scenario | Sheets and states |
|---|---|
| S-01 | PJ01, PJ05, PJ06, IN01 |
| S-02 | IN01 to IN08, X06, X07, X08, X10 |
| S-03 | IN01, IN08 |
| S-04 | RC01, TB04, PH05 |
| S-05 | RC02, PG04, PG05, PG08, PG10, PH07 |
| S-06 | RC04, RC10, PG12 |
| S-07 | PG01, PG02, PG03, PG09, TB06 |
| S-08 | PG06, PG07, X16 |
| S-09 | CM10, CM07, CM08, CM09 |
| S-10 | CM01 to CM06, CM11, TB10, PS17 |
| S-11 | CM12 |
| S-12 | RK01 to RK08, RK11, X22, X23 |
| S-13 | IN04, X07, RK09 |
| S-14 | SP01 to SP08, X24, X25, PS22 |
| S-15 | RD01 to RD07, X18, X19 |
| S-16 | SA02 to SA06, SA10, PH10, PH11 |
| S-17 | SA07, SA09, AC10 |
| S-18 | SU01 to SU08, X28, SU03, PH13 |
| S-19 | AC01 to AC11, X30, X31 |
| S-20 | AC12, AC14 |
| S-21 | AC13 |
| S-22 | FS01, FS02, PH15 |
| S-23 | IS01 to IS04, TB16 |
| S-24 | PS03, PS05, PS11, PS28 |
| S-25 | PS06, PS10, PS26 |
| S-26 | PS07 |
| S-27 | PS15, PS13, PS21, PS30 |
| S-28 | AD01 to AD09, X32 |
| S-29 | ST01, PJ01, X01, RC01 |
| S-30 | PG02, PJ03 |
| S-31 | PH13, PH14 |
| S-32 | IN10 |
| S-33 | SA08, PH12, AC05 |
| S-34 | X04, X05, PS04 |
| S-35 | X13 (RC01), N-P1 |
| S-36 | CM09, RD03 |
| S-37 | RD06, SA09, X26 |

**Open questions** carried from the repository's own records, not re-asked here: PJ-01 Q7 (return after acceptance needs a contract change), Q9 (how a real source conflict settles), Q11 (class names); PJ-02 Health thresholds (NAD-04, D-017) and Q3 (MYOB summary); PJ-03 Q5 (critical path out of scope); PJ-05 D-010, D-017 and gaps G1 to G8; PJ-06 competence and insurance evidence; Site assurance "does Powerplants run ITPs this way" and Q7 (earlier Design-page dates); PJ-04 escalation rule and whether RAID becomes a closeout gate; PJ-08 Q4 (story clashes); PJ-09 Q5 (the recomposed layout); CR-03 OQ-02 and OQ-03; FN-03 D-017. Questions the sheets raise are on each page's notes card.

## 8. Boundary and next steps

This record authorises nothing in the application: no code, route, migration, permission, capability, grant or seed. The design register (`docs/design/development/register.json`) and the `pages/route-projects-*.md` and `scope-pj-*.md` guidance are not edited here; every Projects route stays "Needs review" and their update follows in its own reviewed change once the design is accepted. Sales file follow-ups: the two-digit revision labels (`r01`, `r02`) in a polish batch; the collapsed docked menu and the register standard once adopted; the Addendum A2 reconciliation of short forms is withdrawn.

Next steps: Dean reviews the file and saves the named version "PPO - Projects module (proposal) · 10 November 2026 · batch 14"; this record then gains the named version, Dean's acceptance and the A-number decisions in later sections, as the Sales record did; any later design change needs a new named version. The extended helper library stays in the file's hidden nodes (`23:130`, `25:308`, `27:182`, `28:182`) and in the session scratchpad so later sessions can continue from it.
