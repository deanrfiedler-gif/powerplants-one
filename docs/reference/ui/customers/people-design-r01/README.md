---
document_id: PPO-CS02-PEOPLE-FIGMA-R01
revision: r01
date: 2026-10-18
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: 4296429bb96b70c982d5e87201e83ed8f9e5fb22
---

# People design r01 — retained captures

These nine images retain the People design (CS-02) that Dean accepted on 18 October 2026. They cover three routes:
- `/people` and the People view of the `/contacts` hub: the contact directory at desktop 1440 × 900, tablet 1024 and phone 390;
- `/people/[id]`: the contact record for Priya Shah, with the Overview at full length, the Relationships tab and the Correct details form on desktop, and the Overview on phone at 390 and 320.

Four phone states are included. The decisions, conformance declaration and departures are in [the design decision](../../../../decisions/people-figma-design.md). Retain these bytes unchanged; a revised design receives a new revision folder.

Each image is one Figma frame exported at scale 1 at its exact frame size. Image 09 is a frame holding copies of the four state frames side by side.

Every Font Awesome icon was replaced by a plain placeholder square before export, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The Powerplants logo is the company's own. The people, organisations, sites, phone numbers, email addresses and records are synthetic fixtures: the phone numbers are in the ACMA fictional range 0491 570 xxx and the email domains end in `.example`. The images are design compositions, not captures of the application.

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · register, Active people | [PPO-People-01-Desktop-Register-r01.png](PPO-People-01-Desktop-Register-r01.png) | 1440 × 900 | 133,514 | `ab8dde67cdfd9a58cd54ae24c22e3e4809e2844e60603773af3b7184ef0e0dab` |
| 02 · Desktop · Priya Shah, Overview, full length | [PPO-People-02-Desktop-Person-Overview-r01.png](PPO-People-02-Desktop-Person-Overview-r01.png) | 1440 × 1234 | 272,645 | `1dd33ec26c9db4b6372655d2bc6c3bed1a9135023af730115ae5d9abd4ac56f0` |
| 03 · Desktop · Priya Shah, Relationships | [PPO-People-03-Desktop-Person-Relationships-r01.png](PPO-People-03-Desktop-Person-Relationships-r01.png) | 1440 × 900 | 193,124 | `4b5d70d3a3f6f3fab38c19d8400ea03b9551d1aaf18ad53f2f26d587bf10ee6a` |
| 04 · Desktop · Correct details with the reliance warning | [PPO-People-04-Desktop-Correct-Details-r01.png](PPO-People-04-Desktop-Correct-Details-r01.png) | 1440 × 900 | 195,711 | `c34ed665a087dea9e90d95f076354b5151a4a56f7df588358c456820fe98b0ad` |
| 05 · Tablet 1024 · register, side menu collapsed | [PPO-People-05-Tablet-Register-r01.png](PPO-People-05-Tablet-Register-r01.png) | 1024 × 900 | 85,432 | `5976b7d91efc21133de9c39c8fefd1fd9dc798bd765eaf1cd9804d52879b9879` |
| 06 · Phone 390 · Active people list | [PPO-People-06-Phone-List-r01.png](PPO-People-06-Phone-List-r01.png) | 390 × 844 | 56,772 | `a4b430a0daf3537c2d6b4b4ef3b6a01636a52f6231a4fab116f59aeb9959cf8a` |
| 07 · Phone 390 · Priya Shah, Overview | [PPO-People-07-Phone-Person-Overview-r01.png](PPO-People-07-Phone-Person-Overview-r01.png) | 390 × 844 | 57,124 | `bbf6aeeb0e6e8bb2643a5f9ba3f8a663db82ce0e5cd2dd680b407f99c7b0fb04` |
| 08 · Phone 320 · Priya Shah, Overview | [PPO-People-08-Phone-320-Person-Overview-r01.png](PPO-People-08-Phone-320-Person-Overview-r01.png) | 320 × 844 | 53,256 | `0566655c2b62b8a028d822f623ec27ffef78a48bc6b2e04e2d8f865704d50004` |
| 09 · States · four phone states | [PPO-People-09-Phone-States-r01.png](PPO-People-09-Phone-States-r01.png) | 1920 × 964 | 136,144 | `aa247ef2074d73663c99e788c034498c29819de0a8c7508d289aea5c107b5776` |

Image 09 holds, left to right:
1. loading;
2. no matching people;
3. could not load;
4. the record in view only, with correction history restricted.

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design", private to Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | Not yet saved. "People — accepted" is proposed and waits for Dean's explicit yes |
| Accepted frames | Page "People · CS-02" `1395:150275`, in image order:<br>• `1395:150312`, `1395:150562`, `1396:175528`, `1396:354723`;<br>• `1395:150835`;<br>• `1395:151069`, `1395:151108`, `1396:355861`;<br>• the states: `1395:151245`, `1395:151303`, `1395:151346`, `1396:355987` |
| Capture copies | Page "Captures (icon-free)", from y = 220,000: `1404:183980`, `1404:184072`, `1404:184206`, `1404:184342`, `1404:184468`, `1404:184544`, `1404:184583`, `1404:184650`, `1404:184717` (images in order) |

The capture copies are duplicates of the accepted frames with two changes:
- Prototype links were removed.
- Each of the 345 Font Awesome icon instances, including those nested in shared components, was swapped for `Icon/placeholder` at its original size. With the nine placeholders already in the frames, the copies hold 354 placeholders and five logos.

Three scans were run on the copies:
- After the swap, a scan found no Font Awesome instance and no visible vector outside a placeholder or the logo.
- A scan of 768 visible texts found none whose stored colour differed from its bound variable.
- No copy carries a prototype link or a flow starting point.

The captures were exported with the Figma connector at scale 1 and downloaded directly into this folder.
