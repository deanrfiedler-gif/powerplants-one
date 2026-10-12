---
document_id: PPO-ENG-WORKLOAD-DESIGN-R01
revision: r01
date: 2026-10-11
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: 453cc6bd4112b435b18278e5eb7154fc68d0ea17
---

# Engineering workload design r01 — retained captures

These five images retain the Engineering workload design (`/engineering`, EN-01) that Dean accepted on 11 October 2026. The decisions, conformance declaration, rules, departures and open questions are in [the design decision](../../../../decisions/engineering-workload-design.md). Retain these bytes unchanged; a revised design receives a new revision folder.

Each image is one Figma frame, exported at scale 1 at its exact frame size. Every Font Awesome icon in the frame was replaced by a plain placeholder square before export, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The Powerplants logo is the company's own. Figures, names and references are synthetic fixtures. The images are design compositions, not captures of the application. The application's `/engineering` page still shows the tabbed register and package drawer of the [Engineering r02 design](../../../../decisions/engineering-r02-integration.md).

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · register | [PPO-Engineering-Workload-01-Desktop-Register-r01.png](PPO-Engineering-Workload-01-Desktop-Register-r01.png) | 1440 × 900 | 138,679 | `199c633e3f074fba743c24123f481424e2e494675abfceea77634587d6926e7e` |
| 02 · Desktop · record window open | [PPO-Engineering-Workload-02-Desktop-Record-Window-r01.png](PPO-Engineering-Workload-02-Desktop-Record-Window-r01.png) | 1440 × 900 | 215,860 | `7039b745f388c46a8cc89d653e3af0c5d573c28d9a68a3ab4e48d474a432cdd0` |
| 03 · Desktop · two rows selected, small panel | [PPO-Engineering-Workload-03-Desktop-Selection-Small-Panel-r01.png](PPO-Engineering-Workload-03-Desktop-Selection-Small-Panel-r01.png) | 1440 × 900 | 184,183 | `bc0afa7299cf70f659a833d9b467b1eca911622329cb2e9d9bd189c7aa0896cb` |
| 04 · Phone · package list | [PPO-Engineering-Workload-04-Phone-Package-List-r01.png](PPO-Engineering-Workload-04-Phone-Package-List-r01.png) | 390 × 844 | 85,588 | `e3d30c8b89e18b7bf187572edcaae31254e80c9a87e5636470c99da74ec5f113` |
| 05 · Phone · record view open | [PPO-Engineering-Workload-05-Phone-Record-View-r01.png](PPO-Engineering-Workload-05-Phone-Record-View-r01.png) | 390 × 844 | 59,248 | `03182a674687577b2fd3d0e557cc9c9d48968dd3665c674ec0a69bb225ef5382` |

The More slide-out and the collapsed rail and secondary menu are not captured again. They are shell behaviour, identical to captures 04 and 05 of the [Reviews & approvals design](../../estimating/reviews-approvals-design-r01/README.md), and they work in the Engineering workload prototype.

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design", private to Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | "Engineering workload — Pipedrive pattern, accepted", saved by Dean on 11 October 2026 |
| Accepted frames | Page "Engineering workload (accepted)": desktop `184:1048`, desktop with two rows selected `189:23728`, phone `184:1435` |
| Capture copies | Page "Captures (icon-free)": `193:13095`, `193:14382`, `193:15634`, `193:16956`, `193:17341` (images 01–05 in order) |

The capture copies are duplicates of the accepted frames with only two changes:

- Each Font Awesome icon instance was swapped for `Icon/placeholder`: 202, 202, 212, 45 and 45 instances, in image order. A check after the swap found no Font Awesome instance left in any copy.
- The record window was made visible for the state shown (images 02 and 05).

The copies were made before Dean saved the named version, and the accepted page was not changed afterwards. Each copy was exported with the Figma connector and downloaded directly to this folder.
