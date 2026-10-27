# Modal dialogs

SC-01–SC-10 reuse WorklistPanel for native record, observation and allocation forms, including focused receipt/pick/POD capture. Existing catalogue fixtures and shared rendering are unchanged. The host retains dirty proposals on refused saves, confirms deliberate close, restores focus, and preserves unknown operations separately. Verify long labels and modal containment at 320 px in `tests/browser/supply.spec.ts`; executed evidence is recorded in the Supply Chain handover, separately from owner acceptance.

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Catalogue key:** `dialog` · **Review:** Pending

Actual WorklistPanel with editable content, confirmation, Escape and focus return.

## Source and reference

Design: [ppo-deal-pipeline_r38.html](../../../reference/ui/deals/ppo-deal-pipeline_r38.html). Retained design reference; paired acceptance not recorded.

The application implementation and exact consumer bindings are maintained in `../components.json`. The live catalogue links the current checkout and computes dependency fingerprints.

## Figma components

**Status:** Partial · **Location:** Components › Job pack, in the private "PPO - Design" Figma file

- Job pack / Decision dialog `302:5359`

The only drawn dialog is the page-scoped Job pack decision dialog; no shared modal component. The mapping is kept in `../components.json` (`figma`); node IDs are stable, and the file link stays out of this repository (ADR-0053). It records where the design component is, not visual alignment or review.

## Desktop

Opening creates a modal focus boundary. Confirm is local to the example; close and Escape return to the opener.

## Mobile

Inspect the dialog at phone width with long content and browser zoom; keep Close and Done reachable.

## Keyboard and accessibility

Tab/Shift+Tab and visible focus throughout. Use arrows/Home/End in tabs or menus; Escape dismisses overlays.

## States and interaction

- **Default:** Representative synthetic content and normal interaction.

## Differences and limits

Other module dialogs are still independent implementations; this does not declare one universal dialog contract adopted.

## Verification and maintenance

Review at 1440 × 960, 1024 × 768, 820 × 800, 390 × 844 and 320 × 700 where relevant; check browser zoom and keyboard operation separately. Compare the same state and viewport with the retained reference. Record exact commit, reviewer, date, fixture state, viewport, result and evidence paths in the component review record. Automated source fingerprints do not grant acceptance.

Changes to the source, styles, fixtures, specification or reference invalidate prior evidence. Update this master and its component record in the same pull request. Keep app business checks separate from catalogue presentation checks.

## Page-scoped Job Pack variant

The [Job Pack dialog](job-pack-dialog.md) is separately inventoried with its actual pack consumers and state fixtures. I4 adds explicit Tab containment, including Shift+Tab from the focused heading. It retains r03 styling and does not change WorklistPanel or claim one universal dialog contract.

## SV-06 host binding

Service review and reports uses this existing component in `route:/service/reports`. The accepted source is PPO - Design, Service review and reports — accepted, page 1265:53; native owner visual review remains pending. Host states and synthetic fixtures are in `tests/browser/service-reports-design.spec.ts` and `tests/helpers/service-report-fixture.ts`; existing isolated examples are unchanged. See the [SV-06 contract](../pages/scope-sv-06.md) for alignment limits and [build evidence](../../../testing/evidence/service-review-build/README.md) for executed results.

The report record's exact-response sheet is page-local native `dialog`, not a new shared component. It keeps a modal focus boundary, focused heading, guarded Escape/Cancel, opener return and a pinned phone save bar. Customer unavailable selects the existing response choice without submitting it. Subject, separate stated name/role, optional mark and capture-time controls remain explicit because the existing command distinguishes them.

## CS-02 People register consumer — 20 October 2026

PeopleRegister uses this control on `/people` and the People view of `/contacts`. [Host fixtures](../people-native-fixtures.json) bind 1440/1024 grids, 390/320 compact phone rows and loading/empty/error/denied states; `tests/browser/people-native.spec.ts` exercises the real host. The [page contract](../pages/route-people.md) records undrawn interactions and retained legacy behaviour. Owner review stays pending; no fingerprint is copied.

## Discovery register ES-02 consumer

The `/estimating/discovery` host reuses this component under the [native register record](../../../decisions/discovery-register-native.md). Page-specific 40 px rows and phone lists stay scoped to the register. Fixtures cover loading, no matches, empty, denied, failed/retried and view-only states; see `tests/browser/discovery-register.spec.ts` and `tests/helpers/discovery-register.ts`. Owner visual review is pending; the shared implementation is not granted new approval.

## Sites CS-04 consumer

The Sites register and record reuse this component. Scoped geometry and state evidence live in `src/app/styles/sites.css` and `tests/browser/sites-native.spec.ts`. Counts and sources remain permission scoped, P4 is unavailable and owner visual review is pending. See [Sites implementation](../../../delivery/sites-cs04-build.md) for adaptations and executed checks.

## FI-06 consumer

The accepted Incidents page reuses this control without changing its shared implementation. Host states and responsive examples: `tests/browser/incidents-design.spec.ts`, `tests/helpers/incident-design-fixture.ts`; actual commands: `tests/browser/field-incidents.spec.ts`. See [FI-06 working contract](../pages/scope-fi-06.md) for differences, handovers and pending owner review.

## Inspections consumer — 21 October 2026

FI-03 reuses WizardDialog for the saved-attempt submission confirmation, including failed checks and the owned-defect consequence. FI-04 reuses it for the separate internal outcome issue confirmation. Phone presentation is a bottom sheet; the existing focus trap, Escape handling and return to opener remain shared. Pending original commands disable dismissal and repeat submission. Owner visual review remains pending. See [Service inspections](service-inspections.md) and the four FI-03/FI-04 consumer bindings in components.json.


## PL-04 consumer

Changes and follow-up (`/schedule/changes`) and Policy impact (`/schedule/policy-impact`) reuse this family. Host fixtures in `tests/browser/changes-follow-up.spec.ts` cover the drawn desktop/tablet/390/320 layouts, current/unavailable reads, exact handovers and permission states. No shared runtime variant or approval is added. The page contracts and PL-04 build evidence record alignment differences; owner visual review remains pending.


Reviews & approvals consumes this shared control at `route:/estimating/reviews`; see the [page-specific composition and states](../pages/route-estimating-reviews.md). Existing consumers and review records remain independent.

## AD-01 identity register host

The `/admin/access` register reuses this component with the accepted 60 px toolbar, 40 px grid and compact phone rows. Host states and consumer bindings are in [the fixture inventory](../access-identity-register-fixtures.json); [execution evidence](../../../testing/evidence/access-identity-register/README.md) distinguishes real database/HTTP checks from the visual-only Figma fixture. Existing component behaviour and review records remain unchanged. Owner/device/screen-reader acceptance is pending.

## Outputs consumer — DK-03

The Outputs register and exact issue records reuse this component. Host states: tests/browser/output-workspace.spec.ts and tests/helpers/output-workspace-fixture.ts. See [execution evidence](../../../testing/evidence/output-register/README.md). Shared behaviour is unchanged; scoped 40 px rows and record/phone geometry follow the accepted design. Owner visual/device review remains pending.
