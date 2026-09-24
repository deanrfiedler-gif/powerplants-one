# Buttons and action links

SC-01–SC-10 consume Button for capture, allocation, filters and original-operation recovery. Shared rendering and catalogue fixtures are unchanged. Host tests in `tests/browser/supply.spec.ts` cover disabled, saving, saved, conflict and recovery compositions at 1440/1024/390/320 px; see the Supply Chain handover for executed results. Consumer bindings preserve Draft review and do not grant owner acceptance.

<!-- versioning: git; committed history is authoritative -->

ES-01 consumes the existing Button for filter submission and failed-read retry, and ButtonLink for permitted discovery entry. No component implementation or fixture semantics change. Inspect long action labels at 320 px; page alignment evidence remains in the Estimating programme handover.

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

Native EN-02–EN-05 adopts Button in entry, register, inspector, forms and recovery states. Its workspace excludes these controls from the older My Work element and hover resets. Review primary save/submit, secondary navigation, disabled saving and unchanged-original retry on desktop and phone; do not apply a global legacy restyle.

## Verification and maintenance

Review at 1440 × 960, 1024 × 768, 820 × 800, 390 × 844 and 320 × 700 where relevant; check browser zoom and keyboard operation separately. Compare the same state and viewport with the retained reference. Record exact commit, reviewer, date, fixture state, viewport, result and evidence paths in the component review record. Automated source fingerprints do not grant acceptance.

Changes to the source, styles, fixtures, specification or reference invalidate prior evidence. Update this master and its component record in the same pull request. Keep app business checks separate from catalogue presentation checks.

## Scheduling consumers

PL-01–PL-05 reuse this family in the native shell. New review pages use wrapping actions, read/empty/error states, resource evidence and analytical comparisons. Existing booking forms retain their scoped button family. See [Scheduling evidence](../../../testing/evidence/scheduling-resources/README.md); component fixtures and review fingerprints remain unchanged because the underlying shared implementation is unchanged.

## ES-03 native consumer

The source register, authored evidence form, independent review and estimate comparison use this family through `src/components/cost-sources.tsx`. Existing catalogue fixtures remain unchanged because the shared component implementation is unchanged. Source-specific unknown/stale/recovery compositions are verified in the host browser tests, not inferred from the catalogue. The read-state binding includes ErrorNotice and host loading/recovery text; it does not claim a new generic ReadState implementation. See the [cost-source handover](../../../delivery/estimating-cost-sources-handover.md) for executed evidence and open paired/owner/device review.

## Sales handover and aftercare consumers

CR-02/03/05 reuse these controls for Save, Submit, receiving decisions and recovery. Disabled/busy and uncertain results remain distinct; background refresh preserves dirty form values. Scope-specific handlers stay in the page. Labels, native keyboard semantics and source ownership remain intact. Actual device evidence is in the Sales handover; owner acceptance is pending.


## Equipment native consumers

EQ-01 through EQ-09 reuse the shared control in their applicable register, record and evidence forms; tabs are used by EQ-01/EQ-03/EQ-04/EQ-05. Synthetic states are exercised in `tests/database/equipment.test.ts`, `tests/http/equipment.test.ts` and the Equipment browser proof. Source binding is recorded in the living register. No shared-control rendering change or visual acceptance is implied.
