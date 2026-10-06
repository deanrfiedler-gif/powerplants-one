# Material demand & readiness — native design contract

Stable entry: `scope:SC-01`. Scope: **SC-01**. Route: `/supply/material-readiness`. Owner: Dean Fiedler. Review: Draft; no accepted visual fingerprint.

## Purpose and task

Review the exact material scope, usable supply and owned blockers.

1. **Establish demand:** Create a demand against the exact Project, Work Order or separately named approved origin. Forecast and Approved are distinct; Approved needs authority evidence. Enter quantity, explicit unit, local required date and timezone, or explain the missing date.
2. **Review readiness:** Allocate incoming and usable supply separately. Only complete evidenced usable allocations can support readiness. A saved assessment retains the exact demand, source and fact versions; Ready applies only to the stated material scope and evidence point.
3. **Own the blocker:** Keep the owner and next action current. Promise, receipt, reservation, substitution and allocation changes create an impact review and shared Material Action; follow it through My Work.

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

[1440 px](../../../testing/evidence/supply-chain-native/sc-01-supply-1440.png) · [1024 px](../../../testing/evidence/supply-chain-native/sc-01-supply-1024.png) · [390 px](../../../testing/evidence/supply-chain-native/sc-01-supply-390.png) · [320 px](../../../testing/evidence/supply-chain-native/sc-01-supply-320.png)

Source, hashes, executed checks and proposed departures are recorded in the [evidence index](../../../testing/evidence/supply-chain-native/README.md). These are native application captures; historical references and pending owner review remain separate.

## Independently received shared Shipment shortfall — SYN-ES07-06

Retain the existing ES-07/SC scope IDs and r20 evidence/review workspace or receiving register. `AllocationShortfall` inside `QuotationSupplyFollowups` reuses Button, Field, SelectField, Status, unsaved-change comparison and the existing actor-bound journal. No new theme/control behavior or second scroll owner. Incoming: exact completed Receipt correction/native receipt, accepted referral and current Supply/allocation/Demand graph. Outgoing: attributable changed-Demand receiving, immutable review, separate single/atomic native application, actual outcome and fresh readiness/ES-07 assessment.

Desktop places corrected/original Receipt evidence and exact current capacity before quantity inputs. Blank retains an allocation; entered quantities are exact reductions including zero. Show each affected owner, quantity/unit, before/after allocation, total Usable allocation, unmet Demand, picked lower bound, source/version/company/entity keys and downstream holds. Supply ownership never substitutes for separate Accepted/Returned/Held decisions. Completed proposals retain decisions as history without renewal controls. Unchanged Demands receive no native version/impact effect.

Mobile at 390/320 px stacks labelled fields, wraps IDs/JSON provenance and retains shared 44px controls, 16px inputs and visible keyboard focus. Original recovery remains above controls; uncertain action disables replacement across reload. Preserve edited quantities for explicit comparison on refresh. Denied linked evidence is removed before any count/history disclosure. Capacity valid is distinct from Demand satisfied and operational readiness.

Real state fixtures: `tests/browser/quotation-allocation-shortfall.spec.ts`, `tests/http/quotation-allocation-shortfall.test.ts`, `tests/database/quotation-allocation-shortfall.test.ts`. Exact retained references are `docs/reference/ui/quoting/PPO-One-Off-Item-Resolution-and-Conversion-r01.html` and `docs/reference/ui/supply-chain/PPO-Supply-Chain-Material-Readiness-r03.html`. New native mockup images are missing; captured execution is not visual approval. Proposed departure is this bounded received-reduction panel, with priority/replenishment/reversal excluded. Owner, paired-reference, physical-device and screen-reader review remain pending; no fingerprint is promoted. See `docs/testing/evidence/quotation-allocation-shortfall/README.md`.
