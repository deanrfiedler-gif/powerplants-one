---
document_id: PPO-SV08-ESCALATIONS-FIGMA-R01
revision: r01
date: 2026-10-18
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: 3bd12c428ec1db087d35bf2e6e55f8845a78b9db
---

# Remote diagnosis and escalation design r01 — retained captures

These nine images retain the Remote diagnosis and escalation design (SV-08) that Dean accepted on 18 October 2026. They cover the proposed route `/service/escalations`:
- the register of open cases at desktop 1440 × 900, tablet 1024 and phone 390;
- one case at desktop: in Diagnosing with the draft evidence pack, Record as sent, and Reply to act on;
- the reply to act on at phone 390 and 320.

Three phone states are included. The decisions, conformance declaration and departures are in [the design decision](../../../../decisions/escalations-figma-design.md). Retain these bytes unchanged; a revised design receives a new revision folder.

Each image is one Figma frame exported at scale 1 at its exact frame size. Image 09 is a frame holding copies of the three state frames side by side on the canvas grey.

Every Font Awesome icon was replaced by a plain placeholder square before export, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The Powerplants logo is the company's own. The cases, people, manufacturers, equipment, sites, references and times are synthetic fixtures. The images are design compositions, not captures of the application. Nothing for SV-08 is built.

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · register, Open cases | [PPO-Escalations-01-Desktop-Register-r01.png](PPO-Escalations-01-Desktop-Register-r01.png) | 1440 × 900 | 114,897 | `35e28b3b42094851523be6b8dd07030c0bddf168f1e0857af889e9b8a76925e0` |
| 02 · Desktop · case in Diagnosing, diagnosis and draft evidence pack | [PPO-Escalations-02-Desktop-Diagnosis-r01.png](PPO-Escalations-02-Desktop-Diagnosis-r01.png) | 1440 × 900 | 210,379 | `53fba50b2be671ee08040d2c2b65c23e0365dbca0e4261c45f7bf49c6a58b629` |
| 03 · Desktop · Record as sent, after sending from your mailbox | [PPO-Escalations-03-Desktop-Record-As-Sent-r01.png](PPO-Escalations-03-Desktop-Record-As-Sent-r01.png) | 1440 × 900 | 177,689 | `a327a7735d8d4b1c6ee539d0641eae84dbfebe4f67cbe660a595f5e45a478ff2` |
| 04 · Desktop · Reply to act on, advice to next action | [PPO-Escalations-04-Desktop-Reply-To-Act-On-r01.png](PPO-Escalations-04-Desktop-Reply-To-Act-On-r01.png) | 1440 × 900 | 206,371 | `c16bcc052e27f302519f4e7f278aa404d3396f3dfe1e7b7eb0b6db3508dd4e18` |
| 05 · Tablet 1024 · register, side menu collapsed | [PPO-Escalations-05-Tablet-Register-r01.png](PPO-Escalations-05-Tablet-Register-r01.png) | 1024 × 900 | 54,613 | `d20d9ef7baeb01b0ca30cf4ecfc86c19ad095ec58c764309639d48af23c2e15c` |
| 06 · Phone 390 · open cases list | [PPO-Escalations-06-Phone-List-r01.png](PPO-Escalations-06-Phone-List-r01.png) | 390 × 844 | 44,359 | `bd2abafadfb6a934162e7061dc2587408cb886d64117c3bc05a5a53feebc4007` |
| 07 · Phone 390 · reply to act on | [PPO-Escalations-07-Phone-Reply-r01.png](PPO-Escalations-07-Phone-Reply-r01.png) | 390 × 844 | 64,596 | `92ee203f72b6dbdac8da23e36744e10453952fae4feac69d76b85329a97fcb0f` |
| 08 · Phone 320 · reply to act on | [PPO-Escalations-08-Phone-320-Reply-r01.png](PPO-Escalations-08-Phone-320-Reply-r01.png) | 320 × 844 | 58,123 | `5ab003ee27ae70cf68ebed0ba021ec513b1a3a2298e89f88ccc777fd7fd59c66` |
| 09 · States · three phone states | [PPO-Escalations-09-Phone-States-r01.png](PPO-Escalations-09-Phone-States-r01.png) | 1450 × 964 | 70,531 | `a9cd60b6a11a5968f0bb45918ce78fb22b4a3a55651a9a6b5c919ab384a65a6c` |

Image 09 holds, left to right:
1. loading;
2. no open cases;
3. could not load.

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design", private to Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | "Remote diagnosis and escalation — accepted", intended. Not saved yet; it waits for Dean's explicit yes |
| Accepted frames | Page "Remote diagnosis and escalation · SV-08" `1365:2901`, in image order:<br>• `1365:2937`, `1365:3183`, `1365:3312`, `1365:3445`;<br>• `1365:3576`;<br>• `1365:325743`, `1365:3805`, `1369:3477`;<br>• the states: `1365:325781`, `1365:325838`, `1365:325880` |
| Capture copies | Page "Captures (icon-free)" `115:2`, from y = 208,000: `1396:167496`, `1396:167739`, `1396:167868`, `1396:168001`, `1396:168132`, `1396:168352`, `1396:168386`, `1396:168453`, `1396:168520` (images in order) |

The capture copies are duplicates of the accepted frames with two changes:
- Prototype links were removed.
- Each of the 354 Font Awesome icon instances was swapped for `Icon/placeholder` (`67:77`) at its original size.

After the swap, a scan of the copies found no Font Awesome instance and no visible vector outside a placeholder or the Powerplants logo.

Each copy was exported with the Figma connector (PNG, scale 1) and downloaded directly to this folder. The pixel sizes, byte counts and SHA-256 hashes above were computed from the downloaded files.
