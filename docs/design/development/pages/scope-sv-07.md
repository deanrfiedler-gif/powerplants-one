# Unresolved findings and follow-up worklist — design reference

Stable entry: `scope:SV-07`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/service/findings`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Extend existing owned remaining-work records into a consolidated unresolved-findings, recurrence and follow-up worklist.

1. Identify what remains unresolved and its evidence
2. Assign a next action and accountable owner
3. Close only when the required outcome is evidenced

## Desktop

Accepted design: the [Findings and follow-up design decision](../../../decisions/findings-figma-design.md) of 18 October 2026, with captures 01–04 (desktop 1440 × 900) and 05 (tablet 1024) in [design r01](../../../reference/ui/service/findings-design-r01/README.md). No route exists yet; the design defines the build.

- **Place:** Findings sits in the Service review workspace. The side menu holds Service reports, a Findings group, an Escalations group for SV-08 and a History group; no new rail entry (D1).
- **Register:** the Work orders grid, one row per finding, identified by its source record with no new finding number (D3). Views: All open (default), Needs an owner, Due this week, Overdue, Waiting on review, Ready to close, Recurring and Closed findings. Columns: Source record, What remains, State, Owner, Due, Next action, Closes when, Source, Equipment and Site (D2). The toolbar has Search findings, Owner, Source, Site and the count with its read time.
- **Sources:** inspection defects and not-tested checks, incident corrective actions, remaining work from Partial or Unable-to-proceed completions, customer reservations, and scheduling follow-up (Q1).
- **Snapshot:** a row opens the large snapshot with What remains, What closes it and actions that open the owning record. Findings never close here; each closes in its own record (D4).
- **Next action (new feature, D5):** owner, due time, instruction and evidence needed, saved as one owned My Work activity; changing it updates the same activity and keeps the history. Coordinators and reviewers with service work-order edit access set it (Q2). Overdue means the due time has passed in site time, with no automatic escalation or customer message (Q4).
- **Recurrence (new feature, D6):** the same equipment and the same failed check or category within 90 days is flagged with the earlier occurrences and their correction (Q3). It never reopens or closes anything.
- **Remote diagnosis (new feature, D7):** a recurring fault offers "Request remote diagnosis", handing over to SV-08.
- **Shell:** the proposed Conversations action sits left of the information icon.
- Nothing is built, and building it is not decided.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 06–09 in [design r01](../../../reference/ui/service/findings-design-r01/README.md). List rows show the title, due date, source record and kind, and the state and owner in words (D8). The finding is one scroll with What remains, Next action, What closes it and History, and the owning-record actions pinned; at 320 px one action is pinned beside a menu. Four states: loading, nothing unresolved, could not load, and view only for technicians, who read their own findings (Q2).

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

Accepted Figma design: [Findings design r01 captures](../../../reference/ui/service/findings-design-r01/README.md) (nine icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/findings-figma-design.md). The Escalations page (SV-08) shares the same Service review side menu. Images of the History and Recurrence tabs for every source, bulk assignment, closed findings, the tablet snapshot, denied access, desktop register states and hover states are still missing.

- [PPO-Service-Review-and-Reports-Workspace-r02.html](../../../reference/ui/service-review/PPO-Service-Review-and-Reports-Workspace-r02.html)

## Behaviour, handovers and verification

The draft User Guide `guide.sv.07` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
