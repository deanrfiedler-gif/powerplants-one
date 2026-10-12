---
document_id: PPO-SVC-WO-RECORD-DESIGN-R01
revision: r01
date: 2026-10-12
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: 4a286d388fad17a3d443718eb25c87bf0bcac346
---

# Work order record page design r01 — retained captures

These eleven images retain the work order record page that Dean accepted on 12 October 2026, the second record type on the shared record layout. The decisions, conformance declaration, display rules, departures and open questions are in [the design decision](../../../../decisions/work-order-record-page-design.md). Retain these bytes unchanged. A revised design receives a new revision folder.

Each image is one Figma frame, exported at scale 1 at its exact frame size. Images 10 and 11 are board frames: each holds copies of several accepted frames, laid out with a label above each one. Before export, every Font Awesome icon was replaced by a plain placeholder square, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The Powerplants logo is the company's own. Figures, names, references and dates are synthetic fixtures. The images are design compositions, not captures of the application, which still shows the work order as a stack of panels.

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · Authorisation (SYN-PPO-WO-000041, blocked · 4 items) | [PPO-Work-Order-Record-01-Desktop-Authorisation-r01.png](PPO-Work-Order-Record-01-Desktop-Authorisation-r01.png) | 1440 × 900 | 229,257 | `2d0af8109d08d5aa0da301986cd85aed5011ba34e67002714ba19f6838cbe03d` |
| 02 · Desktop · Scope r01 | [PPO-Work-Order-Record-02-Desktop-Scope-r01.png](PPO-Work-Order-Record-02-Desktop-Scope-r01.png) | 1440 × 900 | 228,957 | `c049016167ca53177da85d554da3a5707bacfcc888dd4b5fbf640f42ad68ed0d` |
| 03 · Desktop · Visits, none proposed | [PPO-Work-Order-Record-03-Desktop-Visits-None-Proposed-r01.png](PPO-Work-Order-Record-03-Desktop-Visits-None-Proposed-r01.png) | 1440 × 900 | 163,600 | `842c4bc5fe2320d4850054ca6effdcf3c2f7231fe2ad6eb9d0ce7043a6a6c529` |
| 04 · Desktop · Evidence | [PPO-Work-Order-Record-04-Desktop-Evidence-r01.png](PPO-Work-Order-Record-04-Desktop-Evidence-r01.png) | 1440 × 900 | 218,258 | `d5a864e061d576e70094bfa2de1382a939622f878ceda5b8d89ef86093241a98` |
| 05 · Desktop · History | [PPO-Work-Order-Record-05-Desktop-History-r01.png](PPO-Work-Order-Record-05-Desktop-History-r01.png) | 1440 × 900 | 204,676 | `8623c218d5339a6ed30ec2a51fa7b2692b7658e6d68f868f8cd501da9be10f8c` |
| 06 · Desktop · Review a readiness criterion (side panel) | [PPO-Work-Order-Record-06-Desktop-Review-Criterion-Panel-r01.png](PPO-Work-Order-Record-06-Desktop-Review-Criterion-Panel-r01.png) | 1440 × 900 | 294,296 | `7998da2538aee2dafbbd36e883da7d540ee1adaaa4491bea9b9207b6bdd0f545` |
| 07 · Desktop · Edit scope draft r01 | [PPO-Work-Order-Record-07-Desktop-Edit-Scope-r01.png](PPO-Work-Order-Record-07-Desktop-Edit-Scope-r01.png) | 1440 × 900 | 204,221 | `d5517ae53318516d2227b2098c63e202088a86836331590a2361d94c4753bbf4` |
| 08 · Desktop · Ready to authorise, Authorise dialog (SYN-PPO-WO-000042) | [PPO-Work-Order-Record-08-Desktop-Authorise-Dialog-r01.png](PPO-Work-Order-Record-08-Desktop-Authorise-Dialog-r01.png) | 1440 × 900 | 282,799 | `29eea72d50346a8d7f14387a9149c1e3446d2c510c9c99959f6889d325208fa6` |
| 09 · Desktop · Visits, authorised r02 with successor r03 in draft (SYN-PPO-WO-000040) | [PPO-Work-Order-Record-09-Desktop-Visits-Successor-Draft-r01.png](PPO-Work-Order-Record-09-Desktop-Visits-Successor-Draft-r01.png) | 1440 × 900 | 224,290 | `6d67b60ed2e1a5158e2e37b78d5d9f175e6bdfbe42c2b37408a556325650ff32` |
| 10 · Desktop · six states (board) | [PPO-Work-Order-Record-10-Desktop-States-r01.png](PPO-Work-Order-Record-10-Desktop-States-r01.png) | 2560 × 1464 | 268,591 | `d46e61aa641441ada267ef0203b7634687fcf9b8b0118c2b4ee3d930fc646900` |
| 11 · Phone · list, Details, Authorisation, Scope and the action sheet (board) | [PPO-Work-Order-Record-11-Phone-List-Tabs-Action-Sheet-r01.png](PPO-Work-Order-Record-11-Phone-List-Tabs-Action-Sheet-r01.png) | 2190 × 952 | 333,086 | `ca93ae8d6574a2ebd65cd075f242d45ae80e69984853ce9c5197d96098a0b3d8` |

Image 10 shows, left to right and top to bottom:
1. scope needed;
2. ready to authorise, in the view of a Service owner who cannot authorise;
3. authorised with no visit proposed;
4. read only;
5. a newer saved version while editing;
6. a refresh that failed after an earlier read.

Each state is the top of a desktop record page with an excerpt of the main column. Image 11 shows, left to right, the phone list, then the Details, Authorisation and Scope tabs, then Details with the "…" action sheet open.

The register entry frame, where "Open work order" leads to this page, is not retained here: its image is identical to the accepted Work orders capture 02, because the record window already had that button.

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO — Design" in Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | "Work order record page — shared record layout, accepted"; Dean confirmed on 12 October 2026 that this named version is saved |
| Accepted frames | Page "Work order record page (accepted)" `312:2`: Authorisation `315:2094`, Scope r01 `316:639`, Visits `318:1001`, Evidence `318:1769`, History `318:2514`, review side panel `319:2118`, scope editor `327:45008`, Authorise dialog `320:2567`, successor visits `321:2930`, states section `327:31344`, phone list `326:54385`, Details `325:4093`, Authorisation `326:53619`, Scope `326:53942` and the action sheet `326:54183` |
| Capture copies | Page "Captures (icon-free)": `334:51911`, `334:52752`, `334:53498`, `334:54123`, `334:54798`, `334:55509`, `334:56385`, `334:57171`, `334:57952`, `334:58668`, `334:59134` (images 01–11 in order) |

The capture copies duplicate the accepted frames with these changes only:
- each Font Awesome icon instance was swapped for `Icon/placeholder`;
- the last phone in copy 11 shows the action sheet open;
- copies 10 and 11 lay several frames out on one board, with labels.

A check after the swap found no Font Awesome instance left in any copy: 906 icons were swapped in all. Each copy was exported with the Figma connector at scale 1 and downloaded directly to this folder.
