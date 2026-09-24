# Cost-source register — native design contract

<!-- versioning: git; committed history is authoritative -->

Stable entry: `route:/estimating/cost-sources`. Scope: ES-03, page-register order 049. Owner: Dean Fiedler. Draft for paired visual review; no accepted baseline or deployment claim. Retained source provenance remains `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`.

## Purpose and layout

Find current permitted sources by reference, supplier, item or title and explicit source state. r20 page type: Register / worklist. Native layout is padded within the current shell; the shell owns the viewport and main content scrolling. No standalone masthead, second rail or nested viewport is carried from the reference. The native source/editor/comparison route split is a proposed adaptation of the five-view retained design, pending paired owner review.

1. Search literal source text; Apply filters updates the URL.
2. Read current state, revision, effective date and Unknown expiry.
3. Open exact evidence or use New synthetic source where company edit authority permits.
4. Back, Forward and reload retain the chosen URL filters.

## Desktop

At 1440 × 1000 and 1024 × 768, keep record/source identity and the primary action with the task. Register cards separate supplier/item context from revision/validity; evidence uses labelled facts and a disclosure for UUID/hash attribution. Form fields and quantity tiers use consistent shared controls; comparison groups before/after cost with unchanged sell, warning and explicit confirmation. Long source text and hashes wrap. Dense content must not hide unresolved validity or review state.

## Mobile

At 390 × 844 and 320 CSS px, stack facts, fields, tier controls and register cards. Maintain readable input text and 44 px controls. Keep actions in document flow above the fixed shell navigation; never conceal a required confirmation to reduce height. At 200% enlargement, allow additional rows and retain visible focus. Global page information closes with Escape and restores focus while unsaved form values remain. Native phone, keyboard and enlarged-state evidence must be inspected; physical device and assistive-technology acceptance remain separate.

## Components and states

Reuse Button/ButtonLink, Field/SelectField, ValidationFields, ErrorNotice, PageHeader, the current application rail/header/global guide and actor-bound recoverable command hook. Source-specific cards, facts, loading/empty text and recovery panel are host compositions, not new generic component acceptance. Semantic navy/green tokens and existing Roboto/Verdana typography apply.

Distinguish loading, empty register, filtered no-results, invalid fields, denied/revoked reads, server failure, read-only history, stale revision, pending save, unknown outcome and confirmed receipt. Failed source reads remove evidence/forms; stale edit preserves inputs until explicit replacement. A pending write blocks replacement operations and reload first checks its original receipt. Unknown expiry is a written state. Submitted freezes editing; Reviewed means evidence review only.

## Handovers and limits

Incoming: explicit authored synthetic evidence, exact current saved estimate/discovery basis and current scoped authority. Outgoing: immutable source revision/review events and an explicitly saved estimate successor with exact per-line source bindings. Historical estimates and Draft quote outputs are retained. Source review grants no estimate/quotation approval. Catalogue connection, FX, unit conversion, landed allocation and commercial thresholds remain Not configured.

## Exact references and evidence

- [Supplier-pricing r01 HTML](../../../reference/ui/supplier-pricing/PPO-Supplier-Pricing-and-Cost-Sources-r01.html).
- [Original desktop price-comparison capture](../../../testing/evidence/supplier-pricing-r01/desktop-price-comparison.png).
- Exact source captures for the new native record/form route compositions are missing; compare their task and component behaviour against the retained package and record proposed departures.
- [Native contract](../../../contracts/estimating-cost-sources.md) and [executed verification/limits](../../../delivery/estimating-cost-sources-handover.md).

Source presence, functional proof, paired visual review, owner acceptance and deployment are separate. No current fingerprint is recorded as reviewed. Preserve all issued reference bytes.
