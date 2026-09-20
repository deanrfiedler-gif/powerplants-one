---
document_id: PPO-PJ09-ADR
revision: r01
date: 2026-09-21
status: Local implementation in progress; owner and production acceptance separate
---

# PJ-09 staged acceptance and closeout

Dean requested the complete local server-backed PJ-09 increment on 21 September. Principal requirements are PRJ-06/PRJ-08; PRJ-01–PRJ-08, OUT-13 and the parent AT procedures remain unchanged. The supplied r02 build plan is the domain contract; its historical delivery boundary does not override the current implementation request.

The clean root checkout was main `5d54c4e`. Branch `feat/pj09-staged-acceptance` starts from saved EN-08 commit `882822a`, which includes EN-07 and main. Uncommitted work in the separate EN-08 worktree is untouched. This is a stacked contribution; the dependency's WIP status is not an acceptance claim.

## Architecture and dependency capability matrix

| Dependency | Actual implementation / permission and version boundary | PJ-09 use / limit |
|---|---|---|
| Projects | `src/projects/service.ts`, scoped project/customer/site reads, UUID/PRJ identity, workspace-serialised operations and versioned Gantt writes | Same aggregate; additive lifecycle, complete scope ledger, closed-basis mutation guard; original command hashes/receipts preserved |
| EN-08 / inspections | `src/engineering/commissioning`, `src/inspections`, exact scope, retained attempts/reviews, release/output and source versions; commissioning access predicates | Typed read adapter and actual source links. Source-owned holds/redlines cannot be waived by PJ-09. Check at decision commit under the shared workspace lock |
| EN-06 / EN-07 | Retained synthetic upstream sources and immutable change events | Reuse currentness and configuration facts; no live CAD/ERP integration |
| Service | Existing appointment/report runtime; EN-08 receiver for exact technical manifests | Broader stage receiving is a bounded persisted local contract with an independent named receiver; local submission does not claim transport delivery |
| Finance | P10 service handoffs and restricted accounts; no Project commercial ledger | Explicit labelled synthetic commercial source/disposition, separate authority; no invented totals or transactions |
| Equipment / locations | Existing project site, facility and asset identities; EN-08 installed/served scope | Typed scoped identities and versioned scope units; no installed-base reassociation |
| Documents | Pinned browser, canonical content, existing `documentStore`, EN-08 OUT-13 bundles | Explicit stage OUT-13 template over shared render/storage primitives; exact immutable audience-safe projection and byte recovery |
| Activities | Shared owned activities, all-target visibility and durable operations; no Project link | Add typed Project linkage, scoped predicate and canonical owned follow-up; Activity completion never completes its source obligation |
| Shell | Existing `SecondaryMenuFrame` extracted from My Work; full-bleed module registry | Reuse primitive, separate actor/workspace/version preference, default collapsed; My Work default stays open |

Keep Next.js/TypeScript/PostgreSQL and existing transaction, audit, outbox, render and store services. Alternatives rejected: generic workflow engine (unnecessary indirection), independent task/document stores (conflicting authorities), treating HTML designs as integration. Migration 0032 follows the actual stacked registry through 0031, retains reserved 0016 and old bytes. All pending changes share lock order: original operation advisory lock → workspace → Project → stage. EN-08/source and Gantt commands already share the workspace lock. External atomicity is not claimed.

The ordinary development database on port 5432 has historical checksum drift. Preserve it and its configuration; use the existing isolated EN-08 PostgreSQL 16.15 cluster on port 55438 after checksum verification. Tests use only `ppo_synthetic_test`. No reset of development data, hosted action or external communication is authorised by this work.

## Implementation checklist

- [ ] Reconcile references, live schema, lifecycle and dependencies.
- [ ] Add scope ledger, immutable revisions/events, capabilities and A–L fixtures.
- [ ] Integrate six routes, shared menu, flush register and selected-stage inspector.
- [ ] Connect readiness, source checks, obligations/training and scoped reassessment.
- [ ] Deliver exact OUT-13, customer attribution/validation and independent receiving.
- [ ] Guard stage/project closeout and reopening; preserve schedule receipts.
- [ ] Execute policy/database/HTTP/browser/restart and independent visual checks.
- [ ] Record actual results and local run path in the maintained handover/status.

## Composition and reference evidence

Primary r20 page type: Register / worklist; supporting record detail, review, evidence workspace and focused forms. Canonical root `/projects/acceptance`, full-bleed under the existing shared shell; the workspace owns the list scroll and inspector scroll only. Incoming: exact scoped EN-08 release/test/configuration versions. Outgoing: controlled OUT-13, recorded customer response, independent receiving, owned continuing obligations and explicit closeout decisions.

Actual repository r22 SHA-256 `a305361c5d937296a8837e751f1a80ac7e6ca7615013705c7ad55ad794957df0`; supplied PJ-09 mockup SHA-256 `9d3cf7edb1d6184d14bc9d1a4c42c97a4d3ba2ddc2c2d2004ca6e54febe3b242`. Both matched. The mockup is composition evidence, not an acceptance baseline. Authorised adaptations: six default columns, 14/20 text, 60–68px natural rows, 448–480px inspector only docked with 760px list space, PJ-09 collapsed first use. Actual r22 controls/tags and My Work menu take precedence over raster artifacts.

Verification and implementation results will be recorded in [the handover](../delivery/pj09-staged-acceptance-handover.md). No unexecuted PJ09 or parent AT case is claimed passed.
