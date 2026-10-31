# M1 maintenance intervals, prepared work orders and follow-on requests — verification

Owner: Dean Fiedler. Built by Claude for Dean under the standing order of 30 October 2026. Review: local implementation verification only; cross-model review, paired visual review and business acceptance are pending.

Scope: increment M1 of PPO-MAINTENANCE-TS02-DEC ([`docs/decisions/maintenance-service-ts02-decisions.md`](../../../decisions/maintenance-service-ts02-decisions.md), merged to main in [PR #754](https://github.com/deanrfiedler-gif/powerplants-one/pull/754) on 30 October 2026): rules M-R1 (six-monthly and yearly intervals), M-R2 (Prepare also creates the work order with the plan's tasks) and M-R4 (follow-on work from a Partial occurrence). TS-02 findings F-12, F2-01 and F2-05. Synthetic fixtures only. Contracts: [maintenance and warranty](../../../contracts/maintenance-warranty-api.md#recurrence-and-service-receiving) and the [Service API M1 amendment](../../../contracts/service-api.md#m1-maintenance-prepared-work-order-amendment--30-october-2026-implementation-in-review). Design register: [`/maintenance/due/[id]`](../../../design/development/pages/route-maintenance-due-id.md) and [`/service/work-orders/[id]`](../../../design/development/pages/route-service-work-orders-id.md).

## What was built

- M-R1: plan intervals Monthly, Quarterly, SixMonthly and Yearly (1, 3, 6 and 12 months from the anchor, month-end safe). The 1–12 month generation window, the agreement-term check on every generated date and the one-obligation-per-original-due key are unchanged. No schema change: the interval is validated plan content.
- M-R2: `prepare-work` on a maintenance occurrence creates the Ticket, a Draft work order receiving it and the receiving request in one operation with one receipt, audit event and outbox job. The work order is created through the work order create rules (`authoriseCreateWorkOrder`, `insertWorkOrder`) and its first draft scope through the draft-scope rules (`startDraftScope`, the same `writeScope` checks): one scope item per plan task with exact description, kind, expected outcome and completion requirement, the occurrence's asset on each item, and coverage from the Covered assessment. Preparing maintenance work now also needs `service.work_order.edit`, checked before any receipt. The work order read returns `planned_tasks`, and the scope form warns before saving a task description that differs from the plan wording.
- M-R4: `POST /maintenance/due/{id}/prepare-follow-on` for a Partial occurrence: a current Covered assessment for the same original due date, the outstanding tasks of the latest Partial result only, a Ticket and Draft work order as in M-R2, and a request linked to the result it follows. The occurrence stays Partial; results are then received on the follow-on, and a follow-on result with every task Complete completes the occurrence.
- Migration 0123: `maintenance_work_requests.work_order_id` and `follow_on_result_id` (nullable, with foreign keys), one request per prepared work order, one follow-on per result, the one-original-request index narrowed to non-follow-on requests, and an insert guard (the work order receives the request's exact ticket; a follow-on follows a Partial result of the same occurrence; no follow-on while any request of the occurrence awaits its result). Existing requests keep their bytes with both columns null. No capability, grant, seed, user, identity or outbox kind.
- UI: interval choices; Prepare follow-on Service request on a Partial occurrence; Prepare owned Service request only on Open or Deferred occurrences and only with work order edit; "Open work order {reference}" links; follow-on requests labelled; the plan-wording warning on the work order scope form.

## Agent decisions under the standing order

These are Claude's choices where the decision record is silent, not Dean's acceptance; Dean can reverse any of them with a `[DEAN]` comment.

| Question | Choice | Reason and reversal |
| --- | --- | --- |
| Who is the prepared work order's service owner? | The owner named on the Prepare command (the request's triage owner). | No new command field, so earlier Prepare receipts keep their payload hash. Reverse by adding an optional `service_owner_id`. |
| Which coverage charging route does the prepared scope use? | ContractReference, with the agreement reference and source revision. | It is the existing route for coverage that cites an exact agreement; M-R3 (M2) decides Finance dispositions separately. Reverse by changing one constant. |
| Which scope fields are prefilled? | Summary, tasks, asset bindings and coverage. Exclusions, Finance route (`pending_account_plan`), authority evidence, diagnostic limit and shutdown conditions stay blank. | They are reviewed statements a person must make; the authorisation blockers name them. |
| Do warranty remedy requests also create a work order? | No; only maintenance occurrences (M-R2 names maintenance plans). | Smallest change; warranty keeps today's Ticket-only request. |
| Is the work order's own command history written? | No separate CreateWorkOrder or SaveScopeDraft audit event; the occurrence's WorkRequested or FollowOnRequested event records the work order. | The audit table allows one event per operation, and M-R2 requires one operation with one receipt. |
| Which tasks are outstanding? | The latest received result's request tasks whose mapped outcome is not Complete. | Follows the request chain exactly; the follow-on keeps the plan task identities, so receiving maps them unchanged. |
| What does "one open follow-on" mean? | No follow-on while any request of the occurrence has no received result; one follow-on per Partial result. Enforced in the command and the database. | Matches "open" to the receiving lifecycle the occurrence already uses. |
| Can the original request still be received once a follow-on exists? | No; results are received on the follow-on. | Otherwise a later original result could reopen a second follow-on while one is open. |
| Should the work order page block an edited task description? | No; it warns before saving. | M-R2 asks for a warning; receiving still refuses the unmatched task. |
| How does the late-0051 upgrade proof treat 0123? | The reconstruction stops at 0122, and the runner then installs 0051 and 0123 in order. | 0123 alters 0051's own tables, so no real history can hold 0123 without 0051. |
| Is the decision record linked? | Named with its path and PR #754, not as a relative link. | Historical: when written, the record was not on this branch's base. It now is (#754 merged and taken in through the base), and the scope line above links it. |

## Current status (31 October 2026, head 340ddf2)

This section is current; the Results table below is the original 30 October run at c272e29 and is kept as history.

- **Reviews:** Codex found five P2 findings, all fixed with re-reviews: long completion requirements, surrogate pairs, restricted work-order IDs in history, and plan-wording multiplicity. Migration 0123 had a bounded source review with no defects.
- **Local runs since then, with the renderer working through an uncommitted local allowance:**
  - maintenance-m1, maintenance-service and maintenance DB suites: 21/21. These cover the renderer-dependent follow-on, history hiding, Unicode and race cases.
  - M-R4 and long-requirement cases: 4 of 4 runs.
  - maintenance-m1 browser spec, desktop and phone: 2/2.
  - The populated upgrade below.
- **Test helper:** 64934c2 fixed intermittent follow-on failures in `serviceResult`, which paired tasks by list position.
- **Coverage limit kept:** the history filter delegates to `visibleWorkOrder`. No independent DB case covers an asset added to the work order's scope after preparation.
- **Not shown here:** CI on the current head, business acceptance and deployment.

## Results

Local environment: Node 22.23.4 (the repository pins Node 24; `engine-strict` off), a private PostgreSQL 16 cluster on port 5433 with its own `ppo_synthetic_test` and `ppo_synthetic` databases (so no other worktree's database was touched), Chrome for Testing 153.0.8010.12. The pinned renderer requires 153.0.8010.36 or later, so for the local run only the reviewed-version list in `src/platform/browser.ts` was widened to the local patch and restored before commit; nothing in the commit changes it. The pull request's `[DONE by Claude]` comment names the exact head SHA these results apply to.

| Check | Result and boundary |
| --- | --- |
| New database suite `tests/database/maintenance-m1.test.ts` | 5 passed: six-monthly month-end dates, overlapping and concurrent generation keeping one obligation per date, the 12-month window; yearly dates, a run refused when a date falls after the agreement term (nothing created), a changed interval needing a reviewed successor; Prepare creating the Ticket, Draft work order and request with exactly the plan's two tasks, kinds, asset bindings and coverage, with one receipt, audit event and outbox job; exact and concurrent replay, refusal of a fresh operation and of reused operation identity, refusal without `service.work_order.edit` or from another workspace with nothing written; follow-on refused before a Partial result, with an assessment for another date, with an Unknown or superseded assessment and for an observer; follow-on carrying only the outstanding task, linked to the Partial result, occurrence still Partial, exact replay, second follow-on refused by the command and by the database guard, original request, result and report unchanged, original request no longer receivable, completed follow-on completing the occurrence, refusal after completion and without work order authority. |
| Existing maintenance suites | `maintenance.test.ts` 10 passed, `maintenance-service.test.ts` 4 passed (assertions that Prepare created no work order now assert exactly one Draft work order), `maintenance-upgrade.test.ts` 1 passed (late 0051 reconstruction stops at 0122). |
| Unit suites | `tests/unit/maintenance.test.ts` 4 passed, including the new interval case (leap-year Yearly anchor, six-monthly anchor after a short February, window bound, effective date). All unit suites, after restoring `src/platform/browser.ts`: 1285 of 1285 passed. |
| Migration ripple and affected database suites | All 77 affected database files were run locally, one at a time: the 68 files whose migration version lists and ledgers moved to 0123, `tests/demo/upgrade.test.ts` (added-migration count 106), `maintenance-upgrade`, the three other maintenance suites, `work-orders`, `work-order-register`, `work-order-project-link` and `equipment`: 747 tests, 0 failures in the final runs. Two suites first failed only on local database privileges and passed once the private cluster's role was given them: `policy-persistence` ("permission denied to create role"; 11 of 11 after CREATEROLE) and `tests/demo/upgrade.test.ts` ("permission denied to set role"; 7 of 7 after SUPERUSER on the disposable cluster). `products-upgrade` includes the new 0122 starting point that installs reserved 0052 and then 0123 (53 passed). |
| Browser `tests/browser/maintenance-m1.spec.ts` | 2 passed (1440×1000 desktop, 390×844 phone), run without the warm-up project because warm-up timed out on this container while database suites shared it: plan generated two six-monthly dates and the successor form offers Monthly, Quarterly, Six Monthly and Yearly; an Open occurrence offers Prepare and no follow-on; Prepare through the form creates the Draft work order and the record links it; a Requested occurrence offers neither action; the work order carries both plan tasks; changing task 1's wording shows the warning, and restoring it removes the warning; no horizontal overflow. |
| Existing browser specs | `maintenance.spec.ts`: 8 of 8 (desktop and phone); one phone case first failed with a server connection reset while database suites shared the container and passed on rerun. `work-orders.spec.ts`: SC-05 and the creation/retry case passed on desktop; its two other cases cannot run under this private-port harness, because they assert the configured web server command is `npm run dev` and use the default local origin. They are left to CI. |
| Static | TypeScript, ESLint on changed files, foundation, prototype, naming, migrations, status sources, documentation unit tests, studio check, whitespace and conflict-marker scans passed. |
| Deployment / owner approval | Not performed or granted by these checks. |

## Populated 0122 to 0123 upgrade (31 October 2026, local)

Codex review 5720375545 asked for a populated upgrade, not only a reconstructed history. The population used the 0122 application: `claude/work-order-project-link` at f267622, with migrations to 0122. It ran a one-off script with that checkout's own maintenance and warranty commands and test helpers:

- a due maintenance occurrence, prepared under 0122 (Ticket only) and received with a reviewed Complete Service result;
- a warranty remedy request, received with a reviewed Partial result.

The M1 runner at head 64934c2 then applied 0123 to that database and was run a second time. Each snapshot hashes whole rows as JSON. The request rows exclude only the two new columns, so the before and after hashes are comparable.

```
before (migrations=120,121,122)
requests=eeba6dd960c7b4af01928ec772499eb2 n=2
results=75d115e6a39cecadc386a87987a8e003 n=2
reports=1254a1b50fdad5b59697d230a4fc4cfe n=2
occurrences=6f3a0739bde6f7805adbba993fd78f3e n=1
events=d89758ef3b597be82f904e25c66453d6 n=17
after  (migrations=120,121,122,123)
requests=eeba6dd960c7b4af01928ec772499eb2 n=2
results=75d115e6a39cecadc386a87987a8e003 n=2
reports=1254a1b50fdad5b59697d230a4fc4cfe n=2
occurrences=6f3a0739bde6f7805adbba993fd78f3e n=1
events=d89758ef3b597be82f904e25c66453d6 n=17
```

- **Rows unchanged:** requests, results, report revisions, occurrences and maintenance events are byte-identical before and after. A repeat `migrate` changed nothing.
- **New columns:** `work_order_id` and `follow_on_result_id` were absent before and are null on both existing requests after.
- **Objects installed:** all four new constraints, both indexes (`maintenance_request_one_work_order` and the narrowed `occurrence_one_original_request`) and the `guard_request_links` trigger exist over the populated history.
- **Boundaries:** this is a local execution proof on one synthetic population, not a committed test. Document rendering used an uncommitted local allowance for this container's Chrome patch, as described above. It is not CI evidence.

## Captures

[Desktop prepared occurrence](desktop-due-prepared.png), [phone prepared occurrence](phone-due-prepared.png), [desktop work order warning](desktop-work-order-warning.png) and [phone work order warning](phone-work-order-warning.png), taken by the browser spec on synthetic data. They are implementation evidence, not visual acceptance. No exact mockup or HTML exists for these additions.
