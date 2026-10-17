# Workbench parts proposal contract

<!-- versioning: git; committed history is authoritative -->

Document ID: PPO-EST-PARTS-PROPOSAL-CONTRACT. Owner: Dean Fiedler. Status: **proposed contract for build step B0** of the adopted [estimating hub, CPQ and workbench model](../decisions/estimating-configurator-model.md) (PPO-EST-CONFIGURATOR-MODEL-DEC). It is written from the adopted proposals CM5, CM6, CM8, CM9 and CM10 and the adopted answers to Q3–Q6. Owner review of this contract is separate from the adoption of that decision. No code, migration, seed, permission, capability, route or integration is added by this document. ES-08 and Fertigation keep their current behaviour until B2 and B4 deliver this contract.

Scope IDs: `scope:ES-03` (CPQ receiving), `scope:ES-08` (Screen Configurator Workbench), the ES-02 fertigation scope of [ADR-0038](../decisions/ADR-0038-priva-fertigation-native.md), and `scope:ES-05` for document appendices only. Parent requirements served: EST-03 (lineage), EST-04 (quantity and unit), EST-06 (specialist configuration and part mappings), EST-08 (quotation content) and EST-09 (one-off items). No parent ID is added, renamed or closed.

Read with the [CPQ API](../interfaces/cpq-api.md), [CPQ published Products](../decisions/cpq-published-products.md), [ADR-0034](../decisions/ADR-0034-es08-specialist-workbench.md) and [ADR-0038](../decisions/ADR-0038-priva-fertigation-native.md).

## 1. What the contract is

A **parts proposal** is the only thing a specialist workbench hands to CPQ. It is generated on the server from one saved, immutable workbench run. It says which parts, in what quantities and units, the run calls for; what the run found; what it assumed; and which supporting documents it produced. It never carries money.

```text
workbench run (immutable) ──generate──▶ parts proposal (immutable, hashed)
                                          │ receiving preview (CM6, reuses CPQ resolution)
                                          ▼
                                 CPQ configuration for the alternative
                                 lines with origin Workbench, priced only by CPQ
                                          │ existing atomic Use
                                          ▼
                                 native estimate version ─▶ ES-05 (CustomerEligible documents as appendices, CM9)
```

The contract has four rules from CM5 that every field below serves:

1. **No money.** No cost, sell, margin, markup, discount, tax, rate, currency or price tier appears anywhere in a proposal. Strict field checking rejects any such field (section 6).
2. **Exact and replayable.** A proposal is a pure function of one saved run and the documents retained for that run. Generating it again from the same run reproduces the same bytes and the same `proposal_hash`.
3. **Stable line keys.** A line that represents the same part in the same place keeps its `line_key` across re-runs. CM6 depends on this to carry estimator overrides across a re-run.
4. **Explicit size limits.** Every list and string has a stated maximum (section 5). An oversized proposal is refused with an explanation, never truncated.

Workbench-internal detail stays inside the workbench: geometry, hydraulics, I/O, schedules, raw inputs and calculation traces do not cross the boundary. A line's `derivation_ref` points into the run's trace for authorised internal readers; it does not copy the trace.

## 2. Encoding, hashing and versioning

- **Format.** UTF-8 JSON object. Field names are `snake_case`. Unknown fields are rejected at every level; omitted required fields are rejected; `null` is allowed only where a field is marked nullable and never means zero, false or "none chosen".
- **Contract identity.** `contract` is the constant `"PPO-WB-PARTS-PROPOSAL"` and `schema_version` is the integer `1`. The proposal schema is independent of CPQ definition schemas 1–4, the CPQ command envelope (`schema_version: 1`) and the receiving workflow version. A reader accepts only the schema versions it lists. Any added, removed or retyped field, including an optional one, needs a new schema version.
- **Decimals.** Quantities are exact decimal strings, never JSON numbers. Pattern: `^(0|[1-9][0-9]{0,11})(\.[0-9]{1,3})?$` with no trailing fractional zeros (`"12.5"`, not `"12.50"`). This matches the native estimate's three-place quantity contract (`src/estimating/math.ts`). The contract never rounds: a workbench whose calculation yields a value that is not exactly representable in three places must apply its own declared rounding inside its calculation edition and record that in the run; otherwise generation is refused (section 6).
- **Identifiers.** UUIDs are lowercase canonical strings. Hashes are lowercase 64-character SHA-256 hex. Timestamps are UTC ISO 8601 with milliseconds and `Z`.
- **Array order.** Every array has a defined order, because order is hashed: `lines` by `position` ascending; `findings`, `assumptions` and `documents` by their key in the `Intl.Collator("en")` order used by `canonical()`; `source.area_ids` and `readiness.blocking_finding_keys` likewise. Duplicates are rejected.
- **Hashes.** `proposal_hash` is SHA-256 of `canonical()` (from `src/platform/operations.ts`) applied to the whole proposal object with `proposal_hash` removed. Each line's `basis_hash` is SHA-256 of `canonical()` applied to `{line_key, part, quantity, unit, optional, alternative_group}` from that line. Presentation fields (`description`, `group`, `position`, `derivation_ref`) are outside the line basis, so a wording change never forces an override decision.
- **Generation.** A workbench generates a run's proposal at most once and retains it with the run. Later reads return the retained bytes. Regenerating from the run and its retained document records must reproduce the same `proposal_hash`; a mismatch is an integrity failure, never a new proposal.

## 3. Shape

### 3.1 Envelope

| Field | Type | Req. | Rule |
|---|---|---|---|
| `contract` | string | yes | Constant `"PPO-WB-PARTS-PROPOSAL"` |
| `schema_version` | integer | yes | `1` |
| `workbench` | object | yes | Section 3.2 |
| `run` | object | yes | Section 3.3 |
| `source` | object | yes | Section 3.4 |
| `readiness` | object | yes | Section 3.5 |
| `lines` | array of Line | yes | 0–100 items (section 3.6) |
| `findings` | array of Finding | yes | 0–200 items (section 3.7) |
| `assumptions` | array of Assumption | yes | 0–50 items (section 3.8) |
| `documents` | array of Document | yes | 0–20 items (section 3.9) |
| `proposal_hash` | sha256 | yes | Section 2 |

### 3.2 `workbench`

| Field | Type | Req. | Rule |
|---|---|---|---|
| `type_id` | string | yes | Registered workbench type, `^[a-z][a-z0-9-]{2,39}$`. Proposed: `screen-es08`, `priva-fertigation` |
| `instance_id` | uuid | yes | The workbench aggregate the run belongs to (one ES-08 configuration, one Fertigation scope). CM6 replacement is scoped to this instance |
| `calculation_edition` | string | yes | Registered edition label, 1–80 characters, for example `SS-NATIVE-EXACT-QTY-r01` |
| `definition_hash` | sha256, nullable | yes | Exact definition or bundle the edition ran, when the workbench has one |
| `part_mapping` | object, nullable | yes | `{mapping_id: string(1–80), version: integer ≥1, content_hash: sha256}` of the reviewed CM8 mapping used, or `null` when no reviewed mapping exists. With `null`, every line is Unmapped |

### 3.3 `run`

| Field | Type | Req. | Rule |
|---|---|---|---|
| `run_id` | uuid | yes | The saved immutable run (or immutable scope revision) the proposal is derived from |
| `sequence` | integer ≥1 | yes | Monotonic per `workbench.instance_id`. CPQ refuses an older sequence than the one it last received for that instance |
| `content_hash` | sha256 | yes | The run's own retained evidence or content hash |
| `created_by` | uuid | yes | The run's author, not the proposal reader |
| `created_at` | timestamp | yes | The run's creation time. No generation clock enters the proposal, so replay is exact |

### 3.4 `source`

| Field | Type | Req. | Rule |
|---|---|---|---|
| `company_id` | uuid | yes | Explicit company key; must equal the CPQ configuration's company |
| `estimating_workspace_id` | uuid | yes | Must equal the receiving CPQ configuration's workspace |
| `option_id` | uuid | yes | The discovery alternative (A, B…). Must equal the CPQ configuration's alternative (Q4: one configuration per alternative) |
| `discovery_revision_id` | uuid | yes | The exact discovery revision the run was bound to |
| `discovery_content_hash` | sha256 | yes | That revision's content hash |
| `system_id` | uuid, nullable | yes | The ES-02 system the run serves, when bound to one |
| `area_ids` | array of uuid | yes | 0–200 ES-02 areas the run covers, sorted |

A run bound to a discovery revision older than the alternative's selected revision is still a valid proposal; CPQ shows it as **Stale** (CM1) and the Wizard Review step reports it.

### 3.5 `readiness`

| Field | Type | Req. | Rule |
|---|---|---|---|
| `state` | `"Ready"` \| `"Blocked"` | yes | `Blocked` if and only if at least one finding has `blocking: "Receipt"` |
| `blocking_finding_keys` | array of string | yes | Exactly the keys of findings with `blocking: "Receipt"`, sorted. Empty when Ready |

Only a Ready proposal can be received (CM5). Findings with `blocking: "Use"` do not stop receipt; they travel into CPQ and block Use there until a later proposal from the same instance no longer carries them (CM6). This two-level reading reconciles CM5 ("only a Ready proposal can be received") with CM6 ("findings marked as blocking… block Use in CPQ") and is offered for review.

### 3.6 Line

| Field | Type | Req. | Rule |
|---|---|---|---|
| `line_key` | string | yes | `^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$`, case-sensitive, unique in the proposal, stable across re-runs (section 4) |
| `position` | integer ≥1 | yes | Unique display order within the proposal |
| `group` | object | yes | `{kind: "Area" \| "System" \| "Section", key: string(1–64), label: string(1–120)}` |
| `category` | `"Product"` | yes | Schema 1 carries material parts only. Labour, freight, engineering and subcontract stay CPQ Rule or Manual lines (open item O1) |
| `part` | Part | yes | Section 3.6.1 |
| `description` | string | yes | 1–300 characters, the native estimate line limit. Plain text, no markup |
| `quantity` | decimal string | yes | Greater than zero, section 2 pattern. A part the run calculates as zero is not a line |
| `unit` | string | yes | 1–40 characters, the native unit label limit. For a Mapped part it must equal the Variant's unit exactly; there is no unit conversion (CPQ published Products) |
| `optional` | boolean | yes | `true` marks an optional item. CPQ treatment is open (O7) |
| `alternative_group` | string, nullable | yes | `^[a-z0-9][a-z0-9-]{0,39}$` grouping mutually exclusive lines, or `null` |
| `derivation_ref` | string | yes | 1–200 characters; an opaque reference into the run's calculation trace, readable only by authorised internal users |
| `basis_hash` | sha256 | yes | Section 2. CPQ records Workbench overrides against it (CM3) |

#### 3.6.1 Part

`part` is a tagged object. Exactly one shape applies, selected by `mapping_state`.

| `mapping_state` | Fields | Rule |
|---|---|---|
| `"Mapped"` | `workbench_part_id: string`, `product: {product_id: uuid, revision_id: uuid, content_hash: sha256}` | The exact Products **Variant**, revision and content hash resolved through `workbench.part_mapping`. Never by label, Family, Model or latest revision. CPQ rechecks publication and unit on receipt |
| `"Unmapped"` | `workbench_part_id: string, nullable`, `unmapped_reason` | No product field. `workbench_part_id` may be `null` only with reason `NoPartSelected` |

`workbench_part_id` is the workbench's own part identity, `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,79}$`. `unmapped_reason` is one of:

| Reason | Meaning |
|---|---|
| `NoMappingEntry` | The workbench part identity has no entry in the reviewed mapping, or no mapping exists |
| `NotInCatalogue` | The mapping records that no published Variant exists for this part |
| `Conflict` | The mapping or the run resolves the part to more than one identity |
| `Unresolved` | The run could not decide the part (for example, an open input) |
| `NoPartSelected` | The run calls for a quantity but no workbench part identity was selected |

CM8 applies on receipt: an Unmapped line arrives in CPQ flagged **Unmapped**, is never dropped, guessed or matched by label, and blocks Use until the estimator maps it to an exact Variant or converts it to a reasoned One-off.

### 3.7 Finding

| Field | Type | Req. | Rule |
|---|---|---|---|
| `finding_key` | string | yes | `^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$`, unique, stable across re-runs for the same condition |
| `severity` | `"Error"` \| `"Warning"` \| `"Information"` | yes | |
| `blocking` | `"Receipt"` \| `"Use"` \| `"None"` | yes | `Receipt` and `Use` require severity `Error` |
| `message` | string | yes | 1–500 characters, readable by an estimator |
| `input_ref` | string, nullable | yes | 1–120 characters naming the workbench input concerned, or `null` |
| `line_key` | string, nullable | yes | A `line_key` present in this proposal, or `null` |
| `action` | string, nullable | yes | 1–300 characters saying what resolves it, or `null` |

Findings are internal. They feed the Wizard Review step and ES-04 review; they are never offered to a customer.

### 3.8 Assumption

| Field | Type | Req. | Rule |
|---|---|---|---|
| `assumption_key` | string | yes | `^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$`, unique |
| `text` | string | yes | 1–500 characters, plain words a quotation could quote |
| `audience` | `"Internal"` \| `"CustomerEligible"` | yes | Only CustomerEligible text may be offered to the quotation preparer, and only by deliberate choice (open item O13) |

### 3.9 Document

| Field | Type | Req. | Rule |
|---|---|---|---|
| `document_key` | string | yes | `^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$`, unique, stable across re-runs for the same output |
| `kind` | `"LayoutDrawing"` \| `"Diagram"` \| `"Schedule"` \| `"Report"` | yes | |
| `title` | string | yes | 1–200 characters |
| `media_type` | `"application/pdf"` \| `"text/html"` \| `"image/svg+xml"` | yes | |
| `sha256` | sha256 | yes | Exact retained bytes |
| `byte_length` | integer | yes | 1–10,485,760 (10 MiB) |
| `page_count` | integer ≥1, nullable | yes | Required for PDF; `null` otherwise |
| `status_wording` | string | yes | 1–200 characters, the study status the document itself prints, for example "Estimating study · not for fabrication" |
| `audience` | `"Internal"` \| `"CustomerEligible"` | yes | Internal documents are never offered to the quotation (CM9, Q5) |
| `storage_ref` | string | yes | 1–200 characters; opaque server reference to the retained bytes owned by the workbench. Never a URL, path or embedded bytes |

The proposal never embeds document bytes. Bytes stay in the workbench's retained store, and every read verifies `sha256` and `byte_length`. CustomerEligible is the workbench's declaration that a document may be offered; choosing it remains the ES-05 preparer's act, covered by ES-05 independent approval. The workbench's own tests must prove that `status_wording` is printed on the document.

### 3.10 Example

Illustrative synthetic shape only. The values are not fixture results, mappings or engineering quantities.

```json
{
  "contract": "PPO-WB-PARTS-PROPOSAL",
  "schema_version": 1,
  "workbench": {
    "type_id": "screen-es08",
    "instance_id": "5a1d0000-0000-4000-8000-000000000001",
    "calculation_edition": "SS-NATIVE-EXACT-QTY-r01",
    "definition_hash": "f1ec5980ce6f1a68ba1a5b59eeda59a08da1851a6c7f7736d94041a5986d35c8",
    "part_mapping": null
  },
  "run": {
    "run_id": "5a1d0000-0000-4000-8000-000000000002",
    "sequence": 3,
    "content_hash": "1111111111111111111111111111111111111111111111111111111111111111",
    "created_by": "5a1d0000-0000-4000-8000-000000000003",
    "created_at": "2026-10-17T02:15:00.000Z"
  },
  "source": {
    "company_id": "5a1d0000-0000-4000-8000-000000000004",
    "estimating_workspace_id": "5a1d0000-0000-4000-8000-000000000005",
    "option_id": "5a1d0000-0000-4000-8000-000000000006",
    "discovery_revision_id": "5a1d0000-0000-4000-8000-000000000007",
    "discovery_content_hash": "2222222222222222222222222222222222222222222222222222222222222222",
    "system_id": "5a1d0000-0000-4000-8000-000000000008",
    "area_ids": ["5a1d0000-0000-4000-8000-000000000009"]
  },
  "readiness": { "state": "Ready", "blocking_finding_keys": [] },
  "lines": [
    {
      "line_key": "CE-LINE-247",
      "position": 247,
      "group": { "kind": "Section", "key": "bed", "label": "Bed" },
      "category": "Product",
      "part": {
        "mapping_state": "Unmapped",
        "workbench_part_id": "PPO.CLP.007.ALL",
        "unmapped_reason": "NoMappingEntry"
      },
      "description": "Truss clip 30 mm stainless",
      "quantity": "1172",
      "unit": "each",
      "optional": false,
      "alternative_group": null,
      "derivation_ref": "positions/CE-LINE-247",
      "basis_hash": "3333333333333333333333333333333333333333333333333333333333333333"
    }
  ],
  "findings": [
    {
      "finding_key": "part-mapping:none",
      "severity": "Warning",
      "blocking": "None",
      "message": "No reviewed part mapping exists for this workbench. Every line arrives in CPQ as Unmapped.",
      "input_ref": null,
      "line_key": null,
      "action": "Map each line to a Products Variant in CPQ, or convert it to a reasoned One-off."
    }
  ],
  "assumptions": [],
  "documents": [],
  "proposal_hash": "4444444444444444444444444444444444444444444444444444444444444444"
}
```

## 4. Line key stability

A line key names *the same part in the same place*, not a row number in a particular run.

- A workbench derives `line_key` only from identities its definition or aggregate already keeps stable: a definition position key (ES-08 `CE-LINE-nnn`) or a scope-owned child UUID with a role prefix (Fertigation `valve:<uuid>`).
- A key is never derived from a label, description, list index, quantity or Product identity. A re-mapped part keeps its key; its `basis_hash` changes.
- A key never moves to a different place. If a part's place changes, the old key disappears (proposed for removal) and a new key appears.
- Two lines of the same part in different places have different keys.

## 5. Size limits

These are synthetic bounds chosen to fit existing limits. They are not measured capacities (open item O6). Every limit is enforced on generation and again on receipt; exceeding any of them refuses the whole proposal with `PartsProposalTooLarge`, naming the limit and the actual value.

| Item | Limit | Reason |
|---|---|---|
| Serialised proposal | 262,144 bytes of UTF-8 | ES-08's existing specialist envelope; fits CPQ's 512 KiB receiving routes with room for decisions |
| Lines | 100 | CPQ's receiving limit (adopted Q6); CPQ separately refuses generated plus retained lines over 100 with `CpqReceivingLineLimit` |
| Findings | 200 | Matches CPQ's 200 receiving decisions |
| Assumptions | 50 | |
| Documents | 20 | |
| `source.area_ids` | 200 | |
| Document bytes | 10 MiB each, 50 MiB per proposal | Twice Fertigation's 5 MiB evidence file bound; A3 drawing sets |
| Strings | As stated per field | `description` 300 and `unit` 40 match the native estimate line |

## 6. Validation and refusal

Generation and receipt run the same checks, in this order, and stop at the first refusal. A refusal writes nothing: no proposal, receipt, CPQ line, audit, outbox or operation receipt. The original proposal and operation ID are kept for retry, as the CPQ API requires.

1. Transport and size: request limits as the receiving routes define them, then section 5 limits.
2. Strict shape: `contract`, `schema_version`, required and unknown fields, types, patterns, nullability, sorted arrays and duplicates.
3. Internal consistency: readiness against findings, `blocking` against severity, finding `line_key` references, Part shape against `mapping_state`, a non-null `part_mapping` for any Mapped line.
4. Hashes: every `basis_hash`, then `proposal_hash`.
5. Authority and source: access to the workbench run and the CPQ configuration, company, workspace and alternative equality, run integrity (`run.content_hash`), and `run.sequence` order.
6. Registration: workbench type, calculation edition and part mapping registered for the company (CM10).
7. Products: for each Mapped line, the existing CPQ publication, evidence and exact-unit checks.
8. Documents: each `storage_ref` resolves to retained bytes matching `sha256` and `byte_length`.
9. Readiness: a Blocked proposal is refused for receipt.

| Code | HTTP | When | UI behaviour |
|---|---|---|---|
| `InvalidData` | 422 | Steps 2–3: shape, type, pattern, nullability, order, duplicate or consistency failure, including any money-like or otherwise unknown field | Name the field path; keep the proposal |
| `PartsProposalSchemaUnsupported` | 422 | Unknown `contract` or `schema_version` | Say which versions the reader accepts |
| `PartsProposalTooLarge` | 422 | Any section 5 limit | Name the limit and actual value; never truncate |
| `PartsProposalQuantityNotExact` | 422 | On generation: a calculated quantity is not exactly representable in three decimal places | Point to the line and the workbench edition; no rounding is applied |
| `PartsProposalHashMismatch` | 409 | A `basis_hash` or `proposal_hash` does not re-derive, or the run's content hash no longer matches | Treat as integrity failure; do not receive |
| `PartsProposalSourceMismatch` | 409 | Company, workspace or alternative differs from the CPQ configuration | Explain which binding differs |
| `PartsProposalSuperseded` | 409 | `run.sequence` is lower than the sequence last received for this instance | Offer the newer run |
| `PartsProposalWorkbenchUnregistered` | 409 | Type, edition or part mapping not registered for the company | Name the missing registration |
| `PartsProposalDocumentUnavailable` | 409 | A document's bytes are missing or do not match | Name the document; do not receive the proposal |
| `PartsProposalBlocked` | 409 | Readiness is Blocked | List the blocking findings and link to the workbench |
| `CpqProductUnitMismatch`, `CpqProductPublicationChanged`, `CpqProductEvidenceChanged` | 409 | Step 7, reusing the existing CPQ codes | As the CPQ API states |
| `RecordUnavailable` | 404 | Missing, cross-company or not permitted, without disclosure | Stop protected reads |
| `PayloadTooLarge` | 413 | Transport bound exceeded before parsing | As the CPQ API states |

## 7. Receiving into CPQ (CM6)

Receiving reuses CPQ's existing receiving resolution preview and adoption ("Use"), with the same exact preview hash, atomic transaction, original-operation recovery and 100-line limit. "Send to CPQ" replaces ES-08's "Send to estimate" and Fertigation's scoping-note receipt when B2 and B4 deliver.

### 7.1 Line origin

Every received line carries origin **Workbench** with `{type_id, instance_id, run_id, run.sequence, proposal_hash, line_key, basis_hash}`. Its CPQ identity is the pair (`instance_id`, `line_key`), proposed as the target string `workbench:<instance_id>:<line_key>`. Rule and Manual lines, and lines of any other workbench instance, are outside the replacement scope of a receipt.

### 7.2 First receipt

Every line arrives with origin Workbench. Unmapped lines arrive flagged Unmapped (CM8). Findings with `blocking: "Use"` attach to the configuration and block Use. The receipt records the exact `proposal_hash`, so CPQ, the estimate and the quotation can trace each line to its run.

### 7.3 Re-run

For each `line_key`, CPQ compares the last received line **B**, the current CPQ line **C** (including any reasoned override or mapping decision) and the new proposal line **N**.

| Case | Condition | Result | Decision |
|---|---|---|---|
| Regenerated | B and N present, no override on C | C is replaced by N | None |
| Basis unchanged | B and N have the same `basis_hash`; C has an override | Override stays effective; presentation fields update | None |
| Override against changed basis | `basis_hash` differs; C has an override | The new generated value shows beside the override (`CpqOwnedLineChanged`) | **Keep override**, **Use new value** or **Remove** |
| Incompatible change | Part identity or unit differs between B and N; C has an override | As above, but Keep override is not offered for a Quantity override, because a quantity never carries across a part or unit change (ADR-0034) | **Use new value** or **Remove** |
| Removed | B present, N absent | Proposed for removal, never dropped silently (`CpqRemovalReviewRequired`) | **Remove** or **Keep** as a retained line |
| Added | N present, B absent, no removal evidence for the key | Received | None |
| Reintroduced | N present, B absent, earlier explicit removal of the key | Not received until decided (existing CPQ protection) | **Use new value** (Replace) or leave removed |

The three CM6 decisions map to CPQ's existing receiving actions: Keep override → Keep, Use new value → Replace, Remove → Remove. Each decision needs a reason, as today. Overrides keep the existing kinds Quantity, SellPrice and Suppress, recorded against the line's `basis_hash` (CM3).

### 7.4 Readiness in CPQ

Use stays blocked while any of these hold: an Unmapped line remains; a `blocking: "Use"` finding from the latest received proposal of any instance remains; any receiving decision is unresolved; or a received proposal is Stale against the alternative's selected discovery revision and the estimator has not confirmed it. Pricing of Workbench lines follows CM3 and CM4: the Variant's governed cost source at the run's pricing date, or Price unknown, never zero.

## 8. Documents into the quotation (CM9)

When B5 delivers, the ES-05 preparer sees the CustomerEligible documents of the proposals the estimate version traces to, and chooses which to include as appendices. The quotation revision binds each chosen document by `sha256`, `byte_length` and `media_type`, alongside its template and projection. A document from a proposal the estimate no longer traces to cannot be chosen. Internal documents are never offered. The issued quotation and its appendices are filed in SharePoint under its document authority. This contract only supplies the document records; ES-05 behaviour is specified in B5.

## 9. Mapping from current workbenches

These tables say where each contract field would come from when B2 (ES-08) and B4 (Fertigation) deliver. Field names are the current TypeScript types (`src/estimating/specialist/types.ts`, `src/estimating/fertigation/types.ts`); live schema must be read again at build time. Rows marked *open* are not decided here.

### 9.1 ES-08 Screen Configurator Workbench (B2)

| Contract field | ES-08 source | Note |
|---|---|---|
| `workbench.type_id` | constant `screen-es08` | Proposed |
| `workbench.instance_id` | `Configuration.id` | One configuration binds one system |
| `workbench.calculation_edition` | `SS-NATIVE-EXACT-QTY-r01` | ADR-0034 native quantity version |
| `workbench.definition_hash` | `RunSnapshot.definition_bundle_hash` | Bundle `f1ec5980…5c8` |
| `workbench.part_mapping` | `null` until a reviewed CM8 mapping exists | `SS-PART-IDENTITY-r03-PROVISIONAL` is ES-08's own part identity table, not a Products mapping |
| `run.run_id`, `sequence`, `created_by`, `created_at` | `SavedRun.id`, `.sequence`, `.created_by`, `.created_at` | |
| `run.content_hash` | `SavedRun.evidence_hash` | |
| `source.estimating_workspace_id`, `option_id` | `RunSnapshot.binding` | |
| `source.discovery_revision_id`, `discovery_content_hash` | `binding.revision_id`, `binding.content_hash` | `binding.context_hash` stays internal |
| `source.system_id`, `area_ids` | `binding.system_id`, `binding.area_ids` | FacilityScope bindings have no system (`null`) |
| `source.company_id` | `Configuration.company_id` | |
| Lines | `calculation.positions` of the run | Not the resolved set: its keep/generated/remove decisions move to CPQ receiving under CM6. Which positions become lines is *open* (O9) |
| `line_key` | `Position.key` (`CE-LINE-nnn`) | Fixed by the definition bundle, so stable across re-runs; extra screen slots keep their fixed rows |
| `position` | `Position.row` | |
| `group` | `{kind: "Section", key, label}` from `Position.section` | Kit, Screens, Edge seals, Bed, Drive, Motors, Fixings… |
| `description` | `Position.description` | |
| `quantity` | `Position.effective_quantity` (exact rational) | Must be terminating with at most three places, otherwise `PartsProposalQuantityNotExact`; `display` is never used |
| `unit` | `Position.unit` | `m²`, `m`, `roll`, `stock length`, `pack`, `each`; agreement with Variant units is *open* (O3) |
| `part.workbench_part_id` | `Position.part_id` | Provisional ES-08 identities such as `PPO.CLP.007.ALL` from the `SS-PART-IDENTITY-r03-PROVISIONAL` table |
| `part.mapping_state` / `unmapped_reason` | `Position.part_state` | Until a CM8 mapping exists, every line is Unmapped. Then: `Mapped` (to an ES-08 identity) → Mapped if the mapping resolves a Variant, else `NoMappingEntry`; `No part selected` → `NoPartSelected`; `Not in catalogue` → `NotInCatalogue`; `Unresolved` → `Unresolved`; `Conflict` → `Conflict` |
| `derivation_ref` | `positions/<Position.key>` | `rule`, `formula`, `source` stay in the run |
| `optional`, `alternative_group` | `false`, `null` | ES-08 has neither concept today |
| `basis_hash` | Computed | |
| Not carried | `Position.price`, `calculation.commercial`, `DraftProposal.illustrative_prices`, `SYN-ES08-RECEIVE-01` pricing | CM7: pricing leaves ES-08 |
| Findings | `calculation.diagnostics` | `finding_key` from `code` and `key`; Error / Warning / Information map one to one. Which errors block Receipt or Use is *open* (O9) |
| Findings (review) | `calculation.manual_review_required` | One finding per unreviewed manual quantity; blocking level *open* (O9) |
| Readiness | Derived from findings | `calculation.state = "Invalid"` yields one `Receipt` finding |
| Assumptions | `DraftProposal.inputs` whose `attribution.kind` is `assumption` or `recovered-default` | `Internal` by default; CustomerEligible wording *open* (O13) |
| Documents | `[]` | Drawing inputs are not saved in the run today, so sheets cannot be reproduced (CM9 prerequisite). Afterwards: kind `LayoutDrawing`, A3 PDF, `status_wording` "Estimating study · not for fabrication" |

### 9.2 Priva Fertigation Configurator Workbench (B4)

Fertigation produces no part lines today: its receipt is a manual scoping note (`PPO-FERT-HANDOVER-r01`) and it has no part identity register. The rows below are the proposed starting point for B4; each line rule needs Dean's confirmation (O10).

| Contract field | Fertigation source | Note |
|---|---|---|
| `workbench.type_id` | constant `priva-fertigation` | Proposed |
| `workbench.instance_id` | Fertigation scope ID | |
| `workbench.calculation_edition` | `Calculation.edition` (`PPO-FERT-NATIVE-CALC-r01`) | |
| `workbench.definition_hash` | `null` | No separate definition bundle |
| `workbench.part_mapping` | `null` until Priva component Variants are catalogued (Q8) | |
| `run.run_id`, `content_hash` | Immutable scope revision ID and content hash (`ppo.fertigation_revisions`) | Whether only a reviewed revision (`ppo.fertigation_reviews`) may emit is *open* (O10) |
| `run.sequence` | Revision number within the scope | |
| `source.*` | The revision's exact Discovery binding (workspace, option, revision, hash, selected system, represented areas) | Facility observations stay outside the proposal |
| Line: dosing unit | The selected `Candidate`: `line_key` `candidate:<id>`, quantity `1`, unit `each`, `workbench_part_id` `<family>:<variant>` | Fertigation records `shortlisted` only; a single selection is needed first (O10) |
| Lines: valves and master valves | `Valve` / `Master` with `phase = "proposed"` and `intent` `new` or `replace`: `valve:<id>` / `master:<id>`, quantity `1`, unit `each` | `model` is free text, not a part identity, so these arrive Unmapped with `NoPartSelected` until a part register exists |
| Lines: filters, sensors, controllers | Records with `phase = "proposed"`: `filter:<id>`, `sensor:<id>`, `controller:<id>` | Whether each is supplied by Powerplants is *open* (O10) |
| Pipes, I/O banks, GroScales hardware | Not mapped in schema 1 | Lengths are JS numbers and supply is undecided (O2, O10) |
| `group` | `{kind: "Section"}` per register (Dosing, Valves, Master valves, Filters, Sensors, Controllers) | Area grouping is an alternative (O10) |
| `description` | Record `label`, then `model` or `family`/`variant` | |
| `derivation_ref` | `<register>/<id>` | |
| Findings | `Calculation.findings` (`id`, `severity`, `field`, `message`) | Proposed: `conflict` → Error / Receipt; `incomplete` → Warning / None; `review` → Warning / None. Confirm (O10) |
| Findings (candidates) | `Calculation.candidates[].status` | Proposed: `outside_entered_limits` → Error / Use for the selected candidate. Confirm (O10) |
| Findings (actions) | Open `Action` records with purpose `question` or `review` | Information / None |
| Assumptions | `Evidence` with `kind = "assumption"` | `Internal` by default |
| Documents | `ppo.fertigation_outputs` for the revision | kind `Report`; `audience` `customer` → CustomerEligible, `internal` → Internal; `status_wording` "Synthetic draft scoping report — not for construction or commissioning"; `storage_ref` from `document_key`. Outputs are prepared after the revision today, which conflicts with exact replay (O5) |

## 10. Registering a workbench (CM10)

A new workbench conforms by: its own ADR for its calculations, inputs and limits; registering `type_id`, its equipment categories (CM1), each `calculation_edition` and each reviewed `part_mapping` version; and producing proposals that pass section 6 with its own synthetic fixtures. A workbench whose output cannot be expressed as a parts proposal is a reason to revise this contract with a new `schema_version`, not to bypass it. Where registrations are stored is decided in B1 or B2 (O12).

## 11. Open items

None of these is decided by this contract. Each names the build step that must close it.

| ID | Open item | Close in |
|---|---|---|
| O1 | May a workbench propose labour, freight, engineering or subcontract lines? Schema 1 says no | Dean, before B4 |
| O2 | Exact quantities: ES-08 rationals that do not terminate in three places, and Fertigation values held as JS numbers. The contract refuses rather than rounds | B2, B4 |
| O3 | Unit vocabulary: ES-08's `roll` and `stock length` against Variant units. No conversion exists | B2 with the CM8 mapping |
| O4 | Zero-line proposals: a re-run that removes every line meets CPQ's `CpqReceivingLinesRequired` | B1 |
| O5 | Documents prepared after a run (Fertigation outputs) versus exact replay. Recommended: a later document needs a new run | B4, B5 |
| O6 | The section 5 limits are synthetic. Measure synthetic jobs; raise only by a separate decision (Q6) | B2, B4 |
| O7 | How CPQ prices, totals and prints `optional` and `alternative_group` lines | B1 |
| O8 | Whether an estimator's CPQ mapping of an Unmapped line carries to the same `workbench_part_id` on a re-run, and what happens when the workbench later maps it differently | B1, B2 |
| O9 | ES-08: which positions become lines (excluded, gate not included, zero, manual quantities awaiting review) and which diagnostics block Receipt or Use | B2 |
| O10 | Fertigation: which records are supplied parts; a single selected candidate; a part identity register; pipes, I/O and GroScales; finding and candidate-status blocking levels; whether emission needs a recorded review | Dean, before B4 |
| O11 | Workbench runs for Express workspaces (CM2). Schema 1 requires a discovery revision | B3 |
| O12 | Where workbench types, editions and part mappings are registered, and who reviews a mapping | B1, B2 |
| O13 | Who marks an assumption CustomerEligible, and whether ES-05 approval covers chosen assumption text as it covers appendices | B5 |
| O14 | Read route, storage and retention of proposals, and the receiving command shape | B2 |
| O15 | Read authority for proposals, findings and documents. No new capability is proposed here; reuse of `estimating.read` and the workbench's existing read checks is expected | B2 |

## 12. What this contract does not do

It adds no code, migration, seed, permission, capability, route, UI or integration. It does not price anything, set a rounding rule, approve a part mapping, select a Fertigation candidate or approve a drawing for customer use. Calculation, pricing and ERP rules remain with their own decisions: CPQ governed costs for prices, the workbench ADRs for quantities, and MYOB for ERP items, stock and purchasing. Workbench drawings remain estimating studies, with CAD and SharePoint keeping their authorities. All synthetic identities, values and examples above are illustrative and carry no operational authority.
