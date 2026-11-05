# Excel estimate import — application route

Stable entry: `route:/estimating/import`. Scope: `scope:excel-import`. Owner: Dean Fiedler. Working specification; visual review remains **Needs review**.

## Purpose and task

Contextual import from the Wizard or an exact imported estimate. The [scope contract](scope-excel-import.md) owns the accepted reference and task. No rail item: Estimation wizard remains selected. The user-requested breadcrumb is Estimating & quotation / Estimation wizard / Excel import.

## Desktop

Reuse the Wizard interior, context header, four step cards, findings by effect, 380 px summary and bottom action bar inside SecondaryMenuFrame with `data-ppo-workspace="shared"`. Workbook, review, confirmation and saved states use exact native evidence. Revised-workbook comparison requires explicit omission decisions. Source pricing preserves sell. Draft continuation displays only the native customer-safe projection in its preview.

At 1024 px the summary moves behind Summary. The full line table has a labelled keyboard-scroll region. The shell menu contains contextual help/back navigation; it grants no authority.

## Mobile

At 390/320 px retain context, status, compact step label, findings, totals and the action bar. Show all lines exposes every row. Summary uses the existing Wizard dialog, Escape and opener focus return. Inputs use 16 px text and minimum 44 px height. Side-by-side mass comparison remains a larger-screen task; every row is still reachable.

## Shared components and states

The [consumer binding](../component-bindings/2026-10-31-excel-import-ui.md) records Wizard primitives, fields, buttons, shell, status, validation and recovery. Loading, blocked, ready, stale, read-only/refused, failed reads, pending/uncertain and accepted states remain distinct. Source access is rechecked by every command. The same-tab journal retains an exact uncertain command; storage failure refuses sending.

## Visual references

[Accepted frames and hashes](../../../reference/ui/estimating/excel-import-figma-r01/README.md). All twelve device/state frames and the states board exist. Pricing pickers, the complete line list and estimate-record evidence were not drawn; the [31 October recommendation](../../../decisions/excel-import-figma-design.md#implementation-recommendations--31-october-2026) is agent-authored. No Figma file link or Pro artwork is included.

## Behaviour, handovers and verification

Incoming: exact Draft workspace/option/Complete revision or exact imported estimate version. Outgoing: immutable estimate successor, retained workbook download, pricing evidence or separately prepared Draft quotation. Native commands own expected versions, hashes, access and receipts. No migration, grant, capability, dependency or operational connection is introduced.

[Functional and visual evidence](../../../testing/evidence/excel-import-ui/README.md) keeps XI-01 to XI-08, application comparison, owner acceptance and deployment separate. Parent requirements EST-02–EST-05, EST-07/08 and DOC-01/02 acceptance remain open.
