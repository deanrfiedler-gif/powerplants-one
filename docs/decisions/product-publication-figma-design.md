---
document_id: PPO-PD02-PRODUCT-PUBLICATION-FIGMA-DEC
date: 2026-10-31
owner: Dean Fiedler
status: Owner-accepted design; restyling the built pages, the required-attribute rule, image linking and notifications are separate
source_commit: 6e939bf0b937fc05f9e477d1cd14f8838c92fd9a
versioning: git
---

# Product publication design — owner decision

On 24 October 2026 Dean asked Claude "to design and build the "Catalogue authoring and publication (PD-02)" UI page in Figma as a proposal for my review. Draw the page; do not stop at a written brief." `/products/publication` and the authoring form at `/products/[id]` are built as a native synthetic implementation with acceptance pending, so this design sets what the built pages move to. The accepted [Products design](products-figma-design.md) had listed the authoring form and the Publication workspace under "Not drawn yet".

Claude drew the page and asked "Do you accept the PD-02 design and its recommended answers?" On 31 October 2026 Dean answered: "Accept as drawn". That adopts decisions D1–D14, departures P1–P5 and the recommended answers to Q1–Q5.

Claude drew the page from these sources:
- the [Products contract](../contracts/products-catalogue.md) and the [ADR-0048 completion decision](ADR-0048-products-native-catalogue.md#completion-decision--7-october-2026);
- the [PD-02 page contract](../design/development/pages/scope-pd-02.md);
- the built page and model: `src/products/components/publication.tsx`, `src/products/model.ts` and `src/products/commands.ts`;
- the accepted [Products](products-figma-design.md) and [Template management](template-management-figma-design.md) designs, and the proposed [product image references](product-image-references.md) and [ADR-0057](ADR-0057-product-image-renditions.md);
- the Products and Template management Figma pages and the Workshop builds decision, read only, for the story.

Scope: `scope:PD-02` "Catalogue authoring and publication", routes `/products/publication` and `/products/[id]` (authoring), within the Products contract's retained parents. No parent requirement ID is added or renamed; all 78 remain.

This is a design decision. It authorises no application code, read model, route, migration, permission, grant, notification or deployment. A published revision remains catalogue evidence: it is not installation approval, and it changes no saved estimate, quotation, design release or asset.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design PD-02 in Figma | User decision, 24 October 2026 | Dean's request quoted above |
| D1–D14 and P1–P5 | Accepted as drawn, 31 October 2026 | "Accept as drawn". Section 4 |
| Q1 Who reviews technical revisions | Resolved as recommended | An engineer holding `products.review`, never the author. The product owner publishes. The content is technical evidence, and edit, review and publish are already separate duties. No grant changes here |
| Q2 Which attributes must be resolved | Resolved as recommended; build separate | Only required ones. The Family names its required attributes (for dosing pumps: flow, pressure, voltage, power), which its Models and Variants inherit. An Unresolved required attribute refuses Submit; others may be published as Unresolved with their owner shown. New rule: today's Submit command does not check this |
| Q3 Who may publish | Resolved as recommended | Holders of `products.publish`, a product-owner duty. The author may publish after an independent review, as Morgan Lee did for CP-40 r03 on Products. Today's command requires independence for Reviewed and Returned only, so this needs no change |
| Q4 Notifying Engineering and Estimating | Resolved as recommended; build separate | Yes: an in-app notification only, no email, to owners whose saved items link the superseded or withdrawn revision, with the exact revision link. It changes nothing. A later increment with Notifications |
| Q5 DP-25 differs from Products | Resolved as recommended | This page keeps Dean's brief: a Model, r03 published, r04 reviewed and published. Products `653:38` shows a Variant at r01 and is not edited. The synthetic seed aligns to this page when it is built |
| Named Figma version | Waits for Dean | "Product publication — accepted" is not saved yet. This record is updated when it is |
| Building the pages | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Product publication · PD-02" `2393:864572`, under "— Sales —", after Products. The page header `2393:864573` holds the conformance declaration. The notes cards `2398:5595` and `2398:5697` list D1–D14, Q1–Q5, the flows and what is not drawn. File index row `2912:8543` |
| Desktop 1440 | 1 Authoring form, full length `2393:873812`; 2 Comparison with predecessor `2394:871103`; 3 Publication queue `2393:870113`; 4 Review frozen submission `2394:872883`; 5 Returned with reason `2395:1681`; 6 Publish dialog `2395:873251`; 7 Published, superseding r03 `2395:2036`; 8 Withdraw `2395:873629` |
| Tablet 1024 | Review `2395:875133` |
| Phone 390 and 320 | Review `2395:879319` and `2395:879701`; outcome sheet at 390 `2395:879444`; read-only comparison `2395:879604` and `2395:879824` |
| States | Section `2393:864633`: Loading `2396:871910`; Nothing in queue `2396:871938`; Could not load `2396:871957`; No edit permission `2396:871979`; No review permission `2396:871997`; No publish permission `2396:872011`; Unresolved attribute blocks submission `2396:872025`; Reviewer is the author `2396:872053`; Stale version `2396:872069`; Outcome unknown `2396:872097`; New product, kind and parent `2396:872126`; Draft successor keeps the published basis `2396:872152` |
| Parts | No new main component. The Publication grid row, Attribute row, Comparison row, Decision panel, phone Difference row and outcome sheet are compositions of shared parts on this page |
| Prototype | Flows "PD-02 — desktop" (from the queue) and "PD-02 — phone" (from the 390 review). The paths are on the notes card. In the desktop flow, + Product stands in for the entry to the form |
| Story | Synthetic, as at Tue 13 Oct 2026, 09:00 AEST, with Alex Nguyen and Priya Shah (authors), Jordan Hale (reviewer) and Morgan Lee (publisher). DP-25 `SYN-PROD-DP25`: r03 published 2 Sep; flow corrected from datasheet rev D; pressure Unresolved in the unsaved form, then 800 kPa from technical note SYN-TN-0412 rev A; r04 saved 08:46, submitted 08:50, reviewed 09:20, published 09:42. New Variant `SYN-PROD-000013`, six-digit under the [namespace decision](readable-reference-namespaces.md). Returned: ECP-2 r01. Withdrawn: CC-8 r05 in the Withdraw frame. Existing references stay exactly as on Products |
| Retained captures | [Product publication design r01](../reference/ui/products/product-publication-design-r01/README.md): 26 icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:PD-02`, routes as above. Parents retained from the contract: CRM-08, DOC-01/02, ENG-02–06, EST-02–08, NFR-05, SCM-02/03/08 and IF-02/06/10/12/14. Capabilities unchanged: `products.read`, `products.edit`, `products.review`, `products.publish` |
| Page type (r20) | Review / comparison, with Form / guided workflow for authoring and Register / worklist for the queue. Publish and Withdraw are short centred decision dialogs |
| Reused components | Sales rail with Products selected; top bar with the Conversations action; Products menu with Publication selected; Grid header, cells, checkbox and row actions; My Work group row bands; Tag; Button; Record view tab, history item and banner; Product image `829:3490`; Shell / Phone header · compact `1530:110`; the DK-06 dialog pattern |
| Incoming handover | From Products: New draft revision opens the form on the exact current revision; + Product opens New product. From the queue: the exact revision (`product_id`, `revision_id`). Names of people and companies from existing shared reads |
| Outgoing handover | Commands only, each with an operation ID, reason and expected version: save a draft successor; Submit, Reviewed, Returned, Published, Withdrawn; recovery through the original receipt. The published revision is the basis read by Products, ES-03, EN-06, EN-07 and EQ-06/07. It changes no saved work, schedules nothing and approves no installation |
| States shown | Section 2 |
| Departures | Section 4 |

## 4. Accepted decisions and departures

| ID | Decision | Basis |
|---|---|---|
| D1 | Publication is a Products workspace with Publication selected in the Products menu; the form opens from the record or + Product | Contract routes; Products Q2 |
| D2 | Every save is a new immutable revision. A saved draft is corrected by a successor, never edited, so DP-25's pressure is Unresolved only in the unsaved r04 form | `product_revisions`; `POST /products/{id}` |
| D3 | The comparison shows each changed field, Before and After, grouped into revision, each typed attribute and each document, with the words Changed, Evidence only or Added; unchanged fields sit behind a toggle; stacked on phone | `compareContent`; PD-02 page contract |
| D4 | Submit sits on the saved draft's comparison and freezes it. The review shows the frozen hash, differences from the published basis and evidence, and records Reviewed or Returned with a required reason. The author is never the reviewer; there is no assignment | Contract events and capabilities |
| D5 | Publish is a short dialog: purpose, audience, effective-context date marked "Not an automatic schedule", and reason. It names what it supersedes and binds the exact revision, review and product version | Contract; DK-06 R5 |
| D6 | Withdraw needs a reason and keeps the revision and publication as history; the product has no published basis until a successor is published | Contract |
| D7 | Publish, Published and Withdraw each say that saved estimates, quotations, design releases and assets keep their exact links | Contract; ADR-0048 |
| D8 | SourceReported and Reviewed describe source evidence, never installation approval. Documents are metadata only | Contract |
| D9 | Units come from the bounded vocabulary, shown as recorded and never converted. Unknown is Unresolved with a named owner. Values outside the vocabulary, such as measuring ranges, are interface text | Contract; Products Q3 |
| D10 | One image per revision, linked in the form; None linked is the default | A1.5; IR1 and IR8, proposed |
| D11 | "Publication not confirmed: check status" keeps the original operation. Check status reads its receipt; Retry resends the same operation | Contract recovery |
| D12 | No edit, no review and no publish permission each have their own wording. Actions are hidden and refusals still designed for stale pages; a reviewer who is the author sees the controls disabled with the reason | Separate capabilities |
| D13 | On phone: compact Record header, stacked differences, sticky 48 px Return and Mark Reviewed, an outcome sheet with 16 px input text, and a read-only comparison | [Phone header amendment](phone-header-amendment.md) |
| D14 | The story keeps existing references and allocates `SYN-PROD-000013` for the new record | [Namespace decision](readable-reference-namespaces.md) |

| ID | Departure | Earlier design or app |
|---|---|---|
| P1 | Publish and Withdraw are short centred dialogs | The page contract's "no new modal/drawer"; DK-06 R5 is the precedent |
| P2 | The queue is a grid grouped by state, with bands across the fixed columns | The page contract's readable cards |
| P3 | An Unresolved required attribute blocks Submit (Q2) | Today's command accepts any valid Unresolved attribute |
| P4 | The draft can link one image | Linking is proposed by the [image references](product-image-references.md) IR8 and [ADR-0057](ADR-0057-product-image-renditions.md), and neither is adopted by this record |
| P5 | DP-25's kind and revision differ from the Products catalogue (Q5) | Products `653:38` |

## 5. Not decided

- **Building the pages.** Moving the built pages to this design, the required-attribute rule and where a Family records it (Q2), notifications (Q4) and image linking (P4) each need their own go-ahead and pull request.
- **Not drawn:** the Pricing, Compatibility and Import workspaces, which have their own pages; the Documents and Used in tabs; the full New product form, beyond its identity state; linking an image file; bulk actions and Load more; saving and success toasts beyond the states shown.

## 6. Consequences

- No application code, read model, route, migration, permission or grant changes; all 78 parent IDs remain.
- The `scope:PD-02` register entry and page contract cite this design and its captures. Visual status stays "Needs review".
- The Products contract now points to this design from its evidence section.
- A later change receives a new named version and a new capture revision folder.

## 7. Verification and limits

- Claude checked the frames with screenshots taken inside Figma, and scripted checks for overlaps, frames outside their section, clipped text, template leftovers and links leaving the page. The last run found none.
- **Present mode was not run**, so the prototype links are untested in play. The tablet, phone 320 and state frames are outside the flows and were checked by screenshot and script only.
- The 26 captures are copies of the accepted frames with every Font Awesome icon swapped for `Icon/placeholder`. A scan of the copies found no Font Awesome instance, no stray vector, no prototype link and, across 1,534 texts, no colour differing from its bound variable. They sit on the Captures page from y = 1,100,000. Two were opened and read by eye; all 26 PNG sizes match their frames.
- The named version has not been saved at the time of this record.
- Nothing is built by this record, so there is no application or device evidence, and no UI baseline.
