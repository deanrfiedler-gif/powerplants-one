---
document_id: PPO-ADR-0030
revision: r04
date: 2026-09-20
owner: Dean Fiedler
status: accepted
---

# ADR-0030 — Time dependence in synthetic test fixtures

## Status

**Accepted.** Dean selected the fixed offset with a runway test in r02, and that decision stands.
r03 withdrew it after its first CI run failed and attributed the failure to a constraint that does
not exist. **r03's diagnosis was wrong and is retracted here.** The failure was an incomplete
transform, not a flawed approach, and the correction is four literals.

The revision history is kept deliberately: r01 proposed a test-controlled clock, r02 selected the
offset, r03 misdiagnosed its first failure, r04 corrects both the transform and the diagnosis.

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

## What the first CI run actually proved

The offset moved every still-future date in the seeds and the clock-dependent suites forward 261
weeks. On the compiled browser suite **208 tests passed and 4 failed**, all in three tests that
read seeded appointments from the planner's default view, and the demo job failed the same way.
The decisive line was:

```
quality-states.spec.ts SC-07: from
  Expected: 2031-09-21T14:00:00Z
  Received: 2026-09-20T14:00:00Z
```

r03 read "Received" as the application asking for the real current week, concluded the planner was
clock-anchored, and withdrew the approach. That was wrong. The planner's default day is a
**hard-coded synthetic anchor in application source**: `src/components/planner-screens.tsx:1213`
was `useState("2026-09-21")`, and the window is `utcFromLocal(day + "T00:00", zone)`.
`2026-09-21` in Australia/Brisbane *is* `2026-09-20T14:00:00Z` — the "Received" value exactly.
Shifted with the fixtures it becomes `2031-09-22`, which is `2031-09-21T14:00:00Z` — the
"Expected" value exactly.

Nothing in the planner reads the clock. The transform had simply left the application pointing at
a week the fixtures had left.

**Retracted from r03:** that the planner is anchored to real time; that weekday-bound availability
and the planner's anchor conflict under absolute dates; and that
`tests/browser/quality-states.spec.ts:205` hard-codes a clock-dependent window. All three followed
from the same misreading. The clock seam r03 recommended is not needed.

## Decision

Shift every fixture date that is **still in the future** forward by **261 weeks (1827 days)**, and
add `tests/unit/fixture-expiry.test.ts`, which fails once the earliest seeded appointment is
within 90 days and names the command that fixes it.

`scripts/shift_fixture_dates.py` performs the transform and is kept so the next maintenance event
is one reviewed command. Its scope rules are the decision:

- **Only future dates move.** A fixture deliberately in the past — expired evidence, a visit
  already under way, a superseded policy — stays, so every past-to-future relation survives.
- **Whole weeks.** `ppo.calendar_intervals` binds crew availability to `weekday` against a
  Brisbane 08:00–17:00 calendar, so an appointment that changed weekday would fall outside its
  crew's working window. Whole weeks also keep the hard-coded `"Tuesday"` label in
  `tests/helpers/my-work.ts` true. Month alignment is not preserved and need not be: there is no
  month, quarter or financial-year logic in the application.
- **The application's own synthetic anchors move with the fixtures.** `src/` holds a small number
  of hard-coded dates that point at the seeded data. Two are future and move: the planner's
  default day and the mock invoice `due_date` in `src/finance/accounts.ts`. Leaving them behind is
  what the first CI run caught.
- **Percent-encoded literals are matched too.** Query strings carry the time separator encoded
  (`2026-09-20T14%3A00%3A00Z`). Two such literals in `tests/demo/ui.spec.ts` were missed the first
  time and stayed behind while their data moved.
- **`tests/unit` is excluded.** Those tests inject the instant they judge against, so they never
  expire, and `tests/unit/projects-gantt.test.ts` asserts that 2028-02-29 exists — an offset
  across leap years would silently destroy it. `tests/helpers/projects.ts` is excluded because a
  unit test hard-codes the values it returns.
- **`db/migrations` is never touched.** Migration bytes are checksummed against applied databases.

## Consequences and reversal

The fixtures run to 2031 and the runway test fails from roughly June 2031, about 90 days before
anything breaks, with the command in its message. Re-running the script with a new offset is the
original maintenance approach. The 31 October extension below requires reviewing each selected
date's role before applying that broad transform to newer fixtures.

Two application constants change value: the planner's default day and a mock invoice due date.
No logic, schema, migration, permission, document or interface changes. Reversal is `git revert`.

The hosted demo is unaffected and also not repaired. `scripts/database.ts` records applied seeds
in `ppo.seed_receipts` by version and skips any version already present, so an already-seeded
demo keeps its original dates. That is a separate problem and is not addressed here.

## Live-clock fixture coverage — 31 October 2026

Dean requested preventive coverage after the Conversations reply-by cliff. PR #777 is already
merged at `6e939bf0b937fc05f9e477d1cd14f8838c92fd9a`; its four repaired inputs remain unchanged.
The separate correction extends the existing 90-day policy rather than changing application
clocks or disabling validation. All fixtures and commands here are synthetic.

### Audit and disposition

| Fixture dates examined | Verified path and result | Protection / disposition |
|---|---|---|
| Conversations `2031-12-01` (formerly `2026-10-30`), browser setup/form and context DB test | `checkComposition` in `src/conversations/commands.ts` compares with PostgreSQL's Brisbane day; migration 0108 also rejects a past reply-by on insertion. | Guard all four actual source literals, including the form's `.fill`, with Brisbane civil-day runway. #777's changes are not duplicated. |
| Work-order register `2026-11-19` and `2026-11-20`, 00:00–02:00 UTC | `proposeVisit` only validates ordering; the subsequent `cancelAppointment` in the earliest-active-visit test requires `start_at > Date.now()`. The 19 November start is a real cliff. | Move both ordered visits by 261 weeks to **2031-11-20/21** and guard their defaults and explicit call arguments. |
| Closed-visit database proposal `2026-12-21`, 00:00–02:00 UTC | CV-04/05 cancels the proposal before creating its replacement, reaching the same future-start gate. | Move by 261 weeks to **2031-12-22**, retaining duration/weekday, and guard both endpoints. |
| P05 seeded visits in September 2031 | `guardBooking` / cancellation check actual current time. | Retain the existing seeded appointment warning. |
| Positive readiness expiry `2032-01-01` and `2032-01-02` | `assessWorkReadiness` refuses expired Pass / PermittedException / NotApplicable evidence; read-time blockers also compare with `Date.now()`. | Guard the planner default, policy-dispositions assessment and maintenance-service, offline-authority and isolated-field-http helpers. |
| Policy command defaults `2031-09-22`; policy-impact inputs `2031-09-21/22` | Proposal/review binds against database observation time; `readPolicyImpact` requires a future effective instant before the policy's expiry. | Guard these independently dated source literals. Preserve the explicit lower/upper-bound refusal cases. |
| SUP-1 promises `2031-12-01/08/09` | Writes accept historical dates, but `materialBasis` supplies the current demand-local date to `readiness`. A supplier-confirmed promise before today no longer supports At risk. | Guard the five positive literals using **Australia/Sydney**, the helper's demand timezone. Keep broken-promise `2026-09-30` and delay-impact `2026-10-10` unchanged. |
| Customer delivery `2026-11-03/04/05/07/08/09`; movement `2026-10-24` | `customerDeliveryCommand` uses `dateOnly`; `recordCustomerDelivery` and the S3 database guards do not require a future ETA. `laterCustomerEta` compares to the previously sent ETA, not today. | Retain historical evidence and relative ordering; no expiry warning. |
| Supply browser promise `2026-11-01`; default demand required date `2026-10-01` | `supplyFact` selects Estimated by default. This route/navigation fixture never supplies an eligible supplier-confirmed promise and does not assert a future readiness state. | Retain; no proven future-date rejection or changed asserted outcome at this date. |
| HTTP work-order proposal `2026-11-22`; browser closed-visit proposals `2026-12-27/28/29` | These only propose/read/recover visits; neither path books nor cancels them. The register selects by active status and date order, without a current-time filter. | Retain. The browser's reversed finish remains an intentional validation failure. |
| Readiness `2026-01-02`, planner started visit `2026-09-17`; Conversations unit `2026-10-30`; retained demo policy roots `2027-01-01` / `2028-01-01`; FX `2026-10-01…31` and source-price validity | Expired/started negatives, UI/normalisation-only unit inputs, immutable upgrade identities, or comparison against explicit pricing dates. They are not positive future-clock inputs. | Leave unchanged. Conversations reminder/refusal DB tests already derive dates from the database's Brisbane day, including yesterday. |

The audit searched fixed dates and real-clock comparisons in test helpers, browser/database/HTTP
tests, application validators and database guards. It traced the paths above; it is not a claim
that every dated value or derived assertion in this repository is time-independent.

### Warning and maintenance

`tests/unit/fixture-expiry.test.ts` now reads 25 selected literals in 12 source files using the
reviewed rules in `tests/helpers/fixture-expiry.ts`, in addition to the seeded appointment check.
The TypeScript parser is an existing development dependency; no fixture module is executed just
to inspect its dates. Selection uses field/default/argument context, not a whole-repository date
replacement. Counts and explicit, reasoned exclusions fail if their source shape disappears or
changes. A past positive date still fails; there is no "only inspect dates after today" filter.

Instant gates use elapsed UTC time; civil-date gates use the application's Brisbane or Sydney
calendar day. Less than 90 days fails the ordinary unit suite, naming the source file, line,
date, clock and remaining runway. Existing Application assurance and other `npm run check` /
`test:unit` lanes run it without a workflow change. It is an early CI failure, not a separate
notification service: if no tests run, no warning is emitted.

Run `node --import tsx --test tests/unit/fixture-expiry.test.ts` to check the inventory. On a
warning, trace the input again, move only positive live-clock fixtures and any dependent
assertions/anchors together, preserve weekday constraints where relevant, and rerun the affected
database/browser suites. The existing shift script can help in **report mode**. Do not apply its
whole-tree result blindly: newer historical upgrade roots, negative controls and explicit pricing
evidence may still have dates after today. Already-expired positive fixtures also need deliberate
repair because the script's default threshold skips them. Never rewrite migration bytes.

New validation paths, new files, indirect/dynamically constructed dates, embedded SQL and
changes to timezone semantics require a fresh audit/rule; this bounded source inventory does
not prove arbitrary dataflow. Known P05 seed dependencies still need joint review when that
cluster moves. Relative fixtures can have separate midnight races. Hosted demo seed receipts
are still outside this test-only protection. Reversal is the separate contribution's revert.

Regression tests restore the original Conversations date and both cancellation cliffs in memory,
check 90-day and expiry boundaries, Brisbane midnight, Sydney DST, browser form selection,
missing coverage and preserved negative cases. Execution results and independent-review status
are recorded in [the contribution fragment](../status/2026-10-31-fixture-expiry-coverage.md).

## Validation evidence and remaining questions

Run locally: the transform in report mode, reviewed before applying; the runway test, proved in
both directions; `npm run test:unit` — 128 of 132 pass, the four failures being the pre-existing
Windows-only filesystem cases confirmed identical on unmodified `main` (127 of 131); `eslint`;
`tsc --noEmit`; `check_foundation.py`; `check_naming.py`. The diff is verifiably a pure date
shift: no line outside the new test differs by anything other than a date.

**Not run locally:** the database, HTTP and browser suites need `ppo_synthetic_test` and a
document renderer. The transform touches 263 literals in 42 files and is proved only by CI. The
four corrections over the first attempt are precisely the four literals named above, and the
arithmetic for the decisive one is shown in full so the claim can be checked without a run.

An audit on 2026-09-20 of eighteen failed workflow runs attached to merged pull requests found
nine were this defect and nothing else — Application assurance runs 1042–1048, 1051 and 1052.
Eight were stale runs on superseded commits whose branch head was green before merge. One, run
658, was a real scroll-spy defect fixed by `0ad41c68` in the same pull request.

Those merges were possible because the PostgreSQL proof was not then a required check. It has
since been added to the required set, which closes that gap and makes this class of failure block
a merge rather than be merged past.
