# Site register — design reference

Stable entry: `route:/sites`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/sites`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

An app page exists here. Its wider workspace scope or newer design still needs refinement; see the linked scope areas below.

1. Select the correct customer and site
2. Review its facilities, equipment and access context
3. Use the site record when linking downstream work

## Desktop

Accepted design: the [Sites design decision](../../../decisions/sites-figma-design.md) of 18 October 2026, with captures 01 (desktop 1440 × 900) and 04 (tablet 1024) in [design r01](../../../reference/ui/sites/sites-design-r01/README.md).

- **Register:** a grid, one row per site (D1). Columns: Site, Customer, Location, Site readiness, Biosecurity, Areas, Equipment, Next visit, Primary contact and Time zone. The toolbar has Customer and Readiness filters and the count with its "as at" time; search uses the top bar.
- **Views:** Sites is a shared record opened from More; the rail shows Service with More selected. The side menu lists Organisations and People, then All sites (default), Readiness to confirm, Biosecurity unknown and Address to review, then Facilities & growing areas, Site surveys & as-found and Equipment (D2).
- **Site numbers:** every site shows its `SYN-SITE-…` number (Q3).
- **Shell:** the proposed Conversations action sits left of the information icon.
- Nothing new is built.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 05 and 08 in [design r01](../../../reference/ui/sites/sites-design-r01/README.md). List rows with the site name, customer and location, the next visit date or "None booked", and one status line with an icon. The view and customer filters, the count and the "as at" time stay above the list. Sites is reached from More. Three states: loading, no matching sites with Clear the search, and could not load with no list or counts.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

Accepted Figma design: [Sites design r01 captures](../../../reference/ui/sites/sites-design-r01/README.md) (eight icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/sites-figma-design.md). The named version "Sites — accepted" is saved. Images of the Readiness to confirm, Biosecurity unknown and Address to review views, desktop register states, and denied and restricted states are still missing.

- [PPO-Customers-Sites-and-Growing-Areas-Workspace-r03.html](../../../reference/ui/customers/PPO-Customers-Sites-and-Growing-Areas-Workspace-r03.html)

## Behaviour, handovers and verification

The draft User Guide `guide.page.sites` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
