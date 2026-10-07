# Compatibility, replacements and lifecycle — native design contract

<!-- versioning: git; committed history is authoritative -->

Stable key: `scope:PD-04`. Scope: `PD-04`. Owner: Dean Fiedler. Review: **Needs review**. Source base: `cad98aca42cb233f142029d11601a78d7d4b521e`. Route: `/products/compatibility`.

## Purpose and r20 page type

Record bounded product-level candidate relationships, unresolved interface criteria and separate receiving-domain uses. Page type: **Document & evidence workspace; supporting Review / comparison**. This adapts the retained task reference into the current seven-domain shell; it does not adopt a new standalone baseline.

## Desktop

At 1440 × 960 and 1024 × 768, retain the shell, labelled Products workspace links and exact identity header. Use the shared padded module surface with semantic navy/green tokens, Roboto/Verdana, white bordered panels and wrapping facts. Registers use readable cards; comparisons place Before and After side by side. Keep the selected revision and evidence before consequential actions. Avoid global overrides or a second shell.

## Mobile

At 390 × 844 and 320 px, stack cards, forms and Before/After sections in source order. Fields retain readable 16 px text, touch targets and visible labels. Long UUIDs, provider keys and evidence wrap within the panel. Effective 200% reflow is checked at 720 CSS px from the 1440 desktop basis. No outer-page horizontal scrolling is permitted.

## Shared controls and states

Reuse ProductsFrame, ProductContext, TechnicalContent and Comparison; shared Button, Field, SelectField, ValidationFields, ErrorNotice and ReadState; useUnsavedChanges and useRecoverableCommand. Loading, empty, filtered empty, read only, denied/unavailable, validation, stale, saving, unknown, recovered and success remain distinct. No new modal/drawer or drag gesture is introduced. The shell's existing information icon exposes the page-specific draft guide.

## Task and handovers

1. Choose exact original and candidate revisions; similar display names do not identify a record.
2. Record relationship purpose, evidence, conditions, limitations, lifecycle source and criteria with clarification owners.
3. A separate reviewer records Conditional only when every criterion is Met, or Unresolved/Rejected.
4. Preview a permitted Asset or Engineering MaterialLine and retain its exact version as observed-use evidence.
5. Open Engineering Materials/Change Impact or Equipment Lifecycle/Bulletins for the owning decision; retained Product references never change those records.

Incoming: exact permitted Product/company/source context. Outgoing: ES-03 source review/refresh, EN-06 Materials, EN-07 Change Impact, EQ-06 Bulletins and EQ-07 Lifecycle as applicable. Published catalogue evidence is not an owning-domain suitability or commercial decision.

## Visual sources, departures and proof

No dedicated accepted HTML or mobile image exists for this scope. This native composition is proposed for owner review.

- [Products workflow map](../../../reference/ui/module-workflow-maps/PPO-Products-and-Catalogue-Management-Workflow-Map-r01.html)
- [Native contract](../../../contracts/products-catalogue.md)
- [Evidence index](../../../testing/evidence/products-native/README.md)

Proposed adaptation: native cards, semantic shared controls and stacked comparison replace standalone-only geometry. PD-03 uses native AUD/excluding-tax CostSource evidence; wider design policy remains Not configured. Source images are retained unchanged. Matching native captures and independent visual observations are recorded in the evidence index when inspected; no fingerprint or owner approval is inferred from an automated pass. Native phone images are runtime evidence, not an invented accepted mobile baseline.

## Completion review scope — 7 October 2026

The completion branch preserves the exact selected revision when handing detail to pricing and on reload. Published catalogue basis links to its immutable revision. Internal UUID detail is disclosed on demand while catalogue/technical revision, source basis and lifecycle remain visible. Four named local synthetic identities separate read, author, review and publication. Existing/hosted users gain no Products authority. The [completion evidence](../../../testing/evidence/products-native/README.md) records paired captures and verification; owner baseline, physical-device and screen-reader acceptance remain pending. Catalogue pagination and wider estimating selection are later work.
