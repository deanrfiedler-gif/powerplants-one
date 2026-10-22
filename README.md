# Powerplants One

Powerplants One (PPO) is Dean Fiedler's personal prototype of a connected business operations platform for Powerplants Australia. It covers customer relationships, estimating, engineering, projects, service, supply chain and finance. The repository is public; its application, data and hosted demo remain private and synthetic.

PPO is intended to be the daily operational workspace, with MYOB Acumatica as the intended ERP book of record, SharePoint for business documents and native CAD tools for authoring. The [operating-model decision](docs/decisions/ppo-workspace-myob-book-of-record.md) defines these boundaries. [CREMS is historical background](docs/decisions/product-direction-quality.md). Prototype delivery does not imply operational acceptance, production readiness or authority to write to external business systems.

## Start here

| Need | Entry point |
|---|---|
| Current updates and historical status | [Status and source fragments](docs/STATUS.md) |
| Find a guide, contract or delivery record | [Documentation index](docs/README.md) |
| Product scope and parent requirements | [Master blueprint](docs/blueprints/BP-01-master-blueprint.md) |
| Selected service journey and acceptance | [First prototype package](docs/prototype/README.md) |
| Architecture and adopted decisions | [Decision control](docs/decisions/README.md) |
| Design, guides and reusable components | [Working design and build register](docs/design/development/README.md) |
| Naming and source preservation | [PPO-STD-001](docs/standards/naming-conventions.md) |
| Agent and contributor workflow | [Repository guidance](AGENTS.md), [contributing](CONTRIBUTING.md) and [ChatGPT project instructions](docs/standards/chatgpt-project-instructions.md) |

The status sources and feature records carry delivery and validation evidence. This introduction stays stable across ordinary feature PRs.

## Run the local application

Follow the [runtime maintenance instructions](docs/delivery/runtime-maintenance.md) and [local setup and recovery guide](docs/delivery/p08-handover.md#runtime-setup-and-recovery) for the supported Node/npm versions, PostgreSQL, ignored local configuration, synthetic database migrations and seeds. The repository's `.nvmrc` and `package.json` record its runtime constraints.

After completing those prerequisites:

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:3000`. Document-producing journeys also need the renderer and private output directory described in the setup guide. Production startup is intentionally refused. Hosted demo operation has its own [Azure runbook](docs/delivery/azure-private-demo.md); local development does not authorise deployment.

## Repository structure

| Location | Content |
|---|---|
| `src/`, `public/` | Application code and assets |
| `db/` | Explicit migrations, synthetic fixtures and number reservations |
| `tests/`, `scripts/` | Behaviour checks, repository assurance and local tooling |
| `docs/blueprints/`, `docs/contracts/`, `docs/requirements/` | Product scope, interfaces and requirement traceability |
| `docs/guides/`, `docs/delivery/`, `docs/testing/` | Usage, handovers and validation evidence |
| `docs/decisions/`, `docs/status/` | Decision records and isolated contribution summaries |
| `docs/design/development/` | Living page, guide and component registers |
| `docs/standards/`, `docs/reference/` | Standards, registration entries and preserved source references |
| `.github/` | PR template and assurance workflows |

## Contributing and checks

Use one task, branch and dedicated worktree, with an early draft PR declaring scope. Follow [Working in parallel](CONTRIBUTING.md#working-in-parallel). Maintain the relevant documentation chapter and add a [status fragment](docs/status/README.md); ordinary feature PRs leave this README and the shared landing pages unchanged.

Repository documentation checks use Python 3 (`python` on Windows where `python3` is unavailable):

```sh
python3 scripts/check_foundation.py
python3 scripts/check_prototype.py
python3 scripts/check_naming.py
python3 scripts/build_status.py --check
```

Run the applicable application checks from [Contributing](CONTRIBUTING.md#validation). Passing documentation checks is repository assurance, not business acceptance. Keep credentials and operational data outside the repository.

## Ownership and licence

Dean Fiedler owns this work. The repository is public for viewing only: all rights are reserved, and no licence to use, copy or modify it is granted ([LICENSE](LICENSE)). Third-party fonts, dependencies, the Powerplants name and logo, and retained references keep their own terms. The [visibility decision](docs/decisions/repository-visibility.md) records the repository's visibility policy.
