# AD-01 capability catalogue evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Status: local database/build verification recorded; browser/visual evidence in progress. Owner visual, device and operational acceptance separate.

## Scope and source

This continuation of [native access inspection](../../../decisions/access-review-native.md) adds the capability catalogue, filtered grant holders and explicit person-explanation context. Base: `7ef617f949c82a69e758058f9dac51507712ef17` on PR #410. Branch: `codex/ad01-capability-catalogue`. The first increment remains a separate prerequisite PR; this record covers the incremental catalogue work.

The catalogue is exhaustive against the 132-key server Capability union. It does not adopt role bundles, teams, access-changing commands, campaign cadence or D-020 operational policy. There is no migration, seed, capability/grant change, hosted provisioning or deployment.

## Verification record

Application source: `fa89c3e`. Tests extend `tests/database/access-inspection.test.ts` and `tests/browser/access-inspection.spec.ts`, which run in the existing application assurance suites.

| Check | Result |
|---|---|
| `npm run build` (including whole-project TypeScript) | Pass |
| ESLint over the access module, page/API routes and database/browser tests | Pass |
| AD-01 database suite, disposable `ppo_synthetic_test` | 16 checks pass; [raw result](database.txt) |
| Naming, foundation and prototype checks | Pass; documentation assurance only |
| `npm run studio:check` | 354 entries / 200 source routes, no integrity errors; 326 unreviewed, 28 stale and 41 component reviews pending |

New database cases prove catalogue completeness and zero grants, hosted-only labelling, literal search/domain validation, denied and expired reviewer authority, working-company refusal, same-name company/site distinctions, cross-workspace exclusion, current versus expired/future/inactive grants, two-page completeness, hosted masking and unchanged users/grants/audit/sessions/working-company rows after reads. These assertions supplement the existing populated 0077→0078/reseed and person-explanation checks.

The first local database attempt failed in the new pagination fixture because one SQL parameter was inferred as both UUID and text. Explicit casts correct the fixture. Its test was also ordered after the existing hosted-identity fixture setup. A subsequent bulk fixture-user cleanup hit the ordinary 10-second statement limit through the full schema's foreign keys; bounded per-user cleanup replaced it. One individual cleanup also timed out while a production build ran. The unchanged final suite passes when run after the build (37.3 seconds). No timeout was increased and no runtime defect is attributed to those cleanup failures. The initial build found an overly narrow inferred state type in the editable capability input; an explicit string state preserves free entry and the final build passes. No passing result is inferred from failed attempts.

PostgreSQL initially could not bind the former local port; the task-owned disposable instance uses another loopback port. Environment files remain outside the repository. Failed fixture/build logs are retained alongside the final database result; no production database or account is used.

## Design boundary

The retained AD-01 capabilities view combines the catalogue with proposed roles/teams and an inspector. Native catalogue/detail routes use existing cards and controls, and show only real grants. This is a proposed adaptation; accepted native mockup images are missing. Source presence, automated functional proof, paired visual observation, owner/device/zoom/screen-reader acceptance and deployment remain separate. No review fingerprint is assigned by implementation.

The first browser run passed 12 of 15 scenarios; all three catalogue journeys expected a visible heading, whereas the shared register header delegates the visible title to the breadcrumb. Inspection also found that the new route inherited the parent label. Explicit catalogue/holder/person route metadata fixes the visible task and browser title, and the test now checks the breadcrumb. The original failed run is retained in `initial-browser-label-failure.txt`; the final browser result is recorded separately.
