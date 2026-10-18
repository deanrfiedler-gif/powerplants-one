---
document_id: PPO-CS04-SITES-FIGMA-R01
revision: r01
date: 2026-10-18
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: 3bd12c428ec1db087d35bf2e6e55f8845a78b9db
---

# Sites design r01 — retained captures

These eight images retain the Sites design (CS-04) that Dean accepted on 18 October 2026. They cover two routes:
- `/sites`: the register at desktop 1440 × 900, tablet 1024 and phone 390 (images 01, 04, 05 and 08);
- `/sites/[id]`: the site workspace for SYN Glasshouse 4, with the overview and the Equipment tab on desktop and the overview at phone 390 and 320 (images 02, 03, 06 and 07).

Three phone states are included. The decisions, conformance declaration and departures are in [the design decision](../../../../decisions/sites-figma-design.md). Retain these bytes unchanged; a revised design receives a new revision folder.

Each image is one Figma frame exported at scale 1 at its exact frame size. Image 08 is a frame holding copies of the three state frames side by side on the canvas grey.

Every Font Awesome icon was replaced by a plain placeholder square before export, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The Powerplants logo is the company's own. The sites, customers, people, visits, equipment and times are synthetic fixtures. The images are design compositions, not captures of the application.

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · register, All sites | [PPO-Sites-01-Desktop-Register-r01.png](PPO-Sites-01-Desktop-Register-r01.png) | 1440 × 900 | 132,993 | `60f46bb8a5e821482c026caae82988bf3a42b5f636f2f4bc50b2013ced62cb30` |
| 02 · Desktop · site overview, SYN Glasshouse 4 | [PPO-Sites-02-Desktop-Site-Overview-r01.png](PPO-Sites-02-Desktop-Site-Overview-r01.png) | 1440 × 900 | 213,627 | `df6cab591f60ab211e09ce7eb3eb8d3f81ab44cad054766232f8a976effbfa8b` |
| 03 · Desktop · Equipment tab, installed and served | [PPO-Sites-03-Desktop-Site-Equipment-r01.png](PPO-Sites-03-Desktop-Site-Equipment-r01.png) | 1440 × 900 | 206,327 | `27dca39f7a321ff8834617a23223122085a45be2f1bd4da5a6e2492a71a92a60` |
| 04 · Tablet 1024 · register, side menu collapsed | [PPO-Sites-04-Tablet-Register-r01.png](PPO-Sites-04-Tablet-Register-r01.png) | 1024 × 900 | 80,473 | `19eec3e696d024c66a34656436784d5fe6389686c62afed14d531a2e7cd3b4b6` |
| 05 · Phone 390 · All sites list | [PPO-Sites-05-Phone-List-r01.png](PPO-Sites-05-Phone-List-r01.png) | 390 × 844 | 65,980 | `fe9fdd99c6374d9c4a5522e124c600025f413b181c1a3715f7a493926e7ffc3c` |
| 06 · Phone 390 · site overview | [PPO-Sites-06-Phone-Site-Overview-r01.png](PPO-Sites-06-Phone-Site-Overview-r01.png) | 390 × 844 | 66,123 | `200b1834d289d739584878b3a3f43288e823836eac8a6c30050c97b8558e0bba` |
| 07 · Phone 320 · site overview | [PPO-Sites-07-Phone-320-Site-Overview-r01.png](PPO-Sites-07-Phone-320-Site-Overview-r01.png) | 320 × 844 | 57,331 | `0cc6071ffc2659c1fb3d9e7e6a47a84047f0e437ea81840534a3a2c88f9ff238` |
| 08 · States · three phone states | [PPO-Sites-08-Phone-States-r01.png](PPO-Sites-08-Phone-States-r01.png) | 1450 × 964 | 68,141 | `63c939cb44c89e8d4728b1f6f0612f88ab11f3c2ba7be590602dd2a7255b0cec` |

Image 08 holds, left to right:
1. loading;
2. no matching sites;
3. could not load.

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design", private to Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | "Sites — accepted", saved 18 October 2026 |
| Accepted frames | Page "Sites · CS-04" `1375:2901`, notes card `1380:2175`, in image order:<br>• `1375:2937`, `1375:3183`, `1375:3312`;<br>• `1375:3449`;<br>• `1375:328008`, `1375:3678`, `1379:2365`;<br>• the states: `1375:328046`, `1375:328103`, `1375:328145` |
| Capture copies | Page "Captures (icon-free)" `115:2`, from y = 216,000: `1396:172401`, `1396:172650`, `1396:172779`, `1396:172920`, `1396:173152`, `1396:173190`, `1396:173257`, `1396:173324` (images in order) |

The capture copies are duplicates of the accepted frames with two changes:
- Prototype links were removed.
- Each of the 326 Font Awesome icon instances was swapped for `Icon/placeholder` `67:77` at its original size.

After the swap, a scan of the copies found no Font Awesome instance and no visible vector outside a placeholder or the Powerplants logo.

Each copy was exported with the Figma connector (PNG, scale 1) and downloaded directly to this folder. The sizes, byte counts and hashes above were computed from the downloaded files.
