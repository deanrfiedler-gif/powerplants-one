---
document_id: PPO-PJ-COMPLETION
date: 2026-09-24
owner: Dean Fiedler
status: A0 source audit and register reconciliation; native completion outstanding
versioning: git
---

# Projects & Delivery completion programme

The 24 September instruction authorises bounded PJ-01–09 implementation and PR preparation. This living record distinguishes that instruction from existing source, proposed design, prior component evidence and outstanding acceptance. Parent PRJ-01–08 and the [BP-06 contract](../blueprints/BP-06-projects-commercial-delivery.md) remain intact. No business transaction, external communication, hosted deployment or production integration is authorised by this work.

## Verified starting point

`git fetch origin` confirmed `origin/main` at `ca006fb1fc6b2e2bd2a9bdb509caa276d1052ffc`; the original working tree was clean on main. A0 uses `feat/projects-a0-reconciliation` in `tmp/projects-delivery`, based on that exact commit. Node reports 24.21.0 and `npm.cmd` reports 11.19.0. PowerShell blocks the npm.ps1 shim; npm.cmd is the same installed npm, without changing execution policy.

One open PR was returned: [#299](https://github.com/deanrfiedler-gif/powerplants-one/pull/299), head `89f948c74a70435cd1d986030f2a061dab79ae1b`, held fertigation import placement. Its shared changes include STATUS, guides, the decision index and document register. It was awaiting checks at inspection. Re-fetch and inspect current PRs before each increment; this is a dated observation, not a lock or reservation.

Local worktrees also contain concurrent work. Sales (`feature/sales-cr01-cr05-completion`) has uncommitted Sales handover/aftercare services, migration 0046, ADR-0045, receipt and CRM changes. Equipment (`feat/equipment-installed-base-completion`) has migration 0045, ADR-0044, receipt and migration/upgrade assertions. Estimating (`feat/estimating-intake-wizard-refinement`) has workload-query work. Engineering (`feat/engineering-en01-en05-native`) was clean at the initial inspection. Their shared files and migration/ADR numbers must be reconciled against their eventual committed contributions. None of their files was changed by this audit. In particular, do not allocate 0045/0046 or create a competing Sales handover store merely because these contributions are not on main yet. PR #299 also uses ADR-0044; resolve that numbering collision in the receiving contribution.

## Page audit at the starting commit

| Scope | Route | Native state / retained evidence | Required work |
|---|---|---|---|
| PJ-01 | `/projects/new` | Existing `NewProject`, scoped create service, permanent PRJ identity, command receipts and schedule creation event | Exact receiving basis, receiving owner/decision, assumptions, missing information, return/rework and duplicate-safe accepted Sales link |
| PJ-02 | `/projects`, `/projects/[id]` | Register/detail/Gantt, customer/site/coordinator/target and visibility predicates | Explained stage/health, owned follow-up, auditable updates, completeness and portfolio projection |
| PJ-03 | `/projects/programme`, `/projects/[id]?view=programme` | Date-only tasks, milestones, progress, FS/SS edges, cycle checks, saved schedule history | Controlled baseline/forecast comparison, calendar basis, retained movement and impact review |
| PJ-04 | `/projects/risks` | No native route or RAID aggregate | Distinct risk/assumption/issue/dependency/decision records and shared Activities |
| PJ-05 | `/projects/commercial` | No native route; FN-06 and ES-06 are not implemented receiving authorities | Source-bound obligations/notices/changes; requested/priced/approved/disputed facts kept separate |
| PJ-06 | `/projects/subcontracts` | No native route; current Engineering intake/materials/change/commissioning services do exist; broader EN-05 and Supply authority remain unavailable | Specialist packages through project context; exact procurement/technical references without owning those decisions |
| PJ-07 | `/projects/readiness` | No native route; retained r01 design and contradictory r02 issue/change record, detailed below | Obtain the verified r02 source, then native readiness and change-impact workflow |
| PJ-08 | `/projects/updates` | No native route; DK-03 is a standalone design; shared document render/store and exact PJ-09 output patterns exist | Customer-safe reviewed revisions, issue/distribution/withdrawal and immutable publication |
| PJ-09 | `/projects/acceptance` and `/closeout`, `/handover`, `/history`, `/outstanding`, `/readiness`, `/stages/[id]` | Native service/API/workspace, migrations 0032–0038, guarded lifecycle, typed Project Activities, exact OUT-13 and recovery. [ADR-0033](../decisions/ADR-0033-staged-acceptance.md), [handover](pj09-staged-acceptance-handover.md), [prior executed evidence](../testing/evidence/project-acceptance-r01/README.md) | Correct stale register; later family integration and evidence-led refinement. Do not rebuild |

The table records source presence, not a fresh execution of all historical tests. No native visual review, owner acceptance or deployment is granted by A0. Current register route entries and guides are draft; linking earlier evidence does not change their review fingerprints.

## PJ-07 source discrepancy

The exact Git blobs at the starting commit were hashed, independent of Windows checkout line endings:

| Retained item | Bytes | SHA-256 / observed content |
|---|---:|---|
| `PPO-Project-Delivery-Readiness-and-Change-Control-r01.html` | 243,576 | `a830eebb34ed44292a0906b878c9965746e7e1e8f0c870c77820cf5cd79e841b`; embedded revision r01 |
| `PPO-Project-Delivery-Readiness-and-Change-Control-r02.html` | 243,576 | The same `a830eebb…e841b`; embedded revision r01 |
| [r02 change record](../reference/ui/projects/PPO-Project-Delivery-Readiness-and-Change-Control-r02-change-record.md) | Describes 247,414 | Claims `fce055ba5c2f750751ad5eceb33a930e0edd5881b177ec218829abdd95c66741` and actual r02 refinements |

`git log --all` finds the r02 HTML introduced at `55bf0170959f5680dc243a5cfe7ffe276d7e92ae` with the same r01 hash; the change record was introduced at `1274e1d`. The maintained model/workspace/template and builder still contain r01 behaviour, including DEMO labels and the old issue flag. A filename search of available attachments and Downloads found no additional matching readiness file. Thus the older index's byte-identity statement is correct for the committed HTML, while the r02 change record describes an unavailable successor. It cannot be treated as proof that those revised bytes are present.

All issued files remain untouched. The working register removes its implicit selection of r01 as the implementation reference and records the source gap explicitly. Both predecessors and the change record remain linked in the scope design. Obtain the documented original and verify its complete hash before selecting the r02 reference; do not regenerate an approximation and call it the original. This is an unavailable controlling source for A6, not a requirement to re-authorise the programme.

## Existing schema and integration boundaries

A read-only `information_schema.columns` inspection of the configured local synthetic database confirms `projects.lifecycle` and `projects.acceptance_version`, existing `project_tasks`/`project_dependencies`/`project_schedule_events`, and generated `activity_links.project_id`. It finds `opportunity_handovers_due` but no `sales_handovers`. No data values or credentials were exported and no database was changed. Inspect actual constraints/functions and the final current schema again before writing a migration.

Main's `src/crm/outcomes.ts` creates the immutable Won handover-due obligation; it does not accept delivery or create a Project. The uncommitted Sales implementation proposes a suitable typed handover aggregate with frozen submissions, exact revision/hash, receiving owner and events. Its acceptance explicitly does not create downstream work. PJ-01 must integrate that final reviewed contract rather than inventing a parallel handover. Sending, receiving and creating the linked Project remain separate, retry-safe facts.

Use the existing `project.read/create/edit`, current customer/site visibility and all-target Activity access as the starting architecture. PJ-09's acceptance duties remain independent; `project.edit` alone does not confer acceptance authority. Shared documents retain exact bytes and audience checks. Engineering owns release, Supply/ERP owns procurement, Service owns confirmed bookings, Finance owns commercial/accounting decisions and SharePoint remains intended document authority. Missing source services stay unavailable.

The Projects rail already matches the requested eight-item order. Projects, Programme and Acceptance are ready; Delivery readiness, Risks, Variations and Site assurance remain unavailable. PJ-06/PJ-08 have no new rail entry. A0 changes no capability, navigation availability, route, schema, receipt, schedule behaviour or document output.

## Increment and verification ledger

| Increment | State | Next boundary |
|---|---|---|
| A0 | Source audit and working-register reconciliation validated locally | Publish bounded PR; required CI and review remain separate |
| A1 | Not implemented | Refresh main and reconcile the concurrent Sales receiving contract; extend the existing Project foundation |
| A2 | Not implemented | Add baseline/forecast controls around existing FS/SS schedule |
| A3 | Not implemented | Native RAID and shared owned actions |
| A4 | Not implemented | Source-backed commercial-delivery facts |
| A5 | Not implemented | Specialist package coordination and source boundaries |
| A6 | Controlling r02 HTML unavailable | Recover and verify the exact original, then implement source-backed readiness |
| A7 | Not implemented | Controlled stakeholder-update publication using existing output patterns |
| A8 | Not performed | Evidence-led PJ-09 refinement, consolidated regressions and fresh family captures |

Actual command outcomes belong in the [A0 evidence record](../testing/evidence/projects-completion/README.md). Final family acceptance is outstanding. No fresh application screenshot is claimed for a documentation-only reconciliation.
