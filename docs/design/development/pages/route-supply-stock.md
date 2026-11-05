# Inventory — SC-05 design contract

Stable entry: `route:/supply/stock`. Route `/supply/stock`; parent SCM-02, SCM-03 and SCM-08 retained. Owner: Dean Fiedler. Visual status: Needs review; no accepted application fingerprint.

## Purpose and task

Read permitted dated source observations in a bounded register, inspect a snapshot, then open an item record. MYOB remains the intended ERP authority. PPO posts no stock movement. Unknown never means zero. Product mapping persistence is outstanding; show No link recorded and no inferred Product handover.

Shipment Activity hands over to Receiving (SC-04) for receipt and inspection evidence; Stock Activity retains its native observation view. Search matches every permitted observation title and waits for a 200 ms typing pause before reading. Closing or saving the observation form consumes its URL launch parameter without adding history. The item detail uses explicit refresh rather than window-focus refresh.

The flagship hold was lifted on 5 November 2026; Inventory remains a tier 1 flagship due for the stage 3b redraw under ADR-0067, after which its visual layer will be rebuilt. The guide remains InReview. See the [dated status](../../../status/2026-11-05-inventory-review-fixes.md) for the recorded decision and separate acceptance boundaries.

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


## Products discovery proposal — 14 October 2026

The [bounded proposal](../../../decisions/products-discovery-proposal.md) compares the inFlow sample discovery pattern with current PPO source. Private **PPO - Design**, page `653:38`, frames `654:167 / 654:482`. [product-1440](../../../reference/ui/products-discovery/alignment-r01/product-1440.png) · [product-390](../../../reference/ui/products-discovery/alignment-r01/product-390.png). The [capture index](../../../reference/ui/products-discovery/README.md) records source identities and hashes; named version and owner acceptance remain pending.

Following Dean's alignment feedback, this proposes a flat desktop catalogue, full-width phone rows, preserved return context, and an exact read-only handover between Products and stock/demand evidence. Existing scope IDs, source authority, permissions and native commands remain intact. The proposed Products layout follows the accepted Leads register and Lead/Project record references; the running native implementation is unchanged. Products stock is currently Not configured; populated panels are fictional proposed states requiring an exact company/provider/item/unit mapping and a scoped read contract. No new stock balance, reservation or readiness calculation is adopted. The state board covers missing/incomplete/older evidence, loading, empty and unavailable reads. No app, guide workflow, shared component implementation, accepted fingerprint or deployment status changes in this contribution.

## Accepted Figma design — 15 October 2026

Desktop at 1440 × 900: the Supply chain rail (Material demand, Purchasing, Inbound shipments, Receiving, Inventory, Dispatch & delivery, Returns & claims) with Inventory selected; a secondary menu of views (All items, Linked to products, Not linked to a product), locations and Needs attention (Unknown quantities, Held or quarantined, Partial observations) without counts; a toolbar with Search inventory, Location, Unit and Completeness filters, "12 shown · limit 100" and "+ Observation"; and a 40 px grid of Item, Unit, On hand, Available, Reserved, Held, Completeness and Observed, with Usable, Reference, Location and Product scrolling. Unknown values show as Unknown in muted text. The item record has a Product strip, details for Item, Observation and Product link, and tabs Quantities, Locations, Demand, Activity and Source evidence; Quantities lists each meaning as its own row with its basis, and linked demand shows readiness as Unknown with Open material readiness. Activity lists the Supply records that mention the item and is not a ledger. Page components: Rail · Supply chain and the Inventory grid row and header (Figma `697:163173`, `699:1173`, `699:1174`).
