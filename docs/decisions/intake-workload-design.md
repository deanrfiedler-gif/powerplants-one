---
document_id: PPO-EST-INTAKE-WORKLOAD-DESIGN-DEC
date: 2026-10-11
owner: Dean Fiedler
status: Owner-accepted design; amends the shared record-window rule; native implementation, shell rollout and UI baseline acceptance separate
source_commit: 611123bd2417e844ad07a0ef6c83b84c0191f6cd
versioning: git
---

# Intake & workload design — owner decision

On 11 October 2026 Dean asked for the next Estimating page to be designed in Figma. Claude offered three candidates and recommended Quotations. Dean replied: "We are working on the quotations pages in another session, so proceed with you next recommendation that is after quotations." Claude's next recommendation was Intake & workload (`/estimating`, ES-01), Estimating's front door. Its docked 448 px detail panel and drawer squeeze the register, which is the clearest conflict with the pattern Dean accepted the same day for [Reviews & approvals](estimate-reviews-design.md): record windows overlap the register and never squeeze it.

Claude drew the page with synthetic data and with the ES-01 rules as the code and the ES-01 records state them. During review Dean decided a change to the shared pattern (the record window's maximum width, section 4), asked whether Claude was satisfied, approved the three fixes Claude named, and installed the Figma desktop app so that Claude could play the prototype. Dean then saved the named version "Intake & workload — Pipedrive pattern, accepted" and approved the lock-in ("yes").

This record retains his decisions, the design reference and its icon-free captures, the conformance declaration, the display rules, the departures, the shared-pattern amendment, the ES-01 decisions this design supersedes, and what remains open.

Scope: the existing Estimating destination `estimates` ("Intake & workload", route `/estimating`, including the Saved estimates view at `/estimating?tab=estimates`), register entries `route:/estimating` and `scope:ES-01`. No parent requirement ID is added or renamed. This is a design decision. It authorises no application code, read change, route change, migration, permission, capability or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design Intake & workload next | User decision, 11 October 2026 | "We are working on the quotations pages in another session, so proceed with you next recommendation that is after quotations." Claude had offered Quotations (recommended), Intake & workload and Cost sources. Claude's reasons for Intake & workload: it is the department's front door, and its docked panel and drawer conflict with "overlap, never squeeze" |
| Reuse the accepted pattern | Prior user decisions | The [Reviews & approvals decision](estimate-reviews-design.md), section 1: the white selected rail tile, lines between body cells, the rail collapsing to icons, fixed checkbox and gear columns, record windows that overlap the table, phone list rows, no breadcrumb on the phone and an icons-only phone tab bar |
| Record window maximum width | User decision, 11 October 2026 | "make the maximum width of the record container working on a scenario when both the primary and secondary menus are open." Claude had reported that, with the rail and menu both collapsed, the window's close, previous and next controls were cut off behind the narrow rail, on this page and on Reviews & approvals. Section 4, A1 |
| Where to record the amendment | User decision, 11 October 2026 | Dean saved the named version "Reviews & approvals — record width capped". Claude recommended leaving PR #416 describing the version it cites and recording the amendment here; Dean replied "Proceed with your recommendation" |
| Fixes before locking in | User decision, 11 October 2026 | Dean asked "Are you now satisfied with that design?" Claude named three things: titles cut short, the phone record title cut off, and a Saved estimates menu item that led nowhere. Dean replied "Proceed with the three fixes" |
| Present-mode check | User request, 11 October 2026 | "I do have a local desktop version of Figma now. could you use it?" Claude played both flows in Figma desktop; section 7 |
| Acceptance | User decision, 11 October 2026 | Dean saved the named version "Intake & workload — Pipedrive pattern, accepted" and answered "yes" to Claude's lock-in plan, which named the ES-01 decisions this design replaces |
| Menu heading fix | User decision, 11 October 2026 | "Proceed with your recommendation on the menu heading". Claude had recommended fixing the shared "v2 / Menu heading" once in Shell v2 rather than page by page. Section 4, F1 |
| Recommendations on the notes card | Adopted with the accepted design | Claude's recommendations were on the page's notes card when Dean saved the named version. Section 4 lists them as departures W1–W11 |
| Building the page or the shell | Not decided | Section 6 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team, at the named version "Intake & workload — Pipedrive pattern, accepted". The file's link is not recorded in this public repository, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Accepted frames | Page "Intake & workload · ES-01" `128:8845` (formerly "Intake & workload (accepted)"; renamed on 25 October 2026 by the [Figma file audit](../design/figma-file-audit/figma-file-audit-2026-10-24.md), R1): desktop register `128:8846`, desktop with two rows selected `128:9024`, desktop Saved estimates `172:1535`, phone `128:9231`. Its notes card `128:9424` lists the scope, changes, rules, handovers, parts, decisions, recommendations, open questions and what is not drawn |
| Page components | Workload grid row `128:9250` (Default `128:9251`, Hover `128:9262`, Selected `128:9273`) and header `128:9284`; Saved estimate grid row `172:1327` (Default `172:1328`, Hover `172:1342`, Selected `172:1356`) and header `172:1486`; Workload list row (phone) `128:9295`; Workload snapshot (phone) `128:9308`; Intake rules (menu) `130:1212`; Toolbar search `130:1232` |
| Shared parts | The Shell v2 (proposal) parts listed in the [Reviews & approvals decision](estimate-reviews-design.md), section 2, unchanged. Two new icon components on the Components page, copied from Dean's Kit: `Icon/solid/calculator` `128:8477` for the selected rail item and `Icon/list` `128:8481` for All workload |
| Prototype | Flows "Intake & workload — desktop (proposal)" and "Intake & workload — phone (proposal)". They use the existing Prototype switches |
| Amended shared rule | Reviews & approvals record windows `80:996` and `81:1037`, at the named version "Reviews & approvals — record width capped" (section 4, A1) |
| Retained captures | [Intake & workload design r01](../reference/ui/estimating/intake-workload-design-r01/README.md): seven icon-free PNGs at exact frame size, with hashes. These are the repository reference for this decision |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | The existing destination `estimates` ("Intake & workload") in the Estimating & quotation rail (`src/shell/navigation.ts`), route `/estimating` and its Saved estimates view `/estimating?tab=estimates`, register entries `route:/estimating` and `scope:ES-01` |
| Page type (r20) | Register / worklist, with a record detail window and a multi-select action panel. On the phone: a list with a full-screen record view. This replaces ES-01's supporting type "Work queue + persistent detail" and its drawer |
| Reused components | The Reviews & approvals shell and grid parts (v2 / Rail, Rail item, Menu item, Menu heading, Menu edge, Menu strip, More panel, Grid / Header cell, Grid / Cell, Checkbox, Checkbox cell, Row actions cell, Tab item, Tab bar (phone)). Also Shell / Top bar, Shell / Phone header, Quick add, Button, Tag, Brand / Logo, and Font Awesome Light icons named as in `src/components/font-awesome-icons.ts`. Page-specific: the workload and saved-estimate grid rows and headers, the phone list row, the phone record view, the Intake rules block and the toolbar search |
| Source authority | ES-01: the [scope entry](../design/development/pages/scope-es-01.md) (native workload contract and design adoption) and the [design board record](es01-design-board.md). The read model is `src/estimating/workload.ts`; labels come from `src/estimating/workload-query.ts`; the next-step text, record facts and saved-estimate wording come from `src/components/estimating-workload.tsx`; saved estimates come from `listEstimates` in `src/estimating/reads.ts`. Fixture: synthetic `SYN-PPO-OPP` and `SYN-EST` references, "SYN …" customers and sites, people, dates and amounts |
| Incoming handover | Unchanged from ES-01: the canonical Sales opportunity (id, company, version and need summary), the estimating workspace and its selected alternative, and a post-Won Sales handover-due reference shown as an obligation only. No intake acceptance is inferred |
| Outgoing handover | Links only. In the record window, "Open discovery" opens `/estimating/discovery/[id]` (or the guarded Start discovery, `/estimating/discovery/new?opportunity=[id]`, when no workspace exists) and "Open Sales opportunity" opens `/sales/opportunities/[id]`. A saved estimate opens `/estimating/estimates/[id]`, and New estimate opens `/estimating/new` where the read says `can_create`. Ordinary navigation and filtering write nothing |
| States shown | The register with all four readiness states, unallocated owners and a Won record. The record window for an opportunity in Scope clarification, with its alternatives and Sales context. A two-row selection with the small panel. The Saved estimates view, including Not estimated. The rail and menu collapsed with the record window open. The phone list and the phone record view. The More slide-out, the menu collapse and the rail collapse work in the prototype. Section 6 lists what is not drawn |
| Departures | Section 4 |
| Verification | Section 7 |

## 4. Display rules, departures and the shared-pattern amendment

### Display rules

Each rule displays what the code records. It adds no state to the database and no rule the code does not have.

| Column or view | Shown as | Source |
|---|---|---|
| Readiness | The four states Discovery not started, Scope clarification, Discovery complete and Legacy manual basis, taken from the selected alternative's latest discovery revision. Tags use ES-01's tones: Scope clarification attention, Discovery complete success (the app's pale green tag with dark green text), the other two neutral. Words carry the state. Complete scope approves no price and issues no quotation | `workloadState` in `workload.ts`; `workloadLabels`; ES-01 P3 and O2 |
| Estimating owner | The estimating workspace owner, or "Not allocated". Estimator allocation is Not configured, so the page never assigns an owner | `estimating_owner`; the native workload contract |
| Changed | The opportunity's last change, most recently changed first, with the sort marker. Same-year dates drop the year ("9 Oct"). The Sort button keeps the Customer order | `updated_at`; the Recently changed and Customer sorts |
| Discovery | "Option B · r4 · 2 alternatives", or "No discovery workspace" | `discoverySummary` in `estimating-workload.tsx` |
| Sales | The opportunity's close outcome (Open or Won). Closed Sales records appear only where an estimating workspace exists | `close_outcome`; the workload query |
| Menu views and counts | All workload and My estimating work (the workspace owner, not the Sales owner); a Scope readiness group with the four states; an Estimates group with Saved estimates. Counts cover the same search- and owner-matched window of up to 100 opportunities, counted before the readiness view applies, so a count always equals the rows that view lists. The note under the grid says so | `counts` in `workload.ts`; ES-01 P2 |
| Intake rules | Intake acceptance, estimator allocation, return decisions and priority rules read Not configured; the required response date reads Unknown, once per record in the record window and in the menu's Intake rules block | The native workload contract; ES-01 P6 |
| Saved estimates | Up to 100 permitted estimates, most recently saved first, each a draft. Saved sell is the saved manual sell total in AUD, excluding tax; tax is not calculated. An estimate without cost lines reads Not estimated, never zero | `listEstimates`; the saved-estimates table in `estimating-workload.tsx`; ES-01 P8 |

### Departures

The Reviews & approvals departures D1–D10 apply, with D5 amended by A1 below. These are the Intake-and-workload-specific departures from today's page:

| ID | Departure | Today's page |
|---|---|---|
| W1 | The register becomes the grid. Opportunity (reference and Sales source version), Title, Customer, Readiness and Changed are in view at 1440 with the menu open; Estimating owner, Discovery, Site, Sales owner and Sales scroll in from the right. In the build, Title takes any spare width when a menu collapses | Rows with three columns (opportunity, readiness, ownership) beside a docked panel |
| W2 | The record window overlaps the grid at every width, from the secondary menu's right edge, with close, previous and next on its edge | A persistent 448 px panel from 1360 CSS px (P1, O1) and a 448 px drawer below that (P7) |
| W3 | Secondary menu views with counts: All workload, My estimating work, the Scope readiness group and the Estimates group with Saved estimates | The readiness segmented control (P2) and the Workload and Saved estimates section tabs (P4) |
| W4 | Toolbar: the literal search "Search customer, opportunity or brief", the Sort button, the count, Refresh and "…". The owner choice becomes the My estimating work view | Search, owner and sort inline with Apply filters and Clear filters (P5) |
| W5 | An Intake rules block at the foot of the secondary menu holds the Not configured items, Required response Unknown and the reminder that Discovery complete approves no price | The "Intake authority and policy" card below the register |
| W6 | Record window. On the left: the title, reference, Sales source version and outcome, the readiness tag and the selected alternative; the brief; the next estimating step; a summary (customer, site, estimating owner, Sales owner, Required response Unknown, last changed); and a rule note. On the right: tabs for Alternatives and Saved estimates, and the Sales context with "A Sales action date is not a quotation deadline." Footer: Open Sales opportunity and Open discovery | The panel or drawer with the same facts in one column |
| W7 | The small panel for a selection offers Open in sequence and Export list only, and says that nothing is accepted or assigned, because intake acceptance and estimator allocation are not configured | None |
| W8 | The Saved estimates view uses the grid: estimate and version, title, customer, saved (most recently saved first) and "Saved sell, AUD excl. tax", right-aligned. New estimate sits at the left of the toolbar, where Pipedrive places its add button. Rows link to the saved estimate page; no record window is drawn | A table under the Saved estimates tab |
| W9 | Phone: flush list rows (title and changed; reference and readiness; customer and owner), a full-screen record view whose full title is a heading in the body, with the reference in the header, and Intake & workload as the current tab | Cards carrying the full detail at 760 CSS px of register width and below |
| W10 | The selected rail item uses the Solid calculator icon, and All workload the Light list icon, both copied from Dean's Kit into the private file | Not applicable |
| W11 | A short note under the grid replaces the summary paragraph above the register: "Up to 100 matching opportunities are checked, most recently changed first. Counts and readiness views apply within that window; search to find older work. Closed Sales records appear only where an estimating workspace exists." | A summary paragraph above the register |

### Shared-pattern amendment

| ID | Amendment | Replaces |
|---|---|---|
| A1 | The large record window is never wider than it is with both the rail and the secondary menu open: 960 px at 1440. When either collapses, it stays right-aligned at that width, so its left edge stays at 480 px and close, previous and next stay over the grid. In the build, its width is the content width with both menus expanded, and it is right-aligned. Applied in Figma to this page and to the Reviews & approvals record windows (named version "Reviews & approvals — record width capped"). Capture 05 shows it | Reviews & approvals D5: the large window "starts at the secondary menu's right edge and follows it when the menus collapse" |

A1 is a rule of the shared pattern, so it applies to every page that uses it. The Quotations, Cost sources and Sales briefs records were made from the earlier rule, and this session did not change their Figma pages; bringing them in line is for their next revision.

### ES-01 decisions superseded by this design

When the page is built to this design, these [ES-01 decisions](es01-design-board.md) are replaced: P1 (the persistent detail panel), P4 (the section tabs), P7 (the drawer) and O1 (the 1360 CSS px breakpoint). P2's segmented control becomes menu counts with the same count rule, and P5's inline owner choice becomes the My estimating work view. P3, P6, P8, O2 and the native workload contract stay in force. Until the page is built, the app keeps the ES-01 implementation as it is.

### Shared component fix

F1. The Shell v2 component "v2 / Menu heading" (`73:48`) was 24 px tall but drew its text from 18 px, so the text overhung the next item by 10 px. Under a plain item this was invisible; a highlighted item directly under a heading hid the heading. This page first used 34 px heading copies. On Dean's decision the component itself now hugs its text: 18 px above, no padding below, 34 px tall, the same spacing this page used. Every side menu and the More slide-out on every page moved down 10 px per heading; no menu overflows. On this page the side-menu headings are unchanged, and the Intake rules block at the foot of the menu now starts 10 px higher because its heading has room. The retained captures of the earlier accepted pages, and of this page's Intake rules block, show the spacing before the fix; their next revisions will show it.

## 5. Superseded and retained references

The [ES-01 design board r01](../reference/ui/estimating/workload-design-board-r01/README.md) and its record stay as they are; they are the history of the implemented page. The [Reviews & approvals captures](../reference/ui/estimating/reviews-approvals-design-r01/README.md) stay unchanged: capture 05 there shows the collapsed state with the record window closed, so A1 does not alter it.

## 6. Not decided

- **Building the page.** `readEstimatingWorkload` already returns the opportunity, customer, site, readiness, workspace alternatives, saved estimates, both owners, the last change, the Sales action, any handover due and the readiness counts. The All workload and My estimating work counts and the readiness counts within the My estimating work view need a check against the read; Open in sequence and Export list are not built. Reading still needs `estimating.read`, and starting discovery still needs `estimating.edit`. No new capability is proposed.
- **Rolling out the shell.** As for Reviews & approvals, the adopted Shell page and the app stay as built until a shell implementation is planned and recorded. A1 belongs to that rollout.
- **Open questions:**
  - Should Saved estimates stay a view of this page or get its own rail item?
  - Should a saved-estimate row open a record window instead of the saved estimate page?
  - Add a "Not allocated" view once estimator allocation exists?
  - How should several rows be selected on the phone? The recommendation is the same as for Reviews & approvals: press and hold a row.
- **Not drawn yet:** loading, no matches, no permitted workload, failed read (rows and counts cleared, with Try loading again) and no access (ES-01 X1–X5); the no-edit-permission notice and Start discovery (V2); a Won record with a Sales handover due (V3); stale data after a background refresh; the phone view picker and filter sheets; the 1024 px and 320 px widths. Every row opens the same sample record.

## 7. Verification

- Claude checked each frame and page component with screenshots taken inside the Figma write tool, using temporary copies wherever a hidden window had to be shown. The checks led to a navy selected-rail icon, a white plus on New estimate, the column rebalancing that keeps Changed and its sort marker in view, and the Menu heading finding F1.
- After Dean installed the Figma desktop app, Claude played both flows in Present mode with his permission. Row clicks, close, the checkbox selection, the menu-edge hover and collapse, More, the rail collapse, the record window with the menus collapsed (A1), the Saved estimates links in both directions and the phone record view all worked. Two links had been lost when the frames were copied from the Reviews & approvals page: the "2 selected ×" chip and the small panel's Cancel. Both were restored, re-pointed to this page and retested. A duplicate desktop flow, created when the register frame was copied for Saved estimates, was removed. No prototype link leaves the page.
- Claude confirmed in Figma desktop that the named version "Intake & workload — Pipedrive pattern, accepted" was saved after all these changes, by opening the entry's version information and cancelling. The page was then renamed "Intake & workload (accepted)", which alters no pixel.
- The seven captures are copies of the accepted frames with every Font Awesome icon swapped for `Icon/placeholder` (167, 167, 180, 101, 167, 42 and 42 icons), and the prototype switches frozen for the state shown. A check after the swap found no Font Awesome instance left in any copy. They were exported at scale 1 with the Figma connector, and each downloaded image was inspected. The hashes are in the [captures README](../reference/ui/estimating/intake-workload-design-r01/README.md).
- `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py`, `node scripts/design-baseline-check.mjs` and `npm run studio:check` were run on this change and reported no errors.
- After the Menu heading fix (F1), Claude checked the More slide-out, this page's menus and the Reviews & approvals menu with screenshots, and confirmed that every side menu on the Quotations, Cost sources and Sales briefs pages still ends well inside its 836 px frame.
- Nothing is built, so there is no application or device evidence. This record implies no visual review of the application and no UI baseline.

## 8. Consequences

- No application code, read model, route, migration, permission or capability changes. No page, scope or parent requirement ID changes; all 78 parent IDs remain.
- The [Estimating intake and workload register entry](../design/development/pages/route-estimating.md) and the [ES-01 scope entry](../design/development/pages/scope-es-01.md) now link this design and its captures. Their visual status stays "Needs review": the app does not yet match the design.
- When the page is built, it is compared with these captures and the Figma frames at the same viewports, following ADR-0053 rule 7.
- A later change to this design receives a new named version and a new capture revision folder; these bytes stay unchanged.
