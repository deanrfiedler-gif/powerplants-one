---
document_id: PPO-EST-INTAKE-WORKLOAD-DESIGN-R01
revision: r01
date: 2026-10-11
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: 611123bd2417e844ad07a0ef6c83b84c0191f6cd
---

# Intake & workload design r01 — retained captures

These seven images retain the Intake & workload design that Dean accepted on 11 October 2026. The decisions, conformance declaration, departures, the shared-pattern amendment and the open questions are in [the design decision](../../../../decisions/intake-workload-design.md). Retain these bytes unchanged; a revised design receives a new revision folder.

Each image is one Figma frame, exported at scale 1 at its exact frame size. Every Font Awesome icon in the frame was replaced by a plain placeholder square before export, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The Powerplants logo is the company's own. Figures, names, customers, sites and references are synthetic fixtures. The images are design compositions, not captures of the application, which still shows the ES-01 register with its docked panel.

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · register | [PPO-Intake-Workload-01-Desktop-Register-r01.png](PPO-Intake-Workload-01-Desktop-Register-r01.png) | 1440 × 900 | 161,823 | `7acdb2ac9792380c003414c4b0c697867eb85ee69720bb1b38e7ddee36126049` |
| 02 · Desktop · record window open | [PPO-Intake-Workload-02-Desktop-Record-Window-r01.png](PPO-Intake-Workload-02-Desktop-Record-Window-r01.png) | 1440 × 900 | 202,291 | `6c31bf0dfb1e1767c012e8e4be655a14808bf6518b1080d0021b19c87a1e8cbc` |
| 03 · Desktop · two rows selected, small panel | [PPO-Intake-Workload-03-Desktop-Selection-Small-Panel-r01.png](PPO-Intake-Workload-03-Desktop-Selection-Small-Panel-r01.png) | 1440 × 900 | 204,713 | `2aa4f441cd044ebddeb31c6c5425a87e9cfa6a566f79cc4189c24489953a7aa7` |
| 04 · Desktop · Saved estimates view | [PPO-Intake-Workload-04-Desktop-Saved-Estimates-r01.png](PPO-Intake-Workload-04-Desktop-Saved-Estimates-r01.png) | 1440 × 900 | 138,920 | `6cacbe687e1197a73095fdff14bb8b3b638527ce1895d409ae97786ddbaae012` |
| 05 · Desktop · rail and menu collapsed, record window open | [PPO-Intake-Workload-05-Desktop-Collapsed-Record-Window-r01.png](PPO-Intake-Workload-05-Desktop-Collapsed-Record-Window-r01.png) | 1440 × 900 | 192,250 | `3a6b3c9a3920d9340524fcb6cf558e40f2dfb1cbe92c022929c4a660d81f93d6` |
| 06 · Phone · workload list | [PPO-Intake-Workload-06-Phone-Workload-List-r01.png](PPO-Intake-Workload-06-Phone-Workload-List-r01.png) | 390 × 844 | 90,272 | `a2a391e9966c1f5e44541b249f7db3da4b100db8f1d050c5c25a462dee9c0ec0` |
| 07 · Phone · record view open | [PPO-Intake-Workload-07-Phone-Record-View-r01.png](PPO-Intake-Workload-07-Phone-Record-View-r01.png) | 390 × 844 | 56,723 | `84508c7183a2823a70e5c697e82e584b1ea44fb21b44a35fa6e30cd612e274b8` |

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design", private to Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | "Intake & workload — Pipedrive pattern, accepted", saved by Dean on 11 October 2026 |
| Accepted frames | Page "Intake & workload (accepted)": desktop register `128:8846`, desktop with two rows selected `128:9024`, desktop Saved estimates `172:1535`, phone `128:9231` |
| Capture copies | Page "Captures (icon-free)": `187:8840`, `187:9979`, `187:11035`, `187:12199`, `187:12896`, `187:14023`, `187:14381` (images 01–07 in order) |

The capture copies were made after Dean saved the named version. They are duplicates of the accepted frames with two changes only: each Font Awesome icon instance was swapped for `Icon/placeholder`, and the prototype switches were frozen for the state shown (record window, selection panel, collapsed rail and menu, or phone record view). Every icon was replaced in the first pass, and a check after the swap found no Font Awesome instance left in any copy. Each copy was exported with the Figma connector and downloaded directly to this folder, and each downloaded image was inspected.

Image 05 shows the shared-pattern amendment A1 in the decision: with the rail and menu collapsed, the record window keeps its 960 px width and its left edge at 480 px, so close, previous and next stay visible over the grid. In image 03 the ticks in the two checked rows are placeholders too, because the tick is a Font Awesome icon.

After these captures, the shared "v2 / Menu heading" fix (F1 in the decision) moved the Intake rules block at the foot of the secondary menu 10 px higher in the Figma frames, giving its heading the same space as the other headings. Nothing else in these frames changed. These bytes stay as captured; a later revision will show the fix.
