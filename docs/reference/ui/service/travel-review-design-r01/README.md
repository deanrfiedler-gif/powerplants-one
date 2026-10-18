---
document_id: PPO-PL05-TRAVEL-REVIEW-FIGMA-R01
revision: r01
date: 2026-10-18
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: 3bd12c428ec1db087d35bf2e6e55f8845a78b9db
---

# Travel review design r01 — retained captures

These six images retain the Travel review design (PL-05) that Dean accepted on 18 October 2026. They cover `/schedule/travel`: one person's day as a route at desktop 1440 × 900, tablet 1024, and phone 390 and 320, including the state that compares a different order.

Two phone states are included. The decisions, conformance declaration and departures are in [the design decision](../../../../decisions/travel-review-figma-design.md). Retain these bytes unchanged; a revised design receives a new revision folder.

Each image is one Figma frame exported at scale 1 at its exact frame size. Image 6 is a frame holding copies of the two state frames side by side on the canvas grey.

Every Font Awesome icon was replaced by a plain placeholder square before export, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The Powerplants logo is the company's own. The people, visits, sites, blocks and times are synthetic fixtures. No route-estimate provider is configured, so the route estimate reads "Unknown", the travel legs use reviewed standard allowances, and there is no map. The images are design compositions, not captures of the application.

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · route with a block overlapping travel | [PPO-Travel-Review-01-Desktop-Route-r01.png](PPO-Travel-Review-01-Desktop-Route-r01.png) | 1440 × 900 | 190,916 | `7ac9c4b10a6aac8d4a5655ef15567093ffd0578c23f2ad7c500b2343b5c0d90d` |
| 02 · Desktop · comparing a different order | [PPO-Travel-Review-02-Desktop-Compare-Order-r01.png](PPO-Travel-Review-02-Desktop-Compare-Order-r01.png) | 1440 × 900 | 199,356 | `ad663dcae8882849bf4b6061db8e70540301701b13a95d50d4334e64b086493e` |
| 03 · Tablet 1024 · route, rail and side menu collapsed | [PPO-Travel-Review-03-Tablet-Route-r01.png](PPO-Travel-Review-03-Tablet-Route-r01.png) | 1024 × 900 | 138,802 | `0de44767cf0c2969821080cf1954ec7099f6877951b68fde8cd534f1c34bbfe7` |
| 04 · Phone 390 · route, full length | [PPO-Travel-Review-04-Phone-Route-r01.png](PPO-Travel-Review-04-Phone-Route-r01.png) | 390 × 1697 | 123,058 | `40b7d611f36954a54d16d58bc961525b6cb3c7074d0e2cc5f10dc241b5aff1e4` |
| 05 · Phone 320 · route, full length | [PPO-Travel-Review-05-Phone-320-Route-r01.png](PPO-Travel-Review-05-Phone-320-Route-r01.png) | 320 × 1849 | 120,520 | `3d3c1470792cc423e6047a35272108e081547f04766260b5769867f693469d49` |
| 06 · States · two phone states | [PPO-Travel-Review-06-Phone-States-r01.png](PPO-Travel-Review-06-Phone-States-r01.png) | 980 × 964 | 61,108 | `e6d6ffcbccac822dbdbd88bb1db946d1998b52ee84fa510a6c74b5d30eb7c860` |

Image 6 holds, left to right:
1. no assigned visits;
2. could not load.

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design", private to Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | "Travel review — accepted", saved 18 October 2026 |
| Accepted frames | Page "Travel review · PL-05" `1371:3488`, notes card `1374:985`, in image order:<br>• `1371:3524`, `1373:1001`;<br>• `1371:3653`;<br>• `1371:3722`, `1373:1604`;<br>• the states: `1371:3758`, `1371:3800` |
| Capture copies | Page "Captures (icon-free)" `115:2`, from y = 212,000: `1396:170721`, `1396:170877`, `1396:171032`, `1396:171170`, `1396:171290`, `1396:171410` (images in order) |

The capture copies are duplicates of the accepted frames with two changes:
- Prototype links were removed. The shell components' own rail and menu interactions remain inside the instances.
- Each of the 170 Font Awesome icon instances, including those nested in shared components, was swapped for `Icon/placeholder` (`67:77`) at its original size.

After the swap, a scan found no Font Awesome instance and no visible vector outside a placeholder or the logo.

Each copy was exported with the Figma connector (PNG, scale 1) and downloaded directly to this folder.
