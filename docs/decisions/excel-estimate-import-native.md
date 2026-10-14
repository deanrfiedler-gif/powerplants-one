---
document_id: PPO-010-EXCEL-NATIVE-ADR
owner: Dean Fiedler - prototype owner
status: Parser recovery only; complete import workflow and owner acceptance pending
versioning: git
---

# Bounded Excel workbook parser recovery

**Receiving update — 14 October 2026:** [Validated upload and review](excel-import-review-backend.md) now connects this parser to current E2 authority and transient whole-file validation. Its [API](../contracts/excel-import-review.md) adds no durable source, review or estimate save. The original recovery boundary below remains historical.

## Authority and baseline

Dean asked on 12 October 2026 to review the closed backup PRs and recover useful work into fresh PRs, starting with [#405](https://github.com/deanrfiedler-gif/powerplants-one/pull/405). This contribution recovers the bounded server-side parser from snapshot `1b699b48563e29e9b9b12c7f2c6615575521c599` onto main `4228d470ca4c566a15e7c3397fc053b8f7bef4bc`. The original snapshot and branch remain unchanged. No current open PR contains a competing Excel-import implementation at this checkpoint.

The recovery is a library increment under PPO-010 and EST-02–EST-05, EST-07/08 and DOC-01/02. It parses synthetic OOXML into source values, formula/cache evidence and actual table locators. Parsing is not domain validation, reconciliation, current-authority checking or permission to save an estimate. No route, upload handler, database migration, stored source, grant, UI or quotation action is added. The existing design and [implementation plan](../delivery/excel-estimate-import-plan.md) remain the contract for later increments.

## Parser and dependencies

Use a bounded server-side OOXML reader with pinned `yauzl` 3.4.0 for ZIP entry streaming and pinned `fast-xml-parser` 5.11.1 for XML. The dependency audit found fast-xml-parser 5.11.1 already locked transitively through Azure's XML support; declare that exact version directly before importing it. Do not depend on an accidental transitive import. Yauzl adds ZIP traversal rather than a spreadsheet calculation engine. Use the snapshot's exact `@types/yauzl` 3.4.0 declaration package. The npm registry confirms both runtime package versions and their MIT licenses; the lockfile retains their integrity hashes.

The [yauzl API](https://github.com/thejoshwolfe/yauzl) supports lazy entry processing, strict filenames and declared/actual size checks. Its documented lack of CRC checking requires the importer to check each entry's CRC with the pinned Node runtime. The [fast-xml-parser API](https://github.com/NaturalIntelligence/fast-xml-parser) preserves ordered XML and supports depth/entity limits; the importer also rejects DTD/entity declarations and external relationships. Package defaults alone are insufficient. Formula text is retained as evidence where relevant and never evaluated.

Alternatives considered:

- The existing browser preview reader: useful behavioural evidence, but browser DOM/DecompressionStream assumptions and its prototype model are not the native domain implementation.
- An entire spreadsheet editing/calculation library: expands the accepted surface without helping the six named-table contract; not selected for this pilot.
- A new hand-written ZIP/XML parser: fewer package declarations but more archive and XML correctness owned by PPO; not selected.
- Depending on Azure's transitive XML parser without a direct pin: would couple import behaviour to an unrelated adapter dependency update; rejected.

Keep the 5 MiB compressed, 20 MiB expanded, 256-entry, 100 populated export-line and 64 KiB estimate-command limits. Stream entries sequentially and stop when actual expansion exceeds the bound, even if the directory lies. Reject encrypted archives, unsupported compression, duplicate/ambiguous paths, mismatched CRCs, macros, external/embedded content, unsupported package parts and malformed XML. XML parsing uses a 64-level depth bound. Never extract ZIP entries to filesystem paths or fetch relationships. The 1904 date system remains explicitly unsupported. Hidden or filtered populated rows are still read. Calendar conversion, rejection of fractional dates/Excel day 60 and field-level business rules belong to the later typed mapping increment; this library retains raw numeric/date values without claiming those rules have passed.

## Later workflow obligations — not implemented by this recovery

### Exact target and storage

Resolve workbook statements against one currently permitted opportunity, organisation, site, selected Active option and exact Complete E2 revision. Workbook labels never confer authority. Reuse current E2 cost-basis guards, schema-2 categories/allowance, decimal arithmetic, durable operations, explicit expected versions and original receipt recovery. Preserve old E1/E2 DTOs and hashes.

Persist and verify the original workbook through the private synthetic document adapter before the atomic database commit. Keep immutable source identity/hash, parser/mapping version, authenticated review, actual sheet/table/row/range, declared calculation origin, sections and memberships in version-bound sidecars. Original bytes are never public or customer-safe output. Failed commits may leave an unreferenced staged source; retain it until a separately adopted retention policy permits cleanup. Do not silently delete staged or referenced originals.

Stable line identities derive from the same workbook/option/line keys through a persisted mapping. Reordering rows does not create new lines. A re-import compares the entire successor, including removals, manual-only lines, scope, source provenance, sections and include/print proposals. No automatic append, partial save, background refresh or source-hash-only replay is permitted.

### Review boundary

The native workflow is Upload → validate → inspect rows/context/reconciliation → explicit exact review → save one estimate version. Formula caches and declared workbook reviewer statements do not prove calculation correctness. Compare each extension and every total; unknown data never becomes zero or a partial aggregate. Corrections require a new upload, or a fully validated eligible adjustment with original/proposed values and reason retained. Scope changes return to E2 for a deliberate successor. Every changed basis invalidates confirmation.

Import is separate from ES-03 source review, ES-04 estimate approval and ES-05 quotation approval/issue. A saved result can prepare a separate exact-version Draft using the existing customer-safe projection. Nothing changes an older Draft, issued output, acceptance or ERP/delivery record.

## Required proof and recovery review

Before reporting delivery, execute the specification's XI-01–XI-08 cases, malformed/adversarial archive and XML tests, exact fixture reconciliation, current authority and revocation, stale target/source, same/different-payload replay, storage/database rollback, restart and source-download recovery. Inspect native desktop/phone/320px/enlarged captures beside the retained design. Keep parser/unit proof, persisted workflow proof, visual review, owner acceptance and deployment separate. No check is recorded as passed by this decision.

The backup contained no parser tests. Recovery adds independently constructed synthetic OOXML/ZIP fixtures and adversarial tests. It must preserve typed strings/numbers/booleans, source hashes, hidden rows, empty reserved rows and formula metadata; refuse missing formula caches, malformed archives/XML, unsupported/external content, duplicate identities and limits. Only actually executed checks may be reported as passing. The original delivered XLSX is not present in this repository; generated fixture coverage is not native Excel compatibility proof.

[Executed recovery checks and limits](../testing/evidence/excel-import-parser/README.md) retain the original failing cases and distinguish parser coverage from end-to-end import acceptance.
