---
document_id: PPO-SC05-INVENTORY-FIGMA-DEC
date: 2026-10-15
owner: Dean Fiedler
status: Owner-accepted design; native restyle, rail rename, mapping persistence and UI baseline acceptance separate
source_commit: cfd465f20787e321df9e80244b3df7aed307b6b2
versioning: git
---

# Inventory design — owner decision

This page exists because of the [Products decision](products-figma-design.md). On 14 October 2026 Dean said the Products proposal was "more like an inventory page" and left the split to Claude, who moved stock out of Products and drew Inventory as the Supply chain page for how many, where and how sure PPO is. It extends the existing Stock & reservations page (SC-05) and keeps all of its rules. On 15 October Dean accepted it: "Proceed with your recommendations." The design reference is the named Figma version "Excel import, Products and Inventory — accepted".

Scope: the existing Supply chain destination `stock` ("Stock & reservations", proposed label Inventory), route `/supply/stock`, register entries `route:/supply/stock` and `scope:SC-05` ("Stock availability and reservations"), parents SCM-02, SCM-03 and SCM-08 under [BP-08](../blueprints/BP-08-supply-chain.md) and [ADR-0049](ADR-0049-native-supply-chain.md). No parent requirement ID is added or renamed. This is a design decision. It authorises no application code, read model, route change, migration, permission, capability or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| A separate Inventory page | Claude's decision, delegated by Dean | "I was thinking it might be more professional to have a module for products and a module for inventory. I'll leave it up to you to make the professional decision." Supply chain already owns stock observations (SC-05); MYOB remains the ERP authority |
| Accept the design and its recommendations | User decision, 15 October 2026 | "Proceed with your recommendations." Every recommendation on the notes card is adopted and each open question takes its recommended answer |
| R1 Rename the rail item to Inventory, in Supply chain | Claude's recommendation, adopted | Today's label is "Stock & reservations". The route and scope stay `/supply/stock` and SC-05 |
| R2 No Inventory item in the Sales rail | Claude's recommendation, adopted | Products shows one read-only Availability line that hands over to the exact item. Access to Inventory still follows `supply.read` |
| R3 Record observation stays the existing native form | Claude's recommendation, adopted | The page shows the observation's result; the form keeps its route and permissions |
| R4 No counts in the secondary menu | Claude's recommendation, adopted | Until the read returns complete permitted counts. The toolbar says "12 shown · limit 100" |
| Q1 Where the product-to-item mapping is recorded | Resolved by "Proceed" | A separate decision on mapping persistence. The design shows the mapping read-only and labels the example "Exact match · illustrative" |
| Q2 Locations as a tree | Resolved by "Proceed" | Flat rows, matching the other registers |
| Q3 Activity as a ledger | Resolved by "Proceed" | No. Activity lists Supply records that mention the item; it is evidence history and PPO posts no stock movement |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team, at the named version "Excel import, Products and Inventory — accepted". The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Inventory · SC-05" `697:39`, under a new "— Supply chain —" divider `697:38` before Evidence. Its notes card `705:2647` lists the scope, rules, recommendations and answers |
| Accepted frames | Desktop: register `698:3419`, register with snapshot `701:4388`, item record Quantities `702:3419`, item record Activity `702:165468`. Tablet: item record `702:165896`. Phone: register `702:166327`, item record `702:166347`, 320 px quantities Unknown `702:166814`. States board `705:2577` |
| Page components | Rail · Supply chain (proposal) `697:163173` (Expanded, Collapsed), Inventory grid row `699:1173` (Default, Hover, Selected), Inventory grid header `699:1174`. The phone list row is the Products component `696:163530` |
| Shared parts | As for Products: Shell / Top bar, v2 menu items and headings, Grid cells, Tag, Button, the small snapshot panel, Record header, Field, Section heading, Banner, View tab and History item, the phone list, snapshot and tab bar |
| Retained captures | [Inventory design r01](../reference/ui/supply-chain/inventory-figma-r01/README.md): nine icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | Destination `stock` in the Supply chain rail (proposed label Inventory), route `/supply/stock`, `scope:SC-05`, parents SCM-02, SCM-03 and SCM-08. Capabilities unchanged (`supply.read`; recording keeps the existing form's permissions) |
| Page type (r20) | Register / worklist with a docked snapshot; record detail with view tabs. Read-only first increment |
| Reused components | Section 2. New page components: the Supply chain rail and the Inventory grid row and header |
| Source authority | The [SC-05 design record](../design/development/pages/route-supply-stock.md), `src/supply/model.ts` (on hand, source-reported available and reserved, held or quarantined, evidenced usable; Complete, Partial, Unavailable), BP-08 and ADR-0049. Fixture: synthetic items, locations, observations and people |
| Incoming handover | An exact permitted stock item with its company and entity key, unit, source revision and observation time. A Product record opens an item only through an exact mapping |
| Outgoing handover | The Product record at the exact revision; Material readiness (SC-01) for linked demand; Receiving (SC-04) for usable evidence; Service stock (SC-10) for van custody. The page never creates stock, a reservation, a purchase order, an adjustment, a count or a job-readiness decision |
| States shown | Register; snapshot; item Quantities and Activity; tablet; phone register and item; quantities Unknown at 320 px. The board covers loading, no matches, bounded result, quantities Unknown, partial observation, not linked to a product, held or quarantined and observation unavailable |
| Departures | Section 4 |

## 4. Display rules and departures

- **Quantity meanings are separate rows and columns:** on hand, available, reserved and held in the register (usable scrolls), and all five plus the incoming coordination allocation in the item's Quantities table. Unknown shows as Unknown, never 0. Units show as recorded.
- **Completeness** is a tag: Complete, Partial (warning) or Unavailable (danger). The observed time is always shown; no freshness threshold is invented.
- **Product link:** an item shows its linked product and revision, or Not linked. No match is made by name, SKU or family; the "Pump CP60 (supplier code)" fixture shows a similar name that stays unlinked.
- **Item record:** header with completeness, record position, Open product and Record observation; a Product strip; details for Item, Observation and Product link; tabs Quantities, Locations, Demand, Activity and Source evidence. Linked demand shows readiness as Unknown and hands over to Material readiness.

| ID | Departure | Today's page |
|---|---|---|
| V1 | The rail item is renamed Inventory | "Stock & reservations" |
| V2 | A flat grid with a docked snapshot and record view tabs | A two-column worklist and detail with bordered panels |
| V3 | A Quantities table lists each stock meaning as its own row | Wrapped evidence rows |
| V4 | Two rail icons (cart-shopping for Purchasing, ship for Inbound shipments) are not drawn in Figma; stand-ins are used | Not applicable |

## 5. Not decided

- **Building the page.** The register needs a per-item read over source observations; Linked to products needs the mapping (Q1). The rail rename changes the Supply chain rail for every Supply page.
- **Not drawn yet:** the observation form, stock counts, receiving, replenishment, barcode scanning, location management, the Source evidence tab, and prototype links.

## 6. Consequences

- No application code, read model, route, migration, permission or capability changes; all 78 parent IDs remain.
- The `route:/supply/stock` register entry links this design and its captures. Its visual status stays "Needs review".
- A later change receives a new named version and a new capture revision folder.

## 7. Verification

- Claude checked every frame with screenshots taken inside Figma. Present mode was not exercised.
- The nine captures are icon-free copies, scanned and inspected as described in the [Excel import decision](excel-import-figma-design.md), section 7. Before export, the Quantities tables' Unknown value was found rendering white and was corrected in the accepted frames and the copies. Hashes are in the [captures README](../reference/ui/supply-chain/inventory-figma-r01/README.md).
- Nothing is built, so there is no application or device evidence and no UI baseline.
