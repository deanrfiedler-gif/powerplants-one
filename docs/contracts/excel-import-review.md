# Excel import review API

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **Scope:** BC-04 / PPO-010; synthetic preview only. [Decision](../decisions/excel-import-review-backend.md).

## Target preparation

`POST /api/v1/estimating/workspaces/{id}/excel-import/context`

JSON: `{ option_id, revision_id }`. Both are exact native UUIDs. The server checks the signed-in estimating owner, current working company, CRM/shared/estimating read and edit permissions, Draft workspace, selected Active option, exact Complete E2 revision and existing cost-version authority. The pilot requires a Site.

Returns the exact target, `basis_hash`, native-reference mapping rule, parser limits and explicit `durable: false, can_import: false`. The target includes current organisation/site/option IDs, discovery input, scope/context hashes, workspace version and existing estimate/version identities. These are private internal facts.

## Workbook preview

`POST /api/v1/estimating/workspaces/{id}/excel-import/preview`

JSON: `{ option_id, revision_id, basis_hash, file: { name, base64 } }`.

Accept canonical base64 for one macro-free .xlsx within 5 MiB, using a plain filename of at most 160 characters. The streamed JSON envelope is limited to base64 capacity plus 4096 bytes. Existing local/hosted identity, same-origin and private/no-store response rules apply. No client-provided rows, adjustments, approval flags or target snapshots are accepted.

The current basis must match before parsing and after a fresh authority check following parsing. A stale selection/revision/context/estimate refuses the preview. The exact current database UTC date determines source-expiry warnings.

The response contains:

- Exact file hash/size/name, parser and mapping versions, authenticated preparer and current basis.
- Every populated row's original typed cells and formula/cache evidence, actual sheet/table/range/row and separately declared calculation origin.
- Normalized proposed lines, sections, sources and scope comparisons. Workbook references are exact native IDs; labels cannot resolve records.
- Issues with severity, stable code, field and actual row locator where available. Missing/duplicate line keys never become inspection identities.
- Independently complete cost, sell, included-sell and section totals; unknown components produce null aggregates. Line and control differences are separate.
- A deterministic review fingerprint over all returned evidence, date and basis; `Blocked` when errors exist, otherwise `ReviewRequired`.

`validation_passed` means these bounded automated checks pass. Source calculation correctness, scope/configuration review, warnings and commercial approval remain separate. Every response retains `review.recorded: false`, `durable: false` and `can_import: false`. The hash is neither a receipt nor save authority.

Malformed packages return 422 `WorkbookRejected`; invalid envelopes return 422 `InvalidData` or `PayloadTooLarge`; inaccessible records return the native 403/404 refusal without review/source contents. Stale context returns 409 `ExcelImportBasisChanged` or the existing E2 refusal. Validly parsed workbooks with domain errors return 200 `Blocked` so all rows/issues can be inspected. Missing authentication and cross-origin handling retain existing behaviour.

## Receiving boundary

No estimate, source object, sidecar, durable review, receipt, audit or outbox row is created. Repeating a preview rechecks current access and recomputes its result. Closing the client loses this transient upload. Durable originals, authenticated exact review, atomic estimate commit, persisted stable line identities, re-import and quotation continuation require the next increment and their own failure/recovery proof. Existing saved estimates and issued documents remain unchanged.

Traceability: EST-02–EST-05, EST-07/08 and DOC-01/02; preview portions of XI-01/02/03/07 in the [parent contract](excel-estimate-import.md). UI, native Excel compatibility, owner acceptance and deployment are not asserted.
