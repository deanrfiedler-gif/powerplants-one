# Material change-impact review — native design contract

Stable entry: `route:/supply/changes`. Scope: **SC-09**. Route: `/supply/changes`. Owner: Dean Fiedler. Review: Draft; no accepted visual fingerprint.

## Purpose and task

Review before and after evidence through the owning module. Bookings and issued packs remain unchanged.

1. **Compare the evidence:** Open a demand and its impact reviews. Review before/after versions, reason, exact source references and affected Project/Service/customer context. Original facts and record revisions remain available.
2. **Request the owning review:** Open the linked Material Action and canonical Project or appointment workspace. Scheduling owns any proposed new date and crew; Supply Chain does not guess them or alter a confirmed booking. Job-pack owners own reissue decisions.
3. **Record follow-through:** Review the requested capture, record Reviewed and the owning module's exact outcome reference. This records coordination evidence; it never applies the downstream decision automatically.

## Desktop

Use the existing PPO shell, r20 Register / worklist with selected Detail workspace, and Review / comparison for retained history. At 1440 × 960 and 1024 × 768, the module uses a two-column worklist/detail grid (one third / two thirds), 20px padding, 16px gaps, white bordered panels, 26px title and compact wrapped evidence rows. The shell's normal main region owns page scrolling. No second rail or viewport-height allocation is introduced. Page-specific actions appear only for permitted native capabilities.

## Mobile

At 390 × 844 and 320 CSS px the worklist/detail grid and capture fields become a single column. Module padding is 12px; the title is 22px. Every field remains available with a visible label, 16px input text and 44px target. Receipt, pick/stage/dispatch, POD and custody capture use focused stacked forms. Dense evidence uses labelled definition lists rather than an inaccessible table-only view. Content and long identifiers wrap within the viewport. Selecting a record on mobile opens its detail in place of the worklist, with an explicit Back to worklist control; browser Back also restores the list. Mobile browser/keyboard evidence is separate from physical-device acceptance.

## Components, states and handovers

Reuse `Button`, `WorklistPanel` (native modal and focus return), `ErrorNotice`, `Stamp`, `usePlatformResource`, the shell information icon and shared semantic tokens. The domain-specific `Input` renders closed, labelled business fields; it is not a new shared component. New Supply Chain CSS is scoped to the module and forms. The seven-item rail groups ten routes as stated in BP-08.

Loading, empty, filtered-empty, read-only, denied/missing context, field validation, stale revision, saving, saved, uncertain result, conflict and recovery are explicit. Status is textual. Search/completeness/record/view selection stays in the URL. Identity changes remount the workspace and remove its old read projection. Unknown saves retain original operation/content under the current browser identity; server authority precedes recovery.

Incoming: canonical Customer/Site/Facility/Equipment, Project or Work Order demand and exact manual/synthetic evidence. Outgoing: other SC pages, Engineering and owning Project/Service/Scheduling workspaces, one shared Material Action, document evidence and permission-restricted Finance observations. No external transaction or downstream approval is implied.

## References and review evidence

Exact retained HTML: `docs/reference/ui/supply-chain/PPO-Supply-Chain-Material-Readiness-r03.html`. Historical bytes are unchanged.

No exact historical mobile image is recorded. New application captures belong under `docs/testing/evidence/supply-chain-native/`; source presence, executed functional tests, visual inspection, owner acceptance and deployment are separate. See [handover](../../../delivery/supply-chain-native-handover.md) and [BP-08](../../../blueprints/BP-08-supply-chain.md). Current paired visual acceptance is not claimed.

## Native application captures — 25 September 2026

[1440 px](../../../testing/evidence/supply-chain-native/sc-09-supply-1440.png) · [1024 px](../../../testing/evidence/supply-chain-native/sc-09-supply-1024.png) · [390 px](../../../testing/evidence/supply-chain-native/sc-09-supply-390.png) · [320 px](../../../testing/evidence/supply-chain-native/sc-09-supply-320.png)

Source, hashes, executed checks and proposed departures are recorded in the [evidence index](../../../testing/evidence/supply-chain-native/README.md). These are native application captures; historical references and pending owner review remain separate.

## Owned Supply follow-up — SYN-ES07-03

Retain ES-07 and SC-09 scope IDs and r20 Detail workspace / Review-comparison (ES-07) and Register-worklist (SC-09). The proposed native adaptation adds a sixth receiving panel and assigned queue using the current shell. Reuse `QuotationConversion`, `QuotationSupplyFollowups`, `SupplyFollowupQueue`, shared Button/Field/SelectField/Status, validation, read-state, unsaved-change and recoverable-command controls. No shared control implementation or second scroll owner is added.

Incoming: exact completed conversion, disposition/continuing hold, triggering source evidence, demand and shared Supply graph. Outgoing: explicit owner acceptance/return/hold, immutable review, actual existing `Supply:Allocate` quantity update, native impact and receipt, and explicit fresh ES-07 disposition. Approved demand remains Approved; no cancellation, reservation release or commercial authority is implied.

Desktop shows original/current evidence and dependency disclosures before forms. Mobile at 390/320 px stacks fields, wraps identifiers and keeps recovery above forms; use 16px input text, 44px targets, labels and visible keyboard focus. Dirty proposals remain after refresh for explicit comparison. Unknown outcomes block replacement and retain original content across reload.

Host fixtures: `tests/browser/quotation-supply-followup.spec.ts` (receiving, real effects, stale comparison, denied identity, lost response, inconclusive lookup and exact retry). Shared catalogue examples remain reference-only for domain behavior. See `docs/testing/evidence/quotation-supply-followup/README.md` for actual executions/captures. Exact retained references remain `docs/reference/ui/quoting/PPO-One-Off-Item-Resolution-and-Conversion-r01.html` and `docs/reference/ui/supply-chain/PPO-Supply-Chain-Material-Readiness-r03.html`; neither proves native execution. Accepted follow-up mockup images are missing. Owner, physical-device, screen-reader review and deployment remain separate and pending; no fingerprint is promoted.

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

## One selected Project dependency — SYN-ES07-08

Retain existing ES-07 / SC-09 / PJ-03 scope and r20 evidence/review, receiving-register and native detail patterns. MaterialResolution reuses SelectField, Button, ButtonLink, Status, source disclosure and the original actor-bound journal. Incoming: exact received allocation outcome, Demand/Impact/Activity, Task A and explicitly selected native successor B. Outgoing: five distinct receiving decisions, immutable review, separately applied two-task withdrawal and exact Impact successor, three original receipts and fresh readiness/ES-07 disposition.

Desktop shows both current task positions, versions/owners, direction/kind and exact proposed dates; preserve dependency meaning and distinguish native missing-date warnings from completed scoped action. Mobile 390/320 px stacks labelled successor/receiving fields with 44px controls, 16px inputs, wrapping identifiers and visible focus. Recovery precedes replacement controls. Returned/Held/corrected/reassigned consent and extra/new dependencies remain visible holds. Completed evidence has no renewed acceptance controls.

Host/state fixtures: `tests/browser/quotation-task-dependency.spec.ts`, database/HTTP siblings and `tests/unit/quotation-task-dependency.test.ts`. Existing quoting r01, Supply readiness r03 and Projects r10 references remain exact. Accepted native pair mockup images are missing. This two-task panel is a proposed native adaptation; paired visual, owner, device and screen-reader review remain pending. No fingerprint is promoted.
