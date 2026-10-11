---
document_id: PPO-CRM-LEADS-DESIGN-R01
revision: r01
date: 2026-10-11
owner: Dean Fiedler
status: Retained owner-accepted design reference; icon-free; not an application capture or UI baseline
source_commit: 40ac5a01439d37a09fcba5a031afa4efab30711d
---

# Leads design r01 — retained captures

These five images retain the Leads design (`/sales/leads`) that Dean accepted on 11 October 2026. The decisions, conformance declaration, departures and open questions are in [the design decision](../../../../decisions/leads-design.md). Retain these bytes unchanged; a revised design receives a new revision folder.

How the images were made:
- Each image is one Figma frame, exported at scale 1 at its exact frame size.
- Every Font Awesome icon in the frame was replaced by a plain placeholder square before export, as [ADR-0053](../../../../decisions/ADR-0053-figma-page-design.md) requires, so no Pro artwork is in this repository. The Powerplants logo is the company's own.
- Figures, names and references are synthetic fixtures.

The images are design compositions, not captures of the application, whose `/sales/leads` page still shows icon tabs and the earlier list.

## Images

| State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---:|---|
| 01 · Desktop · register (Inbox) | [PPO-Leads-01-Desktop-Register-r01.png](PPO-Leads-01-Desktop-Register-r01.png) | 1440 × 900 | 128,939 | `df85b3f18165e6424f23fba88336dceab67be6532b1708244e58635198590166` |
| 02 · Desktop · record window open | [PPO-Leads-02-Desktop-Record-Window-r01.png](PPO-Leads-02-Desktop-Record-Window-r01.png) | 1440 × 900 | 186,100 | `f05cbd3d06fe78390588714d711432c4fc283797181bd05e2095022499b85f91` |
| 03 · Desktop · two rows selected, small panel | [PPO-Leads-03-Desktop-Selection-Small-Panel-r01.png](PPO-Leads-03-Desktop-Selection-Small-Panel-r01.png) | 1440 × 900 | 172,227 | `a8442efc5f8f5ef4080d33dea32870b9588b0042659e9530453daacd8bbdf37d` |
| 04 · Phone · lead list | [PPO-Leads-04-Phone-Lead-List-r01.png](PPO-Leads-04-Phone-Lead-List-r01.png) | 390 × 844 | 78,174 | `3df5b6ebd0ead824de3622fb6852f8cebb37ba6302eb9055a5b0885ad97efbbc` |
| 05 · Phone · record view open | [PPO-Leads-05-Phone-Record-View-r01.png](PPO-Leads-05-Phone-Record-View-r01.png) | 390 × 844 | 57,080 | `a6a1deb9ed0e683433bdce20626ae660e241dacc0135c18db2fab1ad4aa01363` |

The More slide-out and the collapsed rail and secondary menu are not captured again. They are shell behaviour identical to captures 04 and 05 of the [Reviews & approvals design](../../estimating/reviews-approvals-design-r01/README.md), and they work in the Leads prototype. On Leads, the More slide-out lists Sales as the current workspace and offers Home, My Work and Reviews & handovers under My workspace, as `menuGroups` in `src/shell/navigation.ts` does for Sales.

## Source identity

| Item | Identity |
|---|---|
| Figma file | "PPO - Design", private to Dean's Figma team. Its link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Named version | "Leads — Pipedrive pattern, accepted", in the file's version history |
| Accepted frames | Page "Leads (accepted)": desktop `190:20513`, desktop with two rows selected `190:21123`, phone `190:21774` |
| Capture copies | Page "Captures (icon-free)": `203:25649`, `203:26747`, `203:27825`, `203:28971`, `203:29337` (images 01–05 in order) |

The capture copies are duplicates of the accepted frames with two changes only:
- Each Font Awesome icon instance was swapped for `Icon/placeholder`: 172, 172, 182, 45 and 45 instances in images 01–05.
- The record window was made visible for the state shown (images 02 and 05).

A check after the swap found no Font Awesome instance left in any copy. The copies were made after Dean's decision and before the named version was saved, and the accepted page was not changed afterwards. Each copy was exported with the Figma connector and downloaded directly to this folder.
