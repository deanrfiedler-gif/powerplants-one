---
document_id: PPO-PL01-PLANNER-FIGMA-R01
revision: r01
date: 2026-10-17
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: b2bd0110f74dc515e1ed26ce08d6ead27896f7e1
---

# Service planner design r01 — retained captures

These twelve images retain the Service planner design (PL-01) that Dean accepted on 17 October 2026. The design covers `/schedule`:
- desktop 1440 × 960: Day, Week, a selected visit, Plan visit from the tray and Move this visit?;
- tablet 1024;
- phone 390 and 320, with the visit sheet, Needs attention and tray, and four phone states.

The decisions, conformance declaration and departures are in [the design decision](../../../../decisions/service-planner-figma-design.md). Retain these bytes unchanged; a revised design receives a new revision folder.

Each image is one Figma frame exported at scale 1 at its exact frame size:
- Images 07, 08 and 09 are full-length frames of the whole scrolling page.
- Image 12 is a frame holding copies of the four state frames at their positions in the States section.

Every Font Awesome icon, including the travel car, was replaced by a plain placeholder square before export, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The Powerplants logo is the company's own. The visits, people, work orders and times are synthetic fixtures from the field readiness gate story. The images are design compositions, not captures of the application.

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · Day | [PPO-Service-Planner-01-Desktop-Day-r01.png](PPO-Service-Planner-01-Desktop-Day-r01.png) | 1440 × 960 | 248,524 | `ddd56d2955f723aff8057472805c96346911172333606b3ad535a994551d3f82` |
| 02 · Desktop · Day, visit selected, details panel | [PPO-Service-Planner-02-Desktop-Visit-Selected-r01.png](PPO-Service-Planner-02-Desktop-Visit-Selected-r01.png) | 1440 × 960 | 234,094 | `4091161c1e5a53424d7b2e0dea427c8df273feeb9b224a294e4c91bb0ce7d03c` |
| 03 · Desktop · Week | [PPO-Service-Planner-03-Desktop-Week-r01.png](PPO-Service-Planner-03-Desktop-Week-r01.png) | 1440 × 960 | 255,235 | `0a92ebb252d8d859620a58c4fc65c543bb806a13209be6bd60955f338f1e90a6` |
| 04 · Desktop · Plan visit from the tray | [PPO-Service-Planner-04-Desktop-Plan-Visit-From-Tray-r01.png](PPO-Service-Planner-04-Desktop-Plan-Visit-From-Tray-r01.png) | 1440 × 960 | 300,426 | `3be32c339920e8347f7d0a5b65e1c12883ed6e1f04c70b369c112a463cdcf104` |
| 05 · Desktop · Move this visit? after a drag | [PPO-Service-Planner-05-Desktop-Move-This-Visit-r01.png](PPO-Service-Planner-05-Desktop-Move-This-Visit-r01.png) | 1440 × 960 | 301,952 | `00e07885821f9487a51f8e88ab68190ccb172ef4eddb4cc86173c8475aa8fa18` |
| 06 · Tablet · Day, tray collapsed | [PPO-Service-Planner-06-Tablet-Day-r01.png](PPO-Service-Planner-06-Tablet-Day-r01.png) | 1024 × 960 | 160,097 | `21b3ad6bf3593c94f15ce38e45cf8a561b2fef4634489cc216aa78a773a02322` |
| 07 · Phone 390 · Day, full length | [PPO-Service-Planner-07-Phone-Day-r01.png](PPO-Service-Planner-07-Phone-Day-r01.png) | 390 × 2059 | 126,358 | `afc362ae0e66d81f62aba33273095684c7591131114cdea3d80df84605ae6400` |
| 08 · Phone 320 · Day, full length | [PPO-Service-Planner-08-Phone-320-Day-r01.png](PPO-Service-Planner-08-Phone-320-Day-r01.png) | 320 × 2059 | 122,705 | `e8f62bce7efb644e95fd7a51addf4fd3b90d74f2a1ecc643aa81cf4bb350b298` |
| 09 · Phone 390 · Week, full length | [PPO-Service-Planner-09-Phone-Week-r01.png](PPO-Service-Planner-09-Phone-Week-r01.png) | 390 × 1344 | 95,107 | `964ee80b4e3ff233ee4b57ae2249d84546871abe7f5eab874ef613f7baa1a544` |
| 10 · Phone 390 · Visit details sheet | [PPO-Service-Planner-10-Phone-Visit-Sheet-r01.png](PPO-Service-Planner-10-Phone-Visit-Sheet-r01.png) | 390 × 844 | 47,038 | `a92f0edb0fa0546db05d15de647f138555cc1cd75a78ca7041c6064d12fbd3d0` |
| 11 · Phone 390 · Needs attention and tray | [PPO-Service-Planner-11-Phone-Needs-Attention-And-Tray-r01.png](PPO-Service-Planner-11-Phone-Needs-Attention-And-Tray-r01.png) | 390 × 844 | 64,526 | `e462ea45006c5402051f00b17abea210122c4217e10bf5b000c126d3a40e8b89` |
| 12 · States · four phone states | [PPO-Service-Planner-12-Phone-States-r01.png](PPO-Service-Planner-12-Phone-States-r01.png) | 1920 × 964 | 118,121 | `44fe6f935863fd68ca06386f23e66094a0ef7fb6fe76b6b6286ae0821ba89495` |

Image 12 holds, left to right:
1. loading;
2. empty day;
3. no access;
4. last good read after a failure.

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design", private to Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | "Service planner — accepted" |
| Accepted frames | Page "Service planner · PL-01" `1203:5805`: `1205:52`, `1220:7149`, `1221:7163`, `1221:276662`, `1222:8031`, `1222:9219`, `1212:273202`, `1213:5747`, `1214:5547`, `1214:5913`, `1223:8067`, and the States section `1203:5866` (`1214:275141`, `1214:275500`, `1214:275856`, `1214:276212`) (images in order) |
| Capture copies | Page "Captures (icon-free)", from y = 173,000: `1242:127512`, `1242:127667`, `1242:127840`, `1242:127984`, `1242:128166`, `1242:128327`, `1242:128471`, `1242:128684`, `1242:128897`, `1242:128961`, `1242:129203`, `1242:129222` (images in order) |

The capture copies are duplicates of the accepted frames with two changes:
- Prototype links were removed.
- Each of the 407 Font Awesome icon instances, including those nested in shared components, was swapped for `Icon/placeholder` at its original size.

Two scans were run on the copies:
- After the swap, a scan found no Font Awesome instance left in any copy.
- A scan of 1,321 visible texts found none whose stored colour differed from its bound variable.

Each copy was exported with the Figma connector and downloaded directly to this folder.
