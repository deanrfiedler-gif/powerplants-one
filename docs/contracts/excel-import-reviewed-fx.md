# Excel reviewed FX conversion

Owner: Dean Fiedler. Scope: BC-04 / PPO-010 / EST-04/05/07/08 / XI-04/06/07/08. Status: synthetic backend implementation; independent acceptance open. [Architecture and arithmetic decision](../decisions/excel-import-reviewed-fx.md).

## Source evidence and review

A new Cost Source can retain `content.fx` alongside derived AUD `content.tiers`. `content.currency` remains the native receiving currency AUD. `fx.currency` is the original supplier currency; allowed bounded choices are USD, EUR, GBP, NZD, CAD and CNY. This is authored synthetic evidence, not a market rate or live supplier feed. Existing workbook templates remain AUD; original workbook bytes and reconciled import values are unchanged.

The FX document requires `policy: SYN-EST-FX-01`, original `currency`, a positive `rate` expressed as AUD per one foreign unit, `rate_date`, `effective_from`, explicit `valid_until`, `evidence_reference`, `evidence_excerpt`, and 1–20 original `tiers` with increasing `minimum_quantity` and `unit_cost`. Foreign prices and rates accept up to six places, stored canonically with six. Prices are 0–1,000,000; rates are 0.000001–1,000,000. Quantities retain the existing positive three-place bounds. Unknown prices or expiry are refused; explicit zero price is allowed.

The server multiplies original price and rate exactly, rounds HALF_UP to AUD cents and refuses converted prices above 1,000,000 AUD. Native line extension then applies the saved quantity to that rounded unit cost and rounds HALF_UP to cents. For example, synthetic USD 0.67 × 1.500000 AUD/USD yields AUD 1.005, stored as AUD 1.01; quantity 1.500 extends to AUD 1.52. Whole-line FX rounding is not used. These are explicit prototype rules, not inferred CREMS or operational accounting rules.

Rate date must be no later than its effective start; expiry must be no earlier than that start. A pricing date must lie within both supplier-source and FX validity intervals. Rate freshness is based on those recorded intervals, not an inferred clock or fetched replacement. A new rate, supplier price or evidence correction creates a new independently reviewed revision. The source cannot switch domestic/FX profile or original currency; create a separate source identity for those changes. Complete FX source content is capped at 28 KiB UTF-8, within the existing database envelope.

## API and confirmation

Paths start `/api/v1/estimating`. Current identity, company access, origin checks and private/no-store responses apply.

| Method/path | Behaviour |
|---|---|
| POST `/cost-sources/fx-preview` | Read-only `{ company_id, content }` calculation. Requires source read/edit authority. Returns canonical source content, derived AUD tiers and exact `fx_review_hash`; no draft, receipt or audit write. Body limit 64 KiB. |
| POST `/cost-sources` | Existing creation command accepts optional `content.fx`; omit derived `tiers` to calculate them, or supply their exact matching values. Saves an owner Draft and original operation receipt. |
| POST `/cost-sources/[id]` | Existing revision command records a correction with current source version and unchanged source identity/profile. No estimate changes. |
| GET `/cost-sources/[id]` | Exact retained foreign/rate evidence and canonical AUD tiers; FX revisions add `fx_review_hash`. Existing revision history and access rules remain. |
| POST `/cost-sources/[id]/review` | Existing Submit/independent review workflow. `Reviewed` on an FX revision additionally requires its exact `fx_review_hash`. Review audit retains that hash, canonical FX document and conversion evidence. |
| POST `/estimates/[id]/excel-source-pricing/preview` | Existing exact source selections now support reviewed FX revisions. Shows original workbook, current AUD, original foreign tier and proposed AUD prices. Full conversion documents are deduplicated by source revision under `comparison.fx_sources`. |
| POST `/estimates/[id]/excel-source-pricing` | Existing exact review confirmation atomically saves one successor and native source bindings, immutable comparison, receipt, audit and outbox. No new save command or receipt family. |

Missing/wrong FX confirmation, unreviewed evidence, expired dates, stale source headers/current estimate, wrong units/company/access and cost above unchanged sell are refused. Legacy generic source refresh refuses FX and directs callers to the Excel comparison; its 100-line contract remains. Excel keeps 500 complete lines, the 1 MiB costing envelope and 256 KiB pricing command body. An accepted original operation recovers its original result under current access, even after later source revisions; a new command requires fresh comparison.

Native FX authoring/review controls are not implemented. The old source review form cannot approve an FX revision without the new exact confirmation. Existing source editing cannot silently discard FX evidence. Backend reads and APIs provide the complete evidence required by future controls.

## Persistence and downstream safety

Migration 0099 adds guards on existing immutable revisions, review events, bindings and Excel pricing evidence. It verifies source profile/currency identity, exact converted tiers, independent review audit, rate validity and exact deduplicated conversion/original-tier snapshots. Historical migrations, rows, hashes, seeds and grants are preserved; no new table, identity type, capability or dependency is needed.

The [managed pricing contract](excel-import-source-pricing.md) continues to govern re-import and quotations. Replaced price/source/date/quantity/unit drops its old binding; explicitly kept unchanged lines retain it. Repricing is a fresh reviewed successor. Draft quotations retain exact current AUD sell values and exclude private rates, foreign prices and supplier evidence. Earlier workbooks, estimates, source revisions and quotation outputs remain unchanged.

[Execution evidence](../testing/evidence/excel-reviewed-fx/README.md) separates local proof, CI and acceptance. Non-AUD workbook templates, live rates, cross/inverse conversion, unit conversion, landed costs, tax/hedging/accounting policy, native controls and deployment remain separate.
