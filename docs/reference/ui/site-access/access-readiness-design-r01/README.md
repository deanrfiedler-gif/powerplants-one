---
document_id: PPO-CS06-ACCESS-READINESS-FIGMA-R01
revision: r01
date: 2026-10-18
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: 4296429bb96b70c982d5e87201e83ed8f9e5fb22
---

# Access & readiness design r01 — retained captures

These eight images retain the Access & readiness design (CS-06) that Dean accepted on 18 October 2026. They cover one route, `/sites/[id]/readiness`, for SYN Glasshouse 4 and its visit SYN-PPO-APT-000052, moved to Thu 15 Oct 08:00–11:00:
- desktop 1440, full length: the Overview with the preparation check and the customer confirmation (P4), the Requirements tab, the Evidence tab with an independent review, and Visit preparation with an acknowledgement against an open blocker (images 01–04);
- tablet 1024 with the rail collapsed (image 05);
- phone 390 and 320 (images 06 and 07);
- two phone states (image 08).

The decisions, conformance declaration and departures are in [the design decision](../../../../decisions/access-readiness-figma-design.md). Retain these bytes unchanged; a revised design receives a new revision folder.

Each image is one Figma frame exported at scale 1 at its exact frame size. The four desktop frames are drawn full length, so their heights differ. Image 08 is a frame holding copies of the two state frames side by side on the canvas grey.

Every Font Awesome icon was replaced by a plain placeholder square before export, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The Powerplants logo is the company's own. The sites, customers, people, visits, requirements, evidence and times are synthetic fixtures. The images are design compositions, not captures of the application.

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · Overview for Thu 15 Oct, preparation check and customer confirmation | [PPO-Access-Readiness-01-Desktop-Overview-r01.png](PPO-Access-Readiness-01-Desktop-Overview-r01.png) | 1440 × 1234 | 274,682 | `f23e52aad9db1622cea22a4f23702192fa3486641c94b65a01e47d1b20a31f8d` |
| 02 · Desktop · Requirements, revision 3 | [PPO-Access-Readiness-02-Desktop-Requirements-r01.png](PPO-Access-Readiness-02-Desktop-Requirements-r01.png) | 1440 × 1034 | 230,464 | `33f346a8d6a41da6360cdb01562767be20658618fc4e6b71b20b38f8fd99b5dc` |
| 03 · Desktop · Evidence, independent review of Riley Tran's induction | [PPO-Access-Readiness-03-Desktop-Evidence-Review-r01.png](PPO-Access-Readiness-03-Desktop-Evidence-Review-r01.png) | 1440 × 1159 | 248,091 | `2589c7a1218af80ccc6ab4bc7be14658eb2d06ddfe8c30ba3246d4aa2440e914` |
| 04 · Desktop · Visit preparation, acknowledge with a blocker | [PPO-Access-Readiness-04-Desktop-Acknowledge-With-Blocker-r01.png](PPO-Access-Readiness-04-Desktop-Acknowledge-With-Blocker-r01.png) | 1440 × 1716 | 317,012 | `117c1612d7e4952c15fe0e6e64e8fd7b1bf1a5c32b966655bd1b8c43227fdc22` |
| 05 · Tablet 1024 · Overview, rail collapsed | [PPO-Access-Readiness-05-Tablet-Overview-r01.png](PPO-Access-Readiness-05-Tablet-Overview-r01.png) | 1024 × 900 | 181,059 | `c870735c9c1ad24a9a3617288645137ad55284448f6fc412fb093e5c7db1806f` |
| 06 · Phone 390 · Overview for Thu 15 Oct | [PPO-Access-Readiness-06-Phone-Overview-r01.png](PPO-Access-Readiness-06-Phone-Overview-r01.png) | 390 × 844 | 62,257 | `0825eff522d24363cb5b19ed3f989b9309da19f539fada3dcdf68cdc23802712` |
| 07 · Phone 320 · Overview for Thu 15 Oct | [PPO-Access-Readiness-07-Phone-320-Overview-r01.png](PPO-Access-Readiness-07-Phone-320-Overview-r01.png) | 320 × 844 | 58,258 | `8be80082c9ae59bb1426f6af611b4581cef62b4fe2f48d61d245544da613baa1` |
| 08 · States · two phone states | [PPO-Access-Readiness-08-Phone-States-r01.png](PPO-Access-Readiness-08-Phone-States-r01.png) | 980 × 964 | 98,233 | `c989d1ee3c82e09d835ae7f781db11fce2a0d132f59fb1515054eba716dd3d3f` |

Image 08 holds, left to right:
1. source changed since the check: revision 4 changed the bay 4 isolation requirement at 10:20, so the check is out of date and the acknowledgement was refused;
2. no requirements recorded (SYN Nutrient Room): readiness unknown.

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design", private to Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | "Access & readiness — accepted", saved by Claude in the Figma desktop app on 18 October 2026 at Dean's "Yes, save the named Figma version" (recorded on the page header and notes card) |
| Accepted frames | Page "Access & readiness · CS-06" `1400:346423`, notes card `1400:347414`, in image order:<br>• `1400:346553`, `1400:351900`, `1400:353096`, `1400:353479`;<br>• `1400:354078`;<br>• `1400:347071`, `1400:355748`;<br>• the states: `1400:356261`, `1400:356329` |
| Capture copies | Page "Captures (icon-free)" `115:2`, from y = 224,000: `1405:352660`, `1405:352795`, `1405:352947`, `1405:353073`, `1405:353225`, `1405:353360`, `1405:353427`, `1405:353494` (images in order) |

The capture copies are duplicates of the accepted frames with two changes:
- Prototype links were removed (99 layers).
- Each of the 273 Font Awesome icon instances was swapped for `Icon/placeholder` `67:77` at its original size.

After the swap, a scan of the copies found no Font Awesome instance and no visible vector outside a placeholder or the Powerplants logo.

Each copy was exported with the Figma connector (PNG, scale 1) and downloaded directly to this folder. The sizes, byte counts and hashes above were computed from the downloaded files.
