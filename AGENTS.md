# Repository guidance

## Context

Powerplants One is Dean Fiedler's personal prototype in a public repository; its data, adapters and hosted demo are synthetic and private. Read `README.md`, `docs/STATUS.md` (current snapshot; `docs/STATUS-log.md` holds the archived chronology) and the relevant parts of the current blueprint before making changes. Follow current user instructions; historical document approval gates are business context, not evidence that the user must re-authorise already requested repository work.

## Evidence and scope

Preserve the distinction between a user decision, documented CREMS behaviour, bounded prior account observation, proposed design and unresolved question. Never turn a prototype, mocked response, disabled Smartsheet rule or example calculation into a production claim.

Retain issued source snapshots in `docs/reference/` unchanged. The working master uses a stable versionless filename; edit working specifications through reviewed changes and preserve baseline/traceability. Record newer decisions in `docs/decisions/` and update `docs/STATUS.md`. Preserve all existing parent requirement IDs. Derived registers must identify their source and remain consistent with the parent scope.

MYOB remains the intended ERP authority; SharePoint owns business documents; native CAD tools retain authoring responsibilities. This repository task does not authorise business transactions, production integration, customer communications or migration. Apply the actual scope of subsequent user instructions.

## Adopted naming and project instructions

Follow [PPO-STD-001](docs/standards/naming-conventions.md) and [ADR-0005](docs/decisions/ADR-0005-project-naming-adoption.md). Powerplants One / PPO is independent of the other project's STD-001 and SOL008. Current master: `docs/blueprints/BP-01-master-blueprint.md`. Preserve the exact issued references and all 78 parent IDs. Apply documented local-to-source mappings; do not rename external records. Keep the maintained [ChatGPT instructions](docs/standards/chatgpt-project-instructions.md) aligned with substantive decisions without treating a copied instruction block as fresher than the repository.

HTML packages must follow [scope/design conformance](docs/standards/html-module-conformance.md): retain the existing scope ID, select the r20 page type, name reused components and incoming/outgoing handovers, and expose proposed departures before baseline adoption.

## Implementation

Keep changes small enough to review. Inspect existing work before editing. Use branches and pull requests; report validation and any limits accurately. Avoid unrequested frameworks, dependencies, services, deployment infrastructure or bulk issue creation.

Use synthetic or specifically approved redacted fixtures. Keep credentials, connection strings, raw production exports and operational documents outside the repository. `.gitignore` is a convenience, not a security boundary. Do not place secrets in examples, issues, logs or test evidence.

Before choosing a technology, capture the reason, constraints and alternatives in an architecture decision record. Use stable internal IDs and explicit external company/entity keys; do not invent undocumented ERP endpoints or CREMS formulas.

A database migration is never confined to the domain it serves. Several suites assert the exact contents of the migration registry, so adding one changes them all: migration 0021 turned three CI jobs red through eight assertions in files with no CRM connection. Before opening the pull request, update the applied-version list in `tests/database/field.test.ts`, `finance-upgrade.test.ts`, `offline.test.ts`, `packs.test.ts`, `planner.test.ts` and `reports.test.ts`; `atVersion(N)` and both `>=18` lists in `tests/database/leads-projects-integration.test.ts`; and the added-migration count in `tests/demo/upgrade.test.ts`. Seed entries in `scripts/migration-registry.ts` must be registered against an existing migration and in increasing version order. The `latestMigrationVersion` comparison in `scripts/demo-upgrade.ts` is a review gate on the hosted-demo upgrade path, not a number to bump without reading what it guards. Read the live schema rather than the migration file that introduced an object: later migrations amend earlier ones.

The runner applies every pending migration in one transaction, so a migration is also not confined to itself. 0026 backfills identities for existing estimates and leaves deferred `identity_target` events pending on `ppo.business_identities`; PostgreSQL refuses to `ALTER` a table in that state, and 0029 failed two Estimating upgrade tests that way. A migration that alters `ppo.business_identities` (the 0020 idiom for a new identity type) must run `SET CONSTRAINTS ppo.identity_target IMMEDIATE` first and `SET CONSTRAINTS ppo.identity_target DEFERRED` straight after its ALTERs. Proving a migration alone against a current database does not show this; only an upgrade across 0026 with estimates present does.

A new `Capability` in `src/platform/permissions.ts` is not confined to permissions either. The AD-01 access-review design is generated from that file and its job fails on stale output: run `python3 scripts/build-access-review.py` on LF bytes (a CRLF working copy embeds the wrong source hash), add a plain-English label in `docs/design/access-review/model.js`, and move the pinned size of the contract in `scripts/check-access-review-model.mjs`, `scripts/check-access-review-browser.mjs` and `docs/design/access-review/workspace.js`. A seed that adds any grant must also extend the reseed allowlist in `tests/database/quality-upgrade.test.ts` and the exact added-grant set in `tests/helpers/engineering-materials-grants.ts`: the two Estimating upgrade proofs (`estimating.test.ts`, `estimating-workspaces.test.ts`) snapshot the whole of `ppo.permission_grants` across the upgrade, and seed 29 was the first since 0020 to add rows to it. Any seed above 17 also replays on the hosted-demo upgrade, so `tests/demo/upgrade.test.ts` counts its users.

## Validation and handover

Run `python3 scripts/check_foundation.py` for foundation changes and `python3 scripts/check_prototype.py` for PP-01 package changes. Run `python3 scripts/check_naming.py` for naming/guidance changes. Add meaningful application tests only when application behaviour exists. The current check is documentation assurance, not business acceptance.

The database suites refuse to run against any database but `ppo_synthetic_test`. A local environment without a document renderer or the hosted-only identity migration produces failures that are not regressions: `RenderOrStorageFailure` in the report-producing tests, and `relation "ppo.demo_testers" does not exist` in `tests/demo/database.test.ts`. Confirm any failure against an unmodified `main` before attributing it to the change in hand.

Link work to requirement, decision, interface and acceptance IDs where relevant. Explain what changed, what was checked and what remains open. Keep code delivery status separate from business approval and production readiness.
