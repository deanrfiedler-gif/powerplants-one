---
document_id: PPO-010-HO
revision: r01
date: 2026-09-06
owner: Dean Fiedler - private prototype
status: Package publication approved; application and business acceptance open
---

# PPO-010 / BP-04 discovery and design handover

Dean authorised “start PPO-010/BP-04 discovery and design.” This contribution starts the estimating/quoting domain under [issue #10](https://github.com/deanrfiedler-gif/powerplants-one/issues/10). It supplies a source-grounded design, a synthetic interactive walkthrough and an ordered implementation proposal. It does not implement estimating in the application or complete CREMS replacement.

## Review package

| Deliverable | Review purpose |
|---|---|
| [BP-04 r01](../blueprints/BP-04-estimating-quotation.md) | Journeys, logical records, revisions, pricing/locks, permissions, safe outputs and recovery; EST-01–EST-09 coverage |
| [CREMS evidence assessment](../blueprints/estimating-evidence.md) | CRE-01–CRE-26 mapped to documentary evidence; contradictions and G01–G14 evidence gaps |
| [Source manifest](../blueprints/estimating-source-manifest.json) | Exact original source hashes, sizes and private provenance; original operational sources remain outside Git |
| [Ten-screen specification](../blueprints/estimating-screen-specification.md) | Worklist through receiving handover; desktop, phone, validation and failure states |
| [Interactive synthetic preview](../blueprints/estimating-workspace-mockup.html) | Costing, scope, draft quotation and history; transient edits and line include/print distinction |
| [Design evidence index](../blueprints/estimating-visuals/README.md) | Repeatable capture procedure and honest visual-check status |
| [Arithmetic fixtures](../testing/estimating-calculation-fixtures.json) | Eight valid and four invalid synthetic Decimal cases, separate from real commercial policy |
| [EA-01–EA-18 procedures](../testing/estimating-acceptance.md) | Future application acceptance; all Not run |
| [E1–E6 sequence](estimating-implementation-plan.md) / [E1 starter](estimating-first-increment-starter.md) | Proposed bounded delivery and a prepared first implementation task |
| [Discovery decision](../decisions/bp04-estimating-discovery.md) | Authority, current foundation, unresolved policies and sequencing |

## Findings that affect the build

1. Separate opportunity, option, scope revision, estimate version and quote revision. CREMS branch locks and retained route evidence need explicit rules before copying behaviour.
2. Version formulas, questionnaire definitions, cost sources, FX and pricing policy. The guide and v05 describe behaviour; they do not supply all executable definitions or accepted calculation examples.
3. Separate quote inclusion from printed detail. A hidden priced line must still reconcile to the customer's total. Estimate minimum-price approval and quote discounting are different controls.
4. Preserve issue, distribution, delivery and customer response as separate facts. Customer outputs require their own safe projection, without internal cost or approval fields.
5. Treat partial or unknown ERP conversion as reconciliation of the original operation. Documented side effects extend beyond a simplified three-write summary.

The first proposed build is **E1: one manual synthetic estimate and a customer-safe draft quotation from an existing permitted opportunity**. It needs its own implementation/sequencing instruction and an explicit synthetic arithmetic convention. Specialist configuration waits for real formula/range/parts evidence; it need not delay a non-configured manual estimate.

## Baseline and source treatment

Initial main was `17f1505e2708663e7d2948f2c6bafc57a409085e`. During discovery, CRM I1 PR #40 merged. The complete working baseline was refreshed to main `c3ac9b2ab9c09308f620a5b451a337eb75fe6390`, tree `163e4a9e7dcda9b067a67ed63299afd04d20e0b1`, with Git blob/tree verification. The design uses its actual Opportunity and Activity target while preserving I1's Enquiry/Qualified, Open, no-money scope. Merely observing the merge does not independently verify I1's full acceptance.

The 350-page original CREMS guide, v05 rebuild specification and audit were inspected selectively for the relevant behaviours. The original guide's routing and quotation pages were also viewed visually. Alternate HTML viewer copies were hashed, not executed or treated as independent evidence. The supplied brand PDF and complete transparent logo were inspected; the preview uses the unchanged logo on navy, exact supplied colours and the existing embedded Roboto font. Full source documents and identifiable operational examples are not committed. The preview uses only fictional records and rates.

## Validation record

`python3 docs/testing/estimating-design-check.py` passed eight valid arithmetic fixtures, four expected invalid cases, 26 CRE coverage rows, nine EST parents and 18 unexecuted acceptance procedures. These checks prove consistency of this design package, not CREMS mathematical parity or application behaviour.

The local browser runner could not launch because its Chromium executable was absent. The browser installation endpoint returned a network failure. The connected browser also declined the local-file URL; that blocked action was not retried through another URL or browser surface. No local screenshot or interaction pass is claimed. A scoped estimating design workflow is prepared to check the committed synthetic document in a normal CI checkout. It had not run at the previous blocked handover. Subsequent CI and visual results belong to the approved publication record; no result is assumed in advance.

Local foundation, prototype and naming checks passed on the complete baseline plus this contribution: 78 requirements, 29 decisions, 38 planned master acceptance scenarios, 78 prototype dispositions, 51 document records and 7,974 project-instruction characters. `git diff --check` and browser-runner syntax checking also passed. After publication is authorised, record subsequent results from the standalone design workflow and the existing application assurance workflow on the actual PR. Do not infer a final pass, merge or merged-main verification from this document's existence. Successful CI captures still require human/agent visual inspection before a visual-review claim.

## Publication and limits

Dean replied “I approve the package” to the explicit request to upload this CREMS-derived package to the private `deanrfiedler-gif/powerplants-one` repository and open a review PR. This supplies publication authority. The approval does not invoke E1 implementation, adopt operational commercial rules or pass the future acceptance procedures. Current main was rechecked as `c3ac9b2ab9c09308f620a5b451a337eb75fe6390` before publication; the destination remains private.

### Previous publication block

The local work uses `docs/bp04-estimating-discovery`. At the previous blocked handover, no remote branch, commit or PR was created. Automatic approval review rejected uploading BP-04 because it contains source-derived private CREMS/commercial process information and the reviewer requires explicit permission to disclose it to the personal GitHub destination. Read-only checks confirmed the repository is private, owned by Dean, and its existing ADR-0001 and issue #10 authorise prototype documents and this design scope. A retry with that evidence was also rejected because the destination is not organisation-owned. No alternate upload mechanism was used. Four preliminary Git blob objects were accepted before the rejection, but they are unattached to any new branch or commit.

The review archive preserves the complete proposed file overlay in this conversation. That publication approval is now supplied; repository ownership/visibility remains unchanged. The current PR will record its exact source head and actual CI/visual evidence. No merge or merged-main verification is claimed by this handover. No application source, database migration, runtime dependency, permission grant or deployment is changed. The workflow reuses the existing package, browser and action pins. All 78 parent IDs, source snapshots, AT statuses and P01–P12 service sequencing are retained.

Issue #10, D-009 and D-010 remain open. E1–E6 are local BP-04 labels; no implementation issues or business approvals are fabricated. Formula/configuration evidence, commercial thresholds/authority, final quote terms and receiving-system contracts remain discovery work. The PR is a design handover, not owner acceptance or production readiness.

### Completed design publication and subsequent E1 authority

The preceding publication-pending statements preserve the original checkpoint. PR #44 subsequently published the exact design tree, with all seven original CI viewport captures inspected. Under Dean's later “Proceed” and “Continue”, it merged normally at `94289a20fc609e47af647b29ca8170557da312bb`; pre-merge and actual-main documentation, estimating design and full application checks all passed. The [final design publication record](https://github.com/deanrfiedler-gif/powerplants-one/pull/44#issuecomment-5562396720) identifies the actual commits, runs and visual record.

That later instruction separately invokes bounded E1 under issue #46 / PR #49. Its [implementation handover](estimating-e1-handover.md) and external publication record now govern code delivery. [E2](estimating-e2-starter.md) remains prepared only. The original approved design archive and source snapshots remain unchanged; neither later event closes the broader discovery or business-acceptance gaps.
