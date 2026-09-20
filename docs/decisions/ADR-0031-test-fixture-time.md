# ADR-0031 — Time in test fixtures

**Revision:** r01
**Status:** Selected; database cliff implemented and pending CI verification; the 1 October browser-spec cliff is scheduled separately
**Date:** 20 September 2026
**Decision:** Dean chose "Fix the date cliff first" over merging #261 with the known failure, then instructed "Proceed however you believe is the most professional"
**Owner:** Dean Fiedler
**Source commit:** 99c32aed4e0e7f2e9ff8d4c1f25e9b0a4e22a3f1 (main, 20 September 2026)

> **This record differs from ADR-0030 and does not supersede it.** ADR-0030 landed on `main`
> through PR #262 while this work was in progress. It applied the same interim repair to
> `planner.test.ts:566` and then *proposed* option 3, a clock the tests control. That proposal is
> recorded there as **proposed, not accepted**, explicitly awaiting Dean because it binds test
> architecture. What is implemented here is ADR-0030's **option 2**. Dean should choose between
> them; see "Relationship to ADR-0030" below.

## Reason and decision

### The problem

Fixtures across the seeds and the test suites carry fixed near-future timestamps. The
application is correct to refuse past-dated work: the planner will only book or move
attendance that has not started (`src/scheduling/planner.ts`, "Only future, unstarted
attendance can be booked or moved"), and readiness evidence whose `valid_until` has
passed cannot clear a control (`src/service/work-orders.ts`, "Expired evidence cannot
clear a readiness control"). As real time advances past a fixture's date, the fixture
stops describing a legal situation and the test fails. Nothing about the change under
test is wrong; the fixture has simply expired.

This is no longer theoretical. `tests/database/planner.test.ts:566` fails today:

| Branch | Database tests | Pass | Fail | Failing test |
| --- | --- | --- | --- | --- |
| `main` @ `e6492a7` | 447 | 446 | 1 | `planner.test.ts:566` |
| PR #261 @ `1b2fd44` | 448 | 447 | 1 | `planner.test.ts:566` |

The failure is identical on both, and `main` has carried it for at least three
consecutive runs since 19 September 23:33 UTC.

### Why this blocks work now

Branch protection on `main` requires **seven** status checks, and
`P01–P11 and CRM I1–I2 local application and PostgreSQL proof` is one of them
(verified 20 September 2026 through the protection API: seven contexts,
`required_reviews: 0`, `strict: false`). A red Application assurance therefore blocks
merging. Earlier notes in this repository described it as non-required; that is wrong
and should not be relied on.

The remaining schedule, in UTC, from the P05 seed's ten `a8…` appointments dated
2026-09-21 to 2026-09-24:

| From | What starts failing |
| --- | --- |
| **2026-09-20** (now) | `planner.test.ts:566` |
| 2026-09-21 | tests expecting a successful confirm of `a8/1`–`a8/5`, database and HTTP planner suites |
| 2026-09-23 | `confirmed(9)` in `tests/helpers/packs.ts`, which most pack, field, offline, report and Finance database tests pass through |
| 2026-09-24 | `a8/10`, HTTP pack tests |
| 2026-10-01 | browser specs with their own hard-coded visit dates, in the **required** compiled browser suite |
| 2027-01-01 | seeded skills, grants and policies |

### Why the obvious fix does not work

Moving the literal forward buys one day and then stops working altogether. The failing
case needs evidence that is simultaneously still valid now and expiring before the
visit ends: the write rejects `valid_until <= now` (`src/service/work-orders.ts:754`)
while the booking is blocked only while `valid_until < end`
(`src/scheduling/planner.ts:395`). Appointment `a8/5` runs 2026-09-21T00:00Z–02:00Z, so
after **2026-09-21T02:00Z no literal satisfies both conditions at once**.

### What constrains a fix

Four findings from the current source, each verified rather than assumed:

- **Seeds run once and are not checksummed.** `scripts/database.ts` skips any seed whose
  version already appears in `ppo.seed_receipts`, and compares no content hash. Editing a
  seed file therefore changes freshly created databases only; the hosted demo and any
  long-lived local database keep the rows they already have. This is the real meaning of
  "seed bytes are immutable" — not a hash, but a propagation limit.
- **`now()` is a deterministic anchor.** In PostgreSQL `now()` returns the transaction
  start time, and `seed()` runs every seed file inside one transaction, so the same
  expression yields an identical instant in every statement of a seed run.
- **CI provisions a fresh database every run.** Both application workflows start a
  `postgres:16.15` service container and then run `db:migrate` and `db:seed`. A seed that
  emits dates relative to seed time is therefore permanently correct in CI.
- **The hosted upgrade path is guarded.** `scripts/demo-upgrade.ts` carries a per-release
  review gate (`if (latestMigrationVersion !== 28) throw …`) and a seed-history stage that
  rejects unknown receipts and missing baseline receipts. A seed-only change does not move
  `latestMigrationVersion`, but adding a new seed entry still touches that path and
  contradicts the release comments above the gate, which currently state that no seed
  change is introduced.

### Decision

Dean chose to fix the cliff before merging the open installation work, and on
reviewing this record said “Proceed however you believe is the most professional”
(20 September 2026). The approach below is what was implemented.

**Make the fixtures relative to the moment they are created, and leave production code
and the clock alone.**

1. **Seed dates become relative.** The time-sensitive timestamps in `db/seed-p05.sql`
   (and the smaller number in `seed-p04.sql` and `seed-p06.sql`) are expressed against a
   single seed-time anchor derived from `now()`, preserving today's *relative* spacing
   between `a8/1`–`a8/10` so that ordering, window and adjacency assertions keep their
   meaning. A fresh database then always seeds appointments into its own future.
2. **Time-sensitive test dates derive from the fixture under test.** Where a test needs a
   moment that straddles now and a visit — the `valid_until` cases in
   `tests/database/planner.test.ts`, the helpers in `tests/helpers/packs.ts` — it reads the
   appointment it is exercising and computes from its `end_at`, instead of naming a date.
3. **Browser specs that book their own visits move with the family, in this change.**
   An earlier revision of this record deferred them to a separate step before 1 October,
   on the reasoning that they do not fail until then. **That was wrong, and CI proved it.**
   They book into the gap *after* the seeded family, so moving the family alone closed that
   gap: the seeded appointments landed on 1 October, the crew was already committed, and
   `planner.spec.ts` and `field-technicians.spec.ts` failed with `ResourceConflict` —
   "SYN Alex Lead: unavailable during the visit or travel allowance" — in the **required**
   compiled browser suite. Shifting those specs by the same offset restores the authored
   gap exactly, and closes the 1 October cliff as a consequence rather than as a promise.
4. **Scope is limited to fixtures that are compared against the real clock.** Unit tests
   that pass a fixed "now" alongside fixed inputs and assert a fixed output are correct as
   they stand and are deliberately not touched. Of the 48 files containing future-dated
   literals, only the time-sensitive subset changes.

## What was built

The shift is applied as the seed runs, by rewriting the instant literals in the seed file
before it is executed rather than by editing the file or enumerating tables and columns.
That choice matters: one offset over the whole text moves every fixture together **by
construction**, so no column can be missed and no relationship can silently desynchronise.
The offset is whole days, so each fixture also keeps its time of day.

- `scripts/fixture-dates.ts` — the anchor, the offset and the rewrite. Pure functions, so
  they are unit-testable without a database.
- `scripts/database.ts` — the seed loop takes one instant for the run and rewrites the
  registered fixture seeds through it. Only seed version 5 is registered: P04's own
  appointment is deliberately authored in the past and is left there.
- `tests/helpers/fixture-time.ts` — reads the shift back from the seeded anchor
  appointment, so tests derive it from the database rather than recomputing it and drifting.
- The suites keep naming the instants they were authored with and read them through a
  local `t(...)`, captured after each reseed. The literals still document intent; only the
  frame moves. Deliberately uncached, because suites reseed between tests and a run
  crossing UTC midnight would otherwise carry a stale shift.

`tests/helpers/packs.ts` needed no change: it confirms the seeded appointment without
naming a date, so shifting the seed repaired the 23 September cliff on its own.

A newly created hosted demo database seeds through the same path and therefore gets dates
in its own future, which is an improvement. An existing demo is untouched, because its
seed receipts mean the seeds never run again.

## Relationship to ADR-0030

ADR-0030 lists this approach as option 2 and prefers option 3. Its argument is fair and worth
stating in its own words: the suites assert business refusals whose whole meaning is a comparison
against "now", so moving the data rather than the clock changes what the tests are proving, while a
controlled instant leaves each assertion exactly as written and reviewed.

Three of its objections to option 2, measured against what was actually built:

| ADR-0030's objection | What is true here |
| --- | --- |
| Seeded data becomes non-deterministic between runs | Correct. The offset is whole days from the seeding date, so it is fixed within a run and every interval between fixtures is invariant, but two databases seeded on different days hold different absolute instants. |
| It diverges the hosted demo from freshly seeded databases | The demo's behaviour is not changed: its seed receipts mean the seeds never run again, so it keeps exactly the rows it has. A newly created demo gets dates in its own future, which is better than today. The divergence is real but is between *old* and *new* databases, not a regression to the running demo. |
| Every absolute literal in the affected suites must move in the same change | **Correct, and the sharpest of the three.** Deferring the browser specs broke a required check on the first CI run, because a half-applied frame closes the gap the specs rely on. They are now in the same change. Any suite that books against the seeded family has to move with it; this is the standing cost of option 2. |

**The strongest argument for option 3, stated plainly:** it would also repair the October browser
cliff without touching those specs at all, because it keeps every authored literal valid. Option 2
cannot do that; it needs each suite brought to the anchor.

**The strongest argument for option 2:** it exists, it is provable, it changes no production path,
and it is reversible in one commit. Option 3 has not been started, and it must make `Date.now()`
and `clock_timestamp()` agree inside a single transaction or it will produce refusals no production
path can produce — by ADR-0030's own account.

**A fact that bears on the choice and was not available when ADR-0030 was written.** It lists as an
open question whether the required-check set includes the PostgreSQL proof, and reasons from the
assumption that it does not. Read live from the protection API on 20 September 2026, `main` requires
**seven** contexts and `P01–P11 and CRM I1–I2 local application and PostgreSQL proof` is one of
them. The cliff therefore blocks merging now, which shortens the time available for the larger
change.

This record does not settle that choice. If Dean adopts option 3, this change is reverted in one
commit and the interim repair in ADR-0030 stands until the clock lands.

## Alternatives and limits

**An injectable test clock** was considered and is not chosen. To work it must control
both Node's `Date.now()` and PostgreSQL's `now()`/`clock_timestamp()`, which means
threading a time source through production query paths or manipulating session state
around them. That reshapes business code to suit tests, for a problem that lives entirely
in the fixtures, and it risks the readiness and booking rules this repository treats as
the thing being proved. Relative fixtures leave every production path untouched.

**Bumping the literals** is rejected for the reason given above: one day, then impossible.

**Rebasing existing databases through an additive seed** is deliberately *deferred and
kept separate*. A new seed registered against an existing migration would run once on the
hosted demo and on a long-lived local database and bring their appointments forward. It is
not needed to unblock CI, because CI always builds a fresh database, and it would touch
the guarded hosted upgrade path for what is a demo-presentation benefit rather than a
correctness one. If the hosted demo's appointments matter, that is its own change with its
own review of `scripts/demo-upgrade.ts`.

**What this decision does not establish.** It does not change any booking, readiness,
scheduling or evidence rule, and no production file is expected to change. It does not
refresh the hosted demo or Dean's existing local database, which keep their current
seeded dates until they are reset. It does not claim the seeded synthetic data is
realistic, only that it is legally positioned relative to the moment it is created. It
does not remove every fixed date from the suites, only those that are compared against
the real clock.

**What remains after this change.** The 2027-01-01 long-validity literals, including
`valid_until` in `tests/helpers/isolated-field-http.ts`, are untouched and still armed.
The 1 October browser-spec cliff is closed here, not deferred.

**Verification limit.** The database suites refuse any database but `ppo_synthetic_test`,
and the local role `ppo_local` has neither `CREATEDB` nor superuser, with only
`ppo_synthetic` present. This change therefore **cannot be run locally at all** and can
only be proved by the Application assurance job, which takes about 1 hour 26 minutes per
run. The work should be staged to minimise round trips, and each run's result recorded
against the cliff table above rather than described as generally passing.

## Evidence and references

- Failing job on PR #261: run `35492085881`, `planner.test.ts:566`, 448 tests, 447 pass.
- Comparable failure on `main`: run `35485094061`, same test, 447 tests, 446 pass.
- Branch protection contexts, read 20 September 2026 from
  `repos/deanrfiedler-gif/powerplants-one/branches/main/protection`.
- Seed application and receipt guard: `scripts/database.ts`.
- Hosted upgrade gate and seed-history stage: `scripts/demo-upgrade.ts`.
- Constraint pair: `src/service/work-orders.ts` and `src/scheduling/planner.ts`.
