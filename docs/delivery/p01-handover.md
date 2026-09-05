# P01 — Application foundation handover

**Revision:** r01 · **Updated:** 5 September 2026 · **Owner:** Dean Fiedler · **Environment:** personal private, local synthetic prototype.

**Delivery state:** Implementation under verification. Do not infer P01 acceptance or merge from this working record. The final evidence section will record actual results and publication state. PP-01 is not complete; P02 has not started.

[Issue #20](https://github.com/deanrfiedler-gif/powerplants-one/issues/20) · [Implementation decision](../decisions/ADR-0006-p01-local-foundation.md) · [Ordered plan](prototype-implementation-plan.md).

## Starting point and source integrity

Authenticated GitHub access was verified for Dean. Repository visibility is private; default branch is main. Starting commit `f1d1b92073fc5d18f8cd1c51082456e947f108ef` is merged PR #19. No open PR or existing P01 implementation issue was present. All 62 source blobs in the isolated checkout matched the current GitHub tree; prior local working directories were left untouched. Direct Git transport was unavailable, so the GitHub connector is the repository transport. The local base commit and tree were reconstructed and their exact hashes verified.

Branch metadata reports `protected=false` and no required status checks. Ruleset inspection returned a plan-related 403; the branch-protection endpoint returned an integration-permission 403. No repository setting or entitlement was changed. The merge API and current PR checks/reviews remain the final authority; no bypass is authorised.

## Exact setup and run commands

Prerequisites: Git, Python 3, Node **24.20.0**, npm **11.19.0**, and a real PostgreSQL **16.15** server on loopback. The optional Docker commands below use that exact database image. Use a private developer machine; do not forward ports, bind a shared address or publish the application.

```sh
git clone https://github.com/deanrfiedler-gif/powerplants-one.git
cd powerplants-one
git switch feature/p01-foundation
nvm install
nvm use
npm install --global npm@11.19.0
npm ci
cp .env.example .env.local
```

Use an equivalent Node 24.20.0 installation if nvm is unavailable. On PowerShell, use `Copy-Item .env.example .env.local`. The only enabled database names are `ppo_synthetic` and `ppo_synthetic_test`; the host must be `127.0.0.1`. URL query options and live database names are refused. Set a URL-encoded disposable local password in `.env.local`. Do not add that file to Git.

For a new disposable Docker database, create ignored `.env.postgres.local` containing:

```text
POSTGRES_USER=ppo_local
POSTGRES_PASSWORD=<local-password>
POSTGRES_DB=ppo_synthetic
```

Replace the placeholder locally and match it in `DATABASE_URL`. Then:

```sh
docker run --name ppo-p01-postgres --env-file .env.postgres.local -p 127.0.0.1:5432:5432 -v ppo-p01-pgdata:/var/lib/postgresql/data -d postgres:16.15
docker exec ppo-p01-postgres pg_isready -U ppo_local -d ppo_synthetic
npm run db:migrate
npm run db:seed
npm run db:health
npm run dev
```

Open `http://127.0.0.1:3000` on the same machine. Do not substitute localhost: the strict Host/origin boundary deliberately uses one canonical loopback origin. The shell works with an unavailable database and says so; a successful read/save requires PostgreSQL. Stop the app with Ctrl+C. `docker stop ppo-p01-postgres` stops the database while preserving the named volume; `docker start ppo-p01-postgres` resumes it.

`npm run build` verifies compilation. `npm start` intentionally exits with a refusal: production/shared serving is not supported by the synthetic identity adapter. No deployment command is supplied.

## Verification commands

```sh
python3 scripts/check_foundation.py
python3 scripts/check_prototype.py
python3 scripts/check_naming.py
npm run check
npm audit
npm ls --depth=0
```

The foundation checker inspects tracked and untracked non-ignored repository inputs, including forced-added ignored files. Installed dependencies and local configuration are not repository documents. This is not a comprehensive secret scanner.

Database tests dispose **only** `ppo_synthetic_test`. Create it separately:

```sh
docker exec ppo-p01-postgres createdb -U ppo_local ppo_synthetic_test
```

Point the ignored `.env.local` database path to `/ppo_synthetic_test`, retaining the same local role/password. Stop any running app before destructive database tests. Then:

```sh
npm run db:migrate
npm run db:seed
npm run test:db
npm run dev
```

With that local server running, use another terminal for `npm run test:http`. Stop it before CI-style browser testing, or let Playwright reuse the running local server outside CI:

```sh
npx playwright install chromium
npm run test:browser
```

Linux hosts may need the Playwright system dependencies (`npx playwright install --with-deps chromium`) installed by an authorised system administrator. The tests launch only a loopback server. Browser output goes to ignored `test-results/` and `playwright-report/`; CI uploads those synthetic artifacts with 14-day retention. They are test artifacts, not application publishing.

The CI workflow also writes a versioned command result, restarts the actual PostgreSQL container, and verifies the result from a new process:

```sh
node --env-file=.env.local --import tsx scripts/persistence-proof.ts write
docker restart ppo-p01-postgres
docker exec ppo-p01-postgres pg_isready -U ppo_local -d ppo_synthetic_test
node --env-file=.env.local --import tsx scripts/persistence-proof.ts verify
```

## Synthetic reset and migration recovery

Stop the app. Confirm `.env.local` points to the intended disposable database. For the demonstration database:

```sh
PPO_ALLOW_RESET=dispose-synthetic PPO_RESET_DATABASE=ppo_synthetic npm run db:reset
```

For PowerShell:

```powershell
$env:PPO_ALLOW_RESET='dispose-synthetic'
$env:PPO_RESET_DATABASE='ppo_synthetic'
npm run db:reset
Remove-Item Env:PPO_ALLOW_RESET, Env:PPO_RESET_DATABASE
```

Use `ppo_synthetic_test` for the test database. Both explicit flags are required; a mismatched name is rejected. Reset removes all PPO records, sessions, evidence and reservations in that disposable database, then reapplies the migration/fixtures. It creates a new synthetic universe. Do not use it on operational data. The btree_gist extension remains installed.

Migration 0001 is one PostgreSQL transaction with a checksum and advisory lock. Failure leaves no partially created PPO schema. Rerun after addressing the reported prerequisite. A checksum mismatch stops migration; investigate and add a new migration rather than altering an already applied file. If a disposable development database is irrecoverable, the explicit reset path rebuilds it. No operational backup/restore or lossless downgrade is claimed. A database owner may bypass table triggers; production database roles and hardened privilege separation remain future work.

## Implemented scope and limitations

- Responsive navy/green shell with visible synthetic status, seven labelled planned domains, keyboard skip link, focus styles, loading/error/unavailable states and no invented metrics or branding.
- Server-derived local identities, opaque expiring sessions and scoped permission checks. Coordinator can edit the permitted company; observer can read only; Systems has no business grants; another workspace remains isolated. Company keys preserve provider/connection/company context independently of display names.
- One single-ticket read and strict `save-draft` command. UUID, display reference, state and record version are separate. The command updates only the summary of a New request and requires a reason. Site/requester context remains explicitly unresolved, with a triage owner. Full customer/site/asset persistence, reference generators, CRUD, triage and permissions administration are deferred.
- Atomic ticket/audit/receipt/outbox writes with stale-version, retry, changed-payload and current-scope guards. Ready outbox entries remain unprocessed. Complete worker leasing, document generation, integration retries and Finance processing are not implemented.
- PostgreSQL exclusion experiment with genuinely competing backends, adjacent intervals, failed moves and transaction rollback. This is not planner/crew/travel/availability/readiness acceptance.
- Explicit adapter stubs; no live MYOB endpoint, SharePoint library or confirmed distribution outcome. One IndexedDB marker experiment only; no offline queue, service worker, attachment recovery or real-device claim.

## Actual verification and publication evidence

Development environment: Ubuntu 24.04.3 container. Exact Node/npm installed locally; package downloads succeeded. System PostgreSQL installation failed because the container cannot change user/group; `runuser` also returned `cannot set groups: Operation not permitted`. The container is root and has no PostgreSQL/Docker runtime. No in-memory database was substituted. The cloud browser refused loopback with `net::ERR_BLOCKED_BY_CLIENT`; the app was not exposed remotely to work around that restriction.

At this draft: documentation checks passed (4 issued sources, 78 parent requirements, 29 decisions, 38 master scenarios, 16 discovery items; all 30 full PT procedures remain Not run). Local runtime and CI checks are still being completed. This section will record actual check commands, source commits, visual inspection and final PR/merge status before delivery.

## Next bounded task — P02 (not started)

After P01 verification and merge, implement P02 shared persistence, permissions and deterministic seed. Read current STATUS, this handover, ADR-0006 and P02 in the ordered plan. Reuse the platform transaction/session foundation; replace the isolated reservation experiment only when the scheduling model is specified. Extend workspace/user/grants, typed Organisation/Person/Site/Asset and their controlled relationships, exact ERP mapping contexts, stable reference allocation, scoped DTOs and audit/operation/outbox contracts. Define a migration from P01 fixtures without silently relabelling them as operational records.

Prerequisites: a working local PostgreSQL/Node/browser development environment or the documented CI equivalent; current repository branch/commit/checks verified; P01 limitations acknowledged. Use synthetic data. Test company/workspace isolation, same-name mapping, asset/history relationships, repeatable seed/reset, reference concurrency and database persistence. PT-01/PT-02/PT-03 component evidence must remain separate from full acceptance until all prerequisites exist. Do not start P03 business screens, P05 planner, P08 offline or live integration under P02.
