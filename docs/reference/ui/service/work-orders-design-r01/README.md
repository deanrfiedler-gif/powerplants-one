---
document_id: PPO-SVC-WORK-ORDERS-DESIGN-R01
revision: r01
date: 2026-10-11
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: 40ac5a01439d37a09fcba5a031afa4efab30711d
---

# Work orders design r01 — retained captures

These six images retain the Work orders register design that Dean accepted on 11 October 2026. The decisions, conformance declaration, display rules, departures and open questions are in [the design decision](../../../../decisions/work-orders-design.md). Retain these bytes unchanged; a revised design receives a new revision folder.

Each image is one Figma frame, exported at scale 1 at its exact frame size. Every Font Awesome icon in the frame was replaced by a plain placeholder square before export, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The Powerplants logo is the company's own. Names, references, sites and dates are synthetic fixtures. The images are design compositions, not captures of the application, whose `/service/work-orders` page still shows record cards.

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · register | [PPO-Work-Orders-01-Desktop-Register-r01.png](PPO-Work-Orders-01-Desktop-Register-r01.png) | 1440 × 900 | 204,142 | `4207f483ef907331ec61bf50f7c44be535d332475321545882194df0b85c8585` |
| 02 · Desktop · record window open | [PPO-Work-Orders-02-Desktop-Record-Window-r01.png](PPO-Work-Orders-02-Desktop-Record-Window-r01.png) | 1440 × 900 | 243,181 | `ee1d7273b15a7ef1ce3d0c296b816199baad14f507c348c82051304943452380` |
| 03 · Desktop · two rows selected, small panel | [PPO-Work-Orders-03-Desktop-Selection-Small-Panel-r01.png](PPO-Work-Orders-03-Desktop-Selection-Small-Panel-r01.png) | 1440 × 900 | 240,065 | `53deda1f32856be4cb4226b3a7a7bc8812067fdd5362d788b18d86483ddef44f` |
| 04 · Desktop · rail and menu collapsed, record window open | [PPO-Work-Orders-04-Desktop-Collapsed-Record-Window-r01.png](PPO-Work-Orders-04-Desktop-Collapsed-Record-Window-r01.png) | 1440 × 900 | 254,187 | `35a6842a0322f2d508e339e9e8b856c7821b67fc5f13792ee216c4fbc95cd7e4` |
| 05 · Phone · work order list | [PPO-Work-Orders-05-Phone-Work-Order-List-r01.png](PPO-Work-Orders-05-Phone-Work-Order-List-r01.png) | 390 × 844 | 80,207 | `866e33041f37ddb1d81dae8a8c3869eb073eb3d20d580860fd547d6e328c5b97` |
| 06 · Phone · record view open | [PPO-Work-Orders-06-Phone-Record-View-r01.png](PPO-Work-Orders-06-Phone-Record-View-r01.png) | 390 × 844 | 67,896 | `bd2f5ac697b37337aeec6657ddb182340013b21def476bf096d739f9b1933501` |

Capture 04 is kept because this is the first Service design: it shows the grouped Service rail collapsed to icons, with a short divider for each group, and the record window staying right-aligned. The More slide-out is not captured again; it is shell behaviour identical to capture 04 of the [Reviews & approvals design](../../estimating/reviews-approvals-design-r01/README.md), with Service operations as the current workspace, and it works in the Work orders prototype.

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design", private to Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | "Work orders — Pipedrive pattern, accepted" |
| Accepted frames | Page "Work orders (accepted)": desktop `196:24111`, desktop with two rows selected `199:31896`, phone `196:24496` |
| Capture copies | Page "Captures (icon-free)": `203:29702`, `203:31329`, `203:32919`, `203:34577`, `203:36292`, `203:36715` (images 01–06 in order) |

The capture copies are duplicates of the accepted frames with two changes only: each Font Awesome icon instance was swapped for `Icon/placeholder`, and the prototype state was set for the state shown (record window in 02 and 04; the rail collapsed and the secondary menu reduced to its strip in 04; the phone record view in 06). A check after the swap found no Font Awesome instance left in any copy. Each copy was exported with the Figma connector and downloaded directly to this folder.
