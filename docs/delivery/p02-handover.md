# P02 — Shared data foundation handover

**Revision:** r01 · **Date:** 5 September 2026 · **Owner:** Dean Fiedler · **Environment:** private local synthetic prototype.

**Delivery state:** Implementation and verification in progress in [PR #23](https://github.com/deanrfiedler-gif/powerplants-one/pull/23), linked to [issue #22](https://github.com/deanrfiedler-gif/powerplants-one/issues/22). The final evidence section and GitHub merge record govern completion. P03 has not started; PP-01 remains incomplete.

[Implementation decision](../decisions/ADR-0007-p02-shared-foundation.md) · [API contract](../contracts/service-api.md) · [Data dictionary](../contracts/service-data-dictionary.md) · [Ordered plan](prototype-implementation-plan.md).

## Verified starting point

Authenticated account `deanrfiedler-gif` has repository read/write access. Repository remains private, default branch `main`. The inspected main was P01 merge `2dfbc7b1cb818b842a422be7c68c4a9ab8c33778`, tree `2b7dd7480c969a3fd624d16d3d988c81e468a4e3`. No open PR or P02 implementation existed. A new isolated checkout was created from the clean exact P01 commit; prior session directories were preserved. Branch: `feature/p02-shared-foundation`.

Branch metadata reports `protected=false`, no required checks. Detailed branch-protection read returned integration 403; rulesets read returned a plan-related 403. No settings were changed. Normal GitHub merge and current PR review/check state are the final authority. Repository operations use the connected GitHub tools; locally and remotely created commit metadata differ, so exact tree hashes are compared on publication.

## Versions and configuration

All P01 pins and `package-lock.json` are retained: Node **24.20.0**, npm **11.19.0**, Next.js **16.3.4**, React/React DOM **19.2.8**, TypeScript **6.0.3**, PostgreSQL **16.15**, `pg` **8.23.0**, Playwright **1.63.0**. See the unchanged [dependency inventory](../testing/p01-dependencies.json) and [package.json](../../package.json). No dependency, licence, hosting or source-system change was required.

The exact ignored local configuration starts from [.env.example](../../.env.example): `PPO_ENV=local-synthetic`, `PPO_EXPOSURE=loopback`, `PPO_IDENTITY=synthetic`, `PPO_PORT=3000`, `NEXT_TELEMETRY_DISABLED=1`, and a `DATABASE_URL` with a locally chosen URL-encoded password. Preserve the actual example's variable names. Database names are restricted to `ppo_synthetic` and `ppo_synthetic_test`; URL options, remote database hosts and non-local/shared/production identity are refused. Never commit `.env.local`, credentials or a database dump.

## Exact install and fresh setup

On a private developer machine with Git, Python 3, nvm and Docker installed:

```sh
git clone https://github.com/deanrfiedler-gif/powerplants-one.git
cd powerplants-one
git switch main
nvm install
nvm use
npm install --global npm@11.19.0
npm ci
cp .env.example .env.local
```

These main commands target the completed merge. To inspect the PR before merge, use `git switch feature/p02-shared-foundation`. An equivalent Node installation is acceptable. On PowerShell use `Copy-Item .env.example .env.local`. Choose a disposable password locally and replace `<local-password>` in `DATABASE_URL`.

Create ignored `.env.postgres.local` with:

```text
POSTGRES_USER=ppo_local
POSTGRES_PASSWORD=<same-local-password>
POSTGRES_DB=ppo_synthetic
```

For a **new** database container only:

```sh
docker run --name ppo-p02-postgres --env-file .env.postgres.local -p 127.0.0.1:5432:5432 -v ppo-p02-pgdata:/var/lib/postgresql/data -d postgres:16.15
docker exec ppo-p02-postgres pg_isready -U ppo_local -d ppo_synthetic
npm run db:migrate
npm run db:seed
npm run db:health
npm run dev
```

Open `http://127.0.0.1:3000`, then **Foundation checks**. Select Coordinator, choose **Use this identity**, and **Load shared context**. Compare Site observer (Q01 only), Finance source context and Systems (no business grant). The diagnostic does not constitute P03 customer/intake screens. Stop the app with Ctrl+C. `docker stop ppo-p02-postgres` and `docker start ppo-p02-postgres` preserve the named data volume. Do not forward ports, use a tunnel or publish this development identity.

`npm run build` compiles the application. `npm start` deliberately refuses production startup. No hosting command is included.

## P01 upgrade and recovery

Use the existing P01 PostgreSQL volume/container and ignored connection configuration; do not create a competing container on port 5432. Stop the app and preserve a private backup before upgrading any valued synthetic work. For the P01 Docker name from its runbook:

```sh
docker exec ppo-p01-postgres pg_dump -U ppo_local -d ppo_synthetic -Fc > ../ppo-p01-before-p02.dump
git switch main
npm ci
npm run db:migrate
npm run db:seed
npm run db:health
npm run dev
```

Keep the dump outside the repository. Migration 0002 runs transactionally under the existing migration lock, records its checksum, preserves 0001 and expands the schema. Existing accepted ticket/audit/receipt/outbox rows are not rewritten. The P01 text ERP connection key is retained and mapped to a new UUID; no cast, case folding or name-based merge occurs. See ADR-0007 for the exact physical mapping. Upgrade tests construct the actual P01 schema/fixtures and accepted evidence rows and compare them after migration. They do not claim an operational import was tested.

If a migration fails, its transaction rolls back. Preserve the error category and database, correct the forward migration before application or add a new migration after an applied version; never alter a stored checksum. An applied P02 database is not compatible with P01-only SQL seed/permission assumptions. To return to P01, stop all processes and restore the pre-upgrade dump into a **separate** allowlisted disposable database, check out the P01 source, and verify it before use. P02 does not provide an operational down migration or claim a measured backup/restore SLA. The documented Docker dump/restore path has not been executed on Dean's machine.

## Tests and explicit disposable reset

Use a separate database for destructive tests:

```sh
docker exec ppo-p02-postgres createdb -U ppo_local ppo_synthetic_test
```

Change only the ignored `.env.local` database path to `/ppo_synthetic_test` and stop the app. If using an existing P01 container, substitute its name. Then:

```sh
python3 scripts/check_foundation.py
python3 scripts/check_prototype.py
python3 scripts/check_naming.py
npm run check
npm run db:migrate
npm run db:seed
npm run db:health
npm run test:db
```

Database tests reset **only** `ppo_synthetic_test` between cases. They verify fresh setup and P01 upgrade separately. Restore the deterministic fixture state after those mutation tests before HTTP/browser proofs:

```sh
PPO_ALLOW_RESET=dispose-synthetic PPO_RESET_DATABASE=ppo_synthetic_test npm run db:reset
npm run dev
```

From a second terminal with that loopback server running:

```sh
npm run test:http
```

Stop that server before CI-style Playwright execution, or let Playwright reuse it outside CI:

```sh
npx playwright install chromium
npm run test:browser
```

Linux may need `npx playwright install --with-deps chromium`. CI uses this command with its disposable runner. For the explicit database-process restart proof on the clean test database:

```sh
node --env-file=.env.local --import tsx scripts/persistence-proof.ts write
docker restart ppo-p02-postgres
docker exec ppo-p02-postgres pg_isready -U ppo_local -d ppo_synthetic_test
node --env-file=.env.local --import tsx scripts/persistence-proof.ts verify
```

This writes a P01 ticket sentinel and a P02 organisation/receipt, restarts the real server and verifies them from a new process. Do not execute the fixed sentinel write against a different database; the script enforces the test name.

Normal `npm run db:seed` is non-destructive and, after the seed receipt exists, changes nothing. Complete disposal requires both flags and the exact named database:

```sh
PPO_ALLOW_RESET=dispose-synthetic PPO_RESET_DATABASE=ppo_synthetic npm run db:reset
```

This destroys **all** PPO synthetic work, sessions and accepted evidence in that named database, drops both PPO schemas and migration receipts, then rebuilds the full migration/seed sequence. Use it only when deliberately discarding that database universe. For PowerShell, set the same two `$env:` variables, run `npm run db:reset`, then remove them. Wrong/missing flags and wrong/non-local database names are refused. Never treat reset as reference recycling in a continuing dataset.

## Delivered records and permissions

The [migration](../../db/migrations/0002-shared-foundation.sql), [typed commands](../../src/shared/commands.ts), [scoped reads](../../src/shared/reads.ts) and [permission helper](../../src/platform/permissions.ts) implement the bounded shared foundation. Included tables cover organisations, people/company contexts, affiliations, sites/parties, facilities, assets, exact account mappings, configuration/location snapshots and history; platform identity allocation, receipts and grants extend P01.

| Demonstration profile | Shared scope | Extra capability |
|---|---|---|
| Coordinator | Company SYN-A | Create/edit, internal notes and history capture |
| Observer | Company SYN-A | Read only; no internal/source-key/Finance projection |
| Site observer | Q01 site only | Read; no previous-site history or other affiliations |
| Finance | Company SYN-A | Finance notes and exact source-key projection; no mutation approval |
| Company B | Company SYN-B | Create/edit and internal source context |
| Workspace observer | First workspace | Read only across its company contexts; test helper profile |
| Other workspace | SYN-C in second workspace | Its own read scope |
| Technician / Systems | None | No assignment/business authority is invented |

One Person appears in two company contexts with distinct affiliations. Same-name organisations are not merged. Operator, Owner and BillingParty relationships are independent. References use SYN-PPO-ORG/SITE/AST/TKT with permanent UUID identity; optional person references are not allocated. Account mappings remain Proposed and have no effect in MYOB.

Identity revision commands preserve before/after identity details in audit. Site/operator labels, old author/source keys and historical uncertainty remain in immutable HistoryRecord rows after current identity changes. Reads require current applicable scope; inaccessible relationships are omitted. See the API amendment for exact routes/fields and the ADR for material simplifications.

## Execution evidence and review

Local environment: exact Node/npm binaries verified; locked P01 dependency installation reused without dependency changes; local lint/types/unit/build and documentation checks executed. `runuser -u nobody -- id` still fails with `cannot set groups: Operation not permitted`. No OS access setting or identity restriction was bypassed. Real PostgreSQL and browser tests run in authorised repository CI with ephemeral loopback processes, not a hosted application.

Initial code tree `17cfd04e6fd0ab1bcab45af683b50616d31d9836`, remote head `9cfe46f7fa4b2600953ae6da5db3345ae93a3471`: [application run 33943084029](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/33943084029) passed 4 unit and 18 PostgreSQL tests, migration/seed/reset and the P01 restart proof. It failed at the first collection HTTP read because the route wrapper assumed route parameters existed. Browser tests were skipped. This is not a passed application run. The wrapper was corrected and the test fixture boundary made explicit. [Documentation run 33943084003](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/33943084003) passed.

The next [application run 33943330004](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/33943330004), head `01bb623dbfb96493cefca80c24769bd334112ea1`, passed all database and HTTP checks and the extended P01/P02 restart proof. Its two new browser cases tried to focus a still-disabled button before identity selection completed; the test now waits for the control to be enabled. The four P01 browser cases passed. That overall run is recorded as failed, not passed.

Final run, visual evidence, exact tested head/tree, review and merge records will be added before marking P02 complete. No independent review is claimed. Full PT-01/PT-02/PT-03 procedures still require assignment/documents, work authorisation and Finance prerequisites that are deliberately absent. All 30 full PT and 38 AT procedures remain Not run. No production identity, real-device/offline durability, operational restore, performance/load, penetration, screen-reader, ERP or SharePoint acceptance is claimed.

## Next bounded task — P03, not started

After P02 verification and merge, implement **P03 — Customer context and service intake** only: SC-01–SC-04; organisation/contact/site/operator/equipment/history views using these scoped services; owned Activity/follow-up records; creation and triage of service tickets with explicit requester/site uncertainty, impact, priority rationale, owner and next action. Add a checksum-preserving migration for P01 ticket clarification fields and links. Show the unsuccessful fix, original attribution, confidence and unresolved OEM follow-up in the business UI. Preserve optional source evidence as unverified until controlled document support exists.

Prerequisites: verify current main and P02 merge/check evidence; read STATUS, this handover, ADR-0007, BP-07 SC-01–SC-04, DAT-01–04, API-R01–03/C01/C02/C24 and PT-02/03/04/25. Reuse the identity/reference/operation system. Specify the narrow ticket/Activity commands and state gates before editing. Keep controlled asset uncertainty visible; do not invent an identification-plan approval or financial release.

P03 should test permitted and forbidden customer/contact/site traversal, new/needs-information/triaged ticket transitions, stale/duplicate commands, missing data, owned follow-up and historical context at desktop/mobile widths. It must not implement P04 scope authorisation, planner/assignment grants, packs, reports, Finance or offline queues. Full PT-02/03 acceptance remains incomplete until those later prerequisites exist. Use a separate focused issue/branch/PR under fresh P03 authority, then prepare P04. This P02 session stops here.
