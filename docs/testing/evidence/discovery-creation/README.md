# Discovery creation prerequisite — execution record

<!-- versioning: git -->

Scope: ES-02 Create discovery workspace, PPO-010, EST-01–EST-09. Owner: Dean Fiedler. [PR #637](https://github.com/deanrfiedler-gif/powerplants-one/pull/637). This record reports executed checks; it does not establish business acceptance, owner visual review or deployment.

The prerequisite implements [reviewed initial ownership and Sales linking](../../../decisions/discovery-creation-journey.md). Visual reference: Figma **PPO - Design**, **Create discovery workspace — accepted**, page `1414:356570`, review dialog `1416:2974`. UI implementation and paired visual evidence follow separately.

## Environment and evidence

- Dedicated worktree from main `0ebb26a3`; existing shared checkout left untouched.
- PostgreSQL 16 isolated on loopback, database `ppo_synthetic_test`; credentials and cluster files remain outside the repository.
- Inspected the installed `ppo.check_sales_estimating_binding()` definition and workspace/binding triggers after migration through 0109 before implementing 0113.
- The initial private database inherited Windows-1252 encoding; seeding failed on a Unicode arrow. Recreated that disposable test database as UTF-8. This is test-environment setup, not an application migration or reported application failure.
- A first run of the six new database cases failed in `beforeEach(reset)` with connection timeouts while Windows had less than 200 MB free memory. No case reached its assertions. A serial focused rerun also timed out during connection setup before assertions. These failures have not been attributed to the change.
- `npm run typecheck` was interrupted to reduce memory pressure; it has no passing result.
- Migration-number check passed with 0113 registered and its reservation removed.
- `node --import tsx --test tests/unit/discovery-creation-contract.test.ts`: 3/3 passed (legacy canonical input, explicit no-brief review, exact accepted-source identities).
- CI at `f0cea402`: merged-tree, documentation assurance and development-register integrity passed; application and estimating suites were still queued when inspected. This is partial CI evidence, not a full passing build.
- Focused PostgreSQL suite at `50b55385`: 7/8 passed, including populated 0109 → 0113 upgrade, exact-source refusal, eligibility/revocation, concurrency, rollback after forced outbox failure and missing journal evidence. The remaining test compared `observed_at` across two reads; all persisted Sales state was identical. The corrected test compares every business-state field and separately checks monotonic observation time. Its focused rerun passed (1/1). All eight cases therefore have passing assertion evidence; the whole suite was not repeated after this test-only correction.
- The local standard 120-second timeout did not stop the populated upgrade, which took 146 seconds on this Windows host. Focused rerun used 180 seconds. CI remains authoritative for its normal Linux budgets.
- Current-head CI at `50b55385` was queued when inspected. No full CI pass is claimed.

## Required functional proof

`tests/database/discovery-creation.test.ts` covers separate creator/receiver/estimator, unchanged Sales and answer attribution, no-brief and legacy creation, estimator eligibility/revocation, stale-source refusal, duplicate creation, current-access recovery and a populated 0109 upgrade. Existing Sales-binding and estimating-workspace suites remain part of regression proof. Migration-version assertions retain their original ledgers and append 0113; seed expectations are unchanged because this migration adds no seed.

No screenshot is claimed as application or device proof here. The retained icon-free design captures remain unchanged. Owner visual review: pending. Independent code review: pending. Deployment: not performed.
