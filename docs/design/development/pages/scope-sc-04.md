# Receiving & inspection — native design contract

Stable entry: `scope:SC-04`. Scope: **SC-04**. Route: `/supply/receipts`. Owner: Dean Fiedler. Review: Draft; no accepted visual fingerprint.

## Purpose and task

Capture physical receipt and inspection. Arrival and quarantine do not establish usable stock.

1. **Record physical receipt:** Select the incoming line and open Receipt and inspection. Carrier arrival and ERP receipt reference are separate observations. Record actual quantities and explicit identity evidence.
2. **Inspect and quarantine:** Inspected cannot exceed received. Usable plus quarantined cannot exceed inspected. Damage is included within quarantined quantity. Short quantity records the shortage for this receipt; neither arrival nor quarantine makes goods usable.
3. **Capture and correct:** On a phone, complete the stacked capture form and optionally upload a supported PNG. A verified stored photo is linked to the exact capture. Review / correct capture adds a successor; originals remain available.

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

[1440 px](../../../testing/evidence/supply-chain-native/sc-04-supply-1440.png) · [1024 px](../../../testing/evidence/supply-chain-native/sc-04-supply-1024.png) · [390 px](../../../testing/evidence/supply-chain-native/sc-04-supply-390.png) · [320 px](../../../testing/evidence/supply-chain-native/sc-04-supply-320.png)

Source, hashes, executed checks and proposed departures are recorded in the [evidence index](../../../testing/evidence/supply-chain-native/README.md). These are native application captures; historical references and pending owner review remain separate.

## Owned native Receipt evidence correction — SYN-ES07-05

The adopted [Receipt correction decision](../../../decisions/quotation-receipt-correction.md) adds one current Receipt fact on Supply allocated to an exact converted Demand. Retain ES-07, SC-04 and SC-09, the r20 evidence/review workspace and receiving register. `ReceiptCorrection` is a child of `QuotationSupplyFollowups`; reuse Field, SelectField, Button, Status, the current shell, unsaved-change comparison and actor-bound original-command recovery. No additional scrolling container or shared token departure is introduced.

Incoming: exact issue, lineage, completed execution, current exception, accepted Supply referral, original Receipt, current shared Supply, all allocated Demands (including zero links), other sources contributing to their readiness and downstream evidence. The proposal freezes corrected native fields and versions. Each current Demand owner records Accepted, Returned or Held against that exact proposal. A notification, note, Activity or Supply completion supplies no consent. Each decision includes actor, server time, reason, evidence and predecessor. Referral due date or Date needed remains visible.

Desktop compares original/current/proposed quantities, identity evidence, units, company/entity keys, allocations, readiness, shortages and downstream holds before decisions. Mobile 390/320 px stacks these sections, wraps IDs and retains labelled inputs, visible focus and shared 44px targets. Unknown original operations disable replacement across reload; refresh preserves edits for explicit comparison. Restricted linked evidence is unavailable before counts or snapshots are rendered.

Outgoing: immutable correction review with exact receiving IDs; separate Apply invokes native `Supply:Fact:Receipt`, appends a Receipt successor and native history, versions Supply and each allocated Demand, creates owned Requested Impacts and returns the actual native receipt to ES-07. It preserves allocation identities/quantities and Demand quantities/classification. Reduced Shipment usable evidence is allowed with an explicit capacity shortfall; Stock capacity remains its separate observation. Accurate evidence does not establish allocation eligibility. Require a fresh ES-07 review/application; operational holds survive quotation resolution.

Host/state fixtures: `tests/browser/quotation-receipt-correction.spec.ts`, `tests/http/quotation-receipt-correction.test.ts` and `tests/database/quotation-receipt-correction.test.ts`. Retained r01 quoting and r03 Supply HTML remain reference-only. Accepted Receipt correction mockup images are missing; execution captures are separate evidence. Owner, physical-device, screen-reader and paired visual review remain pending. No review fingerprint is copied. See the [execution ledger](../../../testing/evidence/quotation-receipt-correction/README.md).
