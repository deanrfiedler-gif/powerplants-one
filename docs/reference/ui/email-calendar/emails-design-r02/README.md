---
document_id: PPO-EC01-EMAILS-FIGMA-R02
revision: r02
date: 2026-10-19
owner: Dean Fiedler
status: Retained owner-accepted design reference for Amendment A1 (sent email tracking), accepted 19 October 2026; icon-free; not an application capture or UI baseline
source_commit: 70450f2eaa1166ed575736beb10cd5b335a8a4fd
---

# Emails design r02 — Amendment A1 captures

These five images retain Amendment A1 to the Emails design (EC-01): sent email tracking. On 19 October 2026, while the accepted design was being locked in, Dean asked for it: "A feature that we do need to include in the Emails module is the ability to track sent emails so we can see when the customer (or receiver) has open and also when they have viewed the email. Pipedrive does this." Claude drew it as A1, and Dean accepted it the same day: "I accept amendment A1, sent email tracking, with your recommendations, including A1-D1–D6 and A1-Q1–Q4." The decision, the rules and the answers are in section 8 of [the design decision](../../../../decisions/emails-figma-design.md). The accepted design's captures in [Emails design r01](../emails-design-r01/README.md) stay unchanged. A1 adds frames and leaves the r01 frames as they were. Retain these bytes unchanged; a later revision receives a new folder.

Each image is one Figma frame exported at scale 1 at its exact frame size. Every Font Awesome icon, including the tracking eye, was replaced by a plain placeholder square before export, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The tracking states therefore show in these images by their words, which the design always shows with the eye. The Powerplants logo is the company's own. The people, addresses (`*.example`), organisations, records and tracking events are synthetic fixtures. The images are design compositions, not captures of the application. Tracking depends on sending from PPO (Q1), which is not approved, so none of this is built.

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| A1-01 · Desktop · Sent items with tracking on every row, details for Jamie’s reply to Dana Brooks | [PPO-Emails-A1-01-Desktop-Sent-Items-Tracking-r02.png](PPO-Emails-A1-01-Desktop-Sent-Items-Tracking-r02.png) | 1440 × 900 | 247,547 | `057d83f90990d989e0e7f6df1abe795ce688d91acac6dd220bb076a105998344` |
| A1-02 · Desktop · reply composer with “Track opens and link views” on (depends on Q1) | [PPO-Emails-A1-02-Desktop-Composer-Tracking-Switch-r02.png](PPO-Emails-A1-02-Desktop-Composer-Tracking-Switch-r02.png) | 1440 × 900 | 209,255 | `686784886b3842fd3b1d85d5248532fac1e2f1e3961b5e83c4a4896ac52be2e1` |
| A1-03 · Phone 390 · Sent items with tracking | [PPO-Emails-A1-03-Phone-Sent-Items-Tracking-r02.png](PPO-Emails-A1-03-Phone-Sent-Items-Tracking-r02.png) | 390 × 844 | 61,973 | `b493b786b55c0fb4ae7faa65756aed11f57219e4fdd0ff2cb5b8967c74fc4328` |
| A1-04 · Phone 390 · Email tracking sheet | [PPO-Emails-A1-04-Phone-Tracking-Sheet-r02.png](PPO-Emails-A1-04-Phone-Tracking-Sheet-r02.png) | 390 × 844 | 64,067 | `c79fdaac8fc18097db42bafd4c3a8c0decc7609d38524247fbea42c8e2da4776` |
| A1-05 · Tracking states and what they mean | [PPO-Emails-A1-05-Tracking-States-r02.png](PPO-Emails-A1-05-Tracking-States-r02.png) | 640 × 414 | 50,514 | `b7c5375c058e8a0c6f1ef029c65bfc4b6117e659783f21e54a91acd8c1a1d2eb` |

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design", private to Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | "Emails — sent email tracking amendment A1" waits for Dean's explicit yes |
| Accepted frames | Page "Emails · EC-01" `1499:392390`, section "A1 · Sent email tracking" `1543:7805`, in image order: `1543:7806`, `1544:5345`, `1544:5828`, `1544:6128`, `1546:5890` |
| Capture copies | Page "Captures (icon-free)", at y = 272,000, in order: `1546:416366`, `1546:416529`, `1546:416688`, `1546:416714`, `1546:416771` |

The capture copies are duplicates of the accepted frames with two changes:
- Navigation links were removed. The shell components keep their own hover and toggle behaviour.
- Each of the 181 Font Awesome icon instances was swapped for `Icon/placeholder` at its original size.

Three scans were run on the copies:
- After the swap, a scan found no Font Awesome instance and no visible vector outside a placeholder or the logo.
- A scan of 355 visible texts found none whose stored colour differed from its bound variable.
- No copy carries a navigation link.

The captures were exported with the Figma connector at scale 1 and downloaded directly into this folder.
