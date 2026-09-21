---
document_id: PPO-PJ09-ADR
revision: r01
date: 2026-09-21
status: Local server-backed increment implemented; verification and owner acceptance separate
---

# PJ-09 staged acceptance and closeout

Dean requested the complete local server-backed PJ-09 increment on 21 September. Principal requirements are PRJ-06/PRJ-08; PRJ-01–PRJ-08, OUT-13 and the parent AT procedures remain unchanged. The supplied r02 build plan is the domain contract; its historical delivery boundary does not override the current implementation request.

The clean root checkout was main `5d54c4e`. Branch `feat/pj09-staged-acceptance` started from EN-08 `882822a` and subsequently incorporated main `920b058` and EN-08 `f8d2b3d`. When GitHub Desktop switched the original checkout to the owner's My Work branch, its saved PJ-09 stash was applied to the isolated `powerplants-one-pj09` worktree and retained. The original checkout and its port-3000 server remain untouched. PR #269 is the review path; no merge or hosted deployment is implied.

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

Initial inspection found historical checksum drift at port 5432. Newer main records Dean's separate repair decision for 0029; this task did not alter that database or ledger. PJ-09 uses the existing EN-08 PostgreSQL 16.15 cluster on port 55438 after verification. Tests use only `ppo_synthetic_test` in the task-owned port-55439 cluster. No development reset, hosted action or external communication occurred.

## Implementation checklist

- [x] Reconcile references, live schema, lifecycle and dependencies.
- [x] Add scope ledger, immutable revisions/events, capabilities and A–L fixtures.
- [x] Integrate six routes, shared menu, flush register and selected-stage inspector.
- [x] Connect readiness, source checks, obligations/training and scoped reassessment.
- [x] Deliver exact OUT-13, customer attribution/validation and independent receiving.
- [x] Guard stage/project closeout and reopening; preserve schedule receipts.
- [x] Execute policy/database/HTTP/browser/restart and independent visual checks; record limits separately.
- [x] Record implementation decisions and local run path in maintained handover/status.

## Composition and reference evidence

Primary r20 page type: Register / worklist; supporting record detail, review, evidence workspace and focused forms. Canonical root `/projects/acceptance`, full-bleed under the existing shared shell; the workspace owns the list scroll and inspector scroll only. Incoming: exact scoped EN-08 release/test/configuration versions. Outgoing: controlled OUT-13, recorded customer response, independent receiving, owned continuing obligations and explicit closeout decisions.

Actual repository r22 SHA-256 `a305361c5d937296a8837e751f1a80ac7e6ca7615013705c7ad55ad794957df0`; supplied PJ-09 mockup SHA-256 `9d3cf7edb1d6184d14bc9d1a4c42c97a4d3ba2ddc2c2d2004ca6e54febe3b242`. Both matched. The mockup is composition evidence, not an acceptance baseline. Authorised adaptations: six default columns, 14/20 text, 60–68px natural rows, 448–480px inspector only docked with 760px list space, PJ-09 collapsed first use. Actual r22 controls/tags and My Work menu take precedence over raster artifacts.

Actual results and limits are in [the handover](../delivery/pj09-staged-acceptance-handover.md) and [PJ09-01–56 evidence](../testing/evidence/project-acceptance-r01/README.md). No parent AT procedure or owner acceptance is inferred from component tests.

## Final implementation decisions

Forward migrations 0032–0038 implement the bounded subdomain. Migration 0038 corrects an invalid PL/pgSQL variable qualification in the source-change follow-up trigger, found by an actual EN-08 change. Earlier migration bytes remain unchanged. The local runner recognises exact LF/CRLF equivalents without rewriting recorded hashes. The one initial mixed encoding of 0036 is accepted only for version 36 and the verified pair: canonical LF `8e59bb81caef9f6e5d3f27d32a808e554009b33aaa7a902e6951f722a0de72de`, initial applied bytes `46018e6ce64637a81ba16e66bf9b48bfed60f29d6b06f5192e18d3d6fa173693`. Its only difference is a final CRLF following internal LF. Negative tests reject content changes and this exception at another version. No legacy SQL or ledger entry was rewritten.

Project lifecycle is separate from all four acceptance decisions. Existing schedule operation names, hashes and receipt lookup remain unchanged; current writes require Active lifecycle and current version. The pre-0032 upgrade harness receives the historical Active default only when the field does not exist. Reopening advances versions so stale tabs conflict. A later source change retains historical closure and creates scoped reassessment without manufacturing reopening authority.

OUT-13 uses the shared document store and EN-08 renderer. Its audience allowlist excludes private Finance fields. Template identity includes the stage template, EN-08 bundle renderer and shared renderer source hashes; it is rechecked before preparation finalisation and issue. Original bundles remain retrievable after template changes. Storage success followed by failed database finalisation recovers the stored original. Actor-private server-held command intents retain exact payloads across browser/application/database restart; presentation acknowledgment never makes a new decision.

The actual EN-08 adapter consumes test/release scope and handover obligations. Planned EN-08 training still blocks handover when supplementary synthetic training is complete. Technical-only EN-08 receiving cannot accept the broader PJ-09 stage pack: purpose and manifest identities differ. Customer/Service stage requests are persisted local receiving contracts without transport delivery. Supplemental training/manual/backup and commercial sources are labelled synthetic adapters.

The unchanged supplied plan is in `docs/reference/project-acceptance/`, SHA-256 `6f67bbe8ffebfc3f454be956df6da37e72b374fa4049a8b4e5f5225c606f2f67`; the matching mockup is retained beside it. The host contract in `ui-baselines.json` records DOM scope `#ppo-acceptance`, stable module identity PJ-09 and the requested references, not owner acceptance.

Greenhouse 01 is now r03 because its real scope amendment retains predecessors; it is not relabelled r02 for the image. Local RL-017 identifies V-07 label work and explicitly maps to EN-08's allocated RL-001. Eleven returned stages replace the image's eight rows. The pump stage's shared failed alarm takes precedence over its separate unavailable source. These adaptations preserve source identity and domain truth.

Independent visual checks render r22 itself: named decision specimens in `#controls`, plus the explicit failed-read specimen, rather than unrelated business-specific variants. Actual My Work selectors are shared with a separate scoped PJ-09 preference. Menu 220px, inspector 464px only with 760px list space, loaded normal Roboto 14/20; header/rows/footer flush. A deliberately introduced 16px gutter fails the negative control. Native Chrome Page zoom is tested separately from viewport emulation.

CS-02's pinned Project service was reread after lifecycle changes. Its `owner_unavailable` privacy precedent, external-owner scoping and person visibility are unchanged; its contract pin/build manifest were refreshed without changing the issued Contacts page. CRM's historical upgrade expectation now includes the additive `activity_links.project_id = null` default while retaining exact comparisons of all original values.

Closed stages retain visible remaining obligations in both register and inspector. Their next action opens the actual owned work; a fully closed stage opens retained closeout history. This is a presentation decision over returned records, not a second closure state or inferred completion.
