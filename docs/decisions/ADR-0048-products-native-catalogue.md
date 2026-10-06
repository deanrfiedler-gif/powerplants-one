# ADR-0048 — Native Products catalogue

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Initial implementation authorised on 25 September; completion authorised on 7 October 2026. The completion decision below supersedes the original no-seed proposal. Owner acceptance and deployment remain separate.

## Original implementation decision — 25 September 2026

Refreshed main `cad98aca42cb233f142029d11601a78d7d4b521e` has native ES-03 CostSource services and migration 0048, but no Products service or application routes. The starting checkout is `docs/field-quality-build-plan` at `ca006fb1fc6b2e2bd2a9bdb509caa276d1052ffc`, with unrelated STATUS/document-register edits, two Field Quality documents and worktrees. Those remain untouched. Products uses isolated branch `feat/products-catalogue-native` from refreshed main.

Retain BP-02/ADR-0003 TypeScript, Next.js, PostgreSQL, shared identity, transactions, audit/outbox and original-operation receipts. No dependency, service or eighth business domain is introduced. Typed Product identities form Family → Model → Variant relationships; immutable revision snapshots carry technical attributes, controlled document applicability, source provenance and lifecycle evidence. UUIDs, synthetic fixture aliases, content revision, explicit technical revision and publication state remain separate. No automatic technical-revision increment is adopted.

Catalogue review and publication are attributable events against exact immutable revisions. A successor is a draft; publication can supersede the previous published revision without changing it. Product relationships bind both exact revisions and retain unresolved criteria and owning-domain handovers. Technical suitability remains Engineering's responsibility and installed impact remains Equipment's responsibility.

PD-03 binds existing CostSource revisions through a typed sidecar. It does not duplicate source content, pricing arithmetic, source review or estimate-refresh commands. Commercial data requires explicit Products commercial access plus existing source authority. Technical reads contain no supplier cost data. Unknown stock remains unknown; this is no stock master.

PD-05 uses bounded synthetic JSON (maximum 50 rows and existing request-size limits), staged raw evidence, immutable mapping/change-set snapshots and atomic application to new records or draft successors. Identity is explicit; similarity never merges. Hashes bind source and comparison, expected versions detect stale proposals, and an applied batch cannot apply again under another operation. Production file formats are Not configured. A general AD-03/AD-05 administration system is not introduced.

## Original access proposal — superseded for local duties on 7 October

Proposed capabilities: `products.read`, `products.edit`, `products.review`, `products.publish`, `products.commercial.read`, `products.sources.bind`, `products.relationship.edit`, `products.relationship.review`, `products.import.stage`, `products.import.review`, `products.import.apply`. All are company/workspace scoped; reads always require `products.read`. Authors cannot independently review their own publication, relationship or import proposal. No seed or hosted profile grants these capabilities. Explicitly scoped disposable test actors exercise the implementation. Production/operational role allocation requires Dean's separate decision; an administrator label grants nothing.

## Alternatives and constraints

Another standalone preview would not fulfil the requested native workflows. A generic entity store would weaken typed relationships. A duplicate price engine would conflict with ES-03 ownership. CSV/XLSX packages are unnecessary for the bounded synthetic format and are deferred until a real production format is specified. Existing UI tokens, forms, Button, URL state, unsaved-change guard and recoverable-command journal are reused.

Reference lineage: Products r04 and its closeout; Supplier Pricing r01 and native ES-03; Products workflow map; PD-01–05 guides; Data Quality workbench plan/design. PD-02/04/05 have no exact dedicated accepted HTML and use native compositions, pending paired review. Issued reference bytes and all 78 parents remain unchanged. Traceability: CRM-08, DOC-01/02, ENG-02–06, EST-02–08, NFR-05, SCM-02/03/08; IF-02/06/10/12/14.

MYOB retains authoritative ERP items, stock and purchasing; SharePoint retains business documents; native CAD retains authored files. No live adapters, FX/unit conversion, landed-cost, tax, commercial thresholds or operational stock definitions are invented.

## Completion decision — 7 October 2026

Dean authorised the assessed completion increment: integrate PD-01–05, preserve selected revisions through pricing, make local synthetic access usable, complete current-source verification and review the native design. This supersedes the earlier no-seed proposal for the four named local duties only. No hosted invitation or business authority is added.

The original `feat/products-catalogue-native` checkout remains unchanged. Its uncommitted file hashes are captured in the completion workspace. `codex/products-completion` starts at current main `58679be`, with migration registry through 0071. The original unpublished 0049 is reconciled as reserved **0052**. Installed Supply 0049 and later migrations are unchanged. The actual current-main schema was materialised in a separate loopback PostgreSQL cluster and its constraints, identity dispatch and ledger inspected. Both ascending installation across 0026 with existing estimates and insertion of missing 0052 after installed 0071 require proof. No new technology is selected.

| Local synthetic identity | Company A duties |
|---|---|
| Products reader | Technical catalogue read only |
| Products author | Draft/submit, exact source binding, relationship authoring, import stage/map/apply; existing ES-03 source authoring/read |
| Products reviewer | Independent catalogue, relationship and import review; permitted commercial/ES-03 reads |
| Products publisher | Publish/withdraw reviewed catalogue evidence |

Seed 52 adds four `PPO-LocalSynthetic` users and 22 exact Company A grants, copying scope and validity from the original synthetic coordinator's shared-read grant. It grants no existing user additional authority, and no hosted identity can select these local profiles. Operational and hosted allocation remains a separate decision. Import apply cannot publish; the author cannot independently review their own content. No dependency, migration placeholder or hidden access is introduced.

The detail-to-pricing URL and read preserve `revision_id`; the selected historical basis remains visible through reload. The technical detail exposes a direct exact published-basis link. Long internal identifiers remain available in a labelled disclosure to reduce phone clutter. Catalogue cards, native forms and comparisons remain proposed adaptations of r04 and Supplier Pricing r01; no owner baseline acceptance is inferred. Broader pagination, product-to-estimate selection, production file formats and live connections remain later increments.
