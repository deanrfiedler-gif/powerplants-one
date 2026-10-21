# Menus and selection popovers

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Catalogue key:** `menu` · **Review:** Pending

Actual WorklistChoice and WorklistMenu with selected state and keyboard operation.

## Source and reference

Design: [ppo-deal-pipeline_r38.html](../../../reference/ui/deals/ppo-deal-pipeline_r38.html). Retained design reference; paired acceptance not recorded.

The application implementation and exact consumer bindings are maintained in `../components.json`. The live catalogue links the current checkout and computes dependency fingerprints.

## Figma components

**Status:** None · **Location:** Components, in the private "PPO - Design" Figma file

No main component on the Components page yet. Page frames may draw this pattern; add a component when an accepted design needs one. Intake rules (menu) 130:1212 is page-specific, not a shared menu. The mapping is kept in `../components.json` (`figma`); node IDs are stable, and the file link stays out of this repository (ADR-0053). It records where the design component is, not visual alignment or review.

## Desktop

Open with the trigger; arrows/Home/End move through choices; Escape returns focus.

## Mobile

Popover stays within viewport bounds and closes through selection or dismissal.

## Keyboard and accessibility

Tab/Shift+Tab and visible focus throughout. Use arrows/Home/End in tabs or menus; Escape dismisses overlays.

## States and interaction

- **Default:** Representative synthetic content and normal interaction.

## Differences and limits

Native popover support is required by the current runtime. Touch and assistive-technology review remain separate.

## Verification and maintenance

Review at 1440 × 960, 1024 × 768, 820 × 800, 390 × 844 and 320 × 700 where relevant; check browser zoom and keyboard operation separately. Compare the same state and viewport with the retained reference. Record exact commit, reviewer, date, fixture state, viewport, result and evidence paths in the component review record. Automated source fingerprints do not grant acceptance.

Changes to the source, styles, fixtures, specification or reference invalidate prior evidence. Update this master and its component record in the same pull request. Keep app business checks separate from catalogue presentation checks.

## Projects Figma consumer

`route:/projects` reuses this component with scoped styling from `src/app/styles/projects-register.css`. [Decision](../../../decisions/projects-register-native.md) and [source measurements](../../projects-register/figma-measurements.json) define the requested departures: 40 px desktop rows/header and controls, pinned 44 px end cells, compact 80 px phone rows, a 240 px expanded rail and a five-item Projects phone bar. Generic consumer geometry remains intact. Native fixture/state examples are in `tests/browser/projects-register.spec.ts` (selection, export, exact snapshots, URL restoration and refused reads); this does not introduce a new isolated gallery renderer.

Use the [execution record](../../../testing/evidence/projects-register/README.md) for actual checks and visual limitations. Owner/device review stays pending; no review fingerprint is assigned by this update.

## Fertigation consumer

The existing `route:/estimating/fertigation/[id]` now uses this component within the [Figma workbench implementation](../../../decisions/fertigation-figma-implementation.md). Host fixture/state examples are maintained in [fertigation-workbench.md](fertigation-workbench.md), with FN-T118 exercising the real saved scope. The route-scoped composition does not change the shared control API. Paired owner acceptance remains open.


ES-08 Figma implementation binds the configuration and view routes to the existing shell/menu patterns. Historical runs use WorklistMenu; no other consumer behaviour is changed. See the screen-configurator-workbench host and execution evidence for fixture, phone and review limits.

## Job Pack Figma application, 13 October 2026

The [implementation decision](../../../decisions/job-pack-figma-implementation.md) binds this component to the accepted Figma Job Pack layout. Desktop uses the shared menu, register and 320 px status panel; phone uses compact register rows and coordinator Pack / Readiness / History tabs. Existing exact-content, permission, source and command contracts remain. The live host fixtures are `tests/ui/job-pack-fixture.tsx` and `job-pack-register-fixture.tsx`; states and consumer bindings are maintained in `components.json`. See [execution evidence](../../../testing/evidence/job-pack-figma-ui/README.md). Owner/device acceptance remains pending; no fingerprint is copied into a review record.

## CS-01 native consumer — 19 October 2026

The [Organisations implementation](../../../decisions/organisations-figma-implementation.md) reuses this component under D1–D7. [Host fixtures](../organisations-native-fixtures.json) cover the changed consumer and [evidence](../../../testing/evidence/organisations-native-r01/README.md) records actual checks. Existing People/Contacts consumers remain separate. Owner visual/device review and baseline adoption are pending; no review fingerprint is replaced.

## SV-06 host binding

Service review and reports uses this existing component in `route:/service/reports` and `route:/service/reports/[id]`. The accepted source is PPO - Design, Service review and reports — accepted, page 1265:53; native owner visual review remains pending. Host states and synthetic fixtures are in `tests/browser/service-reports-design.spec.ts` and `tests/helpers/service-report-fixture.ts`; existing isolated examples are unchanged. See the [SV-06 contract](../pages/scope-sv-06.md) for alignment limits and [build evidence](../../../testing/evidence/service-review-build/README.md) for executed results.

## CS-02 People register consumer — 20 October 2026

PeopleRegister uses this control on `/people` and the People view of `/contacts`. [Host fixtures](../people-native-fixtures.json) bind 1440/1024 grids, 390/320 compact phone rows and loading/empty/error/denied states; `tests/browser/people-native.spec.ts` exercises the real host. The [page contract](../pages/route-people.md) records undrawn interactions and retained legacy behaviour. Owner review stays pending; no fingerprint is copied.

## Discovery register ES-02 consumer

The `/estimating/discovery` host reuses this component under the [native register record](../../../decisions/discovery-register-native.md). Page-specific 40 px rows and phone lists stay scoped to the register. Fixtures cover loading, no matches, empty, denied, failed/retried and view-only states; see `tests/browser/discovery-register.spec.ts` and `tests/helpers/discovery-register.ts`. Owner visual review is pending; the shared implementation is not granted new approval.

## PL-02 Field team consumer

`scope:PL-02`, `/service/technicians` and `/service/technicians/[id]` reuse this control. The shared implementation is unchanged. Host states and deterministic synthetic fixture: `tests/browser/field-team.spec.ts`, `tests/helpers/field-team-fixture.ts`. The accepted Field team variant uses a 40 px grid, phone rows and read-only panels; column settings is undefined and disabled. Owner alignment remains pending; see [build evidence](../../../testing/evidence/field-team-build/README.md). No review fingerprint is recorded.

## Sites CS-04 consumer

The Sites register and record reuse this component. Scoped geometry and state evidence live in `src/app/styles/sites.css` and `tests/browser/sites-native.spec.ts`. Counts and sources remain permission scoped, P4 is unavailable and owner visual review is pending. See [Sites implementation](../../../delivery/sites-cs04-build.md) for adaptations and executed checks.

## FI-06 consumer

The accepted Incidents page reuses this control without changing its shared implementation. Host states and responsive examples: `tests/browser/incidents-design.spec.ts`, `tests/helpers/incident-design-fixture.ts`; actual commands: `tests/browser/field-incidents.spec.ts`. See [FI-06 working contract](../pages/scope-fi-06.md) for differences, handovers and pending owner review.


## PL-04 consumer

The integrated stylesheet keeps shared footer styling on `.mw-foot` in both workspace scopes. A root selector would prevent the My Work content scroller from shrinking with the viewport; `tests/browser/my-work.spec.ts` retains its original short-height scrolling and menu-collapse preservation proof. No menu behaviour or review acceptance changes.

Changes and follow-up (`/schedule/changes`) and Policy impact (`/schedule/policy-impact`) reuse this family. Host fixtures in `tests/browser/changes-follow-up.spec.ts` cover the drawn desktop/tablet/390/320 layouts, current/unavailable reads, exact handovers and permission states. No shared runtime variant or approval is added. The page contracts and PL-04 build evidence record alignment differences; owner visual review remains pending.

SV-04 retains the existing global More control beside its phone record-action dock. It must remain reachable after the header becomes Back; Account and module navigation cannot depend on clicking a temporary loading header. Exact host fixture: tests/browser/appointment-detail.spec.ts at 390/320, including pointer opening and Escape focus return. Owner visual review of this host adaptation remains pending.
