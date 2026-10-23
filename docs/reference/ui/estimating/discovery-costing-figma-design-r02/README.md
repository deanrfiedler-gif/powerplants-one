---
document_id: PPO-ES02-DISCOVERY-COSTING-FIGMA-R02
revision: r02
date: 2026-10-22
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: e9f28b6955d62cc33408e418f43f00ce5b937551
---

# Discovery costing design r02 — retained captures

This revision changes only the synthetic opportunity numbers in the Discovery costing design (`route:/estimating/discovery/[id]/costing`, scope ES-02), from `SYN-PPO-OPP-…` to `SYN-OPP-…` (for example `SYN-OPP-000334`). Dean, 22 October 2026: "I have been removing PPO from the numbers. So it would just be "SYN-OPP-"." Layout, content and decisions are unchanged from [r01](../discovery-costing-figma-design-r01/README.md), which is retained byte for byte.

The decision record is [the design decision](../../../../decisions/discovery-costing-figma-design.md). The new prefix matches the application, which allocates new references as `SYN-<TYPE>-…` since migration 0114; existing `SYN-PPO-` references remain permanent there.

Each image is one Figma frame exported at scale 1 at its exact frame size, from the same icon-free capture copies as r01 after the number change. Every Font Awesome icon is a plain placeholder square ([ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md)). All records shown are synthetic fixtures; the images are design compositions, not application captures.

## Images changed in r02

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · cost lines for estimate v3 from discovery r02, full length | [PPO-Discovery-Costing-01-Desktop-Cost-Lines-Full-Length-r02.png](PPO-Discovery-Costing-01-Desktop-Cost-Lines-Full-Length-r02.png) | 1440 × 2027 | 372,024 | `3a5603240c3c9bb511aabd31ca0e809bd27df41c3289c19b5434b38814d079c6` |
| 02 · Desktop · review and adopt dialog | [PPO-Discovery-Costing-02-Desktop-Review-And-Adopt-Dialog-r02.png](PPO-Discovery-Costing-02-Desktop-Review-And-Adopt-Dialog-r02.png) | 1440 × 1000 | 342,468 | `e7d1aab31bf145c446b54d30abb8ce7405d9cb5b77050f3d22f5dabe4933273e` |
| 03 · Desktop · discovery changed while costing, proposal kept | [PPO-Discovery-Costing-03-Desktop-Discovery-Changed-r02.png](PPO-Discovery-Costing-03-Desktop-Discovery-Changed-r02.png) | 1440 × 1000 | 238,157 | `e2a411f6696e9392f90c2744918e6c91370580ccc3d359f5fc249fc14145d9e7` |
| 04 · Desktop · not ready to cost, Northbank r03 Incomplete | [PPO-Discovery-Costing-04-Desktop-Not-Ready-To-Cost-r02.png](PPO-Discovery-Costing-04-Desktop-Not-Ready-To-Cost-r02.png) | 1440 × 1000 | 211,631 | `f8560ab2618e88cf3ea612f1f70ea9799c200ca48bad517afb4de17cea300dcf` |
| 05 · Tablet 1024 · cost lines, summary as a button | [PPO-Discovery-Costing-05-Tablet-Cost-Lines-r02.png](PPO-Discovery-Costing-05-Tablet-Cost-Lines-r02.png) | 1024 × 768 | 110,540 | `0fcf965757853766a33bec920f99c768d9761bf664aa1b436600fc5417143e21` |
| 06 · Phone 390 · cost lines | [PPO-Discovery-Costing-06-Phone-Cost-Lines-r02.png](PPO-Discovery-Costing-06-Phone-Cost-Lines-r02.png) | 390 × 844 | 65,121 | `9aed165e8411b00739fa5b0344440788a095d9d5b4aaf36f8f8556ca56be5c6b` |
| 07 · Phone 390 · cost lines, full length | [PPO-Discovery-Costing-07-Phone-Cost-Lines-Full-Length-r02.png](PPO-Discovery-Costing-07-Phone-Cost-Lines-Full-Length-r02.png) | 390 × 1694 | 125,262 | `c71991469813b00b049ecdb2f9c94a5299b8b12e3b88f5c3dc8ff4a350311c22` |
| 08 · Phone 320 · cost lines | [PPO-Discovery-Costing-08-Phone-320-Cost-Lines-r02.png](PPO-Discovery-Costing-08-Phone-320-Cost-Lines-r02.png) | 320 × 844 | 56,887 | `83c86960a1c0f0d9067cba43f01585db495befd431956b2021f3f6ab86de85f0` |

## Images unchanged from r01

Images 09 and 10 hold no opportunity number and were not re-exported; r01 remains their reference:
- 09 · Dialog states ([r01](../discovery-costing-figma-design-r01/PPO-Discovery-Costing-09-Dialog-States-r01.png))
- 10 · Phone 390 · loading the saved scope ([r01](../discovery-costing-figma-design-r01/PPO-Discovery-Costing-10-Phone-Loading-r01.png))

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design", private to Dean's Figma team; its link is not recorded here because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | "Discovery costing — accepted (SYN-OPP- numbers)", saved 22 October 2026 at Dean's "Yes: add r02 capture sets and update the three decision records for SYN-OPP-, then save new named versions of the three Discovery pages." |
| Capture copies | The r01 copies on page "Captures (icon-free)" `115:2`, updated in place: every `SYN-PPO-` text became `SYN-`. A scan afterwards found no `SYN-PPO-` text and no Font Awesome instance in the copies |

The images were exported with the Figma connector at scale 1, and every export was compared by SHA-256 with its r01 image.
