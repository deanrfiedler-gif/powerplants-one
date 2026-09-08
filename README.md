# Powerplants One

P11's [repair PR #63](https://github.com/deanrfiedler-gif/powerplants-one/pull/63) adds explicit Finance context-read recovery and bounded browser diagnostics after the original merged-main verification failed. The [handover](docs/delivery/p11-handover.md) and its authoritative external publication establish the latest exact-head and actual-main result; the original PR #57 merge alone does not enable P12.

Private prototype of an integrated business operations platform for Powerplants Australia, covering CRM, estimating, engineering, projects, service, supply chain and finance.

**Owner:** Dean Fiedler (`deanrfiedler-gif`) · **Stage:** P11 integrated quality implementation; exact delivery publication in its linked handover; P12 prepared only · **Deployment:** none.

This repository is Dean's personal private prototype. It contains the planning foundation, source references and development backlog. It now contains a local synthetic application with customer, contact, site, equipment, intake, owned follow-up and controlled work-order screens. Integrated Service/Finance verification is in progress; the complete PP-01 acceptance boundary still requires P12. Company ownership, production approval and external-system write authority are not implied.

## Start here

| Document | Purpose |
|---|---|
| [First Prototype Definition & Architecture](docs/prototype/README.md) | Selected service journey, BP-02/BP-07, data/API/Finance/document contracts, acceptance and ordered implementation |
| [Adopted naming standard](docs/standards/naming-conventions.md) | Powerplants One / PPO naming, references, revisions and implementation rules |
| [ChatGPT project instructions](docs/standards/chatgpt-project-instructions.md) | Copy-ready instructions for the dedicated design and development project |
| [Current project status](docs/STATUS.md) | What exists, what remains planned and how recent user decisions relate to the issued blueprint |
| [Master Blueprint — working r04](docs/blueprints/BP-01-master-blueprint.md) | Scope Assurance & Development Planning Edition: seven domains, 78 parent requirements and release contracts |
| [Documentation index](docs/README.md) | Where specifications, decisions, requirements and acceptance records belong |
| [Development backlog](docs/delivery/backlog.md) | Initial discovery/design work packages and their live GitHub issue links |
| [CRM blueprint and discovery handover](docs/delivery/crm-discovery-handover.md) | PPO-009 parallel CRM design, bounded Pipedrive evidence, synthetic wireframes and first implementation starter; account parity remains open |
| [Estimating discovery and design](docs/delivery/estimating-discovery-handover.md) | PPO-010 / BP-04 source evidence, synthetic costing/quotation preview, acceptance plan and prepared E1 starter |
| [Estimating E1 implementation](docs/delivery/estimating-e1-handover.md) | Authorised manual estimating and exact draft quotation increment; current verification state and limits |
| [CRM I1 handover](docs/delivery/crm-i1-handover.md) | Bounded owned opportunity implementation and actual verification/publication |
| [CRM I2 handover](docs/delivery/crm-i2-handover.md) | Scoped Board/Grid worklist, shared brand, actual runtime evidence and external publication |
| [Customer portal design](docs/delivery/customer-portal-handover.md) | Customer roles, support/publication contracts, clickable walkthrough and bounded CP1–CP5 readiness |
| [First-release plan](docs/delivery/first-release.md) | Proposed planned-service journey, dependencies and readiness criteria |
| [Projects discovery and design](docs/delivery/projects-discovery-handover.md) | BP-06 source assessment, first-increment contract and project list/detail designs; J1 prepared only |
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
| `docs/testing/` | Full acceptance catalogue, P01–P09 component evidence and dependency inventory |
| `docs/delivery/` | Backlog, first-release plan and foundation handover |
| `.github/` | Issue forms, pull-request template, documentation and application assurance workflows |
| `scripts/` | Repository assurance, local launcher, database lifecycle and persistence proof |

Application code is in `src/`, explicit SQL migrations and fixtures are in `db/`, and runtime checks are in `tests/`. See [P08 setup, verification and handover](docs/delivery/p08-handover.md) and [ADR-0006](docs/decisions/ADR-0006-p01-local-foundation.md) for the local-only implementation and limits.

## Run the local application

Follow the [exact P08 setup and run commands](docs/delivery/p08-handover.md#runtime-setup-and-recovery): Node 24.20.0, npm 11.19.0, PostgreSQL 16.15, `npm ci`, ignored local configuration, migration/seed and `npm run dev`. Open `http://127.0.0.1:3000`. Production startup is intentionally refused. The handover includes test, reset and recovery commands.

Job-pack preparation and issue are at `/service/packs`; exact documents at `/documents/:issue_id`. Install the matching Chromium renderer and retain its private output directory outside Git as described in the P06 handover.

Technicians use `/my-jobs` and `/my-jobs/:id`. Riley and Morgan acknowledge and start independently. Supported fictional PNGs are registered, uploaded and verified before availability. Completion drafts can be submitted separately for service review at `/service/reports`. Exact reviewed HTML/PDF, owned remaining work, immutable report revisions and customer responses are available in the P09 implementation. **Field workflow preview — integrated acceptance incomplete**. The dedicated `/offline/index.html` workspace downloads up to two permitted jobs, commits original evidence and PNGs to IndexedDB, and explicitly retries bounded original operations with per-item receipts and owned exception recovery. Offline authority remains provisional.

## Working screens

P11's bounded exceptions/recovery checkpoint is at `/admin`, using existing current-owner recovery permissions. Cross-tab identity changes clear displayed business and diagnostic views. [P11 handover](docs/delivery/p11-handover.md) records implemented fixes, actual verification limits and outstanding integrated work. Final contribution and merged-main completion are established by the handover’s authoritative external record; [P12](docs/delivery/p12-starter-prompt.md) is prepared only.

Open My Work at `/work`, customer context at `/customers`, contacts at `/people`, sites at `/sites`, equipment at `/equipment`, service requests at `/service/tickets`, and work orders at `/service/work-orders`. Use Change identity to open the compact server-backed synthetic identity controls. Foundation checks remain available as diagnostics. Incomplete intake retains owned unknowns; triage does not authorise work or book attendance. Activities retain explicit unknown due dates and require an outcome on completion.

CRM Sales is at `/crm/opportunities`; Board and List present the same permitted page while retaining search, filters and sort. New opportunity and canonical detail continue through I1's existing qualification and Activity journey. The fictional pipeline remains Enquiry → Qualified with sales outcome Open. [I1 handover](docs/delivery/crm-i1-handover.md) and [I2 handover](docs/delivery/crm-i2-handover.md) record actual verification and publication. Counts describe the returned page; no commercial fields, stage movement or CRM offline support are added. Broader CRM parity remains proposed.

## Working checks

With Python 3 installed, run:

```sh
python3 scripts/check_foundation.py
python3 scripts/check_prototype.py
python3 scripts/check_naming.py
```

The check verifies reference hashes, register counts/IDs, local Markdown links and selected repository hygiene. It is not an application, security or business-acceptance test. The GitHub workflow runs the same check with read-only repository permissions; enforcement through branch protection is a separate account/settings matter.

Use [Issues](https://github.com/deanrfiedler-gif/powerplants-one/issues) for development work and [pull requests](https://github.com/deanrfiedler-gif/powerplants-one/pulls) for reviewable changes. P01–P04 are component-verified. P05 adds controlled crew confirmation/reservations, day/week planning, accessible moves, contact/change requests and cancellation. Its actual verification/publication state is recorded in the [P05 handover](docs/delivery/p05-handover.md). [P06 handover](docs/delivery/p06-handover.md) records controlled output, individual acknowledgement and current publication. [P07 handover](docs/delivery/p07-handover.md) records assigned jobs, personal actual start, typed capture, durable synthetic photos, successor corrections and completion drafts. [P08 handover](docs/delivery/p08-handover.md) records durable offline queue/recovery implementation and actual verification/publication state. [P09 handover](docs/delivery/p09-handover.md) records exact submission, authorised service review, controlled customer reports and content-bound responses under [issue #36](https://github.com/deanrfiedler-gif/powerplants-one/issues/36) / [PR #37](https://github.com/deanrfiedler-gif/powerplants-one/pull/37). The complete PP-01 journey remains incomplete.

P09 service review and reports are implemented under [PR #37](https://github.com/deanrfiedler-gif/powerplants-one/pull/37). See the [P09 handover](docs/delivery/p09-handover.md) for exact transition, output, offline and verification limits. Separately authorised [P10 #45 / PR #48](https://github.com/deanrfiedler-gif/powerplants-one/pull/48) adds Finance handoffs at `/finance/handoffs` and restricted customer accounts reached from that queue. Use the Finance preparer, reviewer, processor and reconciler identities for their distinct actions. The [P10 handover](docs/delivery/p10-handover.md) records actual checks, failed runs, setup and remaining verification. SyntheticManual is the default; SyntheticApi is only the bounded timeout fixture. No live ERP action, customer distribution or full PP-01 acceptance is implied.

P11 Travel continuation: [ADR-0018](docs/decisions/ADR-0018-p11-travel-and-integrated-quality.md) records the approved synthetic whole-minute NonBillable/no-posting treatment. Additive migrations 0013/0014 and seeds 13/14 preserve P10 originals, Finance policy history and v1 output definitions while adding the bounded Travel and branded v2 output successors. See the P11 handover and authoritative publication for exact verification, failed-run dispositions and remaining procedure limits.
