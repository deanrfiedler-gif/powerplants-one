# Buttons and action links

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Catalogue key:** `buttons` · **Review:** Pending

Primary, secondary, quiet, destructive, disabled, busy and link actions.

## Source and reference

Design: [powerplants-one-theme-style-board-r22.html](../../../reference/ui/theme-style-board/powerplants-one-theme-style-board-r22.html#controls). Retained design reference; paired acceptance not recorded.

The application implementation and exact consumer bindings are maintained in `../components.json`. The live catalogue links the current checkout and computes dependency fingerprints.

## Desktop

Use one primary action per task region and a visible action label.

## Mobile

Controls retain touch targets and wrap into additional rows.

## Keyboard and accessibility

Tab/Shift+Tab and visible focus throughout. Use labelled controls as alternatives to dragging and hover-only actions.

## States and interaction

- **Default:** Representative synthetic content and normal interaction.

## Differences and limits

Legacy scoped button families do not all use Button/ButtonLink.

## Verification and maintenance

Review at 1440 × 960, 1024 × 768, 820 × 800, 390 × 844 and 320 × 700 where relevant; check browser zoom and keyboard operation separately. Compare the same state and viewport with the retained reference. Record exact commit, reviewer, date, fixture state, viewport, result and evidence paths in the component review record. Automated source fingerprints do not grant acceptance.

Changes to the source, styles, fixtures, specification or reference invalidate prior evidence. Update this master and its component record in the same pull request. Keep app business checks separate from catalogue presentation checks.

## Sales handover and aftercare consumers

CR-02/03/05 reuse these controls for Save, Submit, receiving decisions and recovery. Disabled/busy and uncertain results remain distinct; background refresh preserves dirty form values. Scope-specific handlers stay in the page. Labels, native keyboard semantics and source ownership remain intact. Actual device evidence is in the Sales handover; owner acceptance is pending.
