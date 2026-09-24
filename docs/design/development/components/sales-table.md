# Sales register table

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Catalogue key:** `sales-table` · **Review:** Pending

Real deal rows, wrapped identity, unknown values, filtering, sorting and keyboard-resizable columns.

## Source and reference

Design: [ppo-deal-pipeline_r38.html](../../../reference/ui/deals/ppo-deal-pipeline_r38.html). Retained design reference; paired acceptance not recorded.

The application implementation and exact consumer bindings are maintained in `../components.json`. The live catalogue links the current checkout and computes dependency fingerprints.

## Desktop

Keep record identity visible and distinguish unknown amounts from zero. Filtering and sorting here are local fixture adapters.

## Mobile

The application table uses a bounded horizontal scroller. Inspect identity and actions at 390 and 320 px.

## Keyboard and accessibility

Tab/Shift+Tab and visible focus throughout. Use labelled controls as alternatives to dragging and hover-only actions.

## States and interaction

- **Default:** Representative synthetic content and normal interaction.
- **Empty:** No matching example records; absence is distinct from failure.
- **Loading:** Read in progress; no success is inferred.
- **Compact:** Current compact-density variant.

## Differences and limits

Row selection and pagination belong to host workflows; they are not implemented by Grid. A universal selectable table remains unspecified.

## Verification and maintenance

Review at 1440 × 960, 1024 × 768, 820 × 800, 390 × 844 and 320 × 700 where relevant; check browser zoom and keyboard operation separately. Compare the same state and viewport with the retained reference. Record exact commit, reviewer, date, fixture state, viewport, result and evidence paths in the component review record. Automated source fingerprints do not grant acceptance.

Changes to the source, styles, fixtures, specification or reference invalidate prior evidence. Update this master and its component record in the same pull request. Keep app business checks separate from catalogue presentation checks.

## Deal return context

Title links open the canonical Deal Workspace with the current local Deals URL as return context. Only the Deals route is accepted as a return destination. Existing snapshot, resize, move and date-edit controls retain their authority. Catalogue fixture links remain intercepted. CR-04 insights use the identical returned page without widening its query or weighting amounts.
