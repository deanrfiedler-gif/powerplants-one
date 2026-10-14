# Excel reviewed FX conversion — architecture decision

Owner: Dean Fiedler. Date: 14 October 2026. Status: user-authorised synthetic implementation; independent and operational acceptance open. Scope: BC-04 / PPO-010 / EST-04/05/07/08 / XI-04/06/07/08. Continues managed pricing PR #487.

## Choice and constraints

Reuse immutable native Cost Source revisions, independent source review, existing PostgreSQL guards, exact-integer arithmetic and the Excel pricing successor. Store an optional foreign-price/rate evidence document inside a new source revision. Its original supplier currency and tier prices are retained; the source's receiving currency and derived tiers remain AUD. Review covers the foreign prices, rate, dates, evidence and conversion policy together. No second rate registry, external feed, dependency, framework, grant or seed is needed. Separate rate governance and operational currency policy remain open. Alternatives rejected: replacing workbook values on upload; silently obtaining a current market rate; adding an unreviewed rate directly to an estimate; duplicating source approval; or rounding with binary floats.

## Explicit synthetic arithmetic

`SYN-EST-FX-01` records a rate as AUD per one unit of the foreign currency; inversion and cross rates are refused. The bounded original currencies are USD, EUR, GBP, NZD, CAD and CNY. This finite synthetic profile is not an operational currency policy. Original unit prices have up to six decimal places and range from zero through 1,000,000; rates have up to six places and range from 0.000001 through 1,000,000. Rates are never fetched or inferred. Each source has one rate/date/evidence snapshot shared by its 1–20 original quantity tiers.

Multiply original unit price by the rate using scaled integers. Round HALF_UP once to AUD cents; reject a result above the existing 1,000,000 AUD unit-price limit. The native estimate then multiplies that rounded AUD unit cost by the saved three-place quantity and rounds the line extension HALF_UP to cents. This unit-first sequence deliberately matches the native cost-line contract; it is not whole-line FX conversion. Tests retain independent expected values at ties, just below/above ties, fractional quantity, explicit zero and overflow.

Rate date, effective start and expiry are required date-only values, with rate date no later than the effective start and expiry no earlier than it. The selected pricing date must satisfy both source and rate validity. Unknown rate expiry is refused. Changing rate, evidence or original price produces a new independently reviewed source revision, never a background refresh. Existing AUD revisions, hashes and command receipts retain their original shapes.

## Review, save and boundaries

A read-only scoped preview calculates the AUD tiers. Creation retains a Draft; independent Reviewed decisions must include the exact FX review hash, preventing legacy review controls from accepting unseen evidence. The source identity cannot switch between domestic and FX profiles or change original currency. The existing native generic source-refresh command refuses FX; the Excel comparison explicitly exposes each selected foreign tier and deduplicated full conversion evidence. Exact review confirmation saves the existing atomic successor and bindings. Re-import, quotation and accepted-operation recovery preserve originals and do not recalculate old accepted results.

Migration 0099 adds guards for conversion arithmetic, immutable currency/profile identity, independent exact review evidence, rate validity on bindings and exact Excel conversion snapshots. Existing tables/records, ledger checksums and grants remain unchanged. The migration registry, historical upgrade expectations and hosted-demo review gate advance together. Prove populated 0098 preservation, historical upgrades, atomic refusal/rollback, stale review, replay, revoked access, compiled APIs, 500-line receiving and real process restart recovery.

Native FX authoring/review controls, non-AUD workbook templates, landed costs, live supplier/ERP feeds, tax/hedging/accounting policy, business acceptance and deployment remain separate. Original workbooks and all prior quotes are unchanged.
