---
document_id: PPO-012-GANTT-DEC
revision: r01
date: 2026-09-10
status: Authorised bounded integration; verification and publication tracked in handover
owner: Dean Fiedler - prototype owner
---

# Approved Projects Gantt integration

Dean approved the final r10 Gantt and instructed: “Lets lock it in and integrate it into the Powerplants One app.” This invokes the manual schedule integration described here. The approved source is `ppo-projects-gantt-content-r10.html`, SHA-256 `632be521b4ec968db30d9a9f1cdaa1cf585c53044a1bc9e1557be4ed5d515599`. The attachment and its embedded fonts/example content are not republished with this code. The app uses its existing brand assets and Roboto font.

The integration starts at `6e2951e49f41e2b980da6885357230ef310f8198` on [shared-shell PR #84](https://github.com/deanrfiedler-gif/powerplants-one/pull/84). That branch depends on [CRM PR #75](https://github.com/deanrfiedler-gif/powerplants-one/pull/75) and [combined-app PR #73](https://github.com/deanrfiedler-gif/powerplants-one/pull/73). Preserve that order; this change does not merge the unrelated login/design branches. Fresh repository metadata identifies the repository as public; older private-repository descriptions are historical. Only synthetic source fixtures and bounded implementation documentation are included.

## Bounded implementation choice

The existing Projects package is design-only. The latest invocation brings forward a schedule-first slice of PPO-012. It supersedes the earlier J1 starter's proposed timing and exclusion of a Gantt for this slice. P01–P12 keep their existing sequence and acceptance state. It does not claim completion of J1, J2, PA-01–PA-20, or the full Projects blueprint.

- Add typed Project, ProjectTask and ProjectScheduleEvent records, with permanent PRJ references and current company/site/customer permissions. Reuse the current database, identity, command, receipt and audit patterns. No dependency or framework is added.
- A coordinator creates a project against a current existing customer/site relationship and an eligible internal coordinator. Project context and optional target remain fixed in this increment.
- ProjectTask represents a manually scheduled task or forecast milestone, with phase, date-only plans, progress, note, optional internal/existing external owner and FS/SS predecessors. It is distinct from the shared Activity follow-up master. No Activity is copied or silently relinked.
- These forecast milestones are editable versioned schedule items. They are not the controlled, terminal ProjectMilestone completion/approval workflow proposed in BP-06. Each accepted version remains in immutable schedule evidence.
- Planning/Procurement/Delivery/Handover are schedule grouping phases, not a project lifecycle state machine. Tasks do not decide project health, engineering release, commercial acceptance or closure.
- FS warns when a successor starts before the next Mon–Fri day after predecessor finish; SS warns when it starts before predecessor start. Weekend dates may be retained. Dependencies never auto-reschedule, and no holiday calendar or resource reservation is implied.
- Owner assignment does not send a message, invite a contact, grant access or create a shared customer record. External owners must have a current permitted customer affiliation. Unavailable external identity details are masked, and the editor requires an explicit replacement/clear decision.

Migration `0018-projects-gantt.sql` was chosen after checking the base and concurrent Assistant/facility branches. `0016` remains reserved for Assistant; `0017` remains CRM. All applied migration and prior seed bytes are preserved. The new seed grants only explicit synthetic coordinator scopes and creates no project. Demo tester reconciliation includes the three bounded project capabilities; this change does not run reconciliation or change an existing hosted tester.

## Approved interaction contract

The existing shell owns the navigation, search, help and account controls. `/projects` supplies a permitted project register and creation route; `/projects/[id]` supplies the internal Gantt container, breadcrumbs and change history.

The main divider clips/reveals the sheet at unchanged column widths. Task name, Owner, Start, Finish and percentage have independent bounded handles. Header/body borders and each handle's stroke share the same end pixel. Keyboard resizing, cancel/reset, separate sheet/timeline horizontal rails, one vertical row flow, sticky headings and per-view widths remain. Geometry-only preferences are scoped to workspace/actor/project; no task data is stored there.

The `+ Task` button retains 15px horizontal padding and minimum 86px width. Gantt/List segments have equal widths. Fit/Week/Month/Today work with saved dates across years and the current site timezone; zoomed-out headings group into quarters/years for legibility. Compact displays use the same scrollable List view; desktop remains the approved Gantt target.

## Remaining integration boundary

The [handover](../delivery/projects-gantt-integration.md) records actual checks and publication. Hosted image update and schema application, existing-project import, configurable phases/calendars, baselines, automatic rescheduling, project lifecycle/health editing, Activities linkage and cross-module commercial/technical handovers remain separate work. There is no operational Smartsheet, MYOB, SharePoint or customer-system mutation.
