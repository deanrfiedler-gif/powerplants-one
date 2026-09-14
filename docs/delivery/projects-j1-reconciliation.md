---
document_id: PPO-012-J1-RECONCILE
revision: r01
date: 2026-09-14
owner: Dean Fiedler - prototype owner
status: Current implementation reconciled; bounded coordination contract prepared
source_commit: 3a27728c2c41e366a4863683fac748cd0d1da910
---

# J1 coordination after the accepted Gantt

Audit task 9 begins from the existing `src/projects` service, Project/ProjectTask model, migration 0019 and [approved Gantt integration](../decisions/projects-gantt-integration.md). [BP-06](../blueprints/BP-06-projects-commercial-delivery.md) and its [original J1 starter](projects-first-increment-starter.md) predate that accepted schedule-first change. The current request authorises audit follow-through; old starter invocation text does not create another permission gate.

| J1 capability | Current repository evidence | Next bounded change |
|---|---|---|
| Project identity and register | `ppo.projects`, permanent PRJ allocator, scoped register/search/detail, fixed company/customer/Site/coordinator | Extend these exact identities; retain original creation receipts and context |
| Manual schedule/milestones | `ppo.project_tasks`, date-only forecasts, optional owners, progress and FS/SS warnings; immutable saved schedule events | Keep this approved Gantt behavior. These editable forecast items do not establish controlled completion, technical acceptance or project closure |
| Shared owned follow-up | Existing shared Activity service has owner, due, terminal outcome, mixed-target authority and original receipts; Project target/link is absent | Add one typed Project target with real foreign keys and all-target checks, then plan/designate existing shared Activities. Do not copy Gantt tasks into Activities |
| Stage and health | Project has no coordination stage/health/update projection | Add BP-06 manual Intake/Planning/Delivery/Handover and NotAssessed/OnTrack/Attention/Blocked with commentary and explicit coordination authority |
| Blocker accountability | Gantt AtRisk/note and optional task owner are schedule information | Attention/Blocked assessments require an open, owned, permitted Project-linked Activity with a due instant or due-needed. Later Activity completion leaves the assessment and shows follow-up needed |
| Portfolio and history | Register is scoped and paged; schedule version/history and receipt recovery exist | Show manual assessment/source time and next permitted Activity; append immutable coordination events without altering prior schedule snapshots |
| Controlled milestone lifecycle | Proposed J1 Completed/Cancelled immutable milestone records are absent; approved Gantt milestones remain editable | Design an explicit controlled milestone record/link before implementing terminal evidence. Never reinterpret an existing Gantt Complete value as that approval |

## Receiving contract for the next code PR

Use the existing Project UUID, company/customer/Site/coordinator, PRJ reference and project version. A new opt-in coordination command should initialise the first owned shared Activity and manual assessment atomically for an existing project; a new combined create journey should perform the same graph in one accepted operation. Do not backfill an Activity, blocker, health or consent into old projects. Existing create/Gantt commands retain their original namespaces, hashes and returned receipts.

Current coordinator identity and explicit scoped coordination authority govern health/stage changes. Existing `project.edit` schedule behavior remains as adopted; adding coordination must not silently broaden that capability or the new sales owner's rights. Activity completion/reassignment still follows its own owner/version/capabilities. A Project link never grants access to another target, its owner or its content.

For every link read, list, search, history and receipt: require current Project and current customer/Site visibility plus every other Activity target. Resolve any shared visibility dependency through a reusable predicate rather than importing the Project service into Activity commands recursively. A hidden linked Project makes the mixed-link Activity unavailable. Captured historical labels remain protected by current access.

Serialise Project version, Activity versions and current authority during acceptance. A competing completion can either commit before designation and cause a conflict, or commit afterwards and make the current projection show next action needed. Neither ordering may auto-create another Activity, clear Blocked, change Gantt dates or confirm a Service booking. Health commentary and accepted update history remain exact after action completion.

Use a single forward migration after checking the integrated E2 registry; 0016 remains reserved. Add typed Project links without relaxing existing target constraints, and retain all prior schedule rows/events/receipts and every old migration byte. Keep original Project context fixed. No new customer, generic task engine, import, money, technical release, customer output or project closure belongs in this slice.

## Required proof

Prove create/initialise atomicity at every final-write point; exact identical and competing command outcomes; same-key conflict; both Activity-completion/designation orders; hidden Project and mixed-target revocations on every read/recovery path; former or revoked coordinator refusal; independent Activity ownership; retained old Gantt snapshots; unchanged old creation/task receipts through upgrade and repeat seed. Desktop and phone must show long health commentary, genuinely owned blockers, clear missing follow-up, stale comparison and accepted-response-loss recovery. Preserve original graphs and both history types across actual application/PostgreSQL restart.

This reconciliation completes the audit of J1 against the live code. It is a ready receiving contract for coordination implementation, not a J1 or PA-01–PA-20 pass. The E2 stack and its migration/permission changes should be integrated and verified before allocating the next cross-domain migration. Complete controlled milestone acceptance remains a separately specified part of J1.
