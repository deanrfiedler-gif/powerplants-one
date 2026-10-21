# Field technicians — design reference

Stable entry: `route:/service/technicians`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/service/technicians`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Native workflow

Page type: **Record detail with existing register**. Canonical destination: `/service/technicians`. Source authority: [PPO-SCHED-ADR](../../../decisions/scheduling-resources-architecture.md).

1. Keep Field Team Visits, Technicians and Needs preparation views. In Technicians, choose Availability & competence; the resource name in Planner also opens detail.
2. Select a seven-day review window. Inspect permitted site eligibility, active/publication state, source-as-at, effective dates and calendar version/timezone.
3. Review weekly intervals, exceptions, unavailable/other-work blocks and anonymous busy reservations. Open permitted appointment records for commitments and retained history.
4. Check skill status, validity and review evidence. Expired, not-yet-valid, expiring-within-period and unknown evidence stay explicit.

Resource/calendar/competence mutation is unavailable. Synthetic skills are not statutory certificates; certificate/renewal evidence remains Unknown. No private HR fields are added.

## Desktop

Accepted design: the [Field team design decision](../../../decisions/field-team-figma-design.md) of 18 October 2026, with captures 01–02 (desktop 1440 × 900) and 05 (tablet 1024) in [design r01](../../../reference/ui/service/field-team-design-r01/README.md).

- **Register:** the Work orders grid, one row per person (D1). Columns: Technician, Role, Hours today, Competence (each skill's state for the seven days from the selected day), Visits today, First scheduled visit, Resource status, Time zone, Calendar and Coordinator handover. The toolbar keeps Search technicians, the day, All permitted sites, the time zone, the read time and Refresh.
- **Views:** Technicians (default, Q1), Visits and Needs preparation in the side menu, then a People group with Active, Away today, Inactive and Competence to review (D2).
- **People:** the planner's purple avatar, role and one total, with no bars; people on leave or inactive sit last, dimmed (D3). Q3 uses resource type until a role is published; Q4 reuses the planner calculation.
- **Snapshot:** a row opens the large snapshot with View visits and Availability & competence (D4).
- **Shell:** use the existing rail and compact phone header. Conversations is outside this build.
- Native build authorised by Dean on 21 October 2026; owner visual review pending.

Keep the accepted Field Team Visits, Technicians and Needs preparation views. Availability & competence opens a specific resource. Detail uses the accepted ruled details column, availability tracks, skill evidence and permitted commitments; resource identity, seven-day window and source versions stay explicit.

## Mobile

Accepted design: captures 06, 07 and 10 in [design r01](../../../reference/ui/service/field-team-design-r01/README.md). List rows with the avatar, name and one total, the role and today's visits, and one status line with an icon. The date, read time and refresh stay reachable at 390 and 320 px. Field team is reached from More. Five states: loading, no matches with removable filter chips, could not load, view only, and an incomplete result.

Stack resource evidence cards without hiding interval, validity or unknown-evidence text. Date and refresh controls remain reachable at 390 x 844 and 320 CSS px. Long UUIDs and hashes wrap. Existing Field Team filters and record navigation remain available. Review native 200% browser zoom separately; CSS-width reflow is not a substitute.

## Shared components and states

FieldTeamScreen, ResourceWorkspaceScreen, shared shell/SchedulingNavigation, Field, ReadState, Stamp and Button. No operational source editor is introduced.

Loading, empty/filtered empty, failed and denied reads remove prior evidence. Words identify Unknown and source completeness. These review pages have no source-mutation save action; analytical state is explicitly disposable.

## Handovers and authority

Incoming: exact permitted resource identity and selected review date from Planner or Field Team. Outgoing: permitted site/appointment records and retained booking history. Source publication history beyond the returned bundle, certificates and renewal evidence remain unavailable/Unknown.

## Visual references and verification

Accepted Figma design: [Field team design r01 captures](../../../reference/ui/service/field-team-design-r01/README.md) (ten icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/field-team-figma-design.md). Images of the Visits and Needs preparation views in this layout, desktop register states and hover states are still missing.

[Field Team r04](../../../reference/ui/field-technicians/powerplants-one-field-technicians-r04.html) is the retained predecessor; the accepted successor is [r05](../../../reference/ui/field-technicians/powerplants-one-field-technicians-r05.html), whose [change record](../../../reference/ui/field-technicians/powerplants-one-field-technicians-r05-change-record.md) records that acceptance. Native parity remains a separate review. The accepted Figma person frames supersede the older generic resource-detail arrangement.

[Executed checks, inspected captures and remaining review](../../../testing/evidence/scheduling-resources/README.md) identify the exact evidence. Draft guides, source presence, functional proof, owner visual acceptance and deployment remain separate. No review fingerprint is adopted by this edit.

## Canonical Job Pack handover

JobPackEntry reuses shared buttons and ReadState. The current server read chooses Open job pack or permitted Prepare job pack with the exact appointment identity. No visible pack is distinct from a denied read (access-unavailable status) and a failed request (shared error alert). Refresh hides prior links; no denial grants access. Desktop/phone text wraps and 44 px controls remain within the existing panel or trapped drawer. [I5 handover](../../../delivery/job-pack-integration-handover.md) records evidence; the existing appointment/booking authority is unchanged.

## Post-merge refinement

Field Team now honours incoming day, site and display timezone and retains those controls on reload. Its default without a date remains today. Availability & competence and Back to Field Team retain day/site/timezone. Resource detail exposes a Review timezone selector for its seven-day window; published calendar timezone remains explicit and unchanged. No source editor is added.

[Refinement verification](../../../testing/evidence/scheduling-refinement/README.md) records actual checks and review limits. Visual status remains Needs review; no fingerprint is adopted.

## Native Field team build — 21 October 2026

Authority: [accepted D1–D8 and Q1–Q5](../../../decisions/field-team-figma-design.md), with the current implementation request and [build interpretation](../../../decisions/field-team-native-build.md). Scope remains PL-02; parent SVC-04/05 trace remains unchanged. Owner visual review: **pending**.

Live source inspected: **PPO - Design**, named version **Field team — accepted**, page `1289:54`; index row `1318:307196`, notes `1295:5240`, parts `1292:54`. Desktop register `1295:4183`, snapshot `1295:4405`, person `1295:4633`, evidence `1302:4533`; tablet `1295:4833`; phone register `1295:4892` / `1307:5242`, person `1295:4933` / `1310:307367`; loading `1295:5069`, no matches `1295:5108`, failed `1295:5132`, view only `1310:309552`, incomplete `1310:309369`. Exact retained icon-free references remain [captures 01–10](../../../reference/ui/service/field-team-design-r01/README.md), unchanged.

The native register uses a flush compact 40 px grid, 240 px secondary menu at desktop and collapsed menu at 1024 px. At 390/320 px it uses the shared compact phone header and person rows. The full record uses the accepted details/main columns; on phones: controls, seven day strips, competence, visits, sites, resource/calendar, with fixed handover actions. Source data is read-only. No save, validation or confirmation workflow is introduced. Site/appointment details remain permission-scoped; busy time can remain anonymous.

Reused: SecondaryMenuFrame/useSecondaryMenu, compact phone header/usePhoneHeader, record identity, RegisterTable, Button/ButtonLink, WorklistMenu/WorklistPanel, ProductIcon and existing mapped MyWork Icon, useResource/ReadState/Stamp. Page-local TeamDialog/fields/avatar/availability/evidence are compositions, not new shared library components. Legacy Visits and Needs preparation retain their r05 content and job-pack handovers under the new menu. Shared geometry/tokens are unchanged; page-scoped compact sizes and the accepted planner purple/availability colour palette are explicit local variants.

Unknowns/departures: no published role (resource type fallback); no reviewer-name read (ID); no certificate/renewal or deeper publication history; disabled column settings because persistence/behaviour is unspecified. Source fixtures can differ from the composition's example names/totals. No images exist for the new-shell Visits/Needs preparation content, filter/menu contents, tablet person page or phone evidence sheet; these use existing controls and responsive reflow without claiming a separately accepted composition. Conversations is out of scope. No offline caching or mutation support is claimed.

[Build checks and visual differences](../../../testing/evidence/field-team-build/README.md) record execution separately from owner acceptance and deployment. No review fingerprint is adopted.

The later [phone header amendment](../../../decisions/phone-header-amendment.md) P3 applies: the shared header shows position/navigation, while the person name, role and status remain in the page content. This is an explicit adaptation from the earlier person header drawing. Date controls use the existing native date input; their browser-specific date format differs from the drawn text picker. The tablet reference is compared with the existing primary rail collapsed by its control.
