# Products integration CI capacity repair

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Review: implementation diagnosis and verification; owner/design acceptance and deployment remain separate.

PR #358 head `af9e26b3b4aac5c009c45bad9f2f226b67c8f477` finished with **49 successful checks, one cancelled database job and one failed dependent aggregate**. The earlier Leads and CRM visual defects passed, as did native Products and its actual application/PostgreSQL restart proof. [Database-1](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37565047329/job/112610721304) exceeded its 90-minute job limit. Its database phase recorded **510 passing cases and no failed assertion**, with the last pass at 04:39:33.795 UTC and cancellation at 04:39:36.821. There is no completed database summary; the cancellation remains incomplete proof.

[Observations](observations.json) retain all failed-head conclusions, exact source/job IDs, annotation, timestamps and the hash of [sanitised database results](cancelled-database-1.txt). Setup/environment lines are excluded. The full downloaded job log remains private under ignored `tmp/`.

Main `c228c4f6bfd063e73fb11b67155ce0b1abf2749e` merged Maintenance/Warranty and the same measured capacity repair. Reuse its [three-shard isolation decision](../../../../decisions/ci-retained-suite-isolation.md#maintenance-and-es-07-combined-database-budget--7-october-2026), retaining all discovered files, serial execution within each disposable database, 120-second individual deadlines, the 90-minute job limit and the mandatory aggregate. Main's [independent failure and unchanged-main comparison](../../maintenance-warranty/integration/ci-capacity/README.md) remain separate evidence. No retries, assertion changes or test omissions are introduced.

The merge retains both additive migrations/seeds 0051 and 0052, exact combined grants and ledger counts, both receipt-authority dispatches and all native navigation/design bindings. The generated AD-01 catalogue has 131 capabilities and retains the 31-capability hosted set. Existing Products installation-order tests now account for Maintenance's exact grants, while the late Maintenance test runs after Products is present. Installed SQL is unchanged. The reviewed hosted gate stays at 72. The combined live design register has 350 entries and 196 source routes; all existing acceptance states remain.

Local verification and final repaired-head CI conclusions are recorded separately in observations and the PR. Pending checks are not passes. The original Products checkout and its 136 inventoried files remain preserved.

Local checks pass: TypeScript, source-wide lint (excluding only local generated browser bundles), foundation/naming, the 350-entry design register, 15 focused units, 107 AD-01 model checks, 40 AD-01 browser checks and nine shell/design cases (18 retained skips). All 15 selected database/hosted-upgrade scenarios passed across the first run (14 passed; FI01 failed on stale 61 versus actual 83 grants) and the corrected isolated FI01 run (one passed). The final expected set contains both modules and preserves revoked/original grants. The initial full lint invocation reported 1,222 errors only in an ignored generated job-pack fixture bundle; source-wide lint passed with that output directory excluded. No repository lint rule changed. Full repaired-head CI is recorded on PR #358.

## Measured headroom follow-up

The integrated checkpoint `d686723` passed **all 52 checks across 18 workflows**: 616 units, 984 database cases across three shards, and 650 primary browser passes with 79 retained skips. Native Products also passed its HTTP check, 12 browser journeys and exact recovery of 15 original receipts through three application processes and two PostgreSQL restarts. [Complete source-specific check list and job summaries](green-checkpoint.json).

Its successful database jobs took 26m44s, **89m42s** and 49m11s. The second job left only 18 seconds of the 90-minute budget. The successful primary browser job took **86m56s**, leaving 3m04s. These are passing results with inadequate margin for the previously observed variation. The [follow-up isolation decision](../../../../decisions/ci-retained-suite-isolation.md#products-combined-assurance-headroom--7-october-2026) adds a fourth native database shard and uses the existing desktop/mobile project split for the long primary browser phase. Focused Facilities/CRM and real restart phases remain once in the original browser lane; no test, assertion, individual/job deadline or mandatory gate is weakened.

Reproduce selection verification from the repository root:

- `node docs/testing/evidence/products-native/ci-capacity/shard-selection.mjs` verifies every current database filename once and automatic discovery/failure propagation for an additional negative-control file. [Result](shard-selection.json): all 99 files; 25/25/25/24 files across four shards. It imports no application or database test.
- `node docs/testing/evidence/products-native/ci-capacity/browser-selection.mjs` invokes the real Playwright `--list` for all, desktop and mobile selection. [Result](browser-selection.json): both selections cover every original case; only the existing warm-up repeats. Listing executes no browser/application test.
- [Parsed workflow comparison](headroom-validation.json) confirms only the intended matrix, full-browser project selection and unique immediate artifact names differ. All source/SQL/test/dependency and Playwright configuration bytes remain at the green checkpoint.

The four-shard and separated-browser head must receive its own complete CI result. PR #358 records that exact final source and all checks when complete; the d686723 pass is not substituted for pending final-head CI.

## E1 cleanup deadline follow-up

Head `2e4a1d3` reached a separate [E1 30-minute job timeout](e1-cancellation.json) after all of its test and evidence phases passed: 616 units, 110 database cases, 16 HTTP cases and 93 compiled browser cases, plus the actual repeated restart and exact-byte proof. The job was cancelled at 30m09s; its passing phases do not make the overall check successful. [Sanitised timestamped results](cancelled-e1-results.txt) omit setup/environment and container logs.

The [E1 isolation decision](../../../../decisions/ci-retained-suite-isolation.md#products-final-head-e1-cleanup-budget--7-october-2026) separates static/database proof from the complete compiled HTTP/restart/browser sequence, keeping both at the existing 30-minute limit. The original E1 check name becomes a mandatory aggregate over both jobs. The HTTP phase already resets its disposable database, while all original write/recovery/restart verification stays together. [Parsed workflow and gate comparison](e1-isolation-validation.json) confirms every original command, deadline and evidence field remains; the gate rejects failed, cancelled, skipped and missing results. Source, SQL, tests and dependencies remain unchanged. Final CI conclusions for the repaired head belong on PR #358, separately from the cancelled checkpoint.
