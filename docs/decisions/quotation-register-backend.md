# Quotation register backend

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Date: 12 October 2026. Status: bounded synthetic backend authorised by Dean's instruction to proceed; review, page implementation, owner acceptance and deployment remain separate.

Traceability: BC-01, PPO-010, EST-03/07/08/09, ES-05/06/07, AT-01/03/26/36. Sources: [accepted Quotations design](quotations-design.md), native release/response/conversion services and [backend plan](../delivery/backend-completion-plan.md). Preserve all parent IDs and issued references.

## Decision and boundaries

Add `GET /api/v1/estimating/quotations` and `GET /api/v1/estimating/quotations/[id]`, where `[id]` is the stable quotation ID. Existing `/quotes/[id]` APIs continue to identify an exact revision. The collection returns one row per quotation at its actual current revision; the detail returns a bounded revision history and exact links to existing native workflows. The old navigation landing and page remain compatible.

Reuse TypeScript/Next/PostgreSQL, the workspace lock and native release, response and conversion authority. There is no new technology, migration, seed, capability, stored queue or command. A stored lifecycle would duplicate event authority; a client-side join would fragment permission and pagination semantics. The selected read projection derives facts inside one serialized request. No provider, transaction, send, approval or conversion is performed by a read.

Read permissions remain `estimating.read` and `estimating.quote.read`, including exact saved source and captured recipient checks. Each historical revision is checked independently; an inaccessible latest revision never falls back to an older row. A denied historical revision is omitted with partial status and no hidden identity/count. Conversion facts additionally require native `conversionScope` (including Supply target access). When that scope is unavailable, keep the permitted quotation summary but return `stage: null`, an explicit unavailable conversion source and a partial lifecycle. Never infer that it is unconverted. The existence of a conversion is not disclosed through this refusal.

## Display contract

Each row carries quotation/revision/estimate IDs, revision number, reference, frozen title/customer/site/contact and quoted total/currency/tax basis, current estimate owner and exact native links. Internal cost lines, source evidence, recipient addresses, manifests/storage paths, response text and conversion targets are not register fields. The history adds minimal attributable events (ID, action/outcome, actor and recorded time); the owning native detail remains the evidence reader.

The stage precedence for a fully readable revision is:

1. No release preparation: Draft.
2. Prepared but unissued: HeldBasisChanged when the native release is no longer current; otherwise Returned, ApprovedNotIssued or AwaitingApproval from its decision.
3. Issued: Converted when this exact revision has a recorded execution; otherwise DeliveryUnknown for its latest Unknown distribution; otherwise the latest reported Accepted/Declined/Clarification/Negotiation outcome; otherwise IssuedNoResponse.

Render state, source-current status, distribution outcome and response holds remain separate facts. Rendering pending/failed does not invent approval eligibility. A later source change cannot erase an issue or conversion. An earlier converted revision cannot label a newer Draft as Converted. A reported acceptance with outstanding response holds is not ready for receiving. Needs attention includes these explicit holds even where the primary stage is Accepted or Converted. This precedence resolves overlapping display facts for the backend; it grants no commercial policy or new UI baseline.

## Windows and filters

Allowlisted collection queries: literal `q` (100 characters), `owner_id`, `customer_id`, `view` (all/mine/needs_attention), `stage`, `sort` (updated_desc/updated_asc/reference_asc), `offset` and `limit` (1-25). Default scope is all time. Owner means current estimate owner. Customer filtering uses the retained release recipient when present, otherwise the originating opportunity. The stable server sort is by the quotation header's recorded revision update time or reference, then quotation ID. `updated_basis: QuotationRevision` makes clear that this timestamp does not claim to be the most recent response, render attempt or conversion; those retain their own times.

Search/owner/customer filters and ordering select a quotation candidate window directly, without a 100-estimate ceiling. Current source authorization and lifecycle derivation follow; view/stage filters apply within that window. Counts describe only authorised rows in the current candidate window before view/stage selection. Stage counts exclude unavailable lifecycles and expose a separate unknown-stage count. Empty filtered/partial windows retain continuation. Counts are not global menu totals. Offset windows are live reads, not a frozen export.

The history endpoint accepts only offset/limit, newest revision first. It returns the exact latest summary plus visible revisions in that window, with separate complete/partial status. No raw inaccessible revision count is returned. Access is rechecked before publishing results; later native reads/commands start fresh.

## Verification and remaining work

Executed checks and their limits are recorded in the [backend evidence](../testing/evidence/quotation-register/README.md).

Use native fixtures to prove Draft/preparation/render/return/approval/issue/distribution/response/conversion, current versus historical identity, changed sources, immutable original output and read-only receipts/audit counts. Prove query boundaries, literal search, stable candidate windows, filtered continuation, company/source/recipient/Supply denial, unknown conversion stages and current-authority rechecks. Run compiled authenticated HTTP for both routes and existing ES-05/06/07 regression cases relevant to the projection.

The accepted page, shared shell, export, selection and global menu counts remain separate work. The new API is a backend receiving contract, not application-page or business acceptance. No new review fingerprint is recorded.
