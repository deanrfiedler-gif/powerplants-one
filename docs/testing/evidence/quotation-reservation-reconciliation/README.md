# Owned reservation outcome reconciliation execution ledger

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. 4 October 2026. Source, automated proof, visual/owner acceptance and deployment remain separate. [Decision](../../../decisions/quotation-reservation-reconciliation.md), [contract](../../../contracts/quotation-supply-followup.md).

## Baseline and preserved evidence

Refreshed main is #344 merge `3b1daba3a3738afe8b53700de2efb9e14a28d30a`. Its tree equals final checked head `16d3767bc7f6f446169b9cd74f9f0bbb9a4e6721`: `e5ec7ea0b526b07f8bc957f6f200d5ae94ce0fbe`. GitHub confirms all 29 final-head checks successful. Earlier failure and correction records in the conversion, disposition and Supply ledgers are unchanged. Main checks were running at initial reconciliation. The separate Azure update later reported success; this task neither initiated it nor performed a deployment or verified its hosted behaviour.

Post-merge main later completed all 25 assurance checks successfully, including [Application assurance](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37200136630) and [compiled browser assurance](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37200136645), plus the separate Azure update check. The exact 26 returned check records are retained in `main-checks.json`. They are independent of final PR-head proof and do not establish hosted acceptance.

No open PR or suitable unfinished dependency contribution existed. The isolated branch preserves Excel import and all earlier worktrees/databases. A new task-owned loopback PostgreSQL cluster at port 5654 contains only `ppo_synthetic_test`. Live 0063 constraints and registry were inspected before allocating 0064. No seed, grant, capability or identity is added. Reserved gaps remain unchanged.

## Execution checkpoints

The first focused database run timed out its first case at the unchanged 120-second limit; four subsequent cases failed waiting for the interrupted transaction's workspace lock. No passing retry or deadline extension is claimed. A separate task-owned baseline cluster and the unchanged #344 checked tree provide a controlled comparison. The baseline exact-allocation case also timed out at the unchanged 120-second limit on its clean source tree and separate cluster (161.9 seconds total). This reproduces a local timeout, not proof that every subsequent error has the same cause. A targeted candidate diagnostic retains its own result. Full isolated Linux CI remains required.

The initial build exposed an invalid UTF-8 byte from a Windows editing script. The new UI text was repaired to UTF-8; subsequent editing explicitly uses UTF-8. The failed build is retained outside Git. Three focused validation units pass, including exact canonical compatibility of prior #344 review payloads. A pre-final type check passed; final-source validation remains separate.

## Boundaries and next increment

Only an existing current Unknown ExternalOutcome/Reservation observation on the converted Demand can execute reconciliation. Confirmed, Failed and Absent require complete original-operation lookup evidence; absence of a PPO receipt remains inconclusive. Apply creates native successor evidence/history and an original receipt, without changing quantities, allocations, demand class or any external event. Other consequential holds remain owned and explicit. Fresh ES-07 review/application is required; Supply or Activity completion never resolves quotation exceptions automatically.

Operational authority, signing, age thresholds, unit conversion, item governance and external reservation commands remain Not configured. Accepted native imagery, paired visual, physical-device, screen-reader and owner acceptance remain pending. No merge or deployment is included. Next useful slice: an independently adopted shared receipt/inspection correction with explicit receiving/effects across every affected demand; it must not invent external receipt reversal.

## First PR-head assurance

PR #345 head `a5bb030` failed the naming check because the maintained project instructions reached 8,047 characters. The instruction is shortened while retaining the new decision reference. The separate targeted local database diagnostic also timed out at the unchanged limit; it is not a passing retry. A later test extends real Failed-state coverage to Forecast demand with no allocation, preserving the consequential hold. Final-head results remain separate.

Head `4dd84bca322bfa70a427610205a6d6d2a98fcdec` dedicated Linux PostgreSQL proof [run 37201876371](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37201876371) passed 20/22 cases. Exact native effects/conservation, Failed evidence on Forecast demand, current-authority recovery, populated 0063 upgrade and all 16 retained #344 cases passed. Two new test fixtures failed: synchronous validation escaped `assert.rejects`, and a receiving helper was passed `Held` in its owner-ID argument. The correction wraps validation in an async assertion callback and supplies the actual owner UUID plus an explicit Held decision; no assertion or deadline is removed. The lookup input now uses the native command's existing single-line 1,000-character bound, with boundary coverage. The compiled build, lint, foundation, prototype, naming and design-register checks passed locally at this checkpoint; all reviews remain unaccepted. Final-head results are recorded separately in the PR.

The migration-expectation review also found the policy populated-upgrade ledger prefix still subtracting eleven added migrations. It now subtracts twelve, matching the explicit 0053–0064 list and preserving the exact earlier ledger comparison. The original assertion remains mandatory.

The dependency proof also directly refuses forged source operations, effects, states, completeness and versions, and injects a late outcome failure to prove the native successor/history/receipts roll back before a subsequent concurrent exact application. The SQL successor comparison explicitly rejects a missing predecessor. A local run of the two corrected fixtures again hit the unchanged timeout followed by a workspace-lock timeout (185.4 seconds total); the repaired fixtures still require successful Linux proof. Type checking at `beff4a5` passed.

## Proof locations

These are executable coverage locations; successful execution is established only by the recorded run and source head.

| Obligation | Executable evidence |
|---|---|
| Confirmed, Failed and Absent successor observations; exact native versions and source operation | `tests/database/quotation-reservation-reconciliation.test.ts`: native successor, Forecast Failed and selective-evidence cases |
| Shared-supply conservation, unchanged allocations/other demands and fresh ES-07 resolution with remaining holds | Same native-successor case compares complete native workspaces, rejects the old disposition and explicitly reviews/applies a fresh retention |
| Unsupported evidence, unaccepted work, return/hold, immutable replacement | Same refused-input and selective-evidence cases; retained referral/reassignment cases in `tests/database/quotation-supply-followup.test.ts` |
| Corrected mappings, responses, successor issues and new shared dependencies; selective invalidation | New selective-evidence case and retained #344 source/shared-dependency cases |
| Revoked authority before native effects, original receipts and history | New current-authority case plus retained restricted linked-evidence and reassignment cases |
| Reserved-operation misuse, exact repeated commands, changed payload, concurrent application and atomic rollback | New native-successor case, direct SQL guard assertions and injected late-outcome failure |
| HTTP authority and separate review/application; actual original native receipt | `tests/http/quotation-supply-followup.test.ts` reservation case plus retained allocation and ES-04–07 suites |
| Committed lost response/reload; inconclusive lookup/exact retry; desktop/mobile and shared controls | `tests/browser/quotation-supply-followup.spec.ts` reservation case and retained recovery cases; `component-catalogue.spec.ts` |
| Actual application/PostgreSQL restart, original receipt recovery and output bytes | `scripts/quotation-supply-followup-restart.ts` write/restart/verify stages in the dedicated workflow |
| Populated upgrades preserve all earlier rows, grants, histories and bytes | New exact 0063 snapshot/replay case; retained 0062 and earlier ES-04–07 upgrades, both full isolated database shards and hosted-upgrade proof |

Notes, Activity completion and Supply outcome completion never substitute for explicit disposition. The retained #344 test exercises that refusal. Both full database shards, both broad browser runs, both compiled groups and their aggregate gates remain mandatory. Superseded unfinished PR runs were cancelled to release runners for the latest head; earlier failures remain recorded and cancelled work is not passing evidence.


## Successful implementation checkpoint

Head `126e21f468b5ff9a25dbee56b36e0744dc90c074` passed 585 units and 59 full HTTP cases. Its [dedicated Supply workflow](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37202839882) passed all 22 PostgreSQL, five HTTP and 19 compiled desktop/mobile/shared-control cases. Actual application/PostgreSQL restart recovered 30 exact original receipts and four unchanged Draft/issued HTML/PDF files. Downloaded bytes match every checkpoint file hash; `verification.json` retains the source head, artifact identity/digest, checkpoint/file/capture hashes and row count. The native successor, unchanged shared quantities, remaining holds and stale pending disposition survived restart. Both aggregate suites remained running at this checkpoint; the final PR head and completed check set are recorded in PR #345.

Earlier `beff4a5` [run 37202532922](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37202532922) passed its 22 PostgreSQL, five HTTP and real restart stages, then reached the unchanged 25-minute job limit during the remaining mobile cases. GitHub records it as cancelled, not successful. Its checkpoint and logs remain retained locally; this is distinct from superseded runs deliberately cancelled to release runners. No test deadline or passing retry was added.

Inspection of the retained desktop capture confirmed visible original/current quantities, dependency provenance and continuing holds. The original narrow capture was positioned at the page header; the final browser proof scrolls to the dependency evidence and exact review before capturing. This improves evidence framing and changes no application behaviour. Accepted reference imagery, independent visual/device/screen-reader and owner acceptance remain pending; no review fingerprint is promoted.
