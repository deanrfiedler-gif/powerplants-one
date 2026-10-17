---
document_id: PPO-PRJ-PROJECTS-REGISTER-DESIGN-DEC
date: 2026-10-17
owner: Dean Fiedler
status: Owner-accepted design (11 October 2026, confirmed 17 October 2026); named version pending; comparison with the built page, phone selection and shell rollout separate
source_commit: 271a386b98c0aa612a86a34c03b0ab1da6073b8e
versioning: git
---

# Projects register design — owner decision

On 11 October 2026 Dean chose the Projects register (`/projects`) as the next page to draw in Figma: "Projects register (Recommended)", over Service requests and Deals. Claude drew it on the pattern Dean had accepted that day for [Leads](leads-design.md) and [Reviews & approvals](estimate-reviews-design.md), with synthetic data and the rules the Projects code records. Dean accepted it the same day: "Proceed with your recommendations". The page was then built in the application on 13 October ([implementation decision](projects-register-native.md)), but it was never locked in: no decision record, no retained captures and no named version.

On 17 October 2026 Claude asked Dean two questions before locking it in. Asked whether the named version existed, he answered "Not saved yet". Asked whether he still accepted the page as drawn, he answered "Yes, accept as drawn (Recommended)".

This record retains his decisions, the design reference and its icon-free captures, the conformance declaration, the display rules, the departures and what remains open. It is the design record that [projects-register-native.md](projects-register-native.md) lacked; that record still governs the implementation and is not changed.

Scope: the existing Projects destination `projects` (route `/projects`, register entry `route:/projects` "Project register", related scope `scope:PJ-02`, screen PJ01 in PPO-012 / BP-06, requirements PRJ-01, PRJ-02, PRJ-07 and PRJ-08). No parent requirement ID is added or renamed. This is a design decision. It authorises no application code, read model, route change, migration, permission, capability or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design the Projects register next | User decision, 11 October 2026 | Dean chose "Projects register (Recommended)" over Service requests and Deals. It is the department's landing page, its design entry was a generic draft, and it fits the accepted grid unchanged |
| Reuse the accepted pattern | Prior user decisions | The [Leads decision](leads-design.md) and the [Reviews & approvals decision](estimate-reviews-design.md): a labelled rail with the white selected tile and navy Solid icon, a flush secondary menu, a full-width grid with fixed checkbox and settings columns and lines between body cells, record windows that overlap the grid and never squeeze it, capped at their both-menus-open width, flush phone list rows, no breadcrumb on the phone and an icons-only five-tab phone bar |
| Accept the design and its recommendations | User decision, 11 October 2026 | "Proceed with your recommendations". Every recommendation on the notes card is adopted, and each of the six open questions takes its recommended answer (the rows below) |
| Still accepted as drawn | User decision, 17 October 2026 | "Yes, accept as drawn (Recommended)", given after Claude pointed out the two observations in section 4 (the desktop header and the derived-column read) |
| Overdue milestone rule | Claude's recommendation, adopted | A milestone not marked Complete whose date is before today in the site's timezone. The Projects code had no overdue rule when it was drawn |
| "My projects" means projects you coordinate | Claude's recommendation, adopted | The coordinator is the project's single named owner |
| Default view is Active projects | Claude's recommendation, adopted | |
| Rail badge counts active projects | Claude's recommendation, adopted | As Leads counts its Inbox. What a rail count means across the shell is still open |
| Acceptance & closeout is the fifth phone tab | Claude's recommendation, adopted | As Reviews & approvals was for Estimating |
| Phone multi-select by pressing and holding a row, with actions in a bottom bar | Claude's recommendation, adopted as direction | Not drawn |
| Named version | Pending | Dean: "Not saved yet" (17 October 2026). Section 7 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team, at the named version "Projects register — Pipedrive pattern, accepted" once Dean saves it (section 7). The file's link is not recorded in this public repository, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Accepted frames | Page "Projects (accepted)" `209:46`: desktop `209:47` (record window `209:110`, holding the record `209:118`), desktop with two rows selected `209:238` (toolbar `209:260`, small panel `209:301`), phone `209:457` (record view `209:477`). Its notes card `209:478` lists the scope, rules, handovers, changes, decisions, recommendations, what is still open and what is not drawn |
| Page components | Rail · Projects (proposal), Project grid row, Project grid header, Project list row (phone) and Project snapshot (phone), drawn on the page as proposal parts. Three icons on the Components page: Solid `diagram-project` for the selected rail item, Light `chart-gantt` and `flag-checkered` |
| Shared parts | Shell / Top bar, Shell / Phone header, Shell / Quick add (phone), Button, Tag, Brand / Logo; from "Shell v2 (proposal)": Rail item, Menu item, Menu heading, Menu edge, Menu strip, More panel, Grid / Header cell, Cell, Checkbox, Checkbox cell, Row actions cell, Tab item and Tab bar (phone) |
| Prototype | Flows "Projects — desktop (proposal)" and "Projects — phone (proposal)". They use the existing Prototype switches `sidemenu/open`, `sidemenu/collapsed`, `snapshot/open`, `bulkpanel/open`, `more/open`, `more/open-narrow` and `phonesnapshot/open` |
| Retained captures | [Projects register design r01](../reference/ui/projects/projects-register-design-r01/README.md): five icon-free PNGs at exact frame size, with hashes. These are the repository reference for this decision |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | The existing destination `projects` ("Projects") in the Projects rail (`src/shell/navigation.ts`), route `/projects`, register entry `route:/projects` ("Project register"), related scope `scope:PJ-02`, screen PJ01 of PPO-012 / BP-06, requirements PRJ-01, PRJ-02, PRJ-07 and PRJ-08. Reading needs `project.read`; + Project appears only with the `project` create action |
| Page type (r20) | Register / worklist, with a record window and a multi-select action panel. On the phone: a list with a full-screen record view |
| Reused components | The shared parts in section 2. Page-specific: the Projects rail, the project grid row and header, the phone list row and the phone record view |
| Source authority | `src/projects/model.ts` and `src/components/projects-screens.tsx` as they stood on 11 October: the permanent `SYN-PPO-PRJ` reference, title, customer, site (its timezone sets the schedule's dates), coordinator and optional target date; Active or Closed lifecycle; the four phases and the task statuses Planned, In progress, At risk and Complete; milestones that are never In progress; dependencies that warn and never move dates; reasons kept for every schedule change; sales source from a won deal (migration 0076). Fixture: synthetic `SYN-PPO-PRJ` and `SYN-PPO-OPP` references, customers, sites, people and dates |
| Incoming handover | Projects created with + Project, or from a won deal through Won-deal receiving in Sales |
| Outgoing handover | Open schedule opens the project's Gantt (`/projects/[id]`); Programme (`/projects/programme`) lists the same projects; Acceptance & closeout (`/projects/acceptance`) handles staged acceptance, closing and reopening. No task, milestone, date or lifecycle change happens in the register or its windows |
| States shown | The Active projects register with overdue, unscheduled and not-set values. The record window for an active project you coordinate whose next milestone is overdue. A two-row selection with the small panel. The phone list and the phone record view. The More slide-out and the collapsed rail and menu work in the prototype |
| Departures | Section 4 |
| Verification | Section 8 |

## 4. Display rules and departures

### Derived values

| Column | Rule |
|---|---|
| Next milestone, Milestone date | The earliest milestone not marked Complete, undated ones last. A milestone without dates reads "Unscheduled", as the app formats it |
| Overdue | The rule in section 1. Shown as "Overdue · date" in red, with the word always present |
| At risk | The number of tasks explicitly marked At risk. There is no project health field, so none is drawn and the record window shows facts only |
| Target date | "Not set" in grey when empty. Default sort: target date, earliest first, "Not set" last. PJ01 sorted by forecast finish, which is not recorded; target date is the nearest recorded date |

### Departures from the page as it stood on 11 October

The Leads and Reviews & approvals departures apply unchanged: the labelled rail, the collapsible secondary menu, the More slide-out, the full-width grid with fixed columns, overlapping capped record windows, phone list rows, the phone header, the phone tab bar and the proposal colours.

| ID | Departure | Page on 11 October |
|---|---|---|
| P1 | The card list becomes the full-width grid. Columns: Project, Next milestone, Milestone date, Target date, At risk, Customer, Site, Coordinator, Status and Reference, with the checkbox and settings columns fixed. The follow-up columns sit straight after the title, as Dean accepted for Leads; Reference moves to the end and into the record header | A card list with search and Previous/Next paging |
| P2 | Secondary menu: Active projects (default), My projects, Closed and All projects; under Needs attention, Overdue milestones, Tasks at risk and No target date. Neutral counts | Search only |
| P3 | Toolbar: Coordinator and Customer filters, the count with its refresh time, Refresh, + Project as the primary button, and "…" | A page header with + Project and a "Staged Acceptance & Closeout" link |
| P4 | Record window: title, reference, creation date, site time, lifecycle and next-milestone status; Project facts (customer, site, coordinator, target date, sales source); Schedule facts (tasks, next milestone, tasks complete by phase); a rule note; At risk and Milestones tabs; History. Its buttons are Acceptance & closeout and Open schedule | None; each project opens its Gantt |
| P5 | The small panel for a selection offers Open in sequence and Export list (CSV) only. PJ01 left bulk selection and export out of J1 | None |
| P6 | The Projects rail leaves out Delivery readiness, Risks & issues, Variations & obligations and Site assurance, which the app hides while they are unavailable. Acceptance & closeout becomes a rail item | The rail as built |
| P7 | Phone rows show the title; customer and target with an "n at risk" tag; and the next milestone with its date or Overdue. The phone tab bar has five icon-only tabs: My Work, Projects (current), Programme, Acceptance & closeout and More | Four labelled tabs: My Work, Projects, Programme and More |

### Observations raised before the confirmation

- **Desktop header.** The notes card says the breadcrumb reads "Projects / Project register"; the drawn desktop header reads "Projects". Dean accepted the page as drawn. The built page uses "Projects / Project register" ([implementation decision](projects-register-native.md)). The shell top bar amendment accepted on 16 October (breadcrumb rules R1–R8) will govern the header for every page when it is locked in and built; this record does not settle it.
- **Derived columns need a new read.** The notes card says the views, counts, filters, sort and derived columns (next milestone, overdue, at risk) "need a new register read". That read was built on 13 October as `/api/v1/projects/register` (`src/projects/register.ts`, `src/projects/register-model.ts`), with its own execution evidence. This design record does not review that read, and the drawing is unchanged; section 5 keeps the point open.

## 5. Not decided

- **The derived-column read against this design.** Whether the built read and the page that uses it match this accepted design is not reviewed. The comparison follows ADR-0053 rule 7: the built `/projects` page against these captures and the Figma frames, at the same viewports and data.
- **Phone multi-select.** Press and hold is adopted but not drawn.
- **Rail counts.** What a rail count means across the whole shell is still open; this page counts active projects.
- **The record page.** `/projects/[id]` keeps its own [accepted record page design](project-record-page-design.md) and is not redrawn here.
- **Rolling out the shell.** The rail, side menu and More are decided separately for every page.
- **Not drawn yet:** loading, error and stale states; the empty states ("No projects yet" with + Project, "No matching projects" with Clear filters); no permission; a closed project's record window; the Closed and All projects views; the Milestones tab; and the + Project form.

## 6. Consequences

- No application code, read model, route, migration, permission or capability changes. No page, scope or parent requirement ID changes; all 78 parent IDs remain.
- The [Project register entry](../design/development/pages/route-projects.md) and its register row now link this design and its captures. Its visual status stays "Needs review": the comparison with the built page has not been made.
- [projects-register-native.md](projects-register-native.md) remains the implementation record. Its statements that public icon-free captures and the named version were not available are true of 13 October and are not rewritten.
- A later change to this design receives a new named version and a new capture revision folder; these bytes stay unchanged.

## 7. Named version and File index

Dean said on 17 October 2026 that the named version "Projects register — Pipedrive pattern, accepted" was "Not saved yet". It is saved in the file's version history after the capture commit, by Dean or, on his explicit yes, by Claude in the Figma desktop app. Until he confirms it, this record cites the version as pending and the pull request stays a draft. The File index row for `209:46` on the Start here page (row `630:286`) now names this record with the named version pending, under ADR-0055 rule 6, and is updated again when the version is saved.

## 8. Verification

- Claude read the page with read-only Figma scripts and checked every frame with screenshots taken inside Figma. It did not use the connector's metered read tools. Claude cannot run Present mode through the connector, so the click-through was not exercised by Claude.
- The five captures are copies of the accepted frames, made on the Captures (icon-free) page, with every Font Awesome icon swapped for `Icon/placeholder` and the copies' prototype links cleared. A check after the swap found no Font Awesome instance left in any copy. They were exported at scale 1 with the Figma connector, and each image was inspected. The hashes are in the [captures README](../reference/ui/projects/projects-register-design-r01/README.md). The accepted page `209:46` was not edited.
- `python3 scripts/check_naming.py` and `npm run studio:check` were run on this change.
- This record implies no visual review of the application and no UI baseline.
