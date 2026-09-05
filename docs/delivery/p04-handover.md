# P04 — Work scope, coverage and readiness handover

**Revision:** r01 · **Date:** 5 September 2026 · **Owner:** Dean Fiedler · **Environment:** private local synthetic prototype.

**Delivery state:** Implementation in review under [issue #26](https://github.com/deanrfiedler-gif/powerplants-one/issues/26), [PR #27](https://github.com/deanrfiedler-gif/powerplants-one/pull/27), branch `feature/p04-work-scope-readiness`. Verification/publication is recorded below and in the linked issue. No independent-review, owner-acceptance or production-readiness claim. P05 has not started; PP-01/full PT/AT remain incomplete.

[ADR-0009](../decisions/ADR-0009-p04-work-scope-readiness.md) · [P03 baseline](p03-handover.md) · [API](../contracts/service-api.md) · [Dictionary](../contracts/service-data-dictionary.md) · [Ordered plan](prototype-implementation-plan.md).

## Starting state and access

Verified starting main: `9f4f88dd12bfd61c21534a9f3a295ce6318f4df0`; tree `9eb0c45f113b6e9d777b3a0d9be6c3e02502b840`. P03 issue #24 was closed/completed and PR #25 merged. No later main commit or existing P04 issue/branch/PR was found. Existing local P03 checkout was clean with the exact delivered tree; an isolated checkout preserves it.

Connected GitHub reads/writes work as deanrfiedler-gif; private repository, main default, owner write/admin permission reported. Direct shell Git fetch lacks credentials; connected Git data APIs publish exact trees. The signed remote main commit was reconstructed locally from returned commit payload/signature and verified against the exact SHA; no content substitution or access change was used. Local and remote implementation commits can have different commit metadata but must have identical trees.

Main reports unprotected/no required contexts. Detailed protection reads return integration 403; ruleset reads return plan-capability 403. These limitations confer no bypass authority. Normal merge requires reassessment of current checks/reviews/threads and is recorded with exact SHA/tree in issue #26. No visibility, membership, permissions, rules or paid service is changed.

## Delivered capability and boundaries

SC-05 lists/creates and shows work orders at `/service/work-orders` and `/service/work-orders/:id`, with service-request navigation. Draft has an explicit owner, known site/customer and typed many-to-many ticket junction. Original tickets remain unchanged. Incomplete known-site intake can have an owned Draft order, but authorisation requires triage.

Scope revisions/items/assets, completion requirements, competency codes and access/shutdown conditions are typed. Explicit exclusions, synthetic authority evidence, coverage/charging route and pending-account plan precede authority. Unresolved assets require a reviewed Identification task/method/limits; ReviewRequired configuration is not verified authority. Approved scope/children are immutable. Successor drafting preserves the approved original; new review replaces only the authorised pointer. Proposed visits retain original scope and show review required where appropriate.

TR-02/API-C03 evaluates current permission/scope, expected order/content/policy versions, links/site/owner, scope/exclusions/authority/coverage/account plan, identity and applicable controls. Exact approval snapshot/hash, plan approval, state, audit, original receipt and synthetic outbox commit atomically. Urgent bypasses nothing. Identical retry has one business effect; changed operation content and stale proposals are rejected.

Readiness distinguishes Authorisation from later Booking/Dispatch. Policy owns exceptions and conditional N/A. Site access/site controls/competency planning cannot be generically waived; isolation/shutdown N/A requires evidenced non-intervention. Tool preparation permits a documented plan. Actual crew and dispatch checks cannot be cleared in P04. Coverage retains Unknown/Covered/NotCovered/Disputed/NotApplicable and never determines Finance disposition.

Proposed visits record exact UTC interval/customer window, site timezone, scope/content/policy reference and bounded commitment/preparation. No assignments, reservations, confirmed state, planner, change/cancel engine, contact delivery or acknowledgement exists. Proposed records remain immutable; a new proposal preserves the old intent.

Activity targets remain P03-only. Authority evidence is a bounded Synthetic text/plain DocumentReference persisted inside PostgreSQL; no SharePoint, file upload, general document library, packs/reports/issue/distribution. MYOB/Pipedrive/Smartsheet/native CAD retain existing authority. No operational data, production identity/hosting, customer message, financial effect or offline queue exists.

## Versions and exact commands

Pins and lockfile unchanged: Node **24.20.0**, npm **11.19.0**, PostgreSQL **16.15**, Next.js **16.3.4**, React/React DOM **19.2.8**, TypeScript **6.0.3**, pg **8.23.0**, Playwright **1.63.0**. No application dependency added. Local exact Node/npm were installed in scratch; locked application dependencies were copied into the isolated checkout. CI independently runs fresh `npm ci` and reports the inventory.

Use the [P03 setup](p03-handover.md#exact-install-and-fresh-setup) with the same ignored `.env.local`/database allowlist and existing PostgreSQL volume. Do not create a competing database container. For a fresh clone:

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

Before merge, select `feature/p04-work-scope-readiness` instead. Set the private local password/configuration as in P03. For a **new** PostgreSQL container only, prepare ignored `.env.postgres.local` with POSTGRES_USER=ppo_local, POSTGRES_PASSWORD matching local config, POSTGRES_DB=ppo_synthetic:

```sh
docker run --name ppo-p04-postgres --env-file .env.postgres.local -p 127.0.0.1:5432:5432 -v ppo-p04-pgdata:/var/lib/postgresql/data -d postgres:16.15
npm run db:migrate
npm run db:seed
npm run db:health
npm run dev
```

Open `http://127.0.0.1:3000/service/work-orders` and choose Coordinator. Compare site observer, Company B, Systems and Technician identities. Changing identity clears displayed/unsaved forms. Ctrl+C stops the application. `npm start` deliberately refuses production startup.

For upgrade, stop the app, privately back up the actual existing container, install current source, migrate, seed and verify:

```sh
docker exec ppo-p03-postgres pg_dump -U ppo_local -d ppo_synthetic -Fc > ../ppo-before-p04.dump
npm ci
npm run db:migrate
npm run db:seed
npm run db:health
npm run dev
```

Substitute the actual container name. Migration 0004 and seed receipt 4 are transactional and additive. Never edit applied 0001–0003/checksums or old receipts. A failed migration rolls back; preserve errors/data and fix an unapplied migration or add a later forward migration. There is no down migration. Recovery of valued work means restoring the private pre-upgrade dump into a separate allowlisted database and the matching source version. Backup/restore on Dean's machine is not claimed executed.

Use separate `ppo_synthetic_test` for destructive component tests. Stop the app before reset; explicit disposal remains different from non-destructive seed:

```sh
python3 scripts/check_foundation.py
python3 scripts/check_prototype.py
python3 scripts/check_naming.py
npm run check
npm run db:migrate
npm run db:seed
npm run db:health
npm run test:db
PPO_ALLOW_RESET=dispose-synthetic PPO_RESET_DATABASE=ppo_synthetic_test npm run db:reset
npm run dev
```

From another terminal run `npm run test:http`. Stop that server before CI-style browser checks:

```sh
npx playwright install chromium
npm run test:browser
node --env-file=.env.local --import tsx scripts/persistence-proof.ts write
docker restart ppo-p04-postgres
node --env-file=.env.local --import tsx scripts/persistence-proof.ts verify
```

The restart proof checks P01 ticket, P02 organisation, P03 activity/link and P04 work-order/ticket link plus original receipts across actual PostgreSQL process restart. PowerShell uses `Copy-Item` for config; set/remove the explicit PPO_ALLOW_RESET/PPO_RESET_DATABASE environment variables as described in P03. No reset is authorised against another database name.

## Verification and publication record

Local Python foundation/prototype/naming checks passed; all 78 parents and issued baseline hashes retained. `npm run check` passed lint/types/4 unit cases and compilation. Initial local lint found an unused test variable (fixed); the first build attempt rejected a dependency symlink outside the project root (replaced with a local copied dependency tree). An initial npm PATH setup error was local tooling only and corrected. No downstream result from a failed run is counted as passed.

Local PostgreSQL startup failed with `runuser: cannot set groups: Operation not permitted`. No OS restriction was bypassed and no in-memory substitute used. Real PostgreSQL 16.15, upgrade/reset/seed/restart, HTTP and Chromium run in authorised ephemeral GitHub Actions, with retained pinned action permissions and no hosting.

First submitted implementation: remote head `d56f91103f72fb85a3073f20c0fd6543d9990b51`, local commit `44018775ef4950cc770f9160e9ce423631a88071`, matching tree `e7006d27e23134d5385544b2a78bdf7f62c8b57d`. CI results, material failed runs/disposition and visual evidence are appended after execution. Final head/merge SHA cannot identify its own containing commit; issue #26 is the exact durable publication record and must be updated after normal merge and merged-main checks.

**First CI result:** application [33954331600](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/33954331600) passed fresh install/static/unit/build/migration/seed/reset, then 41/44 PostgreSQL cases. Three assertions needed fixture-boundary correction: P03 now has a second site-visible ticket; triage must be checked for no created linkage rather than no WorkOrder table; a known equipment serial intentionally equals account-key text, so projection tests must inspect typed fields instead of banning that string. No serial or source data was altered. HTTP/restart/browser were skipped on that run. Documentation [33954331609](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/33954331609) passed.

**Current verification status:** complete real database/HTTP/browser and manual screenshot inspection pending. Component implementation is not full PT/AT acceptance. No independent review has occurred.

## Synthetic scenarios

Seed receipt 4 adds nine fictional work orders: ready draft, authorised inspection, missing authority, disputed diagnostics, unresolved identification without plan, mandatory access blocker, permitted tool exception, approved original with successor draft, and bounded identification plan awaiting review. There are Proposed visits for the authorised/exception/successor scenarios. All prior fixture bytes, deliberate edits, revoked grants, counters and historical evidence survive ordinary repeated seed. Seeded approved records are explicitly SQL fixtures, distinct from runtime approval events tested through API-C03.

## P05 handover and stopping point

Next bounded dependency: **P05 — Planner and controlled changes**. Read the [starter prompt](p05-starter-prompt.md), current main, actual P04 publication record, ADR-0009, DAT-06 and BP-07 SC-07/SC-08/TR-03/TR-08/TR-16/API-C04–07. P05 must add resource/calendar/skills/availability/reservation support, controlled confirmation/moves/cancellation, planner day/week/keyboard flows and contact/change consequences while retaining P04 exact scope/readiness.

Do not infer a proposal is booked. Do not bypass readiness or create a pack/acknowledgement circular dependency. Preserve earlier proposed records during additive schema expansion. P06 packs, P07 field, P08 offline, P09 reports, P10 Finance and later acceptance remain outside P05. P04 stops after verified publication; no P05 implementation begins here.

P04 control clarification: an explicit shutdown condition keeps mandatory isolation and shutdown authority applicable even on an Inspection task. Non-intervention alone cannot make such a declared control NotApplicable.
