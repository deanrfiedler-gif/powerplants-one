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

Results are filled in on the pull request's `[DONE by Claude]` comment with the exact head SHA; this table records what was run locally.

| Check | Result and boundary |
| --- | --- |
| New database suite `tests/database/work-order-project-link.test.ts` | 9 passed: unlinked migration, link/unlink receipts, audit and outbox with exact replay, stale versions, different customer, closed project, started visit, cross-company, direct switch, both permissions, read isolation (no hidden count, no leaked project identity), create with a project, candidates. |
| New unit suite `tests/unit/project-field-work.test.ts` | 5 passed. |
| Migration ripple | Version lists, the Products upgrade starting points, the demo upgrade count and whole-schema snapshots were extended for 0122. Suites that need the document renderer fail locally with `RenderOrStorageFailure` (container Chrome is below the pinned renderer), so CI is the authority for them. |
| Browser `tests/browser/project-field-work.spec.ts` | See the pull request comment. |
| Deployment / owner approval | Not performed or granted by these checks. |

No exact mockup or HTML exists for the Field work card; captures, where taken, are implementation evidence only.
