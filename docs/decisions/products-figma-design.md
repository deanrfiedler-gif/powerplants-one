---
document_id: PPO-PD01-FIGMA-DEC
date: 2026-10-15
owner: Dean Fiedler
status: Owner-accepted design; Amendment A1 (product image) drawn at the owner's direction, owner visual review and named version pending; native restyle, Inventory handover read and UI baseline acceptance separate
source_commit: cfd465f20787e321df9e80244b3df7aed307b6b2
versioning: git
---

# Products design — owner decision

On 14 October 2026 Dean asked Claude to redesign the Products (PD-01) page that a Codex session had drawn in Figma from his inFlow trial account, the [discovery proposal](products-discovery-proposal.md), saying it could look a lot more professional. While Claude was working he added: "I actually think it is more like an inventory page ... I was thinking it might be more professional to have a module for products and a module for inventory. I'll leave it up to you to make the professional decision." Claude checked his inFlow sample account read-only and decided to split the two. Products keeps what an item is. A new [Inventory](inventory-figma-design.md) page in Supply chain keeps where it is and how sure PPO is. On 15 October Dean accepted both designs: "Proceed with your recommendations." The design reference is the named Figma version "Excel import, Products and Inventory — accepted", which also covers the [Excel estimate import](excel-import-figma-design.md) accepted the same day.

This record supersedes the layout of the discovery proposal and keeps every rule it set. The proposal's retained captures stay unchanged as history.

Section 8 records Amendment A1, the product image, which Dean directed on 15 October 2026 and which awaits his review. Sections 1 to 7 describe the design as accepted.

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

## 8. Amendment A1 — product image (15 October 2026)

On 15 October 2026 Dean showed the product record in the earlier [r04 preview](../reference/ui/products/PPO-Products-Preview-r04.html), which has a large image of the product, and asked whether the accepted design included one. It did not. The redesign followed the shared record layout and lost the r04 image panel without recording a departure. Claude recommended adding it, and Dean replied: "Proceed with your recommendations: amend the Products Figma design to add the product image panel (desktop, tablet, phone, optional grid thumbnail, no-image state) and record it as an amendment."

| Item | Classification | Evidence |
|---|---|---|
| Show an image of the actual product | User decision, 15 October 2026 | Quoted above |
| Where the image sits and how it behaves (A1.1 to A1.6) | Claude's recommendation, adopted by "Proceed" | The rules below; A1.2 refines one recommendation, as noted |
| The drawn amendment | Drawn on 15 October 2026; owner visual review pending | [Products design r02](../reference/ui/products/products-figma-r02/README.md) |
| Storing and reading real images | Design intent only; not decided for building | A1.6 and the open items below |

| ID | Rule |
|---|---|
| A1.1 | **Record, desktop and tablet.** A Product image panel heads the details column, above Identity: 332 × 233 px at 1440 and 249 × 173 px at 1024. The image fills the media area, View full size sits at the bottom right, and a caption names the image source and its revision (in this synthetic design, "Concept image · fictional equipment" and "Image rev A"). The column scrolls, so at 1440 × 900 the Source and inventory link section now starts below the fold. |
| A1.2 | **Record, phone.** An 80 px image row opens the record body, above the status line, with the source, the revision and "Tap the image to view full size". Claude had recommended a thumbnail beside the product name. In the header, it would cut the name to about 12 characters at 320 px, so the row sits directly below the header instead. |
| A1.3 | **Catalogue grid.** A Thumbnail column 36 px wide, holding a 28 px image, sits between Select and Product, with no heading and no divider before the product name. Family narrows from 150 px to 136 px and the 22 px filler is removed, so the row width is unchanged. |
| A1.4 | **Phone list and snapshot.** Each phone catalogue row starts with a 44 px thumbnail. The snapshot header shows a 40 px thumbnail beside the product name. |
| A1.5 | **No image.** A neutral placeholder with a camera glyph; on the record it reads "No image · None linked to this revision". A product never borrows an image from a similar product, its family or another revision, and stock photographs are not used. The design shows it for the two families, CP-60 (draft), DP-25, FV-32 and SM-120, on the 320 px record and on the States board. |
| A1.6 | **Source of images.** A product image is a business document, and SharePoint owns business documents, so PPO stores a reference to the exact file revision and shows its source and revision rather than becoming an image library. Linking or replacing an image is not drawn here; it belongs with the Documents tab and the authoring form. |

**Design reference.** The frames in section 2 were edited in place and keep their node IDs. New page components: Product image (record) `829:3490` (Image: Linked, None) and Product thumbnail `829:3461` (Image: Linked, None; Size: Small, Large). The six synthetic concept images are held in `822:3453`. The States board gains "State / No image" `833:207299`, and the notes card `703:3489` and page header `688:38` record A1. The named version "Excel import, Products and Inventory — accepted" keeps the design as it was before A1. A1 needs its own named version once Dean has reviewed it; Claude suggests "Products — product image amendment A1".

**Images.** The six product pictures (CP-40, CC-8, DP-12, ECP-2, FV-20 and SM-90) are synthetic concept images of fictional equipment, generated with Figma's image generation. They show no real manufacturer's product, label or brand. Generating them used six Figma AI image credits.

**Not decided.** Showing real images needs a product-image reference on the product revision (a data-model change and migration), a scoped SharePoint read, thumbnail generation and an access rule. None is decided or authorised by this amendment. It changes no application code, read model, route, migration, permission or capability, and all 78 parent IDs remain. The `route:/products` and `route:/products/[id]` register entries add the r02 captures; their visual status stays "Needs review". The r01 captures stay unchanged.

**Verification.** Claude checked each amended frame with screenshots taken inside Figma; Present mode was not exercised. The nine r02 captures are copies of the amended frames with every Font Awesome icon swapped for `Icon/placeholder`, including the camera glyph and the magnifying glass. A scan found no icon left, and a scan of 851 visible text layers found no text whose stored colour differed from its bound variable or matched its background. They were exported at scale 1 and inspected; hashes are in the [r02 README](../reference/ui/products/products-figma-r02/README.md). The repository checks from section 7 were run on this change.
