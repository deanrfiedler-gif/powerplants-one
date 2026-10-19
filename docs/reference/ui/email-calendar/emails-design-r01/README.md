---
document_id: PPO-EC01-EMAILS-FIGMA-R01
revision: r01
date: 2026-10-19
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: 70450f2eaa1166ed575736beb10cd5b335a8a4fd
---

# Emails design r01 — retained captures

These 22 images retain the Emails design (EC-01) that Dean accepted on 19 October 2026. They cover two routes:
- `/email`: the mailbox at desktop 1440 × 900, tablet 1024 and phone 390 and 320, with Sent items, the phone folder and filter sheets, and the reconnect, no-match, not-business and first-import states;
- `/email/[id]`: the thread with its Linked to card, the not-linked suggestions, the link panel and phone link sheet, the reply composer as a proposal, a link that was not confirmed, and the Share dialog with a deal record's Email section.

The decisions, conformance declaration and departures are in [the design decision](../../../../decisions/emails-figma-design.md). Retain these bytes unchanged; a revised design receives a new revision folder.

Each image is one Figma frame exported at scale 1 at its exact frame size. Image 21 is a frame holding copies of the Share dialog and the deal record's Email section; image 22 holds copies of three phone state frames.

Every Font Awesome icon was replaced by a plain placeholder square before export, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The Powerplants logo is the company's own. The people, addresses (`*.example`), organisations and records are synthetic fixtures. The images are design compositions, not captures of the application. Image 04 shows the reply composer, which stays a proposal: sending is not approved (Q1 in the decision).

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · Inbox, Dana Brooks thread linked to a deal | [PPO-Emails-01-Desktop-Inbox-Linked-Thread-r01.png](PPO-Emails-01-Desktop-Inbox-Linked-Thread-r01.png) | 1440 × 900 | 219,197 | `77e3f2eeedb7e65cf68204bcdb767642502842d295fa83229aed902faadb109e` |
| 02 · Desktop · Priya Shah email not linked, suggested records with one ticked | [PPO-Emails-02-Desktop-Not-Linked-Suggestions-r01.png](PPO-Emails-02-Desktop-Not-Linked-Suggestions-r01.png) | 1440 × 900 | 219,354 | `c9860e51f205fc3b4eef6663830e08403e5a468d064b2987b9301cde62198d79` |
| 03 · Desktop · Link to records panel, search “Hillview”, two records ticked | [PPO-Emails-03-Desktop-Link-Panel-r01.png](PPO-Emails-03-Desktop-Link-Panel-r01.png) | 1440 × 900 | 278,152 | `2345c6ca34123657ad6acdaef5d98784490681fea68a51f0754fb8139e4095ba` |
| 04 · Desktop · reply composer (proposal, Q1) | [PPO-Emails-04-Desktop-Reply-Composer-Proposal-r01.png](PPO-Emails-04-Desktop-Reply-Composer-Proposal-r01.png) | 1440 × 900 | 204,431 | `3fb8065e153c05f0a9476d739a179ddc8a0eefe7bb425a99714b25e362e7a11e` |
| 05 · Desktop · Sent items, Jamie’s reply to Dana Brooks | [PPO-Emails-05-Desktop-Sent-Items-r01.png](PPO-Emails-05-Desktop-Sent-Items-r01.png) | 1440 × 900 | 187,823 | `339fb3b91c1163389c87b6c8e63fa659fa33b650bf77f0dc26e9d210b26afac7` |
| 06 · Tablet 1024 · Inbox, rail and side menu collapsed | [PPO-Emails-06-Tablet-Inbox-r01.png](PPO-Emails-06-Tablet-Inbox-r01.png) | 1024 × 900 | 167,704 | `264b23a437c991b6ed62db7c07a6d57797df90a1b29c9d827c9b963e7fa7bd1a` |
| 07 · Tablet 1024 · Link to records panel over Priya Shah email | [PPO-Emails-07-Tablet-Link-Panel-r01.png](PPO-Emails-07-Tablet-Link-Panel-r01.png) | 1024 × 900 | 222,790 | `243da538662f54273a141fa9e8abab6ad575fe9956d50160ef438fa7e5124df1` |
| 08 · Phone 390 · Inbox list, slim Email header | [PPO-Emails-08-Phone-Inbox-r01.png](PPO-Emails-08-Phone-Inbox-r01.png) | 390 × 844 | 74,415 | `0b3286173145f2903830bf489f004091eb316007f62a54d9c5e904896c054fcc` |
| 09 · Phone 320 · Inbox list | [PPO-Emails-09-Phone-320-Inbox-r01.png](PPO-Emails-09-Phone-320-Inbox-r01.png) | 320 × 844 | 68,349 | `e262b84bfbb69fe5895fbbf4b33612c2006c7976cf5dd76fe049c142d70560d4` |
| 10 · Phone 390 · Choose folder sheet | [PPO-Emails-10-Phone-Folder-Sheet-r01.png](PPO-Emails-10-Phone-Folder-Sheet-r01.png) | 390 × 844 | 52,525 | `8886e0512e00f124b4f68b56477de27e1af2e8c88ea613e5b07ed1919363255d` |
| 11 · Phone 390 · Filter sheet, linked to deals with attachments | [PPO-Emails-11-Phone-Filter-Sheet-r01.png](PPO-Emails-11-Phone-Filter-Sheet-r01.png) | 390 × 844 | 36,350 | `7b1c4fb57ff40f0061c2e93c9b90c11203f5333a56c61df5306d8c54046452c6` |
| 12 · Phone 390 · Thread, Dana Brooks, linked to a deal | [PPO-Emails-12-Phone-Thread-r01.png](PPO-Emails-12-Phone-Thread-r01.png) | 390 × 844 | 62,868 | `cbc2f68b436fa02df3adad8f27eb0b6d2175dac717a85050359d00b2250e7f98` |
| 13 · Phone 320 · Thread, Dana Brooks | [PPO-Emails-13-Phone-320-Thread-r01.png](PPO-Emails-13-Phone-320-Thread-r01.png) | 320 × 844 | 60,809 | `b0748ee9b0ed9ea7fac373d34e1c6d83df421620da0ab270190ed5a1d7524d46` |
| 14 · Phone 390 · Link sheet over Priya Shah email, one suggestion ticked | [PPO-Emails-14-Phone-Link-Sheet-r01.png](PPO-Emails-14-Phone-Link-Sheet-r01.png) | 390 × 844 | 61,085 | `5512871e2948afbeb682b7ac1c237b0d84ecef3d28249c2aa867d74b8178bbf4` |
| 15 · Phone 390 · Link sheet, search “Hillview”, two ticked | [PPO-Emails-15-Phone-Link-Sheet-Search-r01.png](PPO-Emails-15-Phone-Link-Sheet-Search-r01.png) | 390 × 844 | 56,965 | `8d7d84957fb5d4679de249a3bc093f92f1297cbbf51b172fcf16084df93d3693` |
| 16 · Desktop · State: reconnect required, email hidden | [PPO-Emails-16-Desktop-Reconnect-Required-r01.png](PPO-Emails-16-Desktop-Reconnect-Required-r01.png) | 1440 × 900 | 86,917 | `c7c46aa6d147c38e683ea20de5fc49ea2f44692df712e8af5d0ca7c2856d5cd4` |
| 17 · Desktop · State: no email matches the search | [PPO-Emails-17-Desktop-No-Matches-r01.png](PPO-Emails-17-Desktop-No-Matches-r01.png) | 1440 × 900 | 98,925 | `d995e17060e95dc4899c67a037ce93457bc69b551120cf894a17dc31f86cdce6` |
| 18 · Desktop · State: newsletter marked not business | [PPO-Emails-18-Desktop-Not-Business-r01.png](PPO-Emails-18-Desktop-Not-Business-r01.png) | 1440 × 900 | 179,869 | `c53470ec8ff59f36fe5c177c70d1293df9dd9f37674ffa3de37884c9e38ac95a` |
| 19 · Desktop · State: first import in progress | [PPO-Emails-19-Desktop-First-Import-r01.png](PPO-Emails-19-Desktop-First-Import-r01.png) | 1440 × 900 | 221,669 | `648931011a7eda854e513c97f888a46a8c6335375d7767970b0d972272bc9b93` |
| 20 · Desktop · State: link not confirmed, nothing changed | [PPO-Emails-20-Desktop-Link-Not-Confirmed-r01.png](PPO-Emails-20-Desktop-Link-Not-Confirmed-r01.png) | 1440 × 900 | 224,572 | `5cd262a5bfc08c44d075460037128bd531d03d9fe2c8e92cc5630d03845e7761` |
| 21 · Desktop · Share dialog and a deal record’s Email section | [PPO-Emails-21-Desktop-Share-And-Record-Section-r01.png](PPO-Emails-21-Desktop-Share-And-Record-Section-r01.png) | 2014 × 599 | 131,868 | `5216f575a055525069adacaa2f04bbed09e8109c1d200e96ff09ddc0e648e028` |
| 22 · Phone 390 · three states | [PPO-Emails-22-Phone-States-r01.png](PPO-Emails-22-Phone-States-r01.png) | 1410 × 964 | 115,425 | `09ebd4dd044fc5a9396cdbc43e572b1b5d6719a9c6cf3e3ae1363296bc56f513` |

Image 21 holds, left to right: the Share dialog, then the deal record's Email section as seen by the person who linked the emails and by a colleague who can read the deal.

Image 22 holds, left to right:
1. reconnect required;
2. search open with no matches;
3. first import in progress.

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design", private to Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | "Emails — accepted" waits for Dean's explicit yes |
| Accepted frames | Page "Emails · EC-01" `1499:392390`, in image order:<br>• `1502:91`, `1506:457`, `1507:788`, `1508:1222`, `1525:403768`;<br>• `1509:394014`, `1525:404343`;<br>• `1509:394623`, `1513:400714`, `1513:401853`, `1513:401924`, `1509:395121`, `1525:7819`, `1509:395314`, `1525:403554`;<br>• `1509:396707`, `1509:397179`, `1511:2492`, `1516:403478`, `1516:403770`;<br>• `1511:2966` and `1511:3028`;<br>• the phone states: `1525:402948`, `1525:403134`, `1525:403323` |
| Capture copies | Page "Captures (icon-free)", from y = 270,000, images in order: `1532:192557`, `1532:192697`, `1532:192838`, `1532:193017`, `1532:193171`, `1532:193304`, `1532:193420`, `1532:193575`, `1532:193604`, `1532:193633`, `1532:193697`, `1532:193784`, `1532:193825`, `1532:193864`, `1532:193921`, `1532:193988`, `1532:194057`, `1532:194144`, `1532:194269`, `1532:194413`, `1532:194555`, `1532:194630` |

The capture copies are duplicates of the accepted frames with two changes:
- Navigation links were removed, and the two flow starting points the copies brought were removed from the Captures page. The shell components keep their own hover and toggle behaviour.
- Each of the 921 Font Awesome icon instances, including those nested in shared components, was swapped for `Icon/placeholder` at its original size. The copies hold 933 visible placeholders and 12 logos.

Three scans were run on the copies:
- After the swap, a scan found no Font Awesome instance and no visible vector outside a placeholder or the logo.
- A scan of 1,837 visible texts found none whose stored colour differed from its bound variable.
- No copy carries a navigation link.

The captures were exported with the Figma connector at scale 1 and downloaded directly into this folder.
