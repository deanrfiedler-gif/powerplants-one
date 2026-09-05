# P01 — Application foundation handover

**Revision:** r01 · **Updated:** 5 September 2026 · **Owner:** Dean Fiedler · **Environment:** personal private, local synthetic prototype.

**Delivery state:** P01 local foundation implemented and verified. This handover accompanies [PR #21](https://github.com/deanrfiedler-gif/powerplants-one/pull/21); its GitHub merge record and linked issue closure record are the authority for the final publication SHA/status. PP-01 is not complete; P02 has not started.

[Issue #20](https://github.com/deanrfiedler-gif/powerplants-one/issues/20) · [Implementation decision](../decisions/ADR-0006-p01-local-foundation.md) · [Ordered plan](prototype-implementation-plan.md).

## Starting point and source integrity

Authenticated GitHub access was verified for Dean. Repository visibility is private; default branch is main. Starting commit `f1d1b92073fc5d18f8cd1c51082456e947f108ef` is merged PR #19. No open PR or existing P01 implementation issue was present. All 62 source blobs in the isolated checkout matched the current GitHub tree; prior local working directories were left untouched. Direct Git transport was unavailable, so the GitHub connector is the repository transport. The local base commit and tree were reconstructed and their exact hashes verified.

Branch metadata reports `protected=false` and no required status checks. Ruleset inspection returned a plan-related 403; the branch-protection endpoint returned an integration-permission 403. No repository setting or entitlement was changed. The merge API and current PR checks/reviews remain the final authority; no bypass is authorised.

## Exact setup and run commands

Prerequisites: Git, Python 3, Node **24.20.0**, npm **11.19.0**, and a real PostgreSQL **16.15** server on loopback. The optional Docker commands below use that exact database image. Use a private developer machine; do not forward ports, bind a shared address or publish the application.

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

These commands target main after PR #21 is merged. To inspect the implementation before merge, switch to `feature/p01-foundation` instead. Use an equivalent Node 24.20.0 installation if nvm is unavailable. On PowerShell, use `Copy-Item .env.example .env.local`. The only enabled database names are `ppo_synthetic` and `ppo_synthetic_test`; the host must be `127.0.0.1`. URL query options and live database names are refused. Set a URL-encoded disposable local password in `.env.local`. Do not add that file to Git. All exact direct versions and declared licences are recorded in the [dependency inventory](../testing/p01-dependencies.json), with the lockfile SHA-256.

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

The local database role needs schema creation and permission to install the trusted `btree_gist` extension, or an owner must preinstall it. PostgreSQL 16 supplies `gen_random_uuid()`. The Docker example creates a disposable database owner; it is not a production privilege pattern. The idle-connection test terminates a backend owned by the test role. Reservation timestamps are UTC instants; PostgreSQL normalises offsets. Active reservations use half-open `[start,end)` intervals: 09:00–11:00 and 11:00–12:00 may coexist. Zero-length, reversed and infinite intervals are rejected. All reservation tests are isolated from future planner records in `ppo_proof`.

## Implemented scope and limitations

- Responsive navy/green shell with visible synthetic status, seven labelled planned domains, keyboard skip link, focus styles, loading/error/unavailable states and no invented metrics or branding.
- Server-derived local identities, opaque expiring sessions and scoped permission checks. Coordinator can edit the permitted company; observer can read only; Systems has no business grants; another workspace remains isolated. Company keys preserve provider/connection/company context independently of display names.
- One single-ticket read and strict `save-draft` command. UUID, display reference, state and record version are separate. The command updates only the summary of a New request and requires a reason. Site/requester context remains explicitly unresolved, with a triage owner. Full customer/site/asset persistence, reference generators, CRUD, triage and permissions administration are deferred.
- Atomic ticket/audit/receipt/outbox writes with stale-version, retry, changed-payload and current-scope guards. Ready outbox entries remain unprocessed. Complete worker leasing, document generation, integration retries and Finance processing are not implemented.
- PostgreSQL exclusion experiment with genuinely competing backends, adjacent intervals, failed moves and transaction rollback. This is not planner/crew/travel/availability/readiness acceptance.
- Explicit adapter stubs; no live MYOB endpoint, SharePoint library or confirmed distribution outcome. One IndexedDB marker experiment only; no offline queue, service worker, attachment recovery or real-device claim.

## Actual verification and publication evidence

Development environment: Ubuntu 24.04.3 container. Exact Node/npm installed locally; package downloads succeeded. System PostgreSQL installation failed because the container cannot change user/group; `runuser` also returned `cannot set groups: Operation not permitted`. The container is root and has no PostgreSQL/Docker runtime. No in-memory database was substituted. The cloud browser refused loopback with `net::ERR_BLOCKED_BY_CLIENT`; the app was not exposed remotely to work around that restriction.

The local isolated checkout and a separate clean checkout passed `npm ci` and `npm run check`. A loopback launch and actual same-process-network HTTP requests in the clean checkout verified shell 200, unauthenticated read 401, unavailable PostgreSQL 503 with a useful error, and hostile wire Host/Forwarded/Origin/gateway headers 403. Local PostgreSQL and cloud-browser proofs were blocked as described above; they were completed against real PostgreSQL and Chromium in the authorised repository CI, without hosting the app.

The final implementation proof is [Application assurance run 33940495951](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/33940495951), job `101236831837`, completed successfully on 5 September 2026. [Documentation assurance run 33940495946](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/33940495946) also passed. CI used a fresh checkout, Node 24.20.0/npm 11.19.0, PostgreSQL 16.15 on x86_64, Ubuntu 24.04 and Playwright 1.63.0 with Chrome Headless Shell 153.0.8010.12 (build v1243). No database mock was used in the database, HTTP or successful browser-save paths.

| Executed commands / checks | Actual result and boundary |
|---|---|
| `python3 scripts/check_foundation.py`, `python3 scripts/check_prototype.py`, `python3 scripts/check_naming.py` | Passed locally and in documentation CI. Four issued sources and all 78 parent IDs/wording preserved; 29 decisions, 38 master scenarios, 16 original issues, 30 full PT procedures retained. Documentation assurance only. |
| `npm ci`; `npm run check` | Clean local and fresh CI install, lint, type check, four unit groups and Next build passed. Production compilation does not enable production serving. |
| `npm audit`; `npm ls --depth=0` | Zero known vulnerabilities at execution on 5 September; exact direct graph with no invalid peers. This is a dated dependency check, not a security certification. |
| `npm run db:migrate`; `npm run db:seed`; `npm run db:health` | Passed against real PostgreSQL 16.15; one recorded migration. Repeated seed/migration preserves an edited ticket and immutable evidence. |
| `npm run db:reset` without flags; with a mismatched database flag | Both refused as expected, before disposal. Explicit matching `PPO_ALLOW_RESET=dispose-synthetic PPO_RESET_DATABASE=ppo_synthetic_test npm run db:reset` completed and health passed. |
| `npm run test:db` | Eight test groups passed: scoped permission refusals; atomic accepted evidence; stale and duplicate/conflicting commands; final-write rollback; session/current-grant checks; seed/migration/evidence integrity; dropped idle connection recovery; genuinely competing reservations. |
| Persistence write; `docker restart`; persistence verify | Actual PostgreSQL process restarted. A new process recovered the accepted command result. This proves database persistence, not operational restore/RPO. |
| `npm start`; `npm run test:http` against `npm run dev` | Production startup refused; one HTTP behaviour group passed. Actual routes checked server sessions, actor switching, private no-store responses, 401/403/404/409/422 failures, exact retry result and origin/wire-header guards. |
| `npx playwright install --with-deps chromium`; `npm run test:browser` | Four tests passed at 1440×1000 and 390×844. Keyboard Tab/Enter reaches the skip link, main and Foundation checks; real save/read-only/forbidden states, no horizontal overflow, useful unavailable/404 states and storage marker recovery checked. |
| Manual visual inspection of eight captured images | Passed after correcting joined mobile heading words and the hidden skip-link capture artefact. Labels, navy/green contrast, visible focus outline, synthetic indicator, form controls and unavailable-state recovery action were readable at both widths. No real-device or assistive-technology audit claimed. |

The database contention log recorded backend A `151`, backend B `152`, `blocked_before_commit=true`, SQLSTATE `23P01`, and exactly one committed overlapping reservation. The adjacent interval committed; a rejected move preserved its original 11:00 start. A later conflicting multi-resource insert rolled back the earlier insert in the same transaction. The command rollback test injects a failure at the final outbox insert and observes unchanged business version and zero command audit/receipt/outbox rows; removing the trigger permits the same operation ID to succeed. Concurrent identical retries return identical receipts with one effect; changed content and stale versions return conflicts.

Both browser profiles recovered `SYN-PPO-P01-marker-v1` after reload. `navigator.storage.persist()` returned **not granted**; each reported quota was `2147639296` bytes. That estimate is specific to this ephemeral runner. No durable offline guarantee, attachment recovery, replay queue, service worker, Safari/iOS/Android validation or mobile readiness was established.

### Source and visual evidence

- Tested implementation branch: `feature/p01-foundation`; remote commit `e6c5048b184661400cc79517d0de4f316a049016`; exact tree `1551b665ecc70d206ea6a1e722d1f2a7bb79fe82`.
- CI checked GitHub's PR merge ref `4b05e7b18510b5de821cc794603ddb93021cc816`, merging that head into the unchanged starting main. This is a test merge ref, not a claim that publication had already occurred.
- Local implementation commit `b894658` has the same tree. Connector-created commit metadata differs from local commit metadata; every published tree was compared exactly. Evidence/status-only changes follow this tested implementation; the final PR checks cover the complete delivered tree.
- [Visual manifest](../testing/evidence/p01/manifest.json) records original PNG hashes, dimensions, source and artifact provenance. The original artifact ZIP SHA-256 is `fb1739d0860ee40fc66e2647407be13f8285ee09deef6c859a25e996cba07dc4`. The images are committed here so evidence does not depend on 14-day CI artifact retention.

| View | Desktop | Mobile viewport |
|---|---|---|
| Overview | [1440px](../testing/evidence/p01/desktop-overview.png) | [390px](../testing/evidence/p01/mobile-overview.png) |
| Successful PostgreSQL save | [Desktop](../testing/evidence/p01/desktop-foundation.png) | [Mobile](../testing/evidence/p01/mobile-foundation.png) |
| Keyboard focus | [Desktop](../testing/evidence/p01/desktop-keyboard-focus.png) | [Mobile](../testing/evidence/p01/mobile-keyboard-focus.png) |
| Unavailable dependency UI | [Desktop](../testing/evidence/p01/desktop-unavailable.png) | [Mobile](../testing/evidence/p01/mobile-unavailable.png) |

The unavailable screenshots deliberately abort only the browser health request; they are UI evidence. Separate real HTTP/database checks provide runtime evidence. Full-page screenshot heights exceed the viewport where content scrolls.

### Review, corrections and unexecuted scope

Earlier CI runs exposed three test defects: an overbroad shell cache expectation, Fetch normalising a hostile Host header, and an ambiguous alert locator matching Next's route announcer. Assertions were corrected to inspect private API headers, actual raw wire headers and the specific permission error. Those earlier runs are not recorded as passed. Visual inspection subsequently found and corrected mobile text spacing. Idle PostgreSQL connection error handling was added and exercised to prevent a dropped idle backend from terminating the local server.

Implementation self-review checked identity/permission boundaries, transaction/retry ordering, migration/reset scope, adapter outcomes, naming, baseline integrity and workflow permissions. No independent reviewer was available or requested on PR #21; none is claimed. Review submissions and threads were empty when inspected. The normal GitHub merge operation must accept the current head after applicable final checks; no review/rule bypass or access setting change is used. The [PR](https://github.com/deanrfiedler-gif/powerplants-one/pull/21) and [issue #20](https://github.com/deanrfiedler-gif/powerplants-one/issues/20) retain final check and merge evidence.

P01 component evidence relates to SVC-01 and NFR-01/02/03/05/08/09/12, API-R03/API-C02, DAT-04 and ADR-0003/0004/0005/0006. No parent requirement is declared complete. Full PT-01–PT-30 and AT-01–AT-38 acceptance remain **Not run**. No full scheduling-policy, performance/load, penetration, screen-reader, real-device, offline/replay, operational restore, production identity, remote hosting, live integration or Finance acceptance was executed. PowerShell-specific and owner-machine Docker setup were documented but not executed in the constrained development container; CI exercised the equivalent fresh PostgreSQL service and the exact npm lifecycle commands.

Working-document corrections explicitly align BP-02's older hosting timing, historical synthetic examples and documentation-only status with the local-only user instruction and adopted PPO naming. Source baselines and all 78 parent definitions remain unchanged. No operational ownership decision was inferred from the synthetic service model.

## Next bounded task — P02 (not started)

After P01 verification and merge, implement P02 shared persistence, permissions and deterministic seed. Read current STATUS, this handover, ADR-0006 and P02 in the ordered plan. Reuse the platform transaction/session foundation; replace the isolated reservation experiment only when the scheduling model is specified. Extend workspace/user/grants, typed Organisation/Person/Site/Asset and their controlled relationships, exact ERP mapping contexts, stable reference allocation, scoped DTOs and audit/operation/outbox contracts. Define a migration from P01 fixtures without silently relabelling them as operational records.

Prerequisites: a working local PostgreSQL/Node/browser development environment or the documented CI equivalent; current repository branch/commit/checks verified; P01 limitations acknowledged. Use synthetic data. Test company/workspace isolation, same-name mapping, asset/history relationships, repeatable seed/reset, reference concurrency and database persistence. PT-01/PT-02/PT-03 component evidence must remain separate from full acceptance until all prerequisites exist. Do not start P03 business screens, P05 planner, P08 offline or live integration under P02.
