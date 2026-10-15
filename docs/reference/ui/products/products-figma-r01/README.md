---
document_id: PPO-PD01-FIGMA-R01
revision: r01
date: 2026-10-15
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: cfd465f20787e321df9e80244b3df7aed307b6b2
---

# Products design r01 — retained captures

These nine images retain the Products (PD-01) design that Dean accepted on 15 October 2026. The decisions, conformance declaration, display rules and departures are in [the design decision](../../../../decisions/products-figma-design.md). The first draft's captures in [products-discovery](../../products-discovery/README.md) stay unchanged as history. Retain these bytes unchanged; a revised design receives a new revision folder.

Each image is one Figma frame exported at scale 1 at its exact frame size; the states board is a Figma section, which exports with a 40 px margin. Every Font Awesome icon was replaced by a plain placeholder square before export, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The Powerplants logo is the company's own. Names, references, sites, amounts and dates are synthetic fixtures. The images are design compositions, not captures of the application, whose `/products` page still shows the native catalogue.

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · catalogue | [PPO-Products-01-Desktop-Catalogue-r01.png](PPO-Products-01-Desktop-Catalogue-r01.png) | 1440 × 900 | 170,812 | `8ee60f71488ad73640751eb6d8c4f0f723b9a63f12d075baa5df6a3a17d883f4` |
| 02 · Desktop · catalogue, snapshot open | [PPO-Products-02-Desktop-Catalogue-Snapshot-r01.png](PPO-Products-02-Desktop-Catalogue-Snapshot-r01.png) | 1440 × 900 | 193,425 | `f11c7bc507b3e283a48bc35ea7f1061706aeeb5829229ea97f57e21e11cbc416` |
| 03 · Desktop · product record, Technical | [PPO-Products-03-Desktop-Record-Technical-r01.png](PPO-Products-03-Desktop-Record-Technical-r01.png) | 1440 × 900 | 172,111 | `670353e482dc7365ab7f8a78c1b7bd740a3c08c3574b1f66739969cbbbc57a26` |
| 04 · Desktop · product record, Revisions | [PPO-Products-04-Desktop-Record-Revisions-r01.png](PPO-Products-04-Desktop-Record-Revisions-r01.png) | 1440 × 900 | 168,468 | `468b15e5bf6b40f94d605b3ecb9472c40787afb2ea517a300822e7c1ac15821d` |
| 05 · Tablet · product record | [PPO-Products-05-Tablet-Record-r01.png](PPO-Products-05-Tablet-Record-r01.png) | 1024 × 768 | 134,934 | `dfcdedb663bfa84233c24d40263272e1563bf3d256fab8765cbf2f8348b10803` |
| 06 · Phone · catalogue | [PPO-Products-06-Phone-Catalogue-r01.png](PPO-Products-06-Phone-Catalogue-r01.png) | 390 × 844 | 67,648 | `a28ae40c3511030880918d6d5c935cc32f185c2cfe4c126e3c94031966679514` |
| 07 · Phone · product record | [PPO-Products-07-Phone-Record-r01.png](PPO-Products-07-Phone-Record-r01.png) | 390 × 844 | 52,794 | `f073320f64a698a34ef0c644c3f7788fa4f6d2fd9d2443849ca2adb267ab2a9b` |
| 08 · Phone 320 · not linked to Inventory | [PPO-Products-08-Phone-320-Not-Linked-r01.png](PPO-Products-08-Phone-320-Not-Linked-r01.png) | 320 × 844 | 42,142 | `f4322eb7c3aa5b93f1dcb5186e7750776b24083e07e199ebe1f7f62c0ab04a45` |
| 09 · States board | [PPO-Products-09-States-r01.png](PPO-Products-09-States-r01.png) | 1800 × 960 | 97,684 | `c0ab39db75d8b119bd73f53e838ddb0845c7f37dd3fd5b8d7c2f8dcabfde35f3` |

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design", private to Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | "Excel import, Products and Inventory — accepted" (one save covering the three pages accepted on 15 October 2026) |
| Accepted frames | Page "Products · PD-01 · discovery proposal" `653:38`: `689:2518`, `693:3156`, `694:7672`, `696:2784`, `696:163022`, `696:163542`, `696:164256`, `696:164513` and the States section `703:3419` (images in order) |
| Capture copies | Page "Captures (icon-free)", from y = 90,000: `732:91676`, `732:92660`, `732:93713`, `732:94335`, `732:94936`, `732:95559`, `732:95770`, `732:95911`, `732:96022` (images in order) |

The capture copies are duplicates of the accepted frames with one change: each Font Awesome icon instance, including those nested in shared components, was swapped for `Icon/placeholder`. A scan after the swap found no Font Awesome instance left in any copy, and a second scan found no text whose stored colour differed from its bound variable or matched its background. Each copy was exported with the Figma connector and downloaded directly to this folder.
