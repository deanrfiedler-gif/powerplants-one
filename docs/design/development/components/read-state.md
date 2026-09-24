# Loading, empty, error and recovery

SC-01–SC-10 reuse ErrorNotice with domain-owned loading, filtered-empty, denied, saved and uncertain-operation states. No new shared renderer or fixture behaviour is introduced. The host keeps original save identity/content in identity-scoped session storage and asks the server to recover the original receipt. These host states are covered by the Supply Chain browser/HTTP proof, not inferred from component catalogue examples. Draft visual/owner review remains separate.

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

## Scheduling consumers

PL-01–PL-05 reuse this family in the native shell. New review pages use wrapping actions, read/empty/error states, resource evidence and analytical comparisons. Existing booking forms retain their scoped button family. See [Scheduling evidence](../../../testing/evidence/scheduling-resources/README.md); component fixtures and review fingerprints remain unchanged because the underlying shared implementation is unchanged.

## ES-03 native consumer

The source register, authored evidence form, independent review and estimate comparison use this family through `src/components/cost-sources.tsx`. Existing catalogue fixtures remain unchanged because the shared component implementation is unchanged. Source-specific unknown/stale/recovery compositions are verified in the host browser tests, not inferred from the catalogue. The read-state binding includes ErrorNotice and host loading/recovery text; it does not claim a new generic ReadState implementation. See the [cost-source handover](../../../delivery/estimating-cost-sources-handover.md) for executed evidence and open paired/owner/device review.

## Sales handover and aftercare consumers

CR-02/03/05 reuse these controls for Save, Submit, receiving decisions and recovery. Disabled/busy and uncertain results remain distinct; background refresh preserves dirty form values. Scope-specific handlers stay in the page. Labels, native keyboard semantics and source ownership remain intact. Actual device evidence is in the Sales handover; owner acceptance is pending.


## Equipment native consumers

EQ-01 through EQ-09 reuse the shared control in their applicable register, record and evidence forms; tabs are used by EQ-01/EQ-03/EQ-04/EQ-05. Synthetic states are exercised in `tests/database/equipment.test.ts`, `tests/http/equipment.test.ts` and the Equipment browser proof. Source binding is recorded in the living register. No shared-control rendering change or visual acceptance is implied.


## FI-05 field readiness consumer

The exact assigned-visit review reuses this control without changing its shared implementation. Loading, denied, unsaved, saving, stale, unknown-result recovery and server-saved states remain distinct. Fixtures and retained-source/lost-response journeys are in tests/browser/field-readiness.spec.ts; actual visual evidence is tracked by the Field Work programme handover. Owner/device acceptance remains pending.

## ES-01 native consumer

The Estimating workload and Saved estimates views use ErrorNotice with host loading, no-match, no-permitted-workload and no-access states. A failed read clears rows and readiness counts and offers a secondary Try loading again (decision P9). Placeholder rows were declined; loading uses status text. The shared implementation and catalogue fixtures are unchanged. The host browser suite covers the failed, recovered and revoked reads.
