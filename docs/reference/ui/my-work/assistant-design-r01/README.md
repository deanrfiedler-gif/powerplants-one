---
document_id: PPO-AI01-ASSISTANT-FIGMA-R01
revision: r01
date: 2026-10-24
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: 0691b661bf00ee8ce1c71d247ecf472ff93142ec
---

# Assistant design r01 — retained captures

These fifteen images retain the assistant design (`scope:AI-01`, Assistant workspace and docked/mobile conversation) that Dean accepted on 24 October 2026. They cover:
- the docked side panel on desktop at 1440, opened from the Ask Carl action in the top bar on the Hillview Growers organisation record;
- the full-width surface below 1280 px, at 1024;
- the full-screen phone view at the proposed route `/assistant`, at 390 and 320;
- fifteen panel states.

The decisions, conformance declaration and departures are in [the design decision](../../../../decisions/assistant-figma-design.md). Retain these bytes unchanged; a revised design receives a new revision folder.

Each image is one Figma frame exported at scale 1 at its exact frame size. Images 13–15 are frames holding copies of several frames side by side, 40 px apart on a grey background.

Every Font Awesome icon was replaced by a plain placeholder square before export, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The Powerplants logo is the company's own. The organisation, deals, activities, people, times, provider labels and budget are synthetic fixtures; they are not adopted operating rules and grant no authority. Carl's answers in the images are design text, not model output. The images are design compositions, not captures of the application.

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · Hillview Growers record, panel closed, Ask Carl in the top bar | [PPO-Assistant-01-Desktop-Record-Panel-Closed-r01.png](PPO-Assistant-01-Desktop-Record-Panel-Closed-r01.png) | 1440 × 900 | 214,274 | `764bd4eead7fbc52e2328ef4b2b679f66905b36d5f56d3ac659c12cd9d45ab77` |
| 02 · Desktop · Panel open, scope Hillview Growers, start | [PPO-Assistant-02-Desktop-Panel-Open-Start-r01.png](PPO-Assistant-02-Desktop-Panel-Open-Start-r01.png) | 1440 × 900 | 248,231 | `0d0c32f9fb15c2b3babb2a62cefb72acb3fc22ff7dbe027fb0863eee0e8cbe36` |
| 03 · Desktop · Opportunity search, interpretation shown | [PPO-Assistant-03-Desktop-Opportunity-Search-r01.png](PPO-Assistant-03-Desktop-Opportunity-Search-r01.png) | 1440 × 900 | 253,849 | `4e5ac1e728b3d5b72b83c46b7f48f1c7d8f2cc756d883705ff33607943786262` |
| 04 · Desktop · Customer CRM summary with source chips, evidence open, full length | [PPO-Assistant-04-Desktop-CRM-Summary-Evidence-Full-Length-r01.png](PPO-Assistant-04-Desktop-CRM-Summary-Evidence-Full-Length-r01.png) | 1440 × 1640 | 421,651 | `e2b4d3572844a924140ee0fcf405452face3598745b4f16226fffd091186f4aa` |
| 05 · Desktop · Create an opportunity: the draft is prepared, review is next | [PPO-Assistant-05-Desktop-Create-Opportunity-Draft-r01.png](PPO-Assistant-05-Desktop-Create-Opportunity-Draft-r01.png) | 1440 × 900 | 258,015 | `8dcddb46129ead1020c8cb78abcbf31033d8617551083b9227c6654ad1acb984` |
| 06 · Desktop · Hand-off: the draft review (AI-02) opens inside the panel | [PPO-Assistant-06-Desktop-Draft-Review-Hand-Off-r01.png](PPO-Assistant-06-Desktop-Draft-Review-Hand-Off-r01.png) | 1440 × 900 | 239,198 | `a9a1b5618492a7fb2a9aa0f6724ba20ffb94e3dc6d1282bb736c7a57e1c4c77e` |
| 07 · Desktop · Scope change at 15:50: the page changed, the conversation did not | [PPO-Assistant-07-Desktop-Scope-Change-r01.png](PPO-Assistant-07-Desktop-Scope-Change-r01.png) | 1440 × 900 | 238,678 | `4d19a0e66c140ca60592791d0ced67469038839f27a880e054e06325f8ae5013` |
| 08 · Desktop · Keep as a thread: choose the deal, visibility stated | [PPO-Assistant-08-Desktop-Keep-As-A-Thread-r01.png](PPO-Assistant-08-Desktop-Keep-As-A-Thread-r01.png) | 1440 × 900 | 261,622 | `6282af60bbe9a9855ea2cee42d3beaa23ef64b69124dce4bf8bbcf5e19e8a93e` |
| 09 · Desktop · Budget reached: paused until 1 November, fails closed | [PPO-Assistant-09-Desktop-Budget-Reached-r01.png](PPO-Assistant-09-Desktop-Budget-Reached-r01.png) | 1440 × 900 | 259,591 | `1030ddd0cad5282e8b942f2b2f98f4d8d980388fe58548498a99c0ca5b08d31f` |
| 10 · Desktop · Provider unavailable: not answered, try again | [PPO-Assistant-10-Desktop-Provider-Unavailable-r01.png](PPO-Assistant-10-Desktop-Provider-Unavailable-r01.png) | 1440 × 900 | 257,914 | `82722204ae7a20c2c53ebec561ac33588e7f1e392a2e88abebd04c8764cb08e4` |
| 11 · Tablet 1024 · Full-width surface: Customer CRM summary | [PPO-Assistant-11-Tablet-Full-Width-Summary-r01.png](PPO-Assistant-11-Tablet-Full-Width-Summary-r01.png) | 1024 × 768 | 90,184 | `f29eb93e83c5d906c1ac7d51d217ee2ea0d2f0b2051629647945d2f7717010e7` |
| 12 · Tablet 1024 · Full-width surface: customer search from Search PPO, simulated adapter | [PPO-Assistant-12-Tablet-Customer-Search-Simulated-r01.png](PPO-Assistant-12-Tablet-Customer-Search-Simulated-r01.png) | 1024 × 768 | 65,559 | `477d91ca9bd4acc9927f2ac540100a1141c83274d55e5c387acb62e6e86f7643` |
| 13 · Phone 390 · six frames | [PPO-Assistant-13-Phone-390-Frames-r01.png](PPO-Assistant-13-Phone-390-Frames-r01.png) | 2620 × 924 | 361,824 | `7529f355a6ba206a600f90361a08794ef376da72a3bdad0bbb7b57ea448e2002` |
| 14 · Phone 320 · four frames | [PPO-Assistant-14-Phone-320-Frames-r01.png](PPO-Assistant-14-Phone-320-Frames-r01.png) | 1480 × 924 | 216,673 | `ee3d1cc2e504a79e0052b5820e4d67686028c7509d57b6a6feac6891f2075587` |
| 15 · States · fifteen panel states | [PPO-Assistant-15-States-r01.png](PPO-Assistant-15-States-r01.png) | 1360 × 2988 | 495,187 | `1aaee25c7955526d816dae06798d89e3ab5a0e996024859bcd634c214a944a04` |

Image 13 holds, left to right:
1. the Hillview Growers record with its More menu open at Ask Carl;
2. `/assistant` full screen, start;
3. the Customer CRM summary;
4. the keyboard open with the composer above it;
5. budget reached;
6. the record that Back returns to.

Image 14 holds, left to right: `/assistant` start, the Customer CRM summary, the keyboard open, and the record that Back returns to, all at 320.

Image 15 holds, in rows of three:
1. thinking, announced politely; stopped by you; partial results, one read failed;
2. read failed, not the same as no results; zero results; source changed since the answer;
3. access changed, content discarded; panel closed while answering, cancelled; stopped at the turn limit;
4. provider states, always in words; kept as a thread; couldn't keep as a thread;
5. the More menu with Keep as a thread on request; the scope menu; switching scope with a draft, which asks first.

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design", private to Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | "Assistant — accepted", saved by Dean on 25 October 2026 ("I have saved it."). The captures were made from the accepted frames before it was saved, and the frames did not change in between |
| Accepted frames | Page "Assistant · AI-01" `2367:85`, in image order:<br>• `2369:814129`, `2369:814476`, `2370:820498`, `2370:821082`, `2371:1628`, `2371:2224`, `2371:822871`, `2374:2964`, `2375:3322`, `2375:3899`;<br>• `2378:4080`, `2378:4449`;<br>• phone 390: `2379:861166`, `2379:4401`, `2379:4458`, `2379:4658`, `2379:861397`, `2379:861292`;<br>• phone 320: `2385:5574`, `2379:861543`, `2379:861677`, `2385:5715`;<br>• states: `2379:886482`, `2379:886534`, `2379:886583`, `2379:886644`, `2379:886693`, `2379:886740`, `2379:886801`, `2379:901249`, `2379:901300`, `2379:901355`, `2379:901444`, `2386:5660`, `2379:901492`, `2379:901550`, `2386:5710` |
| Capture copies | Page "Captures (icon-free)", from y = 460,000, images in order: `2389:265318`, `2389:265464`, `2389:265635`, `2389:265804`, `2389:265981`, `2389:266167`, `2389:266348`, `2389:266545`, `2389:266751`, `2389:266918`, `2389:267081`, `2389:267237`, `2389:267400`, `2389:267692`, `2389:267874` |

The capture copies are duplicates of the accepted frames with two changes:
- The prototype reactions on 73 layers were removed, and the Captures page keeps its 115 flow starting points.
- Each of the 978 Font Awesome icon instances, including those nested in shared components, was swapped for `Icon/placeholder` at its original size.

Three scans were run on the copies:
- After the swap, a scan found no Font Awesome instance and no visible vector outside a placeholder or the logo.
- A scan of 2,184 visible texts found none whose stored colour differed from its bound variable.
- No copy carries a prototype link.

The captures were exported with the Figma connector at scale 1 and downloaded directly into this folder.
