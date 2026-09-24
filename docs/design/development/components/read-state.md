# Loading, empty, error and recovery

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Catalogue key:** `read-state` · **Review:** Pending

Actual ReadState/ErrorNotice plus explicitly labelled host-level empty, success and offline messages.

## Source and reference

Design: [powerplants-one-theme-style-board-r22.html](../../../reference/ui/theme-style-board/powerplants-one-theme-style-board-r22.html#states). Retained design reference; paired acceptance not recorded.

The application implementation and exact consumer bindings are maintained in `../components.json`. The live catalogue links the current checkout and computes dependency fingerprints.

## Desktop

Retry changes only this fixture. Distinguish no results, denied access, stale retained data and unknown write outcomes.

## Mobile

Messages wrap and retry remains reachable; never express failure only through colour.

## Keyboard and accessibility

Tab/Shift+Tab and visible focus throughout. Use labelled controls as alternatives to dragging and hover-only actions.

## States and interaction

- **Loading:** Read in progress; no success is inferred.
- **Empty:** No matching example records; absence is distinct from failure.
- **Error:** Inspect the error variant and its explanatory messages.
- **Denied:** Inspect the denied variant and its explanatory messages.
- **Conflict:** Inspect the conflict variant and its explanatory messages.
- **Success:** Inspect the success variant and its explanatory messages.
- **Offline:** Inspect the offline variant and its explanatory messages.

## Differences and limits

Offline copy is illustrative. Real queued/synced/conflict support is page-specific and must not be inferred from the catalogue.

## Verification and maintenance

Review at 1440 × 960, 1024 × 768, 820 × 800, 390 × 844 and 320 × 700 where relevant; check browser zoom and keyboard operation separately. Compare the same state and viewport with the retained reference. Record exact commit, reviewer, date, fixture state, viewport, result and evidence paths in the component review record. Automated source fingerprints do not grant acceptance.

Changes to the source, styles, fixtures, specification or reference invalidate prior evidence. Update this master and its component record in the same pull request. Keep app business checks separate from catalogue presentation checks.

## CS native receiving

The maintained consumer bindings include the native Customer, Contact, Stakeholder, Readiness, Account Development and Survey pages where this control is actually used. Existing catalogue states illustrate the shared control; they do not reproduce the full CS workflow or server decisions. The [CS evidence](../../../testing/evidence/cs-native-completion/README.md) and owning page guides record real workflow checks and inspected widths. Owner/device comparison remains pending in the explicit CS alignment item.


## Equipment native consumers

EQ-01 through EQ-09 reuse the shared control in their applicable register, record and evidence forms; tabs are used by EQ-01/EQ-03/EQ-04/EQ-05. Synthetic states are exercised in `tests/database/equipment.test.ts`, `tests/http/equipment.test.ts` and the Equipment browser proof. Source binding is recorded in the living register. No shared-control rendering change or visual acceptance is implied.
