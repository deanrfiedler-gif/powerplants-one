# Powerplants One

Private prototype of an integrated business operations platform for Powerplants Australia, covering CRM, estimating, engineering, projects, service, supply chain and finance.

**Owner:** Dean Fiedler (`deanrfiedler-gif`) · **Stage:** P06 controlled job packs component-verified; exact publication state in the handover · **Deployment:** none.

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
| `docs/testing/` | Full acceptance catalogue, P01–P06 component evidence and dependency inventory |
| `docs/delivery/` | Backlog, first-release plan and foundation handover |
| `.github/` | Issue forms, pull-request template, documentation and application assurance workflows |
| `scripts/` | Repository assurance, local launcher, database lifecycle and persistence proof |

Application code is in `src/`, explicit SQL migrations and fixtures are in `db/`, and runtime checks are in `tests/`. See [P06 setup, verification and handover](docs/delivery/p06-handover.md) and [ADR-0006](docs/decisions/ADR-0006-p01-local-foundation.md) for the local-only implementation and limits.

## Run the local application

Follow the [exact P06 setup and run commands](docs/delivery/p06-handover.md#exact-runtime-setup-and-recovery): Node 24.20.0, npm 11.19.0, PostgreSQL 16.15, `npm ci`, ignored local configuration, migration/seed and `npm run dev`. Open `http://127.0.0.1:3000`. Production startup is intentionally refused. The handover includes test, reset and recovery commands.

Job-pack preparation and issue are at `/service/packs`; exact documents at `/documents/:issue_id`. Install the matching Chromium renderer and retain its private output directory outside Git as described in the P06 handover.

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

Use [Issues](https://github.com/deanrfiedler-gif/powerplants-one/issues) for development work and [pull requests](https://github.com/deanrfiedler-gif/powerplants-one/pulls) for reviewable changes. P01–P04 are component-verified. P05 adds controlled crew confirmation/reservations, day/week planning, accessible moves, contact/change requests and cancellation. Its actual verification/publication state is recorded in the [P05 handover](docs/delivery/p05-handover.md). [P06 handover](docs/delivery/p06-handover.md) records controlled output, individual acknowledgement and current publication. [P07 is prepared](docs/delivery/p07-starter-prompt.md); actual start/capture remains absent. The complete PP-01 journey remains incomplete.
