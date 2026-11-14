---
title: Dean decides six questions shared by every module Figma audit
date: 2026-11-14
---

On 14 November 2026 Dean decided six questions that each per-file Figma audit would otherwise raise again: "Regarding the six questions, I am happy to proceed based on all your recommendations." They are recorded as section S11 of the [cross-file Figma alignment audit](../decisions/figma-cross-file-alignment-audit.md) (PPO-FIGMA-ALIGNMENT-AUDIT), which Dean decided (AC-29) should stay one record, amended in place.

- **AC-24.** Settings is the current rail item on every module's Administration sheets.
- **AC-26.** One table of state words and chip tones, published with the Library's Controls record.
- **AC-27.** Registers and timelines may leave out the year for dates in the story year. Headers, documents, outputs and customer-facing sheets show it.
- **AC-17.** Each sheet label names the sheet code and the signed-in person, and keeps its source citation. A sheet with no signed-in user says so.
- **AC-04.** Settled by owner decisions that already exist: touch targets of at least 44 px, main phone actions as full-width 48 px buttons, and the 56 px Service field dock.
- **PDR-19.** "excluding GST" and "including GST" in full in prose, headings, documents and customer sheets. "excl. GST" and "incl. GST" only in compact cells, chips and tiles. Never "ex GST".

The recommendations for AC-04 and PDR-19 named no value, so S11 states where each value comes from. The PDR-19 wording was proposed in this change, from the Products file's accepted usage and PPO-STD-001 N09. The [Products review](../decisions/products-module-independent-review.md) points its PDR-19 row to S11.

Checked: the decisions were compared with the open pull requests that touch Figma records on 14 November 2026. Pull request 957 records the Shell's new named version; pull request 965 records what drawer widths measure; pull request 966 records the shared-records audit decisions. None of them conflicts with S11. Repository checks: `python3 scripts/build_status.py --check`, `python3 scripts/check_foundation.py` and `python3 scripts/check_naming.py`.

Not done: no Figma file, application code, migration, permission, design register or page guide changed. Each module file applies the decisions in its next reviewed batch, and accepted files need a new named version when they do. AC-25 and AC-28 remain open, as do the questions that need the Addendum A3 text. All 78 parent requirement IDs remain.

<!-- decision-index -->
[Cross-file Figma alignment audit](../decisions/figma-cross-file-alignment-audit.md) (PPO-FIGMA-ALIGNMENT-AUDIT), section S11, records Dean's decisions of 14 November 2026 on AC-04, AC-17, AC-24, AC-26 and AC-27 and on the Products review's PDR-19. It accepts no design and authorises no application code, route, migration, permission or deployment.
