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
