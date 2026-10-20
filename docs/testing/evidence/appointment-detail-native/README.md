# SV-04 Appointment detail — implementation evidence

Owner: Dean Fiedler. Owner visual review: **pending**. Synthetic prototype proof only; no business acceptance or deployment. The [page contract](../../../design/development/pages/route-service-appointments-id.md) lists source node IDs, accepted version, differences and open questions. Reference PNG bytes remain unchanged; native captures hide licensed icons.

## Scope and environment

Dedicated branch `codex/sv04-appointment-detail`, base `4c1097cc4d6c5504a65aa4b359bd40a08078d199`. Windows, Node 24.22.0, npm 11.19.0, Playwright 1.64.1, supported stable Chrome 155.0.8059.85. Private disposable PostgreSQL 16 cluster, database `ppo_synthetic_test`; no production or shared database used. UI tests intercept appointment/pack reads with `tests/helpers/appointment-detail-fixture.ts` and use the real synthetic session/shell.

## Execution ledger

Validation in progress. Final commands, results and capture pairing are recorded below before handover. A first browser attempt was interrupted by test-cluster reset/connection failures; the private cluster's lock allowance was corrected. That attempt is not a passing UI proof.

The source states requiring P4/P5 and undrawn dialogs remain gated as requested. A current supply hold can be displayed; historical R2 cause/task context is unavailable from the existing structured appointment read and is not fabricated. Owner review remains separate from any automated result.
