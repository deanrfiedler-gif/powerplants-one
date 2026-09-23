# Selectable table and area editing

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Catalogue key:** `area-editor` · **Review:** Pending

Select a real estimating area row and edit its details through the application AreasEditor.

## Source and reference

Design: [powerplants-one-theme-style-board-r22.html](../../../reference/ui/theme-style-board/powerplants-one-theme-style-board-r22.html#forms). Retained design reference; paired acceptance not recorded.

The application implementation and exact consumer bindings are maintained in `../components.json`. The live catalogue links the current checkout and computes dependency fingerprints.

## Desktop

Select an area before changing its fields. Add/remove affects the preview only; saved configuration commands remain in the owning page.

## Mobile

Scroll the table within its container; the selected-area field editor must remain reachable below it.

## Keyboard and accessibility

Tab/Shift+Tab and visible focus throughout. Use labelled controls as alternatives to dragging and hover-only actions.

## States and interaction

- **Default:** Representative synthetic content and normal interaction.
- **Empty:** No matching example records; absence is distinct from failure.
- **Read only:** Management actions unavailable in this example.

## Differences and limits

This is the existing select-and-edit pattern. Spreadsheet-style cell editing, bulk selection and frozen columns are not shared capabilities.

## Verification and maintenance

Review at 1440 × 960, 1024 × 768, 820 × 800, 390 × 844 and 320 × 700 where relevant; check browser zoom and keyboard operation separately. Compare the same state and viewport with the retained reference. Record exact commit, reviewer, date, fixture state, viewport, result and evidence paths in the component review record. Automated source fingerprints do not grant acceptance.

Changes to the source, styles, fixtures, specification or reference invalidate prior evidence. Update this master and its component record in the same pull request. Keep app business checks separate from catalogue presentation checks.
