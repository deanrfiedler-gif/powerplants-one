# Form controls and save states

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Catalogue key:** `fields` · **Review:** Pending

Actual text, multiline, date and select controls, required fields and synthetic save feedback.

## Source and reference

Design: [powerplants-one-theme-style-board-r22.html](../../../reference/ui/theme-style-board/powerplants-one-theme-style-board-r22.html#forms). Retained design reference; paired acceptance not recorded.

The application implementation and exact consumer bindings are maintained in `../components.json`. The live catalogue links the current checkout and computes dependency fingerprints.

## Desktop

Required inputs have visible labels; preserving data, validation and server acceptance remain separate. This example only saves in memory.

## Mobile

Use one column, at least 16 px input text and labels above controls. Avoid hidden action buttons beneath a mobile keyboard.

## Keyboard and accessibility

Tab/Shift+Tab and visible focus throughout. Use labelled controls as alternatives to dragging and hover-only actions.

## States and interaction

- **Default:** Representative synthetic content and normal interaction.
- **Disabled:** Inspect the disabled variant and its explanatory messages.
- **Saving:** Inspect the saving variant and its explanatory messages.

## Differences and limits

Page-specific forms still use several control families. Device keyboard and assistive-technology acceptance remain pending.

## Verification and maintenance

Review at 1440 × 960, 1024 × 768, 820 × 800, 390 × 844 and 320 × 700 where relevant; check browser zoom and keyboard operation separately. Compare the same state and viewport with the retained reference. Record exact commit, reviewer, date, fixture state, viewport, result and evidence paths in the component review record. Automated source fingerprints do not grant acceptance.

Changes to the source, styles, fixtures, specification or reference invalidate prior evidence. Update this master and its component record in the same pull request. Keep app business checks separate from catalogue presentation checks.

## CS native receiving

The maintained consumer bindings include the native Customer, Contact, Stakeholder, Readiness, Account Development and Survey pages where this control is actually used. Existing catalogue states illustrate the shared control; they do not reproduce the full CS workflow or server decisions. The [CS evidence](../../../testing/evidence/cs-native-completion/README.md) and owning page guides record real workflow checks and inspected widths. Owner/device comparison remains pending in the explicit CS alignment item.

## ES-03 native consumer

The source register, authored evidence form, independent review and estimate comparison use this family through `src/components/cost-sources.tsx`. Existing catalogue fixtures remain unchanged because the shared component implementation is unchanged. Source-specific unknown/stale/recovery compositions are verified in the host browser tests, not inferred from the catalogue. The read-state binding includes ErrorNotice and host loading/recovery text; it does not claim a new generic ReadState implementation. See the [cost-source handover](../../../delivery/estimating-cost-sources-handover.md) for executed evidence and open paired/owner/device review.
