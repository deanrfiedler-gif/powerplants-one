# Project calendar and actual-date execution evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Scope: PJ-03 / BC-02, PRJ-02/04/07, AT-09/32. Synthetic verification only; visual review, business acceptance, merge and deployment remain separate.

Source base: `1bb0cc26899a1a1a29da53349df77f8f115d9be0` (PR #461, dependent on #458). Contract: [project calendars and actuals](../../../decisions/project-calendars-actuals.md). New technology, operational calendars and external connections are not introduced.

## Verification contract

- `tests/unit/project-calendars.test.ts`: independent expected working-day counts, leap/DST dates, working Saturday/holiday overrides, sparse weeks with 366 exceptions, limits, FS/SS semantics and strict inputs.
- `tests/database/project-programme.test.ts`: native writes, immutable originals, status/actual disagreement, baseline calendar retention, concurrency, stale versions, correction/withdrawal, current scoped authority, rollback, populated 0087 upgrade and repeated migration/seeding.
- `tests/database/project-acceptance.test.ts`: genuine PJ-09 closeout retains original calendar/actual recovery and refuses new revisions after closure.
- `tests/http/project-programme.test.ts`: compiled routes, exact replay, comparisons, strict query/body validation and denied scope.
- `scripts/projects-restart-proof.ts`: calendar/actual rows, projections and original receipts across application-process and PostgreSQL restarts alongside existing receiving/RAID proofs.
- Historical upgrade suites retain their original full-row ledgers and exact additions. Products adds reserved 0052 after integrated 0088. Hosted upgrade retains the explicit reviewed-version gate and adds no grants/users/seeds.

## Execution

Execution is in progress on `codex/project-calendars-backend`. Five calendar unit cases pass locally and migration 0088 applies. The first native database scenario passes; remaining results and source-pinned CI will be recorded before handover. The initial type check identified the intentionally pending hosted-version gate, now reviewed and advanced with its migration rationale.

Local Windows verification uses only `ppo_synthetic_test`. Credentials and raw environment files remain outside Git. The earlier PJ-01/PJ-02 evidence records machine-related cold-connection/setup limits; those are not silently attributed to this change or treated as proof of passing tests.

The existing Gantt consumes calendar-aware warnings and names the selected calendar. Calendar/actual-date editing surfaces are API-only; weekend shading and bar geometry remain calendar based. Exact new editing-state mockups and paired visual/device acceptance are not claimed.
