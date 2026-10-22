---
document_id: PPO-AD02-SETTINGS-HUB-FIGMA-R01
revision: r01
date: 2026-10-22
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: 612ebecbfc328a20a035b71c363729f3223efe7f
---

# Settings hub design r01 — retained captures

These thirteen images retain the Settings hub design (AD-02, WS-D6) that Dean accepted on 22 October 2026. They cover three proposed routes:
- `/admin/settings`: the Settings overview at desktop 1440 (full length), tablet 1024 and phone 390;
- `/admin/policies`: the Business policies register;
- `/admin/policies/[id]`: the SYN P05 conservative planning policy with its Terms and Version 2 proposal tabs, the Propose change and Publish version 2 dialogs and the refused publication on desktop, the policy at phone 390 and 320, and the Readable record references policy record.

Four phone states are included. The decisions, conformance declaration and departures are in [the design decision](../../../../decisions/settings-hub-figma-design.md). Retain these bytes unchanged; a revised design receives a new revision folder.

Each image is one Figma frame exported at scale 1 at its exact frame size. Image 13 is a frame holding copies of the four phone state frames side by side.

Every Font Awesome icon was replaced by a plain placeholder square before export, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The Powerplants logo is the company's own. The policies, terms, proposals, reviews and bookings are synthetic fixtures; they are not adopted operating rules and grant no authority. The images are design compositions, not captures of the application.

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · Settings overview, all areas, full length | [PPO-Settings-Hub-01-Desktop-Overview-Full-Length-r01.png](PPO-Settings-Hub-01-Desktop-Overview-Full-Length-r01.png) | 1440 × 1230 | 259,475 | `9de9d9a3e57bcd9b9bd204128cfd705ccd4c7e4985bc3db49b71a0320459e961` |
| 02 · Desktop · Business policies register, All policies | [PPO-Settings-Hub-02-Desktop-Business-Policies-r01.png](PPO-Settings-Hub-02-Desktop-Business-Policies-r01.png) | 1440 × 900 | 144,646 | `c9533360413473aeb8f6bf0e6575a6277981640de0aa1d5e336bd45726fd62bb` |
| 03 · Desktop · SYN P05 planning policy, Terms | [PPO-Settings-Hub-03-Desktop-Policy-Terms-r01.png](PPO-Settings-Hub-03-Desktop-Policy-Terms-r01.png) | 1440 × 1021 | 232,191 | `e4e129ecd498148aea2495f26d15aeacde6a111bc479f629585f83797a65e839` |
| 04 · Desktop · Version 2 proposal, reviewed, full length | [PPO-Settings-Hub-04-Desktop-Version-2-Proposal-Full-Length-r01.png](PPO-Settings-Hub-04-Desktop-Version-2-Proposal-Full-Length-r01.png) | 1440 × 1705 | 333,427 | `87942c40443e8e7ee730f830d6b0ebcf517a418f82d26ece529dd0524477b749` |
| 05 · Desktop · Propose change dialog | [PPO-Settings-Hub-05-Desktop-Propose-Change-r01.png](PPO-Settings-Hub-05-Desktop-Propose-Change-r01.png) | 1440 × 980 | 326,062 | `bd0d83762e487ffaec931ba2deb0703446ec807b45ece7785da1f52b39103f02` |
| 06 · Desktop · Publish version 2 dialog | [PPO-Settings-Hub-06-Desktop-Publish-Version-2-r01.png](PPO-Settings-Hub-06-Desktop-Publish-Version-2-r01.png) | 1440 × 980 | 330,079 | `62f27ce60f6a9d56fc302f6943c29397d21959041c53af40ce4db88db66c2066` |
| 07 · Desktop · revision 2 saved, publish refused, full length | [PPO-Settings-Hub-07-Desktop-Publish-Refused-Review-Out-Of-Date-r01.png](PPO-Settings-Hub-07-Desktop-Publish-Refused-Review-Out-Of-Date-r01.png) | 1440 × 1814 | 349,443 | `b390ff14ab2029ac2b5721875dd4b6ff605971b1029a28e92321098300aa8304` |
| 08 · Desktop · Readable record references | [PPO-Settings-Hub-08-Desktop-Record-References-r01.png](PPO-Settings-Hub-08-Desktop-Record-References-r01.png) | 1440 × 1505 | 266,251 | `ec8ccd19a94dd9fdaeef30e03566335dbb86f54d3bf4f2c7997ea40784569534` |
| 09 · Tablet 1024 · Settings overview, side menu collapsed | [PPO-Settings-Hub-09-Tablet-Overview-r01.png](PPO-Settings-Hub-09-Tablet-Overview-r01.png) | 1024 × 900 | 151,515 | `b7439fbbc24a8285ca7fe8a1f7563df2f08d1a6c129d90c36fa1756d836b98ee` |
| 10 · Phone 390 · Settings overview, areas grouped | [PPO-Settings-Hub-10-Phone-Overview-r01.png](PPO-Settings-Hub-10-Phone-Overview-r01.png) | 390 × 844 | 53,646 | `962062ea90953315fe60532f8753680b20b44202af58dee8da7e2fc893c6914d` |
| 11 · Phone 390 · SYN P05 policy, version 2 waiting to publish | [PPO-Settings-Hub-11-Phone-Policy-r01.png](PPO-Settings-Hub-11-Phone-Policy-r01.png) | 390 × 844 | 68,939 | `e7b04cfe121a8a2d7d220592eb94291e916b69669926afc6ad7237a16beeb5b4` |
| 12 · Phone 320 · SYN P05 policy, version 2 waiting to publish | [PPO-Settings-Hub-12-Phone-320-Policy-r01.png](PPO-Settings-Hub-12-Phone-320-Policy-r01.png) | 320 × 844 | 64,041 | `aa326003c2d3412f1d18cbfd46712b1312dc6730d8823eef22a53bf649b48ce5` |
| 13 · States · four phone states | [PPO-Settings-Hub-13-Phone-States-r01.png](PPO-Settings-Hub-13-Phone-States-r01.png) | 1760 × 924 | 88,144 | `7bec544e56256f000b4dd34e0618f5d3f4d46bfe646c40cc8bfc8c2003f51b3f` |

Image 13 holds, left to right:
1. loading;
2. no policies match these filters;
3. could not load;
4. no configuration area permitted.

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design", private to Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | "Settings — accepted", not yet saved; it waits for Dean's yes |
| Accepted frames | Page "Settings · AD-02" `2049:11645`, in image order:<br>• `2049:11682`, `2049:11796`, `2049:11910`, `2050:510998`, `2052:506644`, `2052:507029`, `2052:505135`, `2050:511240`;<br>• `2049:12799`;<br>• `2049:12895`, `2049:12910`, `2049:12961`;<br>• the phone states: `2049:13013`, `2049:13045`, `2049:13062`, `2049:13072` |
| Capture copies | Page "Captures (icon-free)", from y = 360,000, images in order: `2055:505208`, `2055:505296`, `2055:505391`, `2055:505512`, `2055:505678`, `2055:505857`, `2055:506094`, `2055:506265`, `2055:506403`, `2055:506468`, `2055:506496`, `2055:506552`, `2055:506608` |

The capture copies are duplicates of the accepted frames with two changes:
- The prototype reactions on 176 layers were removed, and the Captures page keeps its 105 flow starting points.
- Each of the 518 Font Awesome icon instances, including those nested in shared components, was swapped for `Icon/placeholder` at its original size.

Three scans were run on the copies:
- After the swap, a scan found no Font Awesome instance and no visible vector outside a placeholder or the logo.
- A scan of 1,352 visible texts found none whose stored colour differed from its bound variable.
- No copy carries a prototype link.

The captures were exported with the Figma connector at scale 1 and downloaded directly into this folder.
