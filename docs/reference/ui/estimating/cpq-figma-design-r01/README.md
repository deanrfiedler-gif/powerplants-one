---
document_id: PPO-CPQ-FIGMA-DESIGN-R01
revision: r01
date: 2026-10-12
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: fe7794b08235c089f215bd5b41a17e33603df21c
---

# CPQ Configure & price and Rules studio Figma design r01 — retained captures

These forty-four images retain the Figma design of the two CPQ workspaces that Dean accepted on 12 October 2026: **Configure & price**, where an estimator configures and prices a solution and hands an exact evaluation back to the estimate, and **Rules studio**, where rules, conditions and configuration data are authored, tested and released. The design is drawn on the accepted Figma conventions: the labelled Shell v2 rail, the flush side menu, the register grid, the shared record header and view tabs, and the accepted dialog styles. The decisions, the conformance declaration, the display rules and what remains open are in [the design decision](../../../../decisions/cpq-figma-design.md). Retain these bytes unchanged. A revised design receives a new revision folder.

Each image is one Figma frame or board exported at scale 1:
- Images 01–13 and 15–37 are 1440 × 960 frames. The [CCE Figma brief](../../../../delivery/cce-figma-design-prompt.md) asks for 960 px; the accepted pages use 900 px. Content scrolls inside each view.
- Image 14 is the action forms board at 1440 × 798.
- Images 38 and 39 are the two tablet frames at 1024 × 768.
- Image 40 is a board of seven phone frames, six at 390 × 844 and one at 320 × 844, with a label above each.
- Image 41 is the board of fifteen exceptional and recovery states.
- Images 42 and 43 are the page of CPQ components, in two parts. Image 44 is the "Why this line?" panel in its five views.

Before export, every Font Awesome icon was replaced by a plain placeholder square, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The rail icons, status icons, chevrons and button icons therefore appear as squares; the words beside them carry the meaning. The Powerplants logo is the company's own.

Every figure, name, rule, rate, price, margin, limit and release is synthetic: the Northbank Nursery fixture on the design's Read me page, built on the worked examples of the [CCE technical specification](../../../../architecture/cce-technical-specification.md). None is an adopted operating rule, price policy or service target. The images are design compositions, not captures of the application. Nothing they show is built.

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Rules studio · Rules registry | [PPO-CPQ-Figma-01-Rules-Registry-r01.png](PPO-CPQ-Figma-01-Rules-Registry-r01.png) | 1440 × 960 | 174,606 | `829a2402944d4be82e982d91c2bd1f2daa04360f9e84f3f7fd8c58c0379e39ce` |
| 02 · Rules studio · Rule editor, Support spacing — brackets per span, draft v8, Definition | [PPO-CPQ-Figma-02-Rule-Editor-Definition-r01.png](PPO-CPQ-Figma-02-Rule-Editor-Definition-r01.png) | 1440 × 960 | 191,247 | `2530cd27c1feb07fc4fe3e48f43668ce0817cc5ff26416df51bdd747c8c4ced5` |
| 03 · Rules studio · Field changed to a text fact: operator and value cleared, incomplete | [PPO-CPQ-Figma-03-Rule-Editor-Text-Fact-Change-r01.png](PPO-CPQ-Figma-03-Rule-Editor-Text-Fact-Change-r01.png) | 1440 × 960 | 206,803 | `9434583fccc5a37660c0bca8026c6f470e91d6578ca7e94b010fb64a47955bd0` |
| 04 · Rules studio · Test run 1: TS-02 fails | [PPO-CPQ-Figma-04-Test-Run-1-Failed-r01.png](PPO-CPQ-Figma-04-Test-Run-1-Failed-r01.png) | 1440 × 960 | 192,933 | `e1717d83aa8871313120f61fe77e93c6e71c8e74fb61dd6bd02589c79aa49505` |
| 05 · Rules studio · Formula editor, ceil() inserted (dialog) | [PPO-CPQ-Figma-05-Formula-Editor-r01.png](PPO-CPQ-Figma-05-Formula-Editor-r01.png) | 1440 × 960 | 293,529 | `4083ea7ac494800ed3812779dff463f41dba45b87a207fab2b4473a74e99d8e0` |
| 06 · Rules studio · Test run 2 passes on revision 16 | [PPO-CPQ-Figma-06-Test-Run-2-Passed-r01.png](PPO-CPQ-Figma-06-Test-Run-2-Passed-r01.png) | 1440 × 960 | 156,207 | `f1245d3142e0114c27de0d6756ba786e0cf76578f627da135430e6f140c58512` |
| 07 · Rules studio · Changes vs version 7 | [PPO-CPQ-Figma-07-Changes-vs-v7-r01.png](PPO-CPQ-Figma-07-Changes-vs-v7-r01.png) | 1440 × 960 | 179,342 | `d925f2d322d450eb933febedee5b46cc89cc4dd83f4bc87e06c083132afbdbc7` |
| 08 · Rules studio · Create version 8 (dialog) | [PPO-CPQ-Figma-08-Create-Version-8-r01.png](PPO-CPQ-Figma-08-Create-Version-8-r01.png) | 1440 × 960 | 268,037 | `a571ca1bb0c766b52c540fa644e3304742253b2061654bbb7a3ceede973f3402` |
| 09 · Rules studio · Release R6: compose, seal and activate are separate | [PPO-CPQ-Figma-09-Release-R6-r01.png](PPO-CPQ-Figma-09-Release-R6-r01.png) | 1440 × 960 | 197,887 | `67c4aff7ab5e427726d223813c7b4e8b06adbbb18ae6514bd42231eaec211770` |
| 10 · Rules studio · Decision table: drive unit by voltage and environment, overlap found | [PPO-CPQ-Figma-10-Decision-Table-r01.png](PPO-CPQ-Figma-10-Decision-Table-r01.png) | 1440 × 960 | 155,848 | `7c9d7208ae41b26e1e1d7424186c729f568ea6e2f9aba822b08f40dcfd2bbb1b` |
| 11 · Rules studio · Fact dictionary | [PPO-CPQ-Figma-11-Fact-Dictionary-r01.png](PPO-CPQ-Figma-11-Fact-Dictionary-r01.png) | 1440 × 960 | 180,956 | `b19255e7b57c2e0275968122a8bd186248cb38e04b78b822eecbcf3c02eee904` |
| 12 · Rules studio · Product structure | [PPO-CPQ-Figma-12-Product-Structure-r01.png](PPO-CPQ-Figma-12-Product-Structure-r01.png) | 1440 × 960 | 186,324 | `9b33d841dacb7d5c6744cf37023d867659d61789f4209b365fa2032f40aef254` |
| 13 · Rules studio · Rule history, version 6 (read only) | [PPO-CPQ-Figma-13-Rule-History-Version-6-r01.png](PPO-CPQ-Figma-13-Rule-History-Version-6-r01.png) | 1440 × 960 | 161,234 | `0ce7251dd069f2e451e294a8c8f426f41b324472fe9e40f6f57b7ba0a27edcb5` |
| 14 · Rules studio · Action forms (board) | [PPO-CPQ-Figma-14-Action-Forms-r01.png](PPO-CPQ-Figma-14-Action-Forms-r01.png) | 1440 × 798 | 152,365 | `c62a47fae982fff09e0312f6f0b654626c0df8cecd51e7f4f91b6ba82feba4d1` |
| 15 · Configure & price · Register | [PPO-CPQ-Figma-15-Configure-and-Price-Register-r01.png](PPO-CPQ-Figma-15-Configure-and-Price-Register-r01.png) | 1440 × 960 | 133,012 | `7d8c1fe808aa2ba929d0448a28cd8a981ae868fa116de23d588f1373fd959ead` |
| 16 · Configure & price · Configure Greenhouse 2, unavailable options explained | [PPO-CPQ-Figma-16-Configure-Greenhouse-2-r01.png](PPO-CPQ-Figma-16-Configure-Greenhouse-2-r01.png) | 1440 × 960 | 214,691 | `a06d90f55bf145c6a61dd1f93dce406792904efc3bc8c9d610ce09144fcfc1ef` |
| 17 · Configure & price · Shared capacity conflict: 5 drive units exceed MC-8 | [PPO-CPQ-Figma-17-Shared-Capacity-Conflict-r01.png](PPO-CPQ-Figma-17-Shared-Capacity-Conflict-r01.png) | 1440 × 960 | 212,579 | `c7abc4cbe2a35413c387c8fa2e973d56595ffb7870f7d348d7699f7026b4c900` |
| 18 · Configure & price · Solution overview | [PPO-CPQ-Figma-18-Solution-Overview-r01.png](PPO-CPQ-Figma-18-Solution-Overview-r01.png) | 1440 × 960 | 215,628 | `84165edbdba03a601e2e62319f12ff5c7044dc4c3549af28ca66696cf5fdb664` |
| 19 · Configure & price · Materials & labour | [PPO-CPQ-Figma-19-Materials-and-Labour-r01.png](PPO-CPQ-Figma-19-Materials-and-Labour-r01.png) | 1440 × 960 | 194,238 | `84ce63cb042f4270e403fb40dd5547488bb69bce2288d7b799524e8daa9df5bf` |
| 20 · Configure & price · Why this line? Cable brackets 33 | [PPO-CPQ-Figma-20-Why-This-Line-Cable-Brackets-r01.png](PPO-CPQ-Figma-20-Why-This-Line-Cable-Brackets-r01.png) | 1440 × 960 | 239,765 | `16c39f8abf0e6b29678a5bda80c614a592f465cc44087de57388a6a6da85b22b` |
| 21 · Configure & price · Pricing waterfall, margin and markup | [PPO-CPQ-Figma-21-Pricing-r01.png](PPO-CPQ-Figma-21-Pricing-r01.png) | 1440 × 960 | 207,552 | `08afdc82ebf01dbd20e29316d0439b1d1919abac96d97ea54a55d30a584b0598` |
| 22 · Configure & price · Compare with evaluation 2 | [PPO-CPQ-Figma-22-Compare-with-Evaluation-2-r01.png](PPO-CPQ-Figma-22-Compare-with-Evaluation-2-r01.png) | 1440 × 960 | 180,203 | `0980ab1af4407c01d53be52b5cba3c4d411fbba542b0814bf649d35cdb66bd87` |
| 23 · Configure & price · Use in estimate (dialog): exact evaluation 3 to estimate v05 | [PPO-CPQ-Figma-23-Use-in-Estimate-Dialog-r01.png](PPO-CPQ-Figma-23-Use-in-Estimate-Dialog-r01.png) | 1440 × 960 | 315,961 | `4598920ab041d1444c23d1336d7f9df0429c02e8e3d543b5d877e47f6edaf38e` |
| 24 · Configure & price · Used in estimate v05 (intended outcome, GAP-01) | [PPO-CPQ-Figma-24-Used-in-Estimate-v05-r01.png](PPO-CPQ-Figma-24-Used-in-Estimate-v05-r01.png) | 1440 × 960 | 214,409 | `2748fc590c74dee0b69102ee119cc189ff6614fd0e1119078673f265727d5cd7` |
| 25 · Overrides · Line actions | [PPO-CPQ-Figma-25-Line-Actions-r01.png](PPO-CPQ-Figma-25-Line-Actions-r01.png) | 1440 × 960 | 211,443 | `1a6b36b13091e285dc14fc424cadeebf7a9415dcfdf985d8d30440fd0bd8d323` |
| 26 · Overrides · Adjust quantity 33 to 40 with a reason (dialog) | [PPO-CPQ-Figma-26-Adjust-Quantity-Dialog-r01.png](PPO-CPQ-Figma-26-Adjust-Quantity-Dialog-r01.png) | 1440 × 960 | 270,925 | `c41d3832742c4923d47970d330c0e9b9117ea95aaccdae3bab4edb762b9cddfc` |
| 27 · Overrides · Reopened: adjustment and exclusion kept | [PPO-CPQ-Figma-27-Reopened-Adjustments-Kept-r01.png](PPO-CPQ-Figma-27-Reopened-Adjustments-Kept-r01.png) | 1440 × 960 | 195,241 | `d9d9e4d4b30009d0dd04e543132cae5f06b7b60ccc49d8ea8c212cd77e22baaf` |
| 28 · Overrides · Cable run 140 to 150 m, preview recalculating | [PPO-CPQ-Figma-28-Input-Changed-Recalculating-r01.png](PPO-CPQ-Figma-28-Input-Changed-Recalculating-r01.png) | 1440 × 960 | 207,727 | `1ea51a391615504e3724f3db9e1c1cc79f983bfea91e615d099fd1f7d84f3919` |
| 29 · Overrides · Your 40 needs review (calculated 35) | [PPO-CPQ-Figma-29-Quantity-Needs-Review-r01.png](PPO-CPQ-Figma-29-Quantity-Needs-Review-r01.png) | 1440 × 960 | 243,571 | `b7c6eff1ebdac274cc3eff61901969f6d07a66702d31043a8b0919bfab8a778c` |
| 30 · Overrides · Review adjustment (dialog) | [PPO-CPQ-Figma-30-Review-Adjustment-Dialog-r01.png](PPO-CPQ-Figma-30-Review-Adjustment-Dialog-r01.png) | 1440 × 960 | 302,037 | `fb0053688326e34acefb876cdf6a123eb46f29b3e37dba81b53bbff08217e0e8` |
| 31 · Overrides · Calculated 35 restored, 40 kept in history | [PPO-CPQ-Figma-31-Calculated-Value-Restored-r01.png](PPO-CPQ-Figma-31-Calculated-Value-Restored-r01.png) | 1440 × 960 | 197,285 | `aa2bdc539a27f7d9127873e66378a156b60f93897efdb7fa73bb3e0ef9538eaf` |
| 32 · History · Evaluations, releases and estimate uses | [PPO-CPQ-Figma-32-History-r01.png](PPO-CPQ-Figma-32-History-r01.png) | 1440 × 960 | 190,553 | `a3660a307a5ebcb55cf7f3a8e0eaacba0f735c19768ee26f8f0ea65f27220264` |
| 33 · History · Saved evaluation 3 (read only) | [PPO-CPQ-Figma-33-Saved-Evaluation-3-r01.png](PPO-CPQ-Figma-33-Saved-Evaluation-3-r01.png) | 1440 × 960 | 194,651 | `ad30796c2b6aa110ed731527e3aa8e69d5882dc1f51f0afe5994ad6c1816a8f2` |
| 34 · History · Compare with release R5: unknown cost and cable conflict | [PPO-CPQ-Figma-34-Compare-with-Release-R5-r01.png](PPO-CPQ-Figma-34-Compare-with-Release-R5-r01.png) | 1440 × 960 | 145,154 | `4ea44129516133badd70cf474aeb337f8faf112578d8761d461128421485db59` |
| 35 · History · Why this line? Equal-priority cable rule conflict | [PPO-CPQ-Figma-35-Why-This-Line-Equal-Priority-Conflict-r01.png](PPO-CPQ-Figma-35-Why-This-Line-Equal-Priority-Conflict-r01.png) | 1440 × 960 | 249,749 | `fc64352d2acf55141099fe3965ef62a09481fe6ac74cf25f03d764b39cd755cb` |
| 36 · History · Blockers resolved, evaluation 6 | [PPO-CPQ-Figma-36-Blockers-Resolved-Evaluation-6-r01.png](PPO-CPQ-Figma-36-Blockers-Resolved-Evaluation-6-r01.png) | 1440 × 960 | 157,061 | `96862c1e8b9af97950dc85a556577283e93bf95d4986c15351a35b246930577c` |
| 37 · History · Propose successor estimate v06 (dialog) | [PPO-CPQ-Figma-37-Propose-Successor-v06-r01.png](PPO-CPQ-Figma-37-Propose-Successor-v06-r01.png) | 1440 × 960 | 262,942 | `734b43f83671ec4058b5b13a370128a23f14086c8aa4ec7a3764ba8900999929` |
| 38 · Tablet 1024 · Configure, rail and outline collapsed | [PPO-CPQ-Figma-38-Tablet-Configure-r01.png](PPO-CPQ-Figma-38-Tablet-Configure-r01.png) | 1024 × 768 | 93,170 | `60a82d079b71a180141eeb66eb65c9d73049bf7cdfbc39abc64ecf8d73d6c790` |
| 39 · Tablet 1024 · Rule editor, quick test in the Test bench tab | [PPO-CPQ-Figma-39-Tablet-Rule-Editor-r01.png](PPO-CPQ-Figma-39-Tablet-Rule-Editor-r01.png) | 1024 × 768 | 106,575 | `ecbcbbd02bdbc0e3f0ac98cd0361321cd6377d3152af5f2bc92d2b45ab1224c2` |
| 40 · Phones (board) | [PPO-CPQ-Figma-40-Phones-r01.png](PPO-CPQ-Figma-40-Phones-r01.png) | 2948 × 918 | 363,848 | `e2e4d84ded19a0bfeeefc1d56ae3e9bb116c65d3b7f53848b8beeb1001eda0fd` |
| 41 · Exceptional and recovery states (board) | [PPO-CPQ-Figma-41-Exceptional-States-r01.png](PPO-CPQ-Figma-41-Exceptional-States-r01.png) | 2160 × 1987 | 473,025 | `4f0224aceb2e38da91e70951155cfcc3a952a4d6ba5a2cc3e2b6feafeb5d190b` |
| 42 · Components A (board) | [PPO-CPQ-Figma-42-Components-A-r01.png](PPO-CPQ-Figma-42-Components-A-r01.png) | 1564 × 3023 | 318,010 | `9738f99bd18270d25f073e09344765af07f92bc8282e248df515e24976660cca` |
| 43 · Components B (board) | [PPO-CPQ-Figma-43-Components-B-r01.png](PPO-CPQ-Figma-43-Components-B-r01.png) | 1284 × 3374 | 326,301 | `46fb3e2af69dc0e902da22b8d1a25226bbe763c662b0dabe41d3a34de5c1d933` |
| 44 · Why this line? panel, five views (board) | [PPO-CPQ-Figma-44-Why-This-Line-Panel-Views-r01.png](PPO-CPQ-Figma-44-Why-This-Line-Panel-Views-r01.png) | 2264 × 2180 | 446,338 | `2b9f6e957a22a405a34cb5192a006fc7d418065c5ef9f80f0eba36c56d6f25ad` |

Image 40 shows, left to right: Configure with the solution outline as a picker; Materials & labour as list rows; "Why this line?" as a full-screen panel; Adjust quantity as a bottom sheet; Materials & labour at 320 px; the rule editor Conditions tab with stacked conditions; and the rule Test tab with one scenario and Run all.

Image 41 shows S1 Missing requirement, S2 Invalid combination, S3 Missing or expired price, S4 Calculation pending, S5 Calculation failed or limit reached, S6 Source changed elsewhere, S7 Concurrent edit, S8 Save outcome uncertain, S9 Override needs review, S10 Permission changed, S11 Empty, S12 Read only, S13 Orphaned adjustment, S14 Rule draft saving states and S15 Formula problems.

Image 42 shows the components State, Fact token, KV row, Button (unavailable), Control, Context header, Outline item, Option tile, Condition row, Group header, Action card header, Test result row, Change row and Quantity basis. Image 43 shows BOM header, BOM row, BOM group row, Compare header, Compare row, Waterfall row, Action bar and Configuration summary. Component text properties share one default across variants, so these boards show default text; the screens set their own. Image 44 shows the "Why this line?" panel's Expanded, Restricted, Historical, Needs review and Compact views.

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design" in Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | "CPQ — Configure & price and Rules studio, accepted", to be saved by Dean. Until he confirms it is saved, this record cites the accepted pages and node IDs below |
| Accepted pages | "CPQ · 1 Read me, sources & decisions (accepted)" `464:2`, "CPQ · 2 Foundations & components (accepted)" `464:3`, "CPQ · 3 Rules studio (accepted)" `464:4`, "CPQ · 4 Configure & price (accepted)" `464:5`, "CPQ · 5 Compare, history & overrides (accepted)" `464:6` and "CPQ · 6 Responsive & states (accepted)" `464:7` |
| Accepted frames | <ul><li>Rules studio `464:4`: registry `485:301`, rule editor Definition `486:641`, text-fact change `488:1029`, test run 1 `489:1398`, formula editor `490:1678`, test run 2 `491:2121`, changes vs v7 `491:2594`, create version 8 `492:2572`, release R6 `492:2722`, decision table `493:3027`, fact dictionary `493:3444`, product structure `496:3355`, rule history v6 `496:3786`, action forms `497:3789` (images 01–14)</li><li>Configure & price `464:5`: register `483:3760`, Configure Greenhouse 2 `476:338`, shared capacity conflict `478:666`, solution overview `478:1174`, Materials & labour `480:1244`, Why this line? `480:1903`, Pricing `481:2485`, compare with evaluation 2 `481:2966`, Use in estimate `482:3079`, used in estimate v05 `482:3549` (images 15–24); annotations `482:4012` (receiving state) and `517:17102` (entry points) are not captured</li><li>Compare, history & overrides `464:6`: `499:2`, `499:724`, `499:1438`, `500:1801`, `500:2288`, `501:2917`, `501:3053`, `502:4198`, `502:4663`, `503:5004`, `503:5532`, `504:5781`, `504:6182` (images 25–37)</li><li>Responsive & states `464:7`: tablets `505:2`, `505:627`; phones `506:678`, `506:784`, `507:753`, `507:1041`, `507:1200`, `508:1123`, `508:1281`; states board `509:1235`</li><li>Components `464:3`: the 23 "CPQ / …" components (images 42–44), including "CPQ / Why this line panel" `473:1055`</li></ul> |
| Capture copies | Page "Captures (icon-free)", from y = 70,000: `522:60747`, `522:61268`, `522:61906`, `522:62553`, `522:63011`, `522:63806`, `522:64188`, `522:64520`, `522:64967`, `522:65104`, `522:65301`, `522:65474`, `522:65638`, `522:65726`, `522:65793`, `522:65906`, `522:68066`, `522:68156`, `522:68257`, `522:68323`, `522:68388`, `522:68532`, `522:68598`, `522:68748`, `522:72382`, `522:72470`, `522:72565`, `522:72634`, `522:72745`, `522:72816`, `522:72904`, `522:72973`, `522:77974`, `522:78044`, `522:78108`, `522:78222`, `522:78289`, `522:78395`, `522:78504`, `523:74885`, `523:75994`, `523:76518`, `523:77404`, `523:78102` (images 01–44 in order) |
