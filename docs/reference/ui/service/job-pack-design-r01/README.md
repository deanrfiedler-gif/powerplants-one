---
document_id: PPO-SVC-JOB-PACK-FIGMA-DESIGN-R01
revision: r01
date: 2026-10-12
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: 4a286d388fad17a3d443718eb25c87bf0bcac346
---

# Job pack design r01 — retained captures

These seven images retain the Job pack design Dean accepted on 12 October 2026: the Job packs register (`/service/packs`), the job pack record page (`/service/packs/[id]`), its Preparation and Revision history views, its decision dialogs, and the coordinator's and technician's phone views. The decisions, conformance declaration, departures and open questions are in [the design decision](../../../../decisions/job-pack-figma-design.md). Keep these bytes unchanged; a revised design gets a new revision folder.

Each image is one capture board: a light grey frame holding copies of the accepted Figma frames side by side, 40 px apart, with a 40 px margin. The boards hold 24 states, and exporting seven boards keeps the connector's reads low. Every frame in a board is at its exact frame size (scale 1), so cropping a board at the offsets below gives that frame exactly. The one exception is image 05, explained below the table.

Every Font Awesome icon was replaced by a plain placeholder square before export, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The Powerplants logo is the company's own. Names, references, sites and dates are synthetic fixtures. The images are design compositions, not captures of the application, whose job pack pages still show the built r03 design.

## Images

| Image | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · register and selection | [PPO-Job-Pack-01-Desktop-Register-and-Selection-r01.png](PPO-Job-Pack-01-Desktop-Register-and-Selection-r01.png) | 3000 × 980 | 302,488 | `55c639fa49d5cbc8dbd416eb28ca4f45f369cf7dc9ae3b0595a4273f48abb4de` |
| 02 · Desktop · record page and preparation | [PPO-Job-Pack-02-Desktop-Record-Page-and-Preparation-r01.png](PPO-Job-Pack-02-Desktop-Record-Page-and-Preparation-r01.png) | 3000 × 1920 | 801,944 | `102016849a1cf72a37eee1bc41ec2c103e480203823461a6b865fcca48322712` |
| 03 · Desktop · history, decisions and issue | [PPO-Job-Pack-03-Desktop-History-Decisions-and-Issue-r01.png](PPO-Job-Pack-03-Desktop-History-Decisions-and-Issue-r01.png) | 3000 × 3800 | 1,829,254 | `52a249ec35613ca04e59d78ae598160835f9796ca668a1fb1f241628bd7b2758` |
| 04 · Desktop · source changed and review | [PPO-Job-Pack-04-Desktop-Source-Changed-and-Review-r01.png](PPO-Job-Pack-04-Desktop-Source-Changed-and-Review-r01.png) | 3000 × 980 | 391,049 | `4223a1f02d4948bfae1dcb243ccc9bcee9ddae8036e3983608ec2996ab0f31ff` |
| 05 · Desktop · whole job pack | [PPO-Job-Pack-05-Desktop-Whole-Job-Pack-r01.png](PPO-Job-Pack-05-Desktop-Whole-Job-Pack-r01.png) | 1368 × 4023 | 525,994 | `b8e11fc86de4c8b8c3ecbdfd4a63f00194f0c6d1c4bc731694c6d778055b812b` |
| 06 · Phone · coordinator and technician | [PPO-Job-Pack-06-Phone-Coordinator-and-Technician-r01.png](PPO-Job-Pack-06-Phone-Coordinator-and-Technician-r01.png) | 3480 × 3659 | 708,955 | `073b3f4411d45a5997127bd5ca547f01873a0337f044e080eb3f3033308b90ad` |
| 07 · States board | [PPO-Job-Pack-07-States-Board-r01.png](PPO-Job-Pack-07-States-Board-r01.png) | 2056 × 3984 | 610,155 | `91848a7b51f2c6a6a14e0a05bbb760b8238829a7a282720b3f73e8b92fa26750` |

Image 05 shows the whole Job pack view at its full scrolling length, with the secondary menu reduced to its strip and the status panel collapsed. At 1440 × 4234 it is over Figma's 4,096 px export limit, so it is exported at scale 0.95 (1368 × 4023), without a board margin. The 1440 × 900 frames in images 02 and 03 are the scale-1 references for that view.

## Frames in each image

Offsets are the frame's top-left corner in the image, in pixels.

| Image | Frame (accepted node) | Offset | Size |
|---|---|---|---|
| 01 | Register (`272:2038`) | 40, 40 | 1440 × 900 |
| 01 | Two rows selected, small panel (`295:47432`) | 1520, 40 | 1440 × 900 |
| 02 | Job pack view, Draft r02 (`280:2678`) | 40, 40 | 1440 × 900 |
| 02 | Job pack view, status panel collapsed (`301:45810`) | 1520, 40 | 1440 × 900 |
| 02 | Preparation view (`288:3252`) | 40, 980 | 1440 × 900 |
| 02 | Record preparation change dialog (`289:3660`) | 1520, 980 | 1440 × 900 |
| 03 | Revision history, r03 saved (`290:4052`) | 40, 40 | 1440 × 900 |
| 03 | Check revision r03 dialog (`303:6353`) | 1520, 40 | 1440 × 900 |
| 03 | Return preparation r03 dialog (`303:6480`) | 40, 980 | 1440 × 900 |
| 03 | Checked r03, not issued (`303:5318`) | 1520, 980 | 1440 × 900 |
| 03 | Queue exact output for r03 dialog (`303:6602`) | 40, 1920 | 1440 × 900 |
| 03 | Issued r03, awaiting acknowledgement (`291:4320`) | 1520, 1920 | 1440 × 900 |
| 03 | Withdraw the current issue r03 dialog (`303:6853`) | 40, 2860 | 1440 × 900 |
| 04 | Source changed since check (`306:8133`) | 40, 40 | 1440 × 900 |
| 04 | Preparation, reviewing changed sources (`306:16129`) | 1520, 40 | 1440 × 900 |
| 05 | Whole job pack, menu and status panel collapsed (from `301:45810`) | 0, 0 | 1440 × 4234 at scale 0.95 |
| 06 | Phone list rows (`272:2542`) | 40, 40 | 390 × 844 |
| 06 | Phone coordinator, Pack tab, Draft r02 (`272:42429`) | 470, 40 | 390 × 844 |
| 06 | Phone coordinator, Readiness tab (`307:9341`) | 900, 40 | 390 × 844 |
| 06 | Phone coordinator, History tab (`307:9533`) | 1330, 40 | 390 × 844 |
| 06 | Phone technician, acknowledgement required (`294:4878`) | 1760, 40 | 390 × 844 |
| 06 | Phone technician, confirm acknowledgement (`304:48130`) | 2190, 40 | 390 × 844 |
| 06 | Phone technician, acknowledged (`304:48274`) | 2620, 40 | 390 × 844 |
| 06 | Phone technician, whole pack (from `294:4878`) | 3050, 40 | 390 × 3579 |
| 07 | States board (from section `296:4851`) | 0, 0 | 2056 × 3984 |

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design", private to Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | "Job pack — Pipedrive pattern, accepted" |
| Accepted page | "Job pack (accepted)", with the frames listed above, the notes card `311:9244` and the page components listed in the decision |
| Capture copies | Page "Captures (icon-free)": boards `327:23715`, `327:31762`, `327:35594`, `327:41980`, `327:43932` (frame `327:43933`), `327:45856` and `327:48031` (images 01–07 in order) |

The capture copies are duplicates of the accepted frames, with these changes:

- Each Font Awesome icon instance was swapped for `Icon/placeholder`. The swap was repeated until a check found no Font Awesome instance left in any board.
- The two whole-length copies (images 05 and 06) were made taller to show their full scrolling content. Image 05 also has the secondary menu reduced to its strip, so the whole pack fits the export limit.

Each board was exported with the Figma connector and downloaded directly to this folder.
