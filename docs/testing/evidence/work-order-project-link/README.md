# B1 typed project link on work orders — verification

Owner: Dean Fiedler. Built by Claude for Dean under the standing order of 30 October 2026. Review: local implementation verification only; cross-model review, paired visual review and business acceptance are pending.

Scope: rule R1 of the project field work and milestone billing decision (`docs/decisions/project-delivery-billing.md`, proposed in [PR #751](https://github.com/deanrfiedler-gif/powerplants-one/pull/751)), increment B1, TS-01 finding F-02. Synthetic fixtures only. Contract: [Service API B1 amendment](../../../contracts/service-api.md#b1-typed-project-link-amendment--30-october-2026-implementation-in-review). Design register: [`/projects/[id]`](../../../design/development/pages/route-projects-id.md) and [`/service/work-orders/[id]`](../../../design/development/pages/route-service-work-orders-id.md).

## What was built

- Migration 0122: nullable `work_orders.project_id`, a foreign key to the project in the same workspace and company, a partial index, the `guard_project_link` trigger (same customer, Active project when linking, no direct switch between projects, no change once a visit has started) and two outbox kinds. Existing work orders stay unlinked; nothing is read from `project_reference`. No capability, grant, seed, user or identity change.
- Commands `POST /service/work-orders/:id/project-link` and `/project-unlink`, with reason, work-order and project expected versions, receipts, audit and outbox. Create accepts an optional `project_id` under the same rules.
- Reads: the project schedule read returns `field_work` filtered by the reader's own work-order read permission; `GET /projects/:id/field-work/candidates` lists linkable work orders; the work-order read returns `project` only to readers of that project.
- UI: the Field work card on `/projects/[id]` and the linked project link on `/service/work-orders/[id]`.

## Agent decisions under the standing order

These are Claude's choices, not Dean's acceptance; Dean can reverse any of them with a `[DEAN]` comment.

| Question | Choice | Reason |
| --- | --- | --- |
| Does linking advance the project version? | No; only the work-order version advances, and the command still checks the expected project version. | Each project version needs an exact schedule event (`check_project_schedule_evidence`); a link is not a schedule change, and advancing the version would turn open schedule edits into conflicts. |
| May a link move directly from one project to another? | No; unlink first, with its own reason. Enforced by the command and the database. | Keeps each change of project attributable to a reason in the audit trail. |
| May a closed project's field work be unlinked? | No (409 ClosedProject); reopen through Acceptance & closeout first. The database refuses only new links to a closed project. | Matches how closed projects refuse schedule changes; a closed project's record stays fixed. |
| Where do the commands live? | Under `/service/work-orders/:id/…`, recorded against the WorkOrder. | The work order is the record that changes; its receipt rule already applies. |
| Is Raise field work built here? | No. | B1 delivers the link; raising a request and work order from the project is a separate page flow. |

## Results

Local environment: Node 22.23.4 (the repository pins Node 24; `engine-strict` off), PostgreSQL 16.15 `ppo_synthetic_test`, Chrome 153 for browser specs without the renderer-version global setup. The pull request's `[DONE by Claude]` comment names the exact head SHA these results apply to.

| Check | Result and boundary |
| --- | --- |
| New database suite `tests/database/work-order-project-link.test.ts` | 9 passed: unlinked migration and untouched `project_reference`; link and unlink receipts, audit and outbox with exact replay; stale work-order and project versions; operation reuse with different content; different customer, closed project and started visit (command and database); cross-company and direct switch (command and database); both permissions; read isolation (no hidden count, no leaked project identity); create with a project; link candidates. |
| New unit suite `tests/unit/project-field-work.test.ts` | 5 passed, with the migration registry unit test (8 in total). |
| Affected database suites run locally | 22 files, 154 tests: 142 passed. All 12 failures were environmental and recur on unmodified `main`: `RenderOrStorageFailure` (renderer below the pinned patch), "The exact draft output is unavailable" (same renderer), and "permission denied to create role" (local role). Two ledger chains (`assistant-upgrade` 119/120) and the P05 work-order snapshot (`planner`) were corrected and then passed on rerun (42 of 42 with the new suite). |
| Migration ripple not run locally | The remaining extended version lists and snapshots (about 50 further files, many renderer-dependent). CI's eight database shards are the authority. |
| Browser `tests/browser/project-field-work.spec.ts` | 2 passed (1440×1000 desktop, 390×844 phone): link with reason, both records show the link, navigation both ways, unlink with reason, empty state, 44 px targets, no horizontal overflow of the card. |
| Existing browser specs on the changed page | `projects-gantt` and `project-baselines`: 8 passed; `project-programme`: passed. `work-orders.spec.ts`: 2 of 4 desktop cases (SC-05 and the saved-scope/visit case) fail locally on a fresh database; the same two fail on unmodified `main` in the same environment (first-request compilation without the warm-up project, which cannot complete here). CI runs them with warm-up. |
| Static | TypeScript, ESLint on changed files, Prettier on new files, foundation, naming, migrations, status sources, documentation unit tests, documentation scope, studio check, whitespace and conflict-marker scans passed. |
| Deployment / owner approval | Not performed or granted by these checks. |

## Captures

[Desktop linked](desktop-linked.png), [desktop link form](desktop-link-form.png), [phone linked](phone-linked.png) and [phone link form](phone-link-form.png), taken by the browser spec on synthetic data. They are implementation evidence, not visual acceptance. The first desktop run placed the card beside the schedule because the schedule page is a fixed flex layout; the card now sits inside the page below the schedule card, bounded to 30% of the viewport, with the shared Button styling restored over the Gantt's button reset. No exact mockup or HTML exists for the Field work card.
