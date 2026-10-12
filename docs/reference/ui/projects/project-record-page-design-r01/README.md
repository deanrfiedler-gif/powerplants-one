---
document_id: PPO-PJ-RECORD-DESIGN-R01
revision: r01
date: 2026-10-12
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: 4228d470ca4c566a15e7c3397fc053b8f7bef4bc
---

# Project record page design r01 — retained captures

These ten images retain the project record page that Dean accepted on 12 October 2026, the third record type on the shared record layout. The decisions, the Wrike observation, the conformance declaration, display rules, departures and open questions are in [the design decision](../../../../decisions/project-record-page-design.md). Retain these bytes unchanged. A revised design receives a new revision folder.

Each image is one Figma frame, exported at scale 1 at its exact frame size. Images 09 and 10 are board frames: each holds copies of several accepted frames, laid out with a label above each one. Before export, every Font Awesome icon was replaced by a plain placeholder square, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The at-risk and overdue markers in the Gantt are icons, so they appear as squares too. The Powerplants logo is the company's own. Figures, names, references and dates are synthetic fixtures. The images are design compositions, not captures of the application, which still shows the project as the Gantt with dialogs.

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · Overview (SYN-PPO-PRJ-000027, needs attention · 3 items) | [PPO-Project-Record-01-Desktop-Overview-r01.png](PPO-Project-Record-01-Desktop-Overview-r01.png) | 1440 × 900 | 198,430 | `41f8705debd621a2dd07e7cd258bf240eeccaac073bc8ba7508144c0755ec764` |
| 02 · Desktop · Schedule (the Gantt, details folded) | [PPO-Project-Record-02-Desktop-Schedule-Gantt-r01.png](PPO-Project-Record-02-Desktop-Schedule-Gantt-r01.png) | 1440 × 900 | 169,907 | `c3beabff7cf3201059f5c26b856e529f94f729f9a4ebe5f909e02e763162008b` |
| 03 · Desktop · Baselines (compared with r1) | [PPO-Project-Record-03-Desktop-Baselines-r01.png](PPO-Project-Record-03-Desktop-Baselines-r01.png) | 1440 × 900 | 194,049 | `a9e320399120254f3c2e29c8a34dc8a5d441bcf3cb634311ec4fe3e5aad22619` |
| 04 · Desktop · Acceptance, not started | [PPO-Project-Record-04-Desktop-Acceptance-Not-Started-r01.png](PPO-Project-Record-04-Desktop-Acceptance-Not-Started-r01.png) | 1440 × 900 | 197,123 | `cfae3f8c6b878477a10e048c5f7db28fa73a0b2a9a2c221bbf8ac5ab6b63ab69` |
| 05 · Desktop · Files | [PPO-Project-Record-05-Desktop-Files-r01.png](PPO-Project-Record-05-Desktop-Files-r01.png) | 1440 × 900 | 189,033 | `dd9f371ceb5a09a1cd42c3453c56c49f568b0b4e2172745e1b373d7239e77306` |
| 06 · Desktop · History | [PPO-Project-Record-06-Desktop-History-r01.png](PPO-Project-Record-06-Desktop-History-r01.png) | 1440 × 900 | 176,337 | `508a20b1a09b9dcca371ac1f7d411cfb7e2f992e4d1c7f9f63ae45e668500777` |
| 07 · Desktop · Record baseline dialog (r2) | [PPO-Project-Record-07-Desktop-Record-Baseline-Dialog-r01.png](PPO-Project-Record-07-Desktop-Record-Baseline-Dialog-r01.png) | 1440 × 900 | 262,731 | `f8900c07cdfaad413860cb44170c520bea137b2df38eccecdb0d8d69e42b9ca9` |
| 08 · Desktop · Projects register snapshot with "Open project page" | [PPO-Project-Record-08-Desktop-Register-Open-Project-Page-r01.png](PPO-Project-Record-08-Desktop-Register-Open-Project-Page-r01.png) | 1440 × 900 | 189,314 | `cfb612ae0debad4579abf64f558c659d0f58f79db8f66539c5eacfb08029f7ae` |
| 09 · Desktop · six states (board) | [PPO-Project-Record-09-Desktop-States-r01.png](PPO-Project-Record-09-Desktop-States-r01.png) | 2560 × 1584 | 303,766 | `9e933fac39260fb55a076ca8f1c19ade37dfa573f0201bc8ea19d8ca8a0ae109` |
| 10 · Phone · list, Details, Overview, Schedule and the action sheet (board) | [PPO-Project-Record-10-Phone-List-Tabs-Action-Sheet-r01.png](PPO-Project-Record-10-Phone-List-Tabs-Action-Sheet-r01.png) | 2190 × 952 | 297,059 | `c3638f50eb6d6613467a866883798eb2d0cea7578f5beb5cdee0fba3531ba09d` |

Image 09 shows, left to right and top to bottom:
1. a closed project;
2. a read-only viewer;
3. a schedule not ready for a baseline;
4. an editor who is not the coordinator;
5. a dependency warning;
6. a newer saved version while editing.

Each state is the top of a desktop record page with an excerpt of the main column. Image 10 shows, left to right, the phone list, then the Details, Overview and Schedule tabs, then Details with the "…" action sheet open.

Image 08 is retained because the snapshot's footer differs from the accepted Projects register design: "Open project page" replaces "Open schedule" as the main action, and Open schedule becomes the second button. The register's own captures are not yet in the repository.

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO — Design" in Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | "Project record page — shared record layout, accepted", to be saved by Dean |
| Accepted frames | Page "Project record page (accepted)" `345:2`: Overview `345:5185`, Schedule `348:516`, Baselines `349:674`, Acceptance `351:994`, Files `351:1601`, History `352:1663`, Record baseline dialog `368:3579`, register entry `355:70824`, states section `358:5184`, phone list `355:71007`, Details `354:5184`, Overview `355:2281`, Schedule list `355:2665` and the action sheet `362:3714` |
| Capture copies | Page "Captures (icon-free)": `375:41168`, `375:41376`, `375:41752`, `375:41945`, `375:42037`, `375:42168`, `375:42257`, `375:42499`, `375:46106`, `375:46107` (images 01–10 in order) |

The capture copies duplicate the accepted frames with these changes only:
- each Font Awesome icon instance was swapped for `Icon/placeholder`;
- prototype links were removed;
- copies 09 and 10 lay several frames out on one board, with labels.

A check after the swap found no Font Awesome instance left in any copy: 389 icons were swapped in all. Each copy was exported with the Figma connector at scale 1 and downloaded to this folder.
