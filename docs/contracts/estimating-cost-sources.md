# Native synthetic cost sources and estimate refresh

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Implementation contract under the [native programme](../decisions/estimating-native-programme.md); owner acceptance and commercial policy remain separate. Traceability: PPO-010, EST-01/04/05/07, ES-03, ADR-0027 and BP-04.

## Evidence and authority

Sources are authored synthetic evidence, not imported supplier catalogues. A source has an aggregate UUID, local SYN- reference, fixed company/owner and fixed supplier/entity/item/unit identity. Source header version, immutable revision UUID/number/hash, review event UUID and estimate cost-version UUID are separate identities. A source change never writes an estimate. Schema-1/2 estimate JSON, old source strings and hashes remain unchanged.

Current company-scoped `shared.read` and `estimating.read` govern internal source reads. Revision/submit require the source owner and `estimating.edit`. An explicit `estimating.source.review` grant and a different source author govern evidence review; editor/admin labels imply no review. The local synthetic reviewer has read and source-review grants only in company A. No hosted profile gains a review duty. Receipt recovery repeats current source/estimate authority checks before returning an original result.

## Native API

All paths below start `/api/v1/estimating`. Reads return no-store data. Commands use the existing origin, identity, schema, UUID, reason, payload hash, receipt and audit conventions. New source creation returns 201; mutations and exact replay return 200; altered same-operation input returns 409. Denied reads do not include evidence.

| Method and path | Contract |
|---|---|
| GET `/cost-sources?q=&state=` | Literal case-insensitive reference/title/supplier/item search, strict state filter, latest 100 permitted sources, exact latest 50 reviewed revisions per source and permitted create-company choices. Omit empty filters. |
| POST `/cost-sources` | `id`, `company_id`, local `reference`, full `content`, common operation/reason. Creates Draft r1 and one event atomically. |
| GET `/cost-sources/[id]?revision_id=` | Exact selected or current immutable evidence, revision/event history, authority-dependent actions and up to 100 permitted estimate-line bindings. |
| POST `/cost-sources/[id]` | `expected_version`, complete successor `content`, common operation/reason. Fixed identity cannot change; Submitted source is frozen. Identical content is refused. |
| POST `/cost-sources/[id]/review` | `expected_version`, exact `revision_id`, action `Submit`, `Reviewed`, `Returned` or `Rejected`, common operation/reason. Only Submitted can receive an independent decision. |
| POST `/estimates/[id]/source-refresh/preview` | Exact `estimate_version_id`, explicit `pricing_date`, 1–100 distinct `selections` with line/source/revision IDs and expected source header versions. Returns before/after totals, changed lines, exact bindings and comparison hash; writes no receipt or business record. |
| POST `/estimates/[id]/source-refresh` | Exact proposal from preview, `expected_version`, `comparison_hash`, `reviewed: true`, common operation/reason. Recomputes the comparison and atomically saves one estimate successor, typed bindings, preserved discovery/specialist lineage, audit and receipt. |

Content includes title, supplier label and optional explicit external company/entity key, item reference, exact unit, AUD, ExcludingTax, Synthetic, source/effective dates, optional known validity end, evidence reference/text and 1–20 increasing quantity tiers. Prices use the current scaled-integer two-decimal monetary bounds and quantities three decimals. Blank is unknown; zero must be explicit. FX, landed allocation, unit conversions, catalogue connections and approval thresholds are Not configured.

The selected tier is the highest minimum quantity not exceeding the saved quantity. Units must match exactly; the explicit pricing date must meet the effective date and known expiry. Unknown expiry yields an explicit warning, not perpetual validity. The existing estimate rule refuses cost above sell; no sell price is automatically changed. Source review is evidence review, not estimate or quote approval.

## Immutable lineage and concurrency

The refresh checks current editable estimate header/version/hash and every exact source header/revision/review. A discovery-bound estimate must still be based on the selected current Complete discovery revision and unchanged prepared context. Previously reviewed source revisions remain available as deliberate historical choices with a fresh header-version check; a later source draft is never silently selected.

`estimate_cost_source_bindings` is an immutable sidecar for the exact newly inserted cost version and line. Its database trigger requires the estimate version to be created in the same transaction and verifies reviewed evidence, exact unit/tier/date/cost and source label. It cannot append invented provenance to an old estimate. Ordinary successors inherit a binding only while quantity, unit, cost, source and source date remain identical. Changing one drops the binding on that successor and retains the historical record. Existing quotation customer-safe projections receive no cost-source sidecars or private evidence.

Migration 0045 adds the source/revision/event/binding tables and guards, extends identity/audit/outbox/capability registries and uses immediate/deferred identity constraints around the identity ALTER. There is no legacy free-text backfill. Seed 45 adds one explicitly local synthetic reviewer and three grants; exact upgrade registry/grant/user consumers are updated. Reconcile numbering against actually integrated main before merge.

## Recovery and user contract

Unsaved inputs live in memory. A pending command uses the existing actor-bound same-tab journal with its exact bounded synthetic payload; acceptance retains only an operation pointer. A lost response displays Outcome unknown and blocks a new command. Reload reads the original receipt; explicit retry sends the same operation/payload. Unknown or inaccessible receipt is not proof of failure. The server transaction and current authority remain authoritative after application/browser/database restart.

Stale source editing preserves entered fields and shows current evidence, with an explicit replace action. Comparison retains its exact previewed proposal; source/estimate changes cause a conflict rather than substitution. Failed or denied reads unmount source evidence and action forms. History links retain exact revision/version query parameters. This workflow has no offline catalogue, customer message, quote approval/issue, live ERP or SharePoint operation.

See [delivery and executed verification](../delivery/estimating-cost-sources-handover.md) and the [architecture decision](../decisions/estimating-cost-sources-native.md).
