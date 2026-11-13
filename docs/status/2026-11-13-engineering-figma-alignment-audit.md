---
title: Engineering module Figma alignment audit
date: 2026-11-13
---

Dean asked for an audit of the Engineering module's Figma page set, so that the file can be aligned with the accepted shell, the shared addenda, its own recorded rules and the other module files before it is accepted or built. The audit was read-only in Figma: no file was edited, moved, renamed, commented on or versioned. The [audit record](../decisions/engineering-figma-alignment-audit.md) (PPO-ENGINEERING-FIGMA-ALIGNMENT-AUDIT) holds:

- the method and the alignment matrix;
- 34 findings: 11 Major, 17 Minor and 6 Polish, none a Blocker because the file is a proposal;
- the facts that differ across files;
- eight questions for Dean;
- as Appendix A, a paste-ready alignment batch for the next Engineering build session.

The Majors are:

- the October T06 check counted in Q3 on Insights;
- test instruments that differ in kind and validity from the Equipment register;
- the CP-4 as-built handover "not requested" here but received in the Service and Equipment files;
- Supply reading materials r04 as released where Engineering issued R3;
- a survey reference in a family that does not exist;
- the unresolved SYN-OPP-000301;
- gendered pronouns;
- the toolbar copy keeping the green primary Dean replaced with navy;
- Engineering versioning reference families the Settings registry owns;
- phone targets below 48 px, in this file and in the Shell's phone toolbar.

The structure is sound: every sheet sits on the template grid with a matching label, every recorded node ID resolves, and the shell is instanced with the accepted actions, tabs and menus.

Checked:

- **This file.** All 12 scope pages, 193 sheets and 12 notes cards were extracted by script and every visible text node tested. All 205 node IDs in the [Engineering record](../decisions/engineering-module-refined-ui-proposal.md) resolve to the same codes and appear in the Read me index. The separator and Scratch pages are empty.
- **The Shell.** The kit copies were compared with the accepted Shell: toolbar primaries, phone bar, icons, top bar, right rail and the Engineering menus.
- **Other files.** One sheet each was read in the Service, Customers, Sites & Equipment, Supply and Settings files for the handovers and ownership, and component names in the Library.
- **Contrast.** Five text pairs and one edge were spot-checked.
- **Repository.** No Figma link or known file key is in the repository. Repository checks: `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py`.

Not checked:

- the addenda as text (A3 was read through the records that cite it);
- the My Work, Documents and messages, Estimating, Projects and Products files;
- one-line cells beyond the file's own audit;
- any keyboard, screen-reader, zoom or device review.

No other record, no design register entry, no code, route, migration, permission or integration was changed. Every record, person, value and date is synthetic.

<!-- decision-index -->
[Engineering module Figma alignment audit](../decisions/engineering-figma-alignment-audit.md) (PPO-ENGINEERING-FIGMA-ALIGNMENT-AUDIT) records the read-only audit of the Engineering module's Figma file on 13 November 2026: 34 findings with their fix owners, the cross-file facts that differ, eight questions for Dean and the alignment batch for the next build session. It changes no design and accepts nothing.
