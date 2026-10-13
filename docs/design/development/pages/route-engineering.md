# Engineering workspace — design reference

Stable entry: `route:/engineering`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/engineering`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

An app page exists here. Its wider workspace scope or newer design still needs refinement; see the linked scope areas below.

1. Confirm the accepted engineering basis
2. Review workload and blocked deliverables
3. Assign a next action without bypassing technical review

## Desktop

Accepted design (11 October 2026): the [Engineering workload design decision](../../../decisions/engineering-workload-design.md), with captures 01–03 in [Engineering workload design r01](../../../reference/ui/engineering/engineering-workload-design-r01/README.md). It reuses the [Reviews & approvals](../../../decisions/estimate-reviews-design.md) shell and grid with Engineering's own rail. The app still shows the r02 tabbed register and package drawer, and the shell parts wait for their own rollout decision.

- **Layout at 1440 × 900:** the labelled 240 px Engineering rail with Engineering workload selected (white tile, Solid bars-progress icon); the breadcrumb "Engineering / Engineering workload" as the page title; a flush 240 px secondary menu; then a 60 px toolbar and a full-bleed grid. The four header links move to the rail and to the record window's Linked records.
- **Secondary menu:** All packages, My work, Author actions, Reviews assigned to me and Released; a Status group (Queued, In design, Awaiting information); an Attention group (Needs attention). Neutral counts on every view, from a new count read. It collapses to a 20 px strip from its right border or the top-bar toggle.
- **Toolbar:** New request (the existing "What needs engineering?" dialog), search, Engineer (any eligible engineer) and Discipline filters, the count, Refresh and "…".
- **Grid:** single-line 40 px rows. Reference, Work package, Customer, Status and Required by are visible with both menus open; Engineer, Next action, Action due, Deliverables, Discipline and Project or opportunity scroll in from the right. Required by is sorted on the server (earliest first, "Date needed" last). Overdue dates are amber with an icon. The checkbox column and the settings and "…" column stay fixed.
- **Status:** Queued and In design neutral, Awaiting information amber; every status has words.
- **Record window:** clicking a row opens it over the grid, never squeezing it, capped at 960 px and right-aligned. It shows the package summary, next action and missing input, design brief, linked records and the effort rule, with Deliverables, Queries and Reviews & issues tabs and the coordination History. Its buttons are Open package and Update coordination.
- **Selection:** ticking rows shows a 360 px panel with Open in sequence and Export list only.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design (11 October 2026): captures 04–05 in [Engineering workload design r01](../../../reference/ui/engineering/engineering-workload-design-r01/README.md).

- **Header and toolbar at 390 × 844:** the page name "Engineering workload" only, with no breadcrumb. A toolbar holds a view picker ("All packages") standing in for the secondary menu, the count and a filter icon button.
- **List:** flush list rows about 80 px tall, each showing the title and required date, the reference and status, and the customer and engineer, with a chevron.
- **Record view:** tapping a row opens a full-screen record view with back, previous and next. The package is stacked, and Open package and Update coordination are fixed at the bottom.
- **Tab bar:** icons only, five tabs with hidden accessible labels: My Work, Engineering workload (current), Drawings, Technical reviews and More. Phone selection of several rows is not designed yet.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- Accepted Figma design: [Engineering workload design r01 captures](../../../reference/ui/engineering/engineering-workload-design-r01/README.md) (icon-free PNGs; not application captures).
- [PPO-Engineering-Container-r02.html](../../../reference/ui/engineering/PPO-Engineering-Container-r02.html)

## Behaviour, handovers and verification

The draft User Guide `guide.page.engineering` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## Native workflow reconciliation — 24 September 2026

EN-01 retains package identity, intake, Project/Opportunity context, coordination history, versioning and bookmarks. It now reads native EN-02–EN-05 records. Parent trace: ENG-01–ENG-04.

All packages and My work retain their original package ownership meaning. Author actions shows owned draft/returned bases, open/returned queries, returned submittals and open findings. Reviews shows submitted reviews assigned to this person. Released requires a current exact formal issue; coordination state cannot populate it. Search, discipline, ownership and attention filters remain scoped. Attention includes missing deliverable prerequisite evidence.

The inspector's Overview links exact basis and issues. Deliverables lists accountable owners, dates, prerequisites, next actions and controlled documents. Technical queries opens persisted queries/submittals. Review & history separates independent technical decisions from coordination notes. Add deliverables in Drawings; planned hours need a source and authorised hours need authority evidence. Actual effort and staff availability are unknown; no utilisation is calculated.

Incoming: existing packages and permitted Project/Opportunity/customer/site context. Outgoing: package-scoped EN-02–EN-05 records and existing EN-06–EN-08 handovers. The r02 HTML remains an issued design source; new compositions require owner review. Browser evidence and current validation are recorded in `docs/delivery/engineering-native-control-handover.md`; no design/business/deployment approval is inferred.

Native destinations use the department rail; contextual query and retained handover links wrap inside the EN-01 heading. The phone page must not overflow horizontally or shift its modal drawer outside the viewport. Existing intake/review-note browser journeys prove this boundary.

## Register backend continuation — 13 October 2026

The [BC-01 contract](../../../decisions/engineering-workload-backend.md) adds a separate Engineering register API with server ordering, complete permitted-match view/status counts, recorded-owner choices and source-bound pagination. The accepted desktop/phone composition remains to implement; the current page still calls its original list. Native command and technical-source authority remain unchanged. Filter choices include explicitly inactive recorded owners and do not recommend new assignment.

The [execution ledger](../../../testing/evidence/engineering-workload/README.md) records actual backend and compiled HTTP proof separately from visual review. Existing review fingerprints and captures are preserved. New application captures are not produced because this increment changes no UI. No guide workflow or shared component changed.
