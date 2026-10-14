# Excel reviewed landed-cost allocation

Owner: Dean Fiedler. Scope: BC-04 / PPO-010 / EST-04/05/07/08 / XI-04/06/07/08. Status: synthetic backend implemented and locally verified; independent review, CI, operational acceptance and deployment remain separate. [Decision and alternatives](../decisions/excel-import-landed-costs.md). [Execution evidence](../testing/evidence/excel-landed-costs/README.md).

## Command and review

The existing `POST /api/v1/estimating/estimates/[id]/excel-source-pricing/preview` and save command accept optional `proposal.landed_costs`. Existing identity, company access, independent Cost Source review, pricing date, source version and 256 KiB transport limit apply. The document contains `policy: SYN-EST-LANDED-01`, `currency: AUD`, `exclusive_cost_basis_confirmed: true` and 1–20 charges (at most 2,000 total target memberships). Each charge has a stable UUID `id`, `kind` Freight/Duty, `basis` Unit/Line/Shipment, nonnegative decimal `amount` through 1,000,000 AUD with at most two places, exact selected Product `line_ids`, `effective_date`, `evidence_reference` and `evidence_excerpt`.

Unit basis extends its amount by each target quantity; all targets have identical units. Line basis requires one target. Shipment basis requires `allocation` Equal, Quantity or BaseCost; other bases omit it. Quantity weights require identical units. BaseCost uses the rounded supplier/FX line extensions and requires a positive total. Evidence cannot postdate the selected pricing date. Foreign goods retain the existing independently reviewed FX conversion; freight/duty amounts in this increment are explicitly AUD. Duty is an authored amount, not a calculated tariff or tax.

The preview includes original workbook values, current prices, exact reviewed base prices, charge amounts/evidence, per-charge target allocation, each line's base/allocated/landed extension, final unit cost and before/after cost, sell and margin. Its exact existing `review_hash` is the save command's `comparison_hash`; `reviewed: true` confirms the full comparison. The existing pricing GET retains this evidence and original operation recovery. A preview does not write records.

## Exact arithmetic

`SYN-EST-LANDED-01` uses bigint/decimal arithmetic. Shipment cents are apportioned by floor of the exact share, then remaining cents go to the largest fractional remainders, tied by stable lexical line ID. Every charge and the total reconcile exactly. Unit charges use native quantity extension with HALF_UP to cents. Allocation is added to the already rounded supplier/FX base line extension. The nearest two-place unit cost is accepted only when the native quantity extension reproduces the exact landed extension; otherwise `LandedPrecisionUnsupported` refuses the operation without saving residuals. Existing cost-not-above-sell and receiving limits remain.

Example: three one-unit products each at AUD 1.01 base plus an AUD 0.10 Equal shipment receive 0.04/0.03/0.03 by stable ID, yielding 1.05/1.04/1.04 and total 3.13. A one-cent addition to a three-unit line cannot be represented by two-place unit costs and is refused. These are tested synthetic rules, not operational customs/accounting policy.

## Duplicate protection and corrections

Charge IDs and case-insensitive kind/evidence references must be unique. Any positive standalone Freight line blocks landed allocation. The explicit exclusion confirmation records that the author has checked supplier/base costs and all other lines; the backend cannot detect undisclosed charges already embedded in free-text/manual prices. No automatic freight-line deletion or sell-price change occurs.

All currently landed lines must be selected together for subsequent Excel pricing. A new comparison always restarts from the independently reviewed supplier bases, so charges do not compound. Fresh explicit charges replace the current allocation; omitting landed costs deliberately removes it from those selected lines, with old evidence visible in the comparison. Generic native refresh refuses landed bindings.

## Persistence, re-import and quotation

Migration 0100 adds nullable immutable `landed` evidence on native source bindings. Historical fields retain their exact values; old records have null evidence and old API payloads omit the new field. Database guards independently reconcile charge allocation, supplier base, final native line cost, accepted pricing evidence and inheritance. The existing atomic pricing successor, receipt, audit and outbox remain the single transaction. Concurrent retries recover one accepted result; stale/changed comparisons and revoked access fail closed.

Unchanged kept lines inherit their exact landed binding and historical allocation; changed category/price/source/date/quantity/unit drops it visibly in the existing re-import comparison. Partial retained shipment evidence is historical, not a new shipment allocation; no residual is silently reassigned. Reallocation requires a fresh complete comparison. Exact Draft quotations retain their AUD sell values and exclude private supplier/FX/charge evidence. Original workbooks, old estimates, source revisions and quotations remain unchanged.

Native controls, foreign charge conversion, weight/volume methods, percentage duty, taxes/customs rules, live feeds, operational policy and deployment remain separate. The 500-line estimate and 1 MiB costing limits remain. Multi-source operational throughput is not established by a single synthetic capacity fixture.
