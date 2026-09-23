# Facilities & growing areas · detail — native reference

Stable entry: `route:/facilities/[id]`. Scope: **CS-05**. Owner: Dean Fiedler.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d` (imported register entry). Native source: [PR #274](https://github.com/deanrfiedler-gif/powerplants-one/pull/274), merged to main as `ab96e2b` on 22 September 2026. Route: `/facilities/[id]`.
Native implementation and adaptations are proposed for owner review; this is not a new accepted visual baseline.

## Purpose and page type

Review one canonical Facility: identity and location, structure, growing context, measurements, source and notes, related equipment and history.

r20 page type: **Record detail**. Tabs Overview, Related records and History; the owning Site link; the full record ID with Copy; Edit. A location pin is recorded through Review pin and Confirm these changes. In Related records, serving equipment is added and ended explicitly with a reason and source; the Asset keeps its own version and its installed location.

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
- [desktop-canonical-detail.png](../../../testing/evidence/cs05-native-r01/captures/desktop-canonical-detail.png) — detail after create and reload, desktop
- [phone-canonical-detail.png](../../../testing/evidence/cs05-native-r01/captures/phone-canonical-detail.png) — detail after create and reload, phone (emulated)
- [desktop-related-equipment.png](../../../testing/evidence/cs05-native-r01/captures/desktop-related-equipment.png) — Related records with installed equipment, desktop
- [phone-service-ended.png](../../../testing/evidence/cs05-native-r01/captures/phone-service-ended.png) — accepted end of an equipment service membership, phone (emulated)
- [desktop-pin-review.png](../../../testing/evidence/cs05-native-r01/captures/desktop-pin-review.png) — location pin review, desktop
- [phone-pin-review.png](../../../testing/evidence/cs05-native-r01/captures/phone-pin-review.png) — location pin review, phone (emulated)

Captures are synthetic observations of candidate `5f6e683` (22 September 2026). The implementing agent visually inspected the views listed in the handover; none is an owner-accepted baseline. The full set, with hashes, is in the [capture manifest](../../../testing/evidence/cs05-native-r01/capture-manifest.json).

## Verification and acceptance

[ADR-0037](../../../decisions/ADR-0037-cs05-facilities-native.md) records the decision. The [CS-05 handover](../../../delivery/facilities-growing-areas-handover.md) and [candidate evidence](../../../testing/evidence/cs05-native-r01/README.md) record executed behaviour, captures, source hashes and limits; the [80-case matrix](../../../testing/evidence/cs05-native-r01/acceptance-matrix.md) marks partial cases. The page guide `guide.page.facilities.id` is still the imported draft and has not been rewritten for the native workflow. Owner visual and business acceptance, screen-reader and physical-device checks, external map handoff and the browser search timing budget remain outstanding. Hosted deployment is not verified here.
