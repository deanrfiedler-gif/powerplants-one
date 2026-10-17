---
document_id: PPO-SV04-APPOINTMENT-FIGMA-R01
revision: r01
date: 2026-10-17
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: 0e351fa124d71073b468192b27ed3d7e51de567d
---

# Appointment detail design r01 — retained captures

These seven images retain the Appointment detail design (SV-04) that Dean accepted on 17 October 2026. The design covers `/service/appointments/[id]` at desktop 1440, tablet 1024 and phone 390 and 320, with six phone states and the Record customer site readiness dialog and sheet. The decisions, conformance declaration and departures are in [the design decision](../../../../decisions/appointment-detail-figma-design.md). Retain these bytes unchanged; a revised design receives a new revision folder.

Each image is one Figma frame exported at scale 1 at its exact frame size:
- Images 01, 03, 04 and 05 are full-length frames of the whole scrolling page.
- Image 07 is a frame holding copies of the six state frames at their positions in the States section.

Every Font Awesome icon was replaced by a plain placeholder square before export, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The Powerplants logo is the company's own. The visit, customer, people, parts and times are synthetic fixtures from the field readiness gate story. The images are design compositions, not captures of the application.

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · Confirmed, dispatch held, full length | [PPO-Appointment-Detail-01-Desktop-Dispatch-Held-r01.png](PPO-Appointment-Detail-01-Desktop-Dispatch-Held-r01.png) | 1440 × 1739 | 325,092 | `d6e8a3355df15067584adb34c21fd3b741681d7634bc8c6c9cd9020773c6d3fc` |
| 02 · Desktop · Record customer site readiness dialog | [PPO-Appointment-Detail-02-Desktop-Site-Readiness-Dialog-r01.png](PPO-Appointment-Detail-02-Desktop-Site-Readiness-Dialog-r01.png) | 1440 × 900 | 299,540 | `1caa27bc9781847480953183bc7dc57a45e3822386111934ae4b6fddd2c087fd` |
| 03 · Tablet · Confirmed, dispatch held, full length | [PPO-Appointment-Detail-03-Tablet-Dispatch-Held-r01.png](PPO-Appointment-Detail-03-Tablet-Dispatch-Held-r01.png) | 1024 × 2506 | 290,827 | `402bfd268ca78b8faf192d3adc5ec8b1378786503c2e29119ba80ebdbe421d60` |
| 04 · Phone 390 · Confirmed, dispatch held, full length | [PPO-Appointment-Detail-04-Phone-Dispatch-Held-r01.png](PPO-Appointment-Detail-04-Phone-Dispatch-Held-r01.png) | 390 × 1696 | 120,071 | `efcde4a68b90a59c3257e752433a886f437aea4acbdb7eee19d9fdb10ef1e8df` |
| 05 · Phone 320 · Confirmed, dispatch held, full length | [PPO-Appointment-Detail-05-Phone-320-Dispatch-Held-r01.png](PPO-Appointment-Detail-05-Phone-320-Dispatch-Held-r01.png) | 320 × 1728 | 116,608 | `2b89b8c8d54944195873fc40ac032474627885b59c8729dc7c5d07d03707b187` |
| 06 · Phone 390 · Record site readiness, full-screen sheet | [PPO-Appointment-Detail-06-Phone-Site-Readiness-Sheet-r01.png](PPO-Appointment-Detail-06-Phone-Site-Readiness-Sheet-r01.png) | 390 × 844 | 66,138 | `d3763def4f0dc3f57ccd84037910d6381da871a77b2de0935ab33309e76c74fb` |
| 07 · States · six phone states | [PPO-Appointment-Detail-07-States-r01.png](PPO-Appointment-Detail-07-States-r01.png) | 1450 × 1924 | 368,609 | `56907f6d25d7bd9fc9f0b90e2d144cfda61c8e2d3ee025018f0a54c2275abfa7` |

Image 07 holds, left to right and top to bottom:
1. ready to dispatch;
2. site readiness overdue;
3. customer reports not ready;
4. held again by a supply change;
5. proposed, not booked;
6. cancelled, read-only.

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design", private to Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | "Appointment detail — shared record layout, accepted" |
| Accepted frames | Page "Appointment detail · SV-04" `1187:50`: `1191:50`, `1195:266625`, `1193:264207`, `1193:263684`, `1193:263999`, `1195:266814`, and the States section `1187:111` (`1195:1202`, `1195:1438`, `1195:1685`, `1195:1930`, `1195:2153`, `1195:2409`) (images in order) |
| Capture copies | Page "Captures (icon-free)", from y = 168,000: `1200:125267`, `1200:125385`, `1200:125525`, `1200:125643`, `1200:125711`, `1200:125779`, `1200:125803` (images in order) |

The capture copies are duplicates of the accepted frames with two changes:
- Prototype links were removed.
- Each of the 302 Font Awesome icon instances, including those nested in shared components, was swapped for `Icon/placeholder` at its original size.

Two scans were run on the copies:
- After the swap, a scan found no Font Awesome instance left in any copy.
- A scan of 1,095 visible texts found none whose stored colour differed from its bound variable.

Each copy was exported with the Figma connector and downloaded directly to this folder.
