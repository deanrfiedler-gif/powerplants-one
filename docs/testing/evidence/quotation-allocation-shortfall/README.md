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

## First published head and follow-through

[PR #347](https://github.com/deanrfiedler-gif/powerplants-one/pull/347) initially published `ed0088ed441a186bdf0a6b75dcc5e7a4d8432478`. Its production build passed locally. A local compiled HTTP check reached concurrent Apply, where the duplicate request returned DatabaseQueryCancelled/DependencyUnavailable after waiting beyond the unchanged ten-second database limit; the original effect committed. This failed attempt is retained, not labelled a pass. The decision records the bounded traversal repair: use existing per-read authority caching for shortfall receiving and collect fresh post-command basis without rebuilding a second complete receiving UI state. Validation of that repair is separate from the first attempt.

The later [final post-merge record](main-postmerge-final.json) supersedes the running-state observation: 28 checks completed, 26 success, one cancelled compiled broad job and one failed aggregate. Application assurance completed successfully. Post-merge failure remains distinct from repaired #346 final-head proof.


The first-head dedicated workflow [37265671075](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37265671075) failed: new PostgreSQL 3 passed / 7 timed out at the unchanged 120000 ms per case; new compiled runtime 13 passed / 2 mobile recovery assertions failed at the original five-second locator deadline while reload recovery was still running. HTTP passed. Actual PostgreSQL/application restart passed: [six exact replays, 14 original receipts, 526 unchanged rows and four unchanged output files](ed0088e-restart.json). Existing Supply database, Receipt database and retained runtime lanes passed. Those successes do not turn the failed aggregate green.

The repair shares existing current-authority sets across the three related histories within one serialized actor read, reuses an already authorised quotation context for its remaining scope checks, and avoids rebuilding receiving UI state after native mutation. Changed actors, historical links not already checked, new requests and native mutations do not inherit cached source authority. Mobile recovery proof now waits for the actual detail response and exact actor-bound operation lookup, asserts their expected HTTP statuses and original operation identity, then retains the original saved/uncertain, replacement-blocking and exact-payload assertions. No deadline, retry or assertion was weakened. A Receipt-successor invalidation case is added.

After the initial narrower traversal repair, local concurrent HTTP passed once the application readiness response was observed. The separate attempt made before readiness failed with ECONNREFUSED and is not passing evidence. A local timed first database case still exceeded the original limit (143278 ms); later source refinements require their own CI proof. Final checked-head results belong to the PR checks and subsequent evidence, not these intermediate observations.
