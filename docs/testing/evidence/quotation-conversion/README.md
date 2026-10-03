# ES-07 execution evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. 4 October 2026. Baseline refreshed origin/main `e3bbb76fb97bd4271bc657b0e6c2e6231ec24707`. Capture source hashes are recorded below; the PR validation and linked checks carry the exact final-head CI outcome. No owner acceptance or deployment is inferred.

The task uses a fresh disposable `ppo_synthetic_test` PostgreSQL 16 instance on port 5587 and a compiled loopback app on port 3087. Retained restart-evidence databases are not reset or repurposed. Private task logs/checkpoints are under the task-specific Codex temporary directory, outside Git.

## Executed local evidence

- Initial database execution exposed an omitted latest-migration constant and test expectation errors; those were repaired without changing runtime acceptance rules. Later SQL strengthening exposed an ambiguous PL/pgSQL identifier, qualified before the successful complete run.
- Ten ES-07 PostgreSQL cases passed: exact source-to-real-target lineage, multi-line quantities, stale concurrent receiving, successor/response/mapping holds, owned returns, immutable replacement, one execution under competing commands, revoked permissions, atomic rollback and populated 0060 upgrade preserving original rows/bytes.
- Compiled build passed. The first build rejected a dependency junction outside the worktree; a fresh pinned npm ci was used. A preserved junction still inside the TypeScript scan caused a default-heap failure; relocating that task-created link outside source resolved it with unchanged compiler settings.
- Compiled desktop/mobile ES-07 plus shared component catalogue: 15/15 passed, including six ES-07 cases and route warm-up. Original outcome lost after commit, unsent/inconclusive recovery, reload, exact retry, stale proposal retention and denied identity are proved. The final history-detail host replay also passes 7/7 (six ES-07 cases plus warm-up).
- Compiled HTTP: ES-04/05/06/07 4/4 passed. An earlier invocation ran before the local server listened and failed connection-refused; its log is retained separately. Readiness was confirmed before the complete successful run; no test retry or deadline change was introduced.
- Actual application/PostgreSQL restart: passed. Twelve exact original command replays, unchanged source and native target rows, and all four original Draft/issued HTML/PDF byte comparisons pass after an actual postmaster restart. A later Declined correction holds applicability without erasing completed targets.
- Full local unit run: 580 total, 577 passed, three Windows failures. Both document-store cases and one recovery-path expectation reproduce identically on unchanged `e3bbb76` in a separate baseline worktree (four focused cases: one passed / same three failed). New ES-07 units and design/component register checks pass. The earlier unit attempt overlapped incomplete document authoring and also reported two missing-reference failures; the completed-document run resolves both.
- Lint, TypeScript, compiled build, foundation (78 requirements), prototype (78 parent dispositions), naming (7,986 instruction characters) and studio integrity passed. Native/reference images have not received owner acceptance.
- Additional retained Estimating/Supply/populated-upgrade regression results are recorded in the PR validation. They execute separately on port 5587; the restart proof uses its own new port-5588 instance so regression resets cannot affect its checkpoint. Both mandatory isolated PostgreSQL shards, both broad compiled browser lanes and the new ES-07 actual-restart job remain mandatory; exact results belong to their PR-head checks.

## Interpretation and remaining review

Native Supply Demand Forecast is the only target. All Product lines convert atomically; other accepted commercial lines remain in the frozen basis. No partial acceptance, ERP write, customer signing, live communication, operational master governance or work authority is established. Independent paired visual/owner/device/screen-reader acceptance remains pending; accepted native images are unavailable. Functional captures are not visual approval.

## Retained captures and source attribution

[Desktop](desktop.png) is the actual 1440 × 1000 compiled host. [320 px](mobile-320.png) shows the exact binding disclosure in the mobile host. These unedited execution captures were inspected for readable wrapping and retained controls; they are not an independent paired visual review. Capture hashes are in `capture-manifest.json`; source file hashes identify the captured host.
