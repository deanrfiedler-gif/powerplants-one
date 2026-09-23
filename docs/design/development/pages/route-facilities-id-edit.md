# Facilities & growing areas · edit — native reference

Stable entry: `route:/facilities/[id]/edit`. Scope: **CS-05**. Owner: Dean Fiedler.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d` (imported register entry). Native source: [PR #274](https://github.com/deanrfiedler-gif/powerplants-one/pull/274), merged to main as `ab96e2b` on 22 September 2026. Route: `/facilities/[id]/edit`.
Native implementation and adaptations are proposed for owner review; this is not a new accepted visual baseline.

## Purpose and page type

Revise one Facility with a required change reason and an exact saved-versus-proposed review before anything is saved.

r20 page types: **Form / guided workflow; Review / comparison**. Review changes lists each changed field with its saved and proposed value, marks fields that will be cleared and restates the saved and proposed parent path. Confirm these changes saves; Back to proposal returns without saving. A stale version is refused and the proposal is kept.

## Desktop

Use the current native PPO shell. The shell owns header, search, global navigation and viewport height; the Customer locations secondary menu lists Facilities & growing areas. Inside `#ppo-facilities`, the `.facility-host` is the one scroller. Reuse PageHeader, RecordTabs/RecordPanel, LookupField, Field/Select, validation, the session boundary and the original-operation hook; no standalone demo shell is copied.

The register uses a right-hand, read-only inspection dock on wide screens and opens full records on smaller screens; changing the filter or collapsing the view removes the dock, and the dock routes to the full edit page. Revision uses inline comparison inside the form, with exact before/after values and acknowledgements; it adds no second shell or full-height frame. Let long names and unknown values wrap. Browser proof checked 1920, 1440 and 1280 px and 200% zoom at short height for whole-page overflow; the agent's visual review covered the register and dock, detail, clearing and pin review, related equipment and service ending.

## Mobile

Evidence is Chrome emulation at 390 and 320 CSS px, not a physical phone. Register filters stack in one column. The register table scrolls horizontally inside its own region, so Inspect actions stay reachable without whole-page overflow. The Customer locations menu opens as a dialog; Escape closes it and returns focus. Keyboard labels, tabs, Escape/focus return, validation and deliberate dirty discard were executed; a screen reader was not. No information or required decision is hidden to make a screenshot fit.

## Sources, handovers and authority

The issued r03 composition is adapted to canonical server data (CS05-D01 to D05 in the handover): a labelled canonical UUID replaces speculative FAC numbers; reported-note sources replace unsupported provider documents; unsupported work and document relations are labelled as unsupported. A legacy parent means Grouping; a new parent records Grouping or Physically within, and nothing is inherited. Measurements are independent optional values; no area total, crop inference or pricing is calculated. Authority is current Site/Company access; per-Facility ACLs do not exist.

Recovery is online memory only. Reloading or closing the tab discards an unsaved proposal or uncertain original; there is no browser draft storage or offline queue. Estimating keeps its own exact Facility ID/name/version snapshot, and new Facility metadata never reprices an estimate. Engineering free-text served areas are not imported. Protected Asset site movement remains disabled.

Incoming: exact permitted Site/Facility/Asset UUID and current version. Outgoing: the same canonical identity and immutable audit, never permission to work, pricing adoption or technical approval.

Reference: docs/reference/ui/customers/PPO-Customers-Sites-and-Growing-Areas-Workspace-r03.html

## Visual references

- [PPO-Customers-Sites-and-Growing-Areas-Workspace-r03.html](../../../reference/ui/customers/PPO-Customers-Sites-and-Growing-Areas-Workspace-r03.html) — issued standalone reference, retained unchanged; the native page adapts it (above).
- [desktop-clearing-review.png](../../../testing/evidence/cs05-native-r01/captures/desktop-clearing-review.png) — saved-versus-proposed review with cleared fields, desktop
- [phone-clearing-review.png](../../../testing/evidence/cs05-native-r01/captures/phone-clearing-review.png) — saved-versus-proposed review with cleared fields, phone (emulated)
- [desktop-version-conflict.png](../../../testing/evidence/cs05-native-r01/captures/desktop-version-conflict.png) — stale-version refusal that keeps the proposal, desktop
- [desktop-uncertain-original.png](../../../testing/evidence/cs05-native-r01/captures/desktop-uncertain-original.png) — result could not be confirmed; entries kept for retry, desktop
- [desktop-reload-memory-boundary.png](../../../testing/evidence/cs05-native-r01/captures/desktop-reload-memory-boundary.png) — forced reload discards the unsaved proposal, desktop

Captures are synthetic observations of candidate `5f6e683` (22 September 2026). The implementing agent visually inspected the views listed in the handover; none is an owner-accepted baseline. The full set, with hashes, is in the [capture manifest](../../../testing/evidence/cs05-native-r01/capture-manifest.json).

## Verification and acceptance

[ADR-0037](../../../decisions/ADR-0037-cs05-facilities-native.md) records the decision. The [CS-05 handover](../../../delivery/facilities-growing-areas-handover.md) and [candidate evidence](../../../testing/evidence/cs05-native-r01/README.md) record executed behaviour, captures, source hashes and limits; the [80-case matrix](../../../testing/evidence/cs05-native-r01/acceptance-matrix.md) marks partial cases. The page guide `guide.page.facilities.id.edit` is still the imported draft and has not been rewritten for the native workflow. Owner visual and business acceptance, screen-reader and physical-device checks, external map handoff and the browser search timing budget remain outstanding. Hosted deployment is not verified here.
