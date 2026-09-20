---
document_id: PPO-ADR-0030
revision: r01
date: 2026-09-20
owner: Dean Fiedler
status: proposed
---

# ADR-0030 — Time dependence in synthetic test fixtures

## Status

**Proposed.** The interim change described under "What this revision changes" is applied. The
structural direction in "Decision" is a proposed design and is not yet accepted, implemented or
proved. It is recorded here because the choice between the options binds test architecture and
touches business date gating.

## Related requirements and controls

| Reference | Relationship |
|---|---|
| ADR-0010 | P05 planner controlled changes; the affected suite proves its readiness gates |
| ADR-0009 | P04 work scope and readiness; `valid_until` is a readiness control field |
| ADR-0022 | Maintained browser runtime; the required compiled browser suite is a later cliff |
| NFR-01 | Server-enforced authority; the gates in question are business refusals, not display |

## Context and constraints

The synthetic fixtures carry absolute dates. `db/seed-p05.sql` dates appointments
`a8…01`–`a8…10` between 2026-09-21 and 2026-09-30 UTC, and test files add their own absolute
literals. Those dates were future when written on 2026-09-05. They are no longer future, so
suites began failing on wall-clock time rather than on any change under test.

The first failure is `tests/database/planner.test.ts`, which asserts that readiness evidence
lapsing before a visit ends still blocks a booking. Two gates bound the value it passes:

- `src/service/work-orders.ts:754` refuses a passing assessment whose `valid_until` is already
  past, so the value must be **after now**;
- `src/scheduling/planner.ts:395` blocks the booking only while `valid_until` is before the visit
  end, so the value must be **before 2026-09-21T02:00Z**, the end of appointment `a8…05`.

Those two bounds close against each other as the clock runs. After 2026-09-21T02:00Z no literal
satisfies both, so the assertion cannot be repaired by choosing a new date.

This is not confined to one test. `src/scheduling/planner.ts:270` refuses to book or move
attendance that has already started, so assertions that expect a successful confirm of
`a8…01`–`a8…05` fail once those appointments are past. `tests/helpers/packs.ts` routes most pack,
field, offline, report and Finance database tests through `confirmed(9)`. Browser specs that
create visits with hard-coded dates run in the **required** compiled browser suite, so pull
requests become unmergeable once those dates pass.

Two constraints shape the options. Seed bytes are effectively immutable in effect rather than by
checksum: `scripts/database.ts` records applied seeds in `ppo.seed_receipts` by version and skips
any version already present, so editing a seed file changes freshly reset test databases but not
the already-seeded hosted demo. And the clock is read from two places — JavaScript `Date.now()`
in roughly 39 call sites, and SQL `clock_timestamp()` in business gating, not only in audit
defaults. `src/scheduling/planner.ts:228` and `:518` and `src/service/work-orders.ts:170` and
`:354` all gate policy effectivity, skill evidence and site party validity in SQL.

## Options considered

1. **Move the literals forward periodically. Rejected as the standing answer.** It is mechanical
   and reviewable, but it reintroduces the same failure on a timer and gives no signal about when
   the next cliff arrives. It remains available as a deliberate stopgap.
2. **Rebase fixture dates relative to the seeding moment.** An additive post-seed step shifts the
   P05 window by a whole number of days so appointments are always ahead of "now", with test
   literals derived from the same anchor. This leaves business code untouched, which is its main
   attraction. It makes seeded data non-deterministic between runs, diverges the hosted demo
   (whose receipt already exists) from freshly seeded databases, and requires every absolute
   literal in the affected suites to move to the anchor in the same change.
3. **Inject a clock the tests control.** A single controlled instant, honoured by both
   JavaScript and SQL, keeps every existing fixture literal valid exactly as authored and keeps
   seeded data deterministic. It is the larger change: it must cover `Date.now()` and
   `clock_timestamp()` together, because freezing only the JavaScript side would leave the two
   clocks disagreeing inside a single transaction and could produce refusals that no production
   path can produce.
4. **Accept the failures and merge past them. Rejected.** This is the current de facto position
   and it already cost the audit below. It also stops working in October, when the cliff reaches
   a required check.

## Decision

Proposed: adopt option 3, a clock the tests control, honoured in both JavaScript and SQL, and
keep the fixtures absolute. The suites assert business refusals whose whole meaning is a
comparison against "now"; making the data move instead of the clock changes what the tests are
proving, while a controlled instant leaves each assertion exactly as written and reviewed.

This is recorded as proposed rather than accepted because it touches date gating that produces
customer-visible refusals, and because it cannot be proved without running the database suites.

## What this revision changes

Only `tests/database/planner.test.ts`. The assessment that must lapse before the visit ends now
derives `valid_until` from the appointment it is about, instead of the literal `2026-09-20`. The
literal was the only explicit near-future `valid_until` in the suite; every other call uses the
far-future default. Deriving it states the intent the assertion depends on and removes a magic
value, but it does **not** remove the time dependence: the derived value is still only valid while
the appointment is in the future. It restores the suite now; it does not survive the cliff.

## Consequences and reversal

Until the structural direction is decided and implemented, database and HTTP suites continue to
fail progressively on wall-clock time: assertions expecting successful confirms of `a8…01`–`a8…05`
from 2026-09-21, `confirmed(9)` and everything routed through it from 2026-09-23, and browser
specs in the required compiled suite from October. Any such failure should be confirmed against an
unmodified `main` before it is attributed to the change in hand.

The interim change is reversible in one edit. Neither option 2 nor option 3 has been started, so
no migration or compatibility effect exists yet.

## Validation evidence and remaining questions

Not validated locally: the database suites require `ppo_synthetic_test`, which this environment
does not have. The interim change is offered to CI for proof and is not claimed to pass until a
run reports it.

An audit on 2026-09-20 of eighteen failed workflow runs attached to merged pull requests found
nine were this defect and nothing else — Application assurance runs 1042–1048, 1051 and 1052,
each failing the single test above, every failure timestamped after 2026-09-20T00:00Z even where
the run began on 09-19. Eight were stale runs on superseded commits whose branch head was green
before merge. One, run 658, was a real scroll-spy defect fixed by `0ad41c68` in the same pull
request.

Those merges were possible because `main` requires six checks and **Application assurance is not
one of them**. Pull requests #255–#259 merged with it red. Separately, #257 merged with no
Application assurance result at all: it never ran on head `0ad41c68` or on the merge commit.

Open questions for Dean: whether the required-check set should include the PostgreSQL proof, so
this class of failure blocks a merge rather than being merged past; and whether option 2 is
preferred after all, on the grounds that it leaves business date gating untouched.
