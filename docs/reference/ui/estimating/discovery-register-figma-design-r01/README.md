---
document_id: PPO-ES02-DISCOVERY-REGISTER-FIGMA-R01
revision: r01
date: 2026-10-18
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: 4296429bb96b70c982d5e87201e83ed8f9e5fb22
---

# Discovery register design r01 — retained captures

These eight images retain the Discovery register design (`route:/estimating/discovery`, scope ES-02) that Dean accepted on 18 October 2026. They cover the register at desktop 1440 × 900, tablet 1024 and phone 390 and 320, the Northbank snapshot, two desktop states and three phone states.

The decisions, conformance declaration and departures are in [the design decision](../../../../decisions/discovery-register-figma-design.md). Retain these bytes unchanged; a revised design receives a new revision folder.

Each image is one Figma frame exported at scale 1 at its exact frame size. Image 08 is a frame holding copies of the three phone state frames side by side.

Every Font Awesome icon was replaced by a plain placeholder square before export, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The Powerplants logo is the company's own. The workspaces, opportunities, customers, estimates and people are synthetic fixtures. The images are design compositions, not captures of the application.

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · register, All workspaces | [PPO-Discovery-Register-01-Desktop-Register-r01.png](PPO-Discovery-Register-01-Desktop-Register-r01.png) | 1440 × 900 | 143,294 | `d17fb64c6564911a2305388e117e60ffd583ebc48cea076956820614630ef97f` |
| 02 · Desktop · Northbank snapshot | [PPO-Discovery-Register-02-Desktop-Northbank-Snapshot-r01.png](PPO-Discovery-Register-02-Desktop-Northbank-Snapshot-r01.png) | 1440 × 900 | 198,159 | `e3fc6697134a561844a3f7c45525b17dbdc73a5d8bb211da98b8fbdc5e762813` |
| 03 · Desktop · state: no workspaces yet | [PPO-Discovery-Register-03-Desktop-No-Workspaces-Yet-r01.png](PPO-Discovery-Register-03-Desktop-No-Workspaces-Yet-r01.png) | 1440 × 900 | 86,058 | `c660362b9433d90bbf56006c7a2e58de1a20aeac85a911b3560ffdb5d3832820` |
| 04 · Desktop · state: view only, no create permission | [PPO-Discovery-Register-04-Desktop-View-Only-r01.png](PPO-Discovery-Register-04-Desktop-View-Only-r01.png) | 1440 × 900 | 141,328 | `f9df754366ae517e988e1ce3accffcb3517cca689b305a33f1f8c2ef2fd908db` |
| 05 · Tablet 1024 · register, side menu collapsed | [PPO-Discovery-Register-05-Tablet-Register-r01.png](PPO-Discovery-Register-05-Tablet-Register-r01.png) | 1024 × 900 | 101,827 | `d162e5474032e5ed830be8ec1c438cf46f27d5b4b898942b982c29c72b46ae8a` |
| 06 · Phone 390 · All workspaces list | [PPO-Discovery-Register-06-Phone-List-r01.png](PPO-Discovery-Register-06-Phone-List-r01.png) | 390 × 844 | 78,095 | `929e200fda94b1aa995d9647111d0424cbf2989d52de3d38ded66c1de248d979` |
| 07 · Phone 320 · All workspaces list | [PPO-Discovery-Register-07-Phone-320-List-r01.png](PPO-Discovery-Register-07-Phone-320-List-r01.png) | 320 × 844 | 72,173 | `1b3739bf0e3cace7c03c3df500d107b2705ffd3398d748fe9f82c9f70c63c75a` |
| 08 · States · three phone states | [PPO-Discovery-Register-08-Phone-States-r01.png](PPO-Discovery-Register-08-Phone-States-r01.png) | 1450 × 964 | 79,953 | `2c23e6370df923e949a80dd251d4562c603463f76556c658ac324257b952e6ca` |

Image 08 holds, left to right:
1. loading;
2. no matching workspaces;
3. could not load.

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design", private to Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | "Discovery register — Pipedrive pattern, accepted", recorded on the page header as saved 18 October 2026 on Dean's yes |
| Accepted frames | Page "Discovery register · ES-02" `1400:345306`, in image order:<br>• `1400:345640`, `1400:352346`, `1402:3944`, `1402:4539`;<br>• `1400:355129`;<br>• `1400:354630`, `1400:354952`;<br>• the phone states: `1400:355914`, `1400:356040`, `1400:356154` |
| Capture copies | Page "Captures (icon-free)" `115:2`, from y = 228,000: `1414:171749`, `1414:171846`, `1414:172061`, `1414:172133`, `1414:172225`, `1414:172304`, `1414:172343`, `1414:172382` (images in order) |

The capture copies are duplicates of the accepted frames with two changes:
- Prototype links were removed from 112 layers, and no flow starting point was left on a copy.
- Each of the 344 Font Awesome icon instances, including those nested in shared components, was swapped for `Icon/placeholder` (`67:77`) at its original size. With the ten placeholders already in the frames, the copies hold 354 placeholders and five logos.

Three scans were run on the copies:
- After the swap, a scan found no Font Awesome instance. The only visible vectors outside a placeholder or the logo are the four timeline dots in image 02's recent activity.
- A scan of 697 visible texts found none whose stored colour differed from its bound variable.
- No copy carries a prototype link or a flow starting point.

The captures were exported with the Figma connector at scale 1 and downloaded directly into this folder.
