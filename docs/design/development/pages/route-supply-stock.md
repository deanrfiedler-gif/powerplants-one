# Stock & reservations — native design contract

Stable entry: `route:/supply/stock`. Scope: **SC-05**. Route: `/supply/stock`. Owner: Dean Fiedler. Review: Draft; no accepted visual fingerprint.

## Purpose and task

Dated source observations, explicit units and completeness. Live reservations are not configured.

1. **Read the observation basis:** Review company, warehouse, bin, item, unit, source time and completeness. On hand, source available, source reserved, held and evidenced usable are distinct. Unknown values remain unknown, never zero.
2. **Review competing demand:** Open line allocations and their native demand handovers. Incoming coordination allocation is not a source reservation; usable allocation needs complete evidence.
3. **Respect the source boundary:** Live reservation policy is Not configured. Reservation observations can be recorded from fulfilment, but no external command is sent and no unit conversion is inferred.

## Desktop

**Accepted design, 15 October 2026:** the [Inventory design decision](../../../decisions/inventory-figma-design.md), captures 01 to 05 in [Inventory design r01](../../../reference/ui/supply-chain/inventory-figma-r01/README.md). It replaces the two-column worklist and bordered panels described below with the accepted register and record patterns, and proposes the rail label Inventory. The quantity rules below are unchanged.

Use the existing PPO shell, r20 Register / worklist with selected Detail workspace, and Review / comparison for retained history. At 1440 × 960 and 1024 × 768, the module uses a two-column worklist/detail grid (one third / two thirds), 20px padding, 16px gaps, white bordered panels, 26px title and compact wrapped evidence rows. The shell's normal main region owns page scrolling. No second rail or viewport-height allocation is introduced. Page-specific actions appear only for permitted native capabilities.

## Mobile

**Accepted design, 15 October 2026:** captures 06 to 08 in [Inventory design r01](../../../reference/ui/supply-chain/inventory-figma-r01/README.md): flush rows showing the item, reference and unit with a completeness tag, then on hand, available and reserved and the observed time; an item view with Quantities rows (Unknown stays Unknown), the rule note, Product and locations, and Open product and Record observation at the bottom; and a Supply chain tab bar with Inventory current.

At 390 × 844 and 320 CSS px the worklist/detail grid and capture fields become a single column. Module padding is 12px; the title is 22px. Every field remains available with a visible label, 16px input text and 44px target. Receipt, pick/stage/dispatch, POD and custody capture use focused stacked forms. Dense evidence uses labelled definition lists rather than an inaccessible table-only view. Content and long identifiers wrap within the viewport. Selecting a record on mobile opens its detail in place of the worklist, with an explicit Back to worklist control; browser Back also restores the list. Mobile browser/keyboard evidence is separate from physical-device acceptance.

## Components, states and handovers

Reuse `Button`, `WorklistPanel` (native modal and focus return), `ErrorNotice`, `Stamp`, `usePlatformResource`, the shell information icon and shared semantic tokens. The domain-specific `Input` renders closed, labelled business fields; it is not a new shared component. New Supply Chain CSS is scoped to the module and forms. The seven-item rail groups ten routes as stated in BP-08.

Loading, empty, filtered-empty, read-only, denied/missing context, field validation, stale revision, saving, saved, uncertain result, conflict and recovery are explicit. Status is textual. Search/completeness/record/view selection stays in the URL. Identity changes remount the workspace and remove its old read projection. Unknown saves retain original operation/content under the current browser identity; server authority precedes recovery.

Incoming: canonical Customer/Site/Facility/Equipment, Project or Work Order demand and exact manual/synthetic evidence. Outgoing: other SC pages, Engineering and owning Project/Service/Scheduling workspaces, one shared Material Action, document evidence and permission-restricted Finance observations. No external transaction or downstream approval is implied.

## References and review evidence

- Accepted Figma design: [Inventory design r01 captures](../../../reference/ui/supply-chain/inventory-figma-r01/README.md) (icon-free PNGs; not application captures)

Exact retained HTML: `docs/reference/ui/supply-chain/PPO-Order-Fulfilment-and-Customer-Delivery-Workspace-r01.html`. Historical bytes are unchanged.

No exact historical mobile image is recorded. New application captures belong under `docs/testing/evidence/supply-chain-native/`; source presence, executed functional tests, visual inspection, owner acceptance and deployment are separate. See [handover](../../../delivery/supply-chain-native-handover.md) and [BP-08](../../../blueprints/BP-08-supply-chain.md). Current paired visual acceptance is not claimed.

## Native application captures — 25 September 2026

[1440 px](../../../testing/evidence/supply-chain-native/sc-05-supply-1440.png) · [1024 px](../../../testing/evidence/supply-chain-native/sc-05-supply-1024.png) · [390 px](../../../testing/evidence/supply-chain-native/sc-05-supply-390.png) · [320 px](../../../testing/evidence/supply-chain-native/sc-05-supply-320.png)

Source, hashes, executed checks and proposed departures are recorded in the [evidence index](../../../testing/evidence/supply-chain-native/README.md). These are native application captures; historical references and pending owner review remain separate.


## Products discovery proposal — 14 October 2026

The [bounded proposal](../../../decisions/products-discovery-proposal.md) compares the inFlow sample discovery pattern with current PPO source. Private **PPO - Design**, page `653:38`, frames `654:167 / 654:482`. [product-1440](../../../reference/ui/products-discovery/alignment-r01/product-1440.png) · [product-390](../../../reference/ui/products-discovery/alignment-r01/product-390.png). The [capture index](../../../reference/ui/products-discovery/README.md) records source identities and hashes; named version and owner acceptance remain pending.

Following Dean's alignment feedback, this proposes a flat desktop catalogue, full-width phone rows, preserved return context, and an exact read-only handover between Products and stock/demand evidence. Existing scope IDs, source authority, permissions and native commands remain intact. The proposed Products layout follows the accepted Leads register and Lead/Project record references; the running native implementation is unchanged. Products stock is currently Not configured; populated panels are fictional proposed states requiring an exact company/provider/item/unit mapping and a scoped read contract. No new stock balance, reservation or readiness calculation is adopted. The state board covers missing/incomplete/older evidence, loading, empty and unavailable reads. No app, guide workflow, shared component implementation, accepted fingerprint or deployment status changes in this contribution.

## Accepted Figma design — 15 October 2026

Desktop at 1440 × 900: the Supply chain rail (Material demand, Purchasing, Inbound shipments, Receiving, Inventory, Dispatch & delivery, Returns & claims) with Inventory selected; a secondary menu of views (All items, Linked to products, Not linked to a product), locations and Needs attention (Unknown quantities, Held or quarantined, Partial observations) without counts; a toolbar with Search inventory, Location, Unit and Completeness filters, "12 shown · limit 100" and "+ Observation"; and a 40 px grid of Item, Unit, On hand, Available, Reserved, Held, Completeness and Observed, with Usable, Reference, Location and Product scrolling. Unknown values show as Unknown in muted text. The item record has a Product strip, details for Item, Observation and Product link, and tabs Quantities, Locations, Demand, Activity and Source evidence; Quantities lists each meaning as its own row with its basis, and linked demand shows readiness as Unknown with Open material readiness. Activity lists the Supply records that mention the item and is not a ledger. Page components: Rail · Supply chain and the Inventory grid row and header (Figma `697:163173`, `699:1173`, `699:1174`).
