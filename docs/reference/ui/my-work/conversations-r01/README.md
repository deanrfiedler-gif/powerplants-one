---
document_id: PPO-AI-THREADS-FIGMA-R01
revision: r01
date: 2026-10-17
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: a889fb01d8ba72431ede852e9d2a55665000632d
---

# Conversations design r01 — retained captures

These fifteen images retain the Conversations page design that Dean accepted on 17 October 2026: threads about one record, with Carl, the AI assistant, tagged in. The design covers the thread view at desktop 1440, the top-bar Conversations action and its badge, the record-link and composer states, the two share dialogs, and the phone thread list, thread, context sheet, driving mode and review after driving. The decision, the frames, the design questions and what is not drawn are in [section 14 of the threads decision](../../../../decisions/ai-communications-threads-proposal.md#14-design-reference-and-verification). Retain these bytes unchanged. A revised design receives a new revision folder.

Each image is one Figma frame, exported at scale 1 at its exact frame size. Before export, every Font Awesome icon was replaced by a plain placeholder square, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The microphone, conversations, driving and End icons were already placeholders in the design, because the file has no icon for them. The Powerplants logo in the rail is the company's own. The people, deal, purchase order, dates and messages are synthetic fixtures. The images are design compositions, not captures of the application: no `/conversations` route exists.

The frames were copied after the third named version was saved, so they show Dean's two refinements after acceptance: the grey, collapsible thread sidebar, and the entry point moved from the rail to a top-bar action with a badge. The top-bar action is a proposed shell amendment: the accepted `Shell / Top bar` and `Shell / Phone header` components are unchanged until it is accepted.

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · Thread view, Sam, scrolled to the latest messages with the composer pinned | [PPO-Conversations-01-Desktop-Thread-View-r01.png](PPO-Conversations-01-Desktop-Thread-View-r01.png) | 1440 × 900 | 217,052 | `fdae74b9475afdc642914d0f14742a99e0bf21fb84854a828e9bf54c8f04d37e` |
| 02 · Desktop · Thread view, Sam, the full thread (reference) | [PPO-Conversations-02-Desktop-Full-Thread-r01.png](PPO-Conversations-02-Desktop-Full-Thread-r01.png) | 1440 × 1320 | 297,492 | `f43a4ad2204f2f2fd93dac6f06e5e47ad01c906a258d9c62cff5db77901a1486` |
| 03 · Desktop · Thread view, thread sidebar collapsed to the menu strip | [PPO-Conversations-03-Desktop-Sidebar-Collapsed-r01.png](PPO-Conversations-03-Desktop-Sidebar-Collapsed-r01.png) | 1440 × 900 | 181,861 | `59c5f44c9118cf4f22b018271a60fb5c7e8f191f7a16e5fa28f7922870e2e347` |
| 04 · State · Top-bar Conversations action and badge (proposed shell amendment) | [PPO-Conversations-04-State-Top-Bar-Action-Badge-r01.png](PPO-Conversations-04-State-Top-Bar-Action-Badge-r01.png) | 1244 × 717 | 83,314 | `d8b80b4c8992f5b769860e4c46b6da6ccc59f871a10ae16e5dd6c0b151cdd0a6` |
| 05 · State · Record links for each reader | [PPO-Conversations-05-State-Record-Links-r01.png](PPO-Conversations-05-State-Record-Links-r01.png) | 1432 × 462 | 76,275 | `1f68c1af180aaea285b1dfb0f6115d9c2b575aed618af55a936b93f889ee6618` |
| 06 · Dialog · Share read-only, sender with a share right | [PPO-Conversations-06-Dialog-Share-Read-Only-r01.png](PPO-Conversations-06-Dialog-Share-Read-Only-r01.png) | 720 × 620 | 92,516 | `fb7a8424cf4f281cd4b39711a3a2c127ba58b86c14012d39041c433c6a6dc92c` |
| 07 · Dialog · Ask the owner to share, sender without a share right | [PPO-Conversations-07-Dialog-Ask-Owner-To-Share-r01.png](PPO-Conversations-07-Dialog-Ask-Owner-To-Share-r01.png) | 720 × 620 | 89,135 | `e0a7f6d6fb4c82dbdb7c9e59db31581a8753e9b5e13a5c8080dce1e3ebe844a4` |
| 08 · State · Composer, check before sending (N1) and Carl unavailable (R9) | [PPO-Conversations-08-State-Composer-r01.png](PPO-Conversations-08-State-Composer-r01.png) | 1360 × 410 | 78,091 | `335d04e2183a8afba3ad0b3b6b520fc5588a3d70573b4a4a1c04cd1930d26365` |
| 09 · Phone · Thread list with collapsible branches | [PPO-Conversations-09-Phone-Thread-List-r01.png](PPO-Conversations-09-Phone-Thread-List-r01.png) | 390 × 844 | 44,349 | `7ad05af75ee9d4e0a98779579deba17a5da071f0b4bde1ab703e7430a070d8e0` |
| 10 · Phone · Thread | [PPO-Conversations-10-Phone-Thread-r01.png](PPO-Conversations-10-Phone-Thread-r01.png) | 390 × 844 | 66,202 | `71049be8c1e575390b7a823c9aa427c756af47e418776401018bc8a49c4efac1` |
| 11 · Phone · Context sheet | [PPO-Conversations-11-Phone-Context-Sheet-r01.png](PPO-Conversations-11-Phone-Context-Sheet-r01.png) | 390 × 844 | 55,274 | `59bcd967159db78789f9ac0626396b76fcc199c38cf2db4e7e6f94de684f11ac` |
| 12 · Phone · Driving mode, Listening | [PPO-Conversations-12-Phone-Driving-Listening-r01.png](PPO-Conversations-12-Phone-Driving-Listening-r01.png) | 390 × 844 | 26,313 | `8fdbea97e6327998799ecc7249e674696eb8e8e9abb923782d1c304796a225ad` |
| 13 · Phone · Driving mode, Carl is answering | [PPO-Conversations-13-Phone-Driving-Carl-Answering-r01.png](PPO-Conversations-13-Phone-Driving-Carl-Answering-r01.png) | 390 × 844 | 28,317 | `4809c858d2a7eddf20e13c2d4280ff9560fbdfe3d7c08cc7f51604e695c0f4a0` |
| 14 · Phone · Review when stopped, Alex (drawn at full length) | [PPO-Conversations-14-Phone-Review-When-Stopped-r01.png](PPO-Conversations-14-Phone-Review-When-Stopped-r01.png) | 390 × 935 | 76,886 | `4547cf0d6884fd7cc0f474c55646ec3923f912e70e315415a103952ad5bb7ace` |
| 15 · Notes card: reused and proposed components, proposed icons, design questions D1 to D7 and what is not drawn | [PPO-Conversations-15-Notes-Card-r01.png](PPO-Conversations-15-Notes-Card-r01.png) | 640 × 2702 | 570,336 | `76428b9de5bb474171fad58311eab8133d6d6e4f947f994f166e3ca31ebd22f9` |

The viewer is Sam in images 01 to 11 and Alex in image 14. The thread is about Deal OPP-0142 · Green Valley Nursery and purchase order PO-2281. The badge on the top-bar action shows three conversations with something new.

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design", private to Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named versions | "Conversations — threads with Carl, accepted"; "… accepted (grey, collapsible sidebar)"; "… accepted (top-bar icon and badge)", all saved 17 October 2026. The images were copied after the third |
| Accepted frames | Page "Conversations" `1141:49`: `1158:1245`, `1146:128`, `1165:1826`, `1177:2196`, `1148:545`, `1148:614`, `1148:653`, `1159:1775`, `1149:646`, `1149:798`, `1149:913`, `1150:1045`, `1150:1059`, `1150:1073`, `1152:1160` (images in order) |
| Capture copies | Page "Captures (icon-free)" `115:2`, at y = 162,700: `1182:125274`, `1182:125945`, `1182:126606`, `1182:127161`, `1182:127332`, `1182:127407`, `1182:127447`, `1182:127487`, `1182:127563`, `1182:127709`, `1182:127865`, `1182:128159`, `1182:128174`, `1182:128190`, `1182:128329` (images in order) |

The capture copies are duplicates of the accepted frames with two changes:
- Prototype links were removed. The linked Sales rail in images 01 to 03 keeps its own hover and toggle interactions, which belong to its main component and cannot be removed on an instance; they do not change the image.
- Each of the 347 Font Awesome icon instances, including those nested in shared components, was swapped for `Icon/placeholder` at its original size.

Three scans were run on the copies:
- After the swap, a scan found no Font Awesome instance left in any copy.
- Every vector layer in the copies sits inside an `Icon/placeholder` instance.
- A scan of 741 visible texts found none whose stored colour differed from its bound variable.

Each copy was exported with the Figma connector and downloaded directly to this folder.

## Component move check

In the lock-in, the page's eleven `Conversations / *` main components moved to the Components page, section "Components · Conversations" (`1174:4005`), with their node IDs kept. The move was checked on an earlier set of copies, taken before the top-bar redesign and replaced by the set above.
- The first export after the move drew the Button labels nested in the Composer and Share dialog components as the Button's default label, although the stored labels were unchanged.
- Setting each of those seven labels to its own value again on the main components restored the drawing.
- Afterwards, all fourteen earlier copies exported byte for byte as before the move, by an in-file PNG hash. The three copies that had changed also exported through the connector to their pre-move bytes.

Images 05 to 08 and 10 to 13 above have the same bytes as their counterparts in that earlier set.
