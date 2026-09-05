# Powerplants One

Private prototype of an integrated business operations platform for Powerplants Australia, covering CRM, estimating, engineering, projects, service, supply chain and finance.

**Owner:** Dean Fiedler (`deanrfiedler-gif`) · **Stage:** P04 work scope, coverage and readiness component-verified; component/publication record in the handover · **Deployment:** none.

This repository is Dean's personal private prototype. It contains the planning foundation, source references and development backlog. It now contains a local synthetic application with customer, contact, site, equipment, intake, owned follow-up and controlled work-order screens. The complete service journey remains planned. Company ownership, production approval and external-system write authority are not implied.

## Start here

| Document | Purpose |
|---|---|
| [First Prototype Definition & Architecture](docs/prototype/README.md) | Selected service journey, BP-02/BP-07, data/API/Finance/document contracts, acceptance and ordered implementation |
| [Adopted naming standard](docs/standards/naming-conventions.md) | Powerplants One / PPO naming, references, revisions and implementation rules |
| [ChatGPT project instructions](docs/standards/chatgpt-project-instructions.md) | Copy-ready instructions for the dedicated design and development project |
| [Current project status](docs/STATUS.md) | What exists, what remains planned and how recent user decisions relate to the issued blueprint |
| [Master Blueprint — working r03](docs/blueprints/BP-01-master-blueprint.md) | Scope Assurance & Development Planning Edition: seven domains, 78 parent requirements and release contracts |
| [Documentation index](docs/README.md) | Where specifications, decisions, requirements and acceptance records belong |
| [Development backlog](docs/delivery/backlog.md) | Initial discovery/design work packages and their live GitHub issue links |
| [First-release plan](docs/delivery/first-release.md) | Proposed planned-service journey, dependencies and readiness criteria |
| [Contributing](CONTRIBUTING.md) | Branches, pull requests, validation and evidence |

## Product direction

The proposed platform connects customer relationships, scoping and quotation, design, delivery, material coordination and equipment service. The candidate first release addresses prepared job packs, technician scheduling, relevant history, field evidence and a reviewed Finance handoff.

MYOB Acumatica remains the intended authoritative ERP. SharePoint remains the intended business-document repository, subject to the actual supported configuration. Native CAD authoring remains in suitable engineering tools. Pipedrive and Smartsheet continue their current roles until an explicitly accepted transition. No live source integration or operational data migration has been implemented here.

## Repository structure

| Location | Content |
|---|---|
| `docs/standards/` | Adopted naming, migration/exception registers and ChatGPT project instructions |
| `docs/blueprints/` | Stable working master and module blueprints |
| `docs/prototype/`, `docs/contracts/` | PP-01 scope/traceability and selected data/API/Finance/document contracts |
| `docs/reference/` | Historical master/audit and source-provenance manifest |
| `docs/decisions/` | Current decision register and architecture decision records |
| `docs/requirements/` | All 78 parent requirements with source/release/test linkage |
| `docs/architecture/` | BP-02 architecture recommendation, boundaries and feasibility obligations |
| `docs/testing/` | Full acceptance catalogue, P01/P02/P03/P04 component evidence and dependency inventory |
| `docs/delivery/` | Backlog, first-release plan and foundation handover |
| `.github/` | Issue forms, pull-request template, documentation and application assurance workflows |
| `scripts/` | Repository assurance, local launcher, database lifecycle and persistence proof |

Application code is in `src/`, explicit SQL migrations and fixtures are in `db/`, and runtime checks are in `tests/`. See [P04 setup, verification and handover](docs/delivery/p04-handover.md) and [ADR-0006](docs/decisions/ADR-0006-p01-local-foundation.md) for the local-only implementation and limits.

## Run the local application

Follow the [exact setup and run commands](docs/delivery/p04-handover.md#versions-and-exact-commands): Node 24.20.0, npm 11.19.0, PostgreSQL 16.15, `npm ci`, ignored local configuration, migration/seed and `npm run dev`. Open `http://127.0.0.1:3000`. Production startup is intentionally refused. The handover includes test, reset and recovery commands.

## Working screens

Open My Work at `/work`, customer context at `/customers`, contacts at `/people`, sites at `/sites`, equipment at `/equipment`, service requests at `/service/tickets`, and work orders at `/service/work-orders`. Choose a server-backed synthetic identity. Foundation checks remain available as diagnostics. Incomplete intake retains owned unknowns; triage does not authorise work or book attendance. Activities retain explicit unknown due dates and require an outcome on completion.

## Working checks

With Python 3 installed, run:

```sh
python3 scripts/check_foundation.py
python3 scripts/check_prototype.py
python3 scripts/check_naming.py
```

The check verifies reference hashes, register counts/IDs, local Markdown links and selected repository hygiene. It is not an application, security or business-acceptance test. The GitHub workflow runs the same check with read-only repository permissions; enforcement through branch protection is a separate account/settings matter.

Use [Issues](https://github.com/deanrfiedler-gif/powerplants-one/issues) for development work and [pull requests](https://github.com/deanrfiedler-gif/powerplants-one/pulls) for reviewable changes. P01/P02/P03 are component-verified; P04 adds exact scope approval, coverage, authority, stage-specific readiness and Proposed visits. Its actual verification/publication state is recorded in the [P04 handover](docs/delivery/p04-handover.md). P05 is the next bounded task in the [ordered prototype plan](docs/delivery/prototype-implementation-plan.md).
