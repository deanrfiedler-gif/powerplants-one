---
document_id: PPO-DK03-DES
title: Output, Issue and Distribution Centre design and receiving handover
revision: r01
date: 2026-09-17
owner: Dean Fiedler
status: Standalone design delivered against the authorised build plan; owner acceptance and application integration separate
source_commit: a5406a81c02d37c4a23e75c1b71c7653fcec0d80
---

# DK-03 — Output, Issue & Distribution Centre

Dean authorised building the DK-03 module from [PPO-DK03-PLAN r01](../delivery/output-issue-distribution-build-plan.md). This package delivers stages B1–B6 of that plan: the standalone workspace, its detailed companion report, maintainable source, a deterministic builder, model and native browser verification, and this decision and receiving record.

The package retains DK-03 from the r06 page register, the DOC-01–DOC-06 parent identities, the existing OUT-02, OUT-06 and OUT-08–OUT-14 output types, the r20 Document & evidence workspace and the maintained document, issue and distribution contract r07. It creates no new module, domain, requirement or output identity.

## Deliverable

The [HTML](../reference/ui/output-distribution/PPO-Output-Issue-and-Distribution-Centre-r01.html) provides six views: output queue, output and issue detail, readiness and domain review, distribution and responses, exceptions and recovery, and history and change impact. The [report](../reference/ui/output-distribution/PPO-Output-Issue-and-Distribution-Centre-Report-r01.md) records the features actually built, the fixture catalogue, the fact model, how every summary count is calculated, the recovery matrix, the module handovers, the executed verification and the limitations. [Source guide](../design/output-distribution/README.md); [verification](../testing/evidence/output-distribution-r01/README.md).

Ten fictional output records cover a customer quotation, a multi-item drawing transmittal with a missing historical item, a technician job pack, a customer service report, a project progress update with a changed source, a commissioning record with a withdrawn predecessor, a staged handover pack with a missing as-built item, restricted Finance evidence with no distribution route, an internal cost estimate that refuses an external audience, and a project update with no configured release rule.

The principal demonstration follows a revised drawing r03 through the issued pack r04 to a successor pack r05: successor draft, independent domain decision, output preparation with a reserved identity, an interrupted finalisation, recovery of the original operation, a single release with its own actual issue time, two independent recipient outcomes, reconciliation of the unknown one, and one explicit acknowledgement — leaving pack r04's bytes and its two original acknowledgements untouched.

## Source and design choices

| Area | Decision |
|---|---|
| Exact repository source | `main` at `a5406a81c02d37c4a23e75c1b71c7653fcec0d80`, inspected independently of the older aggregate baseline in STATUS. |
| Scope identity | DK-03 primary; DOC-01–DOC-06 parents; r06 page register. No new domain or requirement identity. |
| Relationship to DK-01/DK-02 | The DK-01/DK-02 contribution (#226) is a design reference, not a file dependency. This branch is cut from `main` so both contributions can be reviewed and merged independently. |
| Visual type | r20 Document & evidence workspace, supported by Work queue + persistent detail, Register / worklist, Review / comparison and short guided forms. |
| Reuse | r20 fonts, tokens and primitives through the existing Supplier Pricing source family, hash-guarded by a source manifest the builder enforces. |
| Composition | Workspace-only header, six local tabs, a 448 px desktop dock, a flexible document view with a 292 px context column, responsive cards and a modal phone snapshot. |
| Content identity | Byte counts and SHA-256 identities are computed from the exact content the file can preview and download, never authored as fixture literals. A self-contained synchronous digest was chosen over `crypto.subtle` because the value must render beside every manifest row; it is verified against Node's `crypto`. |
| Fact separation | Successor drafted, checked, preparing, generated, issued, current, superseded, withdrawn, prepared, sent, delivered, opened, acknowledged, outcome unknown and not supported are separate facts with separate evidence. No single status field spans them. |
| Proposed rules | The capability split between coordinator, issuer, distributor, recipient, Finance reviewer and viewer, the fixture release policies and the response kinds are illustrative. They require receiving authority confirmation. |
| Source authority | SharePoint remains the intended business-document authority; native CAD tools retain authoring and dependencies; MYOB Acumatica remains the intended ERP authority. No provider endpoint, formula or threshold is invented. |
| Alternatives | A single distribution status per issue would have been simpler but would have destroyed the per-recipient and per-attempt evidence the contract requires. A generic retry control would have been simpler than six category-specific recovery actions but would have made an unknown outcome look safe to repeat. Both were rejected. |

## Incoming and outgoing handovers

Incoming work needs a permitted business record, its exact source and template identities, the selected scope, the review evidence, the intended issue purpose, the approved audience and the source availability. Source content, current status and availability stay separate; a missing or restricted exact version is never replaced automatically by a later file.

Outgoing evidence is the exact output and issue manifest with real byte counts and content identities, the domain-owned release result with its own actual issue time, per-recipient distribution evidence with its stated support, exact response references bound to the presented content, and owned follow-up that remains **Prepared locally**. Nothing here authorises work, changes accepted quotation scope, reschedules a visit, accepts a variation, changes Finance processing or carries an acknowledgement onto new content.

## Receiving plan for application integration

Application integration is a later bounded increment. Its first step should be a **read-only consolidated register and exact detail over the existing pack and report output records**, retaining links to the existing domain actions; commands should expand only once the shared read model and the domain-service boundaries are proven.

The repository already contains `src/documents/packs.ts`, `src/documents/worker.ts`, `src/reports/service.ts`, `src/reports/worker.ts`, `src/components/pack-screens.tsx` and `src/components/report-screens.tsx`. These are inspection targets. This design record does not authorise refactoring their contracts.

| Receiving area | Requirement before any runtime release |
|---|---|
| Read model | Preserve tenant, company and record scope, exact domain issue identities, permission-filtered totals and honest complete/partial source reporting. |
| Commands | Delegate to the owning services, retaining original operation identities, expected versions and current authorisation checks. No universal approval endpoint. |
| Output storage | Verify exact bytes and durable retrievability before issue. Reconcile storage and database split outcomes without regeneration. |
| Concurrency | Use database constraints and atomic transitions for original operations, domain issues and per-recipient effects. The browser checks in this package are not sufficient. |
| Worker and outbox | Retain durable operation and result lookup, owned failures and restart recovery. |
| UI integration | Reuse the live shell and established components, and scope this module's stylesheet to its host. |
| Provider integration | Verify actual provider identity, supported outcome evidence, permission behaviour and retry and reconciliation semantics. Do not invent MYOB or Graph endpoints. |
| Historical retrieval | Apply current permissions while retaining exact original content and source identity. |
| Offline coexistence | Show cached source-as-at and current status honestly. Do not add offline issue or sending. |
| Operations | Verify retention, restore, monitoring ownership, release evidence and recovery procedures for the actual increment. |

Any migration must follow the repository's migration registry and affected-suite rules. An HTML design does not justify a schema change before the existing services are reconciled. Deployment to Azure remains a separate requested release activity.

## Integrity and recovery

The model refuses self-review of a successor, a Checked decision while any readiness check is outstanding, release of an unverified bundle, a second release of the same original operation, a repeat distribution while an outcome is unknown, a Delivered outcome on a channel that cannot evidence delivery, an external destination for internal cost content, any distribution of restricted Finance evidence, a response bound to different bytes, a second response for the same recipient and issue, a duplicate follow-up target, and a write against a stale saved version.

Recovery is specific to the cause: an unknown finalisation continues its original operation after revalidating the retained bundle; an unknown distribution outcome is reconciled against its original reference before any repeat; a missing exact item is recovered from a permitted retained snapshot rather than the newest available file. Corrections are additive — a reconciliation never rewrites the attempt it explains.

Browser storage is an application convention, not a production transaction or a security mechanism. Simultaneous writes still require server atomicity, every embedded fixture is readable by anyone holding the file, and retention and audit controls remain receiving work. The JSON export is a review copy, not a backup or import format.

## Acceptance and publication boundary

This contribution contains standalone design code and documentation. It changes no runtime route, dependency, migration, live provider, production record, accepted UI baseline, deployment or access configuration. Actual results and the publication source are recorded in the verification record and the pull request.

Owner design acceptance, native device and screen-reader checks, provider evidence, application implementation, integrated acceptance, merge and deployment remain separate outcomes.
