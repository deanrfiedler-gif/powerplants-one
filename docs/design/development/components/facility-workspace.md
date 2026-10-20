# Facilities and growing areas workspace

Stable component: `facility-workspace`. CS-05 page-local composition; owner Dean Fiedler, owner visual review pending.

## Implementation and examples

`FacilityRegister`, `FacilityRecordLayout` and `FacilityFormEntry` bind existing controls on the four Facilities routes. The source/consumer bindings are in components.json. `tests/helpers/facilities-design.ts` supplies UI-only synthetic Bay 4 data and `tests/browser/facilities-accepted.spec.ts` exercises register, hierarchy, snapshot, loading/empty/error/denied, view-only, review, conflict and original-operation recovery. No production adapter or new seed is implied.

## Desktop

Use the accepted ruled grid, native read-only snapshot dialog, shared shell and compact phone header. Desktop record details occupy 380 px; phone record cards and saved/proposed values stack at 390/320 px. Buttons, fields, tabs, lookup and feedback remain shared controls. No green fill is placed on navy.

## Mobile

At 390/320 px, use the compact phone header, stacked cards and comparison, with reachable record actions.

## Keyboard, state and authority

RecordTabs keeps arrow-key operation. Native dialogs own modal focus, Escape and opener return; the comparison receives focus and requires acknowledgement. Source rows disclose the existing reported-note form. Identity denial removes protected records. Side-menu and filter counts use existing site visibility. Uncertain writes retain the original command identity; no durable offline draft is supplied.

## Figma components

PPO - Design, named version Facilities and growing areas — accepted. Page-local grid header `1415:358287` and row `1415:358302`; all frame/state IDs and retained image references are in the CS-05 page contracts. No private file link or Pro artwork is stored.

## Alignment and limitations

See the page contracts and `docs/testing/evidence/cs05-accepted-build/README.md` for actual checks and visual differences. Closest-name ranking and retained register previous/next context are unspecified. Sources/History/pin/service dialogs retain the native layout. Physical-device and owner review remain pending, separate from automated proof and deployment.
