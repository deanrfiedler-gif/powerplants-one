---
document_id: PPO-SV06-REVIEW-FIGMA-R01
revision: r01
date: 2026-10-18
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: 3881bb4a0c34f0eaa130dbf5300b357947a02038
---

# Service review design r01 — retained captures

These twelve images retain the Service review and reports design (SV-06) that Dean accepted on 18 October 2026. They cover two routes:
- `/service/reports`: the register at desktop 1440 × 900, tablet 1024, and phone 390 and 320;
- `/service/reports/[id]`: the report record with Evidence, Review submission, Customer report and Customer response, and the phone response sheet.

Five phone states are included. The decisions, conformance declaration and departures are in [the design decision](../../../../decisions/service-review-figma-design.md). Retain these bytes unchanged; a revised design receives a new revision folder.

Each image is one Figma frame exported at scale 1 at its exact frame size. Image 12 is a frame holding copies of the five state frames side by side.

Every Font Awesome icon was replaced by a plain placeholder square before export, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The Powerplants logo is the company's own, including on the customer report preview. The reports, people, sites, readings and times are synthetic fixtures. The images are design compositions, not captures of the application.

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · register, All reports | [PPO-Service-Review-01-Desktop-Register-r01.png](PPO-Service-Review-01-Desktop-Register-r01.png) | 1440 × 900 | 143,434 | `9fe935cee60b35b19638de02d0e2782b7a5d94a18e22c964313d7c5e57f78f71` |
| 02 · Desktop · report snapshot, Submitted | [PPO-Service-Review-02-Desktop-Report-Snapshot-r01.png](PPO-Service-Review-02-Desktop-Report-Snapshot-r01.png) | 1440 × 900 | 218,183 | `8cad25cd0f47ca1e5b7131ec96b79727e7aaa3dc6fa983f275df2a65c040fc1f` |
| 03 · Desktop · report, Evidence tab | [PPO-Service-Review-03-Desktop-Report-Evidence-r01.png](PPO-Service-Review-03-Desktop-Report-Evidence-r01.png) | 1440 × 900 | 201,666 | `6b94cc2641083674b8ea361952f760bc87eeb27cd435ab8b480290bea6f828c8` |
| 04 · Desktop · Review submission, returning | [PPO-Service-Review-04-Desktop-Review-Submission-r01.png](PPO-Service-Review-04-Desktop-Review-Submission-r01.png) | 1440 × 900 | 173,368 | `18f2191630c5324e47add1a86412e00a0bed81ef712ac2bed79ade84038d3ba9` |
| 05 · Desktop · Customer report ready to issue | [PPO-Service-Review-05-Desktop-Customer-Report-Ready-r01.png](PPO-Service-Review-05-Desktop-Customer-Report-Ready-r01.png) | 1440 × 900 | 195,458 | `ddde297800b56c6b0dcdf7b8c0112511e62052054c4b4b20149df8f9c253c3da` |
| 06 · Desktop · Customer response with reservations | [PPO-Service-Review-06-Desktop-Customer-Response-r01.png](PPO-Service-Review-06-Desktop-Customer-Response-r01.png) | 1440 × 900 | 210,256 | `6dc11fed2f58aefa8d2958d27895e05dbdd2e2b6260eebc017f1016a0bb2a797` |
| 07 · Tablet 1024 · register, side menu collapsed | [PPO-Service-Review-07-Tablet-Register-r01.png](PPO-Service-Review-07-Tablet-Register-r01.png) | 1024 × 900 | 91,004 | `06d7a395e335cc3e9836acd8655df7f8d5062e665c83b9153adef5c7a39faf8b` |
| 08 · Phone 390 · register | [PPO-Service-Review-08-Phone-Register-r01.png](PPO-Service-Review-08-Phone-Register-r01.png) | 390 × 844 | 87,578 | `265c43494136c5fd45e97c62acd9cfe450542fed78eb7b6fbfb7797d95a5fb7b` |
| 09 · Phone 320 · register | [PPO-Service-Review-09-Phone-320-Register-r01.png](PPO-Service-Review-09-Phone-320-Register-r01.png) | 320 × 844 | 80,827 | `152f1fa3192a4beb92486c1f078b73b51aea574e113abe6ae29b3965537af3c7` |
| 10 · Phone 390 · report, Evidence | [PPO-Service-Review-10-Phone-Report-Evidence-r01.png](PPO-Service-Review-10-Phone-Report-Evidence-r01.png) | 390 × 844 | 62,991 | `36b8c51f98a725cf07eecc46f48c459a73af7a848465919c73e55e0ac775f944` |
| 11 · Phone 390 · Record customer response sheet | [PPO-Service-Review-11-Phone-Customer-Response-Sheet-r01.png](PPO-Service-Review-11-Phone-Customer-Response-Sheet-r01.png) | 390 × 844 | 49,659 | `6ff10cba96a99090b48da6e08710b4d68096043a592c10e00ab8578267e0ee21` |
| 12 · States · five phone states | [PPO-Service-Review-12-Phone-States-r01.png](PPO-Service-Review-12-Phone-States-r01.png) | 2390 × 964 | 185,169 | `eaec573d384ecc8402bcf5698336f023237f01a670ef68da9897eeffbb116370` |

Image 12 holds, left to right:
1. loading;
2. no matches;
3. could not load;
4. view only;
5. a response refused because a newer report was issued.

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design", private to Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | "Service review and reports — accepted" |
| Accepted frames | Page "Service review and reports · SV-06" `1265:53`, in image order:<br>• `1266:190`, `1267:929`, `1269:1621`, `1269:2112`, `1270:2196`, `1271:2457`;<br>• `1271:2894`;<br>• `1271:3948`, `1271:13017`, `1271:9242`, `1271:12493`;<br>• the states: `1271:13201`, `1271:13297`, `1271:13383`, `1271:13460`, `1271:13592` |
| Capture copies | Page "Captures (icon-free)", from y = 183,000: `1278:140261`, `1278:140483`, `1278:140711`, `1278:140811`, `1278:140953`, `1278:141061`, `1278:141161`, `1278:141220`, `1278:141241`, `1278:141261`, `1278:141329`, `1278:141351` (images in order) |

The capture copies are duplicates of the accepted frames with two changes:
- Prototype links were removed.
- Each of the 512 Font Awesome icon instances, including those nested in shared components, was swapped for `Icon/placeholder` at its original size.

Two scans were run on the copies:
- After the swap, a scan found no Font Awesome instance and no visible vector outside a placeholder or the logo.
- A scan of 1,253 visible texts found none whose stored colour differed from its bound variable.

Each copy was exported with the Figma connector and downloaded directly to this folder.
