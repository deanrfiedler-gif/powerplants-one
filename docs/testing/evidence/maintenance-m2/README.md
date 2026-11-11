# Maintenance M2 backend evidence

Scope: PPO-MAINTENANCE-TS02-DEC M-R3, following M1 and B4. [PR #904](https://github.com/deanrfiedler-gif/powerplants-one/pull/904). Synthetic local source delivery only; no merge, deployment or business acceptance.

The source-local helper reads the current authorised approved scope assessment after existing Finance authority. Project links take precedence. Covered plus an agreement reference yields a NonBillable default; missing/disputed coverage does not. Explicit Billable decisions require a reason. Existing B4 checks remain at submission, approval and begin processing. No schema, grant, dependency or UI change.

## Verification boundary

Cloud setup succeeded with Node 24.21.0, npm 11.19.0 and PostgreSQL 16.15. The explicit browser probe fails: `/opt/google/chrome/chrome` is absent. Commands that require documents therefore use the existing opt-in `project-claims-synthetic-renderer.mjs`, enabled only on `ppo_synthetic_test`. These are command/persistence proofs, not rendered PDF or browser evidence. Normal rendered suites remain for CI.

Tests cover native Covered references and all non-default coverage states, missing reference, protected-source refusal, native draft reassessment without rewriting historical coverage, project precedence/persisted reasons and original-operation replay. Existing B4 regressions cover changed links at all three boundaries, revised drafts and no-posting reconciliation. A policy unit case proves the reason requirement for Billable exceptions. These proofs do not execute a complete agreement-covered service attendance or TS-02 acceptance.

Initial new-suite run: six passed and one test expected the wrong validation error code (`ValidationFailed` instead of the existing `InvalidData`). The assertion was corrected; validation behavior was unchanged. Final results are recorded below after execution.

## Final local results

- `npm run check` passed: Studio coverage, lint, TypeScript, all **1,450 unit tests**, production build.
- **8/8 new M2 database cases** passed after correcting a missing helper import caught by TypeScript and the test run. **15/15 existing B4 database cases** passed in the retained combined run. All document-dependent cases use the explicitly labelled synthetic renderer boundary above. The combined intermediate run had 22/23 passes before the import fix; the complete corrected M2 suite was then rerun and passed.
- Foundation, prototype, naming, migration numbering and status-source checks passed; **44 documentation tests** passed. `git diff --check` passed. Documentation-scope checks are recorded with the final commit.
- Browser probe failed because Chrome is absent. Normal rendered database, HTTP/browser suites and database-process restart were not run locally. Full final-head CI and independent Claude review remain required. No complete agreement-covered service attendance, TS-02 acceptance, live ERP operation, merge or deployment is claimed.

## Continuation validation — 11 November 2026

This session resumed the released M2 claim at `6b26031e0b8bb81222a040b64d874fb67fa70709` in its own worktree. Main remains `9926da5fa9a3b60fbc22843d25ddea1af4830bf5`; M2 and C1 are still unmerged drafts, so C1 remains stacked on M2. There were no M2 review submissions or inline threads at inspection. People #897 is untouched. The three-build limit is reached; this follow-up changes only M2 execution evidence and status, while C1 #905 owns the attributable Contacts CI fix and additional recovery proof.

Fresh cloud setup in the sibling C1 worktree succeeded with Node 24.21.0, npm 11.19.0 and PostgreSQL 16.15. M2 installed its unchanged lockfile locally with `npm ci`, copied the disposable local configuration and sourced `/workspace/work/.ppo-tools/env.sh`. The fresh `npm run browser:check` probe confirms missing `/opt/google/chrome/chrome`; normal real-renderer/HTTP/browser suites remain unrun locally. No system Chromium substitution is made.

Executed from the M2 worktree, separately from all C1 database/HTTP mutations:

```sh
source /workspace/work/.ppo-tools/env.sh
PPO_B2_SYNTHETIC_RENDERER=command-proof-only node --env-file=.env.local --experimental-test-module-mocks --import tsx --import ./tests/helpers/project-claims-synthetic-renderer.mjs --test --test-concurrency=1 --test-timeout=300000 tests/database/finance-agreement-defaults.test.ts tests/database/finance-project-work.test.ts tests/database/finance-project-ts01.test.ts
```

The optional helper emits synthetic stored bytes. This is command/persistence evidence, not rendered PDFs, layout, browser behavior or full TS-01/02 acceptance. The per-case local timeout is 300 seconds; repository and CI deadlines remain unchanged. Earlier M2 application-check results above are retained history; this continuation does not claim another standalone M2 full application run. C1's fresh 1,452-unit application check includes the inherited M2 implementation and is recorded separately.

GitHub's incoming M2 workflow summaries succeeded, but the draft's runtime suites are skipped; full final-head CI and independent Claude review remain required. C1 must retarget and revalidate after Dean merges M2. No merge, deployment or operational Finance acceptance is claimed.

Result: **24/24 cases passed** — all eight M2 cases, fifteen B4 boundary regressions and the connected TS-01 Finance component. The component retains cost-only field evidence, exact M1–M4/V-01 amounts, native closeout before historical reconciliation. This is the bounded existing fixture, not all TS-01 visits/hours or an agreement-covered attendance execution. [Actual case results](continuation-database.txt) retain the names, timings and aggregate result. No case failed in this fresh run.

## Independent review corrections — 11 November 2026

Claude's [review of 9c29ef63a](https://github.com/deanrfiedler-gif/powerplants-one/pull/904#pullrequestreview-5851541506) found M2-1 (unapproved draft coverage advertised as a default) and M2-2 (linked-work reason fallback contract ambiguity). This session resumed the released branch with [claim](https://github.com/deanrfiedler-gif/powerplants-one/pull/904#issuecomment-6783151207), integrated current main `2d9a8ff24` without conflicts, and corrected both. The helper now reads only the authorised approved scope when it is also current. Project precedence is unchanged. The B4 contract explicitly limits omitted-reason fallback to NonBillable lines.

New negative cases cover never-authorised Covered drafts, a Covered successor of approved Covered work, and the existing unfinished successor of approved Disputed work. Historical authorised coverage is retained. The positive fixture is an actually authorised Covered WorkOrder. Before the fix, two assertions reproduced the advertised-default defect; the third case initially selected the seeded unfinished scope without coverage and failed in fixture setup. It was corrected to use the authorised scope and existing draft. The first broad run still used that initial fixture; its result is retained separately from the corrected rerun. No runtime assertion was relaxed.

Environment setup command: `PPO_TOOLS_DIR=/workspace/.ppo-tools PPO_DOCUMENT_DIRECTORY=/workspace/work/synthetic-documents bash scripts/cloud-setup.sh`. Node 24.21.0/npm 11.19.0/PostgreSQL 16.15 ready; browser unavailable. `npm run browser:check` independently fails with Chrome absent at `/opt/google/chrome/chrome`. Every command below sources `/workspace/.ppo-tools/env.sh`. No system browser substitution.

```sh
# Before-fix reproduction (two genuine assertion failures and one fixture error):
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-name-pattern='unapproved Covered successor|unauthorised Covered' tests/database/finance-agreement-defaults.test.ts
# First broad run, before the disputed fixture correction:
PPO_B2_SYNTHETIC_RENDERER=command-proof-only node --env-file=.env.local --experimental-test-module-mocks --import tsx --import ./tests/helpers/project-claims-synthetic-renderer.mjs --test --test-concurrency=1 --test-timeout=300000 tests/database/finance-agreement-defaults.test.ts tests/database/finance-project-work.test.ts
# Corrected disputed-successor fixture, unmocked (other cases already passed):
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=300000 --test-name-pattern='authorised work 8' tests/database/finance-agreement-defaults.test.ts
npm run check
```

Final local result: `npm run check` passed (1,450 unit tests, Studio, lint, TypeScript and production build). The broad run passed all 15 B4 cases and eight M2 cases; the only failure was the disputed-successor fixture described above. Its corrected unmocked rerun passed 1/1. Thus all nine M2 and 15 B4 cases are covered across these runs, not a claimed single green broad run. [Before-fix output](review-before.txt), [broad run](review-broad.txt) and [corrected fixture](review-corrected.txt) retain exact results. Foundation/prototype/naming/migration/status checks and all 44 documentation tests passed; documentation-scope is checked after commit. Synthetic-byte cases remain command/persistence proof only; no PDF/browser or full TS-01/02 execution is claimed. No migration, grant, seed or UI change. Claude finding confirmation on the final head and full final-head runtime CI remain separate gates. C1 stays stacked until Dean merges M2.
