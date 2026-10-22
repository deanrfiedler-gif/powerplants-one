---
document_id: PPO-ES02-DISCOVERY-REGISTER-FIGMA-R02
revision: r02
date: 2026-10-22
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: e9f28b6955d62cc33408e418f43f00ce5b937551
---

# Discovery register design r02 — retained captures

This revision changes only the synthetic opportunity numbers in the Discovery register design (`route:/estimating/discovery`, scope ES-02), from `SYN-PPO-OPP-…` to `SYN-OPP-…` (for example `SYN-OPP-000326`). Dean, 22 October 2026: "I have been removing PPO from the numbers. So it would just be "SYN-OPP-"." Layout, content and decisions are unchanged from [r01](../discovery-register-figma-design-r01/README.md), which is retained byte for byte.

The decision record is [the design decision](../../../../decisions/discovery-register-figma-design.md). The new prefix matches the application, which allocates new references as `SYN-<TYPE>-…` since migration 0114; existing `SYN-PPO-` references remain permanent there.

Each image is one Figma frame exported at scale 1 at its exact frame size, from the same icon-free capture copies as r01 after the number change. Every Font Awesome icon is a plain placeholder square ([ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md)). All records shown are synthetic fixtures; the images are design compositions, not application captures.

## Images changed in r02

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 02 · Desktop · Northbank snapshot | [PPO-Discovery-Register-02-Desktop-Northbank-Snapshot-r02.png](PPO-Discovery-Register-02-Desktop-Northbank-Snapshot-r02.png) | 1440 × 900 | 197,586 | `95e02f3c881498792ed27c84258faac44ee414553cbb2877997812c511faacd8` |
| 06 · Phone 390 · All workspaces list | [PPO-Discovery-Register-06-Phone-List-r02.png](PPO-Discovery-Register-06-Phone-List-r02.png) | 390 × 844 | 76,233 | `b79baccbcf0ed960ebfd81503182f794d10124ff0eddc8f44e4fb7693fd2f362` |
| 07 · Phone 320 · All workspaces list | [PPO-Discovery-Register-07-Phone-320-List-r02.png](PPO-Discovery-Register-07-Phone-320-List-r02.png) | 320 × 844 | 73,362 | `5e11c2bf9e5b20fbcda944c3cff87cb2d7a2c433be97b0c2cccc693c5aeb1752` |

## Images unchanged from r01

Images 01, 04 and 05 hold opportunity numbers only in columns outside the visible frame; re-exported, they came out byte-identical to r01. Images 03 and 08 hold no opportunity number and were not re-exported. r01 remains the reference for all five:
- 01 · Desktop · register, All workspaces ([r01](../discovery-register-figma-design-r01/PPO-Discovery-Register-01-Desktop-Register-r01.png))
- 03 · Desktop · state: no workspaces yet ([r01](../discovery-register-figma-design-r01/PPO-Discovery-Register-03-Desktop-No-Workspaces-Yet-r01.png))
- 04 · Desktop · state: view only, no create permission ([r01](../discovery-register-figma-design-r01/PPO-Discovery-Register-04-Desktop-View-Only-r01.png))
- 05 · Tablet 1024 · register, side menu collapsed ([r01](../discovery-register-figma-design-r01/PPO-Discovery-Register-05-Tablet-Register-r01.png))
- 08 · States · three phone states ([r01](../discovery-register-figma-design-r01/PPO-Discovery-Register-08-Phone-States-r01.png))

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design", private to Dean's Figma team; its link is not recorded here because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | "Discovery register — Pipedrive pattern, accepted (SYN-OPP- numbers)", saved 22 October 2026 at Dean's "Yes: add r02 capture sets and update the three decision records for SYN-OPP-, then save new named versions of the three Discovery pages." |
| Capture copies | The r01 copies on page "Captures (icon-free)" `115:2`, updated in place: every `SYN-PPO-` text became `SYN-`. A scan afterwards found no `SYN-PPO-` text and no Font Awesome instance in the copies |

The images were exported with the Figma connector at scale 1, and every export was compared by SHA-256 with its r01 image.
