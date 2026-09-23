# Project Gantt and list

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Catalogue key:** `gantt` · **Review:** Pending

Actual project timeline with groups, milestones, dependencies, progress, zoom, warnings and list mode.

## Source and reference

Design: [ppo-projects-gantt-content-r10.html](../../../reference/ui/projects/ppo-projects-gantt-content-r10.html). Retained design reference; paired acceptance not recorded.

The application implementation and exact consumer bindings are maintained in `../components.json`. The live catalogue links the current checkout and computes dependency fingerprints.

## Desktop

Use Week/Month/Fit, owner and issue filters, group collapse, display options and list mode. The fixed reference date is 23 September 2026.

## Mobile

Inspect the actual list fallback, timeline scroll, long task titles and resize controls at phone width.

## Keyboard and accessibility

Tab/Shift+Tab and visible focus throughout. Use labelled controls as alternatives to dragging and hover-only actions.

## States and interaction

- **Default:** Representative synthetic content and normal interaction.
- **Empty:** No matching example records; absence is distinct from failure.
- **Loading:** Read in progress; no success is inferred.
- **Read only:** Management actions unavailable in this example.
- **Undated:** Inspect the undated variant and its explanatory messages.
- **Programme:** Programme mode over synthetic project context.

## Differences and limits

Task editing and server history are not part of this presentation fixture. Dependency warnings are advisory. Full paired r10 visual acceptance remains open.

## Verification and maintenance

Review at 1440 × 960, 1024 × 768, 820 × 800, 390 × 844 and 320 × 700 where relevant; check browser zoom and keyboard operation separately. Compare the same state and viewport with the retained reference. Record exact commit, reviewer, date, fixture state, viewport, result and evidence paths in the component review record. Automated source fingerprints do not grant acceptance.

Changes to the source, styles, fixtures, specification or reference invalidate prior evidence. Update this master and its component record in the same pull request. Keep app business checks separate from catalogue presentation checks.
