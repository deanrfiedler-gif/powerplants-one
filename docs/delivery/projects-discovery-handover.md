---
document_id: PPO-012-HO
revision: r01
date: 2026-09-07
owner: Dean Fiedler - private prototype
status: Published draft design PR; implementation and acceptance open
---

# PPO-012 / BP-06 discovery handover

Dean invoked BP-06 discovery and first-increment design after describing an eventual basic-first replacement for **PPA - Project Delivery System - PROTOTYPE**. The contribution is linked to [issue #12](https://github.com/deanrfiedler-gif/powerplants-one/issues/12); it does not close that broader workstream or invoke J1.

## Review package

| Deliverable | Outcome |
|---|---|
| [BP-06](../blueprints/BP-06-projects-commercial-delivery.md) | All PRJ-01–PRJ-08 retained; J1 logical records, states, permissions, commands and recovery specified |
| [Source assessment](../blueprints/projects-source-assessment.md) | Selected Smartsheet metadata/templates mapped; native dependency and approval distinctions; G01–G08 gaps |
| [Screens and four visual plates](../blueprints/projects-screen-specification.md) | Desktop project register/detail, phone detail and recovery states; static synthetic design |
| [Implementation sequence](projects-implementation-plan.md) | J1–J5 actual dependencies and later migration boundary |
| [J1 starter](projects-first-increment-starter.md) | Prepared next build; requires separate invocation and current-main reconciliation |
| [20 future acceptance procedures](../testing/projects-acceptance.md) | J1 and later scopes distinguished; all Not run |
| [Decision](../decisions/bp06-projects-discovery.md) | Discovery authority, proposed timing, PPO-011 and source-system boundaries |

## Baseline and findings

GitHub main was inspected at `1f13dd8d6f5006559152fe9d5410aed3fff64234` (E1 merge #49). A separate local checkout/branch `design/bp06-projects-foundation` preserves the active CRM worktree. AGENTS, README, STATUS, master project/migration scope, naming, BP-02/ADR-0003, shared UI, current Activity/permission implementation and CRM I1 amendment were inspected. Project is not currently an ActivityLink target; P05's ProjectReference is not a typed Project relation. This package allocates no migration or global ADR slot.

Connected Smartsheet reads on 7 September selected column metadata and template-only plan/deliverable/readiness rows. Native FS/SS and legacy text differ; source template approvals/cadence/risk formulas are not adopted automatically. Two Customer Update Register identities remain distinct. No operational rows, private contact emails, financial amounts or source documents were copied into the repository.

The supplied brand PDF was text-extracted and pages 17/18 viewed; the complete supplied logo was viewed. Roboto, navy/green and unchanged repository logo are used in all relevant plates. Static output generation does not claim application implementation or accepted brand use outside this private prototype.

## Verification

All three existing checks passed on the complete local baseline plus this contribution: `python3 scripts/check_foundation.py` (78 requirements, 29 decisions, 38 master acceptance scenarios, 16 backlog items), `python3 scripts/check_prototype.py` (78 unchanged dispositions and 12 ordered packages), and `python3 scripts/check_naming.py` (61 document records, seven standing exceptions). `git diff --check` passed. These are documentation checks, not application acceptance.

All four final raster plates were viewed. Desktop register/detail and phone detail were re-rendered and viewed after correcting a phone title wrap, action-note spacing and unknown-date sort position. The recovery plate was inspected unchanged. Text, logo integrity, scope labels and the example register counts/order were checked. No interactive browser, keyboard, database or responsive-runtime pass is claimed. SVG/PNG plates are design samples; the screen contract defines future behaviour.

Logo SHA-256: `8d12f0ecc394950cd9eb66964c588efb71c8e6f445390336c245c3f6712b9694`, identical for supplied and repository bytes. Supplied brand PDF SHA-256: `335d3049bc72783799315d4790bd56b04e928acd0e1c2c81d8099cec2f2b8fd3`. Original attachments were read only and not added to this contribution. Existing issued reference hashes pass the foundation check.

All PA procedures and existing master AT statuses remain unchanged. Source engineering, commercial, communication and migration acceptance remain open.

## Publication and next boundary

Published as [draft PR #52](https://github.com/deanrfiedler-gif/powerplants-one/pull/52) from `design/bp06-projects-foundation`, initial source commit `4b35145ab1da004590532ecf02a66619a49561e7` against main `1f13dd8d6f5006559152fe9d5410aed3fff64234`. The complete initial Git tree `be2210b90466cdb0a8686facafcb7636d3829e13` matched the locally checked index; every uploaded blob matched its local Git hash. This final handover amendment only records publication. Current PR head/check results are available from the linked PR; no merge or completed remote CI is claimed here.

Automatic approval review initially rejected uploading the existing document register because destination ownership and scope were unverified. Read-only repository metadata confirmed the same destination is Dean's private repository with push access. The existing register was fetched and compared: 54 records unchanged, BP-06 updated, six PPO-012 records added, none removed. With that new evidence, the same upload was accepted. No alternate route or access change was used. Direct shell Git authentication was unavailable; the connected GitHub API performed the verified publication. The design can be reviewed independently of J1 invocation. Recommended first build timing is after verified P10–P12; a later explicit earlier invocation can record a different sequencing choice without renumbering service work.

Open: G01–G08, issue #12 and D-010/D-014/D-026; full BP-05 technical authority and later project controls; source migration/customer publishing. J1 is prepared only. No application changes, migration, source-system write, deployment, customer communication or operational replacement occurred.
