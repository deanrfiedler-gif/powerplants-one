---
document_id: PPO-CRM-DEALS-FIGMA-R03
revision: r03
date: 2026-10-31
owner: Dean Fiedler
status: Retained design reference for the Expected close amendment; icon-free; not an application capture or UI baseline
source_commit: 7eb4432baefcf8b098a37726b250a311f21e67dc
---

# Deals design r03 — retained captures

These images retain the Deals Filters and phone Search and filter frames after the [31 October 2026 amendment](../../../../decisions/deals-figma-design.md#amendment--31-october-2026), which adds the Expected close range. They are the only frames that changed, so the other 26 captures in [r02](../deals-design-r02/README.md) still show the current design. All r02 bytes stay unchanged. Retain these bytes unchanged; a revised design receives a new revision folder.

Each image is one Figma frame exported at scale 1 at its exact frame size. Every icon was replaced by a plain placeholder square before export, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The Powerplants logo is the company's own. The deals and organisations are synthetic fixtures; they are not adopted operating rules and grant no authority. The images are design compositions, not captures of the application.

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 06 · Desktop · Filters with Expected close | [PPO-Deals-06-Desktop-Filters-r03.png](PPO-Deals-06-Desktop-Filters-r03.png) | 1440 × 960 | 162,948 | `8d4bb62809c2cd4345b4493fed7b6374e7b236c15133cc28504fd60b4a0d47d3` |
| 19 · Phone 320 · Search and filter with Expected close | [PPO-Deals-19-Phone-320-Search-And-Filter-r03.png](PPO-Deals-19-Phone-320-Search-And-Filter-r03.png) | 320 × 844 | 40,085 | `d7bf8620748a064280e588767ea697739b8a60ec7df3116d0d26370a1267f2a4` |

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design", private to Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | "Deals · CR-04 — Expected close amendment", saved 31 October 2026 at Dean's request, after image 06 was exported, and confirmed in version history. It holds the desktop change only; image 19 was drawn after it. "Deals · CR-04 — Expected close amendment, phone", saved the same day at Dean's request after image 19 was exported and confirmed in version history, holds both |
| Frames | Filters `555:6470` and Phone 320 Search and filter `2369:818269` on page "Deals · CR-04" `549:2` |
| Capture copies | `2895:424975` and `2909:444511` on page "Captures (icon-free)", under the heading `2895:425222` at y = 929,990 |

Each capture copy is a duplicate of its frame with every prototype reaction removed and each icon instance (269 and 11), including nested and hidden ones, swapped for `Icon/placeholder` at its original size and visibility. A layer-by-layer comparison across 1,381 and 81 layers found no difference in visibility, size or text outside the swapped icons. Each PNG's signature, dimensions and byte count were checked against its frame and the connector's report, and each exported image was viewed.
