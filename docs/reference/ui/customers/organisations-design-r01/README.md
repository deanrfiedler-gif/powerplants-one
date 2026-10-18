---
document_id: PPO-CS01-ORGANISATIONS-FIGMA-R01
revision: r01
date: 2026-10-18
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: 1eccd20520aaf2ae98bcc7c64f1d87baa3ebe8a5
---

# Organisations and Customer 360 design r01 — retained captures

These ten images retain the Organisations and Customer 360 design (CS-01) that Dean accepted on 18 October 2026. They cover three routes:
- `/customers` (labelled Organisations): the register at desktop 1440 × 900, tablet 1024 and phone 390;
- `/customers/[id]`: Customer 360 for Hillview Growers, with the Overview and Sales tabs on desktop, the Sales tab filtered to quotations with the Status menu open, and the Overview on phone at 390 and 320;
- `/customers/new`: Create organisation with "Check before creating" on desktop.

Four phone states are included. The decisions, conformance declaration and departures are in [the design decision](../../../../decisions/organisations-figma-design.md). Retain these bytes unchanged; a revised design receives a new revision folder.

Each image is one Figma frame exported at scale 1 at its exact frame size. Image 10 is a frame holding copies of the four phone state frames side by side.

Every Font Awesome icon was replaced by a plain placeholder square before export, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The Powerplants logo is the company's own. The organisations, sites, people, amounts and records are synthetic fixtures. The images are design compositions, not captures of the application.

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · register, All organisations | [PPO-Organisations-01-Desktop-Register-r01.png](PPO-Organisations-01-Desktop-Register-r01.png) | 1440 × 900 | 136,606 | `39e4dbff895dd765afef5a5def427e8a429f803b0fda30e88cdf2c5fe862f30d` |
| 02 · Desktop · Hillview Growers, Customer 360 overview, full length | [PPO-Organisations-02-Desktop-Customer-360-Overview-r01.png](PPO-Organisations-02-Desktop-Customer-360-Overview-r01.png) | 1440 × 1234 | 268,109 | `643c7521b574f9cc025b96b8bbb97c2e900f4f4e60de563fe094f61e37f11145` |
| 03 · Desktop · Hillview Growers, Sales, full length | [PPO-Organisations-03-Desktop-Sales-r01.png](PPO-Organisations-03-Desktop-Sales-r01.png) | 1440 × 1078 | 229,480 | `324ac5e553561e1dafaf1a9d9c1ee988ef8eee3b74752eeae2e83e0c5a42cf77` |
| 04 · Desktop · Sales filtered to quotations, Status menu open | [PPO-Organisations-04-Desktop-Sales-Filtered-r01.png](PPO-Organisations-04-Desktop-Sales-Filtered-r01.png) | 1440 × 900 | 219,180 | `9ec4e62598848aca9c3ee1f4c480ff938a235e385c2d827ff2b17bf55a1a75fa` |
| 05 · Desktop · Create organisation, check before creating | [PPO-Organisations-05-Desktop-Create-Organisation-r01.png](PPO-Organisations-05-Desktop-Create-Organisation-r01.png) | 1440 × 900 | 170,477 | `4a7557fd15380e8857cc0441252fb1750ba2dfb1e254b620eb8a1b63ba86dff1` |
| 06 · Tablet 1024 · register, side menu collapsed | [PPO-Organisations-06-Tablet-Register-r01.png](PPO-Organisations-06-Tablet-Register-r01.png) | 1024 × 900 | 88,002 | `0382114e224daf4e664ea0d69b754567757d741331497b7324411c1e64596727` |
| 07 · Phone 390 · All organisations list | [PPO-Organisations-07-Phone-List-r01.png](PPO-Organisations-07-Phone-List-r01.png) | 390 × 844 | 64,862 | `3aed7c32fb01cfe362c9ac9591a99b80ca25d8840ab64f3a95ad5a80042f4f2b` |
| 08 · Phone 390 · Hillview Growers, Customer 360 overview | [PPO-Organisations-08-Phone-Customer-360-Overview-r01.png](PPO-Organisations-08-Phone-Customer-360-Overview-r01.png) | 390 × 844 | 58,143 | `feac87ef38e1320c4b23f52e88509caf8e2ca51e9a54bad39fe896a9d5919d3f` |
| 09 · Phone 320 · Hillview Growers, Customer 360 overview | [PPO-Organisations-09-Phone-320-Customer-360-Overview-r01.png](PPO-Organisations-09-Phone-320-Customer-360-Overview-r01.png) | 320 × 844 | 56,743 | `e356290b1fa013fabac58c17d025bbb1ad596f13b735a257aad4b73d90242365` |
| 10 · States · four phone states | [PPO-Organisations-10-Phone-States-r01.png](PPO-Organisations-10-Phone-States-r01.png) | 1920 × 964 | 137,819 | `62e5ee20d27c62a5948a25db78e78e030269509c292f4b2ae3247cccf95faff8` |

Image 10 holds, left to right:
1. loading;
2. no matching organisations;
3. could not load;
4. Service could not be read, with the other sources kept.

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design", private to Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | Not saved yet; it waits for Dean's explicit yes. Proposed title "Organisations — accepted" |
| Accepted frames | Page "Organisations · CS-01" `1443:2615`, in image order:<br>• `1443:2652`, `1443:2745`, `1445:381060`, `1449:381169`, `1445:381483`;<br>• `1443:3145`;<br>• `1443:3223`, `1443:3263`, `1443:3332`;<br>• the phone states: `1443:3400`, `1443:3458`, `1443:3501`, `1443:3537` |
| Capture copies | Page "Captures (icon-free)", from y = 250,000, images in order: `1452:182003`, `1452:182102`, `1452:182245`, `1452:182410`, `1452:182571`, `1452:182737`, `1452:182819`, `1452:182860`, `1452:182927`, `1452:182994` |

The capture copies are duplicates of the accepted frames with two changes:
- Prototype links were removed, and the two flow starting points the copies brought with them were removed from the Captures page.
- Each of the 384 Font Awesome icon instances, including those nested in shared components, was swapped for `Icon/placeholder` at its original size. With the placeholders already in the frames, the copies hold 387 visible placeholders and six logos.

Three scans were run on the copies:
- After the swap, a scan found no Font Awesome instance and no visible vector outside a placeholder or the logo.
- A scan of 935 visible texts found none whose stored colour differed from its bound variable.
- No copy carries a prototype link or a flow starting point.

The captures were exported with the Figma connector at scale 1 and downloaded directly into this folder.
