# Loading, empty, error and recovery

PL-04 policy impact reuses ReadState/ErrorNotice for source and analysis reads. Its host removes old result counts/cards on loading, failure, changed input and identity change. Zero findings never imply publication approval. Host browser fixtures exercise failed refresh, retry and denial; shared renderer/catalogue fixtures remain unchanged. [Contract](../pages/route-schedule-policy-impact.md); [verification](../../../delivery/scheduling-policy-impact-handover.md). Owner acceptance remains open.

SC-01–SC-10 reuse ErrorNotice with domain-owned loading, filtered-empty, denied, saved and uncertain-operation states. No new shared renderer or fixture behaviour is introduced. The host keeps original save identity/content in identity-scoped session storage and asks the server to recover the original receipt. These host states are covered by the Supply Chain browser/HTTP proof, not inferred from component catalogue examples. Draft visual/owner review remains separate.

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Catalogue key:** `read-state` · **Review:** Pending

Actual ReadState/ErrorNotice plus explicitly labelled host-level empty, success and offline messages.

## Source and reference

Design: [powerplants-one-theme-style-board-r22.html](../../../reference/ui/theme-style-board/powerplants-one-theme-style-board-r22.html#states). Retained design reference; paired acceptance not recorded.

The application implementation and exact consumer bindings are maintained in `../components.json`. The live catalogue links the current checkout and computes dependency fingerprints.

## Figma components

**Status:** Partial · **Location:** Components › Record, in the private "PPO - Design" Figma file

- Record / Banner `251:2310`

Record / Banner covers record-level state messages. Loading, empty and error states are not drawn as components. The mapping is kept in `../components.json` (`figma`); node IDs are stable, and the file link stays out of this repository (ADR-0053). It records where the design component is, not visual alignment or review.

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

## Maintenance and Warranty consumers

MA-01–MA-07 now reuse this component through the native registers and record workspaces. Exact bindings are in components.json. Synthetic long labels, uncertain saves, stale versions and separate customer/recovery states are in docs/design/development/maintenance-fixtures.json and the Maintenance browser journeys. Review 1440/1024/390/320 px and guide draft retention before owner acceptance.

## FI-05 field readiness consumer

The exact assigned-visit review reuses this control without changing its shared implementation. Loading, denied, unsaved, saving, stale, unknown-result recovery and server-saved states remain distinct. Fixtures and retained-source/lost-response journeys are in tests/browser/field-readiness.spec.ts; actual visual evidence is tracked by the Field Work programme handover. Owner/device acceptance remains pending.

## ES-01 native consumer

The Estimating workload and Saved estimates views use ErrorNotice with host loading, no-match, no-permitted-workload and no-access states. A failed read clears rows and readiness counts and offers a secondary Try loading again (decision P9). Placeholder rows were declined; loading uses status text. The shared implementation and catalogue fixtures are unchanged. The host browser suite covers the failed, recovered and revoked reads.

## FI-01 timer consumer

`WorkTimer` and `RunningTimerBanner` reuse this component on My Jobs/job detail. The real synthetic fixture is `tests/browser/field-timer.spec.ts`, including Running/Paused/Stopped, unknown original outcome and desktop/phone controls. Host scope `#ppo-work-timer` retains accepted r05 tokens. The offline workspace keeps its existing native controls and is not mapped as a React consumer. Owner/device review is outstanding; see the native timer decision and field programme handover.


Scheduling Step 4 uses this shared control contract for online booking-policy preparation and impact resolution. Consumer bindings are maintained in components.json; exact immutable evidence is supplied by the host. Unknown results preserve the original command, freeze changed evidence and provide an unchanged retry. Loading or failed reads never indicate a cleared hold. Desktop/phone and owner visual acceptance remain pending.


### Background policy preparation

`ReadState` and `ErrorNotice` accept `focusOnError` (default `true`). Automatic booking-policy preparation passes `false`: errors remain visible alerts with their field explanations and retry, while native date editing keeps focus. Explicit command failures and resolution evaluation retain the default focus behavior. The `background-error` catalogue state uses the actual component. The Step 4 host test waits for an invalid interval response and verifies that focus stays on the editable start control; the existing complete keyboard journey remains required with unchanged assertions and deadlines. Owner/assistive-technology acceptance is pending.

## Service inspection binding

FI-03/FI-04 use original recovery with a bounded 6,000,000-character evidence journal; other consumers retain 32 KiB. Storage/quota failure precedes transport. Identity changes clear visible recovery. The host fixture covers saved, unsaved, conflict, uncertain and disconnected states. Disconnected input is not a saved offline draft.

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

The ES-07 disposition host shares the quotation command journal and original-receipt recovery. Reload and inconclusive/missing receipt lookup retain the original command; resolved means an applicable immutable Apply receipt, never an acknowledged note. Desktop/mobile and recovery fixtures: `tests/browser/quotation-disposition.spec.ts`. Exact accepted mockup images and paired owner/device review remain unavailable/pending.

## Owned Supply follow-up — SYN-ES07-03

Retain ES-07 and SC-09 scope IDs and r20 Detail workspace / Review-comparison (ES-07) and Register-worklist (SC-09). The proposed native adaptation adds a sixth receiving panel and assigned queue using the current shell. Reuse `QuotationConversion`, `QuotationSupplyFollowups`, `SupplyFollowupQueue`, shared Button/Field/SelectField/Status, validation, read-state, unsaved-change and recoverable-command controls. No shared control implementation or second scroll owner is added.

Incoming: exact completed conversion, disposition/continuing hold, triggering source evidence, demand and shared Supply graph. Outgoing: explicit owner acceptance/return/hold, immutable review, actual existing `Supply:Allocate` quantity update, native impact and receipt, and explicit fresh ES-07 disposition. Approved demand remains Approved; no cancellation, reservation release or commercial authority is implied.

Desktop shows original/current evidence and dependency disclosures before forms. Mobile at 390/320 px stacks fields, wraps identifiers and keeps recovery above forms; use 16px input text, 44px targets, labels and visible keyboard focus. Dirty proposals remain after refresh for explicit comparison. Unknown outcomes block replacement and retain original content across reload.

Host fixtures: `tests/browser/quotation-supply-followup.spec.ts` (receiving, real effects, stale comparison, denied identity, lost response, inconclusive lookup and exact retry). Shared catalogue examples remain reference-only for domain behavior. See `docs/testing/evidence/quotation-supply-followup/README.md` for actual executions/captures. Exact retained references remain `docs/reference/ui/quoting/PPO-One-Off-Item-Resolution-and-Conversion-r01.html` and `docs/reference/ui/supply-chain/PPO-Supply-Chain-Material-Readiness-r03.html`; neither proves native execution. Accepted follow-up mockup images are missing. Owner, physical-device, screen-reader review and deployment remain separate and pending; no fingerprint is promoted.

## NAV entry and truthful recovery

Home offers a declared permitted destination or a clear no-grant state; it grants no authority. Hosted offline entry displays an explanation while local originals retain their offline recovery links. Missing/revoked Survey Equipment identities are unavailable without leaking retained labels. Quotation windows and unavailable source adapters remain explicitly partial. Review these host states with the NAV fixtures, separately from owner/device acceptance.


## AD-01 consumer

Native Users and access/person inspection reuses this component unchanged. States include populated/empty directory, denied/expired authority, retryable reads and current/scheduled/expired grant records. The [AD-01 evidence](../../../testing/evidence/access-inspection/README.md) records host verification; these bindings do not grant visual acceptance or change the component's existing fixture semantics.

## AD-01 capability inspection consumers

The catalogue and holder routes reuse existing controls without changing their exports. Host fixtures in `tests/browser/access-inspection.spec.ts` cover search/filter, zero grants, person context, unavailable retry and authority loss. Database fixtures cover scope, dates, inactive identities, masking and stable pages. Company ERP keys appear before same-name labels. The separate native routes adapt the retained capabilities view; owner/device/accessibility review is pending.

## AD-01 proposed-role consumers

The proposed role catalogue and person comparison reuse this control in the existing shell. SelectField applies to comparison and local-team creation; buttons, read state and status apply to both. The host fixture is tests/browser/access-roles.spec.ts, covering proposed/draft state, selected-scope match/refusal, changed selections, explicit explanation handover and denied/unavailable recovery. No isolated renderer or component export changes. See [role evidence](../../../testing/evidence/access-roles/README.md). Paired owner/device/zoom/screen-reader review remains open.

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

## CS-01 native consumer — 19 October 2026

The [Organisations implementation](../../../decisions/organisations-figma-implementation.md) reuses this component under D1–D7. [Host fixtures](../organisations-native-fixtures.json) cover the changed consumer and [evidence](../../../testing/evidence/organisations-native-r01/README.md) records actual checks. Existing People/Contacts consumers remain separate. Owner visual/device review and baseline adoption are pending; no review fingerprint is replaced.

## SV-06 host binding

Service review and reports uses this existing component in `route:/service/reports` and `route:/service/reports/[id]`. The accepted source is PPO - Design, Service review and reports — accepted, page 1265:53; native owner visual review remains pending. Host states and synthetic fixtures are in `tests/browser/service-reports-design.spec.ts` and `tests/helpers/service-report-fixture.ts`; existing isolated examples are unchanged. See the [SV-06 contract](../pages/scope-sv-06.md) for alignment limits and [build evidence](../../../testing/evidence/service-review-build/README.md) for executed results.

## Discovery costing consumer

ES-02 `route:/estimating/discovery/[id]/costing` reuses this family. The page-local composition and synthetic state fixture are described in [the page contract](../pages/route-estimating-discovery-id-costing.md); [execution evidence](../../../testing/evidence/discovery-costing/README.md) is separate from owner review. No new shared component, token, grant or offline capability is introduced.


## PL-04 consumer

Changes and follow-up (`/schedule/changes`) and Policy impact (`/schedule/policy-impact`) reuse this family. Host fixtures in `tests/browser/changes-follow-up.spec.ts` cover the drawn desktop/tablet/390/320 layouts, current/unavailable reads, exact handovers and permission states. No shared runtime variant or approval is added. The page contracts and PL-04 build evidence record alignment differences; owner visual review remains pending.
