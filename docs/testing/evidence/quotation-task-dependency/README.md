# Project task dependency resolution execution evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. SYN-ES07-08. Source and functional proof are separate from visual review, business acceptance and deployment.

## Baseline and environment

[Starting verification](starting-verification.json) records actual GitHub merge, final-head and post-merge results for #348/#349. The separate #349 compiled push workflow cancellation is not a pass. Historical material-resolution failures, cancellations, baseline reproductions and repairs are unchanged. Fresh isolated branch from `61babd1`; original checkout, old branches and Excel import untouched.

New local PostgreSQL 16.15 cluster on port 5675, named `ppo_synthetic_test`, inspected through 0067 before selecting 0068. Other proof databases were neither reset nor repurposed. Node 24.21.0/npm 11.19.0 and locked existing dependencies. Migration 0068 applied successfully to the live baseline. Native schema has FS/SS composite dependency identity, no dependency version/lag/resource lower-bound columns.

## Development observations

Initial paired database run: reversed/new-edge refusal passed; positive journey failed at a test assertion comparing the replay marker as well as the original receipt. The test now requires identical receipts and exactly one original plus one replay. The corrected positive journey passed with five decisions, three receipts and exact task/Project/Demand effects. This is a corrected test expectation, not a runtime or timeout repair. Complete new suite and final-head assurance remain pending.

Native direction/weekday/missing-date unit passed. Source formatting and TypeScript are checked separately. Dedicated dependency database/runtime lanes extend the existing mandatory Supply aggregate without replacing any original group. Both normal database shards, both complete broad browser runs and retained compiled groups remain mandatory; queued/running jobs are not passes.

Actual HTTP, compiled desktop/mobile, restart, populated-upgrade and final-head results will be recorded here after completion. No accepted native mockup imagery or owner/device/screen-reader review is claimed.

The complete development run passed five of seven new database cases. The two failures were a test-only UUID parameter cast and a proposal intentionally made stale by later quotation disposition. After correcting the fixture and explicitly reproposing, both focused cases passed, including successor worklist access without Supply coordination. The late rollback and populated 0067 upgrade cases passed in the complete run. Further assertions preserve an unrelated task and refuse transfer of isolated-task consent; full final-head assurance remains required. Build/TypeScript, focused lint, foundation, prototype and naming passed. Initial register assurance rejected test paths as unsupported register dependencies; those references remain in the page/component fixture specifications, while registered dependencies name the actual source/contract. The corrected register passes with 330 entries and all review states still pending.

First published head 8eb8263 failed the rebuilt TypeScript check on a new preservation assertion: a UUID-inferred array did not accept the native string task ID in includes. Explicit identity comparisons correct only the test typing. Unfinished first-head runs were cancelled for the correction; [their observed metadata](8eb8263-superseded.json) preserves completed and incomplete results. No cancelled result is a pass; the corrected head requires all mandatory checks.
