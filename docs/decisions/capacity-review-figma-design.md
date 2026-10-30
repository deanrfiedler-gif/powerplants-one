---
document_id: PPO-PL03-CAPACITY-REVIEW-FIGMA-DEC
date: 2026-10-30
owner: Dean Fiedler
status: Owner-accepted design; native implementation and UI baseline acceptance separate
source_commit: fa15714324b1dcb939355666023272e0a4ffb0f3
versioning: git
---

# Capacity review design — owner decision

On 23 October 2026 Dean asked for this page: "Your task is to design and build the "Cross-domain resource demand and capacity (PL-03)" UI page in Figma as a proposal for my review. Draw the page; do not stop at a written brief." Claude drew it in Figma: `scope:PL-03` at `/schedule/capacity`, the Scheduling side menu item "Capacity review".

Claude drew the page from these sources:
- the PL-03 design register pages ([scope-pl-03](../design/development/pages/scope-pl-03.md), [route-schedule-capacity](../design/development/pages/route-schedule-capacity.md));
- [PPO-SCHED-ADR](scheduling-resources-architecture.md);
- the built `CapacityWorkspaceScreen` and the `CapacityWorkspace` read model;
- the accepted [Service planner](service-planner-figma-design.md), [Field team](field-team-figma-design.md), [Changes and follow-up](changes-follow-up-figma-design.md), [Travel review](travel-review-figma-design.md), [Workshop builds](workshop-builds-figma-design.md) and [Engineering workload](engineering-workload-design.md) designs;
- the technician working hours: 08:00–17:00 standard, 07:00–18:00 with a warning.

Asked "Do you accept the PL-03 design with the recommended answers?", Dean answered on 30 October 2026: "Accept as recommended".

Scope:
- `scope:PL-03` "Cross-domain resource demand and capacity", with `route:/schedule/capacity`.
- Parent requirement IDs are not traced to PL-03 individually. [PPO-SCHED-ADR](scheduling-resources-architecture.md) traces the scheduling programme. No parent requirement ID is added or renamed.

This is a design decision, with the one rule amendment in section 5. It authorises no application code, route, read model, migration, permission, capability or deployment. The app still shows the built page.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design PL-03 | User decision, 23 October 2026 | Dean's request quoted above |
| Departures D1–D11 | Accepted as recommended, 30 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Weekly or daily as the default | Resolved as recommended | Weekly, two weeks, all permitted teams. A week cell names the day that is over. By day for one team is one click away and opens on today; the planner stays the day tool |
| Q2 Workshop and Engineering by default for service planners | Resolved as recommended | The chips default to the viewer's own domain plus Projects tasks mapped to their people, with Workshop and Engineering one tap away and the choice kept in the page address. A domain the viewer cannot read always shows as an "Unavailable" chip, never hidden and never zero. Capture 01 shows a viewer with all four chips on |
| Q3 Hours or percent | Resolved as recommended | Hours and words, no percent |
| Q4 Who may see other teams' capacity | Resolved as recommended | Each domain's own read scope decides what is shown. Coordinators and managers with read on a team's domain see that team. A technician sees only their own row. Leave and blocks show as "Leave" or "Availability block", never a reason |
| Q5 Known hours for projects and workshop | Resolved as recommended; amends PPO-SCHED-ADR | Owner-supplied planned effort on project tasks and planned step hours on builds count as known hours with their source. Everything else stays "Effort unknown". Section 5 |
| Q6 The over-capacity rule | Resolved as recommended; amends PPO-SCHED-ADR | Over means known demand greater than available standard hours on that day. A week cell names the day. Extended hours are stated and never counted as available. Section 5 |
| Accept the design | User decision, 30 October 2026 | Quoted above |
| Named Figma version | Waiting | "Capacity review — accepted" waits for Dean to save it, or to say yes to Claude saving it |
| Building the page | Not decided | Section 6 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Capacity review · PL-03" `2244:50314`, under "— Service operations —", after Travel review · PL-05 `1371:3488`. The page header `2244:50315` holds the conformance declaration; the notes card `2252:767464` is in Flows and notes. File index row "Row / Capacity review · PL-03" `2771:534647` |
| Desktop 1440 | Grid by week, full length `2245:733808`; grid by day `2245:745113`; cell detail popover `2245:746257`; Demand list, full length `2245:760883`; Skill view `2245:762282`; grid with exclusions `2245:780274` |
| Tablet 1024 | Grid by week, rail and side menu collapsed, full length `2245:781167` |
| Phone 390 and 320 | Team week cards `2245:794518` and `2245:795288`; Demand list `2245:794959` and `2245:795729` |
| States | Loading `2248:761892`; Engineering unavailable `2248:762819`; results bounded `2248:763719`; refresh error `2248:764617`; unknown effort `2248:765514`; unmapped resource `2248:766395`; no demand in range `2248:767277` |
| Prototype | Flows "PL-03 — desktop" and "PL-03 — phone", with 20 frame-to-frame links on this page. Hand-offs to other pages are not linked |
| Page parts | None as components. The week cell with its hours bar, day cell, popover, analysis banner, state banners, phone person card and phone select field are drawn as layouts inside the frames |
| Story | Synthetic, as at Tue 13 Oct 2026, 09:00 AEST, weeks of 12 and 19 October. Casey Ward is over by 1.0 h on Tue 13: 8.0 h of visits and travel, as on the planner, Field team and Travel review, plus a 1.5 h project task, against 8.5 h after the toolbox talk. Drew Collins, Jesse Moore and Kim Taylor are loaded by the Block C build SYN-PPO-BLD-000042 (55.0 h of 108.5 h planned that week). Two authorised work orders are undated. Engineers Casey Quinn, Riley Chen, Alex Morgan and Sam Jordan have effort "to be assessed". New references: SYN-WO-000061, SYN-APT-000063 |
| Retained captures | [Capacity review design r01](../reference/ui/service/capacity-review-design-r01/README.md): eighteen icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:PL-03` "Cross-domain resource demand and capacity", `route:/schedule/capacity`. Parent requirements as traced by PPO-SCHED-ADR, unchanged. Capabilities unchanged: the Scheduling entry plus each domain's own read scope |
| Page type (r20) | Review / comparison, drawn as a capacity grid by week or by day, with Demand list and Skill view tabs and a cell detail popover. No source-mutation save action; analysis is in memory only |
| Reused components | Shell v2 (Rail · Service with Schedule selected, top bar with the Conversations action, the Scheduling side menu as on Travel review), Shell / Phone header · compact, v2 / Tab bar (phone), Shell / Quick add (phone), Button, Tag, Record / Filter chip, Record / View tab, Grid / Header cell, Grid / Checkbox, Grid / Checkbox cell, Grid / Row actions cell, My Work / Group row, Font Awesome Light icons |
| Incoming handovers | Weeks or day, team, time zone and the filters (domain, commitment, resource, required skill, unknown effort) from the page address; permitted repeatable reads of Service appointments and authorised work orders, Workshop builds, Project tasks and Engineering deliverables, each with its own scope; Field team calendars, availability blocks and competence (PL-02) |
| Outgoing handovers | "Open in planner" (PL-01) at the person and day; "Review in Changes & follow-up" (PL-04) for a booked visit; every demand item opens its source page. Nothing is booked, moved, assigned or saved here |
| Source authority | The PL-03 design register pages; PPO-SCHED-ADR with its 30 October 2026 amendment; the built `CapacityWorkspaceScreen`; the accepted designs listed above |
| Proposed departures | D1–D11 in section 4, accepted |
| Status | Owner-accepted design, 30 October 2026 |
| Decision record | This file |
| Named version | "Capacity review — accepted", waiting |

## 4. Departures, accepted

| ID | Departure | Built page |
|---|---|---|
| D1 | Capacity grid: people grouped by team, by week or by day; each cell shows hours of demand against available hours, a bar by domain and the result in words | Source cards, supply-basis cards and record cards; no grid |
| D2 | Hours from known sources only, never percent. Available = published standard hours 08:00–17:00 less leave, training and toolbox talks. Demand = Service reservations (crew and travel), supplied project effort and workshop planned step hours. "Over" only when known demand exceeds available hours | No denominator; net capacity Unknown |
| D3 | Workshop as a fourth domain, from Workshop builds planned step hours. It depends on the later stage in [Workshop builds](workshop-builds-figma-design.md) Q5 that records step hours | Service, Projects and Engineering only |
| D4 | Project tasks give hours only when the task owner supplies planned effort; programme dates never become effort. Engineering stays "effort to be assessed" (EN-01) | All effort Unknown |
| D5 | Domain chips with counts, an "Unavailable" chip with a lock for a domain the viewer cannot read, and a sources-complete tag with as-at times | A select and source cards |
| D6 | Commitment relabelled Confirmed / Tentative / Undated: booking or build in progress; proposed visit, source plan or planned build; authorised work or a build without dates. The Resource filter stays beside Required skill | Operational booking, Authorised demand, Proposed visit, Source plan |
| D7 | Demand list tab grouped by domain: domain and commitment, item with source reference, version and as-at, owner, dates or Undated, effort or Effort unknown, required skill, mapped resource or Unmapped. A row opens its source | One card per record |
| D8 | Skill view tab: demand by required skill against holders verified for the period (PL-02), with gaps named in words | None |
| D9 | Analysis: leave items out, or place undated demand on a person, in memory only, labelled "Analysis only, not saved" and reset by refresh or any filter change. The cell popover carries the hand-offs | Scenario counts and reserved minutes; no placement |
| D10 | Phone: the team's week as labelled person cards, with the person needing attention open at day rows, and the demand list as grouped rows; 16 px fields; compact header | Desktop cards stacked |
| D11 | Side menu label "Capacity review", as in `src/shell/navigation.ts`. Earlier Scheduling pages show "Demand & capacity" in their side menu; they align at their own next change | "Capacity review" |

Every frame keeps these rules:
- Unreadable demand shows as "Unavailable", never zero.
- A refresh error shows no hours and never free capacity.
- Bounded results disclose completeness and read "At least".
- Unknown effort and unmapped resources stay explicit and are never counted as free.
- Filters live in the page address; analysis is in memory only.
- Status always has words. Criteria confer no permission and change nothing.

## 5. Earlier records this amends

[PPO-SCHED-ADR](scheduling-resources-architecture.md) said that all current source effort is Unknown and that no utilisation denominator or percentage is defined. Q5 and Q6 amend the first statement and narrow the second, in that record's 30 October 2026 amendment. No percentage is adopted. Until a build supplies the new fields, the built page and read model correctly keep reporting effort as Unknown.

## 6. Not decided and not drawn

- **Building the page.** The built page is `CapacityWorkspaceScreen`. A build needs source fields that do not exist today: planned effort on project tasks, planned step hours on builds, and a Workshop domain in the capacity read. The build order is not decided.
- **Who holds which read.** Q4 sets the rule. No capability or grant changes here.
- **Not drawn:** a 90-day horizon by month; denied access to the whole page; tablet and phone states; Engineering readable on the phone; open menus (range, team, skill, resource, row "…"); hover and focus states; the phone filter screen; 200% zoom.
- **Data in the frames:** the people, hours, skills and records are synthetic. They are not operational records, and the planned hours are not adopted estimates.

## 7. Audit and correction

Before presenting the page, Claude checked by script that no frame overlaps another or sits outside its section, that all text is Roboto, that all 18 frames carry the Conversations action and that no "Demand & capacity" label remains on them.

After acceptance, inspecting the captures showed the week-view toolbar overflowed its 960 px column by about 16 px, and the longer date label in the bounded state pushed the refresh and "…" buttons off the frame. Claude shortened the date labels on the affected source frames and copies ("12 – 25 Oct 2026", "12 Oct – 10 Jan 2027", "26 Oct – 8 Nov 2026") and measured no remaining overflow in any toolbar or filter row. The dates themselves are unchanged. Dean accepted the frames before this correction.

## 8. Verification

- The captures were made as described in the [captures README](../reference/ui/service/capacity-review-design-r01/README.md).
- Claude did not play the prototype in Present mode.
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.
