# Excel reviewed landed-cost allocation — architecture decision

Owner: Dean Fiedler. Date: 14 October 2026. Status: user-authorised synthetic implementation; independent and operational acceptance open. Scope: BC-04 / PPO-010 / EST-04/05/07/08 / XI-04/06/07/08. Continues reviewed FX PR #488.

## Choice and constraints

Reuse the Excel source-pricing comparison and atomic successor, independently reviewed Cost Source revisions, exact bigint arithmetic and native source bindings. Optional immutable landed evidence accompanies each affected binding; the full reviewed charge document stays in existing Excel pricing evidence. Add no service, dependency, capability, seed or identity type. Preserve all old payloads/hashes and source bytes. Alternatives rejected: silently embedding charges in supplier tiers; adding separate cost lines and thereby duplicating freight; changing the native money precision; rounding away allocation residuals; a separate pricing command or mutable charge registry.

## Explicit synthetic policy

`SYN-EST-LANDED-01` accepts authored nonnegative AUD freight/duty amounts, date and evidence, stable charge IDs and exact selected Product line IDs. There are at most 20 charges and 2,000 total charge-line memberships within the existing 256 KiB request limit. Unit basis extends the stated amount by each target quantity; Line basis addresses exactly one line; Shipment basis allocates one total by Equal, Quantity or BaseCost weights. Quantity weights require identical units; BaseCost weights require a positive total. Shipment cents use largest remainder, with lexical stable line ID as the tie-break. Each charge and the overall allocation reconcile exactly. Foreign goods use the previously reviewed FX conversion first; foreign freight/duty, percentage duty, tax and customs formulas are not inferred.

Add allocated cents to the rounded base line extension. Derive the nearest two-place AUD unit cost, then require its native quantity extension to equal the desired landed extension exactly. Unrepresentable allocations are refused with a precision explanation; no cents are discarded. Existing cost-not-above-sell, quantity, unit-price and whole-estimate limits remain. Sell and customer wording are unchanged.

## Review and preservation

The request explicitly confirms charges are excluded from the supplier/base costs and other estimate lines. Positive standalone Freight lines are refused; duplicate charge IDs and duplicate kind/evidence references are refused. This is bounded protection plus a recorded human assertion, not automatic detection of undisclosed costs embedded in source prices. The review shows workbook/current/base/allocated/landed values, charge evidence, before/after margins and allocation totals.

Applying recalculates from the exact reviewed supplier bases, never from previously landed costs. Every currently landed line must be selected together for a new pricing comparison, allowing deliberate replacement/removal of all current allocations. Legacy native refresh refuses landed bindings. Re-import preserves unchanged kept bindings and their original allocation evidence, drops changed/replaced bindings (including Product category changes) visibly, and never redistributes historical shipment charges. A subsequent reallocation requires a fresh complete comparison. Repeated accepted operations recover originals under current authority.

Migration 0100 adds nullable binding evidence and guards while preserving populated 0099, old source/FX data, ledgers and grants. Read live definitions before amendments. Validate independent reference arithmetic, deliberate refusal/rollback, stale/concurrent/replayed commands, re-import, private quotation outputs, 500-line capacity, populated/historical upgrades and real app/PostgreSQL restarts. Native controls and operational allocation/accounting policies remain separate.
