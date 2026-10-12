---
document_id: PPO-MYWORK-PAGE-DESIGN-DEC
date: 2026-10-12
owner: Dean Fiedler
status: Owner-accepted design; weather provider ADR, native implementation, shell rollout and UI baseline acceptance separate
source_commit: 51df03296abf70bb6b8c935c5b39fb1bf791efce
versioning: git
---

# My Work page design — owner decision

On 12 October 2026 Dean asked: "Rebuild the "My work" UI page that is in Figma so it aligns with the rest of the UI pages that we have built." The page he linked was the trial screen drawn on 11 October 2026, when the Figma file was first set up (page "Screens", frame `5:2`). That screen used the first shell and floating cards.

Claude redrew My Work on the accepted pattern that the other Figma pages share:
- the Shell v2 rail and top bar;
- the flush secondary menu;
- the shared grid;
- the record window that opens over a register;
- the phone pattern with flush lists and an icon-only tab bar.

It read the six My Work views, the activity detail and the phone overview from the application code. It also read Dean's 9 October owner review, so the redraw applies those findings.

While the page was being drawn, Dean asked: "Could we also include a module in the My work page relating to "Todays weather"? I could connect the account to google weather. Do you think this would be an interesting feature to include?" Claude recommended it, focused on today's site visits, and added it as a proposed module (section 6).

Dean accepted the design: "Proceed with your recommendations". The design reference is the named Figma version "My Work — Pipedrive pattern, accepted".

This record retains:
- his decisions;
- the design reference and its icon-free captures;
- the conformance declaration;
- the display rules and the departures from today's pages;
- the proposed weather module and what it needs before it is built;
- what remains open.

Scope:
- **Routes:** the existing `/work` (Overview), `/work/actions`, `/work/reviews`, `/work/waiting`, `/work/team`, `/work/updates`, and `/work/[id]`, shown as a window over My actions.
- **Register entries:** `route:/work`, `route:/work/actions`, `route:/work/reviews`, `route:/work/waiting`, `route:/work/team`, `route:/work/updates` and `route:/work/[id]`.
- **Scopes:** `SH-02` "My Work action centre", with `SH-01` (home sends people with `activity.read` to My Work).
- No scope ID or parent requirement ID is added or renamed.

This is a design decision. It authorises none of the following:
- application code, a new read or a migration;
- a weather provider, an API key, a Google Cloud account or any external service;
- a route change, a permission or a capability;
- deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Redraw My Work on the accepted pattern | User decision, 12 October 2026 | "Rebuild the "My work" UI page that is in Figma so it aligns with the rest of the UI pages that we have built." |
| Add a Today's weather module | User request, 12 October 2026; module proposed by Claude | "Could we also include a module in the My work page relating to "Todays weather"? I could connect the account to google weather." Claude answered that it is worth including, mainly for site visits, and drew it as a proposal (section 6) |
| Accept the design and its recommendations | User decision, 12 October 2026 | "Proceed with your recommendations". R1–R7 below are adopted, and Q1, Q3 and Q5 take their recommended answers. Q2 and Q4 had no recommendation, so they stay open |
| R1 Done ring opens Record outcome | Claude's recommendation, adopted | The first control in an activity row is a done ring, as in Pipedrive. It opens Record outcome; an activity is never completed in one click without an outcome |
| R2 No selection column on activity grids | Claude's recommendation, adopted | My actions and Team queue have no bulk actions, so the grid starts with the Done column instead of a checkbox. The Updates Inbox keeps the checkbox column, because it has the only bulk actions in My Work |
| R3 Breadcrumbs use the menu labels | Claude's recommendation, adopted | "My Work / <view>" on the five views. The Updates page heading becomes "Updates & preferences" (today it reads "Notifications") |
| R4 No greeting | Claude's recommendation, adopted | The greeting and the department chip go; the summary strip is the first thing seen. Date and freshness move to the toolbar |
| R5 Owner after Due | Claude's recommendation, adopted | In activity grids the Owner column follows Due, so Team queue uses the same row as My actions |
| R6 Weather is compact and conditional | Claude's recommendation, adopted | One small panel, shown only when a provider is connected, focused on today's site visits (section 6) |
| R7 Phone quick actions | Claude's recommendation, adopted | Emails, Leads and Tasks stay, with their names under the icons. Map and Insights are hidden until those features exist |
| Q1 Weather provider | Resolved by "Proceed" | An ADR chooses the provider before anything is built. Dean suggested Google Weather; the ADR compares it and settles the key, cost, attribution, caching and locations |
| Q3 Phone quick actions | Resolved by "Proceed" | As R7 |
| Q5 Order of the Overview side column | Resolved by "Proceed" | Weather first, then Today's schedule, Waiting on others and Needs a next activity |
| Q2 "No next activity" rule (D3) | Open | It still uses the Deals rule (`next_action_state = 'Needed'`), as recorded in [the Sales overview integration](my-work-sales-overview-integration.md) |
| Q4 My Work on the Sales rail | Open | Every department rail except Sales lists My Work first; Sales reaches it from home and the phone bar |
| Building the pages and the weather module | Not decided | Section 7 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design" in Dean's Figma team, at the named version "My Work — Pipedrive pattern, accepted". The file's link is not recorded in this public repository, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Accepted frames | Page "My Work (accepted)" `404:2`, viewer Sasha Clarke (SC) in Estimating & quotation, synthetic data, Monday 12 October 2026: <ul><li>Overview `404:3`;</li><li>My actions `411:84514`;</li><li>My actions with the activity window open `413:982`;</li><li>Record outcome dialog `413:92120`;</li><li>Team queue `415:3573`;</li><li>Reviews & handovers `415:91696`;</li><li>Blocked & waiting `415:92578`;</li><li>Updates & preferences, Inbox `415:94450`;</li><li>phone Overview `404:181`, My actions `414:1984` and Activity `414:2309`;</li><li>notes card `417:3557`.</li></ul> |
| Page components (proposed) | My Work / Summary cell `408:368`, Activity row `408:412`, Group row `408:375` and Side row `408:413`; Grid / Done cell (proposed) `408:430`; Activity grid row `408:83487` and header `408:83488`; Review & handover grid row `415:89676` and header `415:89677`; Waiting grid row `415:89797` and header `415:89798`; Update grid row `415:94421` and header `415:94422`; Activity list row (phone) `408:431` |
| Icons added | Seven Font Awesome Pro Light icons on the Components page, drawn from Dean's Kit: cloud-sun, cloud-rain, sun, cloud, wind, umbrella and video (the app's icon for Meeting activities) |
| Prototype | Flows "My Work — desktop" from the Overview and "My Work — phone" from the phone Overview: <ul><li>The menu moves between the six views in every desktop frame.</li><li>The Overdue, Due today and Waiting summary cells, View all activities, Set dates, Review and the Waiting panel's View all open their views.</li><li>The OEM query row opens the activity window, and × returns.</li><li>The done ring on "Call about pump sizing" opens Record outcome; Cancel, Save and × return.</li><li>On the phone, Needs attention › View all opens My actions, the OEM row opens the activity, and ← returns.</li></ul>62 links; an audit found no link to another page |
| Replaced trial | Page "Screens", frame `5:2` (11 October 2026), now labelled as superseded and kept as the trial record |
| Retained captures | [My Work page design r01](../reference/ui/my-work/my-work-page-design-r01/README.md): nine icon-free PNGs at exact frame size, with hashes. These are the repository reference for this decision |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | The existing routes in `src/app/(business)/work/(workspace)/` under `MyWorkShell`, register entries `route:/work`, `/work/actions`, `/work/reviews`, `/work/waiting`, `/work/team`, `/work/updates` and `/work/[id]`, and scopes `scope:SH-02` with `scope:SH-01`. Capabilities, unchanged: `activity.read` for My Work; `activity.edit` for Team queue; `crm.opportunity.read` for No next activity and Needs a next activity; the source workflow's own capabilities for every review decision |
| Page type (r20) | Overview / dashboard for the Overview. Register / worklist for My actions, Team queue, Reviews & handovers, Blocked & waiting and the Updates Inbox. Record detail for the activity window. Form / guided workflow for Record outcome. On the phone: an overview and lists, with a full-screen record |
| Reused components | <ul><li>The accepted Shell v2 rail, top bar, menu item, menu heading, menu edge and More panel, and the phone header, tab bar and quick add, from the [Reviews & approvals decision](estimate-reviews-design.md).</li><li>Grid / Header cell, Cell, Checkbox cell and Row actions cell from the same decision.</li><li>The record window from the [Leads decision](leads-design.md), and Record / View tab from the work order record page design (pull request 432).</li><li>Button, Tag and Font Awesome Light icons named as in `src/components/font-awesome-icons.ts`.</li><li>New: the page components in section 2.</li></ul> |
| Source authority | <ul><li>`src/shell/navigation.ts`: `workViews` (order, labels and routes) and `departmentRails`.</li><li>`src/activities/components/client/my-work-*.tsx`, `src/activities/work-view.ts`, `work-overview.ts`, `work-waiting.ts` and `work-reviews.ts`: the tiles, groups, timing text, filters and empty states.</li><li>`src/components/review-workspace.tsx` and `src/components/notification-workspace.tsx`: Reviews & handovers and Updates & preferences.</li><li>`src/components/activity-screens.tsx` and `my-work-dialogs.tsx`: the activity detail, Record outcome (presets, required outcome, "What happens next?") and Reschedule (reason required, D15).</li><li>[My Work Sales overview integration](my-work-sales-overview-integration.md), [phone integration](my-work-sales-mobile-r07-integration.md), [action centre design](my-work-action-centre-design.md) and the [UI build sequence](ui-build-sequence.md) (S5, S6, refinement batch 2).</li></ul> |
| Incoming handover | Home and sign-in (identities with `activity.read`), every department rail except Sales, the Sales phone bar, the Calendar, notification links and global search |
| Outgoing handover | Activity records and their linked lead, deal, customer, site, asset, project or service request; the source workflow of each review or handover; the waiting request's source record; Deals for "No next activity"; the Calendar. Decisions are never made in My Work |
| States shown | <ul><li>An Estimating viewer with two overdue activities, three due today, two waiting requests, two opportunities without a next activity, two undated activities and two reviews.</li><li>The activity window and the Record outcome dialog.</li><li>Team queue for all owners.</li><li>Reviews & handovers (My reviews), Blocked & waiting and the Updates Inbox with unread and read notices.</li><li>The phone overview, list and activity.</li></ul>Loading, error, empty, filtered-empty and no-access states are not drawn; they keep today's wording |
| Departures | Section 5 |
| Verification | Section 8 |

## 4. Display rules

The rules are today's; the design changes how they are shown.

| Item | Rule |
|---|---|
| Overdue | An active activity whose `due_at` is before now. Shown in the danger colour, with the days overdue and the due date ("38 days overdue", "due 4 Sep 2026") |
| Due today | An active activity due later today: "Starts at 09:30" for an appointment, "Due by 17:00" for a deadline, "today" for a date-only due date |
| Upcoming | Due after today: "Wed 14 Oct", or "Thu 15 Oct 10:00" with a time |
| Date needed | No due date. Shown in the warning colour, with the calendar-exclamation icon |
| Groups | Overdue, Today, Upcoming, Date needed, then Completed or cancelled when the status filter includes them, in server order. The Overview lists overdue and today only, eight at most, most urgent first |
| Summary strip | Overdue and Due today count activities; Waiting on others counts requests (Service requests that need information with an open clarification, and Engineering packages with a recorded blocker); No next activity counts open opportunities whose next action is "Needed". Each cell opens its view. A count that could not be read shows "—" with "Unavailable" or "No access", never zero |
| Done ring | Opens Record outcome. The outcome is required. "What happens next?" defaults to "Plan the next activity" for a lead or opportunity |
| Reschedule / Set date | In the row's "…" menu and the window footer. A reason is required. Nobody outside Powerplants One is notified, because there is no shared calendar |
| Reviews & handovers | Coordination only: opening a review never approves it. Estimate approvals and won-deal receiving are not listed yet |
| Blocked & waiting | Next follow-up first. Follow up updates the follow-up only; the source workflow clears the request |
| Updates Inbox | Unread notices in bold, with a highlighted bell; read notices on a lighter row. In-app notices only. Marking a notice read never completes the work it points to |
| Times | 24-hour, Brisbane time; the zone is stated once per list ("updated 08:14 AEST", "AEST" on Today's schedule) |

## 5. Departures from today's pages

| Item | Today | Accepted design | Reason |
|---|---|---|---|
| Shell | The rail and header in use today | The accepted Shell v2 rail and top bar, with My Work selected | Aligns My Work with every accepted page |
| Breadcrumb | "My Work" alone on the Overview (navigation repair) and the view name on sub-views | "Estimating & quotation / My Work" on the Overview, as on every accepted department page; "My Work / <view>" on the five views | One breadcrumb pattern. In other departments the department name changes |
| Secondary menu | "My Work / Personal workspace" title, the six views and Pinned views | The six views with counts and Pinned views, in the flush menu; no title block | The breadcrumb names the page |
| Greeting and department chip | "Good morning, <name>", the department tag, the long date and Customise | Removed. "updated 08:14 AEST" sits in the toolbar; Customise moves into "…" (R4) | The summary strip comes first |
| Attention tiles | Four bordered tiles | A flush summary strip under the toolbar | The accepted strip pattern |
| Activity rows | Title, context, timing, then "✓ Complete" and "Reschedule" buttons; titles wrapped to three lines (9 Oct finding) | Done ring, type icon, a one-line title with the full width, tag and context, timing, then "…" | 9 Oct finding; Pipedrive pattern (R1) |
| Side panels | Card headings with icons; the "Needs a next activity" count dropped to its own line (9 Oct finding) | One section heading pattern: title, count, link | 9 Oct finding |
| My actions and Team queue | A form-style filter panel and grouped cards | The accepted grid with group rows, the Done column first and "…" pinned right. Owner, Due and Filters in the toolbar; Team queue's owner chips become a flush owner strip | The accepted register pattern (R2, R5) |
| Activity detail | A separate page and a drawer; record numbers before names; overdue not stated (9 Oct finding) | A window over the grid with close, previous and next. Names first, then numbers; "38 days overdue" in the header; footer Reschedule and Complete; "Open full activity page" in "…" | The accepted record window; 9 Oct findings |
| Reviews & handovers | Tabs with "(0+)" counts, filters and a source-window paragraph (9 Oct finding, S5) | The perspectives move into a view picker ("My reviews"); Area and Type filters; a grid; one plain sentence under it | The accepted register pattern; S5 |
| Updates & preferences | Heading "Notifications", tabs, statistics, the inbox list | Breadcrumb "My Work / Updates & preferences"; view tabs Inbox, Grouped changes, Owned escalations and Preferences; the inbox as a grid with selection | R3; the only My Work list with bulk actions |
| Grid dates | S6 (9 October): dates always carry the year | Same-year dates drop the year in grid cells ("Wed 14 Oct", "9 Oct · 4 days ago"); the window and the overdue detail keep the full date ("due 4 Sep 2026") | Follows the accepted grids, as in the [Intake & workload decision](intake-workload-design.md). S6 still applies to every full date |
| Phone | Greeting, five quick actions, Needs attention, the weekly agenda and Waiting on others | Page name only in the header; weather (when connected); three quick actions with names (R7); Needs attention; This week; Today; Waiting on others; flush lists; the icon-only tab bar with My Work current | The accepted phone pattern |
| Weather | A phone card that never shows, because no provider is connected | A proposed module on the desktop and the phone (section 6) | Dean's request, 12 October 2026 |

## 6. Today's weather (proposed module)

Dean asked for a weather module and offered to connect a Google account. Claude recommended it, because Powerplants' estimators, engineers and technicians visit growers' sites, and rain or wind during a visit changes the plan. The module is part of the accepted design, but it is a proposal for building: no provider is chosen and nothing is connected.

| Item | Accepted design |
|---|---|
| Desktop | A compact panel at the top of the Overview's side column, titled "Today's weather" with the office location. It shows conditions, the temperature, and the day's high and low with any rain window. Under it, one warning line for each site visit today when rain or wind overlaps the visit (drawn: "Site visit at 13:00 · SYN Northbank Block B — Showers likely from 14:00 (60%) · wind 22 km/h"). Foot: "Forecast from Google Weather · 08:00" and an Hourly link |
| Phone | One flush row with the same facts and the same site warning, above Quick actions |
| Not connected | The module is not shown at all. This keeps the 9 October finding that the "Weather is not connected" card took prime space |
| Sample values | 24°, partly cloudy, high 27° and low 18°, showers 30% after 15:00, and the Block B warning are synthetic drawing values. They are not seeded or served, as with today's `tests/helpers/my-work.ts` sample |

Before anything is built, an ADR must choose the provider (AGENTS.md: a technology choice needs its reason, constraints and alternatives recorded first). It must settle:
- the provider: Google's Weather API (Google Maps Platform), as Dean suggested, against alternatives;
- the key, held on the server only and kept out of the repository;
- cost and quota;
- the provider's attribution and caching terms;
- which locations are used: the office, and each visited site's coordinates;
- the warning thresholds for rain and wind;
- what is shown when the forecast cannot be read.

Then a read replaces today's `work/weather` answer, which is always `not_configured` (`src/activities/work-weather.ts`).

## 7. Not decided

- Building the accepted pages in the application, and in what order. The [UI build sequence](ui-build-sequence.md) governs that.
- Rolling out Shell v2 and the shared register table across the application.
- The weather provider ADR and the weather read (section 6).
- Q2 (D3 rule) and Q4 (My Work on the Sales rail).
- Not drawn:
  - the Grouped changes, Owned escalations and Preferences tabs;
  - the review detail window;
  - the Follow up, Reschedule and Set date dialogs;
  - the full `/work/new` form;
  - Customise overview;
  - the hourly weather view;
  - the loading, error, empty and no-access states;
  - the phone Reviews, Waiting, Team and Updates views;
  - the My Work Overview in other departments' rails.

## 8. Verification

| Check | Result |
|---|---|
| Visual review in Figma | Each frame was checked in screenshots taken inside Figma during drawing and fixes: overflow, truncation, pinned columns and tag labels. The prototype was not played in Present mode |
| Prototype links | 62 links. An audit removed none, because none pointed to another page |
| Icon-free captures | Nine capture copies on the page "Captures (icon-free)". 1,063 Font Awesome instances were swapped for `Icon/placeholder`, and a recheck found none left |
| Retained bytes | The nine PNGs and their SHA-256 hashes are listed in the [captures README](../reference/ui/my-work/my-work-page-design-r01/README.md) |
| Repository checks | Recorded in the pull request that adds this record |
