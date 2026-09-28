# Azure update 78 retained-policy repair

Owner: Dean Fiedler. Source implementation and self-review; independent review, owner acceptance and deployment are separate. Synthetic evidence only. Requirement context: DAT-06, NFR-08/12, API-C26, EVT-12, AT-35.

## Failure and source evidence

[Update #78](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/36396313531), source `5c19c05d718c61e2ddfa3ead72ed2834ebdeeaaf`, failed on 28 September 2026 in the database operator at `apply-seed-53`, SQLSTATE `23514`. Migrations 53/54 preceded it inside the same transaction. The subsequent web/worker image step was skipped. Read-only catalogue inspection found no publication tables; the current web revision was healthy. No live database mutation was used for diagnosis.

The retained predefined synthetic policy expires on **1 January 2027**. Commit `3cb76a4abeb1302642d080654e975357fb58ef05` changed fresh fixtures to **2 January 2032**. Seed 53's exact-content trigger correctly rejects using the later content for that retained policy. The earlier hosted tests installed old schemas with current seed data, missing this boundary.

The repair retains all migration/seed bytes and recognises only the exact original and current root hashes. It creates bootstrap metadata from the original source; it neither changes expiry nor fabricates review/publication evidence. Existing checks, transaction/lock, receipt semantics, grant preservation and activation restrictions remain in place. See the [decision](../../../decisions/azure-existing-demo-upgrade.md#28-september--retained-scheduling-root-at-update-78).

## Executed verification

The isolated Windows worktree is `tmp/azure-demo-update-78`, branch `codex/azure-demo-update-78`, based on integrated `5c19c05d`. A separate PostgreSQL 16.15 cluster uses loopback port 55768 and the guarded `ppo_synthetic_test` database. Other worktrees, databases and private evidence were preserved.

Before changing upgrade code, the new four-case suite produced **one pass and three expected failures**: the direct installed-seed reproduction passed with `23514 / Exact policy content required`; the success, diagnostic and late-failure cases exposed the old seed failure. This is retained as a negative control, not a passing repair result.

The regression constructs the original policy by ordinary initial inserts. It never disables policy immutability or any constraint. It covers actual hosted upgrade execution, exact source/canonical root binding, retained policies/bookings/pins/receipts/audit/outbox/pack records, idempotent upgrade/verify, unknown-root refusal, and late-failure rollback followed by successful retry. Existing hosted identity, invitation/grant expiry/revocation, CRLF checksum and upgrade tests remain unchanged. The Azure preparation workflow now includes this regression explicitly.

The four new PostgreSQL cases pass after the correction. Build, matching-source type checking, repository lint, all nine focused Azure operator unit cases, foundation assurance (78 parent requirements) and naming assurance pass. The first combined hosted run passed all nine upgrade cases but hit the documented stale hosted-ledger setup failure in six existing identity cases; the isolated test ledger was cleared before a complete rerun. No production or prior proof database was touched. The Python helper suite passes 28/34 on Windows, with the same four Bash-related errors and two Bash/POSIX-mode failures reproduced on clean integrated-main tree `d33d54a223e9da40befea8ad82ef49e75e92e371`. Linux CI must establish that suite's full result; its assertions and skips are unchanged. An initial lint finding was corrected; the initial foundation scan preceded the new evidence file and passed once the complete document was present.

Source self-review checked exact whole-content hash recognition, transaction ownership, parameterised metadata inserts, complete saved-chain validation, absence of policy/head updates, untouched SQL bytes and closed activation. It is not independent approval.

Final combined check counts, protected source/merge and any subsequent recovery run are retained in the repair PR. Private local logs are under `%LOCALAPPDATA%/PowerplantsOne/azure-demo-update-78-20260928`; credentials and raw logs are not committed. A new reviewed main-source `upgrade-and-deploy` run is required after integration; rerunning #78 would reuse the failing source.

## Boundaries

This is a hosted operator compatibility correction, not a general local reseeder, business policy change or production integration. No SQL constraint, test assertion, skip or performance threshold is relaxed. No tester reconciliation, reset or expiry extension is performed. Step 3 live/offline commands remain unregistered pending Step 4 enforcement; Step 5 still owns publication UI. Hosted health and anonymous access checks do not establish signed-in workflow acceptance or worker output correctness.
