# Calendar — design reference

Stable entry: `route:/calendar`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/calendar`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

An app page exists here. Its wider workspace scope or newer design still needs refinement; see the linked scope areas below.

1. Choose the intended personal or team context
2. Review the underlying activity and its time basis
3. Record completion or a changed next action through the owning workflow

## Desktop

Accepted design: the [Calendar design decision](../../../decisions/calendar-figma-design.md) of 19 October 2026 covers `/calendar` (the Sales rail's "Activities"): Week (default), Day with the meeting detail panel, Team availability, Plan follow-up and List, with eighteen icon-free captures in [design r01](../../../reference/ui/sales/calendar-design-r01/README.md). Departures D1–D8 and answers Q1–Q5 are recorded there: meetings on the time grid and PPO activities in a Due lane, Outlook meetings read only with Plan follow-up and Link records, words for every state, overlaps shown side by side, time zone, source and sync state always visible, and free-or-busy team availability. Nothing new is built; the built Day and Agenda page remains.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 07–12 and 18 in [design r01](../../../reference/ui/sales/calendar-design-r01/README.md): Day at 390 and 320 with the compact phone header (Phone header amendment), the List, the meeting sheet, Choose view, the full-screen Filter and the out-of-date state.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

Icon-free Figma captures: [Calendar design r01](../../../reference/ui/sales/calendar-design-r01/README.md). No HTML reference is linked.

## Behaviour, handovers and verification

Accepted Figma design: [Calendar design r01 captures](../../../reference/ui/sales/calendar-design-r01/README.md) (eighteen icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/calendar-figma-design.md). All-day items, recurring-series detail, Month view, phone Week and Team views, a tablet Day panel, the meeting Link records panel and 200% zoom are not drawn. The named Figma version waits for Dean's explicit yes.

The draft User Guide `guide.page.calendar` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
