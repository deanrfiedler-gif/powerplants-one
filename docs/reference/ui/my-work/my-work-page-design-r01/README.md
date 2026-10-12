---
document_id: PPO-MYWORK-PAGE-DESIGN-R01
revision: r01
date: 2026-10-12
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: 51df03296abf70bb6b8c935c5b39fb1bf791efce
---

# My Work page design r01 — retained captures

These nine images retain the My Work design that Dean accepted on 12 October 2026: My Work redrawn on the accepted pattern, with a proposed Today's weather module. The decisions, the conformance declaration, display rules, departures, the weather prerequisites and what is still open are in [the design decision](../../../../decisions/my-work-page-design.md). Retain these bytes unchanged. A revised design receives a new revision folder.

Each image is one Figma frame, exported at scale 1 at its exact frame size. Image 09 is a board frame: it holds copies of three accepted phone frames, laid out with a label above each one. Before export, every Font Awesome icon was replaced by a plain placeholder square, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The weather icons are Font Awesome icons too, so they appear as squares. The Powerplants logo in the rail is the company's own image and is kept.

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · Overview (summary strip, My activities, notices, Today's weather, schedule, waiting, next activity) | [PPO-My-Work-01-Desktop-Overview-r01.png](PPO-My-Work-01-Desktop-Overview-r01.png) | 1440 × 900 | 207,261 | `abe52cde2f459edbf8bcec50e2782dd4c03afd5c3f22be8fdf77aa6fd0ec14ed` |
| 02 · Desktop · My actions (grouped grid, Done column) | [PPO-My-Work-02-Desktop-My-Actions-r01.png](PPO-My-Work-02-Desktop-My-Actions-r01.png) | 1440 × 900 | 148,306 | `14b7cbd3a93e4b361535a2e016cefb6e5798b3e1adf2f85b1cfe7e22f08f8818` |
| 03 · Desktop · My actions with the activity window open (OEM query, 38 days overdue) | [PPO-My-Work-03-Desktop-Activity-Window-r01.png](PPO-My-Work-03-Desktop-Activity-Window-r01.png) | 1440 × 900 | 170,562 | `aba5d75a194144b8b18c81ec6ac71f7e0359ffc278bec0e826567ad542274b3a` |
| 04 · Desktop · Record outcome dialog (call linked to a deal, next activity planned) | [PPO-My-Work-04-Desktop-Record-Outcome-Dialog-r01.png](PPO-My-Work-04-Desktop-Record-Outcome-Dialog-r01.png) | 1440 × 900 | 208,490 | `ea10cbe3e2999df0f711b10c56ea8911860f80b4058e35d00e5e9db7c17c13b7` |
| 05 · Desktop · Team queue (owner strip, all owners) | [PPO-My-Work-05-Desktop-Team-Queue-r01.png](PPO-My-Work-05-Desktop-Team-Queue-r01.png) | 1440 × 900 | 177,491 | `8ef8fe12aee203be20210abec630fa2ef84a5f517d67cc6a6ca11d507a99c93b` |
| 06 · Desktop · Reviews & handovers (My reviews) | [PPO-My-Work-06-Desktop-Reviews-Handovers-r01.png](PPO-My-Work-06-Desktop-Reviews-Handovers-r01.png) | 1440 × 900 | 94,065 | `c4cafcf07ea9fa0b83fadba7f3d110c91642fa9096a27ee7896fc4b5efd1f9fb` |
| 07 · Desktop · Blocked & waiting (next follow-up first) | [PPO-My-Work-07-Desktop-Blocked-Waiting-r01.png](PPO-My-Work-07-Desktop-Blocked-Waiting-r01.png) | 1440 × 900 | 90,811 | `733c893c3a7d28ab9f55763697095b6598a64035fbfdb4246ef1d0622c08c693` |
| 08 · Desktop · Updates & preferences, Inbox (three unread) | [PPO-My-Work-08-Desktop-Updates-Inbox-r01.png](PPO-My-Work-08-Desktop-Updates-Inbox-r01.png) | 1440 × 900 | 121,558 | `c43e2ecc933eabc5a1947c38aa57c604d77149f6b63ecc43bd3cbb40b5cd36df` |
| 09 · Phone · Overview, My actions and Activity (board) | [PPO-My-Work-09-Phone-Overview-Actions-Activity-r01.png](PPO-My-Work-09-Phone-Overview-Actions-Activity-r01.png) | 1370 × 964 | 171,854 | `4e31f4f792e6c3efb7129749a2fb4720177cbe067ad7c19601de88f3901f4558` |

The viewer is Sasha Clarke in Estimating & quotation, on Monday 12 October 2026. All data is synthetic. Images 03 and 04 keep the grid behind the window and the dialog, so the selected row is visible. Image 09 shows, left to right, the phone Overview, My actions and the full-screen activity.

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design" in Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | "My Work — Pipedrive pattern, accepted", to be saved by Dean |
| Accepted frames | Page "My Work (accepted)" `404:2`: Overview `404:3`, My actions `411:84514`, activity window `413:982`, Record outcome `413:92120`, Team queue `415:3573`, Reviews & handovers `415:91696`, Blocked & waiting `415:92578`, Updates Inbox `415:94450`, phone Overview `404:181`, phone My actions `414:1984` and phone Activity `414:2309` |
| Capture copies | Page "Captures (icon-free)": `448:46897`, `448:47599`, `448:48523`, `448:49602`, `448:50552`, `448:51542`, `448:52104`, `448:52650`, `448:53325` (images 01–09 in order) |

The capture copies duplicate the accepted frames with these changes only:
- each Font Awesome icon instance was swapped for `Icon/placeholder`;
- prototype links were removed;
- copy 09 lays three phone frames out on one board, with labels.

A check after the swap found no Font Awesome instance left in any copy: 1,063 icons were swapped in all. Each copy was exported with the Figma connector at scale 1 and downloaded to this folder.
