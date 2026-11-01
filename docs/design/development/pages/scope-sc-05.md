# Inventory — SC-05 design contract

Stable entry: `scope:SC-05`. Route `/supply/stock`; parent SCM-02, SCM-03 and SCM-08 retained. Owner: Dean Fiedler. Visual status: Needs review; no accepted application fingerprint.

## Purpose and task

Read permitted dated source observations in a bounded register, inspect a snapshot, then open an item record. MYOB remains the intended ERP authority. PPO posts no stock movement. Unknown never means zero. Product mapping persistence is outstanding; show No link recorded and no inferred Product handover.

## Desktop

The accepted r20 Register / worklist uses the shared SecondaryMenuFrame, a flat shared RegisterTable and a docked snapshot. At 1440 px use a 240 px secondary menu, compact 40 px controls and rows, source-completeness chips and observed time. At 1024 px the menu overlays. Item detail separates header and Product strip from a context column and Quantities, Locations, Demand, Activity and Source evidence views. Locations remain flat source rows; activity is native-record evidence history.

## Mobile

At 390 and 320 px use full-width item rows, 44 px controls and 16 px form text. Item details reflow; quantity meanings and their bases remain readable without page overflow. The shared phone header and secondary-menu focus/escape contract apply. Retry preserves URL selection and filters. Native observation capture uses its existing responsive form and uncertain-save recovery. Physical-device and screen-reader review remain outstanding.

## Components, states and handovers

Reuse shared tokens, Button/ButtonLink, RegisterTable/RegisterChip/RegisterEmpty, SecondaryMenuFrame and usePlatformResource. The root opts into `data-ppo-workspace="shared"`; no shared CSS ID list changes. Component consumer details live in [the binding note](../component-bindings/2026-10-31-inventory.md).

Loading, failed/denied reads, empty/filtered-empty results, bounded lists, Unknown, Partial, Unavailable, zero, held quantities, no Product link and overlapping locations are explicit. A fresh request removes stale protected data. Incoming is a permitted source record; outgoing is the native observation form, exact source record, permitted Material demand or Service stock. Existing commands, permissions, expected versions and uncertain-save recovery remain authoritative.

## Reference and review evidence

Accepted source: [Inventory design decision](../../../decisions/inventory-figma-design.md), named version "Excel import, Products and Inventory — accepted". Exact icon-free captures: [retained Inventory r01](../../../reference/ui/supply-chain/inventory-figma-r01/README.md), frames 698:3419, 701:4388, 702:3419, 702:165468, 702:165896, 702:166327, 702:166347, 702:166814 and 705:2577. Source presence is separate from implementation proof.

Current comparison, departures and executed checks: [Inventory evidence](../../../testing/evidence/inventory/README.md). Source evidence is an adaptation because that tab was not drawn. Product linking is deliberately unavailable under Q1. The native form is retained under R3. No visual acceptance or deployment is claimed.

## Historical native implementation evidence

## Native application captures — 25 September 2026

[1440 px](../../../testing/evidence/supply-chain-native/sc-05-supply-1440.png) · [1024 px](../../../testing/evidence/supply-chain-native/sc-05-supply-1024.png) · [390 px](../../../testing/evidence/supply-chain-native/sc-05-supply-390.png) · [320 px](../../../testing/evidence/supply-chain-native/sc-05-supply-320.png)

Source, hashes, executed checks and proposed departures are recorded in the [evidence index](../../../testing/evidence/supply-chain-native/README.md). These are native application captures; historical references and pending owner review remain separate.


## Historical cross-module context — LC-16

The earlier note on Native Won receiving (LC-16) concerns accepted Sales events and separately reviewed Project/Service bindings; it does not define the Inventory workflow or add a Sales panel to SC-05. Its source and proof remain in [Won delivery continuity](../../../testing/evidence/won-delivery-continuity/README.md). Inventory's current incoming and outgoing handovers are defined above. No LC-16 acceptance or delivery-completion claim is made by this page.
