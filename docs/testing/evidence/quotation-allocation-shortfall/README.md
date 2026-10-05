# Shared Shipment allocation shortfall execution ledger

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Source presence, actual functional proof, final-head CI, paired visual review, owner acceptance and deployment are separate. This is synthetic evidence under SYN-ES07-06; no merge/deploy/live action is authorised.

## Reconciled starting evidence

Refreshed main #346 is `451f2e6734df9fa6ea04f58e6b3eef6d1ee797eb`; its tree matches checked head `1acc567c93e9c62fef4f5bd621501b55545d212b`. GitHub final-head checks were fetched: all 32 successful across 16 workflows. Retained proof: 587 unit, 60 HTTP, 772 PostgreSQL (400 + 372), both broad browser runs 588 passed / 79 retained skips each, retained compiled group 18, dedicated Supply groups 22 + nine PostgreSQL, six HTTP and 25 compiled cases; restart recovered 37 originals, 997 rows and four exact files. Earlier failed/cancelled heads and repair explanations in the Receipt ledger remain unchanged.

Post-merge results are fetched separately. At initial reconciliation, ten of 12 workflows completed successfully; Application and Compiled application browser remained running. No final-head evidence substitutes for those results. Deployment is not verified.

## Contribution proof map

- Unit: strict complete proposals, exact six-place decimals/zero, native atomic command shape and picked/unmet arithmetic.
- PostgreSQL: exact single/multiple reductions, independent receiving/correction/authority, return/hold/retention/reassignment, current source dependencies, reservation/replay/races, late atomic rollback, fresh ES-07 and populated 0065 upgrade with exact original rows/grants/histories/output bytes.
- HTTP: real guarded proposal/receiving/review/Apply and original receipts.
- Compiled desktop/mobile: exact native journey, lost committed response/reload, inconclusive lookup/exact retry and shared controls.
- Actual application/PostgreSQL restart: new shortfall checkpoint plus the unchanged retained Supply/Receipt/reservation checkpoint, exact original receipts, versions, output bytes and operational holds.
- Every original aggregate remains mandatory: both isolated database shards, both complete broad browser runs, both retained compiled proof groups, original Supply database/Receipt/runtime groups. New shortfall database/runtime groups have the existing deadlines; no retries or weakened assertions.

## Local investigation, not passing evidence

Fresh task-owned PostgreSQL 16 cluster on loopback 5665, database ppo_synthetic_test; unchanged main migrated/seeded through 0065 and live schema inspected before allocating 0066. Existing retained proof clusters and Excel work were not changed. Migration 0066 applied after an initial transactional SQL parse failure was repaired; the failed migration rolled back entirely. Initial production build found three incomplete synthetic TypeScript test casts; those were repaired without suppressing checking.

The new atomic database test hit the unchanged 120000 ms deadline locally (152609 ms observed; later isolated diagnostic 139397 ms). The corresponding unchanged-main Receipt test on a separate fresh cluster, loopback 5666, also timed out at the same deadline (133445 ms). These are failed local attempts, not passes or proof of the new behavior. CI uses its existing Linux renderer/runtime and original deadlines. Focused units initially passed eight cases (three new plus five retained). Final execution results will be recorded against the actual checked head.

Visual/device/screen-reader and owner acceptance remain pending. Accepted new native images are missing; execution screenshots, when present, demonstrate captured states only.

## Subsequent local and starting-main observations

The [independently fetched starting verification](starting-verification.json) records the exact PR-head and post-merge checks. Post-merge compiled broad execution exceeded its original one-hour deadline and was cancelled; its aggregate failed, while its retained group passed. Application remains running at this observation. This result is not repaired by #346 final-head success.

Local diagnostic execution completed the new full path through native atomic Apply at 2026-10-05T04:49:22Z, after separate proposal and both receiving decisions. This diagnostic is not the timed-suite proof. Local lint, typecheck, foundation (78 parents/22 sources), prototype and studio integrity passed; all 330 page and 37 component reviews remain pending. Naming initially exceeded the 8,000-character maintained-instruction limit; concise wording repaired it to 7,999 and the check passed. Full local units: 587 passed, three Windows private-path/storage failures; unchanged-main focused comparisons reproduce these existing failures. The three new unit cases passed. No assertion/deadline/retry policy changed.
