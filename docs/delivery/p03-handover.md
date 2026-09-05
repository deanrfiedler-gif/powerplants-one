# P03 — Customer context, service intake and owned follow-up handover

**Revision:** r01 · **Date:** 5 September 2026 · **Owner:** Dean Fiedler · **Environment:** private local synthetic prototype.

**Delivery state:** Implemented under [issue #24](https://github.com/deanrfiedler-gif/powerplants-one/issues/24) and [PR #25](https://github.com/deanrfiedler-gif/powerplants-one/pull/25), branch `feature/p03-customer-intake`; implementation and component verification are complete. The linked delivery record holds the exact final PR head, delivered tree, merge SHA and merged-main checks, which cannot be embedded in the commit they identify. P04 has not started; PP-01 and all full PT/AT procedures remain incomplete.

[Decision and compatibility](../decisions/ADR-0008-p03-customer-intake.md) · [Current API amendment](../contracts/service-api.md#p03-implementation-amendment--current-bounded-contract) · [P02 handover](p02-handover.md) · [Ordered plan](prototype-implementation-plan.md).

## Verified starting point and repository controls

Starting main was exactly `4caac32d5c581c40a435021c2aff5cd3d79e20c8`, tree `d2862a0a74769768a5c2cad98fff31159eb50de8`. Authenticated account deanrfiedler-gif had repository write/admin permission; visibility was private and default branch main. Issues/PRs showed no subsequent P03 work. A clean checkout at that exact tree was cloned into an isolated local checkout; no unrelated work was changed. Remote publication uses the selected connected GitHub tools, with exact local/remote tree comparisons. Maintained BP-07 still said no screens were implemented and BP-02 described P01-only environment proof; their status text is now aligned with the explicit P03 amendments, without changing the issued baselines.

Main reported `protected=false` and no required contexts. Detailed protection inspection returned integration 403; repository ruleset inspection returned plan-capability 403. These limits do not establish an independent review requirement or permission to bypass one. Final normal merge must respect actual PR checks/review state; no settings, membership or visibility changes were made. Implementation self-review and manual screenshot inspection are recorded separately from independent review, which has not occurred.

## Versions and configuration

All P01/P02 pins and the lockfile are retained: Node **24.20.0**, npm **11.19.0**, Next.js **16.3.4**, React/React DOM **19.2.8**, TypeScript **6.0.3**, PostgreSQL **16.15**, `pg` **8.23.0**, Playwright **1.63.0**. No dependency installation beyond the existing locked set or licence/hosting change was needed. [Package](../../package.json), [lockfile](../../package-lock.json) and [dependency inventory](../testing/p01-dependencies.json) remain authoritative.

Start ignored configuration from [.env.example](../../.env.example): `PPO_ENV=local-synthetic`, `PPO_EXPOSURE=loopback`, `PPO_IDENTITY=synthetic`, `PPO_PORT=3000`, `NEXT_TELEMETRY_DISABLED=1`, and `DATABASE_URL=postgresql://ppo_local:<local-password>@127.0.0.1:5432/ppo_synthetic`. Choose a local disposable password and URL-encode it in the URL. Only `ppo_synthetic` and `ppo_synthetic_test` are accepted database names; remote hosts, URL options and shared/production identity are refused. Never commit `.env.local`, `.env.postgres.local` or dumps.

## Exact install and fresh setup

On a private developer machine with Git, Python 3, nvm and Docker:

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

Main commands target the completed merge; before merge use `git switch feature/p03-customer-intake`. An equivalent exact Node installation is acceptable. PowerShell copy is `Copy-Item .env.example .env.local`. Replace `<local-password>` locally and create ignored `.env.postgres.local`:

```text
POSTGRES_USER=ppo_local
POSTGRES_PASSWORD=<same-local-password>
POSTGRES_DB=ppo_synthetic
```

For a **new** database container only:

```sh
docker run --name ppo-p03-postgres --env-file .env.postgres.local -p 127.0.0.1:5432:5432 -v ppo-p03-pgdata:/var/lib/postgresql/data -d postgres:16.15
docker exec ppo-p03-postgres pg_isready -U ppo_local -d ppo_synthetic
npm run db:migrate
npm run db:seed
npm run db:health
npm run dev
```

Open `http://127.0.0.1:3000/work`, choose Coordinator and **Use this identity**. Compare Site observer Q01, Company B, Finance context and Systems. Switching changes server identity/attributable actor and clears displayed records and unsaved forms. `npm run build` compiles; `npm start` deliberately refuses production startup. Stop the app with Ctrl+C. `docker stop ppo-p03-postgres` / `docker start ppo-p03-postgres` retain the volume. No port forwarding, tunnel or hosting is part of this runbook.

## P02 upgrade and recovery

Use the existing P02 PostgreSQL volume and ignored configuration; do not start a competing container on port 5432. Stop the app and preserve valued synthetic work privately before upgrading:

```sh
docker exec ppo-p02-postgres pg_dump -U ppo_local -d ppo_synthetic -Fc > ../ppo-p02-before-p03.dump
git switch main
npm ci
npm run db:migrate
npm run db:seed
npm run db:health
npm run dev
```

Substitute the actual existing container name; the dump stays outside the repository. Migration 0003 runs transactionally under the existing migration lock/checksum mechanism. Applied 0001/0002 bytes are unchanged. Seed receipt 3 is additive and works alongside receipt 2; normal repeat seed never overwrites edits, revives revoked grants, duplicates follow-up or rewinds counters. Derived new activity capabilities use only still-active source grants. A revoked original permission is not recreated merely to fit the demonstration.

Legacy ticket IDs/references/versions/fields/audit/receipts/outbox remain unchanged. Additive physical mapping version 1 and LegacyUnverified received-time provenance keep unknowns explicit; rich commands explicitly use physical mapping 2/UserReported. P01 SaveTicketDraft retains schema 1 and the original normalised operation hash. Rich edit uses SaveTicketIntake; historical receipts are neither invalidated nor reinterpreted. Person identity/source keys and immutable original technical history are retained.

On migration failure its transaction rolls back. Preserve the database/error, correct an unapplied forward migration or add a later version after application; never edit stored checksums or applied SQL. P03 provides no down migration. To return to P02, stop all processes and restore the private pre-upgrade dump into a separate allowlisted disposable database, check out the corresponding P02 source and verify it. The Docker backup/restore instructions have not been executed on Dean's machine; no operational migration or recovery-time promise is claimed.

## Exact tests and disposable reset

Use a separate test database. With an existing developer container, substitute its name:

```sh
docker exec ppo-p03-postgres createdb -U ppo_local ppo_synthetic_test
```

Change only the ignored `.env.local` database path to `/ppo_synthetic_test`, stop the app, then run:

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

Database tests reset only `ppo_synthetic_test` between cases. From a second terminal with that server running:

```sh
npm run test:http
```

Stop that server before CI-style browser execution, or allow Playwright to reuse it outside CI:

```sh
npx playwright install chromium
npm run test:browser
```

Linux may require `npx playwright install --with-deps chromium`, as used in the authorised ephemeral Ubuntu CI runner. The explicit process-restart proof on a clean test database is:

```sh
node --env-file=.env.local --import tsx scripts/persistence-proof.ts write
docker restart ppo-p03-postgres
docker exec ppo-p03-postgres pg_isready -U ppo_local -d ppo_synthetic_test
node --env-file=.env.local --import tsx scripts/persistence-proof.ts verify
```

It writes a P01 ticket sentinel, P02 organisation/receipt and P03 activity/link/receipt, then verifies them from a new process after real PostgreSQL restart. The script rejects another database name. On PowerShell set `$env:PPO_ALLOW_RESET='dispose-synthetic'` and `$env:PPO_RESET_DATABASE='ppo_synthetic_test'`, run `npm run db:reset`, then remove those two environment values.

**Disposal is different from reseeding.** With the app stopped, `PPO_ALLOW_RESET=dispose-synthetic PPO_RESET_DATABASE=ppo_synthetic npm run db:reset` destroys the entire named disposable synthetic database's PPO schema/evidence universe and recreates it. Accepted identities persist during normal operation/reseeding; whole-universe disposal deliberately removes them. Missing confirmation or mismatched database is refused. Never use reset as upgrade recovery for valued work.

## Delivered screens, records and permissions

| Screen | Implemented business use |
|---|---|
| SC-01 `/work`, `/work/new`, `/work/:id` | Scoped owner/status/type/search/due filters, overdue/upcoming/due-needed groups, permitted links, active edit/reassignment/start and owner completion/cancellation with outcome/reason. Empty and failed reads differ. No invented downstream queues. |
| SC-02 `/customers`, `/customers/:id`, `/people`, `/people/:id` | Scoped lists/search, distinct same-name organisations and duplicate candidates, shared Person affiliations, relationship owners, effective site relationships, ERP mapping status without general source keys. Bounded synthetic creation/affiliation actions reuse P02 commands. |
| SC-03 `/sites`, `/sites/:id`, `/equipment`, `/equipment/:id` | Site/operator/owner/billing/contact/timezone/access context, equipment hierarchy and uncertainty, configurations and attributed technical history, permitted intake entry and bounded history/context capture. Move/supersession/correction workflows remain deferred. |
| SC-04 `/service/tickets`, `/service/tickets/new`, `/service/tickets/:id` | Persisted complete/incomplete intake, editable New/NeedsInformation drafts, stage blockers, atomic owned clarification and bounded triage. No later ticket states or work-order workflow. |

The seven domains and navy/green responsive shell remain; the domain list opens on request to reduce header height on phones. Foundation checks are diagnostics. Server-derived workspace/company/site capabilities, restricted DTOs, atomic references, version/receipt checks and synthetic adapter boundaries are reused. Systems and unassigned Technician have no business access; Assignment scope remains disabled. Owner selectors recheck valid business users. Ownership never grants linked-record access; an inaccessible target suppresses an entire activity including summaries/outcomes. FinanceQuery requires RestrictedFinance. General customer views never expose account keys or Finance amounts; the dedicated previously authorised mapping route retains exact source keys.

New typed Activity/ActivityLink uses the existing identity registry with UUID only, immutable supported links and real composite foreign keys to Organisation/Site/Asset/Ticket. Unknown due dates are explicit. New history distinguishes reported symptoms, suspected causes, attempted fixes and verified findings without inventing verification. Original unsuccessful cable replacement, source author/time/site/operator and uncertainty remain visible where permitted; the historical OEM note is unchanged and now supplemented by a real owned follow-up activity. Similar serial candidates remain distinct assets.

## Commands and transitions

Exact fields, validation, narrow read filters and API-C24 extension are in the linked API amendment; [domain services](../../src/service/intake.ts) and [activities](../../src/activities/activities.ts) are executable schemas.

| Command | P03 transition / gate |
|---|---|
| CreateTicket / SaveTicketIntake | Create New; rich edit New/NeedsInformation with expected version, owner, next action and explicit unknowns. No unrestricted status update. P01 SaveTicketDraft remains separate. |
| RequestTicketInformation | New → NeedsInformation; questions, next action, owned CustomerContact and Ticket link, audit, receipt and outbox commit atomically. Identical retry creates no duplicate. |
| TriageTicket | New/NeedsInformation → Triaged; known requester/site, UserReported received time, symptom, impact, rationale, next action and valid owner. NeedsInformation also requires completed clarification with outcome and explicit resolution. |
| CreateActivity / UpdateActivity | Create Open; update active summary/owner/due only. Kind/link/company/site/class context is fixed. |
| Start / Complete / Cancel Activity | Owner-only Open → InProgress; Open/InProgress → Completed with outcome or Cancelled with reason. Terminal content is retained, no reopen. |

The stricter known-requester/site gate is a documented P03 amendment: the broader approved identification scope requires P04 authority and cannot be fabricated here. Urgent bypasses nothing. Triage is no work authorisation, booking, dispatch, SLA promise or financial release. CustomerContact is no proof of sending/delivery/acknowledgement; appointment-dependent ContactOutcome is deferred. MYOB/SharePoint/native CAD ownership remains as previously stated; no live integration or operational authority is resolved.

Commands reject unlisted fields, validate narrative bounds and preserve exact external text. Current permissions govern direct commands, every page/filter/traversal/owner selector and receipt replay. Stale proposals cannot overwrite newer versions; changed operation reuse is rejected. Forms retain entries after validation/conflict/retryable errors; comparison and adoption of a newer expected version are explicit. Retry of an uncertain result uses the original operation content, without claiming a save until a receipt arrives. Required business/link/audit/receipt/outbox writes roll back together. No outbox worker runs.

## Actual verification and limitations

Local environment: isolated Linux checkout, exact Node/npm binaries verified, existing locked dependency tree reused; `npm run check` executes lint, TypeScript, four unit cases and production compilation. Fresh `npm ci` and exact package inventory are separately exercised in CI. Local PostgreSQL could not start because `runuser -u nobody -- id` returned `cannot set groups: Operation not permitted`. No restriction was bypassed and no in-memory substitute was used. Real database, HTTP, restart and Chromium proofs run in authorised GitHub Actions on Ubuntu 24.04 with PostgreSQL 16.15 and browser viewports 1440×1000 and 390×844. No remote hosting occurs.

| Source / run | Actual result |
|---|---|
| `08bafb7c0a8e2c7060752158df540fdd2e8042b5`, application [33947714515](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/33947714515) | Install/static/unit/build and migration passed; fresh seed failed because richer defaults rejected legacy P01 seed rows. Fixed in the unreleased P03 migration; original applied migrations untouched. Downstream checks were skipped, not passed. |
| `c59fc68539f67334b267853c301a9f6218f33e30`, application [33947886803](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/33947886803) | Install/static/unit/build, fresh/upgrade/reset, 29 PostgreSQL cases, 4 HTTP cases and restart proof passed. Six retained browser cases passed; six P03 cases stopped at exact label lookup. Label markup was corrected; the later complete runs below passed. |
| Documentation [33947714436](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/33947714436) / [33947886805](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/33947886805) | Passed on the corresponding earlier heads; final maintained-document checks are rerun before publication. |

P03 database/HTTP cases exercise same-name/shared-contact/source-key/scoped traversal, owner and restricted link projections, complete/incomplete/urgent intake, invalid/valid TR-01, all exposed activity states/due modes, concurrent ticket allocation/competing updates, stale/retry/conflicting-operation/current-permission replay, and injected activity/link/audit/receipt/outbox failure rollback. Upgrade compares real P02 fixtures plus deliberate edits and accepted P01 evidence; fresh setup and seed/reset/restart are separate checks. P01 upgrade coverage remains intact. Application run [33948546059](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/33948546059) and documentation run [33948546055](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/33948546055) passed at head `a274fcca88f84d020226f1ee0a73084755644dab`, tree `ecba6c14e18ad11298f99b32f6a4ed1e7819c35f`: 4 unit, 29 PostgreSQL, 4 HTTP and all 12 Chromium cases, with fresh install/build/migration/reset/restart. Manual inspection of its desktop/mobile captures found open-ended mapping labels and capture-before-related-load issues; these were corrected, the domain list was collapsed by default, and final verification additionally exercises unreadable accepted responses and competing P01/P03 writes. A subsequent presentation refinement at `bebf165fe20e056f5e1a989776250bac91e9edac` failed lint in [33948947783](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/33948947783): render-time clock access was impure. The interval labels now use the server read envelope's observed time, with local lint/type/unit/build passing; downstream checks from the failed run are not claimed. Documentation [33948947910](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/33948947910) passed. The final application run [33949129677](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/33949129677) and documentation run [33949129640](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/33949129640) passed at PR head `8e32049373fd13749cfb77b177f209e9f98d35d9`, delivered implementation tree `ead79d134fb8e5753bc480e16de0f6a8e862cc94`: **4 unit, 29 PostgreSQL, 4 HTTP and 12 Chromium cases**, including the added cross-version write race and accepted-response retry. All install, lint, type, build, migration, upgrade, fresh seed/reset, health and real database restart stages passed. The final documentation/evidence-only publication receives fresh PR checks; exact final head/tree, workflow IDs, merge result and merged-main checks are recorded in issue #24.

All **38 original desktop/mobile PNGs** from artifact `9964287660` were manually inspected by the implementing agent. The [durable screenshot index and inspection notes](../testing/evidence/p03/README.md) link each capture, with source paths, dimensions and SHA-256 hashes in the [manifest](../testing/evidence/p03/manifest.json). The source artifact archive SHA-256 is `5d79ba59fc737e3839af9d4bd2500167e00198b1e44b4c30a99db4139b6afbab`. Keyboard/label/focus and retained error/conflict data are exercised by Chromium; screenshots show the corresponding focus rings, multiline content, synthetic indicators and loaded business context. These are implementation self-review and component evidence, not independent review or a full acceptance pass.

Limitations: viewport Chromium is not real-phone, cross-browser, screen-reader, offline or full accessibility acceptance. Backup restore on Dean's machine is unexecuted. My Work offers My activities/all permitted owners (the API also accepts a permitted owner UUID). Selectors use bounded pages of up to 200 with existing-record preselection; advanced matching/merge, source verification, full relationship correction, asset moves/configuration supersession and downstream impact handling remain deferred. All 78 parent IDs, issued baseline bytes and full acceptance catalogue statuses are preserved. PT-02/PT-03/PT-04/PT-25 components do not pass the full procedures whose later prerequisites were not executed.

## Next bounded task — P04, not started

**P04 — Work scope, coverage and readiness.** Verify current main, issue/PR #24/#25 publication record and this handover before editing. Read the maintained plan, ADR-0008, BP-07 SC-05/TR-02, DAT-05–06, API-C03 and PT-04/PT-05 alongside applicable authority/readiness rules. Reuse current identity, references, permission scope and atomic operations.

Deliver only SC-05: typed WorkOrder and explicit ticket junction; work-scope revisions/items/assets/tasks; explicit authority and manual coverage evidence; readiness policy with permitted exceptions; planned visits. Identify exact scope/coverage/authority evidence and stage blockers before enabling Authorised. Preserve draft unknowns, stale/retry/rollback controls and shared immutable history. Resolve the approved identification-scope representation before allowing that alternative to known-site intake. Do not lift Proposed mappings or ReviewRequired configurations without their required evidence and controls.

Prepare an implementation issue/branch, additive migrations/seed, scoped API/UI and focused PostgreSQL/HTTP/browser evidence; reassess actual review/check requirements. P04 does not authorise planner, job packs, field capture, reports, Finance processing, offline queues, workers or live integration. Begin only under a separately authorised P04 task. P03 stops here and does not mark PP-01 complete.
