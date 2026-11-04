# Findings and follow-up — design reference

Stable entry: `scope:SV-07`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/service/findings`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Extend existing owned remaining-work records into a consolidated unresolved-findings, recurrence and follow-up worklist.

1. Identify what remains unresolved and its evidence
2. Assign a next action and accountable owner
3. Close only when the required outcome is evidenced

## Desktop

Accepted design: the [Findings and follow-up design decision](../../../decisions/findings-figma-design.md) of 18 October 2026, with captures 01–04 (desktop 1440 × 900) and 05 (tablet 1024) in [design r01](../../../reference/ui/service/findings-design-r01/README.md). The native route now implements this design with the bounded differences and execution evidence below; this does not grant visual acceptance.

- **Place:** Findings sits in the Service review workspace. The side menu holds Service reports, a Findings group, a History group, and an Escalations group only once SV-08 exists; no new rail entry (D1).
- **Register:** the Work orders grid, one row per finding, identified by its source record with no new finding number (D3). Views: All open (default), Needs an owner, Due this week, Overdue, Waiting on review, Ready to close, Recurring and Closed findings. Columns: Source record, What remains, State, Owner, Due, Next action, Closes when, Source, Equipment and Site (D2). The toolbar has Search findings, Owner, Source, Site and the count with its read time.
- **Sources:** inspection defects and not-tested checks, incident corrective actions, remaining work from Partial or Unable-to-proceed completions, customer reservations, and scheduling follow-up (Q1).
- **Snapshot:** a row opens the large snapshot with What remains, What closes it and actions that open the owning record. Findings never close here; each closes in its own record (D4).
- **Next action (new feature, D5):** owner, due time, instruction and evidence needed, saved as one owned My Work activity; changing it updates the same activity and keeps the history. Coordinators and reviewers with service work-order edit access set it (Q2). Overdue means the due time has passed in site time, with no automatic escalation or customer message (Q4).
- **Recurrence (new feature, D6):** the same equipment and the same failed check or category within 90 days is flagged with the earlier occurrences and their correction (Q3). It never reopens or closes anything.
- **Remote diagnosis (D7):** outstanding for the SV-08 build. No dead control or Escalations link appears before the receiving route exists.
- **Shell:** the proposed Conversations action sits left of the information icon.
- The native page is built under Dean’s 31 October instruction; functional proof, visual comparison, owner acceptance and deployment are separate.

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

### Backend read dependency — 20 October 2026

The [SV-07 read contract](../../../contracts/service-findings.md) adds a native-source register and exact source reads through `/api/v1/service/findings`. It preserves each source's permissions, original identities, owned Activity links and closure rules. Completing a follow-up does not close an inspection, incident, incomplete report or customer reservation. Superseded observations remain distinct from source closure. See the [implementation decision](../../../decisions/service-findings-backend.md) and [execution evidence](../../../testing/evidence/service-findings/README.md).

Backend R2 adds `GET/POST /api/v1/service/findings/{source}:{source_id}/next-action`: one owned My Work Activity with instruction, required evidence, due instant and history. See the same contract for permission, freshness and terminal-state refusals. R2-adopted tasks use this source editor; existing native tasks retain My Work coordinator editing with source/owner authority checks. Native owner execution remains available. At the R2 checkpoint the accepted page, recurrence, SV-08 receiving and closed-history window were open; the native-page section below records the later implementation and remaining limitations. Existing visual-review fingerprints and owner/device acceptance are unchanged. The earlier design-only statements describe the retained design checkpoint, not the presence of these later APIs.

The draft User Guide `guide.sv.07` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## Native page and build decisions — 31 October 2026

The native route is `/service/findings`, in the Service review workspace. Reused components: SecondaryMenuFrame (shared workspace attribute), RegisterTable, Button, WorklistChoice, RecordTabs/RecordPanel, ReadState, Field/SelectField and LocalDateTimeField. Incoming sources are the five native types above; outgoing links open their own source and the same My Work activity. No new rail item or finding number is added. No migration, capability, grant or dependency is added.

The page exposes All open, Needs an owner, Due this week, Overdue, Waiting on review, Ready to close, Recurring and Closed findings. Ready to close displays the backend's follow-up-completed view, explicitly qualified as requiring the source reviewer; it asserts no additional source readiness. Closed findings has no 30-day cutoff. Counts, filter options and pagination remain the authorised candidate window. Missing/failed reads clear results and counts; uncertain saves retain the exact operation and fields; stale versions require an explicit comparison before using the current version.

### Desktop

At 1440 px the 240 px Service review side menu sits beside the flush ten-column shared register. At 1024 px it collapses to the shared overlay trigger. A selected row opens a large snapshot: remaining work and source closure on the left; next action, recurrence and history on the right. The source action and My Work handover remain visible. No bulk-assignment checkbox or unsupported settings/remote-diagnosis control is shown.

### Mobile

At 390 and 320 px show labelled finding rows with the site-local due date beside the title, a view selector, filters, explicit window/read-time copy and paging. The selected snapshot retains the full scheduled deadline with zone and offset; long source labels may ellipsise in the list but are complete in the snapshot. The selected finding is one scroll with the full title and source reference, remaining work, next action, closure, recurrence and activity history. Form inputs are 16 px; shared buttons and local-time fields remain keyboard/touch reachable. Source history stays in its owning record; next-action history is identified as such. Phone source buttons wrap instead of hiding a handover behind a new menu.

### Differences and open work

- D7 and the Escalations/Closed cases groups require SV-08 and are omitted. Bulk-assignment checkboxes, unsupported settings/sort controls and the proposed Conversations control are not added.
- Closed findings has no 30-day cutoff. Ready to close means the native follow-up is completed and still requires source review; it is not a new closure-prerequisite verdict. These choices are recorded in the design decision.
- Recurrence uses permitted failed observations with the same equipment and original procedure/check identity. Repeated attempts on the same open defect count. No stable fault-category key exists on the other source types; they say recurrence cannot be assessed. The panel lists observed facts and current source correction notes, without inferring a diagnosis or asserting that a prior correction failed.
- The current backend has no combined source-event timeline or per-prerequisite closure checklist. The snapshot shows the native remaining-work text, state/context and closure narrative, native activity history, and source links; illustrated source events and criterion rows are not fabricated.
- Native references, dates, owners and equipment details differ from the story fixtures. The shared register’s current row density, wider source references, horizontal ten-column scroll, window pagination and explicit candidate-window/read-time line differ from the captured grid.
- The next-action form uses the existing owner and site-time controls, stacked fields, the required native change reason and unsaved/uncertain-save guards. It does not reproduce the mockup’s unsaved-field counter. Shared fallback icons replace licensed artwork.
- The current shared phone header uses record position/navigation, with the full title and source reference in the scrolling record. Phone list dates include the year; the snapshot shows the full deadline with zone/offset. Search and all filters remain directly available, increasing toolbar height compared with the compact reference. At 320 px both source and My Work handovers remain visible rather than putting the source link in a menu.

These are implementation differences for review, not visual acceptance.

Functional proof, inspected visual comparison, owner acceptance and deployment remain separate. Application captures and executed results are recorded in the PR and the [execution ledger](../../../testing/evidence/service-findings/README.md#sv-07-native-page--31-october-2026). The retained accepted images above remain unchanged.
