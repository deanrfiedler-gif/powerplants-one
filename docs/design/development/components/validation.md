# Validation and error summary

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Catalogue key:** `validation` · **Review:** Pending

Actual ValidationFields, Field and ErrorNotice with linked errors and preserved inputs.

## Source and reference

Design: [powerplants-one-theme-style-board-r22.html](../../../reference/ui/theme-style-board/powerplants-one-theme-style-board-r22.html#states). Retained design reference; paired acceptance not recorded.

The application implementation and exact consumer bindings are maintained in `../components.json`. The live catalogue links the current checkout and computes dependency fingerprints.

## Desktop

Submit an empty title to focus the summary, then follow its link to the field. Correct the title and save to clear the example error.

## Mobile

Summary and inline errors must remain visible at 320 px and 200% zoom.

## Keyboard and accessibility

Tab/Shift+Tab and visible focus throughout. Use labelled controls as alternatives to dragging and hover-only actions.

## States and interaction

- **Invalid:** Required-field errors with retained input.
- **Default:** Representative synthetic content and normal interaction.

## Differences and limits

ErrorNotice moves focus to its summary; screen-reader announcement still needs manual acceptance.

## Verification and maintenance

Review at 1440 × 960, 1024 × 768, 820 × 800, 390 × 844 and 320 × 700 where relevant; check browser zoom and keyboard operation separately. Compare the same state and viewport with the retained reference. Record exact commit, reviewer, date, fixture state, viewport, result and evidence paths in the component review record. Automated source fingerprints do not grant acceptance.

Changes to the source, styles, fixtures, specification or reference invalidate prior evidence. Update this master and its component record in the same pull request. Keep app business checks separate from catalogue presentation checks.

## CS native receiving

The maintained consumer bindings include the native Customer, Contact, Stakeholder, Readiness, Account Development and Survey pages where this control is actually used. Existing catalogue states illustrate the shared control; they do not reproduce the full CS workflow or server decisions. The [CS evidence](../../../testing/evidence/cs-native-completion/README.md) and owning page guides record real workflow checks and inspected widths. Owner/device comparison remains pending in the explicit CS alignment item.

## Sales handover and aftercare consumers

CR-02/03/05 reuse these controls for Save, Submit, receiving decisions and recovery. Disabled/busy and uncertain results remain distinct; background refresh preserves dirty form values. Scope-specific handlers stay in the page. Labels, native keyboard semantics and source ownership remain intact. Actual device evidence is in the Sales handover; owner acceptance is pending.
