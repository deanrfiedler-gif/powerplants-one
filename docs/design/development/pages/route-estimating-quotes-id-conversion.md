# Exact receiving, one-off resolution and controlled conversion

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Stable ES-07 / `route:/estimating/quotes/[id]/conversion`. Native `QuotationConversion`; r20 Document & evidence workspace with guided decisions. [Retained r01 HTML](../../../reference/ui/quoting/PPO-One-Off-Item-Resolution-and-Conversion-r01.html) and its companion report remain unchanged. Accepted native desktop/mobile images are unavailable. Execution captures and actual validation are recorded separately in the [evidence ledger](../../../testing/evidence/quotation-conversion/README.md).

## Desktop

Use the PPO shell and one page scroll owner at 1440/1024 px. Exact issue/output/response/preparation and Not configured policy gaps precede original recovery. Four numbered panels separate receiving, resolution, reviewed plan and execution. Show every included Product quantity/unit and source UUID beside its explicit mapping, then intended company/entity/customer/site. Keep all accepted commercial lines available in a disclosure. Long identities and fingerprints wrap.

## Mobile

At 390/320 px stack labelled fields and panels. Recovery stays above decisions, keyboard focus remains visible and shared minimum targets remain. Preserve proposals on refresh; disable replacements for unknown, saving or stale results. Denied access removes protected evidence. No offline command exists.

## Components, states and handovers

Reuse Button/ButtonLink, Field, SelectField, Status, ValidationFields/ErrorNotice, permitted resource loading, useUnsavedChanges and the actor-bound recoverable command journal. Reuse ES-05 semantic panel/evidence styles; no new tokens or shared control behaviour. `tests/browser/quotation-conversion.spec.ts` uses real synthetic issues and target records.

States include missing preparation, owned Held/Returned, Received, Missing/Ambiguous/Obsolete/Incompatible/OneOff mappings, reviewed plan, stale basis, held plan, original unknown, converted, completed effects with changed applicability and denied access. All states use text.

Incoming: exact ES-06 preparation, issue/output and applicable recorded response. Outgoing: real native Supply Demand Forecast records and exact original receipts. Receiving, sending, commercial approval and work release remain distinct. No sending event is fabricated.

Declared departure from the broader reference: only included Product lines become native Forecast demand; other lines retain commercial evidence. OneOff creates a line-bound internal identity, no operational master or ERP mapping. ERP orders and multiple target aggregates remain deferred. See the [native decision](../../../decisions/quotation-conversion-native.md). Independent paired visual, physical-device, screen-reader and owner acceptance remain pending; no fingerprint is promoted.

## Completed-target disposition

Keep r20 Document & evidence workspace and scope ES-07. The fifth region reuses `QuotationDispositions`, shared labelled fields/selects/buttons/status, native disclosures and the same actor-bound recovery journal. Show a status for every target, then one selected target's exact original/current quantities, units, company/entity, source changes, native version, dependencies and immutable decisions. Distinguish source exceptions from downstream edits; record-only review does not clear the exception.

Desktop: place original/current comparison and dependency disclosures immediately before the review form; preserve the exact issued-output and native-target links. Mobile 390/320 px: stack form controls, wrap long IDs, preserve the selected target and text-based hold/resolution status. No horizontal document overflow or hidden recovery controls. Keyboard uses native labelled controls and visible focus. Unknown originals disable replacement reviews/actions. A stale selected-target basis retains entries and requires explicit comparison; a sibling edit does not reset this proposal.

Retain, ReviseQuantity and Hold are the only decisions. Show the exact proposed positive native quantity and reviewer/time/owner before separate application. Approved demand or consequential dependencies explain their hold and owning Supply follow-up. Show every preceding review, applied target version and original operation. New source or downstream changes reopen review while preserving completed facts. Incoming corrected/superseded source evidence and outgoing native Supply revision/Impact/Activity handovers remain explicit.

`tests/browser/quotation-disposition.spec.ts` supplies real host fixtures for review-only, retained, revised, continuing hold, stale comparison, committed lost response, unsent unknown/retry and denied access. This is host evidence, not an isolated catalogue fixture. [Follow-up evidence](../../../testing/evidence/quotation-disposition/README.md) records executed results separately. Accepted native disposition images remain unavailable; no review fingerprint or owner acceptance is promoted. The reference HTML's cancellation/replacement/multi-target proposals remain outside the native contract.

## Owned Supply follow-up — SYN-ES07-03

Retain ES-07 and SC-09 scope IDs and r20 Detail workspace / Review-comparison (ES-07) and Register-worklist (SC-09). The proposed native adaptation adds a sixth receiving panel and assigned queue using the current shell. Reuse `QuotationConversion`, `QuotationSupplyFollowups`, `SupplyFollowupQueue`, shared Button/Field/SelectField/Status, validation, read-state, unsaved-change and recoverable-command controls. No shared control implementation or second scroll owner is added.

Incoming: exact completed conversion, disposition/continuing hold, triggering source evidence, demand and shared Supply graph. Outgoing: explicit owner acceptance/return/hold, immutable review, actual existing `Supply:Allocate` quantity update, native impact and receipt, and explicit fresh ES-07 disposition. Approved demand remains Approved; no cancellation, reservation release or commercial authority is implied.

Desktop shows original/current evidence and dependency disclosures before forms. Mobile at 390/320 px stacks fields, wraps identifiers and keeps recovery above forms; use 16px input text, 44px targets, labels and visible keyboard focus. Dirty proposals remain after refresh for explicit comparison. Unknown outcomes block replacement and retain original content across reload.

Host fixtures: `tests/browser/quotation-supply-followup.spec.ts` (receiving, real effects, stale comparison, denied identity, lost response, inconclusive lookup and exact retry). Shared catalogue examples remain reference-only for domain behavior. See `docs/testing/evidence/quotation-supply-followup/README.md` for actual executions/captures. Exact retained references remain `docs/reference/ui/quoting/PPO-One-Off-Item-Resolution-and-Conversion-r01.html` and `docs/reference/ui/supply-chain/PPO-Supply-Chain-Material-Readiness-r03.html`; neither proves native execution. Accepted follow-up mockup images are missing. Owner, physical-device, screen-reader review and deployment remain separate and pending; no fingerprint is promoted.

Actual native follow-up captures: `docs/testing/evidence/quotation-supply-followup/supply-followup-desktop.png`, `supply-followup-mobile.png` and `supply-followup-320.png` in the same directory. Agent-inspected layout and automated functional proof are recorded in the execution ledger; owner acceptance remains pending.

## Owned reservation outcome dependency

SYN-ES07-04 retains ES-07/SC-09, r20 evidence/review workspace and receiving register. `QuotationSupplyFollowups` reuses Field, SelectField, Button, Status and original recovery. Incoming: exact accepted referral and current Unknown ExternalOutcome/Reservation fact. Show fact/predecessor, source operation, state, completeness, observation time and lookup evidence before forms, even without allocations. Select Confirmed/Failed/Absent, enter complete lookup evidence and UTC ISO time, save immutable review, inspect it, then Apply separately.

Outgoing: native successor, demand version/history, original receipt and new explicit ES-07 reassessment. Other quantities/allocations/demands are unchanged; consequential and Approved holds remain visible. Missing receipt is inconclusive. Desktop places evidence before actions. Mobile 390/320 px stacks labelled inputs, wraps identities, retains 44px controls and keyboard focus. Unknown originals block replacements through reload; stale proposals remain for comparison. Real host fixtures are in `tests/browser/quotation-supply-followup.spec.ts`. Accepted native images are missing; retained HTML and #344 captures keep their provenance. No review fingerprint or owner/device/screen-reader acceptance is promoted. Actual proof: `docs/testing/evidence/quotation-reservation-reconciliation/README.md`.

## Owned native Receipt evidence correction — SYN-ES07-05

The adopted [Receipt correction decision](../../../decisions/quotation-receipt-correction.md) adds one current Receipt fact on Supply allocated to an exact converted Demand. Retain ES-07, SC-04 and SC-09, the r20 evidence/review workspace and receiving register. `ReceiptCorrection` is a child of `QuotationSupplyFollowups`; reuse Field, SelectField, Button, Status, the current shell, unsaved-change comparison and actor-bound original-command recovery. No additional scrolling container or shared token departure is introduced.

Incoming: exact issue, lineage, completed execution, current exception, accepted Supply referral, original Receipt, current shared Supply, all allocated Demands (including zero links), other sources contributing to their readiness and downstream evidence. The proposal freezes corrected native fields and versions. Each current Demand owner records Accepted, Returned or Held against that exact proposal. A notification, note, Activity or Supply completion supplies no consent. Each decision includes actor, server time, reason, evidence and predecessor. Referral due date or Date needed remains visible.

Desktop compares original/current/proposed quantities, identity evidence, units, company/entity keys, allocations, readiness, shortages and downstream holds before decisions. Mobile 390/320 px stacks these sections, wraps IDs and retains labelled inputs, visible focus and shared 44px targets. Unknown original operations disable replacement across reload; refresh preserves edits for explicit comparison. Restricted linked evidence is unavailable before counts or snapshots are rendered.

Outgoing: immutable correction review with exact receiving IDs; separate Apply invokes native `Supply:Fact:Receipt`, appends a Receipt successor and native history, versions Supply and each allocated Demand, creates owned Requested Impacts and returns the actual native receipt to ES-07. It preserves allocation identities/quantities and Demand quantities/classification. Reduced Shipment usable evidence is allowed with an explicit capacity shortfall; Stock capacity remains its separate observation. Accurate evidence does not establish allocation eligibility. Require a fresh ES-07 review/application; operational holds survive quotation resolution.

Host/state fixtures: `tests/browser/quotation-receipt-correction.spec.ts`, `tests/http/quotation-receipt-correction.test.ts` and `tests/database/quotation-receipt-correction.test.ts`. Retained r01 quoting and r03 Supply HTML remain reference-only. Accepted Receipt correction mockup images are missing; execution captures are separate evidence. Owner, physical-device, screen-reader and paired visual review remain pending. No review fingerprint is copied. See the [execution ledger](../../../testing/evidence/quotation-receipt-correction/README.md).

## Independently received shared Shipment shortfall — SYN-ES07-06

Retain the existing ES-07/SC scope IDs and r20 evidence/review workspace or receiving register. `AllocationShortfall` inside `QuotationSupplyFollowups` reuses Button, Field, SelectField, Status, unsaved-change comparison and the existing actor-bound journal. No new theme/control behavior or second scroll owner. Incoming: exact completed Receipt correction/native receipt, accepted referral and current Supply/allocation/Demand graph. Outgoing: attributable changed-Demand receiving, immutable review, separate single/atomic native application, actual outcome and fresh readiness/ES-07 assessment.

Desktop places corrected/original Receipt evidence and exact current capacity before quantity inputs. Blank retains an allocation; entered quantities are exact reductions including zero. Show each affected owner, quantity/unit, before/after allocation, total Usable allocation, unmet Demand, picked lower bound, source/version/company/entity keys and downstream holds. Supply ownership never substitutes for separate Accepted/Returned/Held decisions. Completed proposals retain decisions as history without renewal controls. Unchanged Demands receive no native version/impact effect.

Mobile at 390/320 px stacks labelled fields, wraps IDs/JSON provenance and retains shared 44px controls, 16px inputs and visible keyboard focus. Original recovery remains above controls; uncertain action disables replacement across reload. Preserve edited quantities for explicit comparison on refresh. Denied linked evidence is removed before any count/history disclosure. Capacity valid is distinct from Demand satisfied and operational readiness.

Real state fixtures: `tests/browser/quotation-allocation-shortfall.spec.ts`, `tests/http/quotation-allocation-shortfall.test.ts`, `tests/database/quotation-allocation-shortfall.test.ts`. Exact retained references are `docs/reference/ui/quoting/PPO-One-Off-Item-Resolution-and-Conversion-r01.html` and `docs/reference/ui/supply-chain/PPO-Supply-Chain-Material-Readiness-r03.html`. New native mockup images are missing; captured execution is not visual approval. Proposed departure is this bounded received-reduction panel, with priority/replenishment/reversal excluded. Owner, paired-reference, physical-device and screen-reader review remain pending; no fingerprint is promoted. See `docs/testing/evidence/quotation-allocation-shortfall/README.md`.

## Owned material resolution — SYN-ES07-07

Retain ES-07, SC-09 and PJ-03 and their r20 evidence/review, receiving-register and native Project detail patterns. MaterialResolution within QuotationSupplyFollowups reuses Field, SelectField, Button, Status, source disclosures, dirty comparison and the actor-bound journal. Incoming: original quotation/conversion, received Receipt correction, completed allocation reduction, exact Requested Impact/MaterialAction and current Project task. Outgoing: four separate receiving decisions, immutable review, native forecast withdrawal and exact Impact successor with receipts, then fresh readiness/ES-07 disposition. Activity completion is separate.

Desktop compares quantities, unmet Demand, independent impacts and downstream versions before effects. Mobile 390/320 px stacks labels, wraps identifiers and keeps recovery before actions, with shared tokens, 44px targets and visible focus. Show Date needed explicitly. Completed receiving is retained history without renewed controls; continuing holds remain separate. Unknown originals block replacement through reload. Current authority precedes all linked snapshots/counts.

Exact retained references remain the quoting r01 and Supply readiness r03 HTML; Projects uses ppo-projects-gantt-content-r10.html. Native material mockup images are missing. This bounded forecast-withdrawal panel is the declared adaptation; no general dispatcher or rescheduling policy is adopted. Host fixtures: tests/browser/quotation-material-resolution.spec.ts and its database/HTTP siblings. The material-resolution ledger records actual checks/captures. Paired visual, owner, physical-device and screen-reader review remain pending; no fingerprint is promoted.
