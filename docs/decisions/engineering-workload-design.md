---
document_id: PPO-ENG-WORKLOAD-DESIGN-DEC
date: 2026-10-11
owner: Dean Fiedler
status: Owner-accepted design; server sort and count read, native implementation, shell rollout and UI baseline acceptance separate
source_commit: 453cc6bd4112b435b18278e5eb7154fc68d0ea17
versioning: git
---

# Engineering workload design — owner decision

On 11 October 2026, after a review of the five Estimating pages already in Figma, Claude offered three candidates for the next page. Dean chose "Engineering workload (Recommended)": Engineering's front page at `/engineering` (EN-01), the first page drawn outside Estimating. Claude drew it with synthetic data on the pattern Dean accepted for [Reviews & approvals](estimate-reviews-design.md), using only the EN-01 rules the code records. Dean then answered: "Proceed with your recommendations". He saved the result as the named Figma version "Engineering workload — Pipedrive pattern, accepted".

This record retains his decisions, the design reference and its icon-free captures, the conformance declaration, the departures, and what remains open.

Scope: the existing Engineering destination `engineering` ("Engineering workload", route `/engineering`, scope EN-01, parent trace ENG-01). No parent requirement ID is added or renamed. This is a design decision. It authorises no application code, read model, route change, migration, permission, capability or deployment. The retained [Engineering r02](engineering-r02-integration.md) HTML and audit stay unchanged as the earlier accepted design source.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design Engineering workload next | User decision, 11 October 2026 | Dean chose "Engineering workload (Recommended)" from three candidates: Engineering workload, Specialist configurations and Estimation wizard. Claude offered them after reviewing the pages in Figma: Reviews & approvals, Quotations, Cost sources and Sales briefs (accepted) and Intake & workload (then a proposal). The recommendation was to test the pattern in a second department, with that department's own rail, menu and icons, and to replace EN-01's package drawer |
| Reuse the accepted pattern | Prior user decisions | The [Reviews & approvals decision](estimate-reviews-design.md), section 1. It covers the labelled rail, the flush secondary menu, and a full-width grid "that extended all the way to the edges of the container, with individual cells". Record windows "overlap them instead" of condensing the table. The checkbox and gear columns are fixed, and the phone has list rows and an icons-only tab bar. Also the record window's maximum width, which Dean set while Intake & workload was being drawn: "make the maximum width of the record container working on a scenario when both the primary and secondary menus are open" |
| Accept the design with Claude's recommendations | User decision, 11 October 2026 | "Proceed with your recommendations." This adopts the recommendations on the notes card and the recommended answer to each question Claude had left open (section 4) |
| Menus and icons change by department | Prior user direction | The Engineering rail, menu, More panel and phone tabs follow `departmentRails.engineering` in `src/shell/navigation.ts` and the icon mapping in `src/components/font-awesome-icons.ts` |
| Building the page, the server sort and count read, or the shell | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team, at the named version "Engineering workload — Pipedrive pattern, accepted". The file's link is not recorded in this public repository, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Accepted frames | Page "Engineering workload · EN-01" `184:1047` (formerly "Engineering workload (accepted)"; renamed on 25 October 2026 by the [Figma file audit](../design/figma-file-audit/figma-file-audit-2026-10-24.md), R1): desktop `184:1048`, desktop with two rows selected `189:23728`, phone `184:1435`. The notes card `184:1455` lists the scope, rules, handovers, decisions, recommendations, the questions it settled, what stays open and what is not drawn |
| Page components | Rail · Engineering (proposal) `184:18299` (Expanded `184:18265`, Collapsed `184:18282`); Package grid row `184:1489` (Default `184:1490`, Hover `184:1501`, Selected `184:1512`) and header `184:1523`; Package list row (phone) `184:1534`; Package snapshot (phone) `184:1547` |
| Shared parts | The Shell v2 (proposal) parts listed in the [Reviews & approvals decision](estimate-reviews-design.md), section 2, unchanged, and the Toolbar search component from the Intake & workload page. Seven new icon components on the Components page, copied from the cached Kit shapes, all Light except one: `Icon/bars-progress` `180:35`, `Icon/solid/bars-progress` `180:41` (Solid, for the selected rail item), `Icon/sitemap` `180:47`, `Icon/pen-ruler` `180:53`, `Icon/layer-group` `180:59`, `Icon/code-pull-request` `180:65` and `Icon/gauge` `180:71` |
| Prototype | Flows "Engineering workload — desktop (proposal)" and "Engineering workload — phone (proposal)". They use the existing Prototype switches |
| Retained captures | [Engineering workload design r01](../reference/ui/engineering/engineering-workload-design-r01/README.md): five icon-free PNGs at exact frame size, with hashes. These are the repository reference for this decision |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | The existing destination `engineering` ("Engineering workload") in the Engineering rail (`src/shell/navigation.ts`), route `/engineering`, register entries `route:/engineering` and `scope:EN-01`, parent trace ENG-01 |
| Page type (r20) | Register / worklist, with a record detail window and a multi-select action panel. On the phone: a list with a full-screen record view. It replaces EN-01's tabbed register and its right-hand package drawer. The package page `/engineering/[id]` and the EN-02 to EN-08 pages are not redesigned here |
| Reused components | The Reviews & approvals shell and grid parts: Rail item, Menu item, Menu heading, Menu edge, Menu strip, More panel, Grid / Header cell, Grid / Cell, Checkbox, Checkbox cell, Row actions cell, Tab item and Tab bar (phone). Also Shell / Top bar, Shell / Phone header, Quick add, Button, Tag, Brand / Logo, Toolbar search and Font Awesome Light icons named as in `src/components/font-awesome-icons.ts`. Page-specific: the Engineering rail, the package grid row and header, the phone list row and the phone record view |
| Source authority | EN-01 as implemented: `src/components/engineering-workspace.tsx` (views, columns, filters, drawer, labels), `src/engineering/model.ts` (disciplines and the three statuses), `src/engineering/service.ts` (the list read, its filters and the Needs attention rule) and `src/engineering/control/workload.ts` (Author actions, Released and the technical counts). Also `src/engineering/control/components/summary.tsx` (the effort rule and the linked lists), [ADR-0047](ADR-0047-engineering-native-control.md), migration 0047's record states and the `route:/engineering` register entry. Fixture: synthetic `SYN-PPO-ENG`, `SYN-PPO-PRJ` and `SYN-DEL` references, customers from the r02 design, people and dates |
| Incoming handover | Existing packages with their permitted Project or Opportunity, customer and site; the native EN-02 to EN-05 records (bases, documents, queries, submittals, reviews, issues and deliverables) behind the counts and the record window |
| Outgoing handover | In the record window: "Open package" opens `/engineering/[id]`. Deliverables open `/engineering/[id]/drawings/deliverables`, queries `/engineering/[id]/queries`, and reviews and issues `/engineering/[id]/reviews`. The linked records open `/engineering/[id]/basis`, `/engineering/[id]/materials`, `/engineering/[id]/changes` and `/engineering/commissioning?package=`. The Project or Opportunity opens `/projects/[id]` or `/sales/opportunities/[id]`. The commands stay as today: New request, Update coordination (with a reason) and Add note. Ordinary navigation and filtering write nothing |
| States shown | The register with all three statuses, an overdue required date, an overdue action, missing dates and packages without deliverables. The record window for a package Awaiting information, with a blocked deliverable and its history. A two-row selection with the small panel. The phone list and the phone record view. The More slide-out and the collapsed rail and menu work in the prototype. Loading, error, empty, stale and read-only states are not drawn |
| Departures | Section 4 |
| Verification | Section 7 |

## 4. Rules shown, settled questions and departures

### Rules shown

- Only three coordination statuses exist: Queued, In design and Awaiting information. A package is Awaiting information if, and only if, a missing design input (a blocker) is recorded.
- **My work:** you own the package (its assigned engineer).
- **Author actions:** you own a basis in Draft or Returned, a query that is Open or Returned, a Returned submittal or an open review finding.
- **Reviews assigned to me:** submitted technical reviews assigned to you.
- **Released:** the package has a current, exactly issued formal issue whose sources have not changed. A coordination status can never make a package Released.
- **Needs attention** means any of these:
  - a recorded blocker;
  - a deliverable without prerequisite evidence;
  - a passed required date;
  - a passed action date (Brisbane date).
- Each package links to exactly one Project or Opportunity; the customer and site come from it.
- Effort:
  - Planned and authorised effort belong to accountable deliverables and need evidence.
  - Actual effort and staff availability are unknown, and no utilisation is calculated, so effort reads "To be assessed".
- Coordination is updated one package at a time, with a reason, against the package's record version.
- A review note never approves or releases a design.
- Technical decisions and formal issues are kept apart from the coordination history.
- A restricted source hides the whole technical record, including its counts.
- Creating a request authorises no design effort and issues no documents.

### Settled by "Proceed with your recommendations"

| Question | Answer adopted |
|---|---|
| Sorting | The read sorts on the server, so the sort marker covers the whole list (Required by, Reference or Work package). Today's sort reorders only the up to 50 rows on screen, and the server returns rows in internal id order |
| Menu counts | Shown for every view, from a new count read over the same permitted, searched set. Today's tabs have no counts |
| Needs attention | The server rule above. Today's footer count ignores missing prerequisite evidence and can disagree with the filter; the count follows the server rule |
| In design colour | The neutral tag. Only Awaiting information keeps a colour (amber, as today). The shared Tag has no teal, and colour is kept for what needs attention |
| Engineer filter | Lists every eligible engineer; "Assigned to me" becomes the My work view. The list read already accepts an owner |
| Rail badge on this page | The count beside Engineering workload is your Author actions, neutral, like the Reviews & approvals badge. Section 5 keeps the shell-wide rule open |
| Phone tabs | My Work, Engineering workload and Drawings (today's three), Technical reviews as the fifth, then More |
| Update coordination | Stays in the record window, as in today's drawer, because it is the page's own command. It needs `engineering.edit` and is hidden for read-only users. Add note is in the "…" menu |

### Departures

The Reviews & approvals departures D1–D9 apply unchanged: the labelled rail, the collapsible secondary menu, the More slide-out, the full-width grid with fixed columns, overlapping record windows, phone list rows, the phone header, the phone tab bar and the proposal colours. These are the Engineering workload departures from today's page:

| ID | Departure | Today's page |
|---|---|---|
| E1 | Engineering's own rail, in `navigation.ts` order: My Work, Engineering workload, Design basis & interfaces, Drawings, Technical queries, Materials & substitutions, Change review, Technical reviews, Commissioning & as-built, then More, with the app's icons. "Engineering" is under the logo. The selected item is the white tile with the Solid bars-progress icon. It is drawn as a page component built from v2 / Rail with the same Rail item parts | The adopted rail |
| E2 | The page header is the breadcrumb "Engineering / Engineering workload". Its four links (Technical queries & submittals, Released materials & substitutions, Engineering change-impact review, Commissioning basis & as-built release) are dropped because the rail holds them. The record window keeps them as Linked records for the open package | Heading "Engineering", a subtitle, four header links and "＋ Request" |
| E3 | Secondary menu: All packages, My work, Author actions, Reviews assigned to me and Released; a Status group (Queued, In design, Awaiting information); an Attention group (Needs attention). Neutral counts on every view | A row of five view tabs without counts, and an amber "Needs attention" toggle |
| E4 | Toolbar: New request (the same quick action and the same "What needs engineering?" dialog), search ("Search packages, customers or projects"), Engineer and Discipline filters, the count, Refresh and "…" | Search, Engineer ("All engineers" or "Assigned to me"), Discipline and a sort select, which sorts the current page only |
| E5 | A full-width grid with single-line columns: Reference, Work package, Customer, Status and Required by are visible at 1440 px with both menus open. Engineer, Next action, Action due, Deliverables, Discipline and Project or opportunity scroll in from the right. Required by carries the sort marker (earliest first, "Date needed" last). Overdue dates are amber with an icon; missing dates read "Date needed" and "Action date needed", as today | Seven two-line columns with drag-resizable widths, "Reset columns", and a footer with the attention count and Previous and Next |
| E6 | Status tags: Queued and In design neutral, Awaiting information amber | In design teal, Awaiting information amber, Queued grey-blue |
| E7 | The record window overlaps the grid from the secondary menu's edge, capped at 960 px and right-aligned. Left: status, discipline and Project work or Presales support; the summary (customer, Project or Opportunity, engineer, technical reviewer link, required date, effort "To be assessed"); the next action and missing design input; the design brief; the linked records; the effort rule. Right: Deliverables, Queries and Reviews & issues tabs, then the coordination History with its separation note. Footer: "…", Open package and Update coordination | A right-hand drawer up to 750 px wide with Overview, Deliverables, Technical queries and Review & history tabs, and the Update coordination form inline |
| E8 | The small panel for a selection offers Open in sequence and Export list only. Its rule note says coordination is updated one package at a time | No selection |
| E9 | Phone: flush list rows (title and required date; reference and status; customer and engineer). The five-tab bar is in section 4 | Cards at 820 px and below; the labelled three-and-More bar |

## 5. Not decided

- **Building the page.** The read needs several additions:
  - a server-side sort;
  - a count per view;
  - a list of eligible engineers for the filter;
  - single-line columns for the grid.
- **What the grid keeps from today.** Column resizing, column choice under the gear, and paging beyond the first 50 rows (today Previous and Next) are not drawn. They belong to the shared register table (PR #400) rather than to this page. Reading keeps `engineering.read` and the context checks. No new capability is proposed.
- **Rolling out the shell.** As for Reviews & approvals, the adopted Shell page and the app stay as built until a shell implementation is planned and recorded.
- **Department rails.** In the build, each department's rail comes from `navigation.ts`. The Figma file draws this page's rail as a page component; whether every department rail becomes a variant of v2 / Rail is a library choice for the shell rollout.
- **Open questions:**
  - What does a rail count mean across the whole shell? Here it is your Author actions. The recommendation is to decide this once for the shell rather than page by page.
  - How should several rows be selected on the phone? The recommendation is the same as for Reviews & approvals: press and hold a row.
- **Not drawn yet:** loading and failed-read states. Empty states: "No engineering packages yet", "No packages match these filters", and the Reviews and Released empty states. Also:
  - the stale state ("The package changed…");
  - read-only access;
  - the New request dialog and the Update coordination form;
  - the Add note field;
  - phone selection;
  - the 1024 px and 320 px widths.
  Every row opens the same sample record (`SYN-PPO-ENG-000714`).

## 6. Consequences

- No application code, read model, route, migration, permission or capability changes. No page, scope or parent requirement ID changes; all 78 parent IDs remain.
- The [Engineering workspace register entry](../design/development/pages/route-engineering.md) now links this design and its captures. Its visual status stays "Needs review", because the app does not yet match the design.
- The Engineering r02 HTML and audit stay unchanged as the issued source of the earlier accepted design.
- When the page is built, compare it with these captures and the Figma frames at the same viewports, following ADR-0053 rule 7.
- A later change to this design receives a new named version and a new capture revision folder; these bytes stay unchanged.

## 7. Verification

- Claude checked every frame with screenshots inside Figma before showing it to Dean, and fixed what they showed:
  - a cut-off search placeholder;
  - a deliverable sub-line drawn black instead of grey;
  - icons that read as a person;
  - clipped selection cards.
- Claude could not run Present mode through the API.
- Cloning the Reviews frames had carried prototype links to the Reviews page. A scan found the remaining two, on the header checkbox, and removed them. A final scan found no instance of a Reviews page component on this page.
- The five captures are copies of the accepted frames, with every Font Awesome icon swapped for `Icon/placeholder`. A check after the swap found no Font Awesome instance left in any copy. They were exported at scale 1 with the Figma connector, and each image was inspected. The hashes are in the [captures README](../reference/ui/engineering/engineering-workload-design-r01/README.md).
- `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py`, `node scripts/design-baseline-check.mjs` and `npm run studio:check` were run on this change.
- Nothing is built, so there is no application or device evidence. This record implies no visual review of the application and no UI baseline.

## Backend continuation — 13 October 2026

Dean separately authorised the EN-01 [register backend](engineering-workload-backend.md) under BC-01. It adds scoped sorting, complete permitted-match view/status counts and recorded-engineer filter choices. These choices identify actual owners of matching packages, including explicitly inactive owners; new assignment still uses the existing context-specific eligibility read. Source-bound page tokens refuse changed sources. This continuation does not implement or visually accept the Figma page or shell. All original captures and design review evidence remain unchanged.
