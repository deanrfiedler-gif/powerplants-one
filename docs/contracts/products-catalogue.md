# Native Products catalogue contract

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Implementation under [ADR-0048](../decisions/ADR-0048-products-native-catalogue.md); review and operational allocation pending. Scope PD-01–05, retaining CRM-08, DOC-01/02, ENG-02–06, EST-02–08, NFR-05, SCM-02/03/08 and IF-02/06/10/12/14. Synthetic prototype only.

## Identity, evidence and authority

Product is a shared capability within the existing seven domains. `ppo.products` holds UUID identity, company/provider/entity key, separate SYN- demonstration alias, Family/Model/Variant kind and exact parent. Family has no parent; Model has a same-company Family; Variant has a same-company Model. Names are searchable labels, never merge keys. No production reference prefix is allocated. The aggregate version serialises commands; catalogue revision and explicit technical/source revision are independent.

`product_revisions` contains immutable validated technical snapshots, hash, predecessor, author, reason and timestamps. Typed attributes use the bounded voltage/V, power/kW, flow/L/min, pressure/kPa, length/mm, mass/kg and interface/text vocabulary. No unit conversion occurs. Unknown attributes require an Unresolved state and clarification owner. SourceReported and Reviewed are attributable source-evidence descriptions, not installation approval. Document provider/entity/revision/type, applicability, basis and source date remain explicit. No arbitrary document URL or SharePoint write is exposed. Source references are synthetic metadata, not connected document downloads.

`product_events` retains Draft, Submitted, Reviewed, Returned, Published, Withdrawn and exact sidecar-link events. Submitted content is frozen; an independent reviewer records its exact outcome. Publication requires Reviewed, purpose, audience and effective-context date. A later publication names the earlier published revision it supersedes. Effective date is recorded context, not an automatic scheduler. A draft successor retains the previous published basis until explicit publication/withdrawal. Nothing changes saved estimates, quotations, design releases or Assets.

Capabilities are explicit. Seed 52 provides four named local synthetic duties and 22 exact Company A grants under the [completion decision](../decisions/ADR-0048-products-native-catalogue.md#completion-decision--7-october-2026). No existing or hosted user receives new Products authority. `products.read` and existing `shared.read` in company/workspace scope govern technical reads. `products.edit`, `products.review` and `products.publish` separate authoring, independent review and publication. Supplier evidence additionally requires `products.commercial.read` and current ES-03 permissions; mapping requires `products.sources.bind`. Relationships use `products.relationship.edit/review`; imports use `products.import.stage/review/apply`. Import raw evidence also requires an import duty. Actors with only technical read cannot search or receive supplier-commercial fields. Tests additionally create isolated disposable actors. The local identity selector exposes Products reader, author, reviewer and publisher. Job titles and administrator labels grant nothing.

## Native routes and APIs

Pages: `/products`, `/products/[id]`, `/products/publication`, `/products/pricing`, `/products/compatibility`, `/products/import`. Scope IDs remain PD-01–05; the record route supports PD-01. URL filters are q/kind/state/lifecycle; exact detail uses `revision_id`; workspaces use `product_id` or `batch_id`. Pricing also retains `revision_id` from the detail handoff through reload and recovery.

All API routes below start `/api/v1/products`. Authenticated private no-store reads enforce current scope. Commands use schema_version 1, operation_id, reason, strict allowed fields and UUIDs; mutations require expected_version. The existing shared transaction locks workspace/operation, checks current authority before receipt lookup, and writes business data, immutable events, audit, outbox and receipt together. Creation is 201; mutations/replays 200; altered same-operation content or stale versions 409; invalid input 422; inaccessible/missing record 404. Collection denial is 403. A failed read is never an empty success.

| Method/path | Behaviour |
|---|---|
| GET/POST root | Bounded 100-record technical catalogue / create exact identity and Draft r1 |
| GET/POST `/{id}` | Exact selected revision/history / save a full immutable draft successor |
| POST `/{id}/review` | Submit, Reviewed, Returned, Published or Withdrawn against exact revision |
| GET/POST `/{id}/pricing` | Permitted existing CostSource projection / retain typed exact revision mapping |
| GET/POST `/{id}/uses` | Source-permitted retained downstream references / link exact observed Asset or MaterialLine version |
| GET `/{id}/uses/preview?kind=&target_id=` | Authorised owner context and version, no mutation |
| GET/POST `/relationships` | Permitted bounded relationship register / record exact two-revision evidence |
| POST `/relationships/{id}/review` | Independent Conditional, Unresolved or Rejected conclusion, exact content hash |
| GET/POST `/imports` | Permitted source history / stage bounded synthetic JSON and server-computed content hash |
| GET `/imports/{id}` | Retained raw rows, current and prior plans, exceptions, results and operation history |
| POST `/imports/{id}/map` | Immutable mapping/change-set successor; no Product mutation |
| POST `/imports/{id}/review` | Independent Reviewed/Returned or explicit Apply, exact plan/hash/version |

Original receipt recovery uses existing `GET /api/v1/operations/{operation_id}` and rechecks the actor's current domain authority. Browser commands use the shared actor-bound same-tab journal; unknown outcomes hold the exact original request. Recovery reads the original receipt; explicit retry sends the same payload and operation. No offline catalogue is introduced.

## Pricing and downstream use

`product_cost_source_bindings` links exact same-company Product and CostSource revisions; content remains in ES-03. Mapped requires exact unit equality. Unresolved mappings retain mismatch evidence without claiming readiness. ES-03 owns source authoring, independent review, precision, tier selection, validity and deliberate estimate refresh. UI shows record currency/tax, known/unknown/expired validity and owner-authorised affected estimates. It totals no mixed currencies. Native AUD/ExcludingTax is a contract restriction; FX, freight, landed cost, tax, unit conversion, live feeds and thresholds remain Not configured.

`product_use_references` retains exact Product revision plus an Asset or Engineering MaterialLine identity, observed version and source-permitted snapshot. It never rewrites the owning record. Owner reads are rechecked; hidden uses are not returned, and a limited visible list does not assert complete/no impact. Changed owner version requires reassessment. CostSource-derived estimate uses retain ES-03 authority and exact saved version links. Engineering Materials/Substitutions and Change Impact own application suitability/release; Equipment Lifecycle/Bulletins own installed impact. Catalogue relationship criteria must name evidence and an owner; Unknown or NotMet cannot become Conditional. CandidateReplacement never becomes a universal compatible/drop-in conclusion. An immutable relationship successor retains its predecessor.

## Staged import

Only `PPO synthetic catalogue 1` JSON is supported, up to 50 rows and 12,000 UTF-8 bytes within the shared journal/request bounds. The downloadable public fixture contains only fictional format guidance. The original source text/hash, filename/description, observed time when supplied, provider/company, row numbers and values are retained. Row keys are external_key, optional company_id/provider, kind, parent_id, reference and content. Unrecognised compatibility/replacement claims are invalid. Mandatory model/variant, source and units follow normal content validation.

Every row requires Resolve, New or Exclude with a rationale. Resolve requires one exact provider/company/entity key and explicit target ID. Unknown keys require explicit New or Exclude. Similar labels/models retain duplicate candidates but never auto-merge. Duplicate keys/rows, conflicting contexts/targets, submitted targets, unsupported units and missing evidence remain exceptions. Exclusion retains original evidence. Immutable plans retain parsed values, mapping, errors/warnings, target version/revision, exact before/after, proposed new UUID and comparison hash. Review/application refuses unresolved errors or an empty change set.

Independent review binds the exact plan. Application rechecks every expected target version and inserts all new products/draft successors plus batch result in one transaction. It cannot publish. An applied batch is terminal; identical content under the same provider/company cannot be staged as another effect. The original receipt remains authoritative under replay. A failed second row rolls back earlier rows, events and receipts. Correcting returned mappings creates another plan; reviewed content is not edited.

## Evidence and limits

PD-01 derives from Products r04; PD-03 derives from Supplier Pricing r01 with native ES-03 as the runtime boundary. PD-02/04/05 have no dedicated accepted HTML; their native forms/queues/comparisons are proposed house compositions. See the [handover](../delivery/products-native-handover.md) and [executed evidence](../testing/evidence/products-native/README.md). Test success, visual inspection, owner acceptance and deployment remain separate. General AD-03/AD-05, production formats, business-access allocation and stock observations are not implemented by this package.
