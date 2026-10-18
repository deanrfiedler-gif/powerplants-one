---
document_id: PPO-SV07-FINDINGS-FIGMA-R01
revision: r01
date: 2026-10-18
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: 3bd12c428ec1db087d35bf2e6e55f8845a78b9db
---

# Findings design r01 — retained captures

These nine images retain the Findings and follow-up design (SV-07) that Dean accepted on 18 October 2026. They cover the proposed route `/service/findings`:
- the register at desktop 1440 × 900, tablet 1024 and phone 390;
- the finding snapshot on desktop, including assigning the next action and the recurrence history;
- the finding as one scrolling page on phone 390 and 320.

Four phone states are included. No route exists yet. The decisions, conformance declaration, departures and new features are in [the design decision](../../../../decisions/findings-figma-design.md). Retain these bytes unchanged; a revised design receives a new revision folder.

Each image is one Figma frame exported at scale 1 at its exact frame size. Image 09 is a frame holding copies of the four state frames side by side on the canvas grey.

Every Font Awesome icon was replaced by a plain placeholder square before export, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The Powerplants logo is the company's own. The findings, people, sites, equipment, readings and times are synthetic fixtures. The images are design compositions, not captures of the application.

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · register, All open | [PPO-Findings-01-Desktop-Register-r01.png](PPO-Findings-01-Desktop-Register-r01.png) | 1440 × 900 | 143,067 | `52b5073ccd37b8d6a6ed10437b57fbf3d081ca965b86d4644d99bd2c481c3f16` |
| 02 · Desktop · remaining work selected, snapshot | [PPO-Findings-02-Desktop-Snapshot-r01.png](PPO-Findings-02-Desktop-Snapshot-r01.png) | 1440 × 900 | 232,369 | `dcb71cf98f6f8d867c810ff042cc632d3871f073f415cb6ba15f4d7dfc1ab3b7` |
| 03 · Desktop · needs an owner, assigning the next action | [PPO-Findings-03-Desktop-Assign-Next-Action-r01.png](PPO-Findings-03-Desktop-Assign-Next-Action-r01.png) | 1440 × 900 | 227,301 | `3148c4b417801971c066b2694a10841d8a317cf57c2b1eb8a94f6fff43e7af24` |
| 04 · Desktop · recurring fault, recurrence history | [PPO-Findings-04-Desktop-Recurrence-r01.png](PPO-Findings-04-Desktop-Recurrence-r01.png) | 1440 × 900 | 241,500 | `1a161ee1dcdd46e6933ad913eb682b66fe6df23e0e3bcf35e4beedc4d24aeab5` |
| 05 · Tablet 1024 · register, side menu collapsed | [PPO-Findings-05-Tablet-Register-r01.png](PPO-Findings-05-Tablet-Register-r01.png) | 1024 × 900 | 85,562 | `dc399ce092a5da37e5a9cd077145217f24f6f68c4e13ef1e594862948831b463` |
| 06 · Phone 390 · All open list | [PPO-Findings-06-Phone-List-r01.png](PPO-Findings-06-Phone-List-r01.png) | 390 × 844 | 70,175 | `60099106ba6269c888fbfac5a6732cdffd30673afc0608166752b61cd38a0241` |
| 07 · Phone 390 · finding, remaining work, full length | [PPO-Findings-07-Phone-Finding-r01.png](PPO-Findings-07-Phone-Finding-r01.png) | 390 × 1333 | 88,143 | `191484815943ccf74aca285bed55de5eaf0330f1456f1681e124955a0513af2d` |
| 08 · Phone 320 · finding, remaining work, full length | [PPO-Findings-08-Phone-320-Finding-r01.png](PPO-Findings-08-Phone-320-Finding-r01.png) | 320 × 1409 | 85,889 | `30977d5526e6df5db189ee26569b05f4574d724e3a00f503409ac7ff49a3e0f4` |
| 09 · States · four phone states | [PPO-Findings-09-Phone-States-r01.png](PPO-Findings-09-Phone-States-r01.png) | 1920 × 964 | 132,168 | `d40bbd42b61bdb7b5edeb56baff05107270b174d1c320e4bd588b00b3357d3ab` |

Image 09 holds, left to right:
1. loading;
2. nothing unresolved;
3. could not load;
4. view only.

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design", private to Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | Intended name "Findings and follow-up — accepted". Not saved yet; it waits for Dean's explicit yes |
| Accepted frames | Page "Findings and follow-up · SV-07" `1358:3488`, in image order:<br>• `1358:3524`, `1358:3611`, `1361:2933`, `1362:2635`;<br>• `1358:4344`;<br>• `1358:4413`, `1358:4449`, `1363:3258`;<br>• the states: `1358:4701`, `1358:4758`, `1358:4800`, `1363:323475` |
| Capture copies | Page "Captures (icon-free)" `115:2`, from y = 204,000: `1396:162651`, `1396:162749`, `1396:162992`, `1396:163222`, `1396:163461`, `1396:163536`, `1396:163574`, `1396:163672`, `1396:163770` (images in order) |

The capture copies are duplicates of the accepted frames with two changes:
- Prototype links were removed.
- Each of the 468 Font Awesome icon instances was swapped for `Icon/placeholder` (`67:77`) at its original size.

After the swap, a scan of the copies found no Font Awesome instance and no visible vector outside a placeholder or the logo.

Each copy was exported with the Figma connector (PNG, scale 1) and downloaded directly to this folder. The sizes, byte counts and SHA-256 hashes above were computed from the files in this folder.
