---
document_id: PPO-PL01-DEC
title: PL-01 unassigned demand — read, planner region and the no-design-HTML departure
revision: r01
date: 2026-09-19
owner: Dean Fiedler
status: Read-only contribution delivered; scheduling from demand, cancellation re-entry and the Draft pipeline remain out of scope
source_commit: eb5940325317f29cbc557935fdf6550399e9e267
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

**Unassigned demand is an authorised work order with no appointment row.**

- `ppo.work_orders.status` is `CHECK(status IN ('Draft','Authorised'))`
- `ppo.appointments.work_order_id` is a foreign key to `ppo.work_orders`
- A **Draft work order is not demand.** It has no authorised scope: the table
  enforces `CHECK((status='Authorised')=(authorised_scope_revision_id IS NOT NULL))`,
  so a Draft order has nothing a planner could schedule against.

Nothing else counts as demand in this slice. The test is **row existence**, not
appointment status: any appointment row disqualifies a work order, whatever state
that appointment is in.

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

## Known limitation — what the appointment table prevents

**A cancelled visit does not return work to demand.** `ppo.appointments` has no
delete path: `immutable_evidence()` refuses `DELETE`, and cancellation sets
`status='Cancelled'` with `cancelled_at` and `cancellation_reason` rather than
removing the row. Because demand is defined by row existence, an authorised work
order whose only visit was cancelled **will not appear as unassigned demand**, even
though it is operationally unscheduled.

This is a real gap and is left open rather than papered over. Closing it means
deciding whether "no *live* appointment" replaces "no appointment row" in the
definition, which changes what the word demand means and is not a change to make
inside a read-only slice.

### Correction to the premise this work was scoped against

This contribution was scoped on the basis that `ppo.appointments.status` is
`CHECK(status='Proposed')` — a single value — and therefore that a completed visit
needing follow-up was not representable. **That is true of `0004-work-scope.sql` and
false of the current schema**, and it is recorded here so the register does not carry
the wrong fact:

| Migration | Constraint on `appointments.status` |
|---|---|
| `0004-work-scope.sql:177` | `CHECK(status='Proposed')` |
| `0005-planner.sql:21-22` | dropped; `ck_appointments_state CHECK(status IN ('Proposed','Confirmed','Cancelled'))` |
| `0007-online-field.sql:69-70` | re-added with `'InProgress'` |
| `0009-service-reports.sql:109-110` | re-added with `'CompletedPendingReview'` and `'Completed'` |

Nothing in `0010`–`0027` touches it, and the live `ppo_synthetic` catalogue confirms
the `0009` form is in force. A completed visit **is** representable: `0009` adds a
guarded machine for `InProgress → CompletedPendingReview → Completed` in
`ppo.protect_started_appointment()`.

The definition and the SQL are unaffected, because neither consults an appointment
status. What changes is the reasoning: the correct justification for ignoring
appointment status is that the settled definition is row existence — not that the
column has only one value. The cancellation gap above is the limitation that is
actually real, and under the `0004` constraint it could not have arisen at all.

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

The stock seed authorises three work orders (`90…0002`, `90…0008`, `a9…0001`) and all
three already have appointments, so **the region is legitimately empty against the
seed as it stands**. That is reported rather than engineered around; no seed file was
modified to populate it.

## Validation evidence

- `npm run lint` and `npm run typecheck` clean.
- `npm run test:unit`: 117 tests, 113 pass, 4 fail — the four known Windows-only
  failures (two `document-store.test.ts`, one `recovery.test.ts`, one
  `warm-routes.test.ts`), unrelated to this work.
- `tests/unit/demand-validation.test.ts`: unknown keys, malformed `site_id` and
  out-of-range `limit` all refused; query-string forms accepted.
- `tests/database/demand.test.ts`: returns authorised work orders with no
  appointment; excludes Draft; excludes authorised orders that have an appointment;
  proposing a visit removes the order from demand; refuses `Forbidden` without
  `schedule.read`; returns nothing across a company or workspace scope boundary and
  refuses a named out-of-scope site with `RecordUnavailable`.
- The database suite requires `ppo_synthetic_test`, which does not exist on the
  owner's workstation; it was run against a disposable `postgres:16.15` container
  matching the CI service definition. CI remains the acceptance record.
- Full database suite: 420 pass, 1 fail. The failure is
  `P12 real isolated restore …` in `tests/database/p12-recovery.test.ts`, which
  throws `ExactDocumentUnavailable` from `src/documents/store.ts` inside
  `reset()` before any test logic runs. It reproduces identically on clean
  `origin/main` at `eb59403` with none of this work applied, so it is a
  pre-existing Windows-only environment failure of the same kind as the four in
  the unit suite, not a consequence of this change.

## Remaining questions

1. Should a cancelled-only work order re-enter demand? That is a change to the
   definition, not to this read.
2. Should demand carry a readiness or blocker summary? `readiness` and `blockers`
   already exist in `src/service/work-orders.ts` and would reach through the same
   existing edge, but they are assessments rather than identification and are out of
   scope for a read-only list.
3. Should the region offer scheduling directly once a design for that interaction
   exists? Out of scope here by decision, not by limitation.
