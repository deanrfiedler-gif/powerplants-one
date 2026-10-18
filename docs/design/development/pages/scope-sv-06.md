# Service review and controlled report workspace — design reference

Stable entry: `scope:SV-06`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/service/reports`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Integrate the fuller Service Review & Reports workspace over the existing review/report routes and commands.

1. Review the exact technician submission
2. Resolve unclear evidence and separate follow-up work
3. Issue the controlled report through the permitted review workflow

## Desktop

Accepted design: the [Service review design decision](../../../decisions/service-review-figma-design.md) of 18 October 2026, with captures 01–02 (desktop 1440 × 900) and 07 (tablet 1024) in [design r01](../../../reference/ui/service/service-review-design-r01/README.md).

- **Register:** the Work orders grid, with queues in the side menu (D1): All reports and My reviews; Review: To review, Returned to technician and Ready to issue; After issue: Awaiting response, Response not accepted and Remaining work open. Row checkboxes carry Open in sequence and Export list (D2).
- **Columns:** Report, Visit, State, Outcome, Attention, Technician, Attendance, Customer, Site, Customer response, Remaining work, Work order, Revision and Updated. States are Tags in words; the outcome is the technician's declared Complete, Partial or Unable to proceed.
- **Snapshot:** a row opens the large snapshot (D3), with Open report and Review submission.
- **Window:** the register keeps the built recent window of 200 reports and says so in the count line (Q1). The Remaining work open queue stands in for a cross-report SV-07 worklist (Q2).
- Nothing new is built.

Accepted design: the [Service review design decision](../../../decisions/service-review-figma-design.md) of 18 October 2026, with captures 03–06 in [design r01](../../../reference/ui/service/service-review-design-r01/README.md).

- **Layout:** the shared record layout (D4). The header carries a state Tag, Open work order and the state's primary action. A "Before issue" readiness bar lists entries approved, outcome declared, remaining work owned, site contact, customer report and customer response. The details column holds Summary; Customer, site and equipment; and Work order and request.
- **Tabs:** Evidence, Work outcome, Customer report, Customer response and History.
- **Review submission:** edits in the Evidence tab with a save bar (D5). Each entry is Approved or Returned with its review reason; the Review decision, Authority disposition and internal remarks follow. Nobody changes the technician's facts.
- **Customer report:** the prepared HTML with its SHA-256, the recipient chosen at review, and a preview of exactly what the customer sees. Issuing fixes those bytes; nothing is sent.
- **Customer response:** bound to the exact issued report, with the owned remaining action, the proposed (not booked) return visit, Finance readiness and the next customer update.
- Nothing new is built.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 08, 09 and 12 in [design r01](../../../reference/ui/service/service-review-design-r01/README.md). List rows with the visit and attendance date, report reference and customer with a state Tag, then the attention line and the declared outcome. Service review is reached from More (D6). Five states: loading, no matches with removable filter chips, could not load, view only, and a response refused because a newer report was issued.

Accepted design: captures 10–12 in [design r01](../../../reference/ui/service/service-review-design-r01/README.md). Status first, then view tabs, the submission panel and the entries, with Open work order and Review submission pinned. Record customer response is a full-screen sheet. The view-only and response-refused states are in image 12.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

Accepted Figma design: [Service review design r01 captures](../../../reference/ui/service/service-review-design-r01/README.md) (twelve icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/service-review-figma-design.md). Images of the Work outcome and History tabs, the report after issue, a correction cycle, the photo inspection view, the Finance handoff and the tablet record are still missing.

- [PPO-Service-Review-and-Reports-Workspace-r02.html](../../../reference/ui/service-review/PPO-Service-Review-and-Reports-Workspace-r02.html)

## Behaviour, handovers and verification

The draft User Guide `guide.sv.06` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
