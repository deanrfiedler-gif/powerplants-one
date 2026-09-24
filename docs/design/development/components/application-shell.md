# Application shell and global navigation

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Catalogue key:** `application-shell` · **Review:** Pending

The actual ProductNavigation, ProductHeader and ShellControls surround this catalogue. Use the full application window to review them.

## Source and reference

Design: [PPO-Application-Shell-r17.html](../../../reference/ui/application-shell/PPO-Application-Shell-r17.html). Retained shell reference; current environment permissions govern navigation.

The application implementation and exact consumer bindings are maintained in `../components.json`. The live catalogue links the current checkout and computes dependency fingerprints.

## Desktop

Review the real global search, workspace switcher, rail, More and utility controls around this catalogue. Shell access can be unavailable without a running identity/database service.

## Mobile

Resize the actual browser window to review the mobile shell; component-frame presets do not resize the surrounding application.

## Keyboard and accessibility

Check tab order, skip link, More dialog, Escape and focus return in the real host.

## States and interaction

Host example; no isolated interactive fixture is claimed.

## Differences and limits

No synthetic permission grants are supplied. The host is not counted as an isolated runnable fixture.

## Verification and maintenance

Review at 1440 × 960, 1024 × 768, 820 × 800, 390 × 844 and 320 × 700 where relevant; check browser zoom and keyboard operation separately. Compare the same state and viewport with the retained reference. Record exact commit, reviewer, date, fixture state, viewport, result and evidence paths in the component review record. Automated source fingerprints do not grant acceptance.

Changes to the source, styles, fixtures, specification or reference invalidate prior evidence. Update this master and its component record in the same pull request. Keep app business checks separate from catalogue presentation checks.

## CS native receiving

The existing `system:shell` binding owns the inherited frame around CS pages. Page files do not directly import shell controls, so no false direct-consumer binding is added. The CS stylesheet retains a scoped phone-header containment correction within this real host. The [CS evidence](../../../testing/evidence/cs-native-completion/README.md) and owning page guides record workflow checks and inspected widths. Owner/device comparison remains pending in the explicit CS alignment item.

## Equipment native receiving

Equipment uses the same `system:shell` host binding, without a duplicate shell or isolated fixture. Its scoped phone rule restores the intended flex header: the older identity-strip grid otherwise outranks the shared rule and places utility controls over scrolled records. The live state examples are a scrolled retained backup, failed-fix timeline and calibration-at-use record at 390 px, plus the complete 320–1440 px route matrix. [Equipment evidence](../../../testing/evidence/equipment-native/README.md) records exact captures and source commits. The containment assertion checks that utility controls remain inside the header; keyboard navigation and effective 200% reflow are separate checks. Owner/device acceptance remains pending.
