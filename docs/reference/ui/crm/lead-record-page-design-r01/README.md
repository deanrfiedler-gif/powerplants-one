---
document_id: PPO-CRM-LEAD-RECORD-DESIGN-R01
revision: r01
date: 2026-10-11
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: 40ac5a01439d37a09fcba5a031afa4efab30711d
---

# Lead record page design r01 — retained captures

These seven images retain the lead record page and shared record layout that Dean accepted on 11 October 2026. The decisions, conformance declaration, departures and open questions are in [the design decision](../../../../decisions/lead-record-page-design.md). Retain these bytes unchanged. A revised design receives a new revision folder.

Each image is one Figma frame, exported at scale 1 at its exact frame size. Images 06 and 07 are board frames: each holds copies of several accepted frames, laid out with a label above each one. Before export, every Font Awesome icon was replaced by a plain placeholder square, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The Powerplants logo is the company's own. Figures, names, email addresses, phone numbers and references are synthetic fixtures; the phone number comes from the range reserved for fictional use. The images are design compositions, not captures of the application, which still opens a lead as a dialog over the Leads list.

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · record page (Note tab, all history) | [PPO-Lead-Record-01-Desktop-Record-Page-r01.png](PPO-Lead-Record-01-Desktop-Record-Page-r01.png) | 1440 × 900 | 176,871 | `18f2399835982c06b91224d21e5fac738911e87c5f6bf6cf17ba2a1f33865f63` |
| 02 · Desktop · Activity tab and activity history | [PPO-Lead-Record-02-Desktop-Activity-Tab-r01.png](PPO-Lead-Record-02-Desktop-Activity-Tab-r01.png) | 1440 × 900 | 167,644 | `b96a14ad89ad6ae5f8a8a2b0b94380e29a6d8e1246407531ab3ee07c3b0456f6` |
| 03 · Desktop · Email tab (write and send) and email history | [PPO-Lead-Record-03-Desktop-Email-Tab-r01.png](PPO-Lead-Record-03-Desktop-Email-Tab-r01.png) | 1440 × 900 | 177,923 | `ca8a450bdb219291872accf09ec43c94c7f6a5ad1c408386ad43a36e50d47c38` |
| 04 · Desktop · File tab and file history | [PPO-Lead-Record-04-Desktop-File-Tab-r01.png](PPO-Lead-Record-04-Desktop-File-Tab-r01.png) | 1440 × 900 | 176,491 | `2ff8d9f90eda68f999cf341780cd535f200cd031955a3401cba9eb0147d8aaa5` |
| 05 · Desktop · Leads register with the record window and "Open lead page" | [PPO-Lead-Record-05-Desktop-Register-Record-Window-r01.png](PPO-Lead-Record-05-Desktop-Register-Record-Window-r01.png) | 1440 × 900 | 188,149 | `8bd32288972aeec2d2d4f94538187613dc4825e1f51841446e798598c118be1e` |
| 06 · Desktop · six states (board) | [PPO-Lead-Record-06-Desktop-States-r01.png](PPO-Lead-Record-06-Desktop-States-r01.png) | 1280 × 3944 | 579,396 | `34a9a084be79a7c72e5e179571d43955a8f8e47cd988208c9bd1c9c5d718a253` |
| 07 · Phone · four tabs, the activity and email forms, and the action sheet (board) | [PPO-Lead-Record-07-Phone-Tabs-Forms-Action-Sheet-r01.png](PPO-Lead-Record-07-Phone-Tabs-Forms-Action-Sheet-r01.png) | 3050 × 954 | 326,342 | `e51df7e1f8d9fbca0cd2dbf62847b34a6b432b37b717ab174b38f096de30bf7a` |

Image 06 shows, top to bottom:
1. no next activity;
2. someone else's lead (read only);
3. converted to a deal;
4. archived;
5. disqualified;
6. Mark as done asking for the outcome.

Each state is the top of a desktop record page, cropped at 560–760 px. Image 07 shows, left to right, the phone Details, Activity, Emails and Files tabs, then New activity, then New email, then Details with the "…" action sheet open.

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design", private to Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | "Lead record page — shared record layout, accepted", saved by Dean on 11 October 2026 |
| Accepted frames | Page "Lead record page (accepted)" `224:2`: <ul><li>desktop record page `226:208`;</li><li>Activity `247:1950`, Emails `234:1141` and Files `234:1782` views;</li><li>Leads register entry `226:17`;</li><li>states section `255:2955` (frames `255:2956`, `255:3308`, `255:3662`, `255:4017`, `255:4371`, `255:4725`);</li><li>phone list `228:809`, Details `228:1060`, Activity `228:1156`, Emails `235:1790`, Files `235:1928`, New activity `249:2273` and New email `244:2114`.</li></ul> |
| Capture copies | Page "Captures (icon-free)": `259:23737`, `259:23813`, `259:23952`, `259:24046`, `259:24117`, `259:25058`, `259:25432` (images 01–07 in order) |

The capture copies were made after Dean saved the named version. They duplicate the accepted frames with these changes only:
- each Font Awesome icon instance was swapped for `Icon/placeholder`;
- copy 05 shows the record window open;
- the last phone in copy 07 shows the action sheet open;
- copies 06 and 07 lay several frames out on one board, with labels.

A check after the swap found no Font Awesome instance left in any copy: 807 icons were swapped in all. Each copy was exported with the Figma connector at scale 1 and downloaded directly to this folder. Image 06 was first exported at 1261 × 4096, because Figma caps an export at 4,096 px. Its board spacing was then tightened, and it was exported again at its exact size.
