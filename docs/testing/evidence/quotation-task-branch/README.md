# Three-task Project branch execution evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. SYN-ES07-10. Functional proof, final-head CI, visual review, owner acceptance and deployment remain separate.

## Starting reconciliation

[Actual GitHub observation](starting-verification.json) confirms #352 merge 1ffcf653 and all 41 successful checks on final head 3a2e1c0. The separate post-merge observation records 28 successful checks and eight still running; these are not passes. That initial checkpoint is retained; the final observation is recorded below. #349's cancelled compiled job and failed aggregate, #351's unchanged-main Scheduling race and repaired ledger assertion, and #352's development failures, naming repair and superseded cancellations remain unchanged in their original ledgers. Current reconciliation supersedes pre-merge wording without rewriting historical checkpoints.

New task-owned PostgreSQL 16 cluster on loopback 5683, ppo_synthetic_test; live schema inspected through 0069 before selecting 0070. Existing proof databases and unfinished Excel import remain untouched. Node 24.21.0/npm 11.19.0 and copied locked dependencies. No dependency or lockfile changes.

## Development observations

Initial TypeScript found an overly broad role conditional during extension; it was corrected to keep ChainEnd and BranchSuccessor distinct. Initial branch PostgreSQL failed before proposal insertion because the new registry file had been added but latestMigrationVersion still named 69. Updating that constant and the separately reviewed hosted-upgrade gate fixes the contribution error. No assertion, deadline or retry policy was weakened. The corrected focused FS/FS case passed in 56.6 seconds including setup, proving six decisions and exact native effects. Seven focused units passed, including all branch FS/SS combinations, touching-edge refusals and retained earlier contracts. Complete branch execution and final-head gates remain separately required.

The new branch database/runtime groups extend the existing mandatory Supply aggregate. All eleven earlier Supply groups, both database shards, both complete broad browser runs, retained compiled proofs and aggregates remain. New rollback cases target B, C, Impact and immutable outcome independently. Populated 0069 cases preserve isolated, paired and linear-chain records and original recovery. Actual execution results will be appended here; pending work is not passed evidence.

Accepted branch mockup images are missing. Automated viewport proof and assistant observations cannot grant paired visual, device, screen-reader or owner acceptance. No review fingerprint is promoted.

## Reviewable candidate checkpoint

Local lint, TypeScript, eight focused units, foundation, prototype, naming and studio checks pass. Naming retains 7,993 instruction characters; all 330 design entries remain unreviewed, without promoted fingerprints. The complete development database execution is still running at this checkpoint; four dependency combinations, four late rollback stages, independent corrected/revoked receiving, quotation retention/fresh disposition, competing work and the isolated/pair populated upgrades have passed so far. This is not a claim that the unfinished suite or final-head CI passed.

The reviewable candidate strengthens complete native write-footprint assertions, adds explicit linear-chain consent refusal and rechecks introduced incoming/outgoing edges at each selected task without relying only on Project-version changes. Both old browser invocations and all mandatory aggregates remain unchanged. Final PR-head execution and exact browser identity/outcome comparison are required before handover.

## Candidate 27b98e8 and retained repairs

[PR #353](https://github.com/deanrfiedler-gif/powerplants-one/pull/353) initially published head `27b98e8cd36867e0440a863bba1b7457731139f1`. Local production build passed. The earlier complete development database checkpoint passed 18 cases; it predates the four added edge/consent cases and strengthened write-footprint assertions, so it is not final-head proof.

The complete Windows unit execution passed 598/601. The two P06 document-store cases and P12 private recovery-directory case failed identically in a clean detached checkout of unchanged main `1ffcf653cd94982ea3f58253d3dc9c4f9be7ebbc` (one pass, three failures across those four tests). No filesystem guard was relaxed. Linux CI remains the complete unit gate. A local 22-case database execution running alongside the full units timed out in the first case at the unchanged 120-second limit and reported all 22 failed; the exact cause of that local timeout is not established and it is retained as a failed run.

The [candidate Supply run](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37452841457) passed all eleven existing groups and the new branch runtime group. Branch PostgreSQL passed 19/22: the three new raw dependency fixture cases were correctly refused by `check_project_dependencies` because no accepted native task snapshot accompanied the direct edge writes. Its mandatory aggregate failed. The repair uses native task saves, retains graph-specific hold assertions and splits the independent edge/shape cases. A local repair attempt reported eleven timestamp assertion failures and one timeout/cancellation: it compared the fresh schedule `observed_at` timestamp as persisted state. That assertion is corrected to compare every Project/task field. No native rule, deadline, assertion about stored effects or retry configuration is relaxed. These failures remain separate from the subsequent source's required proof.

The candidate's [HTTP lane](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37452841335/job/112233242499) independently passed all 601 units and 65 HTTP tests on Linux. The repaired branch database suite contains 31 independently named cases, including an incoming and outgoing edge at each selected task and six cross-link/merge/reversed/missing shapes. Each introduced edge now carries native Project/task versions and schedule history. Fresh graph-specific holds are asserted as well as stale-version refusal; restoring the edges leaves the earlier consent stale.

The corrected local incoming-A, outgoing-C and reversed-A–B cases passed 3/3 at the existing 120-second per-test limit, including stale consent after restoring the native graph. TypeScript and focused lint passed. Repeated foundation, prototype, naming and studio checks passed; all 78 parent IDs and 330 unreviewed design entries remain. This targeted repair execution does not substitute for all 31 cases on final-head CI.

## Runtime restart and bounded viewport observation

At candidate head `27b98e8cd36867e0440a863bba1b7457731139f1`, branch HTTP passed one case and compiled branch/shared-control proof passed 15 cases (six branch desktop/mobile, eight shared controls and one warm-up). [CI restart evidence](candidate-runtime-verification.json) records different PostgreSQL start times, 13 exact command replays, 23 original receipts, 1,095 unchanged snapshot rows and four unchanged output files. The six decisions, four native receipts, original allocation outcome, exact Impact predecessor and unmet quantity `3.624999` remain explicit.

[Local independent restart](local-runtime-verification.json) repeats those results against a new retained loopback PostgreSQL 16.15 cluster on 5684 and compiled app on 3493, with document bytes outside Git. Both application and PostgreSQL were stopped and restarted. An initial local HTTP invocation before a listening process existed failed with connection refusal; the later connected HTTP execution passed one case. Neither this startup failure nor the separate database timeout is rewritten as a pass. The original databases, Excel work and source checkout remain untouched.

Assistant inspection of the source-specific [desktop capture](candidate-branch-desktop.png) shows explicit A → B and A → C, FS/SS kinds, three Unscheduled task positions, retained outcome context, unmet Demand, independent Requested Impacts and completed receiving evidence. The [320px capture](candidate-branch-320.png) shows wrapped introductory branch guidance and the retained shell; the remaining evidence continues below the fold. The automated host checks exercise 390/320px width and no horizontal overflow. This is bounded functional/viewport observation, not paired reference review, physical-device or screen-reader acceptance. Accepted branch mockups remain missing; no register review status or fingerprint is promoted.

The separate final #352 post-merge observation, final branch-head results and exact identity/outcome comparison of both complete broad browser executions are attached to the PR after completion. This ledger's candidate checkpoints do not substitute for that gate.

The reusable [browser equivalence checker](../../../../scripts/check-browser-equivalence.py) compares project/file/full-title identity, expected and actual outcome, and every attempt. It requires a single zero-retry attempt per case, no unexpected/flaky results, and only the existing shared warm-up duplicated by desktop/mobile isolation. Expected passed/skipped counts and verified artifact source head are explicit command arguments. It was exercised against the retained #352 final-head artifacts: 691 exact identities, 612 passed and 79 retained skips, no differences. Branch final-head artifacts require their own comparison and provenance.

## Final #352 post-merge reconciliation

[Exact check and workflow observation](main-postmerge-final.json), separately fetched for merge `1ffcf653cd94982ea3f58253d3dc9c4f9be7ebbc`, confirms all 38 checks completed successfully: 37 assurance checks, including both isolated database shards, both complete broad browser executions, all eleven Supply groups and mandatory aggregates, plus the distinct deployment check. These are actual post-merge results, not inferred from head 3a2e1c0. This task did not deploy or verify the hosted demo. Owner acceptance remains separate.

The documentation reconciliation follows repaired source 7c93f25. Its queued/running checks are not final-head proof; any superseded executions retain their actual outcomes. Final PR-head verification must complete on the contribution including this observation. Earlier #349/#351/#352 failures, repairs and cancellations remain unchanged.
