---
document_id: PPO-SV01-REQUESTS-FIGMA-R01
revision: r01
date: 2026-10-17
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: 18e7decf1f66a1f8ad202d87caca9fa8193348a0
---

# Service requests design r01 — retained captures

These thirteen images retain the Service requests design (SV-01 and SV-02) that Dean accepted on 17 October 2026. They cover three routes:
- `/service/tickets`: the register at desktop 1440 × 900, tablet 1024, and phone 390 and 320;
- `/service/tickets/new`: Log a request;
- `/service/tickets/[id]`: the request record, Complete triage and Linked work.

Five phone states are included. The decisions, conformance declaration and departures are in [the design decision](../../../../decisions/service-requests-figma-design.md). Retain these bytes unchanged; a revised design receives a new revision folder.

Each image is one Figma frame exported at scale 1 at its exact frame size. Image 13 is a frame holding copies of the five state frames side by side.

Every Font Awesome icon was replaced by a plain placeholder square before export, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The Powerplants logo is the company's own. The requests, people, sites and times are synthetic fixtures. The images are design compositions, not captures of the application.

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · register, All open | [PPO-Service-Requests-01-Desktop-Register-r01.png](PPO-Service-Requests-01-Desktop-Register-r01.png) | 1440 × 900 | 169,804 | `b74996b46f347cf9f99df3edf44b6f9a780d5daed281aafca93d3d2246636f16` |
| 02 · Desktop · request snapshot, Needs information | [PPO-Service-Requests-02-Desktop-Request-Snapshot-r01.png](PPO-Service-Requests-02-Desktop-Request-Snapshot-r01.png) | 1440 × 900 | 223,686 | `b98cd968943663ea27590cc3361a8570e9a8ecd27c4cf1910f920f756d66dc73` |
| 03 · Desktop · Board | [PPO-Service-Requests-03-Desktop-Board-r01.png](PPO-Service-Requests-03-Desktop-Board-r01.png) | 1440 × 900 | 222,449 | `c92f3a56ae835f745cfb9c8854098e4b9d97a822dd48d29da969f46f0b802cb6` |
| 04 · Desktop · Log a request, possible duplicate | [PPO-Service-Requests-04-Desktop-Log-A-Request-r01.png](PPO-Service-Requests-04-Desktop-Log-A-Request-r01.png) | 1440 × 900 | 152,229 | `193489ea191859982450a32a237673cd4efc590421f98c1e9dc10e15ad265c84` |
| 05 · Desktop · request record, Triage tab | [PPO-Service-Requests-05-Desktop-Record-Triage-r01.png](PPO-Service-Requests-05-Desktop-Record-Triage-r01.png) | 1440 × 900 | 220,761 | `512d6db8b494505737854c257ababe2c548c6265ac5b5fdd5c3b376c464493ff` |
| 06 · Desktop · Complete triage, editing | [PPO-Service-Requests-06-Desktop-Complete-Triage-r01.png](PPO-Service-Requests-06-Desktop-Complete-Triage-r01.png) | 1440 × 900 | 187,644 | `fdd67e955174102dc4f27cf11de17f9126f7eba2236fe2fe37360f9a90119d06` |
| 07 · Desktop · Triaged request, Linked work | [PPO-Service-Requests-07-Desktop-Record-Linked-Work-r01.png](PPO-Service-Requests-07-Desktop-Record-Linked-Work-r01.png) | 1440 × 900 | 199,761 | `c8136065c9888335aecfb25fff3380d1da1d39b70899addde037deef529e6cd4` |
| 08 · Tablet 1024 · register, side menu collapsed | [PPO-Service-Requests-08-Tablet-Register-r01.png](PPO-Service-Requests-08-Tablet-Register-r01.png) | 1024 × 900 | 119,546 | `847b13cfa6d5f6e5db90a3405301159b57c0a50a4cb958d497bbc94ac636f024` |
| 09 · Phone 390 · register | [PPO-Service-Requests-09-Phone-Register-r01.png](PPO-Service-Requests-09-Phone-Register-r01.png) | 390 × 844 | 88,864 | `fa0afb25312d2fb988939ec26e974c03d99454ac5798b5219cd7b758d87fd7fb` |
| 10 · Phone 320 · register | [PPO-Service-Requests-10-Phone-320-Register-r01.png](PPO-Service-Requests-10-Phone-320-Register-r01.png) | 320 × 844 | 82,267 | `fdaadb2469a003bb14c547752410f58ea72eaea93a45446150f949b5bcf1f8fb` |
| 11 · Phone 390 · request record, Triage | [PPO-Service-Requests-11-Phone-Record-Triage-r01.png](PPO-Service-Requests-11-Phone-Record-Triage-r01.png) | 390 × 844 | 67,155 | `3292904b645f6bbd3c1811e4dee1c8bd55f887239c52739df5bec93a7c708af6` |
| 12 · Phone 390 · Complete triage sheet, one error | [PPO-Service-Requests-12-Phone-Complete-Triage-Sheet-r01.png](PPO-Service-Requests-12-Phone-Complete-Triage-Sheet-r01.png) | 390 × 844 | 45,530 | `0cfe0bcc90b9bce4e947aac9d1710755e94c8d38770e789e10cfcb5bc8e7f20c` |
| 13 · States · five phone states | [PPO-Service-Requests-13-Phone-States-r01.png](PPO-Service-Requests-13-Phone-States-r01.png) | 2390 × 964 | 201,312 | `c9b578efe2ca61e30c8cde1fd00404755039efc3dd8daad5e50db382880fd7bd` |

Image 13 holds, left to right:
1. loading;
2. no matches;
3. could not load;
4. view only;
5. save refused because of a newer revision.

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design", private to Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | "Service requests — accepted" |
| Accepted frames | Page "Service requests · SV-01 · SV-02" `1249:9313`: `1249:9382`, `1254:3846`, `1255:2587`, `1259:3354`, `1255:3172`, `1256:287381`, `1257:3058`, `1259:288310`, `1259:289789`, `1259:290489`, `1259:290111`, `1259:290321`, and the States section `1249:9374` (`1261:4946`, `1261:5127`, `1261:5300`, `1261:289734`, `1261:289886`) (images in order) |
| Capture copies | Page "Captures (icon-free)", from y = 178,000: `1264:135344`, `1264:135585`, `1264:135826`, `1264:136093`, `1264:136250`, `1264:136337`, `1264:136458`, `1264:136558`, `1264:136636`, `1264:136657`, `1264:136677`, `1264:136745`, `1264:136767` (images in order) |

The capture copies are duplicates of the accepted frames with two changes:
- Prototype links were removed.
- Each of the 599 Font Awesome icon instances, including those nested in shared components, was swapped for `Icon/placeholder` at its original size.

Two scans were run on the copies:
- After the swap, a scan found no Font Awesome instance and no visible vector outside a placeholder or the logo.
- A scan of 1,555 visible texts found none whose stored colour differed from its bound variable.

Each copy was exported with the Figma connector and downloaded directly to this folder.
