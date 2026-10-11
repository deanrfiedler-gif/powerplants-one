# Project schedule baselines and forecast comparison

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Review: working implementation decision; business acceptance pending.

## Authority and traceability

Dean authorised the audit follow-up and first Projects baseline/forecast increment on 11 October 2026. This implements existing BP-01 PRJ-02, PRJ-04 and PRJ-07 within PJ-03 and BP-06 J2. It preserves the issued sources, parent IDs and Service booking authority. The accompanying [gap register](../delivery/crm-projects-audit-gaps.md) distinguishes account observations, existing scope and proposals.

## Bounded rule and architecture

Use the existing PostgreSQL transaction, Projects service, React Gantt host and operation receipt protocol. An additive immutable baseline table stores a server-generated schedule snapshot, numbered separately from the mutable project forecast. This preserves existing task/project versions, material consequence bindings and schedule history. Alternatives considered: overwriting task dates loses the baseline; copying whole project records duplicates identities and sensitive owner details; introducing a scheduling engine adds unagreed calendar/resource semantics.

Only the current coordinator with current project edit/read and linked-context authority may record a baseline. All current project readers may compare it. Recording requires the exact observed project version and latest baseline revision, a label, reason and explicit review acknowledgement. The schedule must contain at least one task and all tasks must be dated. Known dependency/weekend warnings remain visible and require human review; recording does not certify feasibility, commercial approval or customer acceptance.

The SQL snapshot includes task IDs, versions, names, phases, status/progress, milestone flags, dates and dependency links. Notes and historical owner identities are excluded. The responsible coordinator, time, reason and original operation are retained; comparison uses currently visible task owners. Baselines cannot be edited or deleted. A later baseline is a new revision; earlier revisions remain selectable in paged history.

Calendar contract **PPO-PJ-CALENDAR-01** freezes the existing date-only semantics: finish-to-start starts no earlier than the next Monday–Friday date; start-to-start starts no earlier than its predecessor start. No holidays, lag, duration calculation or automatic date movement is implied. Variance is explicitly measured in **calendar days**. This is a synthetic implementation rule, not a verified operational calendar. Critical path, configurable calendars, signed lag and resource optimisation remain open.

Forecasts continue through the existing task command with version checks, reason, actor and retained schedule events. Comparison identifies date/dependency changes, new or unscheduled tasks, milestone slippage and transitive successors requiring review. Impact is a review set, not a predicted delay or critical path. No appointments, reservations, commercial approvals or original baseline bytes are changed by a forecast edit.

## Interfaces and acceptance

- IF-PJ-BASELINE-01: GET/POST `/api/v1/projects/:id/baselines`; consistent current schedule, paged baseline metadata and selected snapshot; current authority before reads and command replay.
- AC-PJ-BASELINE-01: exact snapshot and immutable earlier revisions survive forecast changes, restart and repeated migration/seeding.
- AC-PJ-BASELINE-02: stale project/baseline versions, empty/undated schedules and unauthorised actors cannot create a baseline; unchanged retries return the original receipt once.
- AC-PJ-BASELINE-03: calendar-day comparison handles early/late/unchanged/unscheduled/new items and branching dependencies without moving dates.
- AC-PJ-BASELINE-04: desktop/mobile users can inspect warnings, record a reviewed baseline, compare revisions and recover an uncertain submission; current denial removes cached content.

Migration 0081 is additive; 0078–0080 are reserved by concurrent access-administration work. The hosted-upgrade version gate may advance only after preservation checks: no seed, grant, identity dispatch or existing record changes. Deployment and operational approval remain separate.

The subsequently integrated [ADR-0053](ADR-0053-figma-page-design.md) adopts Figma for new page designs. This bounded refinement reuses an existing Gantt, native dialog and catalogue controls under its rule 6; no Figma design is relied on or marked accepted. The new comparison and phone correction remain visibly pending owner/paired review.
