# Buttons and action links

PL-04 policy impact adds `/schedule/policy-impact` as a consumer of the existing Button renderer for comparison and refresh. Host fixtures cover normal/loading/error and input-reset states; shared rendering and catalogue examples are unchanged. The [host contract](../pages/route-schedule-policy-impact.md) and [handover](../../../delivery/scheduling-policy-impact-handover.md) retain visual/owner acceptance separately.

SC-01–SC-10 consume Button for capture, allocation, filters and original-operation recovery. Shared rendering and catalogue fixtures are unchanged. Host tests in `tests/browser/supply.spec.ts` cover disabled, saving, saved, conflict and recovery compositions at 1440/1024/390/320 px; see the Supply Chain handover for executed results. Consumer bindings preserve Draft review and do not grant owner acceptance.

<!-- versioning: git; committed history is authoritative -->

ES-01 consumes the existing Button for filter submission and failed-read retry, and ButtonLink for permitted discovery entry. No component implementation or fixture semantics change. Inspect long action labels at 320 px; page alignment evidence remains in the Estimating programme handover.

**Owner:** Dean Fiedler · **Catalogue key:** `buttons` · **Review:** Pending

Primary, secondary, quiet, destructive, disabled, busy and link actions.

## Source and reference

Design: [powerplants-one-theme-style-board-r22.html](../../../reference/ui/theme-style-board/powerplants-one-theme-style-board-r22.html#controls). Retained design reference; paired acceptance not recorded.

The application implementation and exact consumer bindings are maintained in `../components.json`. The live catalogue links the current checkout and computes dependency fingerprints.

## Figma components

**Status:** Mapped · **Location:** Components › Controls, in the private "PPO - Design" Figma file

- Button `3:41`

Primary and Secondary styles with Default and Focus states. Quiet, destructive, busy and link variants are not drawn. The mapping is kept in `../components.json` (`figma`); node IDs are stable, and the file link stays out of this repository (ADR-0053). It records where the design component is, not visual alignment or review.

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

## Maintenance and Warranty consumers

MA-01–MA-07 now reuse this component through the native registers and record workspaces. Exact bindings are in components.json. Synthetic long labels, uncertain saves, stale versions and separate customer/recovery states are in docs/design/development/maintenance-fixtures.json and the Maintenance browser journeys. Review 1440/1024/390/320 px and guide draft retention before owner acceptance.

## FI-05 field readiness consumer

The exact assigned-visit review reuses this control without changing its shared implementation. Loading, denied, unsaved, saving, stale, unknown-result recovery and server-saved states remain distinct. Fixtures and retained-source/lost-response journeys are in tests/browser/field-readiness.spec.ts; actual visual evidence is tracked by the Field Work programme handover. Owner/device acceptance remains pending.

## FI-01 timer consumer

`WorkTimer` and `RunningTimerBanner` reuse this component on My Jobs/job detail. The real synthetic fixture is `tests/browser/field-timer.spec.ts`, including Running/Paused/Stopped, unknown original outcome and desktop/phone controls. Host scope `#ppo-work-timer` retains accepted r05 tokens. The offline workspace keeps its existing native controls and is not mapped as a React consumer. Owner/device review is outstanding; see the native timer decision and field programme handover.


Scheduling Step 4 uses this shared control contract for online booking-policy preparation and impact resolution. Consumer bindings are maintained in components.json; exact immutable evidence is supplied by the host. Unknown results preserve the original command, freeze changed evidence and provide an unchanged retry. Loading or failed reads never indicate a cleared hold. Desktop/phone and owner visual acceptance remain pending.

## FI-06 consumer

IncidentScreen uses this shared control on scope:FI-06 and its three /service/incidents routes. Host/state fixtures: tests/browser/field-incidents.spec.ts and tests/database/field-incidents.test.ts. Review dirty/conflict/uncertain, denied/restricted and reopened outcomes at 1440/1024/390/320 and actual 200% zoom; owner acceptance pending.

## FI-07 host binding

Existing /service/reports and record destination reuse this component. tests/browser/reports.spec.ts supplies the actual reviewed attendance and response fixture, empty choice, validation, saved/uncertain recovery and focus return. See [FI-07 evidence](../../../testing/evidence/field-customer-response/README.md). New buttons use shared variants; legacy review/issue buttons retain their scoped styling. Owner/device/screen-reader acceptance is pending; no review fingerprint is assigned.


## Closed-visit consumer bindings

The FI-01/FI-02/FI-05 and My Jobs hosts reuse these controls for truthful personal history; Service work-order/appointment hosts provide the existing receiving path. Reproducible host states: `tests/helpers/service-journey.ts` (closed original without own attendance and completed separate return), `tests/browser/field-closed-visit.spec.ts` (validation, stale refusal, interrupted response/reload and original continuation), and `tests/database/field-closed-visit.test.ts` (scoped/unavailable navigation and delayed cached originals). These are persisted host examples, not an isolated gallery acceptance.

Inspect readable identifiers/history, one content scroll, 1440/1024/390/320 widths, keyboard links/focus recovery and actual 200% zoom. Pending read removes current receiving actions; saved history survives. No accepted native mockup exists for this addition; timer r05 bytes remain unchanged. Review/fingerprints remain unassigned. See `docs/decisions/field-closed-visit-guidance.md` and the corresponding execution ledger.

## ES-05 consumer

The exact synthetic quotation release host reuses this control for separate preparation, approval, issue and distribution-simulation facts. Host fixtures in `tests/browser/quotation-release.spec.ts` cover explicit acknowledgement, stale entered rationale, denied evidence and original-command recovery. This consumer binding changes no shared control implementation or accepted visual baseline. See [release host specification](quotation-release.md).

## ES-06 consumer

QuotationResponse reuses this control on the exact issued-response page. Host fixtures cover pending/accepted/denied original recovery and 390/320px reflow in `tests/browser/quotation-response.spec.ts`. No shared implementation change or new visual acceptance is claimed.

## ES-07 receiving consumer

`QuotationConversion` uses this control in exact receiving, resolution, plan and original recovery. Host fixture: `tests/browser/quotation-conversion.spec.ts`. Consumer bindings and states are maintained in components.json. No shared-control behaviour changes or new global tokens. Visual/device acceptance remains pending.

## ES-07 disposition consumer

The ES-07 completed-target host uses the same Buttons for separate review and apply, immutable replacement review, and exact original recovery. Unknown outcomes disable replacement; a saved review never labels the exception resolved. Desktop/mobile and recovery fixtures: `tests/browser/quotation-disposition.spec.ts`. Exact accepted mockup images and paired owner/device review remain unavailable/pending.

## Owned Supply follow-up — SYN-ES07-03

Retain ES-07 and SC-09 scope IDs and r20 Detail workspace / Review-comparison (ES-07) and Register-worklist (SC-09). The proposed native adaptation adds a sixth receiving panel and assigned queue using the current shell. Reuse `QuotationConversion`, `QuotationSupplyFollowups`, `SupplyFollowupQueue`, shared Button/Field/SelectField/Status, validation, read-state, unsaved-change and recoverable-command controls. No shared control implementation or second scroll owner is added.

Incoming: exact completed conversion, disposition/continuing hold, triggering source evidence, demand and shared Supply graph. Outgoing: explicit owner acceptance/return/hold, immutable review, actual existing `Supply:Allocate` quantity update, native impact and receipt, and explicit fresh ES-07 disposition. Approved demand remains Approved; no cancellation, reservation release or commercial authority is implied.

Desktop shows original/current evidence and dependency disclosures before forms. Mobile at 390/320 px stacks fields, wraps identifiers and keeps recovery above forms; use 16px input text, 44px targets, labels and visible keyboard focus. Dirty proposals remain after refresh for explicit comparison. Unknown outcomes block replacement and retain original content across reload.

Host fixtures: `tests/browser/quotation-supply-followup.spec.ts` (receiving, real effects, stale comparison, denied identity, lost response, inconclusive lookup and exact retry). Shared catalogue examples remain reference-only for domain behavior. See `docs/testing/evidence/quotation-supply-followup/README.md` for actual executions/captures. Exact retained references remain `docs/reference/ui/quoting/PPO-One-Off-Item-Resolution-and-Conversion-r01.html` and `docs/reference/ui/supply-chain/PPO-Supply-Chain-Material-Readiness-r03.html`; neither proves native execution. Accepted follow-up mockup images are missing. Owner, physical-device, screen-reader review and deployment remain separate and pending; no fingerprint is promoted.

## Accepted Sales brief to native Estimating (LC-13)

The Sales handover and native Discovery hosts reuse this control with explicit create-return, fixed source comparison and exact-original recovery. Consumer bindings and synthetic states are in the register and lead-continuity-fixtures.json. Compare desktop/phone scope wrapping, keyboard controls and denied-context removal; exact new-state mockups are missing and no accepted fingerprint is assigned.

## Deal commercial evidence (LC-14)

Consumer: `src/components/commercial-quotation.tsx`, CR-01 and the Deal record. Native disclosure and shared retry/error controls expose current permission-checked issue/response/conversion facts. A denied refresh removes prior evidence; retry is explicit. Host fixtures: `tests/browser/commercial-continuity.spec.ts`. Desktop/phone and missing-image requirements remain in the live page specification; paired visual, keyboard and owner review is pending.

## Explicit outcome evidence (LC-15)

Retain CR-01 and the r20 record workspace with its existing outcome dialog. Incoming handover: permitted native quotation issue/response and the current Deal; outgoing: the exact outcome event, immutable evidence and existing Won handover due. Reuse Field, SelectField, Button, ValidationFields, ErrorNotice, shared tokens and the existing dialog/footer (retained host exception). The proposed adaptation requires an explicit native or separate evidence choice; it does not infer Won.

Show current native facts and the frozen reviewed comparison separately. Background refresh cannot replace the submitted source. Denied refresh hides prior native facts; uncertain save locks replacement and exposes original recovery. History distinguishes recorded response, latest report, changed native issue, separate evidence and historical narrative outcomes. Desktop keeps review before the save footer. At 390/320 CSS px, stack selectors and narrative, wrap long text and keep review/discard/recovery reachable; verify keyboard focus and 200% zoom separately.

Host states are in lead-continuity-fixtures.json and tests/browser/outcome-sources.spec.ts. Retain the exact HTML references above; no exact new-state mockup image is available. Functional proof does not assign an accepted fingerprint. Paired visual, owner, physical-device and screen-reader acceptance remain pending.


## Native Won receiving (LC-16)

Existing controls serve the explicit delivery comparison and native create-and-return hosts in sales-delivery-link.tsx and sales-delivery-creation.tsx. Buttons retain busy/uncertain states; fields preserve a fixed reviewed snapshot until explicit discard; denied reads remove comparison content. Native forms retain their scoped legacy controls. Fixtures: lead-continuity-fixtures.json; actual tests: tests/browser/sales-delivery-binding.spec.ts. New-state mockups and paired review remain pending; no review fingerprint is adopted.

## LC-17 reviewed follow-up back to Sales

Preserve the existing scope and r20 page type. Incoming context is an owned native Activity from Project delivery, Service/aftercare or Maintenance/renewal. Reuse Button, Field/SelectField, LocalDateTimeField, RecordLink, ErrorNotice, the existing Lead modal, native Deal form and actor-bound command journal. Original Activities, native qualification and receiving acknowledgement remain separate authorities.

From Project Sales context, record a customer need as an Internal CustomerContact Activity with an owner and date. In Activity detail, review existing Sales records, choose Lead or qualified Deal, independently capture through the native form if needed, then return for a fixed comparison and explicit link. A restricted, technical or completed original can create a separate Internal RelationshipReview with reviewed wording and its own date; preserve original restrictions and history. A Lead link can then open native next-action planning with the retained Activity selected. Qualification and the Deal initial action are never inferred. Aftercare receiving still requires its separate confirmed Deal reference.

Desktop: show original native links, current customer/site, Activity version/state/date, selected Sales reference/version and separate source attribution. Refresh cannot advance a frozen comparison. A stale save changes no record; discard and compare again. Unknown creation/link results expose original lookup and exact retry; permission loss clears protected comparisons. Project content remains in the existing dialog to preserve Gantt geometry.

Phone: stack fields and recovery controls, wrap names/references, retain readable labels and reachability of native modal actions. Keep the source context and all required review choices visible at 390/320 px. Preserve Escape/return-focus of the existing Project dialog. New LC-17 state mockups and accepted images are missing; this is a proposed host adaptation pending paired visual, keyboard/zoom, physical-device and owner review. Functional checks are recorded separately in `docs/testing/evidence/sales-followup-continuity/README.md`; no accepted fingerprint is supplied.

## Back links (phase 00 refinement batch 1)

A back link stands alone, so WCAG 2.5.8 applies. Use `ppo-back-link` (`src/app/globals.css`): an inline-flex link at least 24 px tall, or 44 px on coarse pointers, with its existing text and underline. My Work, the activity record, site readiness and the Sales worklist links use it. Record links inside running text are exempt; standalone record links are refined with their pages.


## AD-01 consumer

Native Users and access/person inspection reuses this component unchanged. States include populated/empty directory, denied/expired authority, retryable reads and current/scheduled/expired grant records. The [AD-01 evidence](../../../testing/evidence/access-inspection/README.md) records host verification; these bindings do not grant visual acceptance or change the component's existing fixture semantics.

## AD-01 capability inspection consumers

The catalogue and holder routes reuse existing controls without changing their exports. Host fixtures in `tests/browser/access-inspection.spec.ts` cover search/filter, zero grants, person context, unavailable retry and authority loss. Database fixtures cover scope, dates, inactive identities, masking and stable pages. Company ERP keys appear before same-name labels. The separate native routes adapt the retained capabilities view; owner/device/accessibility review is pending.

## AD-01 proposed-role consumers

The proposed role catalogue and person comparison reuse this control in the existing shell. SelectField applies to comparison and local-team creation; buttons, read state and status apply to both. The host fixture is tests/browser/access-roles.spec.ts, covering proposed/draft state, selected-scope match/refusal, changed selections, explicit explanation handover and denied/unavailable recovery. No isolated renderer or component export changes. See [role evidence](../../../testing/evidence/access-roles/README.md). Paired owner/device/zoom/screen-reader review remains open.

Native role-capability details summaries reuse the existing ppo-button quiet style for its 44 px target and focus treatment; native disclosure semantics remain intact. No shared CSS or export changes.

## AD-01 request consumers

The local request queue/form and independent decision record reuse this control. Host fixture: tests/browser/access-requests.spec.ts, covering exact proposal, Return/Approved, unchanged-operation recovery and authority refusals. No isolated renderer/export change. See [request evidence](../../../testing/evidence/access-requests/README.md); owner/device/zoom/screen-reader review is pending.

AD-01 application continuation: retain the existing request host and consumer bindings. The same fields/buttons/read state/status now cover Approved application, future-dated Applied outcome, immutable original recovery and denied-context clearing. Applied must not imply current effective access. See [application contract](../../../decisions/access-request-application.md); tests/browser/access-requests.spec.ts provides owning-page states. Shared exports/styles remain unchanged; paired owner/device review remains pending.

AD-01 withdrawal continuation reuses the same request consumer bindings and host fixture. Secondary reasoned closure, Withdrawn outcome, retained approval, fresh-request handover and original recovery extend the existing states. See [withdrawal contract](../../../decisions/access-request-withdrawal.md); no shared export/style change or owner acceptance.

## AD-01 team proposal consumers

The existing role catalogue adds read-only retained team examples using the same disclosure, refresh and failure controls. Host fixtures in `tests/browser/access-roles.spec.ts` cover source/current identity separation, keyboard roster disclosure, actual person links and hidden stale rosters during loading or refusal. No shared exports, styles or isolated renderer change. The existing route consumer binding remains. See [team contract](../../../decisions/access-team-inspection.md) and [evidence](../../../testing/evidence/access-teams/README.md); owner/device/zoom/screen-reader review stays open.

## Saved local team record inspection — 11 October 2026

The [local team contract](../../../decisions/access-local-teams.md) adds immutable local records and initial rosters. `/admin/access/roles#saved-local-teams` reuses record-grid/card styles, Button, ReadState and Stamp. Retained team examples remain separately labelled. Incoming data is the local team API; outgoing inspection is the exact original roster and audit-linked creation history. There is no native creation/editing form or membership-derived authority.

At desktop widths, use the existing card grid. At 390/320 px, stack cards and wrap UUIDs, names, purpose and reason using `narrative`. Keyboard Enter/Space opens/closes the selected roster; pagination and Refresh saved teams are shared buttons. Collection loading and unavailable reads hide saved cards; detail loading hides the previous roster while retaining the opener and its focus; denied inspection clears the protected catalogue. Identity activity is current, while the roster is the immutable initial record. No source join/expiry dates are copied into it.

Host fixtures live in `tests/browser/access-local-teams.spec.ts`; exact-record/concurrency/rollback and upgrade fixtures live in `tests/database/access-local-teams.test.ts`. Evidence and source-bound desktop/phone captures: `docs/testing/evidence/access-local-teams/README.md`. This is a small existing-page refinement under ADR-0053 rule 6. An accepted native Figma image is missing; the retained AD-01 HTML is a workflow reference, not visual acceptance of this addition. Owner, screen-reader and physical-device acceptance remain open; no review fingerprint is granted.

Actual implementation review: [six source-bound captures and observations](../../../testing/evidence/access-local-teams/review.md), source `039df64`, 1440/390/320 widths. No horizontal document overflow observed. Existing phone-title truncation, card height and vertical scrolling remain explicit limits; owner acceptance is still pending.

Fresh roster details replace cached lead/creator labels on the selected card; closing retains the newer snapshot. Collection refresh/paging clears it. `access-local-teams.spec.ts` includes a distinct presentation fixture for this state; it does not claim a server identity change.

## Native local team creation — 12 October 2026

The [creation contract](../../../decisions/access-team-creation.md) adds a form inside Saved local teams using the existing Field, SelectField, ValidationFields, ErrorNotice, Button and recovery journal. Current creation context supplies active local identities and an explicit creation-duty flag; no name is preselected. Show exact IDs with names, explicit lead inclusion, 1–20 selected members and individual Remove controls. Name is at most 100 characters; purpose/reason are 10–1000. The initial roster remains immutable and grants no authority.

At desktop and 390/320 widths use the existing vertical form fields and wrapped roster/receipt IDs. No new shared style/export or layout is adopted. Use native selects, labelled errors, keyboard buttons and the existing unsaved-navigation guard. Pending commands disable the form; explicit unchanged retry and original-result lookup reuse the actor/workspace/tab journal. A receipt shows exact team/operation IDs; Inspect saved team reads that exact roster even outside the current collection page. Recording another team is explicit. Refresh available people reviews unsubmitted draft loss; collection refresh preserves the form. Denial clears protected catalogue content. Storage failure sends nothing.

Host fixtures: `tests/browser/access-team-creation.spec.ts`; current context/authority fixtures: `tests/database/access-local-teams.test.ts`. [Evidence](../../../testing/evidence/access-team-creation/README.md) separates functional checks from source-bound observations. Accepted native images, owner/device/zoom/screen-reader acceptance, membership editing and operational policy remain open. No review fingerprint is assigned.


## AD-01 saved-team access host

The [read contract](../../../decisions/access-team-inspection-current.md) reuses Button/ButtonLink, Stamp and ReadState within the expanded saved roster. Exact local-person links and Refresh member access retain ordinary keyboard semantics; masked identities have no access link. Refresh preserves the creation draft but hides previous counts until a fresh result arrives. Unavailable and denied reads remain distinct; denial clears protected content. Counts/UUIDs wrap on 390/320 widths without new CSS. Host state: tests/browser/access-team-access.spec.ts; [evidence](../../../testing/evidence/access-team-access/README.md). Owner/device/zoom/screen-reader review and accepted native imagery remain missing; no review fingerprint is assigned.

## Projects Figma consumer

`route:/projects` reuses this component with scoped styling from `src/app/styles/projects-register.css`. [Decision](../../../decisions/projects-register-native.md) and [source measurements](../../projects-register/figma-measurements.json) define the requested departures: 40 px desktop rows/header and controls, pinned 44 px end cells, compact 80 px phone rows, a 240 px expanded rail and a five-item Projects phone bar. Generic consumer geometry remains intact. Native fixture/state examples are in `tests/browser/projects-register.spec.ts` (selection, export, exact snapshots, URL restoration and refused reads); this does not introduce a new isolated gallery renderer.

Use the [execution record](../../../testing/evidence/projects-register/README.md) for actual checks and visual limitations. Owner/device review stays pending; no review fingerprint is assigned by this update.

## CPQ consumers

The configuration and rule registers/workbenches reuse this implementation. CPQ-scoped styling and fixture states are documented in [the host contract](cpq-workbench.md); source behaviours and existing gallery fixtures are unchanged. tests/browser/cpq.spec.ts supplies the real synthetic host. Paired visual and owner acceptance remain separate.

## Service requests consumer

SV-01/SV-02 reuses this component for the accepted Service requests page. Consumer bindings: `scope:SV-01`, `scope:SV-02`, `route:/service/tickets`, `route:/service/tickets/[id]`, `route:/service/tickets/new`. Host states and viewport evidence are tracked in [Service requests evidence](../../../testing/evidence/service-requests-accepted/README.md). Owner visual review remains pending; no shared primitive or fixture renderer changes.


## Facilities CS-05 consumer

The four `/facilities` routes and `scope:CS-05` reuse this control. Host states and synthetic fixtures are in `tests/browser/facilities-accepted.spec.ts` and `tests/helpers/facilities-design.ts`. No shared control contract is changed. Owner visual review remains pending; see `docs/testing/evidence/cs05-accepted-build/README.md`.

## SV-06 host binding

Service review and reports uses this existing component in `route:/service/reports` and `route:/service/reports/[id]`. The accepted source is PPO - Design, Service review and reports — accepted, page 1265:53; native owner visual review remains pending. Host states and synthetic fixtures are in `tests/browser/service-reports-design.spec.ts` and `tests/helpers/service-report-fixture.ts`; existing isolated examples are unchanged. See the [SV-06 contract](../pages/scope-sv-06.md) for alignment limits and [build evidence](../../../testing/evidence/service-review-build/README.md) for executed results.

## Discovery costing consumer

ES-02 `route:/estimating/discovery/[id]/costing` reuses this family. The page-local composition and synthetic state fixture are described in [the page contract](../pages/route-estimating-discovery-id-costing.md); [execution evidence](../../../testing/evidence/discovery-costing/README.md) is separate from owner review. No new shared component, token, grant or offline capability is introduced.

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


## PL-04 consumer

Changes and follow-up (`/schedule/changes`) and Policy impact (`/schedule/policy-impact`) reuse this family. Host fixtures in `tests/browser/changes-follow-up.spec.ts` cover the drawn desktop/tablet/390/320 layouts, current/unavailable reads, exact handovers and permission states. No shared runtime variant or approval is added. The page contracts and PL-04 build evidence record alignment differences; owner visual review remains pending.

## Conversations T2c consumer

The two Conversations routes use the existing Button for Send, original-operation Retry and R8 warning choices. Shared implementation is unchanged. Host fixtures and [T2c evidence](../../../testing/evidence/conversations-t2c/README.md) record verification; owner review remains separate.

## Nursery N1 consumer

The Nursery discovery route consumes the unchanged shared control. Host states and synthetic fixture: tests/browser/nursery-automation.spec.ts. Unknown/conflict, stale edits, read-only history and original-save recovery remain explicit. Owner visual review and exact Nursery mockups are pending; no baseline fingerprint is adopted.
