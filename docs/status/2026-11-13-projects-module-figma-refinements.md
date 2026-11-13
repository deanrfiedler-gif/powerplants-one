---
title: Projects module Figma file refinements and audit batch 2
date: 2026-11-13
---

At Dean's request the Projects module Figma file was refined in place on 12 and 13 November 2026, and section 9 of the [proposal record](../decisions/projects-module-refined-ui-proposal.md) records what changed.
- **Today marker.** On all 27 Gantt charts it now follows PPO - Library's decision G6, through local copies of the Library parts and its Gantt colour variables.
- **Gantt charts.** They were brought to the Library's anatomy and to a benchmark of leading tools. Every element is centred on its row line. The charts use Library diamonds, baseline pills and dependency colours, with labels beside the bars. Duplicated variance chips and weekend stripes at compressed zoom are hidden. Parent rows show as phase brackets, and a Week, Month and Fit switch sits beside Today.
- **Visual polish.** Avatar initials replace full names, and overflowing text, strips and panels are fixed across the file.
- **Batch 2.** The audit's decision-free batch covers weekdays, later-frame labels, Favourites and worklist counts, 16 px phone inputs, 48 px phone targets with a sticky action bar on PH07, an 11 px text minimum, reference forms and wording.

Section 8 of the [alignment audit](../decisions/projects-module-figma-alignment-audit.md) records which findings are now fixed and which wait on Dean.

Checked: a read-only sweep of all 248 frames after the changes found no text cut by a clipping container, no toolbar overflow, no crowded scale, no overlapping or off-centre Gantt label, no wrong weekday and no phone input under 16 px. `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py` pass. Not done: the decisions AQ-1 to AQ-6 and four Gantt points stay open for Dean, and a new named version is Dean's to save. No application code, route, migration, permission, design register or other record is changed, and all 78 parent requirement IDs remain. Every record, person, value and date in the file is synthetic.

<!-- decision-index -->
[Projects module refined UI proposal](../decisions/projects-module-refined-ui-proposal.md) (PPO-PROJECTS-REFINED-FIGMA-PROP) now records the refinements of 12 and 13 November 2026: the Library Today marker, a Gantt anatomy aligned to the Library and a benchmark of leading tools, a file-wide visual polish and the audit's batch 2. It remains a **proposal**: no design is accepted, and no application code, route, migration, permission or deployment is authorised; all data is synthetic.
