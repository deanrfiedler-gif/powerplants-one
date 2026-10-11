---
document_id: PPO-EST-SALES-BRIEFS-DESIGN-R01
revision: r01
date: 2026-10-11
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: 611123bd2417e844ad07a0ef6c83b84c0191f6cd
---

# Sales briefs design r01 — retained captures

These five images retain the Sales briefs design (the Estimating Intake receiving queue, `/estimating/intake`) that Dean accepted on 11 October 2026. The decisions, conformance declaration, state rule, departures and open questions are in [the design decision](../../../../decisions/sales-briefs-design.md). Retain these bytes unchanged; a revised design receives a new revision folder.

Each image is one Figma frame, exported at scale 1 at its exact frame size. Every Font Awesome icon in the frame was replaced by a plain placeholder square before export, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The Powerplants logo is the company's own. Figures, names and references are synthetic fixtures. The images are design compositions, not captures of the application, whose `/estimating/intake` page is still a stack of cards labelled Intake.

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · register | [PPO-Sales-Briefs-01-Desktop-Register-r01.png](PPO-Sales-Briefs-01-Desktop-Register-r01.png) | 1440 × 900 | 131,412 | `492dd87d58db96a211525dcb5d0233b9499a6d6ae0ad5585437846d77ed7a2a2` |
| 02 · Desktop · record window open | [PPO-Sales-Briefs-02-Desktop-Record-Window-r01.png](PPO-Sales-Briefs-02-Desktop-Record-Window-r01.png) | 1440 × 900 | 204,179 | `4dd43e02e614488fc120d84fcfce6d9343ba3d56f106cd06b121a56e934b75fa` |
| 03 · Desktop · two rows selected, small panel | [PPO-Sales-Briefs-03-Desktop-Selection-Small-Panel-r01.png](PPO-Sales-Briefs-03-Desktop-Selection-Small-Panel-r01.png) | 1440 × 900 | 175,767 | `58afde395f5856e7014676891259b1e4aa71684f327a32b5545417854fed32cf` |
| 04 · Phone · brief list | [PPO-Sales-Briefs-04-Phone-Brief-List-r01.png](PPO-Sales-Briefs-04-Phone-Brief-List-r01.png) | 390 × 844 | 84,157 | `28993d59c4420f89e4127eb8bf8070ea21d90486b56c8dc777e5516a62b0b9a9` |
| 05 · Phone · record view open | [PPO-Sales-Briefs-05-Phone-Record-View-r01.png](PPO-Sales-Briefs-05-Phone-Record-View-r01.png) | 390 × 844 | 62,702 | `827481845545bbfb39f714388c5302921aea509fccebf7a6b70c86e0f388f3dc` |

The More slide-out and the collapsed rail and secondary menu are not captured again. They are shell behaviour identical to captures 04 and 05 of the [Reviews & approvals design](../reviews-approvals-design-r01/README.md), and they work in the Sales briefs prototype.

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design", private to Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | "Sales briefs — Pipedrive pattern, accepted", saved by Dean on 11 October 2026 |
| Accepted frames | Page "Sales briefs (accepted)": desktop `152:1123`, desktop with two rows selected `152:1302`, phone `152:1510` |
| Capture copies | Page "Captures (icon-free)": `162:15486`, `162:16527`, `162:17568`, `162:18677`, `162:19031` (images 01–05 in order) |

The capture copies are duplicates of the accepted frames with two changes only: each Font Awesome icon instance was swapped for `Icon/placeholder` (166, 166, 178, 45 and 45 instances), and the record window was made visible for the state shown (02 and 05). A check after the swap found no Font Awesome instance left in any copy. The copies were made before Dean saved the named version, and the accepted page was not changed afterwards. Each copy was exported with the Figma connector and downloaded directly to this folder.
