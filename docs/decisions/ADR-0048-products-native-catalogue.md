# ADR-0048 — Native Products catalogue

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Implementation authorised by the supplied Products programme prompt on 25 September 2026. Operational access allocation, visual acceptance and deployment remain pending.

## Context and decision

Refreshed main `cad98aca42cb233f142029d11601a78d7d4b521e` has native ES-03 CostSource services and migration 0048, but no Products service or application routes. The starting checkout is `docs/field-quality-build-plan` at `ca006fb1fc6b2e2bd2a9bdb509caa276d1052ffc`, with unrelated STATUS/document-register edits, two Field Quality documents and worktrees. Those remain untouched. Products uses isolated branch `feat/products-catalogue-native` from refreshed main.

Retain BP-02/ADR-0003 TypeScript, Next.js, PostgreSQL, shared identity, transactions, audit/outbox and original-operation receipts. No dependency, service or eighth business domain is introduced. Typed Product identities form Family → Model → Variant relationships; immutable revision snapshots carry technical attributes, controlled document applicability, source provenance and lifecycle evidence. UUIDs, synthetic fixture aliases, content revision, explicit technical revision and publication state remain separate. No automatic technical-revision increment is adopted.

Catalogue review and publication are attributable events against exact immutable revisions. A successor is a draft; publication can supersede the previous published revision without changing it. Product relationships bind both exact revisions and retain unresolved criteria and owning-domain handovers. Technical suitability remains Engineering's responsibility and installed impact remains Equipment's responsibility.

PD-03 binds existing CostSource revisions through a typed sidecar. It does not duplicate source content, pricing arithmetic, source review or estimate-refresh commands. Commercial data requires explicit Products commercial access plus existing source authority. Technical reads contain no supplier cost data. Unknown stock remains unknown; this is no stock master.

PD-05 uses bounded synthetic JSON (maximum 50 rows and existing request-size limits), staged raw evidence, immutable mapping/change-set snapshots and atomic application to new records or draft successors. Identity is explicit; similarity never merges. Hashes bind source and comparison, expected versions detect stale proposals, and an applied batch cannot apply again under another operation. Production file formats are Not configured. A general AD-03/AD-05 administration system is not introduced.

## Access decision boundary

Proposed capabilities: `products.read`, `products.edit`, `products.review`, `products.publish`, `products.commercial.read`, `products.sources.bind`, `products.relationship.edit`, `products.relationship.review`, `products.import.stage`, `products.import.review`, `products.import.apply`. All are company/workspace scoped; reads always require `products.read`. Authors cannot independently review their own publication, relationship or import proposal. No seed or hosted profile grants these capabilities. Explicitly scoped disposable test actors exercise the implementation. Production/operational role allocation requires Dean's separate decision; an administrator label grants nothing.

## Alternatives and constraints

Another standalone preview would not fulfil the requested native workflows. A generic entity store would weaken typed relationships. A duplicate price engine would conflict with ES-03 ownership. CSV/XLSX packages are unnecessary for the bounded synthetic format and are deferred until a real production format is specified. Existing UI tokens, forms, Button, URL state, unsaved-change guard and recoverable-command journal are reused.

Reference lineage: Products r04 and its closeout; Supplier Pricing r01 and native ES-03; Products workflow map; PD-01–05 guides; Data Quality workbench plan/design. PD-02/04/05 have no exact dedicated accepted HTML and use native compositions, pending paired review. Issued reference bytes and all 78 parents remain unchanged. Traceability: CRM-08, DOC-01/02, ENG-02–06, EST-02–08, NFR-05, SCM-02/03/08; IF-02/06/10/12/14.

MYOB retains authoritative ERP items, stock and purchasing; SharePoint retains business documents; native CAD retains authored files. No live adapters, FX/unit conversion, landed-cost, tax, commercial thresholds or operational stock definitions are invented.
