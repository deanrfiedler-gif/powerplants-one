# Cost-source register — native design contract

<!-- versioning: git; committed history is authoritative -->

Stable entry: `route:/estimating/cost-sources`. Scope: ES-03, page-register order 049. Owner: Dean Fiedler. Draft for paired visual review; no accepted baseline or deployment claim. Retained source provenance remains `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`.

## Purpose and layout

Backend availability: the additive [Cost sources register API](../../../decisions/cost-source-register-backend.md) supplies first-tier cost, owner/revision-author IDs, review eligibility, supplier/company and menu filters, full permission-scoped search counts and bounded paging. [Functional evidence](../../../testing/evidence/cost-source-register/README.md) is separate from page implementation. Menu counts cover the search/supplier/company basis before view/state/validity filters; the selected result has its own matching count. Expiry uses an explicit Brisbane date. The register now consumes this API in a full-width shared table, secondary menu and phone list with exact snapshot and selection actions. Native detail commands remain compatible; visual review and owner acceptance are pending. No review fingerprint is adopted.

Find current permitted sources by reference, supplier, item or title and explicit source state. r20 page type: Register / worklist. The register opts into shared workspace styles and full-bleed shell layout; the host owns its grid/list scroll and overlapping snapshot. No standalone masthead, second rail or nested viewport is carried from the reference. The native source/editor/comparison route split is a proposed adaptation of the five-view retained design, pending paired owner review.

1. Search literal source text; Apply filters updates the URL.
2. Read current state, revision, effective date and Unknown expiry.
3. Open exact evidence or use New synthetic source where company edit authority permits.
4. Back, Forward and reload retain the chosen URL filters.

## Desktop

Accepted design: the [Cost sources design decision](../../../decisions/cost-sources-design.md) of 11 October 2026, with captures 01–03 in [Cost sources design r01](../../../reference/ui/estimating/cost-sources-design-r01/README.md). It reuses the [Reviews & approvals](../../../decisions/estimate-reviews-design.md) shell and grid. Implementation reuses SecondaryMenuFrame, RegisterTable, RecordTabs and shared buttons. Application comparison is pending; retained captures remain design evidence only.

- **Layout at 1440 × 900:** the labelled 240 px rail with Cost sources selected (white tile, Solid icon, a neutral badge for sources awaiting your review); the breadcrumb "Cost sources" (shell top bar amendment, 16 October 2026) as the page title; a flush 240 px secondary menu; then a 60 px toolbar and a full-bleed grid.
- **Secondary menu:** All sources, Awaiting my review and My sources (owned by you); a State group (Draft, Submitted, Reviewed, Returned, Rejected) and a Validity group (Expiry unknown, Past expiry), with neutral counts. It collapses to a 20 px strip from its right border or the top-bar toggle.
- **Toolbar:** a primary "New source" button where company edit authority permits, the literal search "Search source, supplier or item", a Supplier filter, the count with "AUD, excluding tax", Refresh and "…".
- **Grid:** one row per source, single-line 40 px rows with lines between cells. Source (reference and revision), Title, State, Supplier expiry, Tier 1 cost and Updated (sorted, newest first) are in view with the menu open; Supplier, Item, Unit and Effective scroll in from the right. The checkbox column and the settings and "…" column stay fixed while the grid scrolls sideways.
- **State and validity:** the five recorded states with icon and words; "Your submission" when you cannot review your own source; Returned in the warning text colour and Rejected muted. Unknown expiry reads "Unknown" and, like a past expiry date, has a warning icon. Nothing is red.
- **Record window:** clicking a row opens it over the grid, never squeezing it. Its left edge meets the secondary menu's right edge, with close, previous and next on that edge. It shows the source facts, the quantity tiers with the tier rule, a rule note, tabs for Changes from the previous revision, Evidence and Used in, and History. Its buttons are Open source and Review evidence; the decision and its reason stay on the source page.
- **Selection:** ticking rows shows a selection toolbar and a 360 px panel with Open in sequence and Export list only.

The app today, at 1440 × 1000 and 1024 × 768: keep record/source identity and the primary action with the task. Register cards separate supplier/item context from revision/validity; evidence uses labelled facts and a disclosure for UUID/hash attribution. Form fields and quantity tiers use consistent shared controls; comparison groups before/after cost with unchanged sell, warning and explicit confirmation. Long source text and hashes wrap. Dense content must not hide unresolved validity or review state.

## Mobile

Accepted design: captures 04–05 in [Cost sources design r01](../../../reference/ui/estimating/cost-sources-design-r01/README.md).

- **Header and toolbar at 390 × 844:** the page name only, with no breadcrumb. A toolbar holds a view picker ("All sources") standing in for the secondary menu, the count and a filter icon button.
- **List:** flush list rows about 80 px tall, each showing the title and tier 1 cost, the reference, revision and supplier, and the state and supplier expiry, with a chevron. The list leaves space below its last row so that it scrolls clear of Quick add.
- **Record view:** tapping a row opens a full-screen record view with back, previous and next. The source is stacked, and Open source and Review evidence are fixed at the bottom.
- **Tab bar:** icons only, the five Estimating tabs, each with a hidden accessible label. Cost sources is reached through More, so More is the current tab.

The app today, at 390 × 844 and 320 CSS px: stack facts, fields, tier controls and register cards. Maintain readable input text and 44 px controls. Keep actions in document flow above the fixed shell navigation; never conceal a required confirmation to reduce height. At 200% enlargement, allow additional rows and retain visible focus. Global page information closes with Escape and restores focus while unsaved form values remain. Native phone, keyboard and enlarged-state evidence must be inspected; physical device and assistive-technology acceptance remain separate.

## Components and states

Reuse Button/ButtonLink, Field/SelectField, ValidationFields, ErrorNotice, PageHeader, the current application rail/header/global guide and actor-bound recoverable command hook. Source-specific cards, facts, loading/empty text and recovery panel are host compositions, not new generic component acceptance. Semantic navy/green tokens and existing Roboto/Verdana typography apply.

Distinguish loading, empty register, filtered no-results, invalid fields, denied/revoked reads, server failure, read-only history, stale revision, pending save, unknown outcome and confirmed receipt. Failed source reads remove evidence/forms; stale edit preserves inputs until explicit replacement. A pending write blocks replacement operations and reload first checks its original receipt. Unknown expiry is a written state. Submitted freezes editing; Reviewed means evidence review only.

## Handovers and limits

Incoming: explicit authored synthetic evidence, exact current saved estimate/discovery basis and current scoped authority. Outgoing: immutable source revision/review events and an explicitly saved estimate successor with exact per-line source bindings. Historical estimates and Draft quote outputs are retained. Source review grants no estimate/quotation approval. Catalogue connection, FX, unit conversion, landed allocation and commercial thresholds remain Not configured.

## Exact references and evidence

- Accepted Figma design: [Cost sources design r01 captures](../../../reference/ui/estimating/cost-sources-design-r01/README.md) (icon-free PNGs; not application captures) and the [design decision](../../../decisions/cost-sources-design.md).
- [Supplier-pricing r01 HTML](../../../reference/ui/supplier-pricing/PPO-Supplier-Pricing-and-Cost-Sources-r01.html).
- [Original desktop price-comparison capture](../../../testing/evidence/supplier-pricing-r01/desktop-price-comparison.png).
- Exact source captures for the new native record/form route compositions are missing; compare their task and component behaviour against the retained package and record proposed departures.
- [Native contract](../../../contracts/estimating-cost-sources.md) and [executed verification/limits](../../../delivery/estimating-cost-sources-handover.md).

Source presence, functional proof, paired visual review, owner acceptance and deployment are separate. No current fingerprint is recorded as reviewed. Preserve all issued reference bytes.

## Implementation adaptations pending visual review

Exact minimum quantity and unit appear below tier cost; phone rows allow 96 px for these facts instead of the 80 px drawing. Column visibility, width and order are visit-local; server ordering remains newest update first. Supplier filtering uses literal label text. Person attribution uses retained UUIDs (or You), without inventing display names. Used in filters the bounded source-wide candidate window to the selected revision and explicitly reports partial coverage. Phone selection supports an explicit Select sources action and long press. At 780 CSS px and below, selecting or deselecting rows keeps the list visible; Show panel explicitly opens selection details, and Hide panel returns to the list. Desktop selection continues to open its panel automatically. No bulk evidence decision, automatic repricing or new permission is introduced.
