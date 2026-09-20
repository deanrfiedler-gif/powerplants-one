---
document_id: PPO-ADR-0030
revision: r02
date: 2026-09-20
owner: Dean Fiedler
status: accepted
---

# ADR-0030 — Time dependence in synthetic test fixtures

## Status

**Accepted.** Dean selected the fixed offset with a runway test on 20 September 2026, after
r01 proposed a test-controlled clock and the investigation below showed that option would have
to change business date gating to work. r01's recommendation is superseded; its context and
evidence stand.

## Related requirements and controls

| Reference | Relationship |
|---|---|
| ADR-0010 | P05 planner controlled changes; the affected suite proves its readiness gates |
| ADR-0009 | P04 work scope and readiness; `valid_until` is a readiness control field |
| ADR-0022 | Maintained browser runtime; the required compiled browser suite is a later cliff |
| NFR-01 | Server-enforced authority; the gates in question are business refusals, not display |

## Context and constraints

The synthetic fixtures carry absolute dates. `db/seed-p05.sql` dated appointments
`a8…01`–`a8…10` between 2026-09-21 and 2026-09-30 UTC, and test files add their own absolute
literals. Those dates were future when written on 2026-09-05. They stopped being future, so
suites began failing on wall-clock time rather than on any change under test.

The first failure was `tests/database/planner.test.ts`, which asserts that readiness evidence
lapsing before a visit ends still blocks a booking. Two gates bound the value it passes:

- `src/service/work-orders.ts:754` refuses a passing assessment whose `valid_until` is already
  past, so the value must be **after now**;
- `src/scheduling/planner.ts:395` blocks the booking only while `valid_until` is before the visit
  end, so the value must be **before the visit end**.

Those two bounds close against each other as the clock runs, so no literal could repair it.

This was never confined to one test. `src/scheduling/planner.ts:270` refuses to book or move
attendance that has already started, so assertions expecting a successful confirm of
`a8…01`–`a8…05` fail once those appointments are past. `tests/helpers/packs.ts` routes most pack,
field, offline, report and Finance database tests through `confirmed(9)`. Browser specs that
create visits with hard-coded dates run in the **required** compiled browser suite.

## Options considered

1. **Move every future fixture date forward by one fixed offset, and add a test that fails while
   there is still time to act. Selected.** A mechanical transform, fully deterministic, confined
   to fixtures and tests. It expires again, which is the objection to it; the runway test answers
   that objection by converting a silent outage into a scheduled job.
2. **Rebase fixture dates relative to the seeding moment.** Appointments always a week out, with
   test literals derived from the same anchor. Never expires and demo data always looks current.
   Rejected for now: it makes seeded data differ between runs, and every test asserting a
   displayed date has to derive it from the anchor too. Worth revisiting if the fixtures are ever
   reused for a demo that is reseeded.
3. **Inject a clock the tests control. Rejected on evidence.** Attractive in the abstract, and
   r01 recommended it. It does not survive contact with this schema. `reviewed_at` and
   `source_as_at` are written with `DEFAULT clock_timestamp()` *and* compared against
   `clock_timestamp()` in gating (`src/scheduling/planner.ts:518`). Pinning "now" to the past
   therefore puts every row a test creates into that gate's future and produces refusals no
   production path can produce. Honouring one instant everywhere means routing roughly 44 gating
   comparisons, 72 audit writes and 149 column defaults through a new clock — editing the
   predicates that generate customer-visible refusals to fix a test-data problem.
4. **Accept the failures and merge past them. Rejected.** The de facto position before this ADR,
   and it already cost the audit recorded below.

## Decision

Shift every fixture date that is **still in the future** forward by **261 weeks (1827 days)**, and
add `tests/unit/fixture-expiry.test.ts`, which fails once the earliest seeded appointment is
within 90 days and names the command that fixes it.

`scripts/shift_fixture_dates.py` performs the transform and is kept so the next maintenance event
is one reviewed command. Four properties of it matter:

- **Only future dates move.** A fixture deliberately in the past — expired evidence, a visit that
  has already started, a superseded policy — stays, so every past-to-future relation the suites
  rely on is preserved.
- **Whole weeks.** Weekday is preserved. `tests/helpers/my-work.ts` pairs a hard-coded `"Tuesday"`
  label with its date, and the My Work views render weekday names, so a whole-year offset would
  have been wrong. Month alignment is not preserved and does not need to be: there is no month,
  quarter or financial-year logic in the application.
- **`tests/unit` is excluded.** Those tests inject the instant they judge against, so they never
  expire. Some also assert calendar semantics — `tests/unit/projects-gantt.test.ts` checks that
  2028-02-29 exists — which an offset across leap years would silently destroy.
- **`db/migrations` is never touched,** and neither is `tests/helpers/projects.ts`, which a unit
  test hard-codes values from. Migration bytes are checksummed against applied databases.

## Consequences and reversal

The fixtures now run to 2031. The runway test fails from roughly June 2031, about 90 days before
anything breaks, with the command in its message. Re-running the script with a new offset is the
whole maintenance action.

Reversal is `git revert`. Nothing in the application changed: no business code, no schema, no
migration, no permission, no document and no interface.

The hosted demo is unaffected and also not repaired. `scripts/database.ts` records applied seeds
in `ppo.seed_receipts` by version and skips any version already present, so an already-seeded
demo keeps its original dates and will show appointments in the past. That is a separate problem
from test stability and is not addressed here.

## Validation evidence and remaining questions

Run locally: `scripts/shift_fixture_dates.py` in report mode and reviewed before applying; the
runway test, proved in both directions; `npm run test:unit` — 128 of 132 pass, the four failures
being the pre-existing Windows-only filesystem cases present on unmodified `main`; `eslint`;
`tsc --noEmit`; `check_foundation.py`; `check_naming.py`.

**Not run locally:** the database, HTTP and browser suites, which need `ppo_synthetic_test` and a
document renderer. The transform touches 259 literals in 40 files across those suites and is
proved only by CI.

An audit on 2026-09-20 of eighteen failed workflow runs attached to merged pull requests found
nine were this defect and nothing else — Application assurance runs 1042–1048, 1051 and 1052 —
every failure timestamped after 2026-09-20T00:00Z even where the run began on 09-19. Eight were
stale runs on superseded commits whose branch head was green before merge. One, run 658, was a
real scroll-spy defect fixed by `0ad41c68` in the same pull request.

Those merges were possible because `main` requires six checks and **Application assurance is not
one of them**. Pull requests #255–#259 merged with it red. Separately, #257 merged with no
Application assurance result at all: it never ran on head `0ad41c68` or on the merge commit.

Open question for Dean: whether the required-check set should include the PostgreSQL proof, so
this class of failure blocks a merge rather than being merged past. Not changed here.
