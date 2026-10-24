---
document_id: PPO-MIGRATION-EXPECTATIONS-DEC
date: 2026-10-24
owner: Dean Fiedler
status: Recommendations approved; implementation on hold
review: Claude findings verified and corrected; follow-up review pending
source_commit: 79bef1d32f42cd2dcdbf04ce0f30a4374199db2e
versioning: git
---

# Independent migration test expectations

**Recommendations approved by Dean on 24 October 2026; implementation on hold.** Owner: Dean Fiedler. Author: Codex for Dean. Originally issued as **Proposed: owner decision required**, this paper now records his explicit yes to all five recommendations. Claude reviewed the original head; verified findings and corrections are recorded in section 11, with follow-up review pending. PR #692 remains a draft. Approval of the recommendations does not authorise implementation or merging this PR.

## 1. Recommendation and ownership

Dean approved **D: B for migration versions, with C's independent consistency check**, with seed/grant consolidation deferred. Maintain one explicit, reviewed, test-owned list of expected migration versions under tests/helpers/. Never derive it from the production registry, SQL files on disk, the database under test or the runner's result. Use it for current-version lists, exact added-version lists, computed current ranges, fresh-current setup and the hosted-demo added-migration count. Retain full original-row comparisons, fixed historical cutoffs, intentional gaps and explicit historical case matrices.

This does not promise one test-file edit for every migration. The common version expectation changes once; deliberate additions to the four historical late-install matrices still require edits. A seed or permission change still needs substantive grant, receipt, user and replay proofs. Removing that work without a separate design would weaken the tests.

**Record placement.** [PPO-MERGE-CONFLICT-DEC](merge-conflict-reduction.md) owns contribution coordination, number reservation and CI scope. This is a separate decision about the independence and preservation of test evidence. It complements that record and [PPO-PARALLEL-CONTRIBUTION-DEC](parallel-contribution-rules.md), superseding neither. An amendment was considered, but would combine contribution coordination with a distinct test-evidence contract. This is the single authoritative record for the approved recommendation awaiting implementation; other documents link here.

The stable filename and ID follow [PPO-STD-001](../standards/naming-conventions.md). Owner and review status are separate. The [master blueprint](../blueprints/BP-01-master-blueprint.md), including its audit/recovery NFRs and AT-22, supplies context only: this is repository assurance, not business acceptance or CREMS reconstruction. All parent IDs remain unchanged.

## 2. Baseline and headline measurements

Source classifications use main at **79bef1d32f42cd2dcdbf04ce0f30a4374199db2e**, fetched on 24 October 2026 (Brisbane). PR observations are dated 24 October; API timestamps are UTC. Commands, exact heads and source locations appear below.

- Whole-word 117 search: **80 source lines in 65 test files**. These are not 80 independent assertions: one line can contain many branches, and an assertion can span several matching lines.
- Last **12 first-parent landing PRs touching db/migrations/**: **881 test-file/PR incidences**, median **67**, range **58-139**. A file changed by two PRs counts twice. These are total changed test paths, including feature work, not all mechanical ripple.
- Three sample PRs (#521, #563, #659) are integrations. The nine other PRs have median **65** test files.
- Full diff review identifies **33 non-merge corrective test commits after first PR CI: 8 with version/history repairs, 8 grant/seed expectation repairs and 17 other repairs**. Two previously counted #530 merges are excluded. Of **55 failed workflow-run IDs**, **17 contain version/count misses** (14 version/count-only, 2 also grants, 1 also another failure), **10 contain grant/receipt misses without version/count misses**, and **28 fall outside those expectation classes**. D addresses repeated version/count expectations; it defers the ten grant-only runs and cannot promise to prevent even the fourteen version/count-only runs. These are runs, not jobs, cases or CI minutes; mixed repairs are not wholly avoidable work.
- At the observed heads, #673 changes **72** test files and #689 **67**, with **66 shared**. The brief's 71 for #673 is reproduced by the truncated files array from gh pr view --json files. The paginated files endpoint adds the omitted tests/unit/calls-numbers.test.ts path; the overlap remains 66.

Use paginated file listings: gh pr view --json files returned only the first 100 paths for larger PRs here. The existing AGENTS.md reports about 0021, #359 and earlier 0108 work remain historical reports, not newly remeasured figures. The ten #568 corrective commits split into two version/history and eight grant/seed expectation repairs below.

## 3. Classification and root cause

The first table partitions the 80 search lines exactly. File counts overlap. Section 8 identifies every matching line; the supplementary tables cover checks the latest-version search misses.

| Kind | Lines / files | What it proves; when to change |
|---|---:|---|
| M: current applied list, including >=18 projection | 9 / 8 | Exactly the expected ordered versions exist in the asserted projection. Current expectations change with intended history; keep the actual query and projection. |
| L: latest endpoint | 2 / 2 | The last version is current. This is weaker than an exact list alone; retain adjacent exact-list checks. |
| A: exact added versions | 61 / 55 | Exactly the intended versions were added above a cutoff or outside the original set. Update the current tail, never the historical cutoff or missing-version identity. |
| R: computed added range | 2 / 2 | Same exact-addition proof using a range plus tail. Current value changes; historical lower bound stays. Policy's two computed expressions are counted under M. |
| T: historical starting-case arrays | 4 / 4 | Deliberately selected historical/late-reserved scenarios. Retain existing cases and explicitly add coverage; do not replace them with only the newest case. |
| U: fresh-current setup | 1 / 1 | Leads/Projects setup installs through current before exercising both domains. It is setup, not a historical cutoff or assertion. |
| N: historical test name | 1 / 1 | “0117 preserves populated 0116” identifies the feature transition. Do not mechanically rename it. |
| **Total** | **80 / 65 unique files** | Source-search lines, not runtime test cases. |
| Preserved original ledger | 80 sites / 74 files (outside the 80-line partition) | Entire original version/checksum/applied-time rows survive. Keep full-row, replay and rollback comparisons; do not regenerate the original ledger when a new migration appears. |
| Seed/grant expectation | Outside 117 search | Exact receipts, old rows, new duties/users, validity/scope and replay. Changes only for relevant effects, not every no-seed migration. |
| Bare count | Outside 117 search | Demo's pending-migration cardinality follows intended history. Historical bootstrap counts and user/grant counts have different meanings. |

**Source findings that affect the design:**

1. The registry contains **116 local migrations through 117**, excluding reserved 0016. The two commercial/specialist expressions now use a fixed length 85 (26-110), followed by 111-117. The brief's “latest minus 25” describes an earlier representation; the current evaluated set is still 26-117. Policy-persistence has two other computed expressions: 1-50 excluding 16, plus a tail. Never manufacture all integers up to a current maximum.
2. Original ledgers contain more than versions. Field timer boundaries retains version, sha256 and applied_at; quotation release/response/conversion and other suites preserve whole original rows. Replacing these with membership loses checksum and timestamp proof.
3. Late installation is not a suffix. Products reconstructs a history without 0052; Maintenance installs 0051 after newer migrations. Assistant, Intake and Service next actions exercise missing 0110, 0112 and 0111. “Versions greater than installed maximum” would miss these gaps.
4. Some current coupling already exists. Excel import's expectation at lines 64-69 is explicit for through=92 but derives other branches from migrationFiles. Maintenance's max-version assertion at line 44 reads latestMigrationVersion. The registry unit test compares on-disk files with the registry: a consistency proof, not an independent release oracle. Converting the Excel fallback preserves evaluated values and strengthens independence; do not claim all old branches are already independent.
5. Leads has two >=18 lists: migrations and seed receipts. They differ because migrations such as 0022/0023 add no seed.
6. The literal latestMigrationVersion comparison in scripts/demo-upgrade.ts is a release-review gate. It is enforced by compile-time typechecking (TS2367 for stale distinct literals) as well as a runtime guard. Its comments record schema, data, grant and hosted effects reviewed. Keep it independent of the test helper; automatic derivation would disable that gate.
7. Grants are stateful. Seed 108 derives duties from live Opportunity/Project reads, including grants installed by earlier seeds in the same upgrade. Seed 110 depends on those results. Already-seeded late histories must add nothing. A union of capability names or blanket prefix exclusion cannot prove validity, scope, revocation or replay.

**Root cause.** The runner applies the whole pending registry, so a small feature's populated-upgrade suite also sees unrelated later migrations. Each suite copied the same current global tail. Assertions in different populated contexts add proof; repeated spelling of the global tail adds editing work without a distinct oracle. Independence here means separate maintenance of intended release history, not different values on a green branch: when the consistency check enforces E = registry R, database = E also implies database = R. The extra proof is that a correlated omission from both a SQL-file listing and the registry cannot silently redefine E. It is not independent evidence of SQL semantics; a careless edit to both E and R can still fake agreement. Keeping repeated copies across suites adds no such protection.

Keep the local facts: cutoff, intentional missing version, fixture, original rows, ordering, projection and replay. Share the independently maintained current global fact while leaving each actual database query in its suite.

## 4. Measured cost and limits

Sample: the last 12 entries from git log --first-parent at the baseline restricted to db/migrations/. This includes integration landings. File counts use each final full PR diff, so integration counts include child work and must not be attributed solely to one migration.

“Fix commits” means non-merge commits present in the final PR, committed after its first CI run was created, that correct an existing test expectation, fixture, synchronisation or restore an accidentally lost test. Mixed implementation/test repairs count; initial implementation, new-only regression coverage, formatting and evidence-only commits do not. Commit timestamps and final PR membership are the reproducible proxy: push-event history was not reconstructed, and chronology is not a claim that CI caused each fix.

“Missed / all” counts unique workflow-run IDs whose latest observed attempt failed within the PR's open interval. A missed-expectation classification requires the relevant actual/expected migration, grant or migration-count difference, not merely an assertion error. Earlier failed attempts of runs rerun green, cancellations and future runs are excluded. Zero means none identified in this observed set.

Overlap uses final test-path sets and overlapping open intervals in the **UTC creation interval 2026-10-14T00:00:00Z through 2026-10-24T06:21:37Z inclusive: 211 PRs, 31 touching db/migrations/**. It measures potential shared paths, not contemporaneous hunk conflicts. Older-created PRs outside this cohort are excluded; zero/maxima are bounded to it. All non-zero maxima below have final-head ancestry or identity, including branches integrated after working concurrently. These raw maxima do not measure independent contemporaneous work; final ancestry alone also does not prove the PRs were originally dependent.

| PR / measured head | Migrations | Test files | Fix commits | Missed / all failed runs | Largest raw concurrent test-path overlap |
|---|---|---:|---:|---:|---|
| [#665](https://github.com/deanrfiedler-gif/powerplants-one/pull/665) / [620da023c46e](https://github.com/deanrfiedler-gif/powerplants-one/commit/620da023c46e) | 0117 | 71 | 2 | 0 / 2 | 66 with #673 |
| [#662](https://github.com/deanrfiedler-gif/powerplants-one/pull/662) / [b7b4336f15d7](https://github.com/deanrfiedler-gif/powerplants-one/commit/b7b4336f15d7) | 0116 | 68 | 1 | 0 / 2 | 0 in cohort |
| [#659](https://github.com/deanrfiedler-gif/powerplants-one/pull/659) / [a9ec34898d53](https://github.com/deanrfiedler-gif/powerplants-one/commit/a9ec34898d53) | 0110, 0111, 0112, 0115 (integration) | 139 | 5 | 0 / 7 | 76 with #642 |
| [#650](https://github.com/deanrfiedler-gif/powerplants-one/pull/650) / [1172286157a2](https://github.com/deanrfiedler-gif/powerplants-one/commit/1172286157a2) | 0114 | 82 | 6 | 1 / 5 | 60 with #642 |
| [#637](https://github.com/deanrfiedler-gif/powerplants-one/pull/637) / [29dda7f5ffc8](https://github.com/deanrfiedler-gif/powerplants-one/commit/29dda7f5ffc8) | 0113 | 67 | 4 | 0 / 1 | 59 with #642 |
| [#569](https://github.com/deanrfiedler-gif/powerplants-one/pull/569) / [a8fc8e118eb7](https://github.com/deanrfiedler-gif/powerplants-one/commit/a8fc8e118eb7) | 0109 | 62 | 2 | 1 / 3 | 58 with #568 |
| [#568](https://github.com/deanrfiedler-gif/powerplants-one/pull/568) / [2bbfe34d9648](https://github.com/deanrfiedler-gif/powerplants-one/commit/2bbfe34d9648) | 0108 | 65 | 10 | 17 / 17 | 58 with #569 |
| [#563](https://github.com/deanrfiedler-gif/powerplants-one/pull/563) / [48537b6dd8b7](https://github.com/deanrfiedler-gif/powerplants-one/commit/48537b6dd8b7) | 0107 (integration) | 81 | 0 | 0 / 0 | 68 with #541 |
| [#530](https://github.com/deanrfiedler-gif/powerplants-one/pull/530) / [5845046fb67b](https://github.com/deanrfiedler-gif/powerplants-one/commit/5845046fb67b) | 0106 | 61 | 0 | 7 / 7 | 61 with #538 |
| [#522](https://github.com/deanrfiedler-gif/powerplants-one/pull/522) / [099663de2894](https://github.com/deanrfiedler-gif/powerplants-one/commit/099663de2894) | 0105 | 60 | 3 | 1 / 11 | 56 with #530 |
| [#521](https://github.com/deanrfiedler-gif/powerplants-one/pull/521) / [af79e1757e59](https://github.com/deanrfiedler-gif/powerplants-one/commit/af79e1757e59) | 0103, 0104 (integration) | 67 | 0 | 0 / 0 | 58 with #512 |
| [#498](https://github.com/deanrfiedler-gif/powerplants-one/pull/498) / [e3ec866758a8](https://github.com/deanrfiedler-gif/powerplants-one/commit/e3ec866758a8) | 0102 | 58 | 0 | 0 / 0 | 0 in cohort |

### Relationships behind the raw overlap maxima

Using the same measured final heads and `git merge-base --is-ancestor`, all ten non-zero table rows have these relationships. The two #568/#569 rows share one pair. Independent contemporaneous overlap is **not measured**; these values must not be sold as conflict savings.

| Pair | Final-head relationship |
|---|---|
| #665 / #673 | #665 is an ancestor of #673 |
| #659 / #642 | #642 is an ancestor of #659 |
| #650 / #642 | #650 is an ancestor of #642 |
| #637 / #642 | #637 is an ancestor of #642 |
| #569 / #568 (both rows) | #568 is an ancestor of #569 |
| #563 / #541 | #541 is an ancestor of #563 |
| #530 / #538 | Identical head 5845046fb67b |
| #522 / #530 | #522 is an ancestor of #530 |
| #521 / #512 | #512 is an ancestor of #521 |

### Verified missed-expectation runs

These IDs account for every missed-expectation run above. Multiple failed jobs in a run count once. Read with gh run view RUN_ID --log-failed.

- **#650:** [39534265279](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39534265279).
- **#569:** [39029617290](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39029617290).
- **#568:** [39028800540](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39028800540), [39028800615](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39028800615), [39028800676](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39028800676), [39028800714](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39028800714), [39028800813](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39028800813), [39028800848](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39028800848), [39030407066](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39030407066), [39030407079](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39030407079), [39030407126](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39030407126), [39030407136](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39030407136), [39030407137](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39030407137), [39032007914](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39032007914), [39032007961](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39032007961), [39032818035](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39032818035), [39033660159](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39033660159), [39034627350](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39034627350), [39048147240](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39048147240).
- **#530:** [38841283634](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38841283634), [38841283649](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38841283649), [38841283666](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38841283666), [38841283670](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38841283670), [38841283688](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38841283688), [38841283695](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38841283695), [38841283713](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38841283713).
- **#522:** [38822669489](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38822669489).

#568's 17 runs show missing 108, the demo count 107 versus 106, or unexpected/missing conversation grants, including already-installed late histories. Its ten corrective commits are ten total ripple repairs, not ten grant-only repairs. #530's seven runs show missing 105 after integration; that does not establish a defect in its new 0106 SQL. #522's counted run misses 104 in quotation disposition; two other failed runs hit the hosted-demo review gate's 104/103 mismatch, reported separately rather than counted as test assertions. #650's counted run has both policy lists missing 114; reference-format and browser failures are separate. #569 exposes the computed 0025-to-current range missing 108.

#665's two failures and #637's one were project-instruction length checks; #662's two were malformed status front matter. #659's observed failures include browser/infrastructure/fixture issues, with no verified missing migration/grant/count expectation. This proposal cannot eliminate those failures.

### Version/count scope within those failures

This partitions the 27 cited runs by all observed failure categories, after reading failed-test output, rather than counting capability text in passing negative tests:

| Class | Runs | Exact attribution |
|---|---:|---|
| Version/count only | 14 | #569's cited run; #522's cited run; all seven cited #530 runs; #568: 39028800540, 39028800615, 39028800676, 39032007961, 39034627350 |
| Version plus grant | 2 | #568: 39030407066, 39032818035 |
| Version plus other | 1 | #650: 39534265279; missing policy version 114 and an equipment fixture error |
| Grant/receipt without version/count | 10 | #568: 39028800714, 39028800813, 39028800848, 39030407079, 39030407126, 39030407136, 39030407137, 39032007914, 39033660159, 39048147240 |

The other 28 failed runs have no verified miss in these classes. D targets the duplicated expectations involved in 17 runs, but a missing oracle edit should still fail the new consistency check, and other faults in mixed runs remain. Fourteen is an observed version/count-only failure class, **not a demonstrated number of prevented runs**. No refactored counterfactual was executed. The two additional #522 gate failures are [38822669472](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38822669472) and [38822669486](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38822669486): typecheck reports TS2367 for 104 versus 103. They remain outside the 27 test-expectation runs.

### #673 / #689 counterfactual

Heads: #673 **f52d584888ad692aa4459434ae2674ceb1ef00c7**; #689 **1faa684294613b0ecd8da7de396a703fb65eaf98**. The **66 common test paths are exactly section 8's 65 files plus tests/demo/upgrade.test.ts**. Neither PR adds a seed at these measured heads; #673's only db/ path is db/migrations/0118-calling-core.sql and its seedFiles block is unchanged. Feature work remains. Both PRs' common test-path edits are version-tail, case-matrix or migration-count edits.

A retains all 66 shared paths. Under migration-only B/C or recommended D, 62 of the existing shared paths can stop sharing a current-expectation edit (61 of the 65 latest-literal files, plus the demo count). Under Dean's approved explicit-case policy, four historical matrices deliberately gain new cases, and both branches edit the new oracle: **five shared test paths in this bounded counterfactual**, not zero. Resolve 118 versus 119 in the oracle to both, in order, retaining the 16 gap. Retain both new matrix cases and every old case. The production registry and demo review gate remain coordinated shared edits outside this test-path count.

This is a classification-based counterfactual, not an executed Git merge simulation or rewritten test branch. Five is conditional on the chosen explicit-case policy, not an inherent lower bound or a forecast for future features. Both original PRs change the demo count from 100 to 101: identical edits can merge without a textual conflict, while the combined 118/119 history requires 102. Path overlap therefore does not establish whether Git will flag a semantic conflict.

Current-state observation from `gh pr view N --repo deanrfiedler-gif/powerplants-one --json headRefOid,state,mergedAt,baseRefName` (N = 673, 689, 690) at **2026-10-24T11:24:36Z**: #673 merged at 07:47:51Z; #689 merged at 11:15:02Z at head ecb79c655050601823f40eb6a6ba168190f791af **into its parent branch feat/rule-sets-r1-engine, not main**; #690 remained open at 9c9fdd761b9601e3b0a1f829c415bb1a00947402. A follow-up `gh pr view 689 --repo deanrfiedler-gif/powerplants-one --json baseRefName,mergeCommit,mergedAt` confirms parent merge 1bcb58ad39527238ce0c8d0d699ee8a335bb3887. Main remained 60a7f7b469ab758e9ee99fd7d5d3910b27f2f2ad at the follow-up (`gh api repos/deanrfiedler-gif/powerplants-one/branches/main --jq .commit.sha`), with latestMigrationVersion 118 (`git show 60a7f7b4:scripts/migration-registry.ts`). These later states do not change the fixed historical measurements. The quiet-window condition was not met at this observation; absence of reservation files alone cannot establish it.

## 5. Options

| Option | Proof and reviewer visibility | Merge surface | Failure modes / proposed diagnostics | One-time effort and remaining ripple |
|---|---|---|---|---|
| A. Keep copies; add ripple checker | Keeps existing proof. Reviewer still reads many repeated tails. A whole-word search cannot infer historical meanings or every computed branch. | Still 66 shared paths for #673/#689; checker inventory may add another. | “policy-persistence: current expectation omits 118 at …”. A syntax-only checker can miss variables/ranges/counts or demand a wrong historical change. Automatic fixes amplify that risk. | Low disruption as advisory inventory; high ongoing burden for complete semantic diagnostics. Does not reduce edit volume. |
| B. One explicit test-side current history | Independent literals; no registry import in helper. Each suite retains its DB query and preservation proof. Reviewer sees one expectation delta alongside registry and feature proof. Editing both sides carelessly remains a review risk. | Oracle conflict plus intentional matrices: five shared paths under the stated model. | Exact assertion differences remain, but an upgrade failure may be the first signal without a separate consistency check. A bad selector can affect many suites. | Broad one-time equivalence review; small ongoing version maintenance. Seeds/grants unchanged. |
| C. Committed expectations plus registry check | Manual JSON/CSV/TS history compared against registry. Tests must consume it too; a check alone leaves churn. Generated expectations would be a tautology. | Same shared data/matrix conflicts as B; file format does not remove them. | “expected history missing [118]; unexpected []; first order mismatch …”; also reject duplicates, disorder and malformed data. Agreement alone does not prove SQL ran or rows survived. | Similar rewrite plus parser if a new format is chosen. Avoid redundant TS and JSON masters. |
| D. B for migrations, C's check, grants/seeds separate | Preserves migration and substantive seed/grant proof with the smallest coherent independence change. Reviewer sees the version delta and explicit remaining seed effects. | Five-path counterfactual; seed/grant conflicts remain when both PRs affect them. | Early independent mismatch diagnostics plus actual DB and unchanged grant/seed assertions. No global exemption for new grants. | Recommended first stage. One conversion in quiet window; stateful grant/receipt refactor needs separate proof. |
| E. Independent expectation fragment per migration | Could work if manually written and validated; scanning production migration files as expectations would not. | Distinct fragments reduce oracle-tail conflict, but matrices and registry remain shared. | Missing/duplicate fragments can be reported; faulty discovery/ordering can hide history. | More files/discovery machinery for little extra proof. Revisit only if the single oracle becomes a measured bottleneck. |
| F. Derive expected history from the production registry | Actual database versus registry remains a useful execution check, but does not independently assert which migrations should exist. Removing an integrated SQL file and its registry entry together can redefine both sides. Reviewer sees only the production delta. | Can remove repeated current-tail edits; explicit-case policy still determines matrix edits. | Detects runner disagreement with registry, but cannot diagnose a coordinated registry/file omission as an independently missing intended version. | Mechanically simpler; rejected for the brief's independent-history requirement. Existing file/registry checks alone do not supply that contract. |
| G. D with automatic historical cases | Derive case lists from the test-owned oracle, with explicit floors and exceptions. Could preserve old cases, but requires exhaustive case-set comparison and runtime-cost review. | One shared test expectation path in this bounded model; no matrix edits per later migration. | A mistaken selector silently removes or adds scenarios; prove case-set preservation separately. | Not selected: Dean approved explicit cases. Could be a later proposal with coverage and CI-cost evidence. |

Only Products currently has an AGENTS requirement to add the newest late-install case; Assistant, Intake and Service next-action do so by observed practice. This paper explicitly proposes that policy for all four. Automatic cases are a viable alternative, not intrinsically a loss of proof. At the baseline Products has 47 cases (`for (const through of [...]` at line 39); a naive `[25,48]` plus every version from 71 through 117 adds previously absent 73 and 75. Keeping old cases is insufficient to claim an identical matrix or cost.

B describes ownership of expected data; C adds an early check. D selects both for a narrow first stage. Use the existing TypeScript test environment, with no new framework or data format. A can remain an inventory aid until the queue is quiet.

## 6. Proposed contract and staged implementation

### Independent expectation contract

Proposed file: tests/helpers/migration-expectations.ts, containing an explicit readonly ordered sparse list. It imports no production registry, runner, filesystem scan or database client. Small pure selectors may return the full list, a cutoff projection or the difference from an independently specified historical starting set. No generated integer range based on production latest.

Keep actual database queries in their suites. Never compute expected values from the post-upgrade ledger, trim actual results to expected length, ignore unknown versions, compare only maxima, or replace exact comparison with subset membership. Retain existing ordering; sort only where the original comparison already compensates for JSON-text row order.

A separate proposed unit test, tests/unit/migration-expectations.test.ts, imports both independent expectations and production registry to compare exact ordered versions, reporting missing/unexpected/duplicate/out-of-order values. Run it with `node --import tsx --test tests/unit/migration-expectations.test.ts`; the existing test:unit glob includes it. It supplies neither side of that comparison. Existing on-disk registry and checksum checks remain. Negative tests cover gaps, late installation, omission, extras, duplicates and reordering. Production code must never import the test oracle.

An actual pre-upgrade ledger may be used to identify preserved rows, but cannot silently define a historical fixture's intended version set. Specify that fixture independently (fixed cutoff and named omissions) and verify its version set before upgrade. Then select exact additions from the independent intended history. This prevents a broken setup from redefining the scenario. Production migration/seed registries may still drive actual setup execution; they must not supply its expected version set. Adding a missing pre-upgrade check strengthens fixture validation and must be recorded separately from mechanical equivalence.

A prefix comparison such as after.slice(0, original.length) is valid only when the original ordered version set is a prefix of the independently intended final set. A late migration below that cutoff violates this precondition. Detect the violation explicitly; preserve the fixed historical fixture. If that scenario is supported, separately review preservation by original-version identity with full-row equality plus exact additions. Never move the cutoff, discard original rows or refresh the snapshot merely to make a prefix check pass.

### Required starting-history and replay inventory

These six setup families are explicitly in stages 3 and 5. Locations refer to 79bef1d3; read the whole setup and all historical parameters with `git show 79bef1d3:PATH`. Each must assert the complete ordered local version set **before** upgrade against test-owned intended history. Retain separate existing seed/hosted-identity assertions.

| Fixture under tests/ | Baseline setup | Independent intended starting history / planned action |
|---|---|---|
| database/products-upgrade.test.ts | 39-56, omit 52 | Fixed selected through value, retaining historical gap 16 and intentional missing 52. Keep every existing case. |
| database/assistant-upgrade.test.ts | 21-31, omit 110 | Fixed through value, retaining 16 and missing 110. Include through=109 and the existing later cases. |
| database/intake.test.ts | 1187-1200, omit 112 | Fixed through value with 16 and 112 absent. Validate the setup after migration/seed execution. |
| database/service-finding-next-action-upgrade.test.ts | 21-27, omit 111 | Fixed through value with 16 and 111 absent. Preserve every case and separate seed effects. |
| database/maintenance-upgrade.test.ts | 27-46, omit 51 | Intent is current history except late 51, not a fixed old cutoff. Replace line 44's production latest maximum comparison with the **full independent intended current version set minus 51**, retaining 16's gap. |
| demo/upgrade.test.ts | 221-237, files through 17 | Fixed local starting history [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,17]; retain the separate hosted identity history [1] and CRLF/checksum fixture. |

For fixed historical cases, an oracle cutoff projection is permitted only with independently retained historical omissions; a future late-integrated low number must not be inserted retrospectively into that starting set. Maintenance intentionally follows current intended history minus its named late migration and therefore has different semantics.

Replay-only checks supplement section 8's original-ledger inventory; they are not extra original-preservation sites to add to its 80/74 count:

| File under tests/ | Source check | Proof to retain |
|---|---|---|
| database/cpq-costs.test.ts | assert at 454, query at 455 | Full migration rows unchanged on replay |
| database/cpq-quality.test.ts | assert at 343, query at 344 | Full migration rows unchanged on replay |
| database/cpq-rebase.test.ts | assert at 417, query at 418 | Full migration rows unchanged on replay |
| demo/scheduling-policy-upgrade.test.ts | tables at 29-40; rollback at 121; saved snapshot after newTables | Snapshot includes migrations, seed receipts and grants; failed upgrade leaves it unchanged, repeated upgrades reproduce saved rows |

This is an explicit supplement, not a claim that four files exhaust replay/rollback coverage. Stage 3 must inventory every replay/rollback assertion before any implementation. Products through=25 and through=48 have **no exact-added-version assertion**: the existing guard at 131 is through >= 71. The equivalence manifest must mark those branches absent, not fabricate an empty expected array. Any new exact-addition assertion there is a separately reviewed strengthening, not evidence that the old test already proved it.

### Stages and quiet window

1. **Retain the owner decision and complete review.** Dean approved all five recommendations; implementation remains explicitly on hold. Claude's original review and the author's verified corrections are recorded in section 11; obtain follow-up review. Neither this approval nor publishing the paper starts implementation. Await separate authorisation before creating an implementation change.
2. **Clear the migration queue.** Start only with no open PR adding, changing or reserving a migration. Check paginated PR paths and check_migrations.py --open-prs, including reservations. Ideally start immediately after the last migration merges. Use the current PR states, not the original #673/#689 snapshot; at the dated observation above #690 remained open. All migration work must first land or be withdrawn before conversion starts; sequencing cannot waive the no-open-migration condition. This refactor adds no SQL and needs no migration number.
3. **Freeze source and complete inventory.** Record main SHA, migration/seed versions, each assertion, every through value/conditional branch, query ordering, original-row comparison and late gap. Re-run these searches; 117 is a measured baseline, not a future constant. Include all six setup families above, every replay/rollback comparison, prefix preconditions and absent Products addition branches. Capture old evaluated values before editing.
4. **Introduce independent data and pure checks.** Transcribe the reviewed sparse history once. Check against separately captured old expectations and production registry. Add tests/unit/migration-expectations.test.ts and run `node --import tsx --test tests/unit/migration-expectations.test.ts`. Add negative/mutation cases; do not generate the expectation from production code.
5. **Convert migration expectations only.** In one coherent implementation PR, convert M/L/A/R/U and demo's added-migration count. Preserve full original snapshots/checksums, fixed cutoffs, late gaps and historical matrices. Under the explicit policy approved here, every migration PR retains all existing cases and ensures each of Products, Assistant, Intake and Service next-action has an explicit through case for the highest independently expected current version, adding it when absent. Never replace yesterday's case with today's. Add pre-upgrade exact-version checks for all six setup families; replace Maintenance:44 as specified above. Keep the hosted-upgrade release-review literal independent. Record the new fixture checks and Excel fallback's stronger independence separately from equal-valued rewrites.
6. **Prove every expression equivalent.** At that same frozen source, evaluate old and proposed expected expressions for every suite, every historical parameter and conditional branch, including late-install holes. Use a temporary harness extracting pure expressions; do not import database suites just to evaluate constants. Emit suite path, assertion location, inputs, old/new ordered arrays (or count), ordering and equality. Record absent assertions and prefix preconditions explicitly; separate newly added fixture checks and any other strengthening from old/new equal-valued expressions. Require complete manifest coverage and zero unexplained differences. Maxima, lengths, hashes alone and sampling are insufficient. At this paper's baseline, commercial through=25 stays 26-117; Products through=117 with 52 missing stays [52]; demo's added count stays 100. The future conversion has not been executed here.
7. **Prove the wiring and preserved checks.** Review that each actual query and original full-row snapshot remains. In disposable tests, inject an omitted/extra/reordered version, altered historical checksum or applied_at, lost seed receipt, revoked grant and duplicate replay. The relevant old and new proofs must both fail. Add a correlated-omission mutation: remove an integrated middle migration SQL file and its registry entry together while leaving the test oracle unchanged. The independent consistency test must fail with the missing intended version, even if registry-derived expectations and the disk/registry check agree; this is not a claim that all other SQL dependencies would pass. Inject an upgrade failure after a transaction write and assert full migration, receipt and grant ledgers roll back unchanged. Exercise the prefix-precondition failure with an interleaved late version. Preserve existing rollback/replay cases. These are planned tests; none was executed for this paper. Pure expression equivalence cannot establish that an assertion still checks the correct database result.
8. **Run full implementation CI.** Tests/helper edits are application scope. Pass documentation/merged-tree checks, registry/numbering, naming/status/scope controls, all unit/type/lint/build checks, and all database, HTTP, restart, upgrade, compiled desktop/mobile browser, design-register and dependency jobs selected by the unchanged workflows. Retain Products/Maintenance late-install cases, populated 0025 across 0026, and demo upgrade/replay/rollback. Record the full head-specific check list. Skipped application jobs are not implementation proof. Use existing synthetic CI databases, renderer and hosted-identity setup. Full application execution belongs to that later task, not this paper.
9. **Land only in the agreed window.** Recheck no migration/reservation PR opened meanwhile. Fetch and merge main before every push; re-evaluate against a changed baseline. Obtain different-model review and owner authorisation for the implementation merge. If the window closes, sequence the work; do not force-push or rewrite another contributor's branch.
10. **Measure remaining seed/grant ripple before another proposal.** A sparse independent seed oracle may help later, but exclusions require a preservation-plus-exact-addition contract. Grants require ordered seed effects, previously applied receipts, workspace/company/scope/validity and revocation. No blanket prefix exclusion or automatic allowlist expansion. Demo's 22 added users and exact identities stay until a relevant seed changes them.

### Exact proposed future AGENTS.md wording

After separate implementation authorisation and completion, replace the three Implementation paragraphs beginning “Reserve the migration number first”, “The runner applies every pending migration” and “A new Capability” with the following text. This is proposed wording inside the paper; **AGENTS.md is unchanged**. The named helper/check must exist before it takes effect.

~~~markdown
Reserve the migration number first (python3 scripts/check_migrations.py --reserve "purpose"; see CONTRIBUTING.md), and delete its reservation in the pull request that adds the migration. A database migration is never confined to its domain. Maintain the explicit, independent current migration history in tests/helpers/migration-expectations.ts once for each intended history change, and review its exact delta beside scripts/migration-registry.ts. Never generate expected history from the production registry, SQL filenames, database under test or runner output. Run node --import tsx --test tests/unit/migration-expectations.test.ts and the existing registry/numbering checks. Keep the list sparse, ordered and unique; a reserved number is not an applied migration.

Use the shared expectation only for current applied-version lists, exact current additions, computed current ranges, current-install setup and the hosted-demo added-migration count. Preserve each suite's actual query and ordering, full original migration rows (version, checksum and applied time), fixed historical cutoffs, intentional missing migrations and replay/rollback assertions. Prefix preservation requires originals to be a prefix of the intended final ordered set; detect a late interleaving migration and review identity-based full-row preservation without changing the historical fixture. Retain every existing historical starting case. In every migration PR, ensure each of the Products, Assistant, Intake and Service next-action late-install matrices has an explicit through case for the highest independently expected current version, adding it when absent. Verify independently specified starting version sets before upgrade in those four matrices, Maintenance and the hosted demo. Keep fixed historical omissions, and check the full current-except-51 set in Maintenance; additions must come from the independent intended history, including late-reserved gaps, never from the post-upgrade result. Search tests/ for the previous latest migration and seed versions as whole words, atVersion(, Array.from, seed_receipts, grant helpers and snapshot exclusions to find new literal expectations and semantic impacts; classify each hit before changing it. Do not bump historical labels, bootstrap counts or preserved originals. The conversion/equivalence contract is docs/decisions/migration-test-expectations.md.

The runner applies every pending migration in one transaction. A migration that alters ppo.business_identities must run SET CONSTRAINTS ppo.identity_target IMMEDIATE before its ALTERs and SET CONSTRAINTS ppo.identity_target DEFERRED straight afterwards: 0026 can leave deferred identity events pending when upgrading populated estimates. Prove the upgrade across 0026 with estimates present, not only the migration against a current database. Read the live schema because later migrations amend earlier objects. Seeds must reference registered migrations and be registered in increasing version order. The literal latestMigrationVersion comparison in scripts/demo-upgrade.ts remains a separate hosted-upgrade release-review gate enforced by compile-time typechecking and a runtime guard: review schema, data, privilege and seed effects before changing it, and never derive it from the test helper.

A new Capability in src/platform/permissions.ts still requires the AD-01 generated access-review contract, a plain-English label in docs/design/access-review/model.js, and the pinned contract sizes in scripts/check-access-review-model.mjs, scripts/check-access-review-browser.mjs and docs/design/access-review/workspace.js. Run python3 scripts/build-access-review.py on LF source bytes. Seed/grant expectations have not been consolidated by the migration-history change. Search all SeedGrants( consumers, permission_grants snapshots, seed_receipts lists and NOT IN exclusions, including the NOT LIKE 'conversation.%' snapshot family. Maintain tests/database/quality-upgrade.test.ts's reseed allowlist and tests/helpers/engineering-materials-grants.ts helpers, preserve every earlier grant/user/receipt, and assert exact added rows separately from earlier-seed counts. Retain explicit grant/user preservation in FI-01 tests/database/field-timer-boundaries.test.ts and FI-07 tests/database/field-customer-response.test.ts, plus the full grant snapshots in tests/database/estimating.test.ts and tests/database/estimating-workspaces.test.ts. Do not broaden a snapshot exclusion without a named exact-addition proof. Derived grants must include eligible grants installed by earlier seeds in the same upgrade and add nothing where their seed already exists; retain the newest Products and late Maintenance cases, revocation preservation and repeated migration/seeding proofs. Any seed above 17 also replays on the hosted-demo upgrade, so review tests/demo/upgrade.test.ts's exact added-user count and identities, grants and receipts as well as the independent migration count. Run affected upgrade suites and full application CI; a green history-consistency unit test is not database proof.
~~~

This deliberately corrects the old direction to “extend each … preserved ledger”: preserve the original ledger instead. The transaction, demo-review, grant and access-design obligations remain.

## 7. Questions and Dean's recorded answers

Dean explicitly answered **yes to all five recommendations on 24 October 2026**, then required this PR to remain draft pending Claude review and implementation to stay on hold. The questions and recommended answers are retained for traceability:

1. **Adopt D for stage one?** Recommended: yes, one manually maintained test-side migration list and independent registry comparison; defer seed/grant consolidation.
2. **Retain deliberate historical case additions despite remaining edits?** Recommended: yes. Keep every case and add the newest late-install cases explicitly. Any later scenario-manifest design needs separate coverage/equivalence proof.
3. **Keep the hosted-demo review gate independent?** Recommended: yes. Only the test migration count follows the oracle; the literal enforced by typechecking and the runtime guard, and its review narrative, remain deliberate.
4. **Require a quiet window and complete equivalence/mutation evidence?** Recommended: yes. No open migration/reservation PR, one conversion owner, full CI and different-model review before a separately authorised merge.
5. **Keep seed/grant consolidation outside stage one?** Recommended: yes. Measure residual edits first, then propose an independently specified stateful contract if justified.

These answers come from Dean's explicit instruction, not from green CI or authorisation to write a paper. They approve the recommendations; they do not approve an implementation start or merge.

## 8. Complete 117 source-line inventory

Each cell is **count: source line(s)** at the baseline. A dash is zero. The columns partition all 80 hits using section 3's kinds; these are source locations, not runtime cases. project-raid line 142 also contains a separate preserved-original assertion. Excel import's A line defines a variable used at line 70. Products line 142 contains many branches.

| File under tests/ | M | L | A | R | T | U | N |
|---|---|---|---|---|---|---|---|
| [database/access-application.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/access-application.test.ts#L205) | - | - | 1: 205 | - | - | - | - |
| [database/access-local-teams.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/access-local-teams.test.ts#L123) | - | - | 1: 123 | - | - | - | - |
| [database/access-requests.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/access-requests.test.ts#L87) | - | - | 1: 87 | - | - | - | - |
| [database/access-review-attestations.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/access-review-attestations.test.ts#L146) | - | - | 1: 146 | - | - | - | - |
| [database/access-withdrawal.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/access-withdrawal.test.ts#L160) | - | - | 1: 160 | - | - | - | - |
| [database/assistant-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/assistant-upgrade.test.ts#L21) | - | - | 1: 62 | - | 1: 21 | - | - |
| [database/conversations-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/conversations-upgrade.test.ts#L66) | - | - | 1: 66 | - | - | - | - |
| [database/cpq-packages-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/cpq-packages-upgrade.test.ts#L78) | - | - | 1: 78 | - | - | - | - |
| [database/cpq.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/cpq.test.ts#L789) | - | - | 2: 789, 901 | - | - | - | - |
| [database/discovery-creation.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/discovery-creation.test.ts#L164) | - | - | 1: 164 | - | - | - | - |
| [database/document-library.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/document-library.test.ts#L664) | - | - | 1: 664 | - | - | - | - |
| [database/estimating-catalogue.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/estimating-catalogue.test.ts#L332) | - | - | 1: 332 | - | - | - | - |
| [database/excel-capacity-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/excel-capacity-upgrade.test.ts#L84) | - | - | 1: 84 | - | - | - | - |
| [database/excel-fx-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/excel-fx-upgrade.test.ts#L110) | - | - | 1: 110 | - | - | - | - |
| [database/excel-import-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/excel-import-upgrade.test.ts#L66) | - | - | 1: 66 | - | - | - | - |
| [database/excel-landed-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/excel-landed-upgrade.test.ts#L115) | - | - | 1: 115 | - | - | - | - |
| [database/excel-reimport-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/excel-reimport-upgrade.test.ts#L74) | - | - | 1: 74 | - | - | - | - |
| [database/excel-source-pricing-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/excel-source-pricing-upgrade.test.ts#L92) | - | - | 1: 92 | - | - | - | - |
| [database/field-customer-response.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/field-customer-response.test.ts#L754) | - | - | 1: 754 | - | - | - | - |
| [database/field-timer-boundaries.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/field-timer-boundaries.test.ts#L244) | - | - | 1: 244 | - | - | - | - |
| [database/field.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/field.test.ts#L91) | 1: 91 | - | - | - | - | - | - |
| [database/finance-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/finance-upgrade.test.ts#L96) | 1: 96 | - | - | - | - | - | - |
| [database/inspection-attribution-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/inspection-attribution-upgrade.test.ts#L195) | - | - | 1: 195 | - | - | - | - |
| [database/intake.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/intake.test.ts#L1187) | - | - | 1: 1225 | - | 1: 1187 | - | - |
| [database/leads-amendments.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/leads-amendments.test.ts#L355) | - | - | 1: 355 | - | - | - | - |
| [database/leads-projects-integration.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/leads-projects-integration.test.ts#L48) | 1: 136 | - | - | - | - | 1: 48 | - |
| [database/nursery-assessment.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/nursery-assessment.test.ts#L145) | - | - | 1: 174 | - | - | - | 1: 145 |
| [database/nursery-automation.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/nursery-automation.test.ts#L250) | - | - | 1: 250 | - | - | - | - |
| [database/offline.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/offline.test.ts#L92) | 1: 92 | - | - | - | - | - | - |
| [database/outcome-sources.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/outcome-sources.test.ts#L378) | - | - | 1: 378 | - | - | - | - |
| [database/output-actions.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/output-actions.test.ts#L763) | - | - | 1: 763 | - | - | - | - |
| [database/packs.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/packs.test.ts#L110) | 1: 110 | - | - | - | - | - | - |
| [database/planner.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/planner.test.ts#L261) | 1: 261 | - | - | - | - | - | - |
| [database/policy-persistence.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/policy-persistence.test.ts#L192) | 2: 197, 705 | 1: 192 | - | - | - | - | - |
| [database/products-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/products-upgrade.test.ts#L39) | - | 1: 130 | 5: 135, 137, 139, 141, 142 | - | 1: 39 | - | - |
| [database/project-baselines.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/project-baselines.test.ts#L275) | - | - | 1: 275 | - | - | - | - |
| [database/project-commercial-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/project-commercial-upgrade.test.ts#L61) | - | - | - | 1: 61 | - | - | - |
| [database/project-programme.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/project-programme.test.ts#L427) | - | - | 1: 427 | - | - | - | - |
| [database/project-raid.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/project-raid.test.ts#L142) | - | - | 1: 142 | - | - | - | - |
| [database/project-specialist-handover-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/project-specialist-handover-upgrade.test.ts#L123) | - | - | 2: 123, 124 | - | - | - | - |
| [database/project-specialist-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/project-specialist-upgrade.test.ts#L81) | - | - | - | 1: 81 | - | - | - |
| [database/project-specialist-work-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/project-specialist-work-upgrade.test.ts#L97) | - | - | 1: 97 | - | - | - | - |
| [database/quotation-allocation-shortfall.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/quotation-allocation-shortfall.test.ts#L823) | - | - | 1: 823 | - | - | - | - |
| [database/quotation-conversion.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/quotation-conversion.test.ts#L503) | - | - | 1: 503 | - | - | - | - |
| [database/quotation-disposition.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/quotation-disposition.test.ts#L746) | - | - | 1: 746 | - | - | - | - |
| [database/quotation-material-resolution.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/quotation-material-resolution.test.ts#L879) | - | - | 1: 879 | - | - | - | - |
| [database/quotation-receipt-correction.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/quotation-receipt-correction.test.ts#L585) | - | - | 1: 585 | - | - | - | - |
| [database/quotation-release.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/quotation-release.test.ts#L516) | - | - | 1: 516 | - | - | - | - |
| [database/quotation-reservation-reconciliation.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/quotation-reservation-reconciliation.test.ts#L420) | - | - | 1: 420 | - | - | - | - |
| [database/quotation-response.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/quotation-response.test.ts#L440) | - | - | 1: 440 | - | - | - | - |
| [database/quotation-supply-followup.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/quotation-supply-followup.test.ts#L598) | - | - | 1: 598 | - | - | - | - |
| [database/quotation-task-branch.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/quotation-task-branch.test.ts#L747) | - | - | 1: 747 | - | - | - | - |
| [database/quotation-task-chain.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/quotation-task-chain.test.ts#L648) | - | - | 1: 648 | - | - | - | - |
| [database/quotation-task-dependency.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/quotation-task-dependency.test.ts#L506) | - | - | 1: 506 | - | - | - | - |
| [database/quotation-task-diamond.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/quotation-task-diamond.test.ts#L489) | - | - | 1: 489 | - | - | - | - |
| [database/quotation-task-merge.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/quotation-task-merge.test.ts#L1110) | - | - | 1: 1110 | - | - | - | - |
| [database/reports.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/reports.test.ts#L120) | 1: 120 | - | - | - | - | - | - |
| [database/sales-delivery-binding.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/sales-delivery-binding.test.ts#L376) | - | - | 1: 376 | - | - | - | - |
| [database/sales-estimating-binding.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/sales-estimating-binding.test.ts#L403) | - | - | 1: 403 | - | - | - | - |
| [database/service-finding-next-action-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/service-finding-next-action-upgrade.test.ts#L13) | - | - | 1: 105 | - | 1: 13 | - | - |
| [database/site-surveys-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/site-surveys-upgrade.test.ts#L148) | - | - | 1: 148 | - | - | - | - |
| [database/template-drafts-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/template-drafts-upgrade.test.ts#L57) | - | - | 1: 57 | - | - | - | - |
| [database/template-publication-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/template-publication-upgrade.test.ts#L78) | - | - | 1: 78 | - | - | - | - |
| [database/template-renderer-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/template-renderer-upgrade.test.ts#L74) | - | - | 1: 74 | - | - | - | - |
| [database/template-use-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/template-use-upgrade.test.ts#L70) | - | - | 1: 70 | - | - | - | - |

### Supplementary search inventory

Searches discover places to inspect; they are not assertion counts. The broad permission_grants search includes ordinary authorisation tests unrelated to migration preservation.

| Search / scope at baseline | Lines / files | Classification |
|---|---:|---|
| atVersion( | 9 / 2 | Two definitions, seven calls. Leads current setup at 48; fixed 17/18 stay historical. Assistant has parameterised historical setup and fixed 25. |
| Array.from regex in section 10 | 67 / 49 | Four migration-ledger expressions in three files: policy twice, commercial, specialist. Other 63 matches create unrelated fixtures/values. |
| seed_receipts or seedReceipts or oldReceipts | 128 / 48 | SQL/snapshot variables/assertions; classify whole expressions. |
| seed_receipts and NOT IN on the same line | 25 / 19 | Explicit seed exclusions, including repeated snapshot queries; conditional on seed effects. |
| SeedGrants( | 88 / 19 | Helper definitions/call lines, not 88 assertions. |
| NOT LIKE 'conversation.%' | 29 / 22 | Grant exclusions requiring a separate exact-addition proof. |
| permission_grants | 911 / 217 | Broad exposure including ordinary setup/permissions tests, not 217 upgrade proofs. |

Explicit seed-receipt version-list expectations located by the upgrade scans: S = current/added seed expectations (**14 sites in 14 files**); F = fixed seed singleton (**2 sites in 2 files**). Original receipt rows and replay assertions remain separately in the source.

| File under tests/ | Kind / assertion line | Change rule |
|---|---|---|
| [database/access-application.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/access-application.test.ts#L211) | S / 211 | Relevant seed effects only; preserve original receipts/replay. |
| [database/access-local-teams.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/access-local-teams.test.ts#L125) | S / 125 | Relevant seed effects only; preserve original receipts/replay. |
| [database/access-requests.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/access-requests.test.ts#L93) | S / 93 | Relevant seed effects only; preserve original receipts/replay. |
| [database/access-review-attestations.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/access-review-attestations.test.ts#L152) | S / 152 | Relevant seed effects only; preserve original receipts/replay. |
| [database/assistant-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/assistant-upgrade.test.ts#L68) | S / 68 | Relevant seed effects only; preserve original receipts/replay. |
| [database/conversations-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/conversations-upgrade.test.ts#L67) | S / 67 | Relevant seed effects only; preserve original receipts/replay. |
| [database/discovery-creation.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/discovery-creation.test.ts#L170) | S / 170 | Relevant seed effects only; preserve original receipts/replay. |
| [database/field-customer-response.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/field-customer-response.test.ts#L757) | S / 757 | Relevant seed effects only; preserve original receipts/replay. |
| [database/intake.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/intake.test.ts#L1220) | S / 1220 | Relevant seed effects only; preserve original receipts/replay. |
| [database/leads-projects-integration.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/leads-projects-integration.test.ts#L138) | S / 138 | Relevant seed effects only; preserve original receipts/replay. |
| [database/policy-persistence.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/policy-persistence.test.ts#L204) | S / 204 | Relevant seed effects only; preserve original receipts/replay. |
| [database/service-finding-next-action-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/service-finding-next-action-upgrade.test.ts#L83) | S / 83 | Relevant seed effects only; preserve original receipts/replay. |
| [database/site-surveys-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/site-surveys-upgrade.test.ts#L109) | S / 109 | Relevant seed effects only; preserve original receipts/replay. |
| [helpers/access-inspection-upgrade.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/helpers/access-inspection-upgrade.ts#L109) | S / 109 | Relevant seed effects only; preserve original receipts/replay. |
| [database/engineering-changes.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/engineering-changes.test.ts#L69) | F / 69 | Preserve fixed seed 30 singleton. |
| [database/engineering-materials.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/engineering-materials.test.ts#L57) | F / 57 | Preserve fixed seed 29 singleton. |

Bare/fixed pins missed by latest grep:

| File under tests/ | Line(s) | Kind and rule |
|---|---|---|
| demo/upgrade.test.ts | 255 | Bare added-migration count: baseline +100. Follows independent expected pending history. |
| demo/upgrade.test.ts | 97; 242 | Seed/user count 22; separate hosted migration history [1,2,3]. Neither follows local latest. |
| database/intake.test.ts; shared.test.ts; work-orders.test.ts | 219; 164; 198 | Historical bootstrap counts 4; 2; 4. Preserve. |
| database/assistant-upgrade.test.ts | 109 | Exactly one migration-110 row. Fixed idempotence/installation proof. |
| database/access-inspection.test.ts | 82 | Added [78], because this test explicitly migrates through 78. Fixed history. |
| database/maintenance-upgrade.test.ts | 44 | Current maximum read from production latest; pre-existing coupling, described in section 3. |

The grant/seed exclusion matrix below gives counts and locations per file. G = SeedGrants( source hits; X = conversation-prefix exclusions; E = seed-receipt NOT IN exclusions. Definitions and repeated queries count as source hits; neither is presented as a separate executed assertion.

| File under tests/ | G count: lines | X count: lines | E count: lines |
|---|---|---|---|
| [database/access-application.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/access-application.test.ts) | 2: 188, 194 | - | - |
| [database/access-inspection.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/access-inspection.test.ts) | 2: 70, 73 | - | - |
| [database/access-local-teams.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/access-local-teams.test.ts) | 2: 111, 117 | - | - |
| [database/access-requests.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/access-requests.test.ts) | 3: 70, 71, 75 | - | - |
| [database/access-review-attestations.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/access-review-attestations.test.ts) | 2: 127, 133 | - | - |
| [database/conversations-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/conversations-upgrade.test.ts) | 2: 70, 76 | 1: 53 | 1: 52 |
| [database/cpq-packages-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/cpq-packages-upgrade.test.ts) | - | 1: 46 | 1: 46 |
| [database/cpq.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/cpq.test.ts) | - | 2: 776, 884 | - |
| [database/discovery-creation.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/discovery-creation.test.ts) | 1: 168 | - | - |
| [database/document-library.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/document-library.test.ts) | - | 1: 643 | 1: 643 |
| [database/estimating-catalogue.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/estimating-catalogue.test.ts) | - | 1: 57 | 1: 57 |
| [database/excel-capacity-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/excel-capacity-upgrade.test.ts) | - | 1: 63 | 1: 63 |
| [database/excel-fx-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/excel-fx-upgrade.test.ts) | - | 1: 89 | 1: 89 |
| [database/excel-import-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/excel-import-upgrade.test.ts) | - | 1: 77 | - |
| [database/excel-landed-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/excel-landed-upgrade.test.ts) | - | 1: 94 | 1: 94 |
| [database/excel-reimport-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/excel-reimport-upgrade.test.ts) | - | 1: 53 | 1: 53 |
| [database/excel-source-pricing-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/excel-source-pricing-upgrade.test.ts) | - | 1: 71 | 1: 71 |
| [database/field-customer-response.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/field-customer-response.test.ts) | 3: 717, 720, 726 | - | - |
| [database/field-timer-boundaries.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/field-timer-boundaries.test.ts) | 3: 277, 280, 282 | - | - |
| [database/intake.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/intake.test.ts) | 1: 1219 | - | - |
| [database/maintenance-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/maintenance-upgrade.test.ts) | 3: 80, 85, 87 | - | - |
| [database/output-actions.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/output-actions.test.ts) | - | 1: 778 | - |
| [database/policy-persistence.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/policy-persistence.test.ts) | 2: 183, 185 | - | - |
| [database/products-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/products-upgrade.test.ts) | 14: 101, 102, 103, 104, 105, 106, 107, 110, 111, 112, 113, 114, 115, 121 | - | - |
| [database/project-commercial-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/project-commercial-upgrade.test.ts) | - | 4: 44, 65, 103, 113 | 4: 44, 65, 103, 113 |
| [database/project-programme.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/project-programme.test.ts) | - | 1: 409 | 1: 409 |
| [database/project-raid.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/project-raid.test.ts) | - | 1: 138 | 1: 138 |
| [database/project-specialist-handover-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/project-specialist-handover-upgrade.test.ts) | - | 1: 94 | 1: 94 |
| [database/project-specialist-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/project-specialist-upgrade.test.ts) | - | 4: 64, 85, 122, 132 | 4: 64, 85, 122, 132 |
| [database/project-specialist-work-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/project-specialist-work-upgrade.test.ts) | - | 1: 71 | 1: 71 |
| [database/quality-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/quality-upgrade.test.ts) | 14: 228, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 245, 249 | - | - |
| [database/quotation-release.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/quotation-release.test.ts) | 2: 528, 531 | - | - |
| [database/service-finding-next-action-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/service-finding-next-action-upgrade.test.ts) | 1: 82 | - | - |
| [database/site-surveys-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/site-surveys-upgrade.test.ts) | 1: 106 | - | - |
| [database/template-drafts-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/template-drafts-upgrade.test.ts) | - | 1: 39 | 1: 39 |
| [database/template-publication-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/template-publication-upgrade.test.ts) | - | 1: 60 | 1: 60 |
| [database/template-renderer-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/template-renderer-upgrade.test.ts) | - | 1: 59 | 1: 59 |
| [database/template-use-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/template-use-upgrade.test.ts) | - | 1: 52 | 1: 52 |
| [helpers/access-inspection-upgrade.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/helpers/access-inspection-upgrade.ts) | 7: 35, 36, 37, 38, 39, 43, 57 | - | - |
| [helpers/engineering-materials-grants.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/helpers/engineering-materials-grants.ts) | 23: 73, 106, 107, 109, 115, 119, 125, 134, 145, 150, 157, 169, 180, 190, 191, 200, 201, 205, 206, 210, 211, 222, 240 | - | - |

Quality upgrade additionally constructs the exact whole grant expectation, preserves revoked originals and permits only explicitly expected later additions at lines 147-249. The ordered seed/grant semantics in engineering-materials-grants.ts remain independently written expectations, not a migration-version oracle.

Original migration-ledger comparisons are history, not current-list copies. The following **80 assertion sites in 74 files** compare preserved local migration rows against pre-upgrade rows. This counts assertion call sites, not matching lines or parameterised executions; replay-only comparisons are excluded. Every site stays local and preserves its historical selector and row fields. The separate hosted identity comparison at demo/upgrade.test.ts:241 also stays unchanged. Source is the same baseline; inspect the whole assertion using git show 79bef1d3:tests/PATH, including variable definitions.

| File under tests/ | Preserved local migration assertion count: start line(s) |
|---|---|
| [database/access-application.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/access-application.test.ts#L199) | 1: 199 |
| [database/access-inspection.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/access-inspection.test.ts#L78) | 1: 78 |
| [database/access-local-teams.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/access-local-teams.test.ts#L122) | 1: 122 |
| [database/access-requests.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/access-requests.test.ts#L81) | 1: 81 |
| [database/access-review-attestations.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/access-review-attestations.test.ts#L140) | 1: 140 |
| [database/access-withdrawal.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/access-withdrawal.test.ts#L154) | 1: 154 |
| [database/assistant-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/assistant-upgrade.test.ts#L61) | 2: 61, 107 |
| [database/conversations-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/conversations-upgrade.test.ts#L65) | 1: 65 |
| [database/cpq-packages-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/cpq-packages-upgrade.test.ts#L75) | 1: 75 |
| [database/cpq.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/cpq.test.ts#L783) | 2: 783, 895 |
| [database/crm.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/crm.test.ts#L642) | 1: 642 |
| [database/discovery-creation.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/discovery-creation.test.ts#L163) | 1: 163 |
| [database/document-library.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/document-library.test.ts#L658) | 1: 658 |
| [database/equipment.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/equipment.test.ts#L607) | 1: 607 |
| [database/estimating-catalogue.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/estimating-catalogue.test.ts#L321) | 1: 321 |
| [database/estimating-workspaces.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/estimating-workspaces.test.ts#L711) | 1: 711 |
| [database/estimating.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/estimating.test.ts#L130) | 2: 130, 187 |
| [database/excel-capacity-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/excel-capacity-upgrade.test.ts#L81) | 1: 81 |
| [database/excel-fx-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/excel-fx-upgrade.test.ts#L107) | 1: 107 |
| [database/excel-import-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/excel-import-upgrade.test.ts#L60) | 1: 60 |
| [database/excel-landed-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/excel-landed-upgrade.test.ts#L112) | 1: 112 |
| [database/excel-reimport-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/excel-reimport-upgrade.test.ts#L71) | 1: 71 |
| [database/excel-source-pricing-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/excel-source-pricing-upgrade.test.ts#L89) | 1: 89 |
| [database/field-customer-response.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/field-customer-response.test.ts#L753) | 1: 753 |
| [database/field-timer-boundaries.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/field-timer-boundaries.test.ts#L238) | 1: 238 |
| [database/finance-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/finance-upgrade.test.ts#L82) | 2: 82, 191 |
| [database/inspection-attribution-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/inspection-attribution-upgrade.test.ts#L185) | 1: 185 |
| [database/intake.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/intake.test.ts#L204) | 2: 204, 1224 |
| [database/leads-amendments.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/leads-amendments.test.ts#L354) | 1: 354 |
| [database/leads-projects-integration.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/leads-projects-integration.test.ts#L57) | 2: 57, 81 |
| [database/maintenance-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/maintenance-upgrade.test.ts#L72) | 1: 72 |
| [database/nursery-assessment.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/nursery-assessment.test.ts#L171) | 1: 171 |
| [database/nursery-automation.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/nursery-automation.test.ts#L247) | 1: 247 |
| [database/outcome-sources.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/outcome-sources.test.ts#L377) | 1: 377 |
| [database/output-actions.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/output-actions.test.ts#L757) | 1: 757 |
| [database/planner.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/planner.test.ts#L237) | 1: 237 |
| [database/policy-persistence.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/policy-persistence.test.ts#L191) | 1: 191 |
| [database/products-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/products-upgrade.test.ts#L126) | 1: 126 |
| [database/project-baselines.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/project-baselines.test.ts#L269) | 1: 269 |
| [database/project-commercial-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/project-commercial-upgrade.test.ts#L55) | 1: 55 |
| [database/project-programme.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/project-programme.test.ts#L421) | 1: 421 |
| [database/project-raid.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/project-raid.test.ts#L142) | 1: 142 |
| [database/project-specialist-handover-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/project-specialist-handover-upgrade.test.ts#L106) | 1: 106 |
| [database/project-specialist-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/project-specialist-upgrade.test.ts#L75) | 1: 75 |
| [database/project-specialist-work-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/project-specialist-work-upgrade.test.ts#L83) | 1: 83 |
| [database/quality-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/quality-upgrade.test.ts#L251) | 1: 251 |
| [database/quotation-allocation-shortfall.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/quotation-allocation-shortfall.test.ts#L817) | 1: 817 |
| [database/quotation-conversion.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/quotation-conversion.test.ts#L502) | 1: 502 |
| [database/quotation-disposition.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/quotation-disposition.test.ts#L740) | 1: 740 |
| [database/quotation-material-resolution.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/quotation-material-resolution.test.ts#L873) | 1: 873 |
| [database/quotation-receipt-correction.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/quotation-receipt-correction.test.ts#L579) | 1: 579 |
| [database/quotation-release.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/quotation-release.test.ts#L508) | 1: 508 |
| [database/quotation-reservation-reconciliation.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/quotation-reservation-reconciliation.test.ts#L414) | 1: 414 |
| [database/quotation-response.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/quotation-response.test.ts#L439) | 1: 439 |
| [database/quotation-supply-followup.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/quotation-supply-followup.test.ts#L592) | 1: 592 |
| [database/quotation-task-branch.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/quotation-task-branch.test.ts#L741) | 1: 741 |
| [database/quotation-task-chain.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/quotation-task-chain.test.ts#L642) | 1: 642 |
| [database/quotation-task-dependency.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/quotation-task-dependency.test.ts#L500) | 1: 500 |
| [database/quotation-task-diamond.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/quotation-task-diamond.test.ts#L483) | 1: 483 |
| [database/quotation-task-merge.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/quotation-task-merge.test.ts#L1104) | 1: 1104 |
| [database/sales-delivery-binding.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/sales-delivery-binding.test.ts#L375) | 1: 375 |
| [database/sales-estimating-binding.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/sales-estimating-binding.test.ts#L402) | 1: 402 |
| [database/sales-workflows.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/sales-workflows.test.ts#L729) | 1: 729 |
| [database/service-finding-next-action-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/service-finding-next-action-upgrade.test.ts#L91) | 1: 91 |
| [database/shared.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/shared.test.ts#L145) | 1: 145 |
| [database/site-surveys-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/site-surveys-upgrade.test.ts#L134) | 1: 134 |
| [database/template-drafts-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/template-drafts-upgrade.test.ts#L51) | 1: 51 |
| [database/template-publication-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/template-publication-upgrade.test.ts#L72) | 1: 72 |
| [database/template-renderer-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/template-renderer-upgrade.test.ts#L71) | 1: 71 |
| [database/template-use-upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/template-use-upgrade.test.ts#L64) | 1: 64 |
| [database/work-orders.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/database/work-orders.test.ts#L174) | 1: 174 |
| [demo/upgrade.test.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/demo/upgrade.test.ts#L237) | 1: 237 |
| [helpers/crm-owner-transfer-cases.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/helpers/crm-owner-transfer-cases.ts#L898) | 1: 898 |
| [helpers/estimating-cost-basis-cases.ts](https://github.com/deanrfiedler-gif/powerplants-one/blob/79bef1d32f42cd2dcdbf04ce0f30a4374199db2e/tests/helpers/estimating-cost-basis-cases.ts#L219) | 1: 219 |

Field timer boundaries preserves version/sha256/applied_at. Products and Maintenance preserve membership around the missing 52/51, not merely a prefix. Commercial/specialist retain the selected historical cutoff. Quotation release/response/conversion retain all original rows through 58/59/60. Original seed-row comparisons (for example field-customer-response:756, policy-persistence:203 and Maintenance:73), mixed table snapshots and replay/rollback checks remain alongside these migration-only sites. Stage 3 must inventory every parameter and snapshot as well as these call sites before conversion.

## 9. Corrective-commit audit trail

These exact commits account for the **33 non-merge fixes** under section 4's definition. V = contains migration-version/history expectation repair (including mixed fixes); G = grant/seed expectation repair without V; O = other test repair. Full test diffs were read for every listed commit. V takes precedence for mixed commits; it does not mean all changes in that commit are avoidable. Reproduce with git show --format=fuller --stat SHA and git show SHA -- tests/. Classification remains reviewable without local scratch files.

| PR | Included corrective test commits after first PR CI |
|---|---|
| #665 | [d7543ea181](https://github.com/deanrfiedler-gif/powerplants-one/commit/d7543ea181) **O**, [7b5e01b75e](https://github.com/deanrfiedler-gif/powerplants-one/commit/7b5e01b75e) **V** |
| #662 | [51f19eba7c](https://github.com/deanrfiedler-gif/powerplants-one/commit/51f19eba7c) **O** |
| #659 | [a9b9f7b018](https://github.com/deanrfiedler-gif/powerplants-one/commit/a9b9f7b018) **O**, [9f516a9003](https://github.com/deanrfiedler-gif/powerplants-one/commit/9f516a9003) **O**, [41eb6ceaae](https://github.com/deanrfiedler-gif/powerplants-one/commit/41eb6ceaae) **O**, [b54c44bf7d](https://github.com/deanrfiedler-gif/powerplants-one/commit/b54c44bf7d) **O**, [a9ec34898d](https://github.com/deanrfiedler-gif/powerplants-one/commit/a9ec34898d) **O** |
| #650 | [d7287038a9](https://github.com/deanrfiedler-gif/powerplants-one/commit/d7287038a9) **O**, [ee17829bf0](https://github.com/deanrfiedler-gif/powerplants-one/commit/ee17829bf0) **V**, [8922e59afc](https://github.com/deanrfiedler-gif/powerplants-one/commit/8922e59afc) **O**, [4d5f22e466](https://github.com/deanrfiedler-gif/powerplants-one/commit/4d5f22e466) **O**, [1427504299](https://github.com/deanrfiedler-gif/powerplants-one/commit/1427504299) **O**, [1172286157](https://github.com/deanrfiedler-gif/powerplants-one/commit/1172286157) **V** |
| #637 | [94bdf65ab2](https://github.com/deanrfiedler-gif/powerplants-one/commit/94bdf65ab2) **O**, [067c5273f2](https://github.com/deanrfiedler-gif/powerplants-one/commit/067c5273f2) **O**, [48673e879c](https://github.com/deanrfiedler-gif/powerplants-one/commit/48673e879c) **O**, [9df1941675](https://github.com/deanrfiedler-gif/powerplants-one/commit/9df1941675) **O** |
| #569 | [4247035137](https://github.com/deanrfiedler-gif/powerplants-one/commit/4247035137) **V**, [a8fc8e118e](https://github.com/deanrfiedler-gif/powerplants-one/commit/a8fc8e118e) **V** |
| #568 | [8311f62ce3](https://github.com/deanrfiedler-gif/powerplants-one/commit/8311f62ce3) **G**, [51fc1c7024](https://github.com/deanrfiedler-gif/powerplants-one/commit/51fc1c7024) **G**, [2a21ebeddb](https://github.com/deanrfiedler-gif/powerplants-one/commit/2a21ebeddb) **G**, [f62284ea34](https://github.com/deanrfiedler-gif/powerplants-one/commit/f62284ea34) **V**, [0b6fd90ab0](https://github.com/deanrfiedler-gif/powerplants-one/commit/0b6fd90ab0) **G**, [565d5ca486](https://github.com/deanrfiedler-gif/powerplants-one/commit/565d5ca486) **V**, [adc7c5a1ba](https://github.com/deanrfiedler-gif/powerplants-one/commit/adc7c5a1ba) **G**, [b6d69e16bf](https://github.com/deanrfiedler-gif/powerplants-one/commit/b6d69e16bf) **G**, [88e7a1fbb0](https://github.com/deanrfiedler-gif/powerplants-one/commit/88e7a1fbb0) **G**, [2bbfe34d96](https://github.com/deanrfiedler-gif/powerplants-one/commit/2bbfe34d96) **G** |
| #563 | None under the stated definition |
| #530 | None: both previously listed commits are merges, excluded below |
| #522 | [6b646d162e](https://github.com/deanrfiedler-gif/powerplants-one/commit/6b646d162e) **V**, [abaf10d741](https://github.com/deanrfiedler-gif/powerplants-one/commit/abaf10d741) **O**, [459112db19](https://github.com/deanrfiedler-gif/powerplants-one/commit/459112db19) **O** |
| #521 | None under the stated definition |
| #498 | None under the stated definition |

Examples excluded: initial implementation/ripple commits; #665's 4cbddede90 (new regression coverage for a production fix); #659's f6f2c6dc53 (new coverage); #522's 263eb7104a (formatting); #521's 2ef5f63b6c/af79e1757e (new renderer regression coverage/integration); #498's e4c9c8bb18 (new regression coverage). #530's 78279086a5 and 3c31e64855 each have two parents (`git show -s --format=%P SHA`): both are excluded even though the latter restores pre-existing demo tests. The corrected categories total **V 8 + G 8 + O 17 = 33**. #568's f62284ea34 repairs a Products expected-version branch, not a grant helper; 565d5ca486 repairs computed range lengths. #650's ee17829bf0 and #522's 6b646d162e include other fixes alongside version expectations. #569's a8fc8e118e is a deliberate renumber repair, separate from its earlier computed-range repair. This is repair work, not author performance or a causal count of CI-induced pushes.

## 10. Reproduction commands and limitations

Use the named baseline for source locations. On this Windows machine python is the installed Python 3 equivalent of python3. No PostgreSQL, server, browser suite or application build is needed for this analysis.

~~~sh
git show 79bef1d3:AGENTS.md
git grep -nwE '0?117' 79bef1d3 -- tests/
git grep -nF 'atVersion(' 79bef1d3 -- tests/
git grep -nE 'Array\.from\(\{[[:space:]]*length:' 79bef1d3 -- tests/
git grep -nE 'seed_receipts|seedReceipts|oldReceipts' 79bef1d3 -- tests/
git grep -nE 'seed_receipts.*NOT IN|NOT IN.*seed_receipts' 79bef1d3 -- tests/
git grep -nE 'SeedGrants\(' 79bef1d3 -- tests/
git grep -nF "NOT LIKE 'conversation.%'" 79bef1d3 -- tests/
git grep -nF 'permission_grants' 79bef1d3 -- tests/
git grep -nE 'latestMigrationVersion|migrationFiles|seedFiles' 79bef1d3 -- tests/
git log -12 --first-parent --format='%H %s' 79bef1d3 -- db/migrations/
git show 79bef1d3:scripts/migration-registry.ts
git show 79bef1d3:scripts/check_migrations.py
git show 79bef1d3:scripts/demo-upgrade.ts
~~~

Count output lines and unique paths, not numeric occurrences. Section 8 supplies the explicit per-line classification; sum its cells to reproduce the totals. Read whole assertions and variable definitions. Select the four Array.from ledger expressions after inspection, rather than counting all 67 matches as migration expectations. Registry entry count is the number of quoted SQL filenames in its migrationFiles block, excluding comments; its explicit sparse version list is 1-15 and 17-117.

For each PR N in section 4, these commands produce metadata, complete file sets, commits and workflow histories:

~~~sh
gh pr view N --repo deanrfiedler-gif/powerplants-one --json number,title,headRefOid,headRefName,createdAt,mergedAt,closedAt
gh api --paginate --slurp 'repos/deanrfiedler-gif/powerplants-one/pulls/N/files?per_page=100'
gh api --paginate --slurp 'repos/deanrfiedler-gif/powerplants-one/pulls/N/commits?per_page=100'
gh api --paginate --slurp 'repos/deanrfiedler-gif/powerplants-one/actions/runs?branch=HEAD_BRANCH&event=pull_request&per_page=100'
gh run view RUN_ID --repo deanrfiedler-gif/powerplants-one --log-failed
git show --format=fuller --stat COMMIT
git show COMMIT -- tests/
~~~

Flatten paginated files arrays and count unique filename values starting with tests/. Substitute headRefName for HEAD_BRANCH. Retain runs created at/after PR creation and at/before merge/closure if closed. This excludes previous PR runs on reused branches (#650/#659). Find the earliest retained run's created_at, compare corrective-commit committer dates and inspect the diff. Count unique failed run IDs; assign a missed-expectation cause only after inspecting actual/expected differences. Expected exception logs in passing negative tests are not evidence of a CI failure.

The overlap cohort comes from:

~~~sh
gh pr list --repo deanrfiedler-gif/powerplants-one --state all --limit 300 --search 'created:2026-10-14T00:00:00Z..2026-10-24T06:21:37Z' --json number,title,createdAt,closedAt,mergedAt,headRefOid,headRefName
~~~

The exact UTC creation cutoff retains the original 211 PR IDs even after newer PRs appear. Read all filenames for each of the 211 PRs (paginated files endpoint, or equivalent GraphQL files connection through hasNextPage=false). Retain the 31 with a db/migrations/ path. Open intervals overlap when max(createdAt) < min(closedAt), treating open PRs as unbounded at the observation. Intersect tests/ sets and take each row's largest intersection. #673/#689's intersection equals section 8's file set plus demo/upgrade.test.ts. Use `git merge-base --is-ancestor HEAD_A HEAD_B` in both directions to flag final-head relationships as in section 4. This proves path overlap, not hunk conflicts or independent concurrent edits. Refresh current heads before any later replay; the merged heads/source baseline above stay fixed.

For the Products case count, read `git show 79bef1d3:tests/database/products-upgrade.test.ts` and count the comma-separated entries in the `for (const through of [...])` array at line 39. For the added fixture/replay inventory, use `git show 79bef1d3:PATH` at the locations in section 6. For commit categories use full diffs (not subjects alone); inspect parents with `git show -s --format=%P SHA`. For run subcategories use each cited `gh run view RUN_ID --log-failed` and read the failed assertions and any other failures in that run. The lists in sections 4 and 9 specify the complete classifications.

The sample does not measure engineering hours, runner minutes saved or future failures prevented. Accessible latest-attempt histories can omit prior failures after reruns; retention can later remove logs. Results are explicitly bounded to the observed histories. Commands and immutable identifiers are retained here; ignored analysis files are not an additional authoritative register.

## 11. Scope, checks and review disposition

Only this paper, its dated status fragment and document-register entry change. No tests, scripts, db, src, workflows, AGENTS.md or shared landing pages change. No migration reservation, new dependency, business transaction, provider call, deployment or customer communication is part of the proposal. Dean explicitly clarified that GitHub calls for this task are allowed; business-provider calls remain prohibited.

Migration numbering, checksums, transaction boundaries, database safety guards, schema, all 78 parent IDs, historical evidence, hosted identity and the release-review gate remain. This paper neither adopts a business rule nor establishes production readiness.

Requested validation: check_foundation.py, check_naming.py, build_status.py --check, test_documentation*.py unit tests; after committing, check_documentation_scope.py --base origin/main --head HEAD. Fetch/merge origin/main before every push. Retain head-specific local and CI results in the draft PR. No local database, server, browser suite or npm run build is run for this paper.

**Claude review received and verified.** The [review comment](https://github.com/deanrfiedler-gif/powerplants-one/pull/692#issuecomment-6382123817), posted 2026-10-24T08:42:21Z, reviewed b7afa1bc760d44906122d9dd233c00ebf00ac4e5. It explicitly was neither approval nor request for changes. The author read the affected source, commit diffs/parents, failed-run logs and PR metadata; dispositions follow. No expression-equivalence or mutation harness has been executed, and the corrected paper awaits Claude's follow-up review.

| Finding | Disposition | Verification and correction |
|---|---|---|
| H1: costs exceed D's scope | Accepted; prevention claim not established | Full commit diffs give 8 V, 8 G, 17 O non-merges. Failed logs give 14 V-only, 2 V+G, 1 V+other, 10 G-only and 28 other runs. Sections 2/4/9 separate them and make no measured prevention claim. |
| H2: late-fixture coupling | Accepted | Six cited setup families read at 79bef1d3; section 6 inventories each and adds independent pre-upgrade set checks. Maintenance:44 becomes full intended current-minus-51, with strengthening distinct from equivalence. |
| M1: independence overstated / option F | Partly accepted | E=R on green branches is stated; F is compared. Separate maintenance still detects correlated file/registry omissions, so it is more than a reviewer delta. Stage 7 adds that mutation; no SQL-semantic independence is claimed. |
| M2: two merge commits | Accepted | Both #530 SHAs have two parents. Excluded: total 33 and #530 zero, preserving the original non-merge definition. |
| M3: #673 seed claim / stale state | Accepted | Full measured files and registry diff show no seed. Corrected sentence and timestamped PR state observation; #689 had also merged into its parent feature branch by the later observation, not main. Historical measured heads remain fixed. |
| M4: overlap ancestry | Accepted | Both-direction merge-base checks flag all ten non-zero rows, not only the five named in review. Raw maxima retained; independent contemporaneous overlap unmeasured. Final ancestry alone does not establish original dependence. |
| M5: five-path assumption | Partly accepted | Only Products has the prior written newest-case rule; all four is now explicit proposed implementation policy approved by Dean. G compares automatic cases and a one-path counterfactual, but does not silently replace Dean's explicit-case choice. Demo's identical 100-to-101 edits illustrate a semantic merge fault. |
| L1: Array.from count | Accepted | Same section 10 regex at 79bef1d3 gives 67 lines / 49 files, with four ledger expressions and 63 other matches. |
| L2: moving cohort | Accepted | Exact inclusive UTC creation cutoff 2026-10-24T06:21:37Z reproduces the original 211 IDs. |
| L3: demo gate | Accepted | Source literal and #522's cited TS2367 logs establish compile-time enforcement plus runtime guard. Contract and proposed AGENTS wording corrected. |
| L4: replay and rollback | Accepted | Four cited source families added as a supplement, with a full-inventory requirement and explicit failed-upgrade rollback fault in stage 7. |
| L5: absent Products assertions | Accepted | Guard through >= 71 leaves 25/48 without exact additions. Manifest records absence; adding such a check is a distinct strengthening. |
| L6: owner | Accepted | Dean is owner; Codex for Dean is author. Status fragment and PR metadata wording aligned. |
| L7: check and suite pointers | Accepted | Proposed unit-test path and Node/tsx command named; FI-01, FI-07, both Estimating suites and demo added-user count pointers retained. |
| L8: prefix assumption | Accepted as a conditional risk | Prefix checks require originals to remain a prefix; late interleaving needs explicit detection and separately reviewed identity-based full-row preservation. No unverified approximate count is promoted to a measurement; no-reservation files do not establish a quiet window. |

The review's closing statement that Dean's decision remains open is superseded by his explicit approval of all five recommendations. Review remains a separate matter. Leave PR #692 draft pending follow-up; do not merge, enable auto-merge or begin implementation. Record head-specific validation and the next Claude prompt in the PR.
