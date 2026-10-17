# Projects register — built page against the accepted design

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Date: 17 October 2026. Status: comparison made under [ADR-0053](../../../decisions/ADR-0053-figma-page-design.md) rule 7; no difference is fixed yet. This record is not a visual review or owner acceptance. The route's visual status stays "Needs review" and no review fingerprint is copied or promoted.

Design: the [Projects register design decision](../../../decisions/projects-register-design.md) (sections 4 and 5) and its five [icon-free captures r01](../../../reference/ui/projects/projects-register-design-r01/README.md). Implementation: [projects-register-native.md](../../../decisions/projects-register-native.md), `src/components/projects-register.tsx`, `src/app/styles/projects-register.css` and the register read `src/projects/register.ts`. Scope: `route:/projects`, PJ01, requirements PRJ-01, PRJ-02, PRJ-07 and PRJ-08; no ID is added or changed.

## Method

- **Build.** Branch `docs/projects-register-design-comparison`, cut from `docs/projects-register-design` at `48af353` (PR #552 on main `271a386`), no application change. Next.js 16.4.0 development server on a loopback port, Node 24.22.0, Chrome 155.0.8059.84, locale en-AU, time zone Australia/Brisbane, device scale 1.
- **Database.** A disposable PostgreSQL 16 cluster, database `ppo_synthetic`, migrated and seeded from this commit. Signed in with the synthetic `coordinator` profile.
- **Data.** The design's seven active projects were created through the app's own project and task API, with the same titles, target dates, next milestones, At risk counts and an undated milestone. Block C fertigation upgrade carries the record window's schedule: 18 tasks, 7 complete, 2 at risk, 5 milestones, with phases Planning 4 of 4, Procurement 3 of 6, Delivery 0 of 5 and Handover 0 of 3. The Glasshouse milestone moved from 16 to 20 October so that it stays not overdue on 17 October, as the design shows.
- **Viewports.** Desktop 1440 × 900 with the rail expanded and the secondary menu open; phone 390 × 844 with touch. The same five states as the design: register, record window (Block C), two rows selected with the small panel (Boiler room and Block C), phone list and phone record view (Block C).
- **Comparison.** Each pair was inspected by eye, with crops at 1.5–3× for the headers. Geometry and text styles were read from the running page. No pixel diff was made: the design captures carry placeholder squares for icons, and the local build has no Font Awesome Kit, so it draws the ADR-0050 fallback glyphs. Icons are therefore not compared. The Figma frames were not reopened; the retained captures are the reference.

### Data that differs only because of the fixture

These are not page differences. The seed has three customers, and only `SYN Coordinator` can coordinate them, so My projects reads 7 (design 3) and every coordinator is "SYN Coordinator". There are no closed projects: the project evidence triggers refuse a direct lifecycle change, and the Acceptance & closeout flow was not run, so Closed reads 0 (design 4) and All projects 7 (design 11). References are `SYN-PPO-PRJ-000001` to `000007`, creation dates are 17 October, the history holds one event per fixture task, and no won deal is linked, so the Sales source reads "No accepted Sales handover linked".

## Captures

The design reference is the r01 set. These built-page captures are synthetic application screenshots, not a UI baseline.

| State | Design (r01) | Built page | Size (px) | Bytes | SHA-256 |
|---|---|---|---|---:|---|
| Desktop · register | [01](../../../reference/ui/projects/projects-register-design-r01/PPO-Projects-Register-01-Desktop-Register-r01.png) | [01-desktop-register.png](design-comparison/01-desktop-register.png) | 1440 × 900 | 114,858 | `cb9b3157c5d1d6c852a87d8ef400073cdc7e1d5a3eda9eeb678da23e914142dd` |
| Desktop · record window | [02](../../../reference/ui/projects/projects-register-design-r01/PPO-Projects-Register-02-Desktop-Record-Window-r01.png) | [02-desktop-record-window.png](design-comparison/02-desktop-record-window.png) | 1440 × 900 | 223,483 | `3afb13e4fc75a9b58d676110af7c48b280673f906c4709a0411f036ccebf9cfb` |
| Desktop · two rows selected, small panel | [03](../../../reference/ui/projects/projects-register-design-r01/PPO-Projects-Register-03-Desktop-Selection-Small-Panel-r01.png) | [03-desktop-selection-small-panel.png](design-comparison/03-desktop-selection-small-panel.png) | 1440 × 900 | 141,130 | `ef29eb735749182d142aa6cacdc0f8bdff6682c58c47855a0e6cd691e7230753` |
| Phone · project list | [04](../../../reference/ui/projects/projects-register-design-r01/PPO-Projects-Register-04-Phone-Project-List-r01.png) | [04-phone-project-list.png](design-comparison/04-phone-project-list.png) | 390 × 844 | 72,012 | `f9a10347ba63b36c10f20836ffbdc4834844a7a8846b5b20491bbe1b40b21b99` |
| Phone · record view | [05](../../../reference/ui/projects/projects-register-design-r01/PPO-Projects-Register-05-Phone-Record-View-r01.png) | [05-phone-record-view.png](design-comparison/05-phone-record-view.png) | 390 × 844 | 65,349 | `449482b1e43071e3288bf127680a2711a4e91129f5e22252b16b3375f32a420f` |

## What matches

- **Layout.** Rail 240 px with Collapse navigation, the Projects heading, My Work, Projects with its active-project badge, Programme, Acceptance & closeout and More (P6). Secondary menu 240 px. Content toolbar 60 px. Header and body rows 40 px. Checkbox and settings columns pinned. No horizontal page scroll at either viewport.
- **Columns (P1).** Project, Next milestone, Milestone date, Target date, At risk, Customer, Site, Coordinator, Status and Reference, in the drawn order and widths. Target date carries the ascending sort marker.
- **Menu views (P2).** Active projects (default, selected), My projects, Closed, All projects; under Needs attention, Overdue milestones, Tasks at risk and No target date, each with a neutral count. Overdue milestones 2, Tasks at risk 3 and No target date 1 match the design.
- **Toolbar (P3).** Coordinator: Everyone and Customer: All customers filters, the count with its refresh time, Refresh, + Project as the primary button and "…".
- **Record window (P4).** It overlaps the grid from the content edge at 960 px, with a 440 px record column. Close, previous and next controls sit over the menu edge. It shows the title, reference, creation date and site time; the Active tag with "Next milestone overdue · 9 Oct"; Project facts; Schedule facts with the same three lines; the rule note; the At risk (2) and Milestones (5) tabs; History; and Acceptance & closeout with Open schedule.
- **Selection (P5).** Open in sequence and Export list replace the filters. The "2 SELECTED" chip, Hide panel and "…" are on the right. The 360 px panel holds the two cards, the note, "For the selection" with its two explanations, and Cancel with Open in sequence. The header checkbox shows the mixed state.
- **Phone (P7).** Header without a breadcrumb. View chooser, count and filter button. Flush 80 px rows with the title; customer and target with the "n at risk" tag; and the next milestone with its date, Overdue or Unscheduled. The 56 px add button. The five icon-only tabs, with Projects current. The record view stacks the status, facts, note and tabs above the fixed Acceptance & closeout and Open schedule footer.

## Differences

Classification: **Fix** means the build should change to match the design; it is proposed only and waits for Dean's go-ahead. **Recorded adaptation** means [projects-register-native.md](../../../decisions/projects-register-native.md) already records the departure. **Question** means Dean decides; the recommendation is given.

| ID | Area | Design | Built page | Classification |
|---|---|---|---|---|
| C01 | Desktop header | Panel toggle and "Projects" | Panel toggle and the breadcrumb "Projects / Project register" | Recorded adaptation ("Handovers and adaptations", last paragraph). The design record's first observation (section 4) already notes it. The shell top bar amendment accepted on 16 October (R1–R8) will set every page's header; no page change before then |
| C02 | Desktop top bar, right | Search 640–1040 px; quick add; four icons; avatar | Search 590–908 px; quick add; Design and build workspace (development), Page guide, Quick Help and Notifications; the company context chip "SYN-A · SYN Greenhouse D…"; avatar | Recorded adaptation (global search alignment, company context, guide and development controls). Shell-level, governed by the same amendment |
| C03 | Phone header | Menu, "Projects", one icon, avatar | Menu, "Projects", Design and build workspace, global search and Page guide, avatar | Recorded adaptation (as C02) |
| C04 | Grid header text | Dark labels | Grey labels (rgb 89, 103, 121, weight 500) | Fix: use the drawn label colour in the scoped Projects table variant |
| C05 | At risk header | Right-aligned over its right-aligned numbers | Left-aligned; the numbers are right-aligned | Fix |
| C06 | Toolbar count | "7 projects · updated 10:42 AEST" at body size | 12 px. The built string has three more characters ("pm ") yet is 9 px narrower | Fix: take the size from the frame's text style |
| C07 | Time of day | 24-hour: "10:42 AEST" in the toolbar, "15:10" in History | 12-hour: "12:59 pm AEST" and "1:58 pm", from the toolbar's own `Intl` call and the older `Stamp` in `business-ui.tsx` | Fix. The design agrees with the adopted S6 rule ([ui-build-sequence](../../../decisions/ui-build-sequence.md), 9 October 2026: 24-hour times), which has a shared formatter in `src/shell/date-format.ts`. Use it for both |
| C08 | Record footer | An icon-only button at the left of the footer, before Acceptance & closeout (its icon is a placeholder in the capture) | No such button | Question. Section 4 (P4) names only two buttons and no "…" actions. Recommended: leave it out unless Dean names what it holds |
| C09 | Sales source label | "Sales source · won deal" | "Sales source · accepted won handover" | Question. Recommended: keep the built wording, which says the handover was accepted, and record it as an adaptation |
| C10 | Sales source value | "SYN-PPO-OPP-000318 · Block C fertigation upgrade" | The opportunity title as a link, without its reference. Read from the code, because the fixture had no won deal: the `sales-handovers` read returns `opportunity_title` and no opportunity reference | Fix: add the opportunity reference to the read and show "reference · title". This changes a read, so it needs the go-ahead |
| C11 | At risk tab rows | "Fertigation skid delivery · Procurement · finishes 9 Oct · Alex Nguyen" | "Fertigation skid delivery · Procurement · 9 Oct · SYN Coordinator" | Fix: add "finishes" |
| C12 | History entries | Says what changed: "Fertigation skid delivery marked at risk" and "Project created from won deal SYN-PPO-OPP-000318", then time, person and reason | "Schedule updated · version 24" or "Project created · version 1", then time, person and reason. The history read carries only the event type and reason | Question. Recommended: a separate change so the history read names the task and change. Until then the built entries are accurate but less useful |
| C13 | History heading and markers | "History" with its control after the label; hollow ring markers | The browser's disclosure triangle before "History"; filled grey dots | Fix (minor) |
| C14 | Phone record header | "SYN-PPO-PRJ-000027 · created 2 Sep"; the header rule runs unbroken | "SYN-PPO-PRJ-000003 · created 17 Oct 2026 ·", ending in a stray "·" because the site time is cut off. The title block's white background covers the header rule from about 50 to 290 px | Fix: on the phone, show the reference and short creation date only (the site time is in the Site fact), and stop the title block covering the rule |
| C15 | Phone multi-select | Adopted as direction, not drawn | Press and hold (Shift+Space on a keyboard) with a labelled bottom bar: Open, Export, Cancel | Recorded adaptation ("Implementation decision", last item) |
| C16 | States not drawn | Not drawn: loading, error, empty, column choices, paging, previous and next in the record window | Built on the established app patterns | Recorded adaptation ("Handovers and adaptations", third paragraph) |
| C17 | Search | "…" is drawn closed; the toolbar has no search box | "…" holds Search projects, Export this page (CSV) and Clear filters; on the phone, the filter menu holds the filters, search, refresh and Clear filters | Question. Neither record names search. Recommended: accept it as drawn here and record it with C09 |
| C18 | Zone names and years | "site time Australia/Brisbane" in the record header and "Site · schedule dates use Australia/Brisbane"; current-year dates without the year ("9 Oct", "16 Oct") | As drawn | Question. S6 says people never see an internal zone name and the year is always shown; S6 was adopted for the phase 00 pages, and this design, accepted on 11 October, departs from it without saying so. Recommended: apply S6 here as well (for example "AEST (UTC+10)", and dates with the year) when the S6 instances on Projects pages are built, and record that in the design record |

## Derived columns against the design rules

Section 4 of the design record sets the rules. The read is `projectRegister()` in `src/projects/register.ts`; the record window repeats the overdue rule in `projects-register.tsx` with `todayInZone()`.

| Column | Design rule | Built read | Result |
|---|---|---|---|
| Next milestone, Milestone date | The earliest milestone not marked Complete, undated last; undated reads "Unscheduled" | A lateral join over milestones with `status<>'Complete'`, ordered by `finish_date ASC NULLS LAST, id`. A milestone has one date (migration 0019 check), so its finish date is its date. Undated reads "Unscheduled"; none remaining reads "No remaining milestones" with "—" | Matches. Live: Block C skips its two complete milestones and shows "Fertigation skid on site · 9 Oct"; Water treatment shows "Scope confirmed · Unscheduled". "No remaining milestones" is a recorded adaptation |
| Overdue | Not Complete, dated before today in the site's time zone; "Overdue · date" in red, word always present | `finish_date < (observed_at AT TIME ZONE site.timezone)::date`; the cell reads "Overdue · date" in the overdue colour | Matches. Live: 7 and 9 October are overdue on 17 October. A probe milestone dated 17 October was not overdue (strictly before today) |
| At risk | The number of tasks explicitly marked At risk; no health score | Counts tasks with `NOT milestone AND status='AtRisk'` | Matches for tasks. Live: 1, 2 and 1, giving Tasks at risk 3. See Q-D1 |
| Target date | "Not set" in grey; default sort earliest first, "Not set" last | Default `sort=target`, `asc`, `NULLS LAST`; "Not set" muted | Matches. Descending also keeps "Not set" last (the design is silent) |
| Counts and badge | Rail badge counts active projects | `active_count` counts all authorised active projects, whatever the filters; view counts cover all matches | Matches. The attention views count active projects only, a recorded adaptation |

Two points need Dean's decision:

- **Q-D1 — a milestone marked At risk.** Milestones may carry At risk status (migration 0019 forbids only In progress), and the Milestones tab shows it. The At risk column, the Tasks at risk view and the At risk tab exclude it: a probe milestone marked At risk gave 0. The design's record window counts tasks and milestones separately ("18 tasks"; "Milestones (5)"), so this agrees with the drawing. Recommended: keep it, and say so in the design record.
- **Q-D2 — overdue on a closed project.** The read computes overdue whatever the lifecycle, so a closed project with an incomplete milestone in the past would read "Overdue · date" in the Closed and All views. The design does not draw those views. Not reproduced: the fixture has no closed project. Recommended: show the milestone date without the Overdue styling on a closed project, as a small later fix if Dean agrees.

## Limits

- The development server ran, not the compiled build. Icons are fallback glyphs, so neither set's icons are compared. The colour and size findings (C04–C06) come from computed styles and comparison by eye, not a pixel measurement of the design frames.
- The Closed and All views, a second coordinator, a linked won deal and a closed project's record window were not exercised. Physical devices, screen readers and other viewports were not checked.
- Nothing here changes application code, the read model, the route's visual status or any review fingerprint.
