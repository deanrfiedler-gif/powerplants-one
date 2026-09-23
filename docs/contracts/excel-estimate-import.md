---
document_id: PPO-010-EXCEL-SPEC
date: 2026-09-15
owner: Dean Fiedler - prototype owner
status: Design package; application implementation pending
source_commit: dcabfec1b5cde1c2cf220359e6cf1c63408512d6
versioning: git
---

# Excel estimate import specification

## 1. Outcome and authority

An estimator transfers reviewed results from an Excel workbook into an owned PPO draft estimate, retaining the source, reconciliation and exact selected estimating basis. Dean authorised the recommended design package: workbook assessment, standard workbook r01, field mapping, interactive preview and bounded implementation plan. This contribution delivers those design artifacts. It changes no application route, schema, grant, price policy, customer document or external integration.

Parent work package remains PPO-010 / [issue #10](https://github.com/deanrfiedler-gif/powerplants-one/issues/10). EST-02–EST-05, EST-07/08 and DOC-01/02 are relevant; their parent acceptance remains open. Read [BP-04](../blueprints/BP-04-estimating-quotation.md), [E1](estimating-e1.md), [E2](estimating-e2-design.md), [ADR-0027](../decisions/ADR-0027-estimating-discovery-cost-basis.md) and the [implementation plan](../delivery/excel-estimate-import-plan.md).

The preview operates on fictional data in browser memory. A demo save is neither a durable PPO save nor approval. The workbook is a populated reusable example, with 100 prepared line rows. Operational company workbooks were not supplied and have not been assessed. [Assessment and outstanding evidence](../blueprints/excel-estimate-workbook-assessment.md).

## 2. First pilot boundary

| Subject | Proposed first pilot |
|---|---|
| Context | One currently permitted Opportunity, organisation, site, selected Active option and exact Complete E2 scope/answer revision. No spreadsheet value can select an inaccessible target or mark its questionnaire Complete. |
| Result | One new draft estimate or deliberate successor of the estimate belonging to that same option. Import is one atomic operation. |
| Format | Macro-free `.xlsx`, schema version 1, template `PPO-EST-WORKBOOK` r01, exact named tables below. No `.xls`, `.xlsb`, `.xlsm`, password protection, macros, embedded objects, external connections or refresh. |
| Costs | Product, Labour, Freight, Engineering and Subcontract. Allowance is a separate explicit choice. AUD, ExcludingTax, no tax calculation, existing SYN-EST-ARITHMETIC-01. |
| Precision | Positive quantity ≤100,000, up to three decimals. Nonnegative unit cost/sell ≤1,000,000, up to two decimals. Sell below cost blocked under current pilot policy. No silently rounded input. |
| Calculation | Each quantity × rate extension uses decimal HALF_UP to two places, then rounded extensions are summed. Margin and markup retain E1 definitions. Original Excel results remain separate comparison evidence. |
| Capacity | ≤100 populated export lines and existing 64 KiB estimate command boundary. Extra provenance lives in separate version-bound import records. Candidate parser limits: 5 MiB compressed, 20 MiB expanded, 256 ZIP entries; profile and confirm at implementation. Exceeding any limit refuses the whole import. |
| Beyond this pilot | >100 lines, foreign exchange, landed-cost allocation, discounts, negative/credit quantities, multiple options per workbook, arbitrary legacy mapping, automatic specialist formula execution and live supplier/ERP/SharePoint access. |

The native estimate currently has no first-class section field. The implementation must add immutable import section/membership sidecars bound to the exact saved cost version, or explicitly extend the receiving schema through a reviewed migration. Do not flatten away the horticulture context or add fields to existing E1 commands without versioning. A later quotation layout can use that section membership only through its own exact-version contract.

## 3. Workbook tables and field mapping

Identify Excel Tables by name and relationships, not by worksheet position. Sheet names and cell coordinates remain provenance. Users may add working sheets. Renaming schema columns, adding subtotals inside an export table or hiding incomplete rows cannot make data eligible.

| Table | Required columns | Mapping and rules |
|---|---|---|
| `PPO_Metadata` | `field`, `value` | Exactly one value for each metadata key below. Duplicate/unknown keys block. Metadata is proposed context to compare, never authority. |
| `PPO_Sections` | `section_ref`, `label`, `facility_ref`, `growing_area_ref`, `system`, `phase` | Unique workbook section keys. Optional facility/area references resolve within current selected scope and site; blank means not specified. No new Site/Facility/Area creation. |
| `PPO_Scope` | `scope_ref`, `kind`, `text` | Kind is Inclusion, Exclusion or Assumption. Compare with exact selected scope. Narrative differences require an explicit E2 successor when they change scope; they cannot be resolved solely by checking an import box. |
| `PPO_Sources` | `source_ref`, `source_kind`, `supplier_label`, `document_ref`, `source_date`, `valid_until`, `internal_notes` | Internal provenance, keyed by unique source_ref. Source date required; expiry optional and explicitly Unknown when absent. Supplier labels do not create supplier/product masters. |
| `PPO_Lines` | Seventeen fields below | One cost line per row. Read every populated row, including hidden/filtered rows. Fully empty reserved rows ignored. A row with any content and missing line_ref is invalid, never discarded. |
| `PPO_Control` | `control`, `value` | Exactly line_count, workbook_cost, workbook_sell, included_sell. Used for reconciliation, not as authoritative money. |

Required metadata keys: `schema_version`, `template_ref`, `template_revision`, `workbook_ref`, `workbook_revision`, `opportunity_ref`, `option_ref`, `organisation_ref`, `site_ref`, `title`, `estimator`, `currency`, `tax_basis`, `calculation_policy`, `data_mode`, `formula_reviewed_by`, `formula_reviewed_at`. The delivered fixture is Synthetic; operational use requires separate readiness work. Workbook reviewer declarations are retained source statements. PPO separately captures the authenticated reviewing actor and time.

| `PPO_Lines` field | Workbook value | PPO treatment |
|---|---|---|
| line_ref | Stable nonempty text, e.g. L-001 | Map workbook_ref + option identity + line_ref to an internal line UUID. Never use row number, description or product code as identity. Duplicate keys block. |
| section_ref | Existing section key | Exact version-bound section membership; orphan references block. |
| description | Required text | Proposed customer-visible description. Length must satisfy the current receiver (300 characters). Escape all rendering. |
| category | One of five named categories | Existing schema-2 category enum. Unknown categories block. |
| quantity | Typed number, up to 3 decimals | Existing decimal-string quantity. No unit conversion inferred. |
| unit | Explicit compatible unit | Keep source unit and canonical mapping. Pilot examples: ea, m, m2, m3, h, lot. Recognise aliases only through a reviewed mapping; do not reinterpret m as m2. |
| unit_cost / unit_sell | Typed numbers, up to 2 decimals | Existing cost/sell decimal strings. Blank is unknown, explicit zero is retained. No AI price completion or margin inference. |
| allowance | Yes / No | Required explicit Boolean in new schema-2 lines. Missing cost is not an allowance. |
| source_ref | Existing source key | Bind exact source record to this line/version. Existing E1 source text is a concise projection within its 500-character limit; full provenance remains in the import sidecar. |
| source_date | Typed Excel date or ISO YYYY-MM-DD | Required calendar date, mapped to effective_date. Recognise 1900/1904 date systems in the production parser or reject unsupported systems explicitly. The preview rejects 1904. |
| include | Yes / No | Proposal for quote included_in_price. Does not remove the cost line from the internal estimate. |
| print | Yes / No | Independent quotation presentation proposal. Included hidden amounts roll into the existing named safe allowance. Approval of import does not approve customer wording. |
| source_sheet / source_row | Text / positive integer | Advisory calculation origin. Importer additionally records its own actual worksheet/table/cell locator; never trust workbook pointers as the sole audit source. |
| workbook_cost / workbook_sell | Typed saved line totals | Compare separately with PPO extensions. Missing or different results block, even if grand totals happen to agree. |

Identifiers remain text. Amounts and dates remain typed in Excel. Formula values are read from saved results without executing formulas. Empty-string results on unused reserved rows are allowed; missing required results on populated rows block. A string-typed formula with no numeric cache is never treated as zero. Date display is Australian; import compares calendar values. Excel separators/number formatting do not change numeric meaning. Units, formula provenance and case/option relationships cannot be reconstructed from formatting alone.

The estimate title must satisfy the receiver's 200-character limit; unit text must fit 40 characters. Source rows must be positive worksheet row numbers. The preview records the actual export sheet, table, range and row separately from the workbook's declared calculation origin. It identifies problem rows by their position within the immutable parsed upload, so duplicate or missing line references do not redirect inspection to a different row. Domain identity still uses stable line references after validation.

## 4. Reconciliation and formula review

1. Check file structure and all required tables/headers. Preserve input hash, template version and parser version.
2. Compare context with current permitted E2 selection. Compare scope, sections and referenced equipment/facilities before costing.
3. Validate each row, including excluded lines. Reject error cells, missing formula caches, unresolved references and invalid decimals. Expired or unknown validity is a review warning for Draft; source date remains mandatory. No business approval threshold is invented.
4. Recalculate supported line cost/sell, section totals, all-line totals and included quote total using PPO decimal arithmetic. Compare every line and each control total to the cent; IDs/counts must match exactly. There is no unexplained balancing line or tolerance that hides a mismatch.
5. Present original values, proposed values and the difference. The estimator can correct Excel and upload a new revision, or make an explicitly reasoned import adjustment when that field is eligible. Keep original bytes and values unchanged. Store source evidence, old/new values, reason and reviewer. Recompute all derived controls after an adjustment while retaining original differences.
6. Show unresolved errors separately from reviewed warnings. A reviewer confirms source calculation review, scope and reconciliation. Any data, mapping, scope, source file or current version change invalidates the confirmation.

An incomplete amount must remain visibly Unknown at the affected aggregate; do not display a partial sum as the total. Cost and sell completeness are independent. Missing include choices also make the proposed included total unknown. An adjustment is validated completely before replacing a proposed row; a failed adjustment creates no mutation or adjustment record. Compare canonical decimal and Boolean values so `1` versus `1.000`, or `Yes` versus `true`, does not create a false revision. Display each field that changed, including quantity and line extensions.

PPO's total comparison cannot prove an engineering formula is correct, that an external supplier source was refreshed, or that a cached value is current. The workflow requires Excel recalculation/save and estimator review. Specialist calculations remain authored in Excel until independently specified and verified for PPO. [Microsoft documents saved formula caches](https://learn.microsoft.com/en-us/office/open-xml/spreadsheet/working-with-formulas).

## 5. State and recovery contract

| State | Meaning | Available next step |
|---|---|---|
| Selected | Context known; no validated file | Upload a workbook or cancel. |
| Reading | File accepted for bounded parsing | Cancel before commit; parsing failure creates no estimate. |
| ReviewRequired | Full proposed dataset and issue list | Inspect source rows; correct file or reasoned eligible adjustments. |
| ReadyToImport | Full validation and current review passed | Submit exact proposal hash and expected current version. |
| Saving | One immutable operation ID in progress | Keep progress; do not generate another ID on timeout. |
| OutcomeUnknown | Response lost; write outcome unknown | Query original operation receipt under current access. |
| Imported | Durable source and database receipt confirmed | Open the exact estimate version; prepare a separate Draft quotation. |
| Conflict | Context, selection, version or authority changed | Preserve safe proposal, reload current context and compare; reconfirm. |
| Rejected / ReadFailed | Invalid file or unrecoverable parse | Explain sheet/row/field or package issue; choose corrected file. |

Identical operation + canonical payload returns the original receipt. Reusing an operation ID with a different payload is a conflict. A file hash helps detect duplicate submissions but is not global authority or a substitute for the operation ID. Same hash against a different option cannot reuse a receipt. Concurrent duplicate attempts serialize against the receiver. No partial import, silent append or best-effort subset in the pilot.

## 6. Logical storage and service boundary

Reuse the modular monolith, current permissions, domain services, document adapter and receipt/outbox patterns. No new framework, parser package, migration number or infrastructure is selected by this design. Evaluate maintained XLSX readers for bounded OOXML parsing, cache visibility, date/number preservation, licensing and secure limits before choosing one in the implementation ADR.

Proposed logical records: ImportSource (original filename, durable object/version, SHA-256, bytes, template); ImportProposal (exact target basis, parser/mapping versions, original rows, adjustments, issues, review hash); ImportCommit (operation/receipt, actor, time, resulting estimate/version); ImportLineMap and ImportSectionMembership (stable source keys and exact internal identities). Bind all records to company and exact option/version. These are design names, not existing database tables.

Before commit, persist and verify source bytes using the private document adapter. Then one database transaction checks current authority, expected estimate/workspace versions, selected Active option, Complete basis and proposal hash; creates estimate version and immutable sidecars; records audit and receipt; and advances the current pointer once. If source durability cannot be established, commit is refused. A failed transaction must leave no current version, receipt or partial line effect. Staged orphan cleanup follows retention policy and never deletes referenced source bytes.

Any later asynchronous processing uses the outbox and the same operation key. A successful upload, parser result or worker response alone is not Imported. Current permission is checked before historical source, receipt and output recovery. The exact store, retention period and operational SharePoint configuration remain unresolved; no live integration is included.

## 7. Re-import and quotation boundaries

Compare stable source line keys to the exact saved version and show added, removed, changed and unchanged lines; changed scope, sources, section membership and include/print proposals also matter. Reordered rows do not create new identities. Duplicate line keys block. A removed line needs explicit review; absence is not automatic deletion. Existing PPO-only/manual lines require a keep/remove decision. Pilot update mode is a reviewed whole-estimate successor, not an implicit merge.

One revision creates one successor with a change reason. Preserve all originals, source workbooks, adjustments, receipt hashes and customer outputs. Nothing reprices or rewrites an issued/accepted quotation. A changed estimate requires a new exact-source Draft quotation and any later applicable approval; previous acknowledgement never carries forward.

Quote-safe outputs whitelist selected descriptions, quantities, sell amounts and reviewed narrative. Exclude unit costs, margin, supplier notes, filenames containing internal information, hidden metadata and inaccessible context. Include and print retain separate E1 semantics. Formal issue/send/response remains E4. Import makes no CRM forecast/stage change, stock reservation, ERP posting, Project or Service handover.

## 8. Access, upload handling and UI

Use existing estimating.read/edit, owner eligibility and current company/site/Opportunity relationships for internal reads/writes. Quote-safe access is separately governed. Owning a workbook or knowing a reference grants no permission. The workbook's named estimator is not the authenticated actor. Scope change/revocation clears sensitive working views; unsent data recovery must follow current permission.

The implementation needs content-based format checks, bounded decompression, encrypted/macro/external-content refusal, safe filename storage, escaped preview/error reports and a reviewed malicious-file handling strategy. Source binaries must never enter the public repository or customer download route. Operational uploads remain outside the synthetic prototype. [OWASP upload guidance](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html) supports extension/content checks and storage/access separation.

The preview is a module content container with no duplicate application rail/logo. Navy actions, green progress accent, 1 px controls, restrained borders/shadows and bottom-corner dialog radii follow available PPO guidance. Responsive rules target 1440×960, 1024×768, 820×800, 390×844 and 320px widths; outer-page overflow must be absent, with tables owning necessary horizontal scroll. The supplied bytes identify r16, not the attachment's advertised r19. Full r19 comparison, browser interaction, mobile visual review and assistive-technology checks remain pending.

## 9. Observable acceptance for implementation

| Case | Required evidence |
|---|---|
| XI-01 Supported workbook | All 12 fixture lines, source metadata and seven section memberships imported; cost 62,952.38, sell/included sell 85,607.63. |
| XI-02 Reconciliation | Offset line differences cannot cancel into a passing grand total. Blank input, formula error/missing cache, duplicate ID, unknown category/unit, source/date mismatch and precision errors block with locators. |
| XI-03 Scope and access | Wrong company/site/option, incomplete basis, revoked access and stale selection rejected in server/API/direct receipt reads. No data leakage through counts, files or errors. |
| XI-04 Atomicity/replay | Inject source-store, transaction, audit and receipt failures; timeout before/after commit; same/different payload retry; simultaneous saves. Exactly one valid outcome or no effect. |
| XI-05 Revisions | Reorder, additions/removals, changed source/section, PPO manual lines and multiple options retain identities and require reviewed differences. Previous versions and outputs remain byte-identical. |
| XI-06 Customer safety | Include/print combinations reconcile customer total; no internal values or source details in safe HTML/PDF/metadata. Exact saved version drives output. |
| XI-07 Capacity/files | 0/1/100/101 rows; existing command bytes; declared/actual ZIP limits; damaged archive; external links/macros; date system and Unicode text. No truncation, formula execution or memory exhaustion. |
| XI-08 Durability/UX | Original workbook, estimate and receipt survive actual app/DB/storage restarts. Keyboard focus, search/filter, corrections, progress, uncertain result and mobile scrolling verified. |

These are future acceptance obligations. Current package checks are documented in the [handover](../delivery/excel-estimate-import-handover.md); they do not pass these server or business acceptance cases.
