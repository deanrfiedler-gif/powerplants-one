---
document_id: PPO-PL02-FIELD-TEAM-FIGMA-R01
revision: r01
date: 2026-10-18
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: ca7695245cbf66bf9a85c1a9fb55776589042f37
---

# Field team design r01 — retained captures

These ten images retain the Field team design (PL-02) that Dean accepted on 18 October 2026. They cover two routes:
- `/service/technicians`: the register at desktop 1440 × 900, tablet 1024, and phone 390 and 320, with the person snapshot;
- `/service/technicians/[id]`: the read-only person page at full length on desktop and phone, and the competence evidence panel.

Five phone states are included. The decisions, conformance declaration and departures are in [the design decision](../../../../decisions/field-team-figma-design.md). Retain these bytes unchanged; a revised design receives a new revision folder.

Each image is one Figma frame exported at scale 1 at its exact frame size. Image 10 is a frame holding copies of the five state frames side by side.

Every Font Awesome icon was replaced by a plain placeholder square before export, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The Powerplants logo is the company's own. The people, visits, skills, sites and times are synthetic fixtures. The images are design compositions, not captures of the application.

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · register, Technicians | [PPO-Field-Team-01-Desktop-Register-r01.png](PPO-Field-Team-01-Desktop-Register-r01.png) | 1440 × 900 | 134,197 | `b38ce42474a755ffd0876150c2d59070a0ef6e3ad4c618d79bbf88b3d99f20a1` |
| 02 · Desktop · person snapshot, Casey Ward | [PPO-Field-Team-02-Desktop-Person-Snapshot-r01.png](PPO-Field-Team-02-Desktop-Person-Snapshot-r01.png) | 1440 × 900 | 219,859 | `f65c9c90380786cbb13877d0b762340404963e197f42806270886d8cbe455e57` |
| 03 · Desktop · person record, full length | [PPO-Field-Team-03-Desktop-Person-Record-r01.png](PPO-Field-Team-03-Desktop-Person-Record-r01.png) | 1440 × 1705 | 345,890 | `8626d2022565f1f3893baf3d005c65c0d864ce7efdb25cfdaf8d52f8ecf82154` |
| 04 · Desktop · competence evidence panel | [PPO-Field-Team-04-Desktop-Competence-Evidence-r01.png](PPO-Field-Team-04-Desktop-Competence-Evidence-r01.png) | 1440 × 900 | 281,362 | `bae8b6ec3a0e822038c87359acc5f914618b7fbf94ea630f9f83acedb78baa80` |
| 05 · Tablet 1024 · register, side menu collapsed | [PPO-Field-Team-05-Tablet-Register-r01.png](PPO-Field-Team-05-Tablet-Register-r01.png) | 1024 × 900 | 86,401 | `f682df6155f274da260a4d776488db3b191690867f1c71ed9e3a12ab0a30fe23` |
| 06 · Phone 390 · register | [PPO-Field-Team-06-Phone-Register-r01.png](PPO-Field-Team-06-Phone-Register-r01.png) | 390 × 844 | 67,668 | `b0acaae6261e2a10f835c820eb2e055ce8525dfb743f9188a660e8d55b693d73` |
| 07 · Phone 320 · register | [PPO-Field-Team-07-Phone-320-Register-r01.png](PPO-Field-Team-07-Phone-320-Register-r01.png) | 320 × 844 | 64,757 | `67a0cb29334071242cfee35066bf0fd5302d40c4a3891552f3e10b54ed6485bf` |
| 08 · Phone 390 · person page, full length | [PPO-Field-Team-08-Phone-Person-r01.png](PPO-Field-Team-08-Phone-Person-r01.png) | 390 × 2664 | 197,768 | `49bbfa6cc19e27a01dc880e2e3710c01f021bd8705c77767c1257b11a21b778a` |
| 09 · Phone 320 · person page, full length | [PPO-Field-Team-09-Phone-320-Person-r01.png](PPO-Field-Team-09-Phone-320-Person-r01.png) | 320 × 2842 | 194,348 | `af9c2a694ca4d55053a896f86b521ec5f0a5cbe7d204d513ce264775151b14be` |
| 10 · States · five phone states | [PPO-Field-Team-10-Phone-States-r01.png](PPO-Field-Team-10-Phone-States-r01.png) | 2390 × 964 | 160,289 | `77ad0150461f79490734e119fb80da01083513ba978c43e36c0237b0e4cd433b` |

Image 10 holds, left to right:
1. loading;
2. no matches;
3. could not load;
4. view only, with visit details outside your access;
5. an incomplete result.

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design", private to Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | "Field team — accepted" |
| Accepted frames | Page "Field team · PL-02" `1289:54`, in image order:<br>• `1295:4183`, `1295:4405`, `1295:4633`, `1302:4533`;<br>• `1295:4833`;<br>• `1295:4892`, `1307:5242`, `1295:4933`, `1310:307367`;<br>• the states: `1295:5069`, `1295:5108`, `1295:5132`, `1310:309552`, `1310:309369` |
| Capture copies | Page "Captures (icon-free)", from y = 188,000: `1318:307204`, `1318:307299`, `1318:307531`, `1318:307821`, `1318:308150`, `1318:308241`, `1318:308281`, `1318:308321`, `1318:308693`, `1318:309065` (images in order) |

The capture copies are duplicates of the accepted frames with two changes:
- Prototype links were removed.
- Each of the 524 Font Awesome icon instances, including those nested in shared components, was swapped for `Icon/placeholder` at its original size.

Two scans were run on the copies:
- After the swap, a scan found no Font Awesome instance and no visible vector outside a placeholder or the logo.
- A scan of 1,342 visible texts found none whose stored colour differed from its bound variable.

Each copy was exported with the Figma connector and downloaded directly to this folder.
