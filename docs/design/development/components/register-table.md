# House register table

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Catalogue key:** `register-table` · **Review:** Pending

The shared register: a flush table with a grey sortable header, pinned checkbox and key columns, row emphasis, state chips, an empty message and a footer.

## Source and reference

Implemented baseline: EN-06's owner-refined materials register of 20 September 2026, made shared without visual change (ADR-0051, group 2, item 1). Pattern reference: [EN-07 r03 desktop mockup](../../../reference/ui/engineering-changes/PPO-EN-07-Engineering-Change-Impact-Review-Desktop-UI-Mockup-r03.png), the "house register pattern" of the [Service requests refinement](../../../decisions/service-requests-native-refinement.md). Paired acceptance not recorded.

The application implementation and exact consumer bindings are maintained in `../components.json`. The live catalogue links the current checkout and computes dependency fingerprints.

## What the host supplies

- `RegisterTable`: `caption` (read by assistive technology only), `variant` (`"register"`, the default, or `"panel"`), `stale`, `wide`, `empty` and `footer`, with the table's `thead` and `tbody` as children.
- `RegisterSortHeader`: `label`, `direction` (`"ascending"`, `"descending"` or none) and `onSort`. A header that does not sort is a plain `th` holding `<span className="ppo-register-label">`.
- Rows: mark them with `data-inspected`, `data-selected` and `data-removed`. Pinned columns use `ppo-register-check` (the checkbox) and `ppo-register-key` (the identifier after it). The one column that wraps uses `ppo-register-wrap`; `wide` gives it 360 px. Cell content uses `ppo-register-row-title` (a button or link that opens the row) and `ppo-register-sub` (a smaller grey sub-line).
- `RegisterEmpty` (`title` and a message) and `RegisterFooter` (count, selection, `ppo-register-spacer`, paging).
- `RegisterChip`: `tone` (`neutral`, `attention`, `positive`, `negative`) and an optional `icon` from the host's icon set. Show a check only for a completed positive state and a warning only where someone must act.

## Figma components

**Status:** Mapped · **Location:** Components › Grid, in the private "PPO - Design" Figma file

- Grid / Header cell `74:13`
- Grid / Cell `74:40`
- Grid / Checkbox `74:47`
- Grid / Checkbox cell `74:48`
- Grid / Row actions cell `74:50`
- Grid / Done cell (proposed) `408:430`
- Grid / Group band (proposed) `2651:7352`
- Grid / List row (phone, proposed) `2651:7385`

Module row and header pairs (for example Work order grid row 196:24549) are composed from these cells and sit in the module parts sections. Grid / Group band (proposed) spans the select and settings columns in its group's colour, and Grid / List row (phone, proposed) is the drawn candidate for the register-table-phone gap; the Figma file audit (R6, 25 October 2026) drew them, and no accepted page uses them yet. The mapping is kept in `../components.json` (`figma`); node IDs are stable, and the file link stays out of this repository (ADR-0053). It records where the design component is, not visual alignment or review.

## Desktop

Flush to its pane in one horizontal scroller: no exterior padding, frame or radius. Grey 43 px sentence-case header with column rules; 50 px rows (48 px in a panel). Opening a row inspects it and ticking its checkbox selects it; the two are independent. Sort state is in aria-sort. The footer states the count, the selection and paging.

## Mobile

At 780 px and below the key column unpins and the table scrolls sideways with only the checkbox pinned. Check 390 and 320 px for readable text, reachable selection and a footer that wraps.

## Keyboard and accessibility

Sort buttons, row-title buttons and checkboxes are native, labelled controls with the shared focus ring. A row opens from its title, so inspecting never needs a pointer; the row click is only a larger target.

## States and interaction

- **Default:** A sorted column, one inspected row, one selected row, a removed row and all four chip tones.
- **Panel:** The variant inside a working-page panel: plain headers, 48 px rows and no row pointer.
- **No matches:** Rows exist but none match; the message says how to bring them back.
- **Loading:** First read in progress: no rows, and no result is inferred.

## Specificity

`src/components/ui/register-table.css` starts every rule with `:is(.ppo-register, #ppo-shared)` (or the chip or footer root). No element carries `#ppo-shared`. Inside `:is()` it gives each rule an id's weight, so the table keeps its look against the id-scoped element resets of the shared workspaces (`#ppo-… button { padding: 0 }` in `my-work.css`) and the global `button:hover` rule. A module that must adjust the table on purpose uses its scope id with a class. The stylesheet loads after the module stylesheets, so the chip's icon size wins its tie with a workspace's own icon rule.

Class names: `ppo-register-title` already exists in `shared-layout.css` as a visually hidden register page heading, so the row title is `ppo-register-row-title`. Check for a collision before adding a class here.

## Differences and limits

No sticky header, scroll edge shadows, column resizing or phone row layout yet. The host owns data, sorting, paging and selection, and supplies chip icons from its own icon set.

## Verification and maintenance

Review at 1440 × 960, 1024 × 768, 820 × 800, 390 × 844 and 320 × 700 where relevant; check browser zoom and keyboard operation separately. Compare the same state and viewport with the retained reference. Record exact commit, reviewer, date, fixture state, viewport, result and evidence paths in the component review record. Automated source fingerprints do not grant acceptance.

Changes to the source, styles, fixtures, specification or reference invalidate prior evidence. Update this master and its component record in the same pull request. Keep app business checks separate from catalogue presentation checks.

When a module adopts the table, record its departures first, keep its tests' behaviour, and remove its copy of the rules in the same PR.

## Projects Figma consumer

`route:/projects` reuses this component with scoped styling from `src/app/styles/projects-register.css`. [Decision](../../../decisions/projects-register-native.md) and [source measurements](../../projects-register/figma-measurements.json) define the requested departures: 40 px desktop rows/header and controls, pinned 44 px end cells, compact 80 px phone rows, a 240 px expanded rail and a five-item Projects phone bar. Generic consumer geometry remains intact. Native fixture/state examples are in `tests/browser/projects-register.spec.ts` (selection, export, exact snapshots, URL restoration and refused reads); this does not introduce a new isolated gallery renderer.

Use the [execution record](../../../testing/evidence/projects-register/README.md) for actual checks and visual limitations. Owner/device review stays pending; no review fingerprint is assigned by this update.

## Fertigation consumer

The existing `route:/estimating/fertigation/[id]` now uses this component within the [Figma workbench implementation](../../../decisions/fertigation-figma-implementation.md). Host fixture/state examples are maintained in [fertigation-workbench.md](fertigation-workbench.md), with FN-T118 exercising the real saved scope. The route-scoped composition does not change the shared control API. Paired owner acceptance remains open.

## Job Pack Figma application, 13 October 2026

Job Pack adopts 40 px rows and headers, 32 px visit-group rows, 44 px sticky selection/action columns and a separate compact phone list. Its reference buttons remain text controls. The component fixture builder includes every relative CSS import from the application layout, including shared controls and this table; presentation assertions check caption hiding, group alignment and reference/menu colours.

The [implementation decision](../../../decisions/job-pack-figma-implementation.md) binds this component to the accepted Figma Job Pack layout. Desktop uses the shared menu, register and 320 px status panel; phone uses compact register rows and coordinator Pack / Readiness / History tabs. Existing exact-content, permission, source and command contracts remain. The live host fixtures are `tests/ui/job-pack-fixture.tsx` and `job-pack-register-fixture.tsx`; states and consumer bindings are maintained in `components.json`. See [execution evidence](../../../testing/evidence/job-pack-figma-ui/README.md). Owner/device acceptance remains pending; no fingerprint is copied into a review record.

Job Pack uses each active read's loading/error state and observation time for counts and freshness. An unavailable packless-visit read cannot display zero; its own retry restores the visit count. Visit discovery offers preparation and planner handovers, while pack CSV export and pack selection remain in pack views. `tests/browser/job-pack-integration.spec.ts` exercises a failed read, a held loading response and recovery to one eligible visit on desktop and phone.

Job Pack's standalone phone `RegisterEmpty` is styled in `job-pack-figma.css`: title and recovery action remain separate with a 40/20 px inset and a 44 px planner-link target. The desktop wrapper and other register consumers retain their shared rules. The existing `job-pack-register-fixture.tsx?empty=1` fixture covers this host state; hosted verification found the original missing wrapper-dependent spacing at 390/320 px. Owner/device acceptance is still pending.

## CPQ consumers

The configuration and rule registers/workbenches reuse this implementation. CPQ-scoped styling and fixture states are documented in [the host contract](cpq-workbench.md); source behaviours and existing gallery fixtures are unchanged. tests/browser/cpq.spec.ts supplies the real synthetic host. Paired visual and owner acceptance remain separate.

## Products discovery consumer — 14 October 2026

PD-01 reuses the secondary menu and RegisterTable. Shared CSS adds only #ppo-products:where([data-catalogue]), retaining selector specificity for other consumers. Catalogue styles use a white compact header, model/variant rows and a separate full-width phone list. Host fixture/state examples: tests/browser/products-discovery.spec.ts (filtered/empty/unavailable, selected return, scope reset, responsive menu focus). [Decision](../../../decisions/products-discovery-proposal.md) and [evidence](../../../testing/evidence/products-discovery/README.md) retain owner/device acceptance as pending.

## CS-01 native consumer — 19 October 2026

The [Organisations implementation](../../../decisions/organisations-figma-implementation.md) reuses this component under D1–D7. [Host fixtures](../organisations-native-fixtures.json) cover the changed consumer and [evidence](../../../testing/evidence/organisations-native-r01/README.md) records actual checks. Existing People/Contacts consumers remain separate. Owner visual/device review and baseline adoption are pending; no review fingerprint is replaced.

## Service requests consumer

SV-01/SV-02 reuses this component for the accepted Service requests page. Consumer bindings: `scope:SV-01`, `route:/service/tickets`. Host states and viewport evidence are tracked in [Service requests evidence](../../../testing/evidence/service-requests-accepted/README.md). Owner visual review remains pending; no shared primitive or fixture renderer changes.


## Facilities CS-05 consumer

The four `/facilities` routes and `scope:CS-05` reuse this control. Host states and synthetic fixtures are in `tests/browser/facilities-accepted.spec.ts` and `tests/helpers/facilities-design.ts`. No shared control contract is changed. Owner visual review remains pending; see `docs/testing/evidence/cs05-accepted-build/README.md`.

## SV-06 host binding

Service review and reports uses this existing component in `route:/service/reports`. The accepted source is PPO - Design, Service review and reports — accepted, page 1265:53; native owner visual review remains pending. Host states and synthetic fixtures are in `tests/browser/service-reports-design.spec.ts` and `tests/helpers/service-report-fixture.ts`; existing isolated examples are unchanged. See the [SV-06 contract](../pages/scope-sv-06.md) for alignment limits and [build evidence](../../../testing/evidence/service-review-build/README.md) for executed results.

## CS-02 People register consumer — 20 October 2026

PeopleRegister uses this control on `/people` and the People view of `/contacts`. [Host fixtures](../people-native-fixtures.json) bind 1440/1024 grids, 390/320 compact phone rows and loading/empty/error/denied states; `tests/browser/people-native.spec.ts` exercises the real host. The [page contract](../pages/route-people.md) records undrawn interactions and retained legacy behaviour. Owner review stays pending; no fingerprint is copied.

## Discovery register ES-02 consumer

The `/estimating/discovery` host reuses this component under the [native register record](../../../decisions/discovery-register-native.md). Page-specific 40 px rows and phone lists stay scoped to the register. Fixtures cover loading, no matches, empty, denied, failed/retried and view-only states; see `tests/browser/discovery-register.spec.ts` and `tests/helpers/discovery-register.ts`. Owner visual review is pending; the shared implementation is not granted new approval.

## CS-08 Site surveys consumer

The existing control is reused by /surveys and /surveys/[id]. Host states and widths are declared in [site-surveys-fixtures.json](../site-surveys-fixtures.json); see [page contract](../pages/scope-cs-08.md) and [execution evidence](../../../testing/evidence/site-surveys-native/README.md). No owner review is inferred. No new public control API is introduced for this consumer.

## PL-02 Field team consumer

`scope:PL-02`, `/service/technicians` and `/service/technicians/[id]` reuse this control. The shared implementation is unchanged. Host states and deterministic synthetic fixture: `tests/browser/field-team.spec.ts`, `tests/helpers/field-team-fixture.ts`. The accepted Field team variant uses a 40 px grid, phone rows and read-only panels; column settings is undefined and disabled. Owner alignment remains pending; see [build evidence](../../../testing/evidence/field-team-build/README.md). No review fingerprint is recorded.

## Sites CS-04 consumer

The Sites register and record reuse this component. Scoped geometry and state evidence live in `src/app/styles/sites.css` and `tests/browser/sites-native.spec.ts`. Counts and sources remain permission scoped, P4 is unavailable and owner visual review is pending. See [Sites implementation](../../../delivery/sites-cs04-build.md) for adaptations and executed checks.

## FI-06 consumer

The accepted Incidents page reuses this control without changing its shared implementation. Host states and responsive examples: `tests/browser/incidents-design.spec.ts`, `tests/helpers/incident-design-fixture.ts`; actual commands: `tests/browser/field-incidents.spec.ts`. See [FI-06 working contract](../pages/scope-fi-06.md) for differences, handovers and pending owner review.

## Inspections consumer — 21 October 2026

FI-04 uses RegisterTable, RegisterChip, RegisterEmpty and RegisterFooter for the accepted inspection review register, with a 40 px local row/header variant. It opens the permitted procedure/attempt and retains the shared horizontal scroller. FI-03 uses the shared state chip in its worklist. No bulk-selection or column-settings command is invented; those behaviours remain unspecified in the page contract. Owner visual review remains pending. See [Service inspections](service-inspections.md) and the four FI-03/FI-04 consumer bindings in components.json.


## PL-04 consumer

Changes and follow-up (`/schedule/changes`) and Policy impact (`/schedule/policy-impact`) reuse this family. Host fixtures in `tests/browser/changes-follow-up.spec.ts` cover the drawn desktop/tablet/390/320 layouts, current/unavailable reads, exact handovers and permission states. No shared runtime variant or approval is added. The page contracts and PL-04 build evidence record alignment differences; owner visual review remains pending.


Reviews & approvals consumes this shared control at `route:/estimating/reviews`; see the [page-specific composition and states](../pages/route-estimating-reviews.md). Existing consumers and review records remain independent.

## AD-01 identity register host

The `/admin/access` register reuses this component with the accepted 60 px toolbar, 40 px grid and compact phone rows. Host states and consumer bindings are in [the fixture inventory](../access-identity-register-fixtures.json); [execution evidence](../../../testing/evidence/access-identity-register/README.md) distinguishes real database/HTTP checks from the visual-only Figma fixture. Existing component behaviour and review records remain unchanged. Owner/device/screen-reader acceptance is pending.
