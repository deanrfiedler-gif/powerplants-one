# Validation and error summary

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Catalogue key:** `validation` · **Review:** Pending

Actual ValidationFields, Field and ErrorNotice with linked errors and preserved inputs.

## Source and reference

Design: [powerplants-one-theme-style-board-r22.html](../../../reference/ui/theme-style-board/powerplants-one-theme-style-board-r22.html#states). Retained design reference; paired acceptance not recorded.

The application implementation and exact consumer bindings are maintained in `../components.json`. The live catalogue links the current checkout and computes dependency fingerprints.

## Desktop

Submit an empty title to focus the summary, then follow its link to the field. Correct the title and save to clear the example error.

## Mobile

Summary and inline errors must remain visible at 320 px and 200% zoom.

## Keyboard and accessibility

Tab/Shift+Tab and visible focus throughout. Use labelled controls as alternatives to dragging and hover-only actions.

## States and interaction

- **Invalid:** Required-field errors with retained input.
- **Default:** Representative synthetic content and normal interaction.

## Differences and limits

ErrorNotice moves focus to its summary; screen-reader announcement still needs manual acceptance.

## Verification and maintenance

Review at 1440 × 960, 1024 × 768, 820 × 800, 390 × 844 and 320 × 700 where relevant; check browser zoom and keyboard operation separately. Compare the same state and viewport with the retained reference. Record exact commit, reviewer, date, fixture state, viewport, result and evidence paths in the component review record. Automated source fingerprints do not grant acceptance.

Changes to the source, styles, fixtures, specification or reference invalidate prior evidence. Update this master and its component record in the same pull request. Keep app business checks separate from catalogue presentation checks.

## CS native receiving

The maintained consumer bindings include the native Customer, Contact, Stakeholder, Readiness, Account Development and Survey pages where this control is actually used. Existing catalogue states illustrate the shared control; they do not reproduce the full CS workflow or server decisions. The [CS evidence](../../../testing/evidence/cs-native-completion/README.md) and owning page guides record real workflow checks and inspected widths. Owner/device comparison remains pending in the explicit CS alignment item.

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

## FI-06 consumer

IncidentScreen uses this shared control on scope:FI-06 and its three /service/incidents routes. Host/state fixtures: tests/browser/field-incidents.spec.ts and tests/database/field-incidents.test.ts. Review dirty/conflict/uncertain, denied/restricted and reopened outcomes at 1440/1024/390/320 and actual 200% zoom; owner acceptance pending.

## FI-07 host binding

Existing /service/reports and record destination reuse this component. tests/browser/reports.spec.ts supplies the actual reviewed attendance and response fixture, empty choice, validation, saved/uncertain recovery and focus return. See [FI-07 evidence](../../../testing/evidence/field-customer-response/README.md). New buttons use shared variants; legacy review/issue buttons retain their scoped styling. Owner/device/screen-reader acceptance is pending; no review fingerprint is assigned.

## ES-05 consumer

The exact synthetic quotation release host reuses this control for separate preparation, approval, issue and distribution-simulation facts. Host fixtures in `tests/browser/quotation-release.spec.ts` cover explicit acknowledgement, stale entered rationale, denied evidence and original-command recovery. This consumer binding changes no shared control implementation or accepted visual baseline. See [release host specification](quotation-release.md).

## ES-06 consumer

QuotationResponse reuses this control on the exact issued-response page. Host fixtures cover pending/accepted/denied original recovery and 390/320px reflow in `tests/browser/quotation-response.spec.ts`. No shared implementation change or new visual acceptance is claimed.

## ES-07 receiving consumer

`QuotationConversion` uses this control in exact receiving, resolution, plan and original recovery. Host fixture: `tests/browser/quotation-conversion.spec.ts`. Consumer bindings and states are maintained in components.json. No shared-control behaviour changes or new global tokens. Visual/device acceptance remains pending.

## ES-07 disposition consumer

ES-07 disposition validation associates strict positive-decimal/native eligibility and immutable-basis conflicts with the owning form. Current source, target, owner and dependency changes hold Apply. Permission refusal removes frozen evidence; it does not offer a replacement command. Desktop/mobile and recovery fixtures: `tests/browser/quotation-disposition.spec.ts`. Exact accepted mockup images and paired owner/device review remain unavailable/pending.

## Owned Supply follow-up — SYN-ES07-03

Retain ES-07 and SC-09 scope IDs and r20 Detail workspace / Review-comparison (ES-07) and Register-worklist (SC-09). The proposed native adaptation adds a sixth receiving panel and assigned queue using the current shell. Reuse `QuotationConversion`, `QuotationSupplyFollowups`, `SupplyFollowupQueue`, shared Button/Field/SelectField/Status, validation, read-state, unsaved-change and recoverable-command controls. No shared control implementation or second scroll owner is added.

Incoming: exact completed conversion, disposition/continuing hold, triggering source evidence, demand and shared Supply graph. Outgoing: explicit owner acceptance/return/hold, immutable review, actual existing `Supply:Allocate` quantity update, native impact and receipt, and explicit fresh ES-07 disposition. Approved demand remains Approved; no cancellation, reservation release or commercial authority is implied.

Desktop shows original/current evidence and dependency disclosures before forms. Mobile at 390/320 px stacks fields, wraps identifiers and keeps recovery above forms; use 16px input text, 44px targets, labels and visible keyboard focus. Dirty proposals remain after refresh for explicit comparison. Unknown outcomes block replacement and retain original content across reload.

Host fixtures: `tests/browser/quotation-supply-followup.spec.ts` (receiving, real effects, stale comparison, denied identity, lost response, inconclusive lookup and exact retry). Shared catalogue examples remain reference-only for domain behavior. See `docs/testing/evidence/quotation-supply-followup/README.md` for actual executions/captures. Exact retained references remain `docs/reference/ui/quoting/PPO-One-Off-Item-Resolution-and-Conversion-r01.html` and `docs/reference/ui/supply-chain/PPO-Supply-Chain-Material-Readiness-r03.html`; neither proves native execution. Accepted follow-up mockup images are missing. Owner, physical-device, screen-reader review and deployment remain separate and pending; no fingerprint is promoted.

## LC-12 consumer alignment

Leads customer resolution and transfer reuse this control family, with native shared creation as the return destination. Keep record selection explicit, reasons retained and uncertain-original recovery locked against a duplicate command. Host fixtures are in [lead continuity examples](../lead-continuity-fixtures.json); no exact new state mockup or paired acceptance is claimed. Check desktop/mobile reachability, disabled state and permission-filtered choices in the host.

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
