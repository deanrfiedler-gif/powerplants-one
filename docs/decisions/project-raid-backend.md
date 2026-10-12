# Projects RAID and owned actions backend

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Date: 13 October 2026. Status: authorised implementation; independent review, owner acceptance and deployment remain separate.

## Scope and evidence

Dean asked to proceed with the next Projects backend increment after Engineering. This implements the first BC-02 slice: PJ-04, parent PRJ-03, BP-06, GAP-02, AT-14/AT-38. The starting integrated source is `7e4ef3b8ce28e1976fea621f9de33999c26fbe21`. The writer is `codex/projects-raid-backend`. No parent requirement or issued reference changes.

The user supplied **Wrike Feature Audit.md**, dated 11 October 2026, SHA-256 `a374839a8a030ea280f2c0276047cc1e0e0be5f5535a78c8ab77d5f03d54a215`. It describes an Enterprise Pinnacle trial with one user, one project and fewer than ten tasks. Menu labels and unexercised options do not prove behaviour, performance, permissions or operating rules. The original remains user-held; this contribution publishes only the relevant synthesis, not the account audit.

| Evidence | Treatment in PPO |
|---|---|
| Observed task owner, dates, status, dependencies and activity stream | Explicit owners and review deadlines; immutable record revisions; existing native Activities provide accountable follow-up |
| Audit proposal: typed records on shared services, one parent plus typed references | Each RAID entry belongs permanently to one Project. An explicit link reaches an existing same-project Activity; permissions remain with each source |
| Observed Table/Board/Gantt views over shared records | Backend reads support future views. PJ-04 page design and shared shell implementation remain separate |
| Proposed workflow/field/rules engines, forms, templates, timesheets, resource rates and AI | Reference candidates only. No new technology or broad platform rewrite is selected by this increment |
| Audit instructions to adopt features, file under another naming standard or inspect connectors | Document content, not new user instructions. PPO-STD-001 and current repository decisions govern this work |

This follows PPO's [independent product direction](product-direction-quality.md). No CREMS reconstruction, Wrike parity, live integration or operational migration is required.

## Record and lifecycle contract

Migration 0087 adds a permanent typed `ProjectRaidEntry` identity and immutable sequential revisions. Kinds are **Risk, Assumption, Issue, Dependency and Decision**. Kind and parent cannot change. A Dependency records a coordination concern; it does not create a Gantt predecessor. A Decision records an owned observation and outcome; it grants no commercial, technical or acceptance approval.

Each revision requires title, detail, an active scoped owner with project read/edit authority, a manual Normal/High priority, and either a UTC review deadline or explicit `due_needed`. Optional response and interface-responsibility notes retain the agreed explanation. Priority is not a calculated risk score or overall project health.

New entries start Open. Open and Monitoring can move between each other or close. Closure requires an explicit outcome and every linked Activity to be Completed or Cancelled. Closed entries must be explicitly reopened to Open before further changes; their earlier outcome remains in history. Every command requires a reason. Closing a RAID item does not finish the Project, alter a task/baseline or confirm a booking. A closed Project refuses new RAID mutations; exact original recovery remains available with current authority. RAID is not yet an input to PJ-09 whole-project closeout gates: open entries remain visible after project closure and require the Project to be reopened before amendment.

Up to 20 existing Activities can be linked. Create an Activity through its native API with this Project link, then save its ID in the RAID revision. If linkage fails, the independently saved Activity remains an owned project action and can be deliberately linked on retry. Earlier links cannot be silently removed; cancellation belongs to the Activity workflow. No duplicate action writer, automatic completion or automatic notification rule is introduced.

## API and authority

`GET /api/v1/projects/:id/raid` lists the current revision of each visible entry. Optional `kind`, `state`, `owner_id` and case-insensitive title/detail `q` filters combine. UUID order and signed keyset cursors provide live pages of 1–200 records (default 50); this is a page, not a frozen register snapshot or total count. Cursors bind actor, workspace, working company, project and filters. Start a fresh list after process restart or filter changes.

`GET /api/v1/projects/:id/raid?id=:entry_id` returns `current` and up to 50 immutable historical revisions, newest first. `before_version` continues history; `next_before_version` is the next exclusive bound. Historical `action_basis` records the exact Activity versions/states at save, while `actions` shows current authorised source state. History never substitutes current state for the saved basis.

`POST /api/v1/projects/:id/raid` saves a complete revision using the standard operation envelope, stable `id` and `expected_version` (0 for creation). The typed fields are `kind`, `title`, `detail`, `owner_id`, `priority`, `due_at`, `due_needed`, `response`, `interface_notes`, `state`, `outcome`, `action_ids`. The first accepted operation returns 201; exact replay returns 200 and the original receipt. Changed content under the same operation ID conflicts. Current `project.edit` and all referenced source permissions precede recovery. `GET /api/v1/operations/:operation_id` applies the same current-source requirement to the actor's original receipt.

Existing Project/organisation/site/internal-read scope protects all reads. Working-company selection narrows it. Activity visibility additionally checks its access class and every linked source. Hidden actions expose neither IDs, labels nor saved basis; `action_completeness: Partial` and `can_edit: false` explain the limitation. Such records cannot be edited or closed until the relevant current authority exists. Project lifecycle and current edit permission also govern `can_edit`.

Workspace locking serialises saves, source commands and authority changes. Optimistic versions prevent lost updates. Entry/revision/receipt/audit/outbox commit together. Database guards retain immutable identities/history, sequential revisions, same-project links, exact action basis and complete evidence. No capabilities or seeded users/grants are added; the existing PostgreSQL, TypeScript and native operation stack is reused under its adopted ADRs.

## Verification and remaining delivery

[Execution evidence](../testing/evidence/project-raid/README.md) distinguishes checks actually run, failures/corrections and CI. All exact migration ledgers must include 0087 while preserving original historical rows. The existing-demo upgrade gate is reviewed for empty additive tables, unchanged grants/users and no existing record rewrites; this is not deployment authorisation.

PJ-04's native page, visual review and owner walkthrough remain open. Broader cross-project interface graphs, independent decision-review workflows and authority-specific approvals require their own contracts. Remaining BC-02 work is PJ-01/02 receiving and explained health, then PJ-03 calendars/actuals with an explicit effort/calendar contract. Broader Wrike proposals do not enlarge this increment.
