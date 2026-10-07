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
