# PPO CCE reference validation evidence

Prepared 12 October 2026 (Australia/Brisbane). This is a standalone research and validation package. It does not install a feature in PPO or approve a business rule. The accompanying Markdown report defines the scope and open obligations.

## Recorded environment

- Repository baseline: `ba1f4e3c155ce6a45dc15e87689de01d42a47e1f`.
- Node 24.21.0; TypeScript 6.0.3; existing repository `pg` and `tsx` packages.
- Native PostgreSQL 16.15 on Windows; task-owned cluster under `ppo-cce-validation-20261012/cluster`, loopback port 55478.
- Ajv 8.17.1 and ajv-formats 3.0.1 installed only under the temporary `validator` directory, with install scripts disabled.
- Python 3.14 standard-library `fractions.Fraction`, pseudorandom fixture seed 20261012.
- No operational data, external API calls that mutate state, repository edits or deployment.

`verification-summary.json` indexes results. `SHA256SUMS.json` hashes every other packaged file. The hash list detects changed bytes; it is not an independent digital signature.

## Pure validation checks

The source scripts retain the original machine's repository path where they use its existing packages. Inspect and replace that path for another checkout. Install the pinned validator dependencies into the extracted package's `validator` directory with `npm ci --prefix <package>/validator --ignore-scripts --no-audit --no-fund`.

From the matching PPO checkout, with `<package>` replaced by the extracted evidence directory:

```text
node <package>/schema-2020-check.cjs
node <package>/schema-coverage.cjs
node --import tsx <package>/expression-check.ts
python <package>/generate-oracle.py
node --import tsx <package>/oracle-check.mjs
node --import tsx <package>/workflow-check.mjs
node --import tsx <package>/commercial-check.mjs
```

Strict expression compilation used:

```text
node node_modules/typescript/bin/tsc --ignoreConfig --strict --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --skipLibCheck --typeRoots <checkout>/node_modules/@types <package>/expression.ts
```

The arithmetic checks need no database or connected provider. The workflow's delivery adapter is an in-memory state model. It cannot demonstrate a durable outbox or real provider idempotency.

## Database reproduction sequence

The scripts intentionally pin database names, port and ownership checks. They are not a general migration tool. Use a new disposable cluster and update the exact path checks together when reproducing elsewhere. Never remove those checks or point this package at an existing application cluster. The report's cluster was stopped at completion; its files are not included.

1. Initialize a new PostgreSQL 16 cluster with a disposable local superuser `cceproof`, bind only `127.0.0.1:55478`, and start it. The original proof used trust authentication only on this new local synthetic cluster; no credentials from an existing environment were read.
2. Run `node --import tsx <package>/native-schema.mjs`. It verifies the owned data directory, creates `ppo_synthetic_test` and `cce_contract_test`, applies all pinned repository migrations and then the candidate DDL. It expects new database names and does not reuse an existing application's database.
3. Run `node <package>/database-check.mjs cce_contract_test`. The retained final ledger came from a new `cce_contract_test_attempt_2` after a test assertion was corrected; the first attempt is preserved separately. For reproducing that exact name, create a new database with that name in the same isolated cluster before running the harness. The harness creates its own minimal native-parent contract tables and a non-owner read role.
4. Run `node --import tsx <package>/native-journey.mjs`. It seeds the required native synthetic SQL fixtures once, invokes existing native commands and probes snapshot compatibility. It is not the future atomic CCE adoption command.
5. Run `node --import tsx <package>/workflow-check.mjs`, then `node --import tsx <package>/persist-workflow.mjs`. The persistence script uses `cce_contract_test_attempt_2` and reloads exact published definitions. The standalone workflow implements only the material profile identified in the report.
6. Run `node <package>/populated-upgrade.mjs`. It clones the native proof database into the specifically named new disposable target, removes only candidate CCE objects in that clone, then compares every retained native table and migration ledger before/after applying the DDL. The source database is not changed. Do not run this script against an operational database.
7. Run `node <package>/restart-check.mjs`. It verifies the owned data directory, records selected row digests, stops/starts that cluster, checks exact equality and stops the cluster again. It does not start or stop a Windows PostgreSQL service or another cluster.

Installing this DDL into PPO for actual development still requires its own reviewed branch, migration-registry integration, native commands, authorization, historical upgrade checks and accepted ADR. Those repository changes were not made here.

## Limits and failed attempts

- The initial numeric-domain assertion omitted SQLSTATE 22003, a correct numeric overflow refusal. No SQL guard was relaxed.
- The native read DTO did not contain all persisted fields. The final probe reads the native version row for that contract.
- Replaying raw seed SQL hit an existing overlap guard. The attempted replay was rolled back; existing synthetic setup was reused.
- A workflow negative fixture omitted its unit and initially failed at structural validation. The corrected fixture reaches semantic type validation.
- The first database stop timed out after 20 seconds while a checkpoint finished; logs later confirmed clean shutdown at about 45 seconds. The final clean restart proof used a 50-second bounded wait. No 20-second RTO is established.
- No CCE browser UI, complete semantic compiler, production adoption command, real provider integration, worker isolation, full historical upgrade suite or independent business/security review is included.

The report separates these gaps from the bounded passes. File names ending in `result.json` contain the final results; the explicitly named attempt files retain earlier harness failures. `prior-report.md` is historical provenance and contains superseded validation statements.
