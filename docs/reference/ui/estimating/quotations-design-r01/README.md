---
document_id: PPO-EST-QUOTATIONS-DESIGN-R01
revision: r01
date: 2026-10-11
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: 453cc6bd4112b435b18278e5eb7154fc68d0ea17
---

# Quotations design r01 — retained captures

These five images retain the Quotations register design that Dean accepted on 11 October 2026. The decisions, conformance declaration, stage rules, departures and open questions are in [the design decision](../../../../decisions/quotations-design.md). Retain these bytes unchanged; a revised design receives a new revision folder.

Each image is one Figma frame, exported at scale 1 at its exact frame size. Every Font Awesome icon in the frame was replaced by a plain placeholder square before export, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The Powerplants logo is the company's own. Figures, names and references are synthetic fixtures. The images are design compositions, not captures of the application, whose `/estimating/quotes` page is still a plain list.

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · register | [PPO-Quotations-01-Desktop-Register-r01.png](PPO-Quotations-01-Desktop-Register-r01.png) | 1440 × 900 | 154,930 | `d8c26975fcd06018062978dd3f2e1286d272d895e619114095a9c003caccbe68` |
| 02 · Desktop · record window open | [PPO-Quotations-02-Desktop-Record-Window-r01.png](PPO-Quotations-02-Desktop-Record-Window-r01.png) | 1440 × 900 | 202,982 | `0902bea4f58dbda617265d1a4f199566efe51426d2fb709d99b93f63ce0f6f53` |
| 03 · Desktop · two rows selected, small panel | [PPO-Quotations-03-Desktop-Selection-Small-Panel-r01.png](PPO-Quotations-03-Desktop-Selection-Small-Panel-r01.png) | 1440 × 900 | 197,983 | `e26a37cfe4dd921d76f0c555f6e1b2dc3a1add0eaeb84ace5e659b0011da17ec` |
| 04 · Phone · quotation list | [PPO-Quotations-04-Phone-Quotation-List-r01.png](PPO-Quotations-04-Phone-Quotation-List-r01.png) | 390 × 844 | 76,822 | `bf2c238623da24102c38dcd1ad738b943a59315466a208d4b348852c3b003d24` |
| 05 · Phone · record view open | [PPO-Quotations-05-Phone-Record-View-r01.png](PPO-Quotations-05-Phone-Record-View-r01.png) | 390 × 844 | 65,705 | `8630f41b35a5045c1017f99de5facf8df7d4e5f6e454f41a1cf56f1c2fdc7ef3` |

The More slide-out and the collapsed rail and secondary menu are not captured again. They are shell behaviour identical to captures 04 and 05 of the [Reviews & approvals design](../reviews-approvals-design-r01/README.md), and they work in the Quotations prototype.

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design", private to Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | "Quotations — Pipedrive pattern, accepted", saved by Dean on 11 October 2026 |
| Accepted frames | Page "Quotations (accepted)": desktop `123:41`, desktop with two rows selected `123:220`, phone `123:428` |
| Capture copies | Page "Captures (icon-free)": `142:12994`, `142:14201`, `142:15408`, `139:12064`, `139:12480` (images 01–05 in order) |

The capture copies are duplicates of the accepted frames with two changes only: each Font Awesome icon instance was swapped for `Icon/placeholder`, and the prototype switch was set for the state shown (record window in 02, phone record view in 05). A check after the swap found no Font Awesome instance left in any copy. Copies 01–03 were remade after a Returned view was added to the secondary menu. Copies 04 and 05 were not remade: the only later change to the phone frame swapped one icon, which the placeholder replaces. Each copy was exported with the Figma connector and downloaded directly to this folder.
