# Record navigation and panels

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Catalogue key:** `tabs` · **Review:** Pending

Real RecordTabs and RecordPanel with controlled selection and directional keyboard navigation.

## Source and reference

Design: [powerplants-one-theme-style-board-r22.html](../../../reference/ui/theme-style-board/powerplants-one-theme-style-board-r22.html#page-layouts). Retained design reference; paired acceptance not recorded.

The application implementation and exact consumer bindings are maintained in `../components.json`. The live catalogue links the current checkout and computes dependency fingerprints.

## Desktop

Arrow keys, Home and End select/focus tabs. Each tab labels its corresponding panel.

## Mobile

Confirm wrapped or scrolling tabs keep the selected label and focus visible.

## Keyboard and accessibility

Tab/Shift+Tab and visible focus throughout. Use arrows/Home/End in tabs or menus; Escape dismisses overlays.

## States and interaction

- **Default:** Representative synthetic content and normal interaction.

## Differences and limits

Tab variants across modules require an explicit migration decision; this example does not restyle unrelated navigation.

## Verification and maintenance

Review at 1440 × 960, 1024 × 768, 820 × 800, 390 × 844 and 320 × 700 where relevant; check browser zoom and keyboard operation separately. Compare the same state and viewport with the retained reference. Record exact commit, reviewer, date, fixture state, viewport, result and evidence paths in the component review record. Automated source fingerprints do not grant acceptance.

Changes to the source, styles, fixtures, specification or reference invalidate prior evidence. Update this master and its component record in the same pull request. Keep app business checks separate from catalogue presentation checks.

## CS native receiving

The maintained consumer bindings include the native Customer, Contact, Stakeholder, Readiness, Account Development and Survey pages where this control is actually used. Existing catalogue states illustrate the shared control; they do not reproduce the full CS workflow or server decisions. The [CS evidence](../../../testing/evidence/cs-native-completion/README.md) and owning page guides record real workflow checks and inspected widths. Owner/device comparison remains pending in the explicit CS alignment item.

The **Customer 360** state uses the eight native tab labels with the real RecordTabs/RecordPanel implementation. Arrow/Home/End selection and selected-panel semantics are live; source queries and URL restoration are verified on the owning Customer page, not simulated here.

## Sales handover and aftercare consumers

CR-02/03/05 reuse these controls for Save, Submit, receiving decisions and recovery. Disabled/busy and uncertain results remain distinct; background refresh preserves dirty form values. Scope-specific handlers stay in the page. Labels, native keyboard semantics and source ownership remain intact. Actual device evidence is in the Sales handover; owner acceptance is pending.

The Sales workspace fixture uses all eight CR-01 labels. Keyboard selection and horizontally scrollable phone tabs use the existing RecordTabs control; this fixture carries no business permissions or saved workflow state.


## Equipment native consumers

EQ-01 through EQ-09 reuse the shared control in their applicable register, record and evidence forms; tabs are used by EQ-01/EQ-03/EQ-04/EQ-05. Synthetic states are exercised in `tests/database/equipment.test.ts`, `tests/http/equipment.test.ts` and the Equipment browser proof. Source binding is recorded in the living register. No shared-control rendering change or visual acceptance is implied.
