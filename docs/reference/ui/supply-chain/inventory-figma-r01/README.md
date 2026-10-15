---
document_id: PPO-SC05-INVENTORY-FIGMA-R01
revision: r01
date: 2026-10-15
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: cfd465f20787e321df9e80244b3df7aed307b6b2
---

# Inventory design r01 — retained captures

These nine images retain the Inventory (SC-05) design that Dean accepted on 15 October 2026. The decisions, conformance declaration, display rules and departures are in [the design decision](../../../../decisions/inventory-figma-design.md). Retain these bytes unchanged; a revised design receives a new revision folder.

Each image is one Figma frame exported at scale 1 at its exact frame size; the states board is a Figma section, which exports with a 40 px margin. Every Font Awesome icon was replaced by a plain placeholder square before export, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The Powerplants logo is the company's own. Names, references, sites, amounts and dates are synthetic fixtures. The images are design compositions, not captures of the application, whose `/supply/stock` page still shows the native worklist.

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · register | [PPO-Inventory-01-Desktop-Register-r01.png](PPO-Inventory-01-Desktop-Register-r01.png) | 1440 × 900 | 142,680 | `b4e911706a23d52f5ebef49b71460b98d3264e9b98f8a1afe67d5a6422e22cec` |
| 02 · Desktop · register, snapshot open | [PPO-Inventory-02-Desktop-Register-Snapshot-r01.png](PPO-Inventory-02-Desktop-Register-Snapshot-r01.png) | 1440 × 900 | 154,196 | `fe2471b95b91260db9f3cd46053c2f3508708459632377354108be83a1d9c4a6` |
| 03 · Desktop · item record, Quantities | [PPO-Inventory-03-Desktop-Item-Quantities-r01.png](PPO-Inventory-03-Desktop-Item-Quantities-r01.png) | 1440 × 900 | 162,355 | `57c654214065a4f4863423f1f2b1c91bb9791905b91eb4501340dd18fce80005` |
| 04 · Desktop · item record, Activity | [PPO-Inventory-04-Desktop-Item-Activity-r01.png](PPO-Inventory-04-Desktop-Item-Activity-r01.png) | 1440 × 900 | 163,368 | `0087baf0c8cc079eb77c5a09e4ec05f3c5a10679e4b14f54f333dde1e17ae31e` |
| 05 · Tablet · item record | [PPO-Inventory-05-Tablet-Item-r01.png](PPO-Inventory-05-Tablet-Item-r01.png) | 1024 × 768 | 128,682 | `1f4cafe3f03b3053307a1c3590cea0e388bfa6d4916f444bf8219369b598d437` |
| 06 · Phone · register | [PPO-Inventory-06-Phone-Register-r01.png](PPO-Inventory-06-Phone-Register-r01.png) | 390 × 844 | 75,976 | `b11ebb5e0770ebe57a5b3e0914a7c109c3e78564ffa430f3427ef28ed74a28a7` |
| 07 · Phone · item record | [PPO-Inventory-07-Phone-Item-r01.png](PPO-Inventory-07-Phone-Item-r01.png) | 390 × 844 | 54,288 | `5e897e0ee892774c1835a7e2b18850fd5305d3eca04f844e67efc486aac15b07` |
| 08 · Phone 320 · quantities Unknown | [PPO-Inventory-08-Phone-320-Quantities-Unknown-r01.png](PPO-Inventory-08-Phone-320-Quantities-Unknown-r01.png) | 320 × 844 | 42,989 | `cdb2976c4a675c1d47f1b8a03283c628baf956eedf9b0d21906d4021f96be777` |
| 09 · States board | [PPO-Inventory-09-States-r01.png](PPO-Inventory-09-States-r01.png) | 1800 × 960 | 100,289 | `14a9e6ef8afc88e759ed8c7fb209a39d6734968ab37d56fe6d0ecb7231022dfa` |

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design", private to Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | "Excel import, Products and Inventory — accepted" (one save covering the three pages accepted on 15 October 2026) |
| Accepted frames | Page "Inventory · SC-05" `697:39`: `698:3419`, `701:4388`, `702:3419`, `702:165468`, `702:165896`, `702:166327`, `702:166347`, `702:166814` and the States section `705:2577` (images in order) |
| Capture copies | Page "Captures (icon-free)", from y = 90,000: `732:96996`, `732:98208`, `732:99477`, `732:100053`, `732:100558`, `732:101137`, `732:101348`, `732:101505`, `732:101594` (images in order) |

The capture copies are duplicates of the accepted frames with one change: each Font Awesome icon instance, including those nested in shared components, was swapped for `Icon/placeholder`. A scan after the swap found no Font Awesome instance left in any copy, and a second scan found no text whose stored colour differed from its bound variable or matched its background. Each copy was exported with the Figma connector and downloaded directly to this folder.
