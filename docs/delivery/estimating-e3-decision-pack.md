---
document_id: PPO-010-E3-READY
revision: r01
date: 2026-09-14
owner: Dean Fiedler - prototype owner
status: Concrete next-increment choices prepared; pricing and approval policy unresolved
source_commit: 3a27728c2c41e366a4863683fac748cd0d1da910
---

# E3 source, arithmetic and review decisions

Audit task 8 follows the exact manual-cost receiving basis in [#173](https://github.com/deanrfiedler-gif/powerplants-one/pull/173). [BP-04](../blueprints/BP-04-estimating-quotation.md), the [E1 contract](../contracts/estimating-e1.md), [delivery sequence](estimating-implementation-plan.md), [derived-routing decisions](../decisions/estimating-derived-routing.md) and [container propositions](../decisions/estimating-container-propositions.md) govern the distinctions below. This package supplies concrete choices and test examples; it adopts no operational formula, threshold, terms set or approval role.

## Recommended first slice

Start with versioned, manually entered synthetic price-source records and deliberate refresh comparisons. Keep the current AUD, excluding-tax, scaled-integer manual arithmetic. A line would retain source UUID/version, source/effective dates, unit/currency, selected quantity and its saved manual price alongside the exact cost-version/Discovery basis. Refresh would preview old/new source references and totals, then create a reviewed successor using an original command receipt. Editing a source would never reprice an existing estimate or stored Draft.

This slice can be specified without choosing FX, landed-cost allocation, numerical approval thresholds or automatic routing. Those features need the choices below before their engine or approval commands are implemented. Existing source/date strings and all schema-1/2 hashes remain historical evidence; a migration must not fabricate typed source records for them.

| Decision | Recommended prototype choice to review | Alternative and consequence | Required acceptance example |
|---|---|---|---|
| Price sources | Manually authored synthetic supplier/rate versions, each with explicit provenance and effective date; refresh only by comparison | Connected catalogue requires verified tenant/entity keys, permissions, completeness, failure and original-operation recovery contracts | Save source r1 at AUD 10.00; save estimate; create source r2 at 12.00. Original remains 10.00 until explicit successor adoption |
| FX direction and rounding | Store an explicit source-currency-to-AUD rate, date, rate-source version and rounding stage in each new cost snapshot | Rounded converted unit price can differ from rounding the extended amount; neither is implied by existing E1 arithmetic | USD 1.01 × quantity 3 × rate 1.5 AUD/USD gives AUD 4.545 before rounding. Rounding each converted unit gives 4.56; rounding the extension gives 4.55. Select the intended convention explicitly |
| Landed-cost allocation | Explicit allocation pool and method, with per-line allocations conserving the pool; keep standalone freight distinct | Equal quantity, source value, weight and volume allocations differ. Required weights/volumes must be known before those methods apply | A fictional AUD 10.00 pool over three equal-weight eligible lines must conserve exactly 10.00; choose and record which stable line receives the residual cent |
| Pricing outcomes | Preserve separate below-cost block, below-minimum review and below-target advisory concepts from BP-04; configure no numbers until supplied | One generic warning loses the three distinct outcomes. An arbitrary demonstration threshold would invent policy | Supply boundary cases at, one representable unit below and one above each chosen threshold, including zero cost and excluded lines |
| Review authority | Separate scoped reviewer capability and explicit self-review rule, bound to an immutable estimate and policy version | Allowing any editor to approve would change the documented separation of duties | Name the synthetic author/reviewer identities, whether one may self-review, and what happens after source/price/scope changes or permission revocation |
| Unknown values | Decide explicitly whether a future schema permits owned unknowns and incomplete totals | Existing E1/E2 cost versions require complete manual numerical lines. Adding nulls changes schema, arithmetic, UI and review eligibility | Known subtotal plus an unresolved line stays visibly incomplete; zero remains an actual entered amount |

These arithmetic examples are fictional test oracles for choosing a convention. They are not CREMS parity evidence, exchange-rate observations, commercial advice or policy defaults.

## Routing remains separate

DR-03 asks which signals use presence versus magnitude. DR-04 needs calibrated ambiguous-band boundaries. DR-05 asks whether route-aware terms must be resolved before issue. DR-06 asks whether automatic confirmation is acceptable. None is settled by adding price-source provenance. Keep routing **Not configured** until its selected signals, reference cases and confirmation authority are adopted. Preserve the five EC-D01–EC-D05 container propositions as individual open decisions; approving one does not adopt the others.

## Reviewable implementation and proof boundary

The first PR should contain an ADR before any representation choice, an additive source/version contract, preview and reasoned refresh command, current all-target permissions, immutable cost-source bindings, and source/history UI. Reserve its migration only after the E2 stack's actual registry is integrated. Recheck current authority before source labels, historical cost details and original receipts; revoke access independently in tests. Two competing refreshes, altered same-key input, changed source version, interrupted accepted response and final audit/receipt/outbox failure must preserve one original result or roll back completely.

Retain exact pre-upgrade E1/E2 UUIDs, command hashes, manual prices, source strings and Draft HTML/PDF across migration, reseed and real application/database restart. Customer-safe output must exclude internal source prices, FX, allocation and margin evidence. No estimate approval, quote issue, customer communication or ERP write should be inferred from the first source-refresh slice.

The next owner input for broader E3 is concrete: select the FX rounding stage and landed-cost method, supply the three pricing boundaries, and name the synthetic review/self-review rule. The current repository provides none of those answers. The manual-source slice above is the proposed way to progress while those choices remain open.
