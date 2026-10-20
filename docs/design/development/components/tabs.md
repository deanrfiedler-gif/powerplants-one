# Record navigation and panels

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Catalogue key:** `tabs` · **Review:** Pending

Real RecordTabs and RecordPanel with controlled selection and directional keyboard navigation.

## Source and reference

Design: [powerplants-one-theme-style-board-r22.html](../../../reference/ui/theme-style-board/powerplants-one-theme-style-board-r22.html#page-layouts). Retained design reference; paired acceptance not recorded.

The application implementation and exact consumer bindings are maintained in `../components.json`. The live catalogue links the current checkout and computes dependency fingerprints.

## Figma components

**Status:** Mapped · **Location:** Components › Record, in the private "PPO - Design" Figma file

- Record / View tab `312:16`
- Wizard / View tabs `395:3916`

Wizard / View tabs (Estimating parts) composes Record / View tab for the ES-02 workspace views. The mapping is kept in `../components.json` (`figma`); node IDs are stable, and the file link stays out of this repository (ADR-0053). It records where the design component is, not visual alignment or review.

## Desktop

Arrow keys, Home and End select/focus tabs. Each tab labels its corresponding panel.

## Mobile

Confirm wrapped or scrolling tabs keep the selected label and focus visible.

## Keyboard and accessibility

Tab/Shift+Tab and visible focus throughout. Use arrows/Home/End in tabs or menus; Escape dismisses overlays.

## States and interaction

- **Default:** Representative synthetic content and normal interaction.

## Differences and limits

Tab variants across modules require an explicit migration decision; this example does not restyle unrelated navigation.

## Verification and maintenance

Review at 1440 × 960, 1024 × 768, 820 × 800, 390 × 844 and 320 × 700 where relevant; check browser zoom and keyboard operation separately. Compare the same state and viewport with the retained reference. Record exact commit, reviewer, date, fixture state, viewport, result and evidence paths in the component review record. Automated source fingerprints do not grant acceptance.

Changes to the source, styles, fixtures, specification or reference invalidate prior evidence. Update this master and its component record in the same pull request. Keep app business checks separate from catalogue presentation checks.

## CS native receiving

The maintained consumer bindings include the native Customer, Contact, Stakeholder, Readiness, Account Development and Survey pages where this control is actually used. Existing catalogue states illustrate the shared control; they do not reproduce the full CS workflow or server decisions. The [CS evidence](../../../testing/evidence/cs-native-completion/README.md) and owning page guides record real workflow checks and inspected widths. Owner/device comparison remains pending in the explicit CS alignment item.

The **Customer 360** state uses the eight native tab labels with the real RecordTabs/RecordPanel implementation. Arrow/Home/End selection and selected-panel semantics are live; source queries and URL restoration are verified on the owning Customer page, not simulated here.

## Sales handover and aftercare consumers

CR-02/03/05 reuse these controls for Save, Submit, receiving decisions and recovery. Disabled/busy and uncertain results remain distinct; background refresh preserves dirty form values. Scope-specific handlers stay in the page. Labels, native keyboard semantics and source ownership remain intact. Actual device evidence is in the Sales handover; owner acceptance is pending.

The Sales workspace fixture uses all eight CR-01 labels. Keyboard selection and horizontally scrollable phone tabs use the existing RecordTabs control; this fixture carries no business permissions or saved workflow state.


## Equipment native consumers

EQ-01 through EQ-09 reuse the shared control in their applicable register, record and evidence forms; tabs are used by EQ-01/EQ-03/EQ-04/EQ-05. Synthetic states are exercised in `tests/database/equipment.test.ts`, `tests/http/equipment.test.ts` and the Equipment browser proof. Source binding is recorded in the living register. No shared-control rendering change or visual acceptance is implied.

## Maintenance and Warranty consumers

MA-01–MA-07 now reuse this component through the native registers and record workspaces. Exact bindings are in components.json. Synthetic long labels, uncertain saves, stale versions and separate customer/recovery states are in docs/design/development/maintenance-fixtures.json and the Maintenance browser journeys. Review 1440/1024/390/320 px and guide draft retention before owner acceptance.

## NAV URL-state consumers

Deal section, Sales handover view and Engineering record view reuse validated existing URL selection. Invalid values fall back to the declared initial view and preserve unrelated query context. Estimate revision selection uses version_id with exact reader membership/access checks. Dirty and unknown-outcome work uses the shared navigation intent; Discovery retains its stronger guard. Existing RecordTabs/RecordPanel keyboard semantics remain. Inspect rendered deep links, reload and Back in the real host; catalogue snapshots do not prove server authority.

NAV CI repair: a Sales handover's validated `view` changes retain mounted dirty Brief/Review/History panels. Different records and unrelated query changes still require leave review; pending/unknown commands still prevent leaving. Receipt-owned release removes only the confirmed saving form's guard before post-save routing, without approving another form or changing server authority. Host fixtures are the existing CRM stage, Project creation and CR03 exact-successor journeys; owner/device acceptance remains pending.

Equipment's mounted Configuration/Movement/identity panels declare the same narrow retained `view` contract through useCrmCommand. The exact equipment ID, other query state and unknown-command lock remain. EQ03 browser proof checks retained r02 fields, preview, original recovery and successor identity across view changes and reload.

Pending and unknown commands may switch only these explicitly declared mounted views. The command owner, original body and draft remain mounted; a different record, unrelated query, reload or unload stays guarded at pending priority. Discovery keeps its independent stronger contract. EQ03 checks a refused Home transition, mounted view switching and original recovery together; CR03 checks an immediate successor-to-Brief transition while the command settles.

## Fertigation consumer

The existing `route:/estimating/fertigation/[id]` now uses this component within the [Figma workbench implementation](../../../decisions/fertigation-figma-implementation.md). Host fixture/state examples are maintained in [fertigation-workbench.md](fertigation-workbench.md), with FN-T118 exercising the real saved scope. The route-scoped composition does not change the shared control API. Paired owner acceptance remains open.

## ES-02 Figma consumer

The [Estimation Wizard host](estimation-journey.md) now adopts the accepted Figma record layout using this existing control. Its host fixtures cover desktop and phone save/revision continuity; source and review remain separate. The component implementation is unchanged outside the scoped ES-02 consumer.

## CS-01 native consumer — 19 October 2026

The [Organisations implementation](../../../decisions/organisations-figma-implementation.md) reuses this component under D1–D7. [Host fixtures](../organisations-native-fixtures.json) cover the changed consumer and [evidence](../../../testing/evidence/organisations-native-r01/README.md) records actual checks. Existing People/Contacts consumers remain separate. Owner visual/device review and baseline adoption are pending; no review fingerprint is replaced.

## Service requests consumer

SV-01/SV-02 reuses this component for the accepted Service requests page. Consumer bindings: `scope:SV-02`, `route:/service/tickets/[id]`. Host states and viewport evidence are tracked in [Service requests evidence](../../../testing/evidence/service-requests-accepted/README.md). Owner visual review remains pending; no shared primitive or fixture renderer changes.

`RecordTabs.disabled` keeps all tabs visible but unavailable while a consumer owns an unsaved edit form. Service requests keeps the Triage panel and its labelled relationship present until save or cancel; other consumers retain normal keyboard navigation.
