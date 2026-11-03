# Forecast cards

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Catalogue key:** `forecast` · **Review:** Pending

Real forecast month groups, overdue/undated groups and known versus unpriced amounts.

## Source and reference

Design: [accepted CR-04 r02 captures](../../../reference/ui/crm/deals-design-r02/README.md), frame `2362:63797`; earlier r38 is historical where superseded. Application visual review remains pending.

The application implementation and exact consumer bindings are maintained in `../components.json`. The live catalogue links the current checkout and computes dependency fingerprints.

## Figma components

**Status:** Partial · **Location:** Components 1:4 › Components · Sales parts, in the private "PPO - Design" Figma file

- Deals/Forecast card (proposal) `2362:63788`

The forecast card of the accepted Deals Forecast view (24 October 2026, [decision](../../../decisions/deals-figma-design.md#acceptance--24-october-2026)). The month lanes and stage groups are drawn in the page frame `2362:63797`, not as components. The card moved from the Deals page to Components `1:4` on 25 October 2026 ([Figma file audit](../../figma-file-audit/figma-file-audit-2026-10-24.md) R3); the node ID and every instance are unchanged. The mapping is kept in `../components.json` (`figma`); node IDs are stable, and the file link stays out of this repository (ADR-0053). It records where the design component is, not visual alignment or review.

## Desktop

Forecast groups use the server read observation in Australia/Brisbane, then month and native stage. Each group states its current-page denominator and separates known AUD excl. GST from unknown values. Fixed 15 October dates belong only to design fixtures. Values remain unweighted estimates, not revenue.

## Mobile

Tablet and phone month lanes scroll within their labelled region without widening the page. The shared phone view sheet selects Forecast; title links retain Deals return context, and the snapshot remains available. Stage subtotals include every returned row exactly once.

## Keyboard and accessibility

Tab/Shift+Tab and visible focus throughout. Use labelled controls as alternatives to dragging and hover-only actions.

## States and interaction

- **Default:** Representative synthetic content and normal interaction.
- **Empty:** No matching example records; absence is distinct from failure.
- **Read only:** Management actions unavailable in this example.

## Differences and limits

Forecast grouping and controls are module-specific; no global forecast approval is implied.

## Verification and maintenance

Review at 1440 × 960, 1024 × 768, 820 × 800, 390 × 844 and 320 × 700 where relevant; check browser zoom and keyboard operation separately. Compare the same state and viewport with the retained reference. Record exact commit, reviewer, date, fixture state, viewport, result and evidence paths in the component review record. Automated source fingerprints do not grant acceptance.

Changes to the source, styles, fixtures, specification or reference invalidate prior evidence. Update this master and its component record in the same pull request. Keep app business checks separate from catalogue presentation checks.

## Deal return context

Title links open the canonical Deal Workspace with the current local Deals URL as return context. Only the Deals route is accepted as a return destination. Existing snapshot, resize, move and date-edit controls retain their authority. Catalogue fixture links remain intercepted. CR-04 insights use the identical returned page without widening its query or weighting amounts.
