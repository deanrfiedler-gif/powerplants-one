---
document_id: PPO-PL01-DEC
title: PL-01 unassigned demand — read, planner region and the no-design-HTML departure
revision: r02
date: 2026-09-19
owner: Dean Fiedler
status: Read-only contribution delivered; r02 corrects the disqualifying test so a cancelled visit returns work to demand. Scheduling from demand, follow-up after a completed visit and the Draft pipeline remain out of scope
source_commit: 810c8b0fd3a3397df2f63d7f2ba9a8721ff51675
---

# PL-01 — Unassigned demand

## Context and constraints

PL-01 is *"Service planner and unassigned demand"* in the module page register
([PPO-HTML-Page-Coverage-Audit-r04](../reference/ui/module-page-register/PPO-HTML-Page-Coverage-Audit-r04.md)
line 542). Half of it already exists and has since P05: `src/scheduling/planner.ts`
is 1,565 lines across 13 operations, `/api/v1/schedule` serves `readSchedule`, and
`src/components/planner-screens.tsx` renders the day/week board at `/schedule`.

The other half did not exist. Before this contribution nothing in `src/` referred to
unassigned, unscheduled or demand. A planner could see every visit that had been
booked and nothing about authorised work that had not been.

Constraints carried into the work:

- **No new cross-domain import.** [PPO-STD-002](../standards/PPO-STD-002-repository-structure.md)
  records 122 cross-domain imports across 34 ordered domain pairs on `main`, and
  names `scheduling` specifically: imported by `documents`, `field`, `finance` and
  `reports`, importing `activities` and `service`, with the instruction that work
  extending scheduling *"should read through existing paths rather than adding new
  cross-domain edges."*
- **No migration, no table change, no `CHECK` change, no new capability.**
- `planner.ts` is not modified.

## Definition

**Unassigned demand is an authorised work order with no live appointment.**

- `ppo.work_orders.status` is `CHECK(status IN ('Draft','Authorised'))`
- `ppo.appointments.work_order_id` is a foreign key to `ppo.work_orders`
- A **Draft work order is not demand.** It has no authorised scope: the table
  enforces `CHECK((status='Authorised')=(authorised_scope_revision_id IS NOT NULL))`,
  so a Draft order has nothing a planner could schedule against.
- A **Cancelled appointment is not a live one.** The row survives, because
  appointments are append-only evidence, but the visit it recorded is not going to
  happen. The work order is unscheduled, and unscheduled authorised work is demand.

Nothing else counts as demand in this slice. The disqualifying test is a **live
appointment** — `NOT EXISTS(… AND a.status<>'Cancelled')` — and no other
appointment state is consulted. r01 tested **row existence** alone and was wrong
to; see *Correction — r01 hid work whose only visit was cancelled* below.

## Decision

1. **A new read, `readUnassignedDemand`, in `src/scheduling/demand.ts`.** It mirrors
   `readSchedule`: the same validation helpers, `requireCapability(c, p, "schedule.read")`,
   the same site scoping through `visible`/`hasPermission` and `scopeSql`, and the same
   `REPEATABLE READ` isolation inside `transaction`. Denial throws the same
   `unavailable()` shape, so nothing distinguishes *not permitted* from *not found*.
2. **`schedule.read` and no new capability.** Row scope stacks
   `scopeSql(w.company_id, w.site_id, "schedule.read")`, `orderVisibility("w")` —
   which carries `service.work_order.read`, site, customer and ticket visibility —
   and `visibility("Site", "site")`, exactly as `scheduleSummaries` does.
3. **No date range.** Demand is not time-bounded. Inputs are an optional `site_id`
   and an optional `limit`, bounded 1–200 with a default of 50; out-of-range is
   `422 InvalidData`. The `BookingBlocked` refusal `readSchedule` uses does not apply
   because there is no period to exceed.
4. **Truncation is reported, never hidden.** The query reads one row beyond the
   bound; when more exist the envelope's `completeness` is `Partial`. A truncated
   list is never described as complete.
5. **`orderVisibility` is reached through the existing `scheduling → service` edge.**
   `planner.ts` already imports it from `../service/work-orders`. No new domain pair.

### PL-01 has no design HTML, deliberately

Every recent module package in this repository ships a design HTML under
`docs/reference/ui/` with maintained sources under `docs/design/`, built before the
application work. **PL-01 does not, and this is a deliberate departure.**

The planner screen and the scheduling engine already exist and are in use. A design
of `/schedule` would be a drawing of a screen that is already built, reviewed against
a rendering rather than against the engine that actually enforces authority. The
useful constraints here are the ones in `planner.ts` and in the schema — which
capability gates the read, what `orderVisibility` already excludes, what the
appointment table will and will not represent — and none of them are discoverable
from a mock.

This is recorded as a departure rather than a precedent. It applies where the screen
and its engine already exist. A new screen still gets a design first.

## Correction — r01 hid work whose only visit was cancelled

r01 defined demand as **row existence**: any appointment row disqualified a work
order, whatever state that appointment was in. That was wrong. **r02 changes the
disqualifying test to a live appointment**, and nothing else.

`ppo.appointments` has no delete path. `immutable_evidence()` refuses `DELETE`
(*"Accepted evidence is append-only"*), and cancellation sets `status='Cancelled'`
with `cancelled_at` and `cancellation_reason` rather than removing the row. Under
row existence, an authorised work order whose **only** visit had been cancelled
never appeared as unassigned demand, even though it was operationally unscheduled
— the case a planner most needs to see. The predicate now reads:

```sql
AND NOT EXISTS(SELECT 1 FROM ppo.appointments a
               WHERE a.workspace_id=w.workspace_id AND a.work_order_id=w.id
                 AND a.status<>'Cancelled')
```

The scoping, visibility, ordering and bound are unchanged from r01.

### The lifecycle r01 was scoped against was never the live one

r01 was scoped on the basis that `ppo.appointments.status` is
`CHECK(status='Proposed')` — a single value — and that a completed visit needing
follow-up was therefore unrepresentable. **That limitation was recorded from a
misreading of the base migration rather than of the current schema.**
`CHECK(status='Proposed')` is the original `0004` definition and has not been in
force since `0005`. Four later migrations widen the column, and the last
constraint added for it is the one that applies:

| Migration | Constraint on `appointments.status` |
|---|---|
| `0004-work-scope.sql` | `CHECK(status='Proposed')` — the original definition, superseded |
| `0005-planner.sql:21-22` | dropped; `ck_appointments_state CHECK(status IN ('Proposed','Confirmed','Cancelled'))` |
| `0007-online-field.sql:69-70` | dropped and re-added with `'InProgress'` |
| `0009-service-reports.sql:109-110` | dropped and re-added with `'CompletedPendingReview'` and `'Completed'` |

The lifecycle actually in force is **`Proposed`, `Confirmed`, `InProgress`,
`CompletedPendingReview`, `Completed`, `Cancelled`**, built up across `0004`,
`0005`, `0007` and `0009`. Nothing in `0010`–`0027` touches it, and the live
`ppo_synthetic` catalogue confirms the `0009` form.

The same misreading of `0004` carried two neighbouring facts that are also stale:
`0006-job-packs.sql:12-13` widens `pack_requirement` to include
`'AwaitingAcknowledgement'` and `'Acknowledged'`, and `0006:204` **drops** the
always-true `CHECK(dispatch_hold)` in favour of an evidence-backed trigger
(`ppo.guard_pack_dispatch()`).

`Cancelled` has been reachable since `0005`, so the gap r02 closes has existed for
every migration since. It stayed invisible only because the definition never
consulted the column.

### Open question — follow-up after a completed visit

A work order whose visit is `Completed` or `CompletedPendingReview` may still need
follow-up, and that follow-up would also be demand. **This is unresolved and is
deliberately not addressed here.**

Follow-up is not a state on the appointment. Nothing in the schema distinguishes
*completed and finished* from *completed and needs more work*, so "completed,
therefore needs more work" is not derivable from `appointments.status`. Widening
the read to treat completed visits as demand would surface every finished work
order — a worse answer than the gap. Closing this properly means deciding where
follow-up is recorded, which is a change to the model rather than to this read.

## This contribution is read-only

The demand region **lists** unassigned demand. It does not create appointments, does
not accept a drag onto the calendar, and mutates nothing. The only control in the
region is a link to the work order, where `proposeVisit` already lives. No new
command, route or receipt is introduced.

The region sits **outside** the `{data && (…)}` block that gates the appointment
board, so the two reads fail independently. That placement is load-bearing: inside
that block, a failed schedule read would render as *"no unassigned demand"* — a false
negative that reads as reassurance. Its error state says so explicitly: *"A failed
read does not mean every authorised work order is scheduled."*

## Options considered

| Option | Why not |
|---|---|
| Extend `listWorkOrders` in `src/service/work-orders.ts` | Closest existing read, but gated on `service.work_order.read` rather than `schedule.read`, has no notion of "no appointment", and is cursor-paginated. Extending it would push a scheduling concept into the service domain and change that read's capability contract |
| Return demand inside `readSchedule`'s envelope | Would tie a list that is not time-bounded to a mandatory `from`/`to`/`timezone`, and couple two unrelated collections to one failure |
| A `demand` view or an index migration | Unnecessary: `ix_work_orders_scope` and `ix_appointments_order` already cover the predicates, and the constraint forbids a migration |

## Consequences and reversal

Additive. Two new source files (`src/scheduling/demand.ts` and its route), one
component region, two test files and this record. No schema change, no seed change,
no capability change, no change to `planner.ts`. Reversal is deleting the files and
the region; nothing else depends on them.

**r02 changes one predicate, this record, and the tests that cover them.** No
migration, no `CHECK`, no capability, no route, no UI region and no change to
`planner.ts`. Reversal is restoring the `AND a.status<>'Cancelled'` clause to its
r01 form.

The stock seed authorises three work orders (`90…0002`, `90…0008`, `a9…0001`) and all
three still hold a live appointment under the r02 predicate — `a9…0001` already
carries three `Cancelled` appointments alongside its live ones, so it is excluded by
those, not by the cancelled rows. **The region is therefore legitimately empty against
the seed under r02 as it was under r01.** That is reported rather than engineered
around; no seed file was modified to populate it.

## Validation evidence

Recorded for r02. The r01 evidence it replaces is in the history of this file.

- `npm run lint` and `npm run typecheck` clean.
- `python3 scripts/check_foundation.py` and `python3 scripts/check_naming.py` both
  `passed` with no errors (3,499 local links checked; 309 document records).
- `npm run test:unit`: 117 tests, 113 pass, 4 fail — the four known Windows-only
  failures (two `document-store.test.ts`, one `recovery.test.ts`, one
  `warm-routes.test.ts`), unrelated to this work and unchanged by it.
- `tests/database/demand.test.ts`: 5 tests, all pass. The new one is
  *"a work order whose only appointment was cancelled is unassigned demand again"*:
  it authorises an order, proposes a visit, confirms the order leaves demand,
  cancels that visit through `cancelAppointment`, asserts the row survives as
  `Cancelled`, and asserts the order is demand again. A second proposed visit
  takes it back out, so cancellation is not a one-way door.
- **The new test fails against the r01 predicate.** Restoring
  `NOT EXISTS(… AND a.work_order_id=w.id)` and re-running gives 4 pass, 1 fail,
  with only the cancellation test failing. The fix is what makes it pass.
- Two r01 assertions that encoded row existence were corrected: the booked-work
  query in the first database test now excludes `Cancelled`, and the rationale
  comment in the `proposeVisit` test no longer claims no status value is consulted.
- Full database suite: **439 tests, 435 pass, 4 fail.** None is an assertion
  failure and none is in scheduling:
  - Three `P10` tests in `tests/database/finance-boundaries.test.ts` fail as a
    cascade from one 120s test timeout; the two after it throw Postgres `57014`
    *"canceling statement due to statement timeout"* out of `reset()` in the
    `beforeEach` hook, before any test logic runs. **Run alone, that file is 28
    tests, 28 pass, 0 fail with this change applied**, so the three are a
    contention artefact of the long sequential run, not a defect.
  - `P12 real isolated restore …` in `tests/database/p12-recovery.test.ts` throws
    `ExactDocumentUnavailable` from `src/documents/store.ts:19` inside `reset()`
    before any test logic runs. This is the same pre-existing Windows-only failure
    r01 recorded, with the same stack.
- The database suite requires `ppo_synthetic_test`, which still does not exist on
  the owner's workstation and which the `ppo_local` role cannot create
  (`rolcreatedb` is false). It was run against a disposable `postgres:16.15`
  container on port 5433, matching the CI service definition. CI remains the
  acceptance record.

### Proved against data, not only against the code

The local `ppo_synthetic` database seeds three authorised work orders, each with a
live appointment, so `/api/v1/schedule/demand` is empty at rest. Work order
`90…0002` has exactly one appointment, `98…0002`, seeded `Proposed`. Cancelling
just that one:

```sql
UPDATE ppo.appointments
   SET status='Cancelled', cancelled_at=clock_timestamp(),
       cancellation_reason='SYN PL-01 cancelled-visit demand proof',
       pack_requirement='CancellationReviewRequired', customer_commitment='Changed',
       dispatch_hold=true, version=version+1, updated_at=clock_timestamp()
 WHERE id='98000000-0000-4000-8000-000000000002';
```

`GET /api/v1/schedule/demand` then returned `SYN-PPO-WO-000002` as a single
`UnassignedDemand` item with `completeness: "Complete"` — work that r01 did not
show. Both predicates evaluated over the same rows isolate the defect to that one
work order:

| Work order | r01 `NOT EXISTS(any row)` | r02 `NOT EXISTS(… status<>'Cancelled')` |
|---|---|---|
| `SYN-PPO-WO-000002` (only visit cancelled) | `false` | **`true`** |
| `SYN-PPO-WO-000008` (live `Proposed`) | `false` | `false` |
| `SYN-PPO-WO-000010` (19 visits, 3 `Cancelled`, rest live) | `false` | `false` |

**The fixture could not be reverted by SQL, which is itself the point.**
`UPDATE` is refused by `ppo.guard_appointment_change()` — *"Appointment
history/context/state is controlled"*, because it raises whenever
`OLD.status='Cancelled'` — and `DELETE` by `immutable_evidence()` — *"Accepted
evidence is append-only"*. A cancelled appointment is permanent, so row existence
could never have released the work order. It was removed with
`PPO_ALLOW_RESET=dispose-synthetic PPO_RESET_DATABASE=ppo_synthetic npm run db:reset`,
after which `98…0002` is `Proposed` at `version` 1 with null `cancelled_at`, and
the demand read is empty again.

The live catalogue was checked directly rather than inferred from the migrations:
`ck_appointments_state` is
`CHECK (status = ANY (ARRAY['Proposed','Confirmed','InProgress','CompletedPendingReview','Completed','Cancelled']))`,
`appointments_pack_requirement_check` carries `'AwaitingAcknowledgement'` and
`'Acknowledged'`, and no `CHECK` constraint mentioning `dispatch_hold` remains.

## Remaining questions

1. Does follow-up after a `Completed` or `CompletedPendingReview` visit count as
   demand? **Open** — see *Open question — follow-up after a completed visit*. It
   needs somewhere to record that follow-up is owed, not a wider predicate here.
   (r01's question — whether a cancelled-only work order re-enters demand — is
   answered by r02: it does.)
2. Should demand carry a readiness or blocker summary? `readiness` and `blockers`
   already exist in `src/service/work-orders.ts` and would reach through the same
   existing edge, but they are assessments rather than identification and are out of
   scope for a read-only list.
3. Should the region offer scheduling directly once a design for that interaction
   exists? Out of scope here by decision, not by limitation.
