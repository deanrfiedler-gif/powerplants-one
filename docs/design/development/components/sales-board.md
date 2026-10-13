# Sales board and record cards

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Catalogue key:** `sales-board` · **Review:** Pending

Stage columns, owner avatars, next activity, card actions, collapse and stage movement.

## Source and reference

Design: [ppo-deal-pipeline_r38.html](../../../reference/ui/deals/ppo-deal-pipeline_r38.html). Retained design reference; paired acceptance not recorded.

The application implementation and exact consumer bindings are maintained in `../components.json`. The live catalogue links the current checkout and computes dependency fingerprints.

## Desktop

Amounts are AUD excluding GST; unknown estimates remain explicit. Change stage is the keyboard and touch alternative to drag.

## Mobile

Use the actual mobile stage layout; long titles and activity descriptions wrap without obscuring actions. The catalogue supplies an explicit selected stage and a shared selection menu so every stage remains browsable in a narrow frame.

## Keyboard and accessibility

Tab/Shift+Tab and visible focus throughout. Use labelled controls as alternatives to dragging and hover-only actions.

## States and interaction

- **Default:** Representative synthetic content and normal interaction.
- **Empty:** No matching example records; absence is distinct from failure.
- **Loading:** Read in progress; no success is inferred.
- **Read only:** Management actions unavailable in this example.
- **Compact:** Current compact-density variant.

## Differences and limits

Board styling remains a CRM variant. Compact targets and narrow-screen behaviour need owner/device review.

## Verification and maintenance

Review at 1440 × 960, 1024 × 768, 820 × 800, 390 × 844 and 320 × 700 where relevant; check browser zoom and keyboard operation separately. Compare the same state and viewport with the retained reference. Record exact commit, reviewer, date, fixture state, viewport, result and evidence paths in the component review record. Automated source fingerprints do not grant acceptance.

Changes to the source, styles, fixtures, specification or reference invalidate prior evidence. Update this master and its component record in the same pull request. Keep app business checks separate from catalogue presentation checks.

## Deal return context

Title links open the canonical Deal Workspace with the current local Deals URL as return context. Only the Deals route is accepted as a return destination. Existing snapshot, resize, move and date-edit controls retain their authority. Catalogue fixture links remain intercepted. CR-04 insights use the identical returned page without widening its query or weighting amounts.

## Figma component reference — 13 October 2026

The user-specified r37 design is now an editable [Deals proposal](https://www.figma.com/design/epLfuDjst5hUJeqBi3eJo8/PPO---Design?node-id=549-2), separately from the runtime r38 reference. `Deals/Card` (`551:947`) supplies Default and Rotting variants with text properties; `Deals/List row` (`551:948`) and `Deals/Phone list row` (`555:7166`) carry source fixtures. Fields, checkbox options and 29 source SVG icon components support the composed views. Fills, strokes, spacing and radii reuse PPO tokens or scoped source-specific Deals tokens. Existing shared shell and Button definitions were reused without changing their masters.

The 18 board/list/phone fixtures preserve the source names, stage counts, values, primary contacts where shown and next activities; rot, missing-action, overdue and unknown-value examples remain visible. New Figma components are references for `route:/sales/opportunities`, not new runtime exports or catalogue renderers. Existing consumer bindings and runnable state fixtures remain unchanged.

[Evidence](../../../testing/evidence/deals-figma/README.md) records agent visual inspection at 1440 x 960 and 390 x 844. Owner/device acceptance, full HTML interaction coverage, 320px/tablet views and runtime alignment remain open.
