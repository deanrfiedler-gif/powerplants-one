# Side drawers

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Catalogue key:** `drawer` · **Review:** Pending

The drawer variant of the actual WorklistPanel.

## Source and reference

Design: [ppo-deal-pipeline_r38.html](../../../reference/ui/deals/ppo-deal-pipeline_r38.html). Retained design reference; paired acceptance not recorded.

The application implementation and exact consumer bindings are maintained in `../components.json`. The live catalogue links the current checkout and computes dependency fingerprints.

## Desktop

Use drawers for supplementary record context; preserve the parent task and focus return.

## Mobile

The actual drawer should fit the phone viewport and scroll content internally.

## Keyboard and accessibility

Tab/Shift+Tab and visible focus throughout. Use arrows/Home/End in tabs or menus; Escape dismisses overlays.

## States and interaction

- **Default:** Representative synthetic content and normal interaction.

## Differences and limits

Drawer geometry must be compared with its CRM reference; shell utility panels have separate behaviour.

## Verification and maintenance

Review at 1440 × 960, 1024 × 768, 820 × 800, 390 × 844 and 320 × 700 where relevant; check browser zoom and keyboard operation separately. Compare the same state and viewport with the retained reference. Record exact commit, reviewer, date, fixture state, viewport, result and evidence paths in the component review record. Automated source fingerprints do not grant acceptance.

Changes to the source, styles, fixtures, specification or reference invalidate prior evidence. Update this master and its component record in the same pull request. Keep app business checks separate from catalogue presentation checks.

## ES-01 consumer

`/estimating` reuses WorklistPanel for the opportunity detail when the register is narrower than the 1360 px panel width (decision P7). The dialog, Escape handling and focus return are the shared implementation. The right-hand geometry (448 px, full height, header, scrolling body and Done footer) is scoped to the page, because the CRM drawer is a top sheet. The alignment item `es01-right-drawer` records this variant for review. At phone width the page uses cards instead of a drawer. The Estimating workload browser suite covers opening, the dialog name, Escape and focus return at 1359 px.
