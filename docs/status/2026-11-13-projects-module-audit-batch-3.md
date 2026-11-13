---
title: Projects module Figma file audit batch 3
date: 2026-11-13
---

Dean accepted every recommendation of the Projects alignment audit on 13 November 2026, and the Projects module Figma file was changed in place. Section 10 of the [proposal record](../decisions/projects-module-refined-ui-proposal.md) records what changed.
- **Shell record header.** Every record page now opens with a local copy of the accepted Shell record header: 105 record sheets and four phone records. It carries the breadcrumb, the title with its state chip and star, and the sub-line, then "n of N in view", Actions, Outputs where the record has outputs and one primary. The desktop back arrow and the "…" menus are gone.
- **Workspace menus.** The Projects flyout (X33) is a local copy of the Shell's, and the collapsed docked menu is the Shell's 12 px strip.
- **Insights.** Projects no longer draws Reporting's or Finance's pages; its menu opens RP-03 and FN-03.
- **People and labels.** Sam Jordan replaces Kim Patel, and sheet labels name the signed-in person when it is not Morgan Lee.
- **Drawers.** Widths count the shell's tab column.
- **Gantt.** Record schedules use Comfortable 26 px bars, and every at-risk or conflict bar carries the attention icon.
- **Cross-file references.** SYN-OPP-000338 and SYN-QUO-000170 r01.

Section 9 of the [alignment audit](../decisions/projects-module-figma-alignment-audit.md) records each finding's status.

Checked: a read-only sweep of all 229 sheets after the changes found no clipped or overlapping text, no Gantt label collision, no header overflow, no Kim Patel or Insights sheet reference, and no desktop back arrow or "…" menu in any header. `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py` pass. Not done: renaming the file (AQ-6) and saving the next named version are Dean's; the Library rule G2 amendment, its Dependency part and its publication are the Library owner's. No application code, route, migration, permission, design register or other record is changed, and all 78 parent requirement IDs remain. Every record, person, value and date in the file is synthetic.

<!-- decision-index -->
[Projects module refined UI proposal](../decisions/projects-module-refined-ui-proposal.md) (PPO-PROJECTS-REFINED-FIGMA-PROP) now records audit batch 3 of 13 November 2026: the Shell record header on every record page, the Shell's flyout and collapsed strip, Insights pages removed in favour of links, Sam Jordan for Kim Patel, drawer widths with the tab column and the Gantt density and attention rules. It remains a **proposal**: no design is accepted, and no application code, route, migration, permission or deployment is authorised; all data is synthetic.
