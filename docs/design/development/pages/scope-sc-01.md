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

At 390 × 844 and 320 CSS px the worklist/detail grid and capture fields become a single column. Module padding is 12px; the title is 22px. Every field remains available with a visible label, 16px input text and 44px target. Receipt, pick/stage/dispatch, POD and custody capture use focused stacked forms. Dense evidence uses labelled definition lists rather than an inaccessible table-only view. Content and long identifiers wrap within the viewport. Mobile browser/keyboard evidence is separate from physical-device acceptance.

## Components, states and handovers

Reuse `Button`, `WorklistPanel` (native modal and focus return), `ErrorNotice`, `Stamp`, `usePlatformResource`, the shell information icon and shared semantic tokens. The domain-specific `Input` renders closed, labelled business fields; it is not a new shared component. New Supply Chain CSS is scoped to the module and forms. The seven-item rail groups ten routes as stated in BP-08.

Loading, empty, filtered-empty, read-only, denied/missing context, field validation, stale revision, saving, saved, uncertain result, conflict and recovery are explicit. Status is textual. Search/completeness/record/view selection stays in the URL. Identity changes remount the workspace and remove its old read projection. Unknown saves retain original operation/content under the current browser identity; server authority precedes recovery.

Incoming: canonical Customer/Site/Facility/Equipment, Project or Work Order demand and exact manual/synthetic evidence. Outgoing: other SC pages, Engineering and owning Project/Service/Scheduling workspaces, one shared Material Action, document evidence and permission-restricted Finance observations. No external transaction or downstream approval is implied.

## References and review evidence

Exact retained HTML: `docs/reference/ui/supply-chain/PPO-Supply-Chain-Material-Readiness-r03.html`. Historical bytes are unchanged.

No exact historical mobile image is recorded. New application captures belong under `docs/testing/evidence/supply-chain-native/`; source presence, executed functional tests, visual inspection, owner acceptance and deployment are separate. See [handover](../../../delivery/supply-chain-native-handover.md) and [BP-08](../../../blueprints/BP-08-supply-chain.md). Current paired visual acceptance is not claimed.
