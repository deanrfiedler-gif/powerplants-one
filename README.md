# Powerplants One

Current ES-07 continuation: [owned three-task Project branch resolution](docs/delivery/quotation-task-branch-handover.md). #352 is merged. The bounded branch receives A, B and C before withdrawing forecasts while preserving A → B, A → C, unmet Demand and independent holds. Exact validation and acceptance remain separate from deployment.


Personal prototype of an integrated business operations platform for Powerplants Australia, covering CRM, estimating, engineering, projects, service, supply chain and finance. The repository is public; the application, data and hosted demo remain private and synthetic.

**Owner:** Dean Fiedler (`deanrfiedler-gif`) · **Stage:** P01–P12 code merged; PT-22 synthetic recovery passed; integrated acceptance incomplete · **Deployment:** separate manual Azure run 37094645952 completed for `6e8b898` on 3 October; fresh signed-in journey, actual worker execution and managed PostgreSQL minor unverified · **Current state:** [docs/STATUS.md](docs/STATUS.md)

This repository is Dean's personal prototype. It contains the planning foundation, source references and development backlog. It now contains a local synthetic application with customer, contact, site, equipment, intake, owned follow-up and controlled work-order screens. P12 isolated recovery is merged with reviewed source and actual-main evidence. The written PT-22 synthetic restore procedure passed; Step 6's bounded written PT-28 synthetic procedure has passed; full PT-30/PP-01 and independent owner/device acceptance remain outstanding. Company ownership, production approval and external-system write authority are not implied.

## Start here

Current acceptance work: [Field Work prerequisite ledger](docs/testing/field-integrated-acceptance-ledger.md), [runnable owner walkthrough](docs/delivery/field-integrated-owner-walkthrough.md) and [benefit measurement](docs/testing/field-benefit-measurement.md). #337 is merged; fresh verification, human observations and benefits remain separately recorded.

| Document | Purpose |
|---|---|
| [First Prototype Definition & Architecture](docs/prototype/README.md) | Selected service journey, BP-02/BP-07, data/API/Finance/document contracts, acceptance and ordered implementation |
| [Adopted naming standard](docs/standards/naming-conventions.md) | Powerplants One / PPO naming, references, revisions and implementation rules |
| [ChatGPT project instructions](docs/standards/chatgpt-project-instructions.md) | Copy-ready instructions for the dedicated design and development project |
| [Consolidation and service verification](docs/delivery/repository-consolidation.md) | Current source/deployment, migration integration order and remaining complete-journey proof |
| [Current project status](docs/STATUS.md) | What exists, what remains planned and how recent user decisions relate to the issued blueprint |
| [Master Blueprint](docs/blueprints/BP-01-master-blueprint.md) | Scope Assurance & Development Planning Edition: seven domains, 78 parent requirements and release contracts |
| [Documentation index](docs/README.md) | Where specifications, decisions, requirements and acceptance records belong |
| [HTML design index](docs/reference/ui/README.md) | Module visuals, recorded approvals, implementation references, earlier revisions and a copyable maintenance template |
| [Development backlog](docs/delivery/backlog.md) | Initial discovery/design work packages and their live GitHub issue links |
| [Adopted quality and capability plan](docs/delivery/product-quality-plan.md) | All eight product refinements, five quality standards and existing capability continuation, with staged implementation and acceptance |
| [CRM blueprint and discovery handover](docs/delivery/crm-discovery-handover.md) | PPO-009 parallel CRM design, bounded Pipedrive evidence, synthetic wireframes and first implementation starter; account parity remains open |
| [Estimating discovery and design](docs/delivery/estimating-discovery-handover.md) | PPO-010 / BP-04 source evidence, synthetic costing/quotation preview, acceptance plan and prepared E1 starter |
| [E2 saved discovery screens](docs/delivery/estimating-e2-screens-handover.md) | Merged scoped option/questionnaire UI and exact original recovery; full acceptance remains tracked in #167 |
| [E2 exact manual cost basis](docs/delivery/estimating-e2-cost-basis-handover.md) | Merged selected complete scope to immutable manual cost versions and exact Draft quotations; full acceptance tracked in #167 |
| [Exact estimate review and synthetic quotation release](docs/delivery/quotation-release-handover.md) | ES-04/ES-05 reviewable contributions: exact review, independent approval, controlled issue and distribution simulation; response and receiving remain next |
| [Estimating E1 implementation](docs/delivery/estimating-e1-handover.md) | Authorised manual estimating and exact draft quotation increment; current verification state and limits |
| [CRM I1 handover](docs/delivery/crm-i1-handover.md) | Bounded owned opportunity implementation and actual verification/publication |
| [CRM I2 handover](docs/delivery/crm-i2-handover.md) | Scoped Board/Grid worklist, shared brand, actual runtime evidence and external publication |
| [Customer portal design](docs/delivery/customer-portal-handover.md) | Customer roles, support/publication contracts, clickable walkthrough and bounded CP1–CP5 readiness |
| [Private Prototype Demo package](docs/delivery/private-prototype-demo.md) | Three online demonstration journeys, fictional data recipe, tester access proposal, itemised hosting estimate and deployment/reset runbooks; hosting not implemented |
| [First-release plan](docs/delivery/first-release.md) | Proposed planned-service journey, dependencies and readiness criteria |
| [Projects discovery and design](docs/delivery/projects-discovery-handover.md) | BP-06 source assessment, first-increment contract and project list/detail designs; J1 prepared only |
| [Email & Calendar design](docs/blueprints/email-calendar-integration.md) | Synthetic inbox, record linking, privacy, agenda and first read-only Microsoft pilot preparation |
| [Working Email & Calendar journey](docs/delivery/email-calendar-journey-handover.md) | Private fictional email, explicit opportunity link, persisted internal follow-up and calendar; PR #64 |
| [Service Cases & Triage r02 design](docs/decisions/service-cases-workspace-design.md) | Module-only Board/List triage centre with Deals r35 cards and guarded case workflows; native review and runtime integration pending |
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

## Private hosted demo preparation

The [Azure demo runbook](docs/delivery/azure-private-demo.md) defines the separate hosted runtime, tester access and image updates. The latest observed [deployment run 37094645952](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37094645952), manually dispatched on 3 October against main `6e8b898`, completed its database gate and web/worker image update. This acceptance task only read that separate run; it performed no deployment. The 26 September deployment of `80b2f41` remains historical evidence. This audit did not repeat the signed-in record/output journey or verify actual worker execution or the managed PostgreSQL minor. The 14 September signed-in Draft evidence remains valid for its earlier source only. [Current consolidation and verification](docs/delivery/repository-consolidation.md) separates these facts from full service-journey, physical-device and owner acceptance.

## Run the local application

Apply the [current runtime maintenance instructions](docs/delivery/runtime-maintenance.md), then follow the [P08 setup and run commands](docs/delivery/p08-handover.md#runtime-setup-and-recovery): Node 24.21.0, npm 11.19.0, PostgreSQL 16.15, `npm ci`, ignored local configuration, migration/seed and `npm run dev`. Open `http://127.0.0.1:3000`. Production startup is intentionally refused. The handover includes test, reset and recovery commands.

Job-pack preparation and issue are at `/service/packs`; exact documents at `/documents/:issue_id`. Install the reviewed Chrome renderer with `npm run browser:install` and retain its private output directory outside Git as described in the P06 handover.

Field operations use `/service/technicians`: the [approved r04 design](docs/decisions/field-technicians-design.md) presents current permitted visits, technicians and preparation flags, with controlled record links. See the [integration handover](docs/delivery/field-technicians-handover.md) for verification/publication status.

Technicians use `/my-jobs` and `/my-jobs/:id`. Riley and Morgan acknowledge and start independently. Supported fictional PNGs are registered, uploaded and verified before availability. Completion drafts can be submitted separately for service review at `/service/reports`. Exact reviewed HTML/PDF, owned remaining work, immutable report revisions and customer responses are available in the P09 implementation. **Field workflow preview — integrated acceptance incomplete**. The dedicated `/offline/index.html` workspace downloads up to two permitted jobs, commits original evidence and PNGs to IndexedDB, and explicitly retries bounded original operations with per-item receipts and owned exception recovery. Offline authority remains provisional.

## Working screens

P11's bounded exceptions/recovery checkpoint is at `/admin`, using existing current-owner recovery permissions. Cross-tab identity changes clear displayed business and diagnostic views. [P11 handover](docs/delivery/p11-handover.md) records implemented fixes, actual verification limits and outstanding integrated work. Final contribution and merged-main completion are established by the handover’s authoritative external record; [P12 recovery](docs/delivery/p12-handover.md) is merged through #166, with actual verification and remaining procedure limits recorded separately.

Open My Work at `/work`, customer context at `/customers`, contacts at `/people`, sites at `/sites`, equipment at `/equipment`, service requests at `/service/tickets`, and work orders at `/service/work-orders`. Use Change identity to open the compact server-backed synthetic identity controls. Foundation checks remain available as diagnostics. Incomplete intake retains owned unknowns; triage does not authorise work or book attendance. Activities retain explicit unknown due dates and require an outcome on completion.

CRM Sales is at `/crm/opportunities`. Board and List show the same permitted page, with search, filters and sort. The [URL view contract](docs/standards/ui-style-specification.md#41-restorable-application-worklist-120) preserves these criteria on reload, shared links and browser Back; signed page cursors remain transient. New opportunities and converted Leads enter Discovery with qualification evidence; the active pipeline continues through Scoping, Quoting, Negotiation and Closing, with sales outcome Open. Stage controls allow forward movement by one stage and backward movement to any earlier stage. Retained I1 records keep their original Enquiry/Qualified pipeline, available through the pipeline selector. [Runtime handover](docs/delivery/crm-five-stage-runtime-handover.md) records verification and remaining acceptance. The manual value and close-date fields are proposals for the current opportunity; they do not issue quotations or create Projects. Won/Lost is delivered separately in #158: Won from Closing records owned handover-due; Lost records a structured reason at its original stage. Controlled owner transfer is merged through #166; complete HV and owner acceptance remain tracked in #145. CRM offline remains outside this cutover.

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
