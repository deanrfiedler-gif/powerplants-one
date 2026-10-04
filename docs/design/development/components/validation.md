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
