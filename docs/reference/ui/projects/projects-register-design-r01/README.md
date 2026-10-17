---
document_id: PPO-PRJ-PROJECTS-REGISTER-DESIGN-R01
revision: r01
date: 2026-10-17
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: 271a386b98c0aa612a86a34c03b0ab1da6073b8e
---

# Projects register design r01 — retained captures

These five images retain the Projects register design that Dean accepted on 11 October 2026 and confirmed, as drawn, on 17 October 2026. The decisions, conformance declaration, display rules, departures and open questions are in [the design decision](../../../../decisions/projects-register-design.md). Retain these bytes unchanged; a revised design receives a new revision folder.

Each image is one Figma frame, exported at scale 1 at its exact frame size. Every Font Awesome icon in the frame was replaced by a plain placeholder square before export, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The Powerplants logo is the company's own. Names, references, sites and dates are synthetic fixtures. The images are design compositions, not captures of the application. The application's `/projects` page was built from this Figma page on 13 October 2026 ([implementation decision](../../../../decisions/projects-register-native.md)); comparing that build with these images has not been done.

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · register | [PPO-Projects-Register-01-Desktop-Register-r01.png](PPO-Projects-Register-01-Desktop-Register-r01.png) | 1440 × 900 | 105,861 | `63b26ce5d1bf314fab8d2ff29226c44af4d97ce37fc1bd5c73fa475083ed2ac4` |
| 02 · Desktop · record window open | [PPO-Projects-Register-02-Desktop-Record-Window-r01.png](PPO-Projects-Register-02-Desktop-Record-Window-r01.png) | 1440 × 900 | 187,281 | `388916ce39e7edf453909d70b6ac66a0834a9ea4bf5fff2cef9861b55e639927` |
| 03 · Desktop · two rows selected, small panel | [PPO-Projects-Register-03-Desktop-Selection-Small-Panel-r01.png](PPO-Projects-Register-03-Desktop-Selection-Small-Panel-r01.png) | 1440 × 900 | 150,778 | `9fde802033a5e7e2fcdf798fc67069bdef59dc36880537e41eb635715ddf2def` |
| 04 · Phone · project list | [PPO-Projects-Register-04-Phone-Project-List-r01.png](PPO-Projects-Register-04-Phone-Project-List-r01.png) | 390 × 844 | 69,204 | `fa3dc4bff70d66141a4e5ef9a994c589473031efa21d93a8951ed3d92a3187ad` |
| 05 · Phone · record view open | [PPO-Projects-Register-05-Phone-Record-View-r01.png](PPO-Projects-Register-05-Phone-Record-View-r01.png) | 390 × 844 | 61,496 | `930916eed0ce1d9a559189b1d80db82a67d66ed8a3066bc0b33ebebbb24a7eac` |

The rail and menu collapsed states and the More slide-out are not captured: they are shell behaviour shown for the same pattern in the [Reviews & approvals](../../estimating/reviews-approvals-design-r01/README.md) and [Work orders](../../service/work-orders-design-r01/README.md) captures, and they work in the Projects prototype.

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design", private to Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | "Projects register — Pipedrive pattern, accepted", saved by Dean on 17 October 2026 after these captures were committed (the decision record, section 7) |
| Accepted frames | Page "Projects (accepted)" `209:46`: desktop `209:47`, desktop with two rows selected `209:238`, phone `209:457` |
| Capture copies | Page "Captures (icon-free)": `1110:124118`, `1110:124784`, `1110:125489`, `1110:126205`, `1110:126388` (images 01–05 in order) |

The capture copies are duplicates of the accepted frames with three changes only: each Font Awesome icon instance was swapped for `Icon/placeholder`; the copies' prototype links were cleared, so none points back to the accepted page; and the prototype state was set for the state shown (the record window `Snapshot (large)` in 02, the phone record view `Snapshot (phone)` in 05). A check after the swap found no Font Awesome instance left in any copy, and every remaining glyph vector sits inside an `Icon/placeholder` instance. Each copy was exported with the Figma connector and downloaded directly to this folder. The accepted page `209:46` was not edited.
