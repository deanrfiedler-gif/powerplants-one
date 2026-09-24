# Native cost-source review and controlled refresh

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Status: implementation and verification in progress; owner acceptance and deployment pending. This is one dependency increment in the [native Estimating programme](estimating-programme-handover.md), not completion of ES-01–ES-10 or Excel import.

## Delivered source

The [contract](../contracts/estimating-cost-sources.md) and [decision](../decisions/estimating-cost-sources-native.md) implement authored synthetic AUD excluding-tax sources, immutable revisions/review events, a separate local reviewer and deliberate exact estimate successors. Routes are `/estimating/cost-sources`, `/new`, `/[id]` and `/estimating/estimates/[id]/sources`. The Estimating menu and saved-estimate link make each reachable. Detailed native page information covers fields, states, authority, recovery and downstream boundaries.

Source review is independent of authorship and separate from estimate/quote approval. Unknown expiry stays explicit; historical prices and Draft quote bytes are retained. No operational pricing, live supplier/ERP/document connection, customer message, rule adoption or deployment is introduced. Excel import and formal estimate review follow separately.

The additive source migration is 0045 against main's then-current 0044. Equipment, Engineering and Sales have concurrent migrations; this is not a reserved number. The source branch starts from workload PR #301 and must incorporate its final parent plus current-main changes before integration. Source permissions regenerate AD-01 into the stable working `access-review.html`; issued r01 remains unchanged. All 78 parent requirements remain intact.

## Executed proof and limits

- Five focused source-validation/tier and migration-registry unit cases passed before final UI integration.
- Three source database cases passed against a separate synthetic database restored from the existing seeded 0044 environment, then migrated and seeded through 0045. They cover immutable source/review history, independent/scoped authority and revocation, exact/different-payload replay, source/estimate conflicts, typed inheritance/drop rules, historical estimate/quote preservation, customer-safe projection, late binding rejection and rollback after an injected binding failure.
- The standard fresh-reset source suite did not reach its cases locally: the pre-existing site-timezone seed exceeded its unchanged 10-second statement timeout. The same failure was observed using unchanged main database/seed code; other concurrent root changes were limited to fertigation runtime files, so this is not represented as a fully clean main checkout. The preseeded proof is a current-schema upgrade/service check, not a substitute for fresh-reset or cross-0026 upgrade CI.
- Typecheck and focused lint passed during implementation. AD-01 model checks passed at 88 capabilities; its browser checks passed 40 groups before final LF regeneration. Final source-hash verification remains to be rerun.
- Native build, HTTP, browser, cross-0026 upgrade, fresh-reset CI, retained paired visual evidence and final documentation checks are in progress. No unexecuted check is reported as passing.

## Presentation and review

Stable scope ES-03 retains the supplier-pricing r01 HTML and original desktop comparison image. Native register, source evidence/form and estimate comparison adapt those tasks to the current PPO shell. Shared Button/ButtonLink, Field/SelectField, ValidationFields/ErrorNotice, semantic tokens, guide and original-operation recovery are reused. The first bounded implementation has no connected catalogue, FX/landed pricing or approval thresholds; these departures remain visible before baseline adoption. Owner paired review, physical-device/assistive-technology acceptance and deployment are separate.
