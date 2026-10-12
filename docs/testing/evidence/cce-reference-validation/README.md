# CCE reference validation evidence

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **Status:** retained synthetic reference evidence with documented publication adaptations. **Review:** author checks; independent engineering/security and business review outstanding. Prepared 12 October 2026. This package does not install or activate the proposed CCE.

Read the [technical specification](../../../architecture/cce-technical-specification.md), [publication/architecture proposal](../../../decisions/cce-architecture-proposal.md) and [Figma design prompt](../../../delivery/cce-figma-design-prompt.md).

## Evidence boundaries

| Record | Meaning |
|---|---|
| `verification-summary.json` and root result files | Historical execution at `ba1f4e3c155ce6a45dc15e87689de01d42a47e1f`; Node 24.21.0, TypeScript 6.0.3, PostgreSQL 16.15, Python 3.14, Ajv 8.17.1 / ajv-formats 3.0.1 |
| `native-schema-result.json` | 76 native migrations through 0077; not current-main migration compatibility |
| `database-result.json` | 24 synthetic contract-parent scenarios, including concurrency and refusal cases |
| `native-journey-result.json` | Five native-command probes; native save and CCE evidence attachment used separate transactions |
| `persisted-workflow-result.json` | Four material-profile persistence scenarios; not a production adoption command |
| `populated-upgrade-result.json` | 369 native tables / 646 rows and three estimate versions preserved in one baseline clone |
| `restart-result.json` | Twelve table-set digests preserved across a clean stop/start of the task-owned cluster |
| `publication-validation.json` | Fresh publication assurance and explicitly identified pure reference replays; no new SQL/native/restart execution |
| `import-manifest.json` | Original archive/report/prompt hashes, original-to-published paths, original and adapted file hashes |
| `SHA256SUMS.json` | Current published evidence bytes, excluding itself; integrity evidence, not a signature or owner acceptance |
| `provenance/original-SHA256SUMS.json` | Exact original archive member hashes; must not be interpreted as hashes of adapted scripts |
| `provenance/prior-report.md.txt` | Superseded research report, retained unchanged as plain text (including its original broken heading anchors); not the working specification |

The 43-member source archive was verified against all 42 original member entries before import. Original results remain historical. Machine-specific paths in five JSON files were redacted; outcomes and recorded test/source hashes were retained. Six database harness scripts use a new explicit baseline resolver; the restart executable is supplied by environment. The expression test uses a `.js` import specifier resolved to the unchanged TypeScript implementation, so retained examples also typecheck under the repository configuration. These adaptations are identified per file in the import manifest and do not inherit an executed database result. The original README and manifest are retained unchanged under `provenance/`.

The publication base is `4228d470ca4c566a15e7c3397fc053b8f7bef4bc`, which includes migration 0083. Further compatibility requires a new source-bound database run. Historical failed attempts remain in `database-attempt-1.json` and `native-journey-attempt-*.json`; successful later cases do not erase them.

## Publication check outcome

Fresh pure checks passed: 18 valid and 26 invalid schema cases plus three semantic-gap demonstrations; 20 expression positives, 43 refusals and 220 generated cases; 5,000 Python rational-arithmetic comparisons; 34 material-workflow scenarios; eight worked examples; and strict expression compilation. Repository foundation, prototype, naming, studio and TypeScript checks passed after the recorded publication repairs. All 78 parent requirements and 22 issued-source checks remain intact. Studio reports 330 unreviewed pages, 28 stale page reviews and 42 pending component reviews; integrity checks do not accept those designs.

No SQL/native/restart harness was executed for this publication. The original local foundation attempt timed out; the final check excluded only the pre-existing untracked `.worktrees/` directory through command-scoped Git configuration. Naming, retained-test import, generated-route-type and appendix-link repairs are retained in the publication ledger with the earlier failed outputs. The owner’s narrowed scope is authoring data/rules/conditions and CPQ, integrating with existing wizard/quotation pages.

## Verify published bytes

From the repository root run `python -X utf8 docs/testing/evidence/cce-reference-validation/verify-package.py`. It verifies the complete published hash inventory, original/imported digest mapping and the report’s SQL, JSON Schema and expression implementation blocks. It does not run a database or modify evidence. Git attributes preserve the one original CRLF script and keep publication logs stable across checkouts.

## Safe reproduction of pure checks

Use a disposable copy of this directory outside the checkout: several harnesses write result or fixture files beside their source. Never run them in the retained evidence directory. Keep fresh outputs separate from the original records.

Prerequisites are an available PPO checkout with its locked development dependencies and Node/Python versions recorded for the new run. The pinned validator package is evidence-only; it is not added to PPO dependencies or runtime.

Example in PowerShell, with the checkout as the working directory:

```powershell
$cceRepo = (Get-Location).Path
$cceRun = Join-Path ([System.IO.Path]::GetTempPath()) ('ppo-cce-replay-' + [guid]::NewGuid().ToString('N'))
Copy-Item -LiteralPath 'docs/testing/evidence/cce-reference-validation' -Destination $cceRun -Recurse
npm ci --prefix "$cceRun/validator" --ignore-scripts --no-audit --no-fund
node "$cceRun/schema-2020-check.cjs"
node "$cceRun/schema-coverage.cjs"
node --import tsx "$cceRun/expression-check.ts"
python -X utf8 "$cceRun/generate-oracle.py"
node --import tsx "$cceRun/oracle-check.mjs"
node --import tsx "$cceRun/workflow-check.mjs"
node --import tsx "$cceRun/commercial-check.mjs"
node node_modules/typescript/bin/tsc --ignoreConfig --strict --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --skipLibCheck --typeRoots "$cceRepo/node_modules/@types" "$cceRun/expression.ts"
```

The reference workflow is material-only. Its in-memory delivery model is not a durable outbox or provider integration. The structural schema accepts some constructs requiring semantic checks; the three semantic-gap fixtures document that boundary. Use the full report for unsupported actions, units, conditions and runtime isolation obligations.

## Database reproduction prerequisites and sequence

Database scripts are reference harnesses, not application migrations. They must use a clean disposable checkout of the exact historical commit. Set `CCE_REPO_ROOT` to that checkout's absolute path and install its locked dependencies there. The publication helper refuses another commit or tracked edits. Run TypeScript-enabled harnesses from that checkout so `tsx` resolves from the appropriate installation.

Create a separate evidence working copy outside all repository checkouts, named `ppo-cce-validation-20261012`; the populated-upgrade harness retains that exact ownership suffix check. Initialise a new PostgreSQL 16 cluster at its `cluster` child directory. Set `CCE_PG_CTL` to the absolute `pg_ctl` executable from that installation. The historical proof used a disposable `cceproof` superuser, trust authentication only within the dedicated local synthetic cluster, `127.0.0.1:55478`, and no existing credentials. Do not reuse a running application cluster or remove the data-directory/database guards. A complete provisioning wrapper is not included and the adapted database scripts were not executed during publication.

From the historical checkout, using the absolute evidence working-copy path:

1. Run `node --import tsx <workdir>/native-schema.mjs`. It requires absent `ppo_synthetic_test` and `cce_contract_test` databases, applies the recorded native migrations, and applies the candidate DDL to the native test database.
2. In that owned cluster create a new empty `cce_contract_test_attempt_2` database. Run `node <workdir>/database-check.mjs cce_contract_test_attempt_2`. This creates contract parents and applies the candidate DDL. The first historical attempt is already retained; reproducing the final name does not require reproducing its earlier failure.
3. Run `node --import tsx <workdir>/native-journey.mjs`. This seeds the bounded native synthetic setup once and invokes native commands. Rerunning raw seeds on a populated database can hit overlap guards; use fresh disposable databases for another full run.
4. Run the pure workflow check, then `node --import tsx <workdir>/persist-workflow.mjs`. It uses `cce_contract_test_attempt_2` and persists the material-profile output.
5. Run `node <workdir>/populated-upgrade.mjs`. It creates a new `cce_native_populated_upgrade` clone, removes only candidate CCE objects in that clone, reapplies the DDL, and compares retained native table/ledger digests. The source database is unchanged.
6. Run `node <workdir>/restart-check.mjs`. It verifies the owned cluster, records digests, stops/starts PostgreSQL, compares digests, then stops it again. This controls the explicit task cluster, not a Windows service. The recorded 50-second bounded wait is not an established production RTO.

Reference SQL remains outside `db/migrations/`. Actual implementation still requires a reviewed architecture decision, native service integration, authority checks, migration-registry updates and the full affected historical upgrade suites.

## Failures and unresolved work

Retained failures include the missing SQLSTATE 22003 expectation, use of an incomplete native DTO, raw-seed replay overlap, a workflow negative fixture that reached structural validation too early, and an initial shutdown wait that was shorter than the observed checkpoint. Corrections and precise limits are in Appendix E of the report and the original README. Publication-only failures or repairs belong in the publication ledger, not those earlier result files.

No CCE browser UI, complete semantic compiler/action catalogue, atomic production adoption command, OS worker isolation, real provider adapter, later-migration compatibility, independent security review or business acceptance is established here. No Figma URL, licensed icon artwork, cluster data, installed dependencies or operational exports are included.

## CI repair — 12 October 2026

Repository lint found three unused bindings in the imported harnesses. These are removed and the import manifest records the adapted bytes; original hashes and historical result files remain unchanged. The two `.cjs` schema harnesses retain their intentional CommonJS imports under a file-specific lint rule. All other lint rules still apply. No SQL/native/restart result is reissued by this correction.
