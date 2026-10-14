---
owner: Dean Fiedler - prototype owner
status: Implemented synthetic backend; independent acceptance open
date: 2026-10-14
---

# Excel import quotation continuation

Step 5 of [PPO-010 Excel import](excel-estimate-import.md), following [controlled re-import](excel-import-revision.md). [Decision](../decisions/excel-import-quotation-backend.md); [execution evidence](../testing/evidence/excel-import-quotation/README.md). EST-02–EST-05, EST-07/08 and DOC-01/02 retain their parent scope and open acceptance. XI-03/06/07/08 are the bounded checks. OUT-06 remains a synthetic E1 Draft; commercial issue and E4 approval are separate.

## API and review workflow

All routes require current authenticated scope; POST requires the same origin. Responses are private/no-store. Commands retain the 64 KiB boundary and at most 100 unique lines. No browser page, native import control, new capability, grant, seed, schema or external adapter is added.

| Route | Contract |
|---|---|
| POST `/api/v1/estimating/estimates/{id}/excel-quote/review` | `{estimate_version_id, choices?}`. Read-only review against the exact currently imported estimate, selected Active option and current Complete E2 revision. Requires internal import read/edit, owner eligibility, quotation prepare/read and all current linked scope/source permissions. |
| POST `/api/v1/estimating/estimates/{id}/excel-quote` | Native schema-1 quotation envelope: operation_id, reason, id (new Draft revision UUID), estimate_version_id, expected_version, expected_quote_version, choices. Add exact review_hash and confirmations `CustomerWording`, `IncludePrint`, `Reconciliation`. Returns the native operation receipt and replayed flag. |
| GET `/api/v1/estimating/quotes/{id}/excel-import` | Internal immutable continuation evidence: exact review, confirmations, actor, occurred_at, reason, operation and quote/estimate version. Requires current quote read and import read authority. Ordinary native Drafts have no Excel continuation evidence and return unavailable. |

First obtain the review for the exact saved imported version. The review supplies current workbook proposals per native line, expected versions, reconciliation and whitelisted customer content. Included and print are independent. Included hidden lines contribute through the existing **Included scope allowance**. Excluded lines contribute nothing, even when print is true. Cost lines and native estimate totals remain intact.

Retained lines with no row in the current workbook have a null proposal. This includes PPO-only lines and Keep decisions for omitted prior workbook lines. No historical flag is silently carried forward. With unresolved lines, can_prepare is false and review_hash is null. Submit an explicit complete set of `{line_id,included,print}` choices to obtain a new review. At least one line must be included. Changed workbook choices are identified by line ID. All-no automatic proposals likewise cannot prepare.

Reconciliation separately shows full estimate sell, the current workbook's proposed included sell, reviewed sell for workbook lines, reviewed sell for retained lines and resulting Draft total. The latter two add to the Draft total using the existing decimal arithmetic. The customer content shows exactly the selected narrative, names and line/group amounts, before reference allocation. Confirm wording separately from the workbook import: source review declarations do not approve customer descriptions or scope text.

## Exactness and persistence

The review hash binds the actor, native version/content hash, import review and original source hashes, current E2/context basis hash, prior quote revision/version, proposals, complete choices, reconciliation, customer content and template definition hash. Changes invalidate the review. Native manual successors that are not accepted imports cannot use this path; a separately controlled re-import is required. Wrong target/version, stale selection, incomplete basis, archived/held group and inaccessible old quote context refuse new content.

The save rebuilds this review under the workspace transaction lock. One native Draft quotation revision, header advance, render job, append-only audit review, operation receipt and DraftQuotePrepared outbox entry commit together. A late failure rolls them all back. This uses existing SQL revision/graph/append-only constraints; the extra Excel review binding is a service invariant, not a new database trigger. Native PrepareDraftQuote command payloads and hashes remain unchanged and do not assert Excel review evidence.

Choice array ordering does not change the Excel command's intent. Identical concurrent or uncertain submissions recover the original receipt. Reusing an operation for different content conflicts. Accepted replay and GET operation recovery recheck current historical import/edit and quotation prepare/read authority before disclosure; they can recover after later versions, selection changes or another Draft. Recovery never creates another revision/job. Internal evidence reads need current read authority rather than ownership.

No workbook is re-parsed, re-uploaded or edited at quotation preparation. The original file hash and accepted import record identify the durable source; download verification/availability remains the existing retained-source contract. Original estimate versions, workbooks, choices and quote outputs are preserved.

## Output and recovery

Continue through the existing quote read, render/retry and exact file endpoints. Command acceptance is **Draft saved**, not PDF ready. The durable worker verifies captured template/input hashes, retains failures, and recovers stored output after interruption. Successful files contain only the native safe snapshot: selected title/scope/customer/site/contact, visible included descriptions/quantities/units/sell amounts, named hidden allowance and total. No costs, margins, supplier source fields, workbook filenames, source metadata or review payload are added to HTML/PDF or the quote-safe DTO. Internal evidence remains in its separate authorised endpoint. The whitelist cannot detect confidential words deliberately placed in an otherwise customer-visible description; customer wording review is explicit.

An edited import or changed presentation needs a new review and Draft revision. Earlier exact outputs remain available under current historical permissions. Import section labels are retained internally but do not change the existing quotation layout. No tax, terms, validity, engineering correctness, customer sending, commercial approval, ERP posting, forecast change or receiving handover is inferred. Native import UI, operational workbook compatibility, independent review and deployment remain open.
