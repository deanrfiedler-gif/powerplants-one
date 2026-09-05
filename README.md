# Powerplants One

Private prototype of an integrated business operations platform for Powerplants Australia, covering CRM, estimating, engineering, projects, service, supply chain and finance.

**Owner:** Dean Fiedler (`deanrfiedler-gif`) · **Stage:** documentation and development planning · **Deployment:** none.

This repository is Dean's personal private prototype. It contains the planning foundation, source references and development backlog. It does not yet contain a runnable business application. Company ownership, production approval and external-system write authority are not implied.

## Start here

| Document | Purpose |
|---|---|
| [Current project status](docs/STATUS.md) | What exists, what remains planned and how recent user decisions relate to the issued blueprint |
| [Master Blueprint v02](docs/blueprints/GEN_SPC_PPABusinessPlatform_MasterBlueprint_v02.md) | Scope Assurance & Development Planning Edition: seven domains, 78 parent requirements and release contracts |
| [Documentation index](docs/README.md) | Where specifications, decisions, requirements and acceptance records belong |
| [Development backlog](docs/delivery/backlog.md) | Initial discovery/design work packages and their live GitHub issue links |
| [First-release plan](docs/delivery/first-release.md) | Proposed planned-service journey, dependencies and readiness criteria |
| [Contributing](CONTRIBUTING.md) | Branches, pull requests, validation and evidence |

## Product direction

The proposed platform connects customer relationships, scoping and quotation, design, delivery, material coordination and equipment service. The candidate first release addresses prepared job packs, technician scheduling, relevant history, field evidence and a reviewed Finance handoff.

MYOB Acumatica remains the intended authoritative ERP. SharePoint remains the intended business-document repository, subject to the actual supported configuration. Native CAD authoring remains in suitable engineering tools. Pipedrive and Smartsheet continue their current roles until an explicitly accepted transition. No integration or migration has been implemented here.

## Repository structure

| Location | Content |
|---|---|
| `docs/blueprints/` | Issued master and future module blueprints |
| `docs/reference/` | Historical master/audit and source-provenance manifest |
| `docs/decisions/` | Current decision register and architecture decision records |
| `docs/requirements/` | All 78 parent requirements with source/release/test linkage |
| `docs/architecture/` | Architecture work brief, boundaries and unresolved choices |
| `docs/testing/` | Planned acceptance catalogue and evidence standard |
| `docs/delivery/` | Backlog, first-release plan and foundation handover |
| `.github/` | Issue forms, pull-request template and documentation-check workflow |
| `scripts/` | Small repository-assurance utilities |

Application, database and deployment folders will be added after architecture decisions. Keeping one repository does not prescribe a particular framework or service topology.

## Working checks

With Python 3 installed, run:

```sh
python3 scripts/check_foundation.py
```

The check verifies reference hashes, register counts/IDs, local Markdown links and selected repository hygiene. It is not an application, security or business-acceptance test. The GitHub workflow runs the same check with read-only repository permissions; enforcement through branch protection is a separate account/settings matter.

Use [Issues](https://github.com/deanrfiedler-gif/powerplants-one/issues) for development work and [pull requests](https://github.com/deanrfiedler-gif/powerplants-one/pulls) for reviewable changes. The next recommended package is the BP-02 architecture and BP-07 service specification, with minimum Finance/document detail.
