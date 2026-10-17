# CPQ exact published Products and estimate provenance

> **Direction change — 17 October 2026:** Dean adopted the [estimating hub, CPQ and workbench model](estimating-configurator-model.md) (PPO-EST-CONFIGURATOR-MODEL-DEC). It **amends** this record (CM4, CM8): the same exact Variant binding is also made at run time, by an estimator's Manual line or a workbench part mapping, never by label or latest revision. The text below is retained as written; running behaviour changes only when the matching build step (B0–B6) is delivered.

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Backend implementation authorised 14 October 2026. Review, operational acceptance and deployment remain separate. Scope: BC-04, ES-02/ES-03, PD-01/PD-04 and existing EST-02–EST-09; all parent IDs and receiving workflows are retained.

## Decision before implementation

Inspection of main `b100680` and open PRs found no delivered schema-2 implementation. PR #489 was open at initial inspection and concerns Excel landed costs; it is not a dependency. It subsequently merged to main `bc9e3fb` during this task. The isolated branch is reconciled with that source, retaining its migration 0100 and upgrade obligations. An unfinished, uncommitted `codex/cpq-product-bindings` worktree at `7e4ef3b` contains an earlier schema-2 proposal. Leave it untouched and adapt its useful publication/access checks in this isolated contribution. Main's schema 3 implements the design contract independently.

Use the already reserved opt-in definition schema 2 for published Product mapping over the schema-1 calculation contract. Selected Product parts carry an exact native Variant UUID, revision UUID and content hash. At least one part must be bound; unbound parts retain authored evidence without claiming catalogue provenance. Non-Product parts cannot carry bindings. Schema 1 and schema 3 validators, calculation shapes, hashes and receipts remain unchanged. Combining schema-3 authoring features with catalogue bindings is a subsequent explicit contract; do not reinterpret its saved definitions or introduce UI work here.

Reuse the current TypeScript/PostgreSQL services, company/workspace transaction lock and immutable JSON in release revisions and runs. Freeze technical content, native identity, exact publication event and any explicitly selected relationship review in the run binding. The existing immutable adoption row links that exact run to the exact native estimate version and generated line IDs. Expose that evidence through a permission-checked internal estimate provenance read. No migration, new grant, dependency or service is necessary. Existing prices, source tiers and quantity/money rules remain unchanged.

## Authority and freshness

Reuse Products technical read authority and exact unit equality; no conversion. Save, approve, activate, calculate and adopt require current published revisions. A later draft does not invalidate an unchanged publication. Withdrawal, successor publication, missing evidence or changed exact mappings refuse new use with explicit errors. Recheck the whole declared mapping, including components not generated in this run. Never resolve latest by label or silently substitute a revision.

Optional relationship references identify exact same-company relationship content and independent review IDs between bound revisions. Reuse the catalogue's Conditional outcome and criterion validation. Freeze all conditions, owner, evidence and review; reject Unresolved/Rejected/unreviewed evidence and any relationship with a successor. This records conditional technical evidence, not automatic engineering suitability. With no selected relationships compatibility is NotAssessed. Stock availability and supplier lead time remain Unknown regardless of publication, lifecycle or technical relationship state. No stock commitment is inferred.

Historical reads and original-operation recovery require current domain and Products read authority but do not require the original publication/relationship to remain current. Original commands recover before freshness revalidation. Failed new commands write no estimate, audit, outbox or receipt. Changed price overrides, manually changed CPQ-owned lines, native limits and existing receiving scope safeguards remain in force. Customer quotation projection continues to whitelist customer fields and excludes this evidence.

## Alternatives and verification

Labels/latest lookups cannot preserve independently reviewed exact mappings. A new mapping database and migration would duplicate already immutable release/run/adoption storage. Extending schema 3 in place would weaken its strict unknown-field/version contract; a combined schema is outside this bounded increment. No live supplier/ERP or operational availability policy is introduced.

Prove exact bindings, variant/company/access isolation, units, conditional compatibility, stale publication/relationships, immutable history, preserved manual lines, override safeguards, transactional rollback, concurrent/repeated adoption, uncertain-outcome recovery, quotation privacy and actual application/database restart recovery. Run relevant units, database, compiled API/application and documentation checks. Record results and limits in the execution evidence; passing software tests does not grant operational acceptance.
