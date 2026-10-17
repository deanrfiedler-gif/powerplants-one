---
document_id: PPO-AI-THREADS-FIGMA-R01
revision: r01
date: 2026-10-17
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: 2e3bb4275e4ddf46ce1f24259fee77194b3896d8
---

# Conversations design r01 — retained captures

These fourteen images retain the Conversations page design that Dean accepted on 17 October 2026: threads about one record, with Carl, the AI assistant, tagged in. The design covers the thread view at desktop 1440, the record-link and composer states, the two share dialogs, and the phone thread list, thread, context sheet, driving mode and review after driving. The decision, the frames, the design questions and what is not drawn are in [section 14 of the threads decision](../../../../decisions/ai-communications-threads-proposal.md#14-design-reference-and-verification). Retain these bytes unchanged. A revised design receives a new revision folder.

Each image is one Figma frame, exported at scale 1 at its exact frame size. Before export, every Font Awesome icon was replaced by a plain placeholder square, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The microphone, conversations, driving and End icons were already placeholders in the design, because the file has no icon for them. The Powerplants logo in the rail is the company's own. The people, deal, purchase order, dates and messages are synthetic fixtures. The images are design compositions, not captures of the application: no `/conversations` route exists.

The frames were copied after Dean's two refinements that followed the named version: the thread sidebar in the secondary menu's light grey, and the sidebar collapsed to the menu strip (image 03). The named version therefore predates images 01 to 03 in those two respects.

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · Thread view, Sam, scrolled to the latest messages with the composer pinned | [PPO-Conversations-01-Desktop-Thread-View-r01.png](PPO-Conversations-01-Desktop-Thread-View-r01.png) | 1440 × 900 | 217,977 | `e353755517e5f1e48ac20490f61f880c9ccbffd5539f36506d53b8cbb60a3794` |
| 02 · Desktop · Thread view, Sam, the full thread (reference) | [PPO-Conversations-02-Desktop-Full-Thread-r01.png](PPO-Conversations-02-Desktop-Full-Thread-r01.png) | 1440 × 1320 | 298,684 | `2bf135be8a33b7b484e598279ed833fc275c641260b9225bf2e36cf5ccb57271` |
| 03 · Desktop · Thread view, thread sidebar collapsed to the menu strip | [PPO-Conversations-03-Desktop-Sidebar-Collapsed-r01.png](PPO-Conversations-03-Desktop-Sidebar-Collapsed-r01.png) | 1440 × 900 | 183,190 | `e73d729113b973076edb23444fe1fb8144fd8da7a2657d64022100de1ba32073` |
| 04 · State · Record links for each reader | [PPO-Conversations-04-State-Record-Links-r01.png](PPO-Conversations-04-State-Record-Links-r01.png) | 1432 × 462 | 76,275 | `1f68c1af180aaea285b1dfb0f6115d9c2b575aed618af55a936b93f889ee6618` |
| 05 · Dialog · Share read-only, sender with a share right | [PPO-Conversations-05-Dialog-Share-Read-Only-r01.png](PPO-Conversations-05-Dialog-Share-Read-Only-r01.png) | 720 × 620 | 92,516 | `fb7a8424cf4f281cd4b39711a3a2c127ba58b86c14012d39041c433c6a6dc92c` |
| 06 · Dialog · Ask the owner to share, sender without a share right | [PPO-Conversations-06-Dialog-Ask-Owner-To-Share-r01.png](PPO-Conversations-06-Dialog-Ask-Owner-To-Share-r01.png) | 720 × 620 | 89,135 | `e0a7f6d6fb4c82dbdb7c9e59db31581a8753e9b5e13a5c8080dce1e3ebe844a4` |
| 07 · State · Composer, check before sending (N1) and Carl unavailable (R9) | [PPO-Conversations-07-State-Composer-r01.png](PPO-Conversations-07-State-Composer-r01.png) | 1360 × 410 | 78,091 | `335d04e2183a8afba3ad0b3b6b520fc5588a3d70573b4a4a1c04cd1930d26365` |
| 08 · Phone · Thread list with collapsible branches | [PPO-Conversations-08-Phone-Thread-List-r01.png](PPO-Conversations-08-Phone-Thread-List-r01.png) | 390 × 844 | 43,341 | `278b73aa72a0b4e74e041fcc21c95491eb6dbc45a0043617ae0afb516f726032` |
| 09 · Phone · Thread | [PPO-Conversations-09-Phone-Thread-r01.png](PPO-Conversations-09-Phone-Thread-r01.png) | 390 × 844 | 66,202 | `71049be8c1e575390b7a823c9aa427c756af47e418776401018bc8a49c4efac1` |
| 10 · Phone · Context sheet | [PPO-Conversations-10-Phone-Context-Sheet-r01.png](PPO-Conversations-10-Phone-Context-Sheet-r01.png) | 390 × 844 | 55,274 | `59bcd967159db78789f9ac0626396b76fcc199c38cf2db4e7e6f94de684f11ac` |
| 11 · Phone · Driving mode, Listening | [PPO-Conversations-11-Phone-Driving-Listening-r01.png](PPO-Conversations-11-Phone-Driving-Listening-r01.png) | 390 × 844 | 26,313 | `8fdbea97e6327998799ecc7249e674696eb8e8e9abb923782d1c304796a225ad` |
| 12 · Phone · Driving mode, Carl is answering | [PPO-Conversations-12-Phone-Driving-Carl-Answering-r01.png](PPO-Conversations-12-Phone-Driving-Carl-Answering-r01.png) | 390 × 844 | 28,317 | `4809c858d2a7eddf20e13c2d4280ff9560fbdfe3d7c08cc7f51604e695c0f4a0` |
| 13 · Phone · Review when stopped, Alex (drawn at full length) | [PPO-Conversations-13-Phone-Review-When-Stopped-r01.png](PPO-Conversations-13-Phone-Review-When-Stopped-r01.png) | 390 × 935 | 75,825 | `7e0448132d9746486ea8a6039e759c2dc6365f283c9f001e2bc94424841413eb` |
| 14 · Notes card: reused and proposed components, proposed icons, design questions and what is not drawn | [PPO-Conversations-14-Notes-Card-r01.png](PPO-Conversations-14-Notes-Card-r01.png) | 640 × 2302 | 472,221 | `1d4e9716b42587874f76a585dece176cabbc00da933a9c0d85e3b3a7fbc3f3cd` |

The viewer is Sam in images 01 to 10 and Alex in image 13. The thread is about Deal OPP-0142 · Green Valley Nursery and purchase order PO-2281.

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design", private to Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | "Conversations — threads with Carl, accepted", saved 17 October 2026, before the grey and collapsible thread sidebar |
| Accepted frames | Page "Conversations" `1141:49`: `1158:1245`, `1146:128`, `1165:1826`, `1148:545`, `1148:614`, `1148:653`, `1159:1775`, `1149:646`, `1149:798`, `1149:913`, `1150:1045`, `1150:1059`, `1150:1073`, `1152:1160` (images in order) |
| Capture copies | Page "Captures (icon-free)" `115:2`, at y = 162,700: `1171:123165`, `1171:123810`, `1171:124394`, `1171:124882`, `1171:124953`, `1171:125002`, `1171:125051`, `1171:125120`, `1171:125251`, `1171:125391`, `1171:125650`, `1171:125666`, `1171:125682`, `1171:125804` (images in order) |

The capture copies are duplicates of the accepted frames with two changes:
- Prototype links were removed. The shared top bar's menu toggle keeps its variable action, which belongs to the main component and cannot be removed on an instance; it does not change the image.
- Each of the 323 Font Awesome icon instances, including those nested in shared components, was swapped for `Icon/placeholder` at its original size.

Three scans were run on the copies:
- After the swap, a scan found no Font Awesome instance left in any copy.
- Every vector layer in the copies sits inside an `Icon/placeholder` instance.
- A scan of 719 visible texts found none whose stored colour differed from its bound variable.

Each copy was exported with the Figma connector and downloaded directly to this folder.

## Component move check

After the export, the page's eleven `Conversations / *` main components moved to the Components page, section "Components · Conversations" (`1174:4005`), with their node IDs kept. The first export after the move drew the Button labels nested in the Composer and Share dialog components as the Button's default label, although the stored labels were unchanged. Setting each of those seven labels to its own value again on the main components restored the drawing. Afterwards:
- all fourteen copies exported byte for byte as before the move, by an in-file PNG hash;
- copies 01, 05 and 07, the ones that had changed, exported through the connector to the same bytes as images 01, 05 and 07 above;
- every layer of the accepted frames still matched its copy, apart from the icon swap and the edits listed below.

While this check ran, the Conversations page was being edited elsewhere. The rail container in the three desktop frames was replaced, the top of frames `1149:646` and `1150:1073` changed, and the notes card grew. Those edits came after the copies were taken, so these images do not show them.
