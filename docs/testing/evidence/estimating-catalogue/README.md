# ES-02 equipment catalogue execution evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Review: implementation verification, not owner acceptance. Date: 12 October 2026 (Australia/Brisbane). Source baseline: main `6c16471`; branch `codex/es02-equipment-catalogue`. [Contract](../../../decisions/ADR-0054-es02-equipment-catalogue.md).

## Scope and environment

Six families and 108 exact source categories; opt-in configuration r02; unchanged r01 history; explicit reclassification, confirmations, copies, costing lineage and conservative evidence preservation. Migration 0085 adds no seed, user or grant. Native category authoring and technical rules remain separate work.

Windows, Node 24.21.0, PostgreSQL 16.15, disposable `ppo_synthetic_test`, loopback synthetic identity. Dependencies came from the existing lockfile. Private cluster, logs and environment settings remain outside Git. Tests use synthetic fixtures only.

## Passed checks

- Focused catalogue/configuration unit run: 15/15; migration-registry unit run: 3/3.
- Catalogue and existing configuration database suites: 13/13, including all 108 valid/invalid category pairs, strict schema/definition dispatch, receipt recovery, current access, reconfirmation, copied child identities, populated 0084 preservation, new r02 costing/quotation linkage and immutable prior costs. Final run: 498 seconds; each individual case completed within 55 seconds.
- Synthetic demo-upgrade suite: four cases passed on the first run; the Windows CRLF historical-checksum case passed on an isolated retry with unchanged limits (25.4 seconds). Together these cover all five cases, including invitation/role boundaries, conflicting history refusal and transactional rollback. These were local simulations, not a hosted deployment.
- Historical upgrade selection: 4/4 with the 120-second runner deadline, including populated version 25 across the deferred identity migration, reserved Products 0052 installation after version 85, populated AD-01 version 82, and an independent ES02-T25/T39 retry (24.5 seconds). Original ledgers, receipts, costs, quotes and exact added duties remain asserted.
- Production build, full ESLint and TypeScript checks passed; the final HTTP/access-test edits also passed targeted ESLint.
- Design-register assurance passed: 358 entries, 43 components, no errors; 330 unreviewed and 28 stale page reviews remain visible.
- Foundation, prototype and naming assurance passed. All 78 parent requirements and issued reference bytes are retained.

Compiled HTTP configuration suite: 2/2 passed against the completed production build. Existing r01 routes and opt-in r02 metadata/create/read/replay were exercised, including no-store, exact receipts, invalid classification, anonymous/cross-company denial and foreign-origin refusal. The first attempt preceded server readiness and returned connection refused; the successful run began after the compiled listener was ready. No server or application code changed for the retry.

## Initial failures and comparisons

The initial database reset failed with PostgreSQL `53200` (out of shared memory / lock capacity). The same original ES02-T13 test failed on unchanged main `6c16471`; the private PostgreSQL cluster used the default 64 slots. Applying the repository's existing CI setting of `max_locks_per_transaction=256` to this disposable cluster resolved it. No application or migration change was made to work around that setup failure.

A database run concurrent with the production build timed out in ES02-T25/T39 and was stopped. The complete subsequent 13-case run passed, including that case in 29.5 seconds. No source assertion was weakened.

The first demo-upgrade run hit PostgreSQL `57014` during the existing Site time-zone check in a historical seed. Its isolated retry passed with the same database and runner timeouts; no implementation, seed or timeout was changed.

The full unit suite completed 744 tests: 741 passed and three failed in the existing document-store/recovery path checks. Running those four affected cases against an unchanged main checkout reproduced the same three failures (P06 write-once/hash storage, P06 source/symlink refusal and P12 private recovery directories). These Windows path limitations remain unresolved by this backend change.

Initial type checking found the shared icon table's narrower key type and a readonly catalogue-count expression; both were corrected. The copy-ready instruction update initially exceeded its 8,000-character limit; the final naming check passed at 7,997 characters.

## Limits

Native r02 category authoring, category-specific technical checks (Q7), physical-device/visual/business acceptance and hosted rollout remain open. Classification is not engineering suitability, product selection or pricing authority. The current UI continues to author r01; the API explicitly opts into r02. Existing design-review statuses remain visible and are not promoted by backend testing. Build/test success does not grant owner review or operational approval. No production integration, business transaction, deployment or hosted upgrade was performed.
