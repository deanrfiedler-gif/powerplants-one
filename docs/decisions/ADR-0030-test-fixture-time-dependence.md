---
document_id: PPO-ADR-0030
revision: r03
date: 2026-09-20
owner: Dean Fiedler
status: proposed
---

# ADR-0030 — Time dependence in synthetic test fixtures

## Status

**Proposed. No code change ships with this revision.** r01 proposed a test-controlled clock and
r02 recorded Dean's selection of a fixed offset. The offset was implemented, put through CI, and
**disproved** — the evidence is below. This revision records the constraints each attempt
uncovered so the next implementation is designed against them rather than discovering them again.

The only change that has shipped is #262, which repaired the single test that had already fallen
over. That remains correct and is independent of everything here.

## Related requirements and controls

| Reference | Relationship |
|---|---|
| ADR-0010 | P05 planner controlled changes; the affected suite proves its readiness gates |
| ADR-0009 | P04 work scope and readiness; `valid_until` is a readiness control field |
| ADR-0022 | Maintained browser runtime; the compiled browser suite is a required check |
| NFR-01 | Server-enforced authority; the gates in question are business refusals, not display |

## The problem

The P01–P12 fixtures carry absolute dates, written on 2026-09-05 when they were future. They
stopped being future, so suites fail on wall-clock time rather than on the change under test.
`src/scheduling/planner.ts:270` refuses attendance that has already started;
`src/service/work-orders.ts:754` refuses evidence whose `valid_until` is past;
`tests/helpers/packs.ts` routes most pack, field, offline, report and Finance database tests
through `confirmed(9)`.

## Constraints, each established by evidence

These are the facts any solution has to satisfy. Three of the five were discovered only by
building something and watching it fail.

1. **Resource availability is weekday-bound.** `ppo.calendar_intervals` carries a `weekday`
   column against a "SYN weekday 08:00–17:00 Brisbane" calendar. Moving an appointment to a
   different weekday moves it outside its crew's working window. **Any shift must be a whole
   number of weeks.**
2. **The planner is anchored to real "now".** It requests the current Brisbane day and week, and
   steps by period with no URL parameter, so a test cannot jump to a distant week. Three tests
   read seeded appointments from that default view: `tests/browser/planner.spec.ts:152`,
   `tests/browser/quality-states.spec.ts:64` and `tests/demo/ui.spec.ts:57`. **Seeded
   appointments must be inside the current view.**
3. **Constraints 1 and 2 conflict under absolute dates.** A whole-week shift cannot keep
   appointments both always-future (constraint 1's weekday alignment fixes which days they land
   on) and inside the current week as the week advances. Anchoring to the next Monday makes them
   always future but empties the current-week view; anchoring to this Monday fills the view but
   puts the early appointments in the past by midweek.
4. **The two clocks have a safe direction.** `reviewed_at` and `source_as_at` are written with
   `DEFAULT clock_timestamp()` *and* compared against `clock_timestamp()`
   (`src/scheduling/planner.ts:518`). Pinning "now" to the **past** puts every row a test creates
   into that gate's future and produces refusals no production path can produce — this is why r01
   was abandoned. Pinning "now" to the **future** of real time inverts it: rows created during a
   test carry real timestamps that are safely *before* the pinned instant.
5. **Not every date literal is a fixture.** `tests/browser/quality-states.spec.ts:205` hard-codes
   the window the application asks for *today*. It matches only on the day it was written and
   breaks the next day regardless of any fixture strategy. It has to be computed from the clock
   using the application's own rule.

## What the offset attempt proved

Implemented as `scripts/shift_fixture_dates.py`: every still-future fixture date forward 261
weeks, whole weeks to satisfy constraint 1, with `tests/unit` excluded because those tests inject
their own instant and `tests/unit/projects-gantt.test.ts` asserts that 2028-02-29 exists. The diff
was verifiably a pure date shift. `npm run test:unit`, `eslint`, `tsc` and both documentation
checks passed.

CI disproved it. On the compiled browser suite **208 tests passed and 4 failed**, every failure in
the three tests named in constraint 2. The demo job failed the same way, and
`quality-states.spec.ts` failed with `Expected: 2031-09-21T14:00Z, Received: 2026-09-20T14:00Z` —
the application asking for the real current week while the fixture had moved five years out. The
same job passed on #262 without the shift.

The failure is not a defect in the transform. It is constraint 2, which the offset cannot satisfy
by construction.

## Recommended next design

Keep the fixtures absolute and far-future, and **pin the application's clock to a fixed instant
inside that window**, honoured by both JavaScript and SQL. This is r01's mechanism with the sign
reversed, which is what makes it viable:

- constraint 1 is satisfied because the fixtures do not move at all;
- constraint 2 is satisfied because "today" becomes the fixed instant, so the planner's default
  view always contains the seeded week;
- constraint 4 runs the safe way, because real timestamps written during a test fall before the
  pinned instant rather than after it;
- constraint 5 is fixed separately and is worth doing regardless.

The cost is the one r01 identified and it has not gone away: roughly 44 gating comparisons, 72
audit writes and 149 column defaults route through the new clock, and the seam must be provably
inert in production. That is a deliberate piece of work with its own review, not a same-day
change, and it should land against a green baseline rather than alongside the cliff.

**Alternative if that cost is judged too high:** accept that the database, HTTP and browser suites
are time-dependent, re-run a whole-week offset periodically, and add the runway test so the
expiry is scheduled rather than silent. This is r02 with its limits understood — it would still
have failed the three planner tests, so it is only viable together with a decision about what
those three tests should assert instead.

## Consequences of doing nothing further today

From 2026-09-21T00:00Z the seeded appointments `a8…01`–`a8…05` are in the past. Assertions
expecting a successful confirm fail; `confirmed(9)` and everything routed through it follows from
2026-09-23; the required compiled browser suite is affected from October. These failures are
predictable and attributable to this ADR, and should be confirmed against an unmodified `main`
before being attributed to any change in hand.

## Validation evidence and remaining questions

The offset implementation and its CI evidence are preserved in the history of
`fix/fixture-date-offset`. Nothing from it ships.

An audit on 2026-09-20 of eighteen failed workflow runs attached to merged pull requests found
nine were this defect and nothing else — Application assurance runs 1042–1048, 1051 and 1052.
Eight were stale runs on superseded commits whose branch head was green before merge. One, run
658, was a real scroll-spy defect fixed by `0ad41c68` in the same pull request.

Those merges were possible because `main` requires six checks and **Application assurance is not
one of them**. Pull requests #255–#259 merged with it red, and #257 merged with no Application
assurance result at all.

Open questions for Dean: whether to fund the clock seam or accept periodic maintenance; and
whether the required-check set should include the PostgreSQL proof, so this class of failure
blocks a merge rather than being merged past.
