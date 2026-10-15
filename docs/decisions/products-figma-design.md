---
document_id: PPO-PD01-FIGMA-DEC
date: 2026-10-15
owner: Dean Fiedler
status: Owner-accepted design; native restyle, Inventory handover read and UI baseline acceptance separate
source_commit: cfd465f20787e321df9e80244b3df7aed307b6b2
versioning: git
---

# Products design — owner decision

On 14 October 2026 Dean asked Claude to redesign the Products (PD-01) page that a Codex session had drawn in Figma from his inFlow trial account, the [discovery proposal](products-discovery-proposal.md), saying it could look a lot more professional. While Claude was working he added: "I actually think it is more like an inventory page ... I was thinking it might be more professional to have a module for products and a module for inventory. I'll leave it up to you to make the professional decision." Claude checked his inFlow sample account read-only and decided to split the two. Products keeps what an item is. A new [Inventory](inventory-figma-design.md) page in Supply chain keeps where it is and how sure PPO is. On 15 October Dean accepted both designs: "Proceed with your recommendations." The design reference is the named Figma version "Excel import, Products and Inventory — accepted", which also covers the [Excel estimate import](excel-import-figma-design.md) accepted the same day.

This record supersedes the layout of the discovery proposal and keeps every rule it set. The proposal's retained captures stay unchanged as history.

Scope: the existing destination `products` in the Sales rail, routes `/products` and `/products/[id]`, register entries `route:/products`, `route:/products/[id]` and `scope:PD-01` ("Catalogue and product technical workspace"), within the [Products contract](../contracts/products-catalogue.md) (PD-01 to PD-05) and its retained parents. No parent requirement ID is added or renamed. This is a design decision. It authorises no application code, read model, route change, migration, permission, capability or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Redesign the Products page | User decision, 14 October 2026 | "Redesign or refine the Products (PD-01) UI page as it was built by ChatGPT, and I think you can make it look a lot more professional" |
| Split Products from Inventory | Claude's decision, delegated by Dean | "I'll leave it up to you to make the professional decision." The inFlow sample's Products list is an inventory register (quantity on hand, location, quantity-range and barcode filters, Reorder). PPO already separates identity ([ADR-0048](ADR-0048-products-native-catalogue.md)) from stock ([ADR-0049](ADR-0049-native-supply-chain.md), SC-05) |
| Accept the design and its recommendations | User decision, 15 October 2026 | "Proceed with your recommendations." Every recommendation on the notes card is adopted and each open question takes its recommended answer (the rows below) |
| R1 Products is what an item is; Inventory is where it is | Claude's recommendation, adopted | Stock and demand leave the product record. One read-only Availability line remains, with an exact handover |
| R2 Products stays in the Sales rail context | Claude's recommendation, adopted | Estimating and Engineering reach it through More. One route; no duplicate page |
| R3 Rename Stock & reservations to Inventory | Claude's recommendation, adopted | Recorded in the [Inventory decision](inventory-figma-design.md) |
| R4 No counts in the secondary menu | Claude's recommendation, adopted | The catalogue read is bounded to 100 records, so a count would be a false total. The toolbar says "12 shown · limit 100" |
| Q1 Compare action for selected products | Resolved by "Proceed" | Not in this increment. PD-04 Compatibility is the home for comparison |
| Q2 New draft revision | Resolved by "Proceed" | It opens the existing authoring form. The form is a separate page and is not drawn here |
| Q3 Unit conversion in Specification | Resolved by "Proceed" | Units show as recorded, never converted |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team, at the named version "Excel import, Products and Inventory — accepted". The file's link is not recorded in this public repository, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Page | "Products · PD-01 · discovery proposal" `653:38`, now in the Sales group after Customer 360. The name is kept because repository records cite it. Its notes card `703:3489` lists the scope, rules, recommendations and answers. The first-draft frames and their evidence copies are retained, unchanged, in the Superseded section `687:1210` |
| Accepted frames | Desktop: catalogue `689:2518`, catalogue with snapshot `693:3156`, product record Technical `694:7672`, product record Revisions `696:2784`. Tablet: product record `696:163022`. Phone: catalogue `696:163542`, product record `696:164256`, 320 px not linked to Inventory `696:164513`. States board `703:3419` |
| Page components | Product grid row `692:2116` (Default, Hover, Selected), Product grid header `692:2117`, Product list row (phone) `696:163530` |
| Shared parts | Accepted Leads, Projects and record-page parts: the Sales rail, Shell / Top bar, v2 menu items and headings, Grid cells, Tag, Button, the Projects small snapshot panel, Record / Header, Field, Section heading, Banner, View tab and History item, and the Projects phone list, snapshot and Sales tab bar |
| Retained captures | [Products design r01](../reference/ui/products/products-figma-r01/README.md): nine icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | Destination `products` (Sales rail), routes `/products` and `/products/[id]`, `scope:PD-01`. Capabilities unchanged: `products.read` and `shared.read`; commercial fields need `products.commercial.read` |
| Page type (r20) | Register / worklist with a docked snapshot; record detail with view tabs. Read-only first increment |
| Reused components | Section 2. New page components: the Product grid row and header and the phone list row |
| Source authority | [ADR-0048](ADR-0048-products-native-catalogue.md), the [Products contract](../contracts/products-catalogue.md) and the [discovery proposal](products-discovery-proposal.md). Vocabularies follow `src/products/model.ts`: Family, Model, Variant; Draft, Submitted, Reviewed, Returned, Published, Withdrawn; Unknown, Supported, Discontinued, Retired; SourceReported, Reviewed, Unresolved |
| Incoming handover | The exact permitted product and selected catalogue and technical revision (URL filters q, kind, state, lifecycle; `revision_id`), from Sales, Estimating, Engineering, search and linked records |
| Outgoing handover | The Availability line opens the exact Inventory item through a verified mapping. Publication, Pricing, Compatibility and Import keep their routes. The page never creates stock, a reservation, a purchase order or a job-readiness decision |
| States shown | Catalogue; snapshot; record Technical and Revisions; tablet; phone catalogue and record; a product not linked to Inventory. The board covers loading, no matches, bounded result, not linked, older observation, availability unavailable, newer revision and read-only viewer |
| Departures | Section 4 |

## 4. Display rules and departures

- **Catalogue grid:** Product, Reference, Kind, Revision (catalogue · technical), Publication, Lifecycle and Availability are visible; Family scrolls. Availability shows the dated observation, Partial with its date, Not linked or Not applicable, never a quantity.
- **Secondary menu:** the workspaces Catalogue, Publication, Pricing, Compatibility and Import, then quick views Published, Draft and Lifecycle unknown, each a single URL filter. No counts.
- **Snapshot panel:** revision facts and a one-line availability summary (observed time, source available and reserved, completeness, location), with the rule note and actions to open the product or the Inventory item.
- **Record:** header with status, record position ("2 of 12 in Catalogue"), Open in Inventory and New draft revision. An Availability strip shows the observation, source available, source reserved and "Usable: Unknown". The details column holds Identity, Revision and Source and inventory link. View tabs: Technical, Documents, Revisions, Pricing, Compatibility and Used in.
- **Technical:** a specification table of attribute, value, basis and evidence, with an Unresolved attribute naming its clarification owner, and controlled documents as metadata only.

| ID | Departure | Earlier design or app |
|---|---|---|
| P1 | Stock and demand move to Inventory; Products keeps one read-only Availability line | The first draft showed a Stock & demand tab on the product |
| P2 | A flat grid with a docked snapshot and record view tabs | Native catalogue cards; the first draft's flat table with oversized filter selects in the menu |
| P3 | Quick views replace the filter selects in the secondary menu; filter buttons sit in the toolbar | The first draft's three stacked selects |

## 5. Not decided

- **Building the page.** The restyle needs no new read for the catalogue. The Availability line and snapshot need the exact product-to-item mapping and a scoped read, which are the discovery proposal's increment B and the Inventory decision's open mapping question.
- **Not drawn yet:** the authoring form, the Publication, Pricing, Compatibility and Import workspaces, the Documents and Used in tabs, loading and denied frames beyond the board, and prototype links.

## 6. Consequences

- No application code, read model, route, migration, permission or capability changes; all 78 parent IDs remain.
- The `route:/products` and `route:/products/[id]` register entries link this design and its captures. Their visual status stays "Needs review".
- The discovery proposal's rules stay authoritative; its layout and captures are history.
- A later change receives a new named version and a new capture revision folder.

## 7. Verification

- Claude checked every frame with screenshots taken inside Figma. Present mode was not exercised.
- The nine captures are copies of the accepted frames with every Font Awesome icon swapped for `Icon/placeholder`, scanned for remaining icons and for text whose colour differed from its bound variable or matched its background, exported at scale 1 and inspected. Hashes are in the [captures README](../reference/ui/products/products-figma-r01/README.md).
- The repository checks listed in the [Excel import decision](excel-import-figma-design.md), section 7, were run on this change.
- Nothing is built, so there is no application or device evidence and no UI baseline.
