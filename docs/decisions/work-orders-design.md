---
document_id: PPO-SVC-WORK-ORDERS-DESIGN-DEC
date: 2026-10-11
owner: Dean Fiedler
status: Owner-accepted design; list-read additions, native implementation, shell rollout and UI baseline acceptance separate
source_commit: 40ac5a01439d37a09fcba5a031afa4efab30711d
versioning: git
---

# Work orders design — owner decision

On 11 October 2026 Dean chose Work orders (`/service/work-orders`) as the next page to design in Figma. It is the first Service operations page drawn on the pattern he accepted the same day for [Reviews & approvals](estimate-reviews-design.md). Claude drew it with synthetic data and with the P04 rules of [ADR-0009](ADR-0009-p04-work-scope-readiness.md) as the code records them. Dean accepted it: "Proceed with your recommendations". The design reference is the named Figma version "Work orders — Pipedrive pattern, accepted".

This record retains his decisions, the design reference and its icon-free captures, the conformance declaration, the display rules, the departures and what remains open.

Scope: the existing Service destination `orders` (route `/service/work-orders`, register entry `route:/service/work-orders`, scope `SV-03`, requirement SVC-02). No parent requirement ID is added or renamed. This is a design decision. It authorises no application code, read model, route change, migration, permission, capability or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design Work orders next | User decision, 11 October 2026 | Dean chose "Work orders (Recommended)" from three candidates (Work orders, Specialist configurations, the Projects register). Engineering workload and Leads were being drawn in other sessions. Today's page is the weakest remaining register: boxed record cards under the old register header. It is also the first Service page, so it tests the new rail on Service's long, grouped list |
| Reuse the accepted pattern | Prior user decisions | The [Reviews & approvals decision](estimate-reviews-design.md), section 1, and the record-width cap recorded with Intake & workload: a labelled rail, a flush secondary menu, a full-width grid with fixed checkbox and gear columns, record windows that overlap the grid, phone list rows and an icons-only phone tab bar |
| Accept the design and its recommendations | User decision, 11 October 2026 | "Proceed with your recommendations". Every recommendation on the notes card is adopted, and each open question takes its recommended answer (the rows below) |
| Grouped Service rail with 40 px items | Claude's recommendation, adopted | All 15 Service destinations, the three AU-08 groups (`railGroups.service` in `src/shell/navigation.ts`) and More fit at 900 px only with 40 px items; the v2 rail's 44 px items would need 952 px. A group heading is a caps label over a thin line; in the collapsed rail it becomes a short divider. 40 px applies only to long grouped rails; Estimating and Engineering keep the v2 rail's 44 px |
| Work orders as the fifth phone tab | Claude's recommendation, adopted | Between Service requests and Schedule. Today's Service phone bar has My Work, Service requests, Schedule and More |
| No authorisation in the register or windows | Claude's recommendation, adopted | ADR-0009 makes authorisation an explicit decision on one exact scope revision. "Open work order" takes the reviewer to the record page, where it is made today. The small panel offers Open in sequence and Export list only |
| Rail badge counts Ready to authorise | Claude's recommendation, adopted | A neutral count, never red, as for Reviews & approvals |
| "My work orders" means you are the Service owner | Claude's recommendation, adopted | Matches the Quotations decision ("quotations you own"). Authorisers and assessors are not added to the view |
| Phone multi-select by pressing and holding a row | Claude's recommendation, adopted as direction | Not drawn, as for Reviews & approvals |
| Building the page or the shell | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team, at the named version "Work orders — Pipedrive pattern, accepted". The file's link is not recorded in this public repository, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Accepted frames | Page "Work orders (accepted)": desktop `196:24111`, desktop with two rows selected `199:31896`, phone `196:24496`. Its notes card `196:24515` lists the scope, rules, menu views, parts, handovers, decisions, recommendations and what is still open |
| Page components | Work order grid row `196:24549` (Default `196:24550`, Hover `196:24561`, Selected `196:24572`) and header `196:24583`; Work order list row (phone) `196:24594`; Work order snapshot (phone) `196:24607`; Rail · Service (proposal) `198:3778` (Expanded `198:3779`, Collapsed `198:3796`) |
| Shared parts | The Shell v2 (proposal) parts listed in the [Reviews & approvals decision](estimate-reviews-design.md), section 2, unchanged. Ten new icon components on the Components page, copied from Dean's Kit: Light `headset`, `calendar-week`, `folder-open`, `file-check`, `triangle-exclamation`, `gears`, `file-contract`, `screwdriver-wrench` and `shield-check` for the Service rail and tabs, and Solid `file-pen` for the selected rail item |
| Prototype | Flows "Work orders — desktop (proposal)" and "Work orders — phone (proposal)". They use the existing Prototype switches |
| Retained captures | [Work orders design r01](../reference/ui/service/work-orders-design-r01/README.md): six icon-free PNGs at exact frame size, with hashes. These are the repository reference for this decision |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | The existing destination `orders` ("Work orders") in the Service operations rail (`src/shell/navigation.ts`), route `/service/work-orders`, register entry `route:/service/work-orders`, scope `scope:SV-03` ("Work-order register and scope workspace"), requirement SVC-02 |
| Page type (r20) | Register / worklist, with a record detail window and a multi-select action panel. On the phone: a list with a full-screen record view |
| Reused components | The Reviews & approvals shell and grid parts (v2 / Rail item, Menu item, Menu heading, Menu edge, Menu strip, More panel, Grid / Header cell, Grid / Cell, Checkbox, Checkbox cell, Row actions cell, Tab item, Tab bar (phone)). Also Shell / Top bar, Shell / Phone header, Quick add, Button, Tag, Brand / Logo, and Font Awesome Light icons named as in `src/components/font-awesome-icons.ts`. Page-specific: the Service rail, the work order grid row and header, the phone list row and the phone record view |
| Source authority | [ADR-0009](ADR-0009-p04-work-scope-readiness.md) (P04 work scope, coverage and readiness) and the P04 seed's Authorisation-stage criteria (`db/seed-p04.sql`). Labels come from `src/components/work-order-screens.tsx` and `src/service/work-scope-validation.ts`. Unassigned demand is [PL-01](pl01-unassigned-demand.md). Fixture: synthetic `SYN-PPO-WO`, `SYN-PPO-TKT` references, customers, sites, people and dates |
| Incoming handover | Triaged service requests (SV-01), and won deals handed to Service through Sales-to-Delivery handover. "New work order" starts a draft from a linked request, as today |
| Outgoing handover | "Open work order" opens `/service/work-orders/[id]`, where scope, readiness and authorisation are decided. "Open request" opens the linked request (`/service/tickets/[id]`). Authorised orders without a visit reach Schedule as unassigned demand; proposed and confirmed visits and job packs follow there (SV-04, SV-05). No authorisation, readiness assessment or booking happens in the register or its windows |
| States shown | The register with every authorisation status. The record window for a draft blocked at work authorisation, with its readiness, scope and history. A two-row selection with the small panel. The rail and secondary menu collapsed with the record window open. The phone list and the phone record view. The More slide-out works in the prototype. Loading, error, empty and stale states are not drawn |
| Departures | Section 4 |
| Verification | Section 7 |

## 4. Display rules and departures

### Authorisation

Each row shows one authorisation status, derived from what the code already records. It is a proposed display rule. It adds no state to the database: a work order is still only Draft or Authorised.

| Status | Shown when | Source wording today |
|---|---|---|
| Scope needed | A Draft with no saved scope revision | "No scope saved" |
| Blocked · n items | A Draft with a saved scope and n blockers at work authorisation | "Blocked at work authorisation · n item(s) need review" |
| Ready to authorise | A Draft with a saved scope and no blockers | "The saved scope is ready for an authorised reviewer's decision." |
| Successor rNN in draft | Authorised, with a current scope that differs from the authorised scope | "Successor draft awaiting authorisation" |
| Authorised rNN | Authorised, with the current scope authorised | "The current scope is authorised." |

Blockers are the record's existing list: every linked request must be Triaged, and the five Authorisation-stage criteria (Site access, Site and biosecurity controls, Required competencies reviewed, Mandatory isolation, Shutdown authority) must be cleared, with expired or stale evidence reading Unknown. Blocked uses the warning text colour; Scope needed and Authorised are muted; every status has words as well as colour.

### Next visit

| Shown | When |
|---|---|
| — | A Draft with no active visit |
| Not proposed | Authorised, with no active visit. PL-01 lists these orders as unassigned demand |
| Proposed or Confirmed, with the date | The earliest active visit's status and start date |
| Review required | An active visit was proposed on an earlier scope, or on a draft scope that is not yet authorised (`scope_review_required`) |

Corrected 12 October 2026 by the [work order record page decision](work-order-record-page-design.md), section 5: this table first said that no visit can be planned for a Draft. The code allows a visit to be proposed against the current scope at any time (`proposeVisit`), and such a visit reads Review required until it was proposed on the authorised, current scope. The accepted captures show no draft with a visit, so they are unchanged.

### Departures

The Reviews & approvals departures D1–D9 apply unchanged: the labelled rail, the collapsible secondary menu, the More slide-out, the full-width grid with fixed columns, overlapping record windows capped at the both-menus-open width, phone list rows, the phone header, the phone tab bar and the proposal colours. These are the Work orders departures from today's page:

| ID | Departure | Today's page |
|---|---|---|
| W1 | The Service rail shows its 15 destinations in the three AU-08 groups, with 40 px items and a caps heading over a thin line for each group. Collapsed to 76 px, each group becomes a short divider. Work orders is the white selected tile with a Solid file-pen icon and a neutral badge counting Ready to authorise | The adopted 232 px rail; the app already groups the Service items under the AU-08 labels |
| W2 | One grid row per work order. Columns: Work order (reference and current scope revision, sorted newest first), Scope summary, Customer, State (Draft or Authorised), Authorisation, Coverage, Next visit, Site, Requests (linked request count), Service owner and Updated. The checkbox and settings columns stay fixed while the grid scrolls sideways | Boxed record cards with the reference, the summary or "Scope needed", customer and site, State and coverage tags and the current scope revision |
| W3 | Secondary menu: All work orders, My work orders (you are the Service owner), Drafts and Authorised; a Needs attention group (Scope needed, Blocked at authorisation, Ready to authorise, Successor in draft); and a Planning group (No visit proposed, Visit needs review, Coverage unresolved). Coverage unresolved means Unknown or Disputed, which need Finance review. Neutral counts | A text search and a State filter |
| W4 | Toolbar: "New work order" as the primary button, Owner and Site filters, the count with its refresh time, Refresh and "…" | A register header with the description and "New work order" |
| W5 | Record window: the title, reference, State and authorisation status; a summary (customer, site, Service owner, coverage, linked requests); the current scope's tasks, exclusions and diagnostic limit; a rule note; Readiness and Visits tabs; History. Its buttons are Open request and Open work order | None; each work order opens its own page |
| W6 | The small panel for a selection offers Open in sequence and Export list only | None |
| W7 | Phone rows show the scope summary and last update; the reference and customer; and the authorisation status with the planning position (Draft, a visit date, No visit proposed or Visit review required). The record view puts the reference in its header and the title in the body, as Intake & workload does | The same record cards |
| W8 | The Service phone tab bar has five icon-only tabs: My Work, Service requests, Work orders, Schedule and More, each with a hidden accessible name. Work orders is the current tab | Four labelled tabs: My Work, Service requests, Schedule and More |
| W9 | Ten icons are copied from Dean's Kit into the private file for the Service rail and tabs (section 2) | Not applicable |

## 5. Not decided

- **Building the page.** W2 and W3 need list-read additions: the authorisation status and blocker count, the next visit, the linked request count, the Service owner and the last update. Today's list returns the reference, state, customer, site, summary, scope revision and coverage. Reading still needs `service.work_order.read` with the existing record scope checks. No new capability is proposed.
- **Rolling out the shell.** As for Reviews & approvals, the adopted Shell page and the app stay as built until a shell implementation is planned and recorded. W1 and W8 change the Service rail and phone bar for every Service page.
- **Still open:**
  - SV-03 also asks for multi-area and location scope. The grid shows one site per work order until that is designed.
  - How several rows are selected on the phone: pressing and holding a row is the adopted direction, but it is not drawn.
- **Not drawn yet:** loading, error, empty, filtered-empty, read-only and stale states; the Visits tab's content; an authorised work order in the record window; phone selection.

## 6. Consequences

- No application code, read model, route, migration, permission or capability changes. No page, scope or parent requirement ID changes; all 78 parent IDs remain.
- The [Work order register entry](../design/development/pages/route-service-work-orders.md) now links this design and its captures. Its visual status stays "Needs review": the app does not yet match the design.
- When the page is built, it is compared with these captures and the Figma frames at the same viewports, following ADR-0053 rule 7.
- A later change to this design receives a new named version and a new capture revision folder; these bytes stay unchanged.

## 7. Verification

- Claude checked every frame with screenshots taken inside Figma, and a scan of the page found no prototype link to another page. Claude cannot run Present mode through the connector, so the click-through was not exercised by Claude.
- The six captures are copies of the accepted frames with every Font Awesome icon swapped for `Icon/placeholder`. A check after the swap found no Font Awesome instance left in any copy. They were exported at scale 1 with the Figma connector, and each image was inspected. The hashes are in the [captures README](../reference/ui/service/work-orders-design-r01/README.md).
- `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py`, `node scripts/design-baseline-check.mjs` and `npm run studio:check` were run on this change.
- Nothing is built, so there is no application or device evidence. This record implies no visual review of the application and no UI baseline.
