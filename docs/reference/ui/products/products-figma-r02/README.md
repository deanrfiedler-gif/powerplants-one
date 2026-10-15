---
document_id: PPO-PD01-FIGMA-R02
revision: r02
date: 2026-10-15
owner: Dean Fiedler
status: Retained design reference for Amendment A1 (product image); drawn at the owner's direction, owner visual review and named version pending; icon-free; not an application capture or UI baseline
source_commit: d070a61ff17e04ffa0f0d37c16052c24a0bb0e26
---

# Products design r02 — Amendment A1 captures

These nine images retain Amendment A1 to the Products (PD-01) design: the product image. On 15 October 2026 Dean asked whether the accepted design had a place for an image of the actual product, as the earlier [r04 preview](../PPO-Products-Preview-r04.html) did. It did not. He then directed the amendment: "Proceed with your recommendations." The decision, display rules and status are in section 8 of [the design decision](../../../../decisions/products-figma-design.md). The accepted design's captures in [Products design r01](../products-figma-r01/README.md) stay unchanged as the accepted history. Retain these bytes unchanged; a later revision receives a new folder.

Each image is one Figma frame exported at scale 1 at its exact frame size; the states board is a Figma section, which exports with a 40 px margin. Every Font Awesome icon was replaced by a plain placeholder square before export, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. That includes the camera glyph on the no-image placeholder and the magnifying glass on View full size. The Powerplants logo is the company's own. Names, references, sites, amounts and dates are synthetic fixtures.

The six product pictures (CP-40, CC-8, DP-12, ECP-2, FV-20 and SM-90) are synthetic concept images of fictional equipment, generated with Figma's image generation for this design. They show no real manufacturer's product, label or brand. The other six catalogue products show the no-image placeholder on purpose. The images are design compositions, not captures of the application, whose `/products` page still shows the native catalogue.

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · catalogue, with thumbnails | [PPO-Products-01-Desktop-Catalogue-r02.png](PPO-Products-01-Desktop-Catalogue-r02.png) | 1440 × 900 | 183,035 | `d5f95abb0f8e1d45f639733e1a8f17a13b0bbe899c6e3c3304d6dcdbaf6cca9e` |
| 02 · Desktop · catalogue, snapshot open | [PPO-Products-02-Desktop-Catalogue-Snapshot-r02.png](PPO-Products-02-Desktop-Catalogue-Snapshot-r02.png) | 1440 × 900 | 202,780 | `39d408cc4263af14c45798b3eff639ebdf124b42362d421a05e8f8887bbdde4b` |
| 03 · Desktop · product record, Technical, image panel | [PPO-Products-03-Desktop-Record-Technical-r02.png](PPO-Products-03-Desktop-Record-Technical-r02.png) | 1440 × 900 | 229,444 | `64fce2d0a64a5e5bf7145ff420e69b2215e949e66e024a39b066174a14699934` |
| 04 · Desktop · product record, Revisions, image panel | [PPO-Products-04-Desktop-Record-Revisions-r02.png](PPO-Products-04-Desktop-Record-Revisions-r02.png) | 1440 × 900 | 225,881 | `089b207f5db1c0d5326ae9235c4d9392cf0168571e9571a20b7e8f698ebf4aec` |
| 05 · Tablet · product record, image panel | [PPO-Products-05-Tablet-Record-r02.png](PPO-Products-05-Tablet-Record-r02.png) | 1024 × 768 | 162,326 | `17c142bf5747700e345d004ae315f406c41486bb2c7df79cc342053ea129a342` |
| 06 · Phone · catalogue, with thumbnails | [PPO-Products-06-Phone-Catalogue-r02.png](PPO-Products-06-Phone-Catalogue-r02.png) | 390 × 844 | 86,265 | `46d7ac3d41983622c3a097de676a5d4db8ff196496a9abfacdb5e086f1a2cc33` |
| 07 · Phone · product record, image row | [PPO-Products-07-Phone-Record-r02.png](PPO-Products-07-Phone-Record-r02.png) | 390 × 844 | 61,709 | `b7bd2a5484d290f9b1e871ce886d972a572f291025342bf68ee338cdfb191f5e` |
| 08 · Phone 320 · not linked to Inventory, no image | [PPO-Products-08-Phone-320-Not-Linked-No-Image-r02.png](PPO-Products-08-Phone-320-Not-Linked-No-Image-r02.png) | 320 × 844 | 41,729 | `6ed590c3f74246dfa9de5edbf06dd4093fe43fd6627f6f519f9613a05fe985df` |
| 09 · States board, with No image | [PPO-Products-09-States-r02.png](PPO-Products-09-States-r02.png) | 1800 × 960 | 112,903 | `a6d9cc6418f3d53eeb5c856d406c18579069ca7d1a5dc8aa2cbf93e38a7b6a87` |

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design", private to Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | None yet. The accepted design remains "Excel import, Products and Inventory — accepted"; A1 needs its own named version after Dean's review |
| Amended frames | Page "Products · PD-01 · discovery proposal" `653:38`, edited in place: `689:2518`, `693:3156`, `694:7672`, `696:2784`, `696:163022`, `696:163542`, `696:164256`, `696:164513` and the States section `703:3419` (images in order) |
| New page components | Product image (record) `829:3490`, Product thumbnail `829:3461`; image sources `822:3453` |
| Capture copies | Page "Captures (icon-free)", from y = 118,000: `833:207331`, `833:208082`, `833:208895`, `833:209310`, `833:209700`, `833:210112`, `833:210317`, `833:210458`, `833:210568` (images in order) |

The capture copies are duplicates of the amended frames with one change: each Font Awesome icon instance, including those nested in shared components, was swapped for `Icon/placeholder`. A scan after the swap found no Font Awesome instance left in any copy, and a second scan of 851 visible text layers found no text whose stored colour differed from its bound variable or matched its background. Each copy was exported with the Figma connector at scale 1 and inspected.
