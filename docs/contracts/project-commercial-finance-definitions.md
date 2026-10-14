# Project commercial Finance definitions

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Prepared: 14 October 2026. Status: implemented synthetic definition contract supporting PJ-05; operational Finance policy and independent review remain open under D-017.

Scope: FN-06 foundation / FD-08, FIN-05/FIN-06/FIN-07/FIN-08 and PRJ-05. These are local measure keys and do not replace parent requirements. [Commercial contract](project-commercial-controls.md).

## Basis and representation

The first implementation reports one Project, one approved original commercial basis and one AUD/excluding-tax amount basis at a consistent server-observed time. Source is the exact synthetic quotation and approved PJ-05 decisions. No live ERP source, recognised revenue, entitlement, tax outcome or cash result is inferred.

Input money uses canonical signed decimal strings with at most two decimal places and an explicitly enforced bound. Persist in exact numeric/minor-unit form; calculate using integer cents or equivalent exact decimal arithmetic. Reject extra precision rather than round without a rule. Return canonical two-decimal strings. Null means unknown; 0.00 is an explicit reviewed zero. Do not parse monetary totals through floating-point arithmetic.

The original value must reconcile to the exact issued quotation's retained safe snapshot, including its original selected lines. It must not use the estimate sell total when the quote selected a different scope, nor the opportunity value. Retain the quote's stated currency/tax basis and refuse unsupported/missing bases.

## Measure definitions

| Local key | Meaning and inclusion | Exclusions / completeness |
|---|---|---|
| original_control_value | Exact original quotation value adopted by the independently approved commercial basis | Draft/unapproved basis is unavailable; no Deal value or latest-estimate substitution |
| approved_change_value | Signed sum of each independently approved variation's exact frozen priced amount, once per approved variation identity | Pending, rejected, disputed and withdrawn proposals excluded; approved adjustments add their own signed delta without removing originals |
| adjusted_control_value | original_control_value + approved_change_value on that same definition/currency/tax basis | A project control value, not accounting revenue, billings, receivable or cash; suppress if required evidence is unavailable or changed |
| requested_pending | Latest requested amounts of unresolved, non-disputed Requested/Assessed/Submitted variations | Unknown requested amounts make the group's complete total null; never add this to priced_pending |
| priced_pending | Latest priced amounts of unresolved, non-disputed Assessed/Submitted variations | Alternative valuation of overlapping proposals, not an additional exposure to sum with requested_pending |
| disputed | Latest priced amount of each still-disputed proposal, with requested amount in the breakdown | Excluded from approved changes. Subsequent revision remains visibly previously disputed until independently resolved; do not silently remove dispute evidence |
| breakdown | Each variation's current state, exact version, predecessor and both amounts, including rejected and withdrawn records | No contribution to approved or unresolved exposure totals |
| billed_value / cash_received / open_receivable | Unavailable: requires authoritative Finance/ERP transactions and separate agreed definitions | Never derive from approved commercial value, a quotation acceptance, a notice or a synthetic Finance handoff |
| posted_cost / open_commitment / forecast_cost / margin | Unavailable in this increment | FD-05/06/07/09 and their non-overlap, cutoff, currency and denominator policies remain separate |

The API identifies this definition as `PJ05-FD08`, version 1. `requested_pending`, `priced_pending` and `disputed` are objects with `value`, `known_subtotal` and `completeness`; the full-register `breakdown` identifies each included or excluded variation and its state. State-specific grouping can be reproduced from that breakdown; no additional status-count endpoint is supplied.

No single "total exposure" combines requested and priced values or assumes every open request will be approved. No probability weighting, FX conversion, tax addition, margin or accounting accrual is supplied.

## Source validity, completeness and time

Each projection returns definition key/version, Project and approved basis identity, currency, tax basis, observed_at, source identities visible to the caller, source-validity state and completeness separately. Computations cover the full relevant Project register, not the current page. Every included variation is identified in a permitted reconciliation breakdown so the result can be independently reproduced.

An empty fully accessible approved-change register produces 0.00. A missing original basis or unreadable required evidence produces null plus an explicit safe reason. A group containing unknown amounts returns null for its full total; an optional known subtotal must be labelled incomplete and cannot be promoted to the total. Restricted records do not disclose identity, value or numeric restricted counts.

When an original source changes after approval, retain historical approved amounts and decision facts under current authority. Mark the current projection Held/Changed and suppress a current adjusted total until a separately controlled reconciliation exists. Never retroactively erase an approved event or silently adopt newer source bytes. Historical source status and current applicability are distinct.

The first endpoint reports current recorded state at the server-observed snapshot only. It makes no historical "as of" claim. Explicit date-only obligations preserve the entered date and reason; no statutory or contract deadline calculation is implied. Notice occurrence is staff-reported evidence, separate from server recording time and actual delivery verification.

## Independent reconciliation fixtures

All examples are synthetic AUD excluding tax. Expected values below are fixed fixtures, not generated by the implementation under test.

| Example | Inputs | Required result |
|---|---|---|
| Separate stages | Original 100000.00; approved +12000.00; requested +7000.00 later priced +6500.00 and Submitted; Disputed +3000.00 | Approved change 12000.00; adjusted control 112000.00; pending requested 7000.00; pending priced 6500.00; disputed 3000.00. No sum of the two pending measures. |
| Approved adjustment | Prior example plus separately approved -2000.00 adjustment linked to the +12000.00 original | Approved change 10000.00; adjusted control 110000.00; original +12000.00 event remains unchanged |
| Exact cents | Original 10.01; approved +0.10 and -0.03 | Approved change 0.07; adjusted control 10.08 |
| Unknown versus zero | One pending requested amount null and another explicit 0.00 | Complete pending total null; known subtotal 0.00 labelled incomplete; never display a verified zero |
| No approvals | Approved original 100000.00, only pending and rejected proposals | Approved change 0.00; adjusted control 100000.00 when source and scope are complete |
| Superseded source | Approved original source gains an exact successor after approval | Retained historical original/decision unchanged; source Changed; current adjusted control null with reconciliation needed |
| Restricted source | Caller retains Project read but loses required commercial/source authority | No commercial data if root authority is lost; otherwise permitted partial facts only with affected total null; no hidden identity/count/value |
| Different quote selection | Exact quote includes only 80000.00 of a 100000.00 estimate | Original control value 80000.00; estimate total cannot replace it |

## Future Finance work

Before operative financial results, Finance must settle source field mappings, currency/tax/sign treatment, authoritative transaction states, reversal/application policy, cutoff/freshness, tolerances, accounting definitions and approval responsibilities. The prototype contract can be implemented and tested with synthetic evidence while these operational decisions remain open. The endpoint must continue to say Synthetic and must not claim D-017 resolved.
