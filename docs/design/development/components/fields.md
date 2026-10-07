# Form controls and save states

PL-04 policy impact reuses Field and SelectField for an explicit effective time, timezone, maximum visit minutes and optional site. Host fixtures cover edited-input invalidation and strict server validation; no shared renderer or catalogue fixture changes. [Host contract](../pages/route-schedule-policy-impact.md); [verification](../../../delivery/scheduling-policy-impact-handover.md). Paired owner/device review remains open.

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Catalogue key:** `fields` · **Review:** Pending

Actual text, multiline, date and select controls, required fields and synthetic save feedback.

## Source and reference

Design: [powerplants-one-theme-style-board-r22.html](../../../reference/ui/theme-style-board/powerplants-one-theme-style-board-r22.html#forms). Retained design reference; paired acceptance not recorded.

The application implementation and exact consumer bindings are maintained in `../components.json`. The live catalogue links the current checkout and computes dependency fingerprints.

## Desktop

Required inputs have visible labels; preserving data, validation and server acceptance remain separate. This example only saves in memory.

## Mobile

Use one column, at least 16 px input text and labels above controls. Avoid hidden action buttons beneath a mobile keyboard.

## Keyboard and accessibility

Tab/Shift+Tab and visible focus throughout. Use labelled controls as alternatives to dragging and hover-only actions.

## States and interaction

- **Default:** Representative synthetic content and normal interaction.
- **Disabled:** Inspect the disabled variant and its explanatory messages.
- **Saving:** Inspect the saving variant and its explanatory messages.

## Differences and limits

Page-specific forms still use several control families. Device keyboard and assistive-technology acceptance remain pending.

## Verification and maintenance

Review at 1440 × 960, 1024 × 768, 820 × 800, 390 × 844 and 320 × 700 where relevant; check browser zoom and keyboard operation separately. Compare the same state and viewport with the retained reference. Record exact commit, reviewer, date, fixture state, viewport, result and evidence paths in the component review record. Automated source fingerprints do not grant acceptance.

Changes to the source, styles, fixtures, specification or reference invalidate prior evidence. Update this master and its component record in the same pull request. Keep app business checks separate from catalogue presentation checks.

## CS native receiving

The maintained consumer bindings include the native Customer, Contact, Stakeholder, Readiness, Account Development and Survey pages where this control is actually used. Existing catalogue states illustrate the shared control; they do not reproduce the full CS workflow or server decisions. The [CS evidence](../../../testing/evidence/cs-native-completion/README.md) and owning page guides record real workflow checks and inspected widths. Owner/device comparison remains pending in the explicit CS alignment item.

## Scheduling consumers

PL-01–PL-05 reuse this family in the native shell. New review pages use wrapping actions, read/empty/error states, resource evidence and analytical comparisons. Existing booking forms retain their scoped button family. See [Scheduling evidence](../../../testing/evidence/scheduling-resources/README.md); component fixtures and review fingerprints remain unchanged because the underlying shared implementation is unchanged.

## ES-03 native consumer

The source register, authored evidence form, independent review and estimate comparison use this family through `src/components/cost-sources.tsx`. Existing catalogue fixtures remain unchanged because the shared component implementation is unchanged. Source-specific unknown/stale/recovery compositions are verified in the host browser tests, not inferred from the catalogue. The read-state binding includes ErrorNotice and host loading/recovery text; it does not claim a new generic ReadState implementation. See the [cost-source handover](../../../delivery/estimating-cost-sources-handover.md) for paired task inspection, executed evidence and open owner/device review.

The native confirmation checkbox has a scoped fixed width and a wrapping adjacent label; it must not inherit full-width text-input sizing. The [desktop/phone host captures](../../../testing/evidence/estimating-native-cost-sources/README.md) and geometry assertions verify that correction. Shared field implementation and catalogue acceptance are unchanged.

## Sales handover and aftercare consumers

CR-02/03/05 reuse these controls for Save, Submit, receiving decisions and recovery. Disabled/busy and uncertain results remain distinct; background refresh preserves dirty form values. Scope-specific handlers stay in the page. Labels, native keyboard semantics and source ownership remain intact. Actual device evidence is in the Sales handover; owner acceptance is pending.

The Sales evidence fixture demonstrates a long synthetic statement with the 4000-character source limit. Native handover and review fields declare their server limits explicitly; short default fields must not truncate a supported evidence narrative.


## Equipment native consumers

EQ-01 through EQ-09 reuse the shared control in their applicable register, record and evidence forms; tabs are used by EQ-01/EQ-03/EQ-04/EQ-05. Synthetic states are exercised in `tests/database/equipment.test.ts`, `tests/http/equipment.test.ts` and the Equipment browser proof. Source binding is recorded in the living register. No shared-control rendering change or visual acceptance is implied.

LocalDateTimeField accepts an optional canonical `validationField` independently of its DOM `name`. Equipment supplies stable React instance IDs to Field and LocalDateTimeField so mounted tab drafts and repeated evidence cards have distinct label/error targets. The catalogue fixture shows configuration and movement times with separate IDs and one canonical command-field name; defaults for existing consumers remain unchanged. Browser verification checks active-tab entry and duplicate-ID absence. This additive adapter has not received owner visual acceptance.

## Maintenance and Warranty consumers

MA-01–MA-07 now reuse this component through the native registers and record workspaces. Exact bindings are in components.json. Synthetic long labels, uncertain saves, stale versions and separate customer/recovery states are in docs/design/development/maintenance-fixtures.json and the Maintenance browser journeys. Review 1440/1024/390/320 px and guide draft retention before owner acceptance.

## FI-05 field readiness consumer

The exact assigned-visit review reuses this control without changing its shared implementation. Loading, denied, unsaved, saving, stale, unknown-result recovery and server-saved states remain distinct. Fixtures and retained-source/lost-response journeys are in tests/browser/field-readiness.spec.ts; actual visual evidence is tracked by the Field Work programme handover. Owner/device acceptance remains pending.


Scheduling Step 4 uses this shared control contract for online booking-policy preparation and impact resolution. Consumer bindings are maintained in components.json; exact immutable evidence is supplied by the host. Unknown results preserve the original command, freeze changed evidence and provide an unchanged retry. Loading or failed reads never indicate a cleared hold. Desktop/phone and owner visual acceptance remain pending.

## FI-06 consumer

IncidentScreen uses this shared control on scope:FI-06 and its three /service/incidents routes. Host/state fixtures: tests/browser/field-incidents.spec.ts and tests/database/field-incidents.test.ts. Review dirty/conflict/uncertain, denied/restricted and reopened outcomes at 1440/1024/390/320 and actual 200% zoom; owner acceptance pending.

## ES-05 consumer

The exact synthetic quotation release host reuses this control for separate preparation, approval, issue and distribution-simulation facts. Host fixtures in `tests/browser/quotation-release.spec.ts` cover explicit acknowledgement, stale entered rationale, denied evidence and original-command recovery. This consumer binding changes no shared control implementation or accepted visual baseline. See [release host specification](quotation-release.md).

## ES-06 consumer

QuotationResponse reuses this control on the exact issued-response page. Host fixtures cover pending/accepted/denied original recovery and 390/320px reflow in `tests/browser/quotation-response.spec.ts`. No shared implementation change or new visual acceptance is claimed.

## ES-07 receiving consumer

`QuotationConversion` uses this control in exact receiving, resolution, plan and original recovery. Host fixture: `tests/browser/quotation-conversion.spec.ts`. Consumer bindings and states are maintained in components.json. No shared-control behaviour changes or new global tokens. Visual/device acceptance remains pending.

## ES-07 disposition consumer

The ES-07 disposition host reuses Field and SelectField for per-target retain/revise/hold, exact positive decimal quantity, owned follow-up, reason and evidence. Stale evidence preserves entered values and requires explicit comparison before submission. Desktop/mobile and recovery fixtures: `tests/browser/quotation-disposition.spec.ts`. Exact accepted mockup images and paired owner/device review remain unavailable/pending.

## Owned Supply follow-up — SYN-ES07-03

Retain ES-07 and SC-09 scope IDs and r20 Detail workspace / Review-comparison (ES-07) and Register-worklist (SC-09). The proposed native adaptation adds a sixth receiving panel and assigned queue using the current shell. Reuse `QuotationConversion`, `QuotationSupplyFollowups`, `SupplyFollowupQueue`, shared Button/Field/SelectField/Status, validation, read-state, unsaved-change and recoverable-command controls. No shared control implementation or second scroll owner is added.

Incoming: exact completed conversion, disposition/continuing hold, triggering source evidence, demand and shared Supply graph. Outgoing: explicit owner acceptance/return/hold, immutable review, actual existing `Supply:Allocate` quantity update, native impact and receipt, and explicit fresh ES-07 disposition. Approved demand remains Approved; no cancellation, reservation release or commercial authority is implied.

Desktop shows original/current evidence and dependency disclosures before forms. Mobile at 390/320 px stacks fields, wraps identifiers and keeps recovery above forms; use 16px input text, 44px targets, labels and visible keyboard focus. Dirty proposals remain after refresh for explicit comparison. Unknown outcomes block replacement and retain original content across reload.

Host fixtures: `tests/browser/quotation-supply-followup.spec.ts` (receiving, real effects, stale comparison, denied identity, lost response, inconclusive lookup and exact retry). Shared catalogue examples remain reference-only for domain behavior. See `docs/testing/evidence/quotation-supply-followup/README.md` for actual executions/captures. Exact retained references remain `docs/reference/ui/quoting/PPO-One-Off-Item-Resolution-and-Conversion-r01.html` and `docs/reference/ui/supply-chain/PPO-Supply-Chain-Material-Readiness-r03.html`; neither proves native execution. Accepted follow-up mockup images are missing. Owner, physical-device, screen-reader review and deployment remain separate and pending; no fingerprint is promoted.

## LC-12 consumer alignment

Leads customer resolution and transfer reuse this control family, with native shared creation as the return destination. Keep record selection explicit, reasons retained and uncertain-original recovery locked against a duplicate command. Host fixtures are in [lead continuity examples](../lead-continuity-fixtures.json); no exact new state mockup or paired acceptance is claimed. Check desktop/mobile reachability, disabled state and permission-filtered choices in the host.
