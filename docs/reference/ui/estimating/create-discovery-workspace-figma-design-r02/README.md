---
document_id: PPO-ES02-CREATE-WORKSPACE-FIGMA-R02
revision: r02
date: 2026-10-22
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: e9f28b6955d62cc33408e418f43f00ce5b937551
---

# Create discovery workspace design r02 — retained captures

This revision changes only the synthetic opportunity numbers in the Create discovery workspace design (`route:/estimating/discovery/new`, scope ES-02), from `SYN-PPO-OPP-…` to `SYN-OPP-…` (for example `SYN-OPP-000026`). Dean, 22 October 2026: "I have been removing PPO from the numbers. So it would just be "SYN-OPP-"." Layout, content and decisions are unchanged from [r01](../create-discovery-workspace-figma-design-r01/README.md), which is retained byte for byte.

The decision record is [the design decision](../../../../decisions/create-discovery-workspace-figma-design.md). The new prefix matches the application, which allocates new references as `SYN-<TYPE>-…` since migration 0114; existing `SYN-PPO-` references remain permanent there.

Each image is one Figma frame exported at scale 1 at its exact frame size, from the same icon-free capture copies as r01 after the number change. Every Font Awesome icon is a plain placeholder square ([ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md)). All records shown are synthetic fixtures; the images are design compositions, not application captures.

## Images changed in r02

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · choose opportunity | [PPO-Create-Discovery-Workspace-01-Desktop-Choose-Opportunity-r02.png](PPO-Create-Discovery-Workspace-01-Desktop-Choose-Opportunity-r02.png) | 1440 × 1000 | 200,380 | `ad4f259ad13c4db1e295fe26b03b3f7a52a98b81eeff336fc3353967a540b150` |
| 02 · Desktop · first discovery from the accepted Sales brief, Requirements, full length | [PPO-Create-Discovery-Workspace-02-Desktop-First-Discovery-From-Sales-Brief-r02.png](PPO-Create-Discovery-Workspace-02-Desktop-First-Discovery-From-Sales-Brief-r02.png) | 1440 × 2049 | 376,868 | `bcd04f09ebf9c0df8071ba25b95cd57266bb7cab5279609c71db248631e9a587` |
| 03 · Desktop · review and create dialog | [PPO-Create-Discovery-Workspace-03-Desktop-Review-And-Create-Dialog-r02.png](PPO-Create-Discovery-Workspace-03-Desktop-Review-And-Create-Dialog-r02.png) | 1440 × 1000 | 338,681 | `c7dd0608f237ca4dc1ee3865b2f754617fdf1dec51b2abfdcdffd51ea1e624da` |
| 04 · Desktop · state: needs attention before create, full length | [PPO-Create-Discovery-Workspace-04-Desktop-Needs-Attention-r02.png](PPO-Create-Discovery-Workspace-04-Desktop-Needs-Attention-r02.png) | 1440 × 2119 | 389,263 | `9d38198c2f3debd892690f68a2b6698ea0231aad566e5cf81c06cdd14f38b4ca` |
| 06 · Tablet 1024 · first discovery, summary behind its button | [PPO-Create-Discovery-Workspace-06-Tablet-First-Discovery-r02.png](PPO-Create-Discovery-Workspace-06-Tablet-First-Discovery-r02.png) | 1024 × 768 | 105,289 | `d26c252a8397fccc12c4c567a24782539b8c6476b4ddfc50953e00857e2dc4bd` |
| 07 · Phone 390 · choose opportunity | [PPO-Create-Discovery-Workspace-07-Phone-Choose-Opportunity-r02.png](PPO-Create-Discovery-Workspace-07-Phone-Choose-Opportunity-r02.png) | 390 × 844 | 69,267 | `e0bdcca45281c779b96a1174541f44d05d02ba54fc5bbf7cf3392715277f0f57` |
| 08 · Phone 390 · first discovery, Requirements, full length | [PPO-Create-Discovery-Workspace-08-Phone-First-Discovery-Full-Length-r02.png](PPO-Create-Discovery-Workspace-08-Phone-First-Discovery-Full-Length-r02.png) | 390 × 1306 | 87,642 | `d3ed334f87c8bae744c59bf2d2727ddc245243344465b14e3620d6c86b3c7e99` |
| 09 · Phone 320 · choose opportunity | [PPO-Create-Discovery-Workspace-09-Phone-320-Choose-Opportunity-r02.png](PPO-Create-Discovery-Workspace-09-Phone-320-Choose-Opportunity-r02.png) | 320 × 844 | 66,029 | `7e700453da6a485f68dd7c302723bd0adb40cb4af2689878abea7a2c3a35b19b` |
| 10 · States · four dialog outcomes | [PPO-Create-Discovery-Workspace-10-Dialog-States-r02.png](PPO-Create-Discovery-Workspace-10-Dialog-States-r02.png) | 2760 × 889 | 352,905 | `2b3419eddec4503cd2143b4f6aa0fb5b4ffc2224e74652996698dce0fc20d227` |

## Images unchanged from r01

Images 05 and 11 hold no opportunity number and were not re-exported; r01 remains their reference:
- 05 · Desktop · state: no eligible opportunities ([r01](../create-discovery-workspace-figma-design-r01/PPO-Create-Discovery-Workspace-05-Desktop-No-Eligible-Opportunities-r01.png))
- 11 · Phone 390 · state: loading eligible opportunities ([r01](../create-discovery-workspace-figma-design-r01/PPO-Create-Discovery-Workspace-11-Phone-Loading-r01.png))

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design", private to Dean's Figma team; its link is not recorded here because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | "Create discovery workspace — accepted (SYN-OPP- numbers)", saved 22 October 2026 at Dean's "Yes: add r02 capture sets and update the three decision records for SYN-OPP-, then save new named versions of the three Discovery pages." |
| Capture copies | The r01 copies on page "Captures (icon-free)" `115:2`, updated in place: every `SYN-PPO-` text became `SYN-`. A scan afterwards found no `SYN-PPO-` text and no Font Awesome instance in the copies |

The images were exported with the Figma connector at scale 1, and every export was compared by SHA-256 with its r01 image.
