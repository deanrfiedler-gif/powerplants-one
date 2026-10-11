---
document_id: PPO-EST-COST-SOURCES-DESIGN-R01
revision: r01
date: 2026-10-11
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: 611123bd2417e844ad07a0ef6c83b84c0191f6cd
---

# Cost sources design r01 — retained captures

These five images retain the Cost sources design that Dean accepted on 11 October 2026. The decisions, conformance declaration, departures and open questions are in [the design decision](../../../../decisions/cost-sources-design.md). Retain these bytes unchanged; a revised design receives a new revision folder.

Each image is one Figma frame, exported at scale 1 at its exact frame size. Every Font Awesome icon in the frame was replaced by a plain placeholder square before export, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The Powerplants logo is the company's own. Figures, names, suppliers and references are synthetic fixtures. The images are design compositions, not captures of the application, which still shows the earlier card list.

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · register | [PPO-Cost-Sources-01-Desktop-Register-r01.png](PPO-Cost-Sources-01-Desktop-Register-r01.png) | 1440 × 900 | 128,995 | `6380473f3ed24ad004a11fe632cdc5cbab53d7c19db034f69682874fec2d1da6` |
| 02 · Desktop · record window open | [PPO-Cost-Sources-02-Desktop-Record-Window-r01.png](PPO-Cost-Sources-02-Desktop-Record-Window-r01.png) | 1440 × 900 | 206,124 | `008b9e2aaca020f41895147ce6f2eeeacac37e1e8df80c72630e42c92dd4cb3c` |
| 03 · Desktop · two rows selected, small panel | [PPO-Cost-Sources-03-Desktop-Selection-Small-Panel-r01.png](PPO-Cost-Sources-03-Desktop-Selection-Small-Panel-r01.png) | 1440 × 900 | 169,339 | `fc66641a1822b5791ff7519e48c1503b08a91b099b4b947753523043def93251` |
| 04 · Phone · source list, scrolled to the end | [PPO-Cost-Sources-04-Phone-Source-List-r01.png](PPO-Cost-Sources-04-Phone-Source-List-r01.png) | 390 × 844 | 73,843 | `23883e16dfaec143bb827c29eea474f7076e6cf2759a8bbed492b7194184d673` |
| 05 · Phone · record view open | [PPO-Cost-Sources-05-Phone-Record-View-r01.png](PPO-Cost-Sources-05-Phone-Record-View-r01.png) | 390 × 844 | 58,518 | `ffbfeec0d9a156fbcb013dc0e4e54f451427355af22f2a51b69966d4b16e6ae8` |

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design", private to Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | "Cost sources — Pipedrive pattern, accepted", saved by Dean on 11 October 2026 |
| Accepted frames | Page "Cost sources (accepted)": desktop `133:2538`, desktop with two rows selected `135:11736`, phone `133:2925`, phone with the list scrolled to the end `150:3620` |
| Capture copies | Page "Captures (icon-free)": `162:12468`, `162:13262`, `162:14091`, `162:14936`, `162:15131` (images 01–05 in order) |

The capture copies were made after Dean saved the named version. They are duplicates of the accepted frames with two changes only: each Font Awesome icon instance was swapped for `Icon/placeholder`, and the prototype switches were set for the state shown (record window, selection panel or phone record view). The first swap pass left nine icons nested inside the phone record view; a second pass replaced them, and a final check found no Font Awesome instance left in any copy. Each copy was exported with the Figma connector and downloaded directly to this folder.

Image 04 is taken from the phone frame scrolled to the end. In the phone frame at rest, Quick add floats over the right-hand side of the last row, as it does in the app; the list has space below its last row so scrolling clears it.
