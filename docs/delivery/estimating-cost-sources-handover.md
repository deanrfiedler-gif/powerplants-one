# Native cost-source review and controlled refresh

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Status: implementation and verification in progress; owner acceptance and deployment pending. This is one dependency increment in the [native Estimating programme](estimating-programme-handover.md), not completion of ES-01–ES-10 or Excel import.

## Delivered source

The [contract](../contracts/estimating-cost-sources.md) and [decision](../decisions/estimating-cost-sources-native.md) implement authored synthetic AUD excluding-tax sources, immutable revisions/review events, a separate local reviewer and deliberate exact estimate successors. Routes are `/estimating/cost-sources`, `/new`, `/[id]` and `/estimating/estimates/[id]/sources`. The Estimating menu and saved-estimate link make each reachable. Detailed native page information covers fields, states, authority, recovery and downstream boundaries.

Source review is independent of authorship and separate from estimate/quote approval. Unknown expiry stays explicit; historical prices and Draft quote bytes are retained. No operational pricing, live supplier/ERP/document connection, customer message, rule adoption or deployment is introduced. Excel import and formal estimate review follow separately.

The additive source migration is 0045 against main's then-current 0044. Equipment, Engineering and Sales have concurrent migrations; this is not a reserved number. The source branch is stacked on workload PR #301 parent `7c2ca2b`, including main `9e49a57` and the Projects/fertigation/Service I4 changes. Conflicts retained all unrelated status entries and the updated cost-source rail expectation. Source permissions regenerate AD-01 into the stable working `access-review.html`; issued r01 remains unchanged. All 78 parent requirements remain intact.

## Executed proof and limits

- Ten focused source-validation/tier, migration-registry and navigation unit cases passed.
- Three source database cases passed against a separate synthetic database restored from the existing seeded 0044 environment, then migrated and seeded through 0045. They cover immutable source/review history, independent/scoped authority and revocation, exact/different-payload replay, source/estimate conflicts, typed inheritance/drop rules, historical estimate/quote preservation, customer-safe projection, late binding rejection and rollback after an injected binding failure.
- The standard fresh-reset source suite did not reach its cases locally: the pre-existing site-timezone seed exceeded its unchanged 10-second statement timeout. The same failure was observed using unchanged main database/seed code; other concurrent root changes were limited to fertigation runtime files, so this is not represented as a fully clean main checkout. A later unchanged fresh-reset attempt timed out during DROP SCHEMA before any source case; that specific failure has not been reproduced on a clean main checkout and is not classified as an unrelated regression. The preseeded proof is a current-schema upgrade/service check, not a substitute for fresh-reset or cross-0026 upgrade CI.
- Builds, typecheck and focused lint passed during implementation. AD-01 passed 107 model and 40 pinned Chrome browser groups on working HTML SHA-256 `b880a9e760846e5f81060ca1dc6c88782364eaf131a3e7076ab4feb4d89a2304`, with 88 capabilities. One earlier browser attempt timed out at its first screenshot; the unchanged rerun passed.
- Two direct HTTP cases passed, covering permitted reads/writes, review duty, altered replay, stale versions, scoped concealment, revoked receipt authority, read-only comparison and one recovered successor. Additional revoked historical-read assertions are pending the final rerun.
- Six compiled native browser cases passed across desktop and phone: authoring, unknown response after commit, same-tab reload recovery without duplicate submission, independent review, exact estimate comparison/save, read-only history, search/history/reload, stale-field preservation and explicit replacement, failed reads and denied evidence. Visual inspection found a 200% header overlap; the scoped correction and a negative assertion are in the final rerun.
- The unchanged issued supplier-pricing r01 HTML was independently loaded: its 20 browser groups passed, producing 29 captures for comparison. Its broader FX and allocation demonstrations are not adopted by the bounded native slice.
- Foundation, prototype, naming and development-register checks passed during implementation, preserving 78 parent IDs and the 8,000-character maintained-instruction limit. The integrated parent adds the existing Job Pack component; final source-head checks remain required.
- Final integrated build/browser/HTTP, added return/reject assertions, cross-0026/fresh-reset CI and retained paired visual evidence remain in progress. No unexecuted check is reported as passing.

## Presentation and review

Stable scope ES-03 retains the supplier-pricing r01 HTML and original desktop comparison image. Native register, source evidence/form and estimate comparison adapt those tasks to the current PPO shell. Shared Button/ButtonLink, Field/SelectField, ValidationFields/ErrorNotice, semantic tokens, guide and original-operation recovery are reused. The first bounded implementation has no connected catalogue, FX/landed pricing or approval thresholds; these departures remain visible before baseline adoption. Owner paired review, physical-device/assistive-technology acceptance and deployment are separate.
