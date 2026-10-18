---
document_id: PPO-FI06-INCIDENTS-FIGMA-R01
revision: r01
date: 2026-10-18
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: 3bd12c428ec1db087d35bf2e6e55f8845a78b9db
---

# Incidents and corrective actions design r01 — retained captures

These twelve images retain the Incidents and corrective actions design (FI-06) that Dean accepted on 18 October 2026. They cover three routes:
- `/service/incidents`: the register at desktop 1440 × 900 and tablet 1024 (images 01 and 07);
- `/service/incidents/[id]`: the incident record on desktop, from a submitted report with its scope held to ready to close, and the reporter's phone view (images 02–05 and 11);
- `/service/incidents/new`: the report form on desktop and on phone at 390 and 320, the submit sheet and two phone states (images 06, 08–10 and 12).

The decisions, conformance declaration and departures are in [the design decision](../../../../decisions/incidents-figma-design.md). Retain these bytes unchanged; a revised design receives a new revision folder.

Each image is one Figma frame exported at scale 1 at its exact frame size. Image 12 is a frame holding copies of the two state frames side by side on the canvas grey.

Every Font Awesome icon was replaced by a plain placeholder square before export, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The Powerplants logo is the company's own. The incidents, people, visits, equipment, sites, files and hashes are synthetic fixtures. The images are design compositions, not captures of the application.

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · register, All incidents | [PPO-Incidents-01-Desktop-Register-r01.png](PPO-Incidents-01-Desktop-Register-r01.png) | 1440 × 900 | 127,538 | `2fde10986b3bbba05fdaa70b5df458a69888720df5edf061da2937f7fbd312f1` |
| 02 · Desktop · record, submitted, scope held | [PPO-Incidents-02-Desktop-Submitted-Scope-Held-r01.png](PPO-Incidents-02-Desktop-Submitted-Scope-Held-r01.png) | 1440 × 900 | 206,399 | `9256ede977612a305b7a72d95ff221e3d485f1f930930cac8529f99b48bae279` |
| 03 · Desktop · record, triage form | [PPO-Incidents-03-Desktop-Triage-r01.png](PPO-Incidents-03-Desktop-Triage-r01.png) | 1440 × 900 | 177,295 | `a84d7e3d05db25580652306f6b74fda9508006884ca1cd3aa8d8d514e636b402` |
| 04 · Desktop · record, actions and evidence | [PPO-Incidents-04-Desktop-Actions-Evidence-r01.png](PPO-Incidents-04-Desktop-Actions-Evidence-r01.png) | 1440 × 900 | 200,160 | `9097196f4a1ff4db5bc5f8f2e46a94db3ce9eb7f8144675e037e04b24c61bf8a` |
| 05 · Desktop · record, accepted, ready to close | [PPO-Incidents-05-Desktop-Ready-To-Close-r01.png](PPO-Incidents-05-Desktop-Ready-To-Close-r01.png) | 1440 × 900 | 198,553 | `04e0d4925b0e6c4400a5e6e34732d79734dcab317e507916efefe44c294a1877` |
| 06 · Desktop · report form, draft | [PPO-Incidents-06-Desktop-Report-Form-r01.png](PPO-Incidents-06-Desktop-Report-Form-r01.png) | 1440 × 900 | 131,902 | `443a8db2c6cb68274eb09b504deaedd2c9d71ca63b78755b37f13440c5bc767a` |
| 07 · Tablet 1024 · register, side menu collapsed | [PPO-Incidents-07-Tablet-Register-r01.png](PPO-Incidents-07-Tablet-Register-r01.png) | 1024 × 900 | 77,783 | `6c5ae048cdae1946c27068fbc7444c8eb741a7f0f045dce219b2afe7f76f7c7f` |
| 08 · Phone 390 · report form, draft, full length | [PPO-Incidents-08-Phone-Report-Form-r01.png](PPO-Incidents-08-Phone-Report-Form-r01.png) | 390 × 1477 | 90,876 | `2ec3fbcf9e046db9feb7832b102af411ae451505a070a6aa632ca190d0a17cdb` |
| 09 · Phone 320 · report form, draft, full length | [PPO-Incidents-09-Phone-320-Report-Form-r01.png](PPO-Incidents-09-Phone-320-Report-Form-r01.png) | 320 × 1625 | 90,521 | `03f9dd62aac4241f8063ec72a5c6282acc6eda957817c53bb51601ab6fe4f747` |
| 10 · Phone 390 · Submit report sheet | [PPO-Incidents-10-Phone-Submit-Sheet-r01.png](PPO-Incidents-10-Phone-Submit-Sheet-r01.png) | 390 × 844 | 67,560 | `52ada95b70f4c5c74db37f1faae350137f01103968e1cd05d46e7fb25f6ceb14` |
| 11 · Phone 390 · reporter view, submitted and held | [PPO-Incidents-11-Phone-Reporter-View-r01.png](PPO-Incidents-11-Phone-Reporter-View-r01.png) | 390 × 844 | 63,509 | `4e41b89e622f12b847ccfdb534f1b8f5bbf1fd6b6b276901a53f6e81384b37ae` |
| 12 · States · two phone states | [PPO-Incidents-12-Phone-States-r01.png](PPO-Incidents-12-Phone-States-r01.png) | 980 × 964 | 113,000 | `81a6f92a3e8a4682a4bcba1be71f8350faa06148a3e84d5f4a87ca52b51f1fa1` |

Image 12 holds, left to right:
1. not connected, last saved 10:49;
2. uncertain submit, with "Recover the original".

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design", private to Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | Not saved. The intended name is "Incidents and corrective actions — accepted"; it waits for Dean's explicit yes |
| Accepted frames | Page "Incidents and corrective actions · FI-06" `1348:2972`, notes card `1355:2930`, in image order:<br>• `1348:3008`, `1348:3253`, `1348:3382`, `1348:3516`, `1348:4410`, `1348:3653`;<br>• `1348:3756`;<br>• `1348:3985`, `1354:3721`, `1354:3275`, `1348:4149`;<br>• the states: `1354:3435`, `1354:3571` |
| Capture copies | Page "Captures (icon-free)" `115:2`, from y = 200,000: `1396:158155`, `1396:158401`, `1396:158530`, `1396:158663`, `1396:158794`, `1396:158931`, `1396:159033`, `1396:159262`, `1396:159324`, `1396:159386`, `1400:351454`, `1400:351589` (images in order). Copies 11 and 12 were rebuilt after the corrections below |

The capture copies are duplicates of the accepted frames with two changes:
- Prototype links were removed.
- Each of the 421 Font Awesome icon instances was swapped for `Icon/placeholder` (`67:77`) at its original size.

After the swap, a scan of the copies found no Font Awesome instance and no visible vector outside a placeholder or the logo.

Each copy was exported with the Figma connector (PNG, scale 1) and downloaded directly to this folder.

## Corrections after acceptance

Before the captures were committed, the writers of this record found two slips in the accepted frames. Claude corrected them in Figma on 18 October 2026, rebuilt the affected capture copies and exported images 11 and 12 again; the table above gives the new sizes and hashes. Nothing else changed.
- In the reporter view (`1348:4149`) the second line of "You can still add evidence" was cut off by its row. The row now grows with its text.
- The "not connected" state (`1354:3435`) showed Save draft and Submit report as available. They are now dimmed, as the page notes require: a connection failure disables new commands.
